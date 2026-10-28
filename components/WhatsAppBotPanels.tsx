import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/supabaseApi';
import { BloqueoCentro, PreReserva, Profesional, ProspectoBot, TurnoSinConfirmar } from '../types';

// ─── Helpers compartidos con el inbox ───────────────────────────────────────

// Horario de secretaría (debe coincidir con TURNOS_SECRETARIA del bot en n8n, v9).
const TURNOS_SECRETARIA = [
    { dia: 1, inicio: 10 * 60, fin: 18 * 60 },
    { dia: 2, inicio: 13 * 60, fin: 21 * 60 },
    { dia: 3, inicio: 10 * 60, fin: 18 * 60 },
    { dia: 4, inicio: 13 * 60, fin: 21 * 60 },
    { dia: 5, inicio: 10 * 60, fin: 18 * 60 },
];

export function secretariaAbierta(ahora = new Date()): boolean {
    const ar = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    const min = ar.getHours() * 60 + ar.getMinutes();
    return TURNOS_SECRETARIA.some(t => t.dia === ar.getDay() && min >= t.inicio && min < t.fin);
}

export const HORARIO_SECRETARIA_TEXTO = 'Lun, Mié y Vie 10–18 · Mar y Jue 13–21';

// El bot guarda derivado_motivo como "<etiqueta>: <detalle>".
const ETIQUETAS_DERIVACION: { prefijo: string; corto: string; clase: string; urgente?: boolean }[] = [
    { prefijo: 'Mencionó síntomas', corto: 'Síntomas', clase: 'bg-red-100 text-red-700', urgente: true },
    { prefijo: 'Consulta de precios', corto: 'Precio', clase: 'bg-amber-100 text-amber-800' },
    { prefijo: 'Consulta de cobertura', corto: 'Cobertura', clase: 'bg-yellow-100 text-yellow-800' },
    { prefijo: 'Archivo recibido', corto: 'Archivo', clase: 'bg-teal-100 text-teal-700' },
    { prefijo: 'Dice ser paciente, no encontrado', corto: 'No encontrado', clase: 'bg-orange-100 text-orange-800' },
    { prefijo: 'Pedido del Dr. Brahin', corto: 'Dr. Brahin', clase: 'bg-violet-100 text-violet-700' },
    { prefijo: 'Fallo de agenda', corto: 'Fallo agenda', clase: 'bg-rose-100 text-rose-700' },
    { prefijo: 'Pide hablar con una persona', corto: 'Pide humano', clase: 'bg-sky-100 text-sky-700' },
    { prefijo: 'Pre-reserva pendiente', corto: 'Pre-reserva', clase: 'bg-emerald-100 text-emerald-700' },
    { prefijo: 'Nuevo prospecto', corto: 'Prospecto', clase: 'bg-indigo-100 text-indigo-700' },
    { prefijo: 'Derivación', corto: 'Derivada', clase: 'bg-amber-100 text-amber-800' },
];

export const esDerivacionArchivo = (motivo: string | null) => (motivo ?? '').startsWith('Archivo recibido');

