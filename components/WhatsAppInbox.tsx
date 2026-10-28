import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AuthContext } from '../App';
import { api } from '../services/supabaseApi';
import { MessageTemplate, PreReserva, Profesional, ProspectoBot, ResumenPacienteWhatsApp, TurnoSinConfirmar, VinculoWhatsApp, WhatsAppConversacion, WhatsAppMensaje } from '../types';
import {
    CLASE_ESTADO_PROSPECTO, DATOS_PROSPECTO, ETAPAS_RESCATE, HORARIO_SECRETARIA_TEXTO, PanelConfigBot, PanelPreReservas,
    PanelSinConfirmar, TarjetaPreReserva, VirtualChip, esDerivacionArchivo, fmtFechaCorta, fmtTurno, infoDerivacion, secretariaAbierta,
} from './WhatsAppBotPanels';

const POLL_MS = 5000;
const POLL_PRERESERVAS_MS = 20000;
type Vista = 'chats' | 'prereservas' | 'sinconfirmar' | 'bot';
const VENTANA_MS = 24 * 60 * 60 * 1000;
const MB = 1024 * 1024;

// Límites de la API de WhatsApp Cloud por tipo de archivo.
const LIMITES: { test: (mime: string) => boolean; max: number; label: string }[] = [
    { test: m => m === 'image/jpeg' || m === 'image/png', max: 5 * MB, label: 'imágenes (5 MB)' },
    { test: m => m.startsWith('video/'), max: 16 * MB, label: 'videos (16 MB)' },
    { test: m => m.startsWith('audio/'), max: 16 * MB, label: 'audios (16 MB)' },
    { test: () => true, max: 100 * MB, label: 'documentos (100 MB)' },
];
const ACCEPT = 'image/jpeg,image/png,video/mp4,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt';

// ─── Íconos ─────────────────────────────────────────────────────────────────
const Svg = ({ d, className = 'w-5 h-5' }: { d: string; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);
const I = {
    search: 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
    clip: 'm18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13',
    bolt: 'm3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z',
    back: 'M15.75 19.5 8.25 12l7.5-7.5',
    info: 'm11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
    close: 'M6 18 18 6M6 6l12 12',
    doc: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
    download: 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3',
    user: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
    bot: 'M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z',
    check: 'm4.5 12.75 6 6 9-13.5',
    clock: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
};
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
);

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatFechaLista(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    const hoy = new Date();
    if (d.toDateString() === hoy.toDateString()) return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
    if (d.toDateString() === ayer.toDateString()) return 'Ayer';
    if (hoy.getTime() - d.getTime() < 6 * 24 * 3600 * 1000) return d.toLocaleDateString('es-AR', { weekday: 'short' });
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatHora(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function etiquetaDia(iso: string): string {
    const d = new Date(iso);
    const hoy = new Date();
    if (d.toDateString() === hoy.toDateString()) return 'Hoy';
    const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
    if (d.toDateString() === ayer.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: d.getFullYear() === hoy.getFullYear() ? undefined : 'numeric' });
}

function esNoLeida(c: WhatsAppConversacion): boolean {
    if (!c.ultimoMensajeFecha) return false;
    if (!c.ultimaLectura) return true;
    return new Date(c.ultimoMensajeFecha).getTime() > new Date(c.ultimaLectura).getTime();
}

function nombreDe(c: WhatsAppConversacion): string {
    return c.nombreContacto || formatTelefono(c.telefono);
}

function formatTelefono(t: string): string {
    // 5493815674663 → +54 9 381 567-4663
    const m = t.match(/^54(9?)(\d{3})(\d{3})(\d{4})$/);
    return m ? `+54 ${m[1] ? '9 ' : ''}${m[2]} ${m[3]}-${m[4]}` : `+${t}`;
}

function iniciales(texto: string): string {
    const partes = texto.replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '#';
    return (partes[0][0] + (partes[1]?.[0] ?? '')).toUpperCase();
}

const AVATAR_COLORES = ['bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-indigo-500', 'bg-orange-500'];
function colorAvatar(seed: string): string {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return AVATAR_COLORES[h % AVATAR_COLORES.length];
}

function esVinculoTercero(v: VinculoWhatsApp | null): boolean {
    return !!v?.expiraAt && new Date(v.expiraAt).getTime() > Date.now();
}

function nombreProfesional(p?: Profesional): string {
    return p ? `${p.nombres} ${p.apellido}`.trim() : '';
}

function formatBytes(n: number): string {
    return n < MB ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / MB).toFixed(1)} MB`;
}

const URL_RE = /(https?:\/\/[^\s]+)/g;
function TextoConLinks({ texto }: { texto: string }) {
    const partes = texto.split(URL_RE);
    return (
        <>
            {partes.map((p, i) =>
                i % 2 === 1
                    ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="text-sky-700 underline break-all">{p}</a>
                    : <React.Fragment key={i}>{p}</React.Fragment>,
            )}
        </>
    );
}

function validarArchivo(f: File): string | null {
    const mime = f.type || '';
    if (mime.startsWith('image/') && mime !== 'image/jpeg' && mime !== 'image/png') {
        return 'WhatsApp solo acepta imágenes JPG o PNG.';
    }
    const regla = LIMITES.find(l => l.test(mime))!;
    if (f.size > regla.max) return `El archivo supera el máximo permitido para ${regla.label}.`;
    return null;
}

type Filtro = 'todas' | 'noLeidas' | 'derivadas' | 'sintomas' | 'archivos' | 'prospectos' | 'humano' | 'mias' | 'atendidas';

const FILTROS: { id: Filtro; label: string }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'noLeidas', label: 'Sin leer' },
    { id: 'derivadas', label: 'Derivadas' },
    { id: 'sintomas', label: 'Síntomas' },
    { id: 'archivos', label: 'Archivos' },
    { id: 'prospectos', label: 'Prospectos' },
    { id: 'humano', label: 'En curso' },
    { id: 'mias', label: 'Mías' },
    { id: 'atendidas', label: 'Atendidas' },
];

const TIPO_CONTACTO: Record<WhatsAppConversacion['tipoContacto'], { label: string; clase: string }> = {
    paciente: { label: 'Paciente', clase: 'bg-green-100 text-green-700' },
    prospecto: { label: 'Prospecto', clase: 'bg-indigo-100 text-indigo-700' },
    desconocido: { label: 'Nuevo', clase: 'bg-slate-100 text-slate-600' },
};

function aplicaFiltro(c: WhatsAppConversacion, f: Filtro, email: string): boolean {
    switch (f) {
        case 'noLeidas': return esNoLeida(c);
        case 'derivadas': return c.derivado && c.estado !== 'atendida';
        case 'sintomas': return c.derivado && c.estado !== 'atendida' && infoDerivacion(c.derivadoMotivo).urgente;
        case 'archivos': return c.derivado && c.estado !== 'atendida' && esDerivacionArchivo(c.derivadoMotivo);
        case 'prospectos': return c.tipoContacto === 'prospecto';
        case 'humano': return c.modo === 'humano' && c.estado !== 'atendida';
        case 'mias': return c.asignadoAEmail === email || (c.modo === 'humano' && c.atendidoPorEmail === email);
        case 'atendidas': return c.estado === 'atendida';
        default: return true;
    }
}

// ─── Subcomponentes ─────────────────────────────────────────────────────────
function Avatar({ c, size = 'w-11 h-11 text-sm' }: { c: WhatsAppConversacion; size?: string }) {
    return (
        <div className={`relative flex-shrink-0 ${size} rounded-full ${colorAvatar(c.telefono)} text-white font-semibold flex items-center justify-center`}>
            {iniciales(nombreDe(c))}
            {c.canal === 'instagram' && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 border-2 border-white" title="Instagram" />
            )}
        </div>
    );
}

function EstadoChip({ c }: { c: WhatsAppConversacion }) {
    if (c.estado === 'atendida') return <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Atendida</span>;
    if (c.derivado) {
        const d = infoDerivacion(c.derivadoMotivo);
        return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${d.clase}`}>{d.corto}</span>;
    }
    if (c.modo === 'humano') return <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">En curso</span>;
    return null;
}

