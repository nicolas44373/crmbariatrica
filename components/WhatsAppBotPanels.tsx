import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/supabaseApi';
import { BloqueoCentro, PreReserva, Profesional, ProspectoBot } from '../types';

// ─── Helpers compartidos con el inbox ───────────────────────────────────────

// Horario de secretaría (debe coincidir con TURNOS_SECRETARIA del bot en n8n).
const TURNOS_SECRETARIA = [
    { dia: 1, inicio: 10 * 60, fin: 16 * 60 },
    { dia: 2, inicio: 16 * 60, fin: 21 * 60 },
    { dia: 4, inicio: 16 * 60, fin: 21 * 60 },
];

export function secretariaAbierta(ahora = new Date()): boolean {
    const ar = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    const min = ar.getHours() * 60 + ar.getMinutes();
    return TURNOS_SECRETARIA.some(t => t.dia === ar.getDay() && min >= t.inicio && min < t.fin);
}

export const HORARIO_SECRETARIA_TEXTO = 'Lun 10–16 · Mar y Jue 16–21';

// El bot guarda derivado_motivo como "<etiqueta>: <detalle>".
const ETIQUETAS_DERIVACION: { prefijo: string; corto: string; clase: string; urgente?: boolean }[] = [
    { prefijo: 'Mencionó síntomas', corto: 'Síntomas', clase: 'bg-red-100 text-red-700', urgente: true },
    { prefijo: 'Consulta de precios', corto: 'Precio', clase: 'bg-amber-100 text-amber-800' },
    { prefijo: 'Dice ser paciente, no encontrado', corto: 'No encontrado', clase: 'bg-orange-100 text-orange-800' },
    { prefijo: 'Pedido del Dr. Brahin', corto: 'Dr. Brahin', clase: 'bg-violet-100 text-violet-700' },
    { prefijo: 'Fallo de agenda', corto: 'Fallo agenda', clase: 'bg-rose-100 text-rose-700' },
    { prefijo: 'Pide hablar con una persona', corto: 'Pide humano', clase: 'bg-sky-100 text-sky-700' },
    { prefijo: 'Pre-reserva pendiente', corto: 'Pre-reserva', clase: 'bg-emerald-100 text-emerald-700' },
    { prefijo: 'Nuevo prospecto', corto: 'Prospecto', clase: 'bg-indigo-100 text-indigo-700' },
];

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
                    <p className="text-sm text-slate-600">{fmtTurno(pr.fechaTurno)} · {nombreProf(equipo, pr.profesionalEmail)}</p>
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
            {!compacta && <p className="mt-2 text-[11px] text-slate-400">Al confirmar, n8n crea la ficha del paciente y le envía la plantilla de confirmación por WhatsApp.</p>}
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

    const toggleCupo = async (email: string, bloqueId: string, valor: boolean) => {
        setGuardando(bloqueId); setError(null);
        try { await api.setCupoPrimeraVezBot(email, bloqueId, valor); onEquipoCambiado(); }
        catch (e: any) { setError(e?.message ?? 'No se pudo guardar.'); }
        finally { setGuardando(null); }
    };

    const agregar = async () => {
        if (!nuevaFecha) return;
        setError(null);
        try { await api.agregarBloqueoCentro(nuevaFecha, nuevoMotivo.trim()); setNuevaFecha(''); setNuevoMotivo(''); cargarBloqueos(); }
        catch (e: any) { setError(e?.message ?? 'No se pudo agregar.'); }
    };
    const quitar = async (fecha: string) => {
        try { await api.eliminarBloqueoCentro(fecha); cargarBloqueos(); }
        catch (e: any) { setError(e?.message ?? 'No se pudo eliminar.'); }
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
                    <h3 className="font-semibold text-slate-800">Cupos de primera consulta para el bot</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Marcá en qué bloques el bot puede ofrecer pre-reservas de primera vez. Si no marcás ninguno, el bot ofrece todos los horarios del profesional.
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
                                            const on = b.primeraVezBot === true;
                                            return (
                                                <button key={b.id} disabled={guardando === b.id}
                                                    onClick={() => toggleCupo(p.email, b.id, !on)}
                                                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${on ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                                    <span className="font-semibold">{DIAS[Number(b.dia)]?.slice(0, 3)}</span> {b.horaInicio}–{b.horaFin} {on ? '✓' : ''}
                                                </button>
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
                        {bloqueos.map(b => (
                            <li key={b.fecha} className="flex items-center justify-between py-2 gap-3">
                                <div className="min-w-0">
                                    <span className="text-sm font-medium text-slate-700">{fmtFechaCorta(b.fecha)}</span>
                                    <span className="text-sm text-slate-500"> · {b.motivo || 'Sin motivo'}</span>
                                    {b.origen === 'api' && <span className="ml-2 text-[10px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">automático</span>}
                                </div>
                                <button onClick={() => quitar(b.fecha)} className="text-xs text-red-600 hover:underline flex-shrink-0">Quitar</button>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}
