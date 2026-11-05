// Filtro delante del webhook de WhatsApp en n8n.
// Meta manda los avisos "enviado", "entregado" y "leído" a la misma URL que los mensajes, y cada uno gasta una
// ejecución de n8n sin hacer nada útil. Acá se responden directo y solo pasan a n8n los mensajes y los avisos de
// "no entregado". El cuerpo se reenvía byte por byte para que n8n pueda validar la firma X-Hub-Signature-256.
// Al publicarla hay que desactivar "Verify JWT": Meta llama sin token de Supabase.
declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => unknown;
  env: { get: (clave: string) => string | undefined };
};

const N8N_WEBHOOK_URL = Deno.env.get('N8N_WEBHOOK_URL') || 'https://juanpmendoza.app.n8n.cloud/webhook/whatsapp';

// Solo se descarta lo que seguro es un aviso de estado sin fallas: ante cualquier duda, pasa a n8n.
function esSoloEstadoSinFallas(cuerpo: string): boolean {
  let datos: any;
  try {
    datos = JSON.parse(cuerpo);
  } catch {
    return false;
  }
  if (!Array.isArray(datos?.entry) || datos.entry.length === 0) return false;
  for (const entrada of datos.entry) {
    if (!Array.isArray(entrada?.changes) || entrada.changes.length === 0) return false;
    for (const cambio of entrada.changes) {
      const valor = cambio?.value;
      if (cambio?.field !== 'messages' || valor?.messages?.length) return false;
      if (!Array.isArray(valor?.statuses) || valor.statuses.length === 0) return false;
      if (valor.statuses.some((s: any) => !['sent', 'delivered', 'read'].includes(s?.status))) return false;
    }
  }
  return true;
}

async function reenviar(req: Request, cuerpo?: ArrayBuffer): Promise<Response> {
  const url = new URL(req.url);
  const headers = new Headers();
  for (const nombre of ['content-type', 'x-hub-signature-256']) {
    const valor = req.headers.get(nombre);
    if (valor) headers.set(nombre, valor);
  }
  const resp = await fetch(`${N8N_WEBHOOK_URL}${url.search}`, { method: req.method, headers, body: cuerpo });
  // Se devuelve el estado real: si n8n falla, Meta reintenta más tarde.
  return new Response(await resp.text(), {
    status: resp.status,
    headers: { 'Content-Type': resp.headers.get('content-type') ?? 'text/plain' },
  });
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'GET') return await reenviar(req); // verificación del webhook (hub.challenge)
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const cuerpo = await req.arrayBuffer();
    if (esSoloEstadoSinFallas(new TextDecoder().decode(cuerpo))) return new Response('EVENT_RECEIVED', { status: 200 });
    return await reenviar(req, cuerpo);
  } catch (e) {
    console.error('Error reenviando a n8n:', e);
    return new Response('Bad Gateway', { status: 502 }); // Meta reintenta
  }
});