function Adjunto({ m, onAbrirImagen }: { m: WhatsAppMensaje; onAbrirImagen: (url: string) => void }) {
    if (m.tipo === 'texto') return null;
    if (!m.mediaUrl) {
        return <p className="text-xs italic text-slate-400 mb-1">[{m.tipo} no disponible]</p>;
    }
    if (m.tipo === 'imagen' || m.tipo === 'sticker') {
        return (
            <button type="button" onClick={() => onAbrirImagen(m.mediaUrl!)} className="block mb-1 -mx-1 -mt-0.5">
                <img src={m.mediaUrl} alt={m.mediaNombre ?? 'Imagen'} loading="lazy"
                    className={`rounded-md object-cover ${m.tipo === 'sticker' ? 'w-32 h-32 object-contain' : 'max-h-72 w-full max-w-xs'}`} />
            </button>
        );
    }
    if (m.tipo === 'video') {
        return <video src={m.mediaUrl} controls preload="metadata" className="rounded-md max-h-72 w-full max-w-xs mb-1 bg-black" />;
    }
    if (m.tipo === 'audio') {
        return <audio src={m.mediaUrl} controls preload="metadata" className="w-64 max-w-full mb-1" />;
    }
    return (
        <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 mb-1 p-2 rounded-md bg-black/5 hover:bg-black/10 transition-colors min-w-[14rem]">
            <span className="w-9 h-9 rounded bg-red-500 text-white flex items-center justify-center flex-shrink-0"><Svg d={I.doc} /></span>
            <span className="flex-grow min-w-0">
                <span className="block text-sm font-medium text-slate-800 truncate">{m.mediaNombre || 'Documento'}</span>
                <span className="block text-[11px] text-slate-500 uppercase">{(m.mediaNombre?.split('.').pop() || m.mediaMime?.split('/').pop() || 'archivo')}</span>
            </span>
            <span className="text-slate-500"><Svg d={I.download} className="w-4 h-4" /></span>
        </a>
    );
}

// ─── Componente principal ───────────────────────────────────────────────────
interface Props {
    onSelectPatient?: (idPaciente: string) => void;
}