// Misma regla que COBERTURA DE LA PRIMERA CONSULTA del prompt: así la secretaría ve lo que el bot le dijo a la persona.
export function coberturaPrimeraConsulta(obraSocial: string | null, apellidoProfesional: string): { particular: boolean; texto: string } {
    const os = (obraSocial ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const ap = apellidoProfesional.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const sinOS = !os || /particular|no tiene|ninguna|sin obra/.test(os);
    const siempreParticular = sinOS || /osde|pami|galeno/.test(os);
    const swissNoMendoza = /swiss/.test(os) && /posse|brahi[nm]|alascio/.test(ap);
    if (siempreParticular || swissNoMendoza) {
        return { particular: true, texto: 'El bot le informó consulta particular: hay que pasarle el valor al confirmar.' };
    }
    return { particular: false, texto: 'El bot le informó consulta con obra social: verificar la cobertura al confirmar.' };
}

// Etapas del rescate automático de prospectos (cron de envíos del bot)
export const ETAPAS_RESCATE: { key: 'rescateTibioAt' | 'rescateFrioAt' | 'rescateHibernadoAt'; label: string; cuando: string }[] = [
    { key: 'rescateTibioAt', label: 'Tibio', cuando: '3 días sin responder' },
    { key: 'rescateFrioAt', label: 'Frío', cuando: '15 días' },
    { key: 'rescateHibernadoAt', label: 'Hibernado', cuando: '60 días' },
];

export const VirtualChip = () => (
    <span className="text-[10px] font-semibold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">Virtual</span>
);

export function infoDerivacion(motivo: string | null): { corto: string; detalle: string; clase: string; urgente: boolean } {
    const m = motivo ?? '';
    const e = ETIQUETAS_DERIVACION.find(x => m.startsWith(x.prefijo));
    if (!e) return { corto: 'Derivada', detalle: m, clase: 'bg-amber-100 text-amber-800', urgente: false };
    const detalle = m.slice(e.prefijo.length).replace(/^[:\s]+/, '');
    return { corto: e.corto, detalle, clase: e.clase, urgente: !!e.urgente };
}

export const CLASE_ESTADO_PROSPECTO: Record<string, string> = {
    'Nuevo': 'bg-slate-100 text-slate-700',
    'Contactado': 'bg-sky-100 text-sky-700',
    'Interesado': 'bg-indigo-100 text-indigo-700',
    'Pre-reserva': 'bg-emerald-100 text-emerald-700',
    'Paciente': 'bg-green-100 text-green-700',
    'Tibio': 'bg-amber-100 text-amber-700',
    'Frio': 'bg-blue-100 text-blue-700',
    'Frío': 'bg-blue-100 text-blue-700',
    'Hibernado': 'bg-slate-200 text-slate-600',
    'Descartado': 'bg-red-100 text-red-700',
};

export const DATOS_PROSPECTO: { key: keyof ProspectoBot; label: string }[] = [
    { key: 'nombres', label: 'Nombre' },
    { key: 'apellido', label: 'Apellido' },
    { key: 'dni', label: 'DNI' },
    { key: 'fechaNacimiento', label: 'Nacimiento' },
    { key: 'obraSocial', label: 'Obra social' },
    { key: 'nroAfiliado', label: 'N° afiliado' },
];

export function fmtFechaCorta(isoFecha: string | null): string {
    if (!isoFecha) return '';
    return isoFecha.slice(0, 10).split('-').reverse().join('/');
}

export function fmtTurno(iso: string): string {
    const d = new Date(iso);
    return `${d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })} · ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}`;
}

function nombreProf(equipo: Profesional[], email: string): string {
    const p = equipo.find(x => x.email === email);
    return p ? `${p.nombres} ${p.apellido}`.trim() : email;
}

// ─── Tarjeta de pre-reserva (se usa en el panel y en el detalle del chat) ───

export function TarjetaPreReserva({
    pr, equipo, email, onHecho, onAbrirConversacion, compacta = false,
}: {
    pr: PreReserva;
    equipo: Profesional[];
    email: string;
    onHecho: () => void;
    onAbrirConversacion?: (telefono: string) => void;
    compacta?: boolean;
}) {
    const [trabajando, setTrabajando] = useState<'confirmar' | 'rechazar' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const p = pr.prospecto;
    const horasFaltan = (new Date(pr.fechaTurno).getTime() - Date.now()) / 3600000;
    const vencida = horasFaltan < 0;
    const urgente = !vencida && horasFaltan < 24;
    const cobertura = p ? coberturaPrimeraConsulta(p.obraSocial, equipo.find(x => x.email === pr.profesionalEmail)?.apellido ?? '') : null;

    const confirmar = async () => {
        setTrabajando('confirmar'); setError(null);
        try { await api.confirmarPreReserva(pr.idTurno, email); onHecho(); }
        catch (e: any) { setError(e?.message ?? 'No se pudo confirmar.'); }
        finally { setTrabajando(null); }
    };
    const rechazar = async () => {
        if (!window.confirm('¿Rechazar la pre-reserva? Se libera el horario y el prospecto vuelve a "Interesado". Avisale al paciente por el chat.')) return;
        setTrabajando('rechazar'); setError(null);
        try { await api.rechazarPreReserva(pr.idTurno, pr.idContacto); onHecho(); }
        catch (e: any) { setError(e?.message ?? 'No se pudo rechazar.'); }
        finally { setTrabajando(null); }
    };

    return (
        <div className={`rounded-xl border bg-white ${urgente || vencida ? 'border-amber-300' : 'border-slate-200'} ${compacta ? 'p-3' : 'p-4'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">
                        {p ? `${p.nombres ?? ''} ${p.apellido ?? ''}`.trim() || 'Sin nombre' : 'Prospecto'}
                    </p>
                    <p className="text-sm text-slate-600 flex items-center gap-1.5 flex-wrap">
                        {fmtTurno(pr.fechaTurno)} · {nombreProf(equipo, pr.profesionalEmail)}
                        {pr.virtual && <VirtualChip />}
                    </p>
                </div>
                {vencida
                    ? <span className="text-[11px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded flex-shrink-0">Turno pasado</span>
                    : urgente
                        ? <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded flex-shrink-0">Menos de 24 h</span>
                        : <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded flex-shrink-0">Pendiente</span>}
            </div>

            {p && !compacta && (
                <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                    <div><dt className="text-slate-400">DNI</dt><dd className="text-slate-700">{p.dni || '—'}</dd></div>
                    <div><dt className="text-slate-400">Nacimiento</dt><dd className="text-slate-700">{fmtFechaCorta(p.fechaNacimiento) || '—'}</dd></div>
                    <div><dt className="text-slate-400">Obra social</dt><dd className="text-slate-700">{p.obraSocial || '—'}{p.nroAfiliado ? ` · ${p.nroAfiliado}` : ''}</dd></div>
                    {p.motivo && <div className="col-span-full"><dt className="text-slate-400">Motivo</dt><dd className="text-slate-700">{p.motivo}</dd></div>}
                    {(p.contactoNombre || p.contactoVinculo) && (
                        <div className="col-span-full"><dt className="text-slate-400">Escribe un tercero</dt><dd className="text-slate-700">{[p.contactoNombre, p.contactoVinculo].filter(Boolean).join(' · ')}</dd></div>
                    )}
                </dl>
            )}

            {cobertura && (
                <p className={`mt-2 text-[11px] rounded px-2 py-1 ${cobertura.particular ? 'bg-amber-50 text-amber-800' : 'bg-sky-50 text-sky-800'}`}>
                    {cobertura.particular ? 'Particular' : 'Con obra social'} · {cobertura.texto}
                </p>
            )}
            {pr.virtual && !compacta && (
                <p className="mt-1.5 text-[11px] text-violet-700">Consulta virtual: el día del turno hay que escribirle para registrar la consulta (y el pago si corresponde); después el profesional la llama por videollamada de WhatsApp.</p>
            )}

            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

            <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={confirmar} disabled={!!trabajando}
                    className="text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 rounded-lg">
                    {trabajando === 'confirmar' ? 'Confirmando…' : 'Confirmar y avisar'}
                </button>
                <button onClick={rechazar} disabled={!!trabajando}
                    className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-50 px-3 py-1.5 rounded-lg">
                    {trabajando === 'rechazar' ? 'Rechazando…' : 'Rechazar'}
                </button>
                {onAbrirConversacion && p?.telefono && (
                    <button onClick={() => onAbrirConversacion(p.telefono!)}
                        className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-lg">
                        Ver chat
                    </button>
                )}
            </div>
            {!compacta && <p className="mt-2 text-[11px] text-slate-400">Al confirmar, n8n crea la ficha del paciente y le envía la plantilla de confirmación por WhatsApp (presencial o virtual).</p>}
        </div>
    );
}

// ─── Panel de pre-reservas ──────────────────────────────────────────────────

export function PanelPreReservas({
    preReservas, equipo, email, onRecargar, onAbrirConversacion,
}: {
    preReservas: PreReserva[];
    equipo: Profesional[];
    email: string;
    onRecargar: () => void;
    onAbrirConversacion: (telefono: string) => void;
}) {
    return (
        <div className="h-full overflow-y-auto p-4 sm:p-6 bg-slate-50">
            <div className="max-w-3xl mx-auto space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">Pre-reservas de primera consulta</h2>
                    <p className="text-sm text-slate-500">
                        El bot las crea con los 5 datos del prospecto. Confirmalas o rechazalas antes del turno.
                    </p>
                </div>
                {preReservas.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
                        No hay pre-reservas pendientes.
                    </div>
                )}
                {preReservas.map(pr => (
                    <TarjetaPreReserva key={pr.idTurno} pr={pr} equipo={equipo} email={email}
                        onHecho={onRecargar} onAbrirConversacion={onAbrirConversacion} />
                ))}
            </div>
        </div>
    );
}

// ─── Panel de turnos sin confirmar ──────────────────────────────────────────

export function PanelSinConfirmar({
    turnos, equipo, email, onRecargar, conversacionDe, onAbrirConversacion,
}: {
    turnos: TurnoSinConfirmar[];
    equipo: Profesional[];
    email: string;
    onRecargar: () => void;
    conversacionDe: (telefono: string | null) => string | null;
    onAbrirConversacion: (telefono: string) => void;
}) {
    const [confirmando, setConfirmando] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState('');

    // Busca por paciente, teléfono o profesional, sin distinguir mayúsculas ni acentos.
    const filtrados = useMemo(() => {
        const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        const q = norm(busqueda.trim());
        if (!q) return turnos;
        const qDigitos = q.replace(/\D/g, '');
        return turnos.filter(t =>
            norm(`${t.paciente} ${nombreProf(equipo, t.profesionalEmail)}`).includes(q)
            || (qDigitos.length >= 3 && (t.telefono ?? '').replace(/\D/g, '').includes(qDigitos)));
    }, [turnos, busqueda, equipo]);

    const confirmar = async (t: TurnoSinConfirmar) => {
        if (!window.confirm(`Se marca el turno de ${t.paciente} como confirmado y se le envía la confirmación por WhatsApp. ¿Continuar?`)) return;
        setConfirmando(t.idTurno); setError(null);
        try { await api.confirmarTurnoYAvisarWhatsApp(t.idTurno, email); onRecargar(); }
        catch (e: any) { setError(e?.message ?? 'No se pudo confirmar el turno.'); }
        finally { setConfirmando(null); }
    };

    return (
        <div className="h-full overflow-y-auto p-4 sm:p-6 bg-slate-50">
            <div className="max-w-3xl mx-auto space-y-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">Turnos sin confirmar</h2>
                    <p className="text-sm text-slate-500">
                        Próximo día de atención. El paciente no tocó "Confirmo" en el recordatorio: llamalo y confirmá o reprogramá el turno.
                        A las 15 hs el bot deja una tarea con este listado.
                    </p>
                </div>
                {turnos.length > 0 && (
                    <input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar paciente, teléfono o profesional"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}
                {turnos.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
                        Todos los turnos del próximo día de atención están confirmados.
                    </div>
                )}
                {turnos.length > 0 && filtrados.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
                        Ningún turno coincide con "{busqueda}".
                    </div>
                )}
                {filtrados.map(t => {
                    const conv = conversacionDe(t.telefono);
                    return (
                        <div key={t.idTurno} className="rounded-xl border border-amber-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 truncate">{t.paciente}</p>
                                    <p className="text-sm text-slate-600 flex items-center gap-1.5 flex-wrap">
                                        {fmtTurno(t.fechaTurno)} · {nombreProf(equipo, t.profesionalEmail)}
                                        {t.virtual && <VirtualChip />}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">{t.telefono || 'Sin teléfono registrado'}</p>
                                </div>
                                {t.recordatorioEnviado
                                    ? <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded flex-shrink-0">Recordatorio sin respuesta</span>
                                    : <span className="text-[11px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded flex-shrink-0">Sin recordatorio</span>}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button onClick={() => confirmar(t)} disabled={confirmando === t.idTurno}
                                    className="text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 rounded-lg">
                                    {confirmando === t.idTurno ? 'Confirmando…' : 'Confirmar y avisar'}
                                </button>
                                {conv && (
                                    <button onClick={() => onAbrirConversacion(conv)}
                                        className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-lg">
                                        Ver chat
                                    </button>
                                )}
                                {t.telefono && (
                                    <a href={`tel:${t.telefono.replace(/[^\d+]/g, '')}`}
                                        className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-lg">
                                        Llamar
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Panel de configuración del bot ─────────────────────────────────────────

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function PanelConfigBot({ equipo, onEquipoCambiado }: { equipo: Profesional[]; onEquipoCambiado: () => void }) {
    const [bloqueos, setBloqueos] = useState<BloqueoCentro[]>([]);
    const [nuevaFecha, setNuevaFecha] = useState('');
    const [nuevoMotivo, setNuevoMotivo] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState<string | null>(null);

    const cargarBloqueos = () => api.getBloqueosCentro().then(setBloqueos).catch(e => setError(e?.message ?? 'No se pudieron cargar los cierres.'));
    useEffect(() => { cargarBloqueos(); }, []);

    const conAgenda = useMemo(
        () => equipo.filter(p => (p.config_turnos?.horarios ?? []).length > 0),
        [equipo],
    );

    const toggleBloque = async (campo: 'primeraVez' | 'virtual', email: string, bloqueId: string, valor: boolean) => {
        setGuardando(`${campo}:${bloqueId}`); setError(null);
        try {
            if (campo === 'primeraVez') await api.setCupoPrimeraVezBot(email, bloqueId, valor);
            else await api.setBloqueVirtualBot(email, bloqueId, valor);
            onEquipoCambiado();
        }
        catch (e: any) { setError(e?.message ?? 'No se pudo guardar.'); }
        finally { setGuardando(null); }
    };

    const agregar = async () => {
        if (!nuevaFecha) return;
        setError(null);
        try { await api.agregarBloqueoCentro(nuevaFecha, nuevoMotivo.trim()); setNuevaFecha(''); setNuevoMotivo(''); cargarBloqueos(); }
        catch (e: any) { setError(e?.message ?? 'No se pudo agregar.'); }
    };
    const quitar = async (b: BloqueoCentro) => {
        if (b.origen === 'api' && !window.confirm(`¿Se atiende el ${fmtFechaCorta(b.fecha)} (${b.motivo || 'feriado'})? El bot va a ofrecer turnos ese día.`)) return;
        try { await api.eliminarBloqueoCentro(b.fecha, b.origen); cargarBloqueos(); }
        catch (e: any) { setError(e?.message ?? 'No se pudo eliminar.'); }
    };
    const restaurar = async (fecha: string) => {
        try { await api.restaurarFeriado(fecha); cargarBloqueos(); }
        catch (e: any) { setError(e?.message ?? 'No se pudo restaurar el feriado.'); }
    };

    // Días puntuales en que un profesional no atiende (config_turnos.diasBloqueados)
    const [profDia, setProfDia] = useState('');
    const [fechaDia, setFechaDia] = useState('');
    const hoyISO = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
    const diasProfesionales = useMemo(
        () => conAgenda.flatMap(p => ((p.config_turnos?.diasBloqueados ?? []) as string[])
            .filter(d => d >= hoyISO)
            .map(d => ({ email: p.email, nombre: `${p.nombres} ${p.apellido}`.trim(), fecha: d })))
            .sort((a, b) => a.fecha.localeCompare(b.fecha)),
        [conAgenda, hoyISO],
    );
    const bloquearDia = async (email: string, fecha: string, bloquear: boolean) => {
        setGuardando(`dia:${email}:${fecha}`); setError(null);
        try {
            await api.setDiaBloqueadoProfesional(email, fecha, bloquear);
            if (bloquear) setFechaDia('');
            onEquipoCambiado();
        }
        catch (e: any) { setError(e?.message ?? 'No se pudo guardar el día.'); }
        finally { setGuardando(null); }
    };

    const abierta = secretariaAbierta();

    return (
        <div className="h-full overflow-y-auto p-4 sm:p-6 bg-slate-50">
            <div className="max-w-3xl mx-auto space-y-6">
                {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

                <section className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-slate-800">Horario de secretaría</h3>
                            <p className="text-sm text-slate-500">{HORARIO_SECRETARIA_TEXTO}. El bot lo usa para avisar cuándo responde una persona y para no ofrecer turnos de primera vez antes del próximo cierre.</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${abierta ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {abierta ? 'Abierta ahora' : 'Cerrada ahora'}
                        </span>
                    </div>
                </section>

                <section className="bg-white rounded-xl border border-slate-200 p-4">
                    <h3 className="font-semibold text-slate-800">Bloques de agenda para el bot</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        <span className="font-medium text-emerald-700">1ª vez</span>: bloques donde el bot puede pre-reservar primeras consultas (si no marcás ninguno, ofrece todos los horarios del profesional). A los pacientes ya registrados el bot les ofrece todos los bloques.{' '}
                        <span className="font-medium text-violet-700">Virtual</span>: el bot ofrece esos horarios como consulta por videollamada de WhatsApp.
                    </p>
                    {conAgenda.length === 0 && <p className="text-sm text-slate-400">No hay profesionales con horarios configurados.</p>}
                    <div className="space-y-4">
                        {conAgenda.map(p => {
                            const bloques = [...(p.config_turnos?.horarios ?? [])].sort((a: any, b: any) => (Number(a.dia) - Number(b.dia)) || String(a.horaInicio).localeCompare(String(b.horaInicio)));
                            const activos = bloques.filter((b: any) => b.primeraVezBot === true).length;
                            return (
                                <div key={p.email} className="border border-slate-100 rounded-lg">
                                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-t-lg">
                                        <p className="text-sm font-medium text-slate-800">{p.nombres} {p.apellido} <span className="text-slate-400 font-normal">· {p.especialidad || 'Sin especialidad'}</span></p>
                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${activos ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {activos ? `Solo ${activos} bloque${activos > 1 ? 's' : ''}` : 'Todos sus horarios'}
                                        </span>
                                    </div>
                                    <div className="p-2 flex flex-wrap gap-2">
                                        {bloques.map((b: any) => {
                                            const primera = b.primeraVezBot === true;
                                            const virtual = b.virtual === true;
                                            const chip = (on: boolean, color: string) =>
                                                `text-[11px] font-medium px-2 py-1 rounded-md border transition-colors disabled:opacity-50 ${on ? color : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`;
                                            return (
                                                <div key={b.id} className={`flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg border ${virtual ? 'border-violet-200 bg-violet-50/40' : 'border-slate-200'}`}>
                                                    <span className="text-xs text-slate-700"><span className="font-semibold">{DIAS[Number(b.dia)]?.slice(0, 3)}</span> {b.horaInicio}–{b.horaFin}</span>
                                                    <button disabled={guardando === `primeraVez:${b.id}`} onClick={() => toggleBloque('primeraVez', p.email, b.id, !primera)}
                                                        className={chip(primera, 'bg-emerald-50 border-emerald-300 text-emerald-800')}>
                                                        1ª vez{primera ? ' ✓' : ''}
                                                    </button>
                                                    <button disabled={guardando === `virtual:${b.id}`} onClick={() => toggleBloque('virtual', p.email, b.id, !virtual)}
                                                        className={chip(virtual, 'bg-violet-50 border-violet-300 text-violet-800')}>
                                                        Virtual{virtual ? ' ✓' : ''}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="bg-white rounded-xl border border-slate-200 p-4">
                    <h3 className="font-semibold text-slate-800">Días sin atención del centro</h3>
                    <p className="text-sm text-slate-500 mb-3">
                        El bot no ofrece turnos en estas fechas. Los feriados nacionales se cargan solos cada mañana; acá podés sumar cierres propios.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <input type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)}
                            className="text-sm rounded-lg border border-slate-300 px-2.5 py-1.5" />
                        <input type="text" value={nuevoMotivo} onChange={e => setNuevoMotivo(e.target.value)} placeholder="Motivo (ej: Congreso)"
                            className="text-sm rounded-lg border border-slate-300 px-2.5 py-1.5 flex-grow min-w-[10rem]" />
                        <button onClick={agregar} disabled={!nuevaFecha}
                            className="text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 px-3 py-1.5 rounded-lg">Agregar</button>
                    </div>
                    <ul className="divide-y divide-slate-100">
                        {bloqueos.length === 0 && <li className="text-sm text-slate-400 py-2">No hay cierres próximos cargados.</li>}
                        {bloqueos.map(b => {
                            const anulado = b.origen === 'anulado';
                            return (
                                <li key={b.fecha} className="flex items-center justify-between py-2 gap-3">
                                    <div className={`min-w-0 ${anulado ? 'opacity-60' : ''}`}>
                                        <span className={`text-sm font-medium text-slate-700 ${anulado ? 'line-through' : ''}`}>{fmtFechaCorta(b.fecha)}</span>
                                        <span className="text-sm text-slate-500"> · {b.motivo || 'Sin motivo'}</span>
                                        {b.origen === 'api' && <span className="ml-2 text-[10px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">automático</span>}
                                        {anulado && <span className="ml-2 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">se atiende</span>}
                                    </div>
                                    {anulado
                                        ? <button onClick={() => restaurar(b.fecha)} className="text-xs text-sky-700 hover:underline flex-shrink-0">Volver a cerrar</button>
                                        : <button onClick={() => quitar(b)} className="text-xs text-red-600 hover:underline flex-shrink-0">{b.origen === 'api' ? 'Se atiende igual' : 'Quitar'}</button>}
                                </li>
                            );
                        })}
                    </ul>
                </section>

                <section className="bg-white rounded-xl border border-slate-200 p-4">
                    <h3 className="font-semibold text-slate-800">Días que no atiende un profesional</h3>
                    <p className="text-sm text-slate-500 mb-3">
                        Para un día puntual (congreso, licencia, cirugías). El bot no ofrece turnos de ese profesional ese día. Los turnos ya dados no se cancelan: revisalos en la agenda.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <select value={profDia} onChange={e => setProfDia(e.target.value)}
                            className="text-sm rounded-lg border border-slate-300 px-2.5 py-1.5 flex-grow min-w-[12rem]">
                            <option value="">Elegí un profesional…</option>
                            {conAgenda.map(p => <option key={p.email} value={p.email}>{p.nombres} {p.apellido}</option>)}
                        </select>
                        <input type="date" value={fechaDia} min={hoyISO} onChange={e => setFechaDia(e.target.value)}
                            className="text-sm rounded-lg border border-slate-300 px-2.5 py-1.5" />
                        <button onClick={() => bloquearDia(profDia, fechaDia, true)} disabled={!profDia || !fechaDia || !!guardando}
                            className="text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 px-3 py-1.5 rounded-lg">Bloquear día</button>
                    </div>
                    <ul className="divide-y divide-slate-100">
                        {diasProfesionales.length === 0 && <li className="text-sm text-slate-400 py-2">No hay días bloqueados próximos.</li>}
                        {diasProfesionales.map(d => (
                            <li key={`${d.email}:${d.fecha}`} className="flex items-center justify-between py-2 gap-3">
                                <span className="text-sm text-slate-700"><span className="font-medium">{fmtFechaCorta(d.fecha)}</span> · {d.nombre}</span>
                                <button onClick={() => bloquearDia(d.email, d.fecha, false)} disabled={guardando === `dia:${d.email}:${d.fecha}`}
                                    className="text-xs text-red-600 hover:underline flex-shrink-0 disabled:opacity-50">Quitar</button>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="bg-white rounded-xl border border-slate-200 p-4">
                    <h3 className="font-semibold text-slate-800">Mensajes automáticos (plantillas de Meta)</h3>
                    <p className="text-sm text-slate-500 mb-3">
                        Fuera de las 24 h WhatsApp solo deja escribir con plantillas aprobadas. Tienen que existir en Meta en español (es_AR) con estos nombres y variables, o configurarse en las Variables de n8n.
                    </p>
                    <ul className="divide-y divide-slate-100 text-sm">
                        {PLANTILLAS_BOT.map(t => (
                            <li key={t.nombre} className="py-2 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                                <span>
                                    <code className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{t.nombre}</code>
                                    <span className="text-slate-600"> · {t.uso}</span>
                                </span>
                                <span className="text-xs text-slate-400 sm:text-right">{t.variables}{t.interruptor ? ` · se activa con ${t.interruptor}=true` : ''}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}

const PLANTILLAS_BOT: { nombre: string; uso: string; variables: string; interruptor?: string }[] = [
    { nombre: 'plenus_confirmacion_turno', uso: 'Confirmación de turno presencial', variables: '{{1}} nombre, {{2}} profesional, {{3}} día, {{4}} hora' },
    { nombre: 'plenus_confirmacion_virtual', uso: 'Confirmación de consulta virtual', variables: 'igual + {{5}} profesional' },
    { nombre: 'plenus_recordatorio_24h', uso: 'Recordatorio del día anterior (8 h) con botón "Confirmo"', variables: '{{1}} nombre, {{2}} día, {{3}} hora, {{4}} profesional' },
    { nombre: 'plenus_aviso_ausencia', uso: 'Aviso cuando el paciente faltó', variables: '{{1}} nombre, {{2}} profesional, {{3}} día', interruptor: 'AUSENCIA_ACTIVO' },
    { nombre: 'plenus_rescate_tibio', uso: 'Rescate de prospecto a los 3 días', variables: '{{1}} nombre', interruptor: 'RESCATE_ACTIVO' },
    { nombre: 'plenus_rescate_frio', uso: 'Rescate a los 15 días', variables: '{{1}} nombre', interruptor: 'RESCATE_ACTIVO' },
    { nombre: 'plenus_rescate_hibernado', uso: 'Rescate a los 60 días (con opción BAJA)', variables: '{{1}} nombre', interruptor: 'RESCATE_ACTIVO' },
];