export default function WhatsAppInbox({ onSelectPatient }: Props) {
    const authContext = useContext(AuthContext);
    const email = authContext?.user?.email ?? '';

    const [conversaciones, setConversaciones] = useState<WhatsAppConversacion[]>([]);
    const [equipo, setEquipo] = useState<Profesional[]>([]);
    const [plantillas, setPlantillas] = useState<MessageTemplate[]>([]);
    const [seleccionada, setSeleccionada] = useState<string | null>(null);
    const [mensajes, setMensajes] = useState<WhatsAppMensaje[]>([]);
    const [cargandoMensajes, setCargandoMensajes] = useState(false);
    const [borrador, setBorrador] = useState('');
    const [archivo, setArchivo] = useState<File | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState<Filtro>('todas');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cargandoLista, setCargandoLista] = useState(true);
    const [panelInfo, setPanelInfo] = useState(true);
    const [lightbox, setLightbox] = useState<string | null>(null);
    const [verPlantillas, setVerPlantillas] = useState(false);
    const [busquedaPlantilla, setBusquedaPlantilla] = useState('');
    const [arrastrando, setArrastrando] = useState(false);
    const [vista, setVista] = useState<Vista>('chats');
    const [preReservas, setPreReservas] = useState<PreReserva[]>([]);
    const [sinConfirmar, setSinConfirmar] = useState<TurnoSinConfirmar[]>([]);
    const [prospecto, setProspecto] = useState<ProspectoBot | null>(null);
    const [resumenPaciente, setResumenPaciente] = useState<ResumenPacienteWhatsApp | null>(null);
    const [vinculo, setVinculo] = useState<VinculoWhatsApp | null>(null);
    const [confirmandoTurno, setConfirmandoTurno] = useState<string | null>(null);

    const seleccionadaRef = useRef<string | null>(null);
    seleccionadaRef.current = seleccionada;
    const scrollRef = useRef<HTMLDivElement>(null);
    const pegadoAbajoRef = useRef(true);
    const cantMensajesRef = useRef(0);
    const inputArchivoRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const busquedaRef = useRef<HTMLInputElement>(null);

    const cargarConversaciones = async () => {
        try {
            setConversaciones(await api.getWhatsAppConversaciones());
        } catch (e: any) {
            setError(e?.message ?? 'Error al cargar conversaciones.');
        } finally {
            setCargandoLista(false);
        }
    };

    const cargarMensajes = async (telefono: string) => {
        try {
            const data = await api.getWhatsAppMensajes(telefono);
            // Evita que una respuesta de la conversación anterior pise la actual.
            if (seleccionadaRef.current === telefono) setMensajes(data);
        } catch (e: any) {
            setError(e?.message ?? 'Error al cargar los mensajes.');
        }
    };

    const cargarEquipo = () => api.getProfesionales().then(setEquipo).catch(() => {});
    const cargarPreReservas = () => api.getPreReservas().then(setPreReservas).catch(() => {});
    const cargarSinConfirmar = () => api.getTurnosSinConfirmar().then(setSinConfirmar).catch(() => {});

    useEffect(() => {
        cargarConversaciones();
        cargarPreReservas();
        cargarSinConfirmar();
        const id = setInterval(cargarConversaciones, POLL_MS);
        const idPr = setInterval(() => { cargarPreReservas(); cargarSinConfirmar(); }, POLL_PRERESERVAS_MS);
        cargarEquipo();
        api.getMessageTemplates().then(setPlantillas).catch(() => {});
        return () => { clearInterval(id); clearInterval(idPr); };
    }, []);

    useEffect(() => {
        if (!seleccionada) return;
        let cancelado = false;
        setMensajes([]);
        setCargandoMensajes(true);
        pegadoAbajoRef.current = true;
        cantMensajesRef.current = 0;
        api.getWhatsAppMensajes(seleccionada)
            .then(data => { if (!cancelado) setMensajes(data); })
            .catch(e => setError(e?.message ?? 'Error al cargar los mensajes.'))
            .finally(() => { if (!cancelado) setCargandoMensajes(false); });
        const id = setInterval(() => cargarMensajes(seleccionada), POLL_MS);
        return () => { cancelado = true; clearInterval(id); };
    }, [seleccionada]);

    // Solo baja automáticamente si el usuario ya estaba al final (no lo saca de donde está leyendo).
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const hayNuevos = mensajes.length > cantMensajesRef.current;
        const primeraCarga = cantMensajesRef.current === 0;
        cantMensajesRef.current = mensajes.length;
        if (hayNuevos && (pegadoAbajoRef.current || primeraCarga)) {
            el.scrollTo({ top: el.scrollHeight, behavior: primeraCarga ? 'auto' : 'smooth' });
        }
    }, [mensajes]);

    // Atajos: Ctrl+K busca, Esc cierra overlays.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                busquedaRef.current?.focus();
            }
            if (e.key === 'Escape') {
                if (lightbox) setLightbox(null);
                else if (verPlantillas) setVerPlantillas(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightbox, verPlantillas]);

    // Textarea que crece con el contenido.
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }, [borrador]);

    const previewArchivo = useMemo(() => (archivo && archivo.type.startsWith('image/') ? URL.createObjectURL(archivo) : null), [archivo]);
    useEffect(() => () => { if (previewArchivo) URL.revokeObjectURL(previewArchivo); }, [previewArchivo]);

    const handleSeleccionar = (telefono: string) => {
        if (telefono !== seleccionada) {
            setBorrador('');
            setArchivo(null);
            setError(null);
            setVerPlantillas(false);
        }
        setSeleccionada(telefono);
        api.marcarConversacionWhatsAppLeida(telefono)
            .then(() => setConversaciones(prev => prev.map(c => c.telefono === telefono ? { ...c, ultimaLectura: new Date().toISOString() } : c)))
            .catch(() => {});
    };

    const convActual = useMemo(() => conversaciones.find(c => c.telefono === seleccionada) ?? null, [conversaciones, seleccionada]);

    // Datos del contacto según lo que identificó el bot. Se refrescan con cada mensaje nuevo
    // porque el bot va completando el prospecto durante la charla.
    const idContactoActual = convActual?.idContacto ?? null;
    const idPacienteActual = convActual?.idPaciente ?? null;
    const cargarDatosContacto = () => {
        if (idContactoActual) api.getProspectoBot(idContactoActual).then(setProspecto).catch(() => setProspecto(null));
        else setProspecto(null);
        if (!seleccionada) { setVinculo(null); setResumenPaciente(null); return; }
        api.getVinculoWhatsApp(seleccionada).catch(() => null).then(v => {
            setVinculo(v);
            // Si gestiona un tercero, la conversación no tiene id_paciente: se usa el del vínculo.
            const id = idPacienteActual ?? (esVinculoTercero(v) ? v!.idPaciente : null);
            if (id) api.getResumenPacienteWhatsApp(id).then(setResumenPaciente).catch(() => setResumenPaciente(null));
            else setResumenPaciente(null);
        });
    };
    useEffect(cargarDatosContacto, [idContactoActual, idPacienteActual, seleccionada, mensajes.length]);

    // Vínculo temporal: quien escribe gestiona turnos de otra persona (madre, hijo…).
    const gestionaTercero = esVinculoTercero(vinculo);
    const idPacienteVista = idPacienteActual ?? (gestionaTercero ? vinculo!.idPaciente : null);

    const preReservaActual = useMemo(
        () => preReservas.find(pr => (idContactoActual && pr.idContacto === idContactoActual) || pr.prospecto?.telefono === seleccionada) ?? null,
        [preReservas, idContactoActual, seleccionada],
    );

    const abrirConversacion = (telefono: string) => {
        setVista('chats');
        handleSeleccionar(telefono);
    };
    // Conversación de un teléfono cargado en la ficha (formatos distintos: se comparan los últimos 10 dígitos).
    const conversacionDe = (telefono: string | null) => {
        const ult10 = (t: string) => t.replace(/\D/g, '').slice(-10);
        if (!telefono || ult10(telefono).length < 10) return null;
        return conversaciones.find(c => ult10(c.telefono) === ult10(telefono))?.telefono ?? null;
    };

    const conteos = useMemo(() => {
        const r = {} as Record<Filtro, number>;
        FILTROS.forEach(f => { r[f.id] = conversaciones.filter(c => aplicaFiltro(c, f.id, email)).length; });
        return r;
    }, [conversaciones, email]);

    const conversacionesFiltradas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        const qDigitos = q.replace(/\D/g, '');
        return conversaciones.filter(c => {
            if (!aplicaFiltro(c, filtro, email)) return false;
            if (!q) return true;
            return (c.nombreContacto ?? '').toLowerCase().includes(q)
                || (qDigitos.length > 0 && c.telefono.includes(qDigitos))
                || (c.ultimoMensaje ?? '').toLowerCase().includes(q);
        });
    }, [conversaciones, filtro, busqueda, email]);

    // WhatsApp solo permite mensajes libres dentro de las 24 h desde el último mensaje del paciente.
    const ventana = useMemo(() => {
        const ultimo = [...mensajes].reverse().find(m => m.remitente === 'paciente');
        if (!ultimo) return { abierta: mensajes.length === 0, restanteMs: 0 };
        const restante = new Date(ultimo.fecha).getTime() + VENTANA_MS - Date.now();
        return { abierta: restante > 0, restanteMs: restante };
    }, [mensajes]);

    const mensajesAgrupados = useMemo(() => {
        const grupos: { dia: string; items: WhatsAppMensaje[] }[] = [];
        mensajes.forEach(m => {
            const dia = new Date(m.fecha).toDateString();
            const ult = grupos[grupos.length - 1];
            if (ult && ult.dia === dia) ult.items.push(m);
            else grupos.push({ dia, items: [m] });
        });
        return grupos;
    }, [mensajes]);

    const plantillasFiltradas = useMemo(() => {
        const q = busquedaPlantilla.trim().toLowerCase();
        return q ? plantillas.filter(p => p.name.toLowerCase().includes(q) || p.text.toLowerCase().includes(q)) : plantillas;
    }, [plantillas, busquedaPlantilla]);

    const elegirArchivo = (f: File | undefined | null) => {
        if (!f) return;
        const err = validarArchivo(f);
        if (err) { setError(err); return; }
        setError(null);
        setArchivo(f);
        textareaRef.current?.focus();
    };

    const insertarPlantilla = (p: MessageTemplate) => {
        const primerNombre = (convActual?.nombreContacto ?? '').trim().split(/\s+/)[0] ?? '';
        const texto = p.text.replace(/\{nombre\}|\[nombre\]/gi, primerNombre);
        setBorrador(prev => (prev.trim() === '/' || !prev.trim()) ? texto : `${prev}\n${texto}`);
        setVerPlantillas(false);
        setBusquedaPlantilla('');
        textareaRef.current?.focus();
    };

    const handleEnviar = async () => {
        const texto = borrador.trim();
        if ((!texto && !archivo) || !seleccionada || enviando || !ventana.abierta) return;
        setEnviando(true);
        setError(null);
        try {
            await api.enviarMensajeWhatsApp(seleccionada, texto, email, archivo ?? undefined);
            setBorrador('');
            setArchivo(null);
            pegadoAbajoRef.current = true;
            await Promise.all([cargarMensajes(seleccionada), cargarConversaciones()]);
        } catch (e: any) {
            setError(e?.message ?? 'No se pudo enviar el mensaje.');
        } finally {
            setEnviando(false);
            textareaRef.current?.focus();
        }
    };

    const accion = async (fn: () => Promise<void>, msgError: string) => {
        try {
            await fn();
            await cargarConversaciones();
        } catch (e: any) {
            setError(e?.message ?? msgError);
        }
    };

    const tomar = () => seleccionada && accion(() => api.tomarConversacionWhatsApp(seleccionada, email), 'No se pudo tomar la conversación.');
    const atendida = (devolverAlBot: boolean) => seleccionada && accion(() => api.marcarConversacionWhatsAppAtendida(seleccionada, devolverAlBot), 'No se pudo marcar como atendida.');
    const asignar = (e: string) => seleccionada && accion(() => api.asignarConversacionWhatsApp(seleccionada, e || null), 'No se pudo asignar la conversación.');
    const destrabarBot = () => seleccionada && accion(() => api.reiniciarIntentosBotWhatsApp(seleccionada), 'No se pudo reiniciar el bot.');
    const cambiarBaja = async (noContactar: boolean) => {
        if (!prospecto) return;
        if (noContactar && !window.confirm('¿Dar de baja a este prospecto? El bot y los mensajes de rescate no le van a volver a escribir.')) return;
        try { await api.setNoContactarProspecto(prospecto.idContacto, noContactar); cargarDatosContacto(); }
        catch (e: any) { setError(e?.message ?? 'No se pudo actualizar el prospecto.'); }
    };
    const confirmarTurno = async (idTurno: string) => {
        if (!window.confirm('Se marca el turno como confirmado y se le envía la confirmación por WhatsApp. ¿Continuar?')) return;
        setConfirmandoTurno(idTurno);
        try { await api.confirmarTurnoYAvisarWhatsApp(idTurno, email); cargarDatosContacto(); if (seleccionada) await cargarMensajes(seleccionada); }
        catch (e: any) { setError(e?.message ?? 'No se pudo confirmar el turno.'); }
        finally { setConfirmandoTurno(null); }
    };

    const atendidoPor = equipo.find(p => p.email === convActual?.atendidoPorEmail);
    const puedeEnviar = (!!borrador.trim() || !!archivo) && !enviando && ventana.abierta;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-9rem)] min-h-[520px]">
            {/* ── Pestañas del módulo ───────────────────────────────── */}
            <nav className="flex items-center gap-1 px-3 border-b border-slate-200 bg-slate-50 flex-shrink-0 overflow-x-auto">
                {([
                    { id: 'chats', label: 'Conversaciones', badge: conteos.noLeidas },
                    { id: 'prereservas', label: 'Pre-reservas', badge: preReservas.length },
                    { id: 'sinconfirmar', label: 'Sin confirmar', badge: sinConfirmar.length },
                    { id: 'bot', label: 'Configuración del bot', badge: 0 },
                ] as { id: Vista; label: string; badge: number }[]).map(t => (
                    <button key={t.id} onClick={() => setVista(t.id)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${vista === t.id ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                        {t.label}
                        {t.badge > 0 && (
                            <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${t.id === 'prereservas' ? 'bg-emerald-500 text-white' : t.id === 'sinconfirmar' ? 'bg-amber-500 text-white' : 'bg-sky-100 text-sky-700'}`}>{t.badge}</span>
                        )}
                    </button>
                ))}
                <span className={`ml-auto flex-shrink-0 text-[11px] font-medium px-2 py-1 rounded-full ${secretariaAbierta() ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                    title={`Horario de secretaría: ${HORARIO_SECRETARIA_TEXTO}`}>
                    Secretaría {secretariaAbierta() ? 'abierta' : 'cerrada'}
                </span>
            </nav>

            {vista === 'prereservas' && (
                <div className="flex-grow min-h-0">
                    <PanelPreReservas preReservas={preReservas} equipo={equipo} email={email}
                        onRecargar={() => { cargarPreReservas(); cargarConversaciones(); }} onAbrirConversacion={abrirConversacion} />
                </div>
            )}
            {vista === 'sinconfirmar' && (
                <div className="flex-grow min-h-0">
                    <PanelSinConfirmar turnos={sinConfirmar} equipo={equipo} email={email}
                        onRecargar={cargarSinConfirmar} conversacionDe={conversacionDe} onAbrirConversacion={abrirConversacion} />
                </div>
            )}
            {vista === 'bot' && (
                <div className="flex-grow min-h-0">
                    <PanelConfigBot equipo={equipo} onEquipoCambiado={cargarEquipo} />
                </div>
            )}

            <div className={`${vista === 'chats' ? 'flex' : 'hidden'} flex-grow min-h-0`}>
            {/* ── Lista ─────────────────────────────────────────────── */}
            <aside className={`${seleccionada ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-slate-200 flex-col`}>
                <div className="px-4 pt-4 pb-3 border-b border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800">Mensajes</h2>
                        {conteos.noLeidas > 0 && (
                            <span className="text-xs font-semibold text-white bg-emerald-500 rounded-full px-2 py-0.5">{conteos.noLeidas} sin leer</span>
                        )}
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Svg d={I.search} className="w-4 h-4" /></span>
                        <input
                            ref={busquedaRef}
                            type="text"
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            placeholder="Buscar nombre, teléfono o mensaje  (Ctrl+K)"
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-100 border border-transparent focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1">
                        {FILTROS.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFiltro(f.id)}
                                className={`flex-shrink-0 text-xs font-medium pl-2.5 pr-2 py-1 rounded-full transition-colors flex items-center gap-1 ${filtro === f.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {f.label}
                                {f.id !== 'todas' && conteos[f.id] > 0 && (
                                    <span className={`text-[10px] rounded-full px-1.5 ${filtro === f.id ? 'bg-white/25' : 'bg-white text-slate-500'}`}>{conteos[f.id]}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto">
                    {cargandoLista && Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="px-4 py-3 flex gap-3 animate-pulse">
                            <div className="w-11 h-11 rounded-full bg-slate-200" />
                            <div className="flex-grow space-y-2 py-1"><div className="h-3 bg-slate-200 rounded w-1/2" /><div className="h-3 bg-slate-100 rounded w-3/4" /></div>
                        </div>
                    ))}
                    {!cargandoLista && conversacionesFiltradas.length === 0 && (
                        <div className="p-8 text-center text-sm text-slate-400">
                            {busqueda ? 'Sin resultados para la búsqueda.' : 'No hay conversaciones en este filtro.'}
                        </div>
                    )}
                    {conversacionesFiltradas.map(c => {
                        const activa = c.telefono === seleccionada;
                        const noLeida = esNoLeida(c);
                        return (
                            <button
                                key={c.telefono}
                                onClick={() => handleSeleccionar(c.telefono)}
                                className={`w-full text-left px-4 py-3 flex gap-3 border-l-4 transition-colors ${activa ? 'bg-sky-50 border-sky-500' : 'border-transparent hover:bg-slate-50'}`}
                            >
                                <Avatar c={c} />
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className="flex items-center gap-1.5 min-w-0">
                                            <span className={`truncate text-[15px] ${noLeida ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>{nombreDe(c)}</span>
                                            <span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wide px-1 py-px rounded ${TIPO_CONTACTO[c.tipoContacto].clase}`}>{TIPO_CONTACTO[c.tipoContacto].label}</span>
                                        </span>
                                        <span className={`text-[11px] flex-shrink-0 ${noLeida ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>{formatFechaLista(c.ultimoMensajeFecha)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                        <span className={`text-[13px] truncate ${noLeida ? 'text-slate-700' : 'text-slate-500'}`}>{c.ultimoMensaje || ' '}</span>
                                        <span className="flex items-center gap-1 flex-shrink-0">
                                            <EstadoChip c={c} />
                                            {noLeida && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                                        </span>
                                    </div>
                                    {c.asignadoAEmail && (
                                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                            <Svg d={I.user} className="w-3 h-3" />
                                            {c.asignadoAEmail === email ? 'Asignada a vos' : nombreProfesional(equipo.find(p => p.email === c.asignadoAEmail)) || c.asignadoAEmail}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* ── Chat ──────────────────────────────────────────────── */}
            <section
                className={`${seleccionada ? 'flex' : 'hidden md:flex'} flex-grow flex-col min-w-0 relative`}
                onDragOver={e => { if (convActual && e.dataTransfer.types.includes('Files')) { e.preventDefault(); setArrastrando(true); } }}
                onDragLeave={e => { if (e.currentTarget === e.target) setArrastrando(false); }}
                onDrop={e => { e.preventDefault(); setArrastrando(false); elegirArchivo(e.dataTransfer.files?.[0]); }}
            >
                {!convActual && (
                    <div className="flex-grow flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-50">
                        <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                            <Svg d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" className="w-8 h-8" />
                        </div>
                        <p className="text-sm">Seleccioná una conversación para empezar</p>
                    </div>
                )}

                {convActual && (
                    <>
                        <header className="px-3 sm:px-4 py-2.5 border-b border-slate-200 flex items-center gap-3 bg-white">
                            <button onClick={() => setSeleccionada(null)} className="md:hidden p-1 -ml-1 text-slate-500 hover:text-slate-800" title="Volver">
                                <Svg d={I.back} />
                            </button>
                            <Avatar c={convActual} size="w-10 h-10 text-sm" />
                            <button onClick={() => setPanelInfo(v => !v)} className="min-w-0 flex-grow text-left">
                                <p className="text-[15px] font-semibold text-slate-800 truncate">{nombreDe(convActual)}</p>
                                <p className="text-xs text-slate-500 truncate">
                                    {convActual.modo === 'humano'
                                        ? `Atendida por ${atendidoPor ? nombreProfesional(atendidoPor) : 'secretaría'}`
                                        : 'Respondiendo el bot automáticamente'}
                                </p>
                            </button>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {convActual.modo === 'bot' ? (
                                    <button onClick={tomar} className="text-sm font-medium text-white bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5">
                                        <Svg d={I.user} className="w-4 h-4" /><span className="hidden sm:inline">Tomar</span>
                                    </button>
                                ) : (
                                    <button onClick={() => atendida(true)} className="text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 flex items-center gap-1.5" title="Marca como atendida y le devuelve la conversación al bot">
                                        <Svg d={I.bot} className="w-4 h-4" /><span className="hidden sm:inline">Devolver al bot</span>
                                    </button>
                                )}
                                <button onClick={() => setPanelInfo(v => !v)} className={`hidden lg:block p-1.5 rounded-lg ${panelInfo ? 'text-sky-600 bg-sky-50' : 'text-slate-500 hover:bg-slate-100'}`} title="Detalles del contacto">
                                    <Svg d={I.info} />
                                </button>
                            </div>
                        </header>

                        {convActual.derivado && convActual.estado !== 'atendida' && (() => {
                            const d = infoDerivacion(convActual.derivadoMotivo);
                            return (
                                <div className={`px-4 py-2 border-b text-sm flex items-center gap-2 ${d.urgente ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${d.clase}`}>{d.corto}</span>
                                    <span className="truncate">{d.detalle || 'Derivada a secretaría'}</span>
                                    {d.urgente && <span className="ml-auto text-[11px] font-semibold flex-shrink-0">El bot indicó guardia del Sanatorio 9 de Julio</span>}
                                </div>
                            );
                        })()}
                        {preReservaActual && (
                            <div className="px-4 py-2 border-b border-emerald-200 bg-emerald-50 text-sm text-emerald-900 flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">Pre-reserva pendiente:</span>
                                <span>{fmtTurno(preReservaActual.fechaTurno)} · {nombreProfesional(equipo.find(p => p.email === preReservaActual.profesionalEmail)) || preReservaActual.profesionalEmail}</span>
                                <button onClick={() => setPanelInfo(true)} className="ml-auto text-xs font-medium underline">Confirmar o rechazar</button>
                            </div>
                        )}

                        <div
                            ref={scrollRef}
                            onScroll={e => {
                                const el = e.currentTarget;
                                pegadoAbajoRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
                            }}
                            className="flex-grow overflow-y-auto px-3 sm:px-6 py-4 bg-[#efeae2] bg-[radial-gradient(#d6d0c4_1px,transparent_1px)] [background-size:18px_18px]"
                        >
                            {cargandoMensajes && <p className="text-center text-sm text-slate-500 py-8">Cargando mensajes...</p>}
                            {mensajesAgrupados.map(g => (
                                <div key={g.dia} className="space-y-1.5">
                                    <div className="flex justify-center py-2 sticky top-0 z-10">
                                        <span className="text-[11px] font-medium text-slate-600 bg-white/90 shadow-sm rounded-md px-2.5 py-1 first-letter:uppercase">{etiquetaDia(g.items[0].fecha)}</span>
                                    </div>
                                    {g.items.map((m, i) => {
                                        const esPaciente = m.remitente === 'paciente';
                                        const esBot = m.remitente === 'bot';
                                        const esSistema = m.remitente === 'sistema';
                                        const previo = g.items[i - 1];
                                        const mismoAutor = previo && previo.remitente === m.remitente;
                                        const autor = esBot ? 'Bot' : esSistema ? 'Mensaje automático (plantilla)' : nombreProfesional(equipo.find(p => p.email === m.remitente)) || m.remitente;
                                        const fondo = esPaciente ? 'bg-white' : esBot ? 'bg-sky-100' : esSistema ? 'bg-violet-50 border border-violet-200' : 'bg-[#d9fdd3]';
                                        return (
                                            <div key={m.idMensaje} className={`flex ${esPaciente ? 'justify-start' : 'justify-end'} ${mismoAutor ? '' : 'pt-1.5'}`}>
                                                <div className={`max-w-[85%] sm:max-w-[70%] rounded-lg px-3 pt-1.5 pb-1 text-[14.5px] leading-snug shadow-sm text-slate-800 ${fondo}`}>
                                                    {!esPaciente && (!mismoAutor || esSistema) && (
                                                        <p className={`text-[11px] font-semibold mb-0.5 flex items-center gap-1 ${esBot ? 'text-sky-700' : esSistema ? 'text-violet-700' : 'text-emerald-700'}`}>
                                                            {esBot && <Svg d={I.bot} className="w-3 h-3" />}{esSistema && <Svg d={I.clock} className="w-3 h-3" />}{autor}
                                                        </p>
                                                    )}
                                                    <Adjunto m={m} onAbrirImagen={setLightbox} />
                                                    {m.texto && <p className="whitespace-pre-wrap break-words"><TextoConLinks texto={m.texto} /></p>}
                                                    <p className="text-[10.5px] text-slate-400 text-right mt-0.5 leading-none">{formatHora(m.fecha)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {arrastrando && (
                            <div className="absolute inset-0 z-20 bg-sky-600/10 border-4 border-dashed border-sky-500 flex items-center justify-center pointer-events-none">
                                <p className="bg-white px-4 py-2 rounded-lg shadow text-sky-700 font-medium">Soltá el archivo para adjuntarlo</p>
                            </div>
                        )}

                        {/* ── Composer ── */}
                        <div className="border-t border-slate-200 bg-slate-50 relative">
                            {!ventana.abierta && (
                                <div className="px-4 py-2 text-xs text-amber-900 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                                    <Svg d={I.clock} className="w-4 h-4 flex-shrink-0" />
                                    Pasaron más de 24 h desde el último mensaje del paciente. WhatsApp no permite escribirle hasta que vuelva a escribir (o por plantilla aprobada).
                                </div>
                            )}
                            {ventana.abierta && ventana.restanteMs > 0 && ventana.restanteMs < 3 * 3600 * 1000 && (
                                <div className="px-4 py-1.5 text-[11px] text-slate-600 bg-slate-100 border-b border-slate-200">
                                    La ventana de respuesta de WhatsApp cierra en {Math.max(1, Math.round(ventana.restanteMs / 60000))} min.
                                </div>
                            )}
                            {error && (
                                <div className="px-4 py-1.5 text-xs text-red-700 bg-red-50 border-b border-red-100 flex justify-between gap-2">
                                    <span>{error}</span>
                                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700"><Svg d={I.close} className="w-3.5 h-3.5" /></button>
                                </div>
                            )}

                            {verPlantillas && (
                                <div className="absolute bottom-full left-3 right-3 mb-2 z-30 bg-white rounded-xl shadow-xl border border-slate-200 max-h-80 flex flex-col">
                                    <div className="p-2 border-b border-slate-100">
                                        <input
                                            autoFocus
                                            value={busquedaPlantilla}
                                            onChange={e => setBusquedaPlantilla(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && plantillasFiltradas[0]) { e.preventDefault(); insertarPlantilla(plantillasFiltradas[0]); } }}
                                            placeholder="Buscar respuesta rápida..."
                                            className="w-full text-sm px-3 py-1.5 rounded-md bg-slate-100 focus:bg-white focus:ring-2 focus:ring-sky-500 border-transparent"
                                        />
                                    </div>
                                    <div className="overflow-y-auto">
                                        {plantillasFiltradas.length === 0 && (
                                            <p className="p-4 text-sm text-slate-400 text-center">
                                                {plantillas.length === 0 ? 'No hay plantillas. Creálas en Configuración → Plantillas de mensajes.' : 'Sin resultados.'}
                                            </p>
                                        )}
                                        {plantillasFiltradas.map(p => (
                                            <button key={p.id} onClick={() => insertarPlantilla(p)} className="w-full text-left px-3 py-2 hover:bg-sky-50 border-b border-slate-50">
                                                <p className="text-sm font-medium text-slate-800">{p.name}</p>
                                                <p className="text-xs text-slate-500 line-clamp-2">{p.text}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {archivo && (
                                <div className="mx-3 mt-3 p-2 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
                                    {previewArchivo
                                        ? <img src={previewArchivo} alt="" className="w-14 h-14 rounded object-cover" />
                                        : <span className="w-14 h-14 rounded bg-slate-100 text-slate-500 flex items-center justify-center"><Svg d={I.doc} className="w-7 h-7" /></span>}
                                    <div className="flex-grow min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{archivo.name}</p>
                                        <p className="text-xs text-slate-500">{formatBytes(archivo.size)} · el texto se envía como descripción</p>
                                    </div>
                                    <button onClick={() => setArchivo(null)} className="p-1.5 text-slate-400 hover:text-red-600" title="Quitar"><Svg d={I.close} className="w-4 h-4" /></button>
                                </div>
                            )}

                            <div className="p-3 flex items-end gap-2">
                                <button
                                    onClick={() => setVerPlantillas(v => !v)}
                                    disabled={!ventana.abierta}
                                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center disabled:opacity-40 ${verPlantillas ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-200'}`}
                                    title="Respuestas rápidas (o escribí / al inicio)"
                                >
                                    <Svg d={I.bolt} />
                                </button>
                                <button
                                    onClick={() => inputArchivoRef.current?.click()}
                                    disabled={!ventana.abierta}
                                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 disabled:opacity-40"
                                    title="Adjuntar foto, video, audio o documento"
                                >
                                    <Svg d={I.clip} />
                                </button>
                                <input
                                    ref={inputArchivoRef}
                                    type="file"
                                    accept={ACCEPT}
                                    className="hidden"
                                    onChange={e => { elegirArchivo(e.target.files?.[0]); e.target.value = ''; }}
                                />
                                <textarea
                                    ref={textareaRef}
                                    value={borrador}
                                    disabled={!ventana.abierta}
                                    onChange={e => {
                                        const v = e.target.value;
                                        setBorrador(v);
                                        if (v === '/') { setVerPlantillas(true); setBusquedaPlantilla(''); }
                                    }}
                                    onPaste={e => {
                                        const f = Array.from(e.clipboardData.files)[0];
                                        if (f) { e.preventDefault(); elegirArchivo(f); }
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar(); }
                                    }}
                                    rows={1}
                                    placeholder={ventana.abierta ? (archivo ? 'Agregá una descripción (opcional)...' : 'Escribí un mensaje  ·  / para respuestas rápidas') : 'Ventana de 24 h cerrada'}
                                    className="flex-grow resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100"
                                />
                                <button
                                    onClick={handleEnviar}
                                    disabled={!puedeEnviar}
                                    className="flex-shrink-0 w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 disabled:bg-slate-300 transition-colors"
                                    title="Enviar (Enter)"
                                >
                                    {enviando
                                        ? <span className="w-5 h-5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                                        : <SendIcon />}
                                </button>
                            </div>
                            {convActual.modo === 'bot' && ventana.abierta && (
                                <p className="px-4 pb-2 -mt-1 text-[11px] text-slate-400">Al enviar, la conversación pasa a modo humano y el bot deja de responder.</p>
                            )}
                        </div>
                    </>
                )}
            </section>

            {/* ── Panel de detalles ─────────────────────────────────── */}
            {convActual && panelInfo && (
                <aside className="hidden lg:flex w-72 xl:w-80 flex-shrink-0 border-l border-slate-200 flex-col overflow-y-auto bg-white">
                    <div className="p-5 flex flex-col items-center text-center border-b border-slate-100">
                        <Avatar c={convActual} size="w-20 h-20 text-2xl" />
                        <p className="mt-3 text-base font-semibold text-slate-800">{nombreDe(convActual)}</p>
                        <a href={`tel:+${convActual.telefono}`} className="text-sm text-slate-500 hover:text-sky-600">{formatTelefono(convActual.telefono)}</a>
                        <div className="mt-2 flex gap-1.5 items-center">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${convActual.canal === 'instagram' ? 'bg-pink-100 text-pink-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {convActual.canal === 'instagram' ? 'Instagram' : 'WhatsApp'}
                            </span>
                            <EstadoChip c={convActual} />
                        </div>
                    </div>

                    <div className="p-4 space-y-4 text-sm">
                        {preReservaActual && (
                            <div>
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Pre-reserva</p>
                                <TarjetaPreReserva pr={preReservaActual} equipo={equipo} email={email} compacta
                                    onHecho={() => { cargarPreReservas(); cargarConversaciones(); cargarDatosContacto(); }} />
                            </div>
                        )}

                        {gestionaTercero && vinculo && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                                <p className="font-semibold">Escribe un tercero</p>
                                <p>{[vinculo.contactoNombre, vinculo.contactoVinculo].filter(Boolean).join(' · ') || 'Sin datos del contacto'} gestiona turnos del paciente hasta las {formatHora(vinculo.expiraAt!)}. El bot no le da información clínica.</p>
                            </div>
                        )}

                        {(convActual.intentosVerificacion >= 2 || convActual.intentosAgenda >= 2) && (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 space-y-1">
                                {convActual.intentosVerificacion >= 2 && <p>La verificación por DNI falló 2 veces: el bot no lo vuelve a intentar por 24 h.</p>}
                                {convActual.intentosAgenda >= 2 && <p>Hubo 2 horarios rechazados seguidos: el bot dejó de ofrecer turnos.</p>}
                                <button onClick={destrabarBot} className="font-medium text-rose-700 underline">Reiniciar contadores del bot</button>
                            </div>
                        )}

                        {idPacienteVista && (
                            <div>
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Paciente</p>
                                {resumenPaciente && (
                                    <div className="mb-2 rounded-lg border border-slate-200 p-3 space-y-1 text-xs">
                                        <p className="text-sm font-semibold text-slate-800">{resumenPaciente.apellido}, {resumenPaciente.nombres}</p>
                                        <p className="text-slate-500">DNI {resumenPaciente.dni || '—'} · {resumenPaciente.obraSocial || 'Sin obra social'}</p>
                                        {resumenPaciente.etiqueta && <span className="inline-block text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{resumenPaciente.etiqueta}</span>}
                                        <div className="pt-1.5">
                                            <p className="text-slate-400 mb-0.5">Próximos turnos</p>
                                            {resumenPaciente.proximosTurnos.length === 0 && <p className="text-slate-500">Sin turnos próximos.</p>}
                                            {resumenPaciente.proximosTurnos.map(t => (
                                                <div key={t.idTurno} className="py-1 border-t border-slate-100 first:border-t-0">
                                                    <p className="text-slate-700 flex items-center gap-1 flex-wrap">
                                                        {fmtTurno(t.fechaTurno)} · {nombreProfesional(equipo.find(p => p.email === t.profesionalEmail)) || t.profesionalEmail}
                                                        {t.virtual && <VirtualChip />}
                                                    </p>
                                                    <p className="text-[11px] flex items-center gap-2">
                                                        {t.estado === 'CONFIRMADO' && <span className="text-emerald-600 font-medium">Confirmado ✓</span>}
                                                        {t.estado === 'PRE_RESERVA' && <span className="text-emerald-700 font-medium">Pre-reserva</span>}
                                                        {t.estado === 'AGENDADO' && <span className="text-slate-500">Sin confirmar</span>}
                                                        {t.recordatorioEnviado && <span className="text-slate-400">Recordatorio enviado</span>}
                                                        {(t.estado === 'AGENDADO' || t.estado === 'CONFIRMADO') && (
                                                            <button onClick={() => confirmarTurno(t.idTurno)} disabled={confirmandoTurno === t.idTurno}
                                                                className="ml-auto text-sky-600 hover:underline disabled:opacity-50">
                                                                {confirmandoTurno === t.idTurno ? 'Enviando…' : t.estado === 'CONFIRMADO' ? 'Reenviar confirmación' : 'Confirmar y avisar'}
                                                            </button>
                                                        )}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={() => onSelectPatient?.(idPacienteVista!)}
                                    className="w-full text-left px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 font-medium"
                                >
                                    Ver ficha del paciente →
                                </button>
                            </div>
                        )}

                        {!idPacienteVista && prospecto && (() => {
                            const faltan = DATOS_PROSPECTO.filter(d => !prospecto[d.key]);
                            return (
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Prospecto</p>
                                        {prospecto.estado && (
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${CLASE_ESTADO_PROSPECTO[prospecto.estado] ?? 'bg-slate-100 text-slate-600'}`}>{prospecto.estado}</span>
                                        )}
                                    </div>
                                    <dl className="rounded-lg border border-slate-200 p-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                                        {DATOS_PROSPECTO.map(d => (
                                            <div key={d.key} className="min-w-0">
                                                <dt className="text-slate-400">{d.label}</dt>
                                                <dd className={`truncate ${prospecto[d.key] ? 'text-slate-700' : 'text-slate-300'}`}>
                                                    {d.key === 'fechaNacimiento' ? fmtFechaCorta(prospecto.fechaNacimiento) || '—' : (prospecto[d.key] as string) || '—'}
                                                </dd>
                                            </div>
                                        ))}
                                        {prospecto.motivo && (
                                            <div className="col-span-2"><dt className="text-slate-400">Motivo</dt><dd className="text-slate-700">{prospecto.motivo}</dd></div>
                                        )}
                                        {(prospecto.contactoNombre || prospecto.contactoVinculo) && (
                                            <div className="col-span-2"><dt className="text-slate-400">Escribe un tercero</dt><dd className="text-slate-700">{[prospecto.contactoNombre, prospecto.contactoVinculo].filter(Boolean).join(' · ')}</dd></div>
                                        )}
                                    </dl>
                                    <p className={`mt-1.5 text-[11px] ${faltan.length ? 'text-amber-700' : 'text-emerald-700'}`}>
                                        {faltan.length
                                            ? `Faltan para pre-reservar: ${faltan.map(f => f.label.toLowerCase()).join(', ')}.`
                                            : 'Datos completos: el bot puede ofrecer cupos de primera consulta.'}
                                    </p>

                                    {prospecto.noContactar ? (
                                        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
                                            <p className="font-semibold">Pidió BAJA</p>
                                            <p>El bot y los mensajes de rescate no le escriben. Si vuelve a escribir, se reactiva solo.</p>
                                            <button onClick={() => cambiarBaja(false)} className="mt-1 font-medium underline">Reactivar contacto</button>
                                        </div>
                                    ) : (
                                        <div className="mt-2 rounded-lg border border-slate-200 p-2.5 text-xs space-y-1">
                                            <p className="text-slate-400">Seguimiento automático</p>
                                            {prospecto.ultimoMensajeAt && <p className="text-slate-600">Último mensaje: {fmtFechaCorta(prospecto.ultimoMensajeAt)}</p>}
                                            {ETAPAS_RESCATE.map(e => (
                                                <p key={e.key} className="flex justify-between gap-2">
                                                    <span className="text-slate-600">{e.label} <span className="text-slate-400">({e.cuando})</span></span>
                                                    <span className={prospecto[e.key] ? 'text-emerald-700' : 'text-slate-300'}>
                                                        {prospecto[e.key] ? `Enviado ${fmtFechaCorta(prospecto[e.key])}` : '—'}
                                                    </span>
                                                </p>
                                            ))}
                                            {prospecto.estadoPrevio && <p className="text-slate-500">Si responde, vuelve a “{prospecto.estadoPrevio}”.</p>}
                                            <button onClick={() => cambiarBaja(true)} className="pt-1 text-red-600 hover:underline">Dar de baja (no contactar)</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {!idPacienteVista && !prospecto && (
                            <div>
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Contacto</p>
                                <p className="text-slate-500 text-xs">Todavía no identificado. El bot le pregunta si ya es paciente o si es su primera consulta cuando lo necesita.</p>
                            </div>
                        )}

                        <div>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Asignada a</p>
                            <select
                                value={convActual.asignadoAEmail ?? ''}
                                onChange={e => asignar(e.target.value)}
                                className="w-full text-sm rounded-lg border border-slate-300 px-2.5 py-2 text-slate-700 bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            >
                                <option value="">Sin asignar</option>
                                {equipo.filter(p => p.activo !== false).map(p => (
                                    <option key={p.email} value={p.email}>{nombreProfesional(p)}{p.email === email ? ' (vos)' : ''}</option>
                                ))}
                            </select>
                            {!convActual.asignadoAEmail && (
                                <button onClick={() => asignar(email)} className="mt-1.5 text-xs text-sky-600 hover:underline">Asignármela</button>
                            )}
                        </div>

                        {convActual.derivadoMotivo && (
                            <div>
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Motivo de derivación</p>
                                <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mb-1 ${infoDerivacion(convActual.derivadoMotivo).clase}`}>{infoDerivacion(convActual.derivadoMotivo).corto}</span>
                                <p className="text-slate-700">{infoDerivacion(convActual.derivadoMotivo).detalle || convActual.derivadoMotivo}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Acciones</p>
                            <div className="space-y-1.5">
                                {convActual.modo === 'bot' && (
                                    <button onClick={tomar} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-700">
                                        <Svg d={I.user} className="w-4 h-4" /> Tomar conversación
                                    </button>
                                )}
                                {convActual.modo === 'humano' && (
                                    <button onClick={() => atendida(true)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-700">
                                        <Svg d={I.bot} className="w-4 h-4" /> Atendida y devolver al bot
                                    </button>
                                )}
                                {convActual.estado !== 'atendida' && (
                                    <button onClick={() => atendida(false)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-700">
                                        <Svg d={I.check} className="w-4 h-4" /> Marcar atendida (sigo yo)
                                    </button>
                                )}
                            </div>
                        </div>

                        {mensajes.some(m => m.mediaUrl && (m.tipo === 'imagen' || m.tipo === 'documento')) && (
                            <div>
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Archivos compartidos</p>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {mensajes.filter(m => m.mediaUrl && m.tipo === 'imagen').slice(-9).reverse().map(m => (
                                        <button key={m.idMensaje} onClick={() => setLightbox(m.mediaUrl)} className="aspect-square rounded overflow-hidden bg-slate-100">
                                            <img src={m.mediaUrl!} alt="" className="w-full h-full object-cover" loading="lazy" />
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-2 space-y-1">
                                    {mensajes.filter(m => m.mediaUrl && m.tipo === 'documento').slice(-5).reverse().map(m => (
                                        <a key={m.idMensaje} href={m.mediaUrl!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-slate-600 hover:text-sky-700 truncate">
                                            <Svg d={I.doc} className="w-4 h-4 flex-shrink-0" /><span className="truncate">{m.mediaNombre || 'Documento'}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            )}
            </div>

            {lightbox && (
                <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
                    <img src={lightbox} alt="" className="max-w-full max-h-full rounded shadow-2xl" onClick={e => e.stopPropagation()} />
                    <div className="absolute top-4 right-4 flex gap-2">
                        <a href={lightbox} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20" title="Abrir original">
                            <Svg d={I.download} />
                        </a>
                        <button onClick={() => setLightbox(null)} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20" title="Cerrar (Esc)">
                            <Svg d={I.close} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
