import React, { useState, useEffect, useCallback, useContext } from 'react';
import { ContactoCRM, Turno, EstadoTurnoDia } from '../types';
import { api } from '../services/mockApi';
import { AuthContext } from '../App';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Íconos locales ───────────────────────────────────────────────────────────
const CalendarDaysIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-4 h-4'}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18" />
    </svg>
);

const HistoryIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// ─── EstadoTurnoBadge ─────────────────────────────────────────────────────────
const ESTADO_BADGE_MAP: Partial<Record<EstadoTurnoDia, { text: string; color: string }>> = {
    [EstadoTurnoDia.AGENDADO]:   { text: 'Agendado',   color: 'bg-blue-100 text-blue-800' },
    [EstadoTurnoDia.CONFIRMADO]: { text: 'Confirmado', color: 'bg-indigo-100 text-indigo-800' },
    [EstadoTurnoDia.EN_ESPERA]:  { text: 'En espera',  color: 'bg-yellow-100 text-yellow-800' },
    [EstadoTurnoDia.ATENDIDO]:   { text: 'Atendido',   color: 'bg-green-100 text-green-800' },
    [EstadoTurnoDia.CANCELADO]:  { text: 'Cancelado',  color: 'bg-slate-100 text-slate-500' },
};

const EstadoTurnoBadge = ({ estado }: { estado: EstadoTurnoDia }) => {
    const info = ESTADO_BADGE_MAP[estado] ?? { text: estado, color: 'bg-slate-100 text-slate-700' };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${info.color}`}>
            {info.text}
        </span>
    );
};

// ─── TurnHistoryModal ─────────────────────────────────────────────────────────
interface TurnHistoryModalProps {
    onClose: () => void;
    contacto: Pick<ContactoCRM, 'id' | 'firstName' | 'lastName'> | null;
}

export const TurnHistoryModal = ({ onClose, contacto }: TurnHistoryModalProps) => {
    const authContext = useContext(AuthContext);
    const userEmail = authContext?.user?.email ?? '';

    const [turnos, setTurnos]           = useState<Turno[]>([]);
    const [isLoading, setIsLoading]     = useState(true);
    const [error, setError]             = useState<string | null>(null);
    const [editingTurno, setEditingTurno] = useState<Turno | null>(null);
    const [isSaving, setIsSaving]       = useState(false);
    const [saveError, setSaveError]     = useState<string | null>(null);

    const fetchTurnos = useCallback(() => {
        if (!contacto) return;
        setIsLoading(true);
        setError(null);
        api.getPacienteCompleto(contacto.id, userEmail)
            .then(p => setTurnos(p.turnos ?? []))
            .catch(() => setError('No se pudo cargar el historial de turnos.'))
            .finally(() => setIsLoading(false));
    }, [contacto, userEmail]);

    useEffect(() => { fetchTurnos(); }, [fetchTurnos]);

    if (!contacto) return null;

    const now = new Date();
    const turnosFuturos = [...turnos]
        .filter(t => new Date(t.fechaTurno) >= now)
        .sort((a, b) => new Date(a.fechaTurno).getTime() - new Date(b.fechaTurno).getTime());
    const turnosPasados = [...turnos]
        .filter(t => new Date(t.fechaTurno) < now)
        .sort((a, b) => new Date(b.fechaTurno).getTime() - new Date(a.fechaTurno).getTime());

    const handleCancelar = async (turno: Turno) => {
        if (!window.confirm('¿Confirma que desea cancelar este turno?')) return;
        setIsSaving(true);
        setSaveError(null);
        try {
            const user = await api.getProfesional(userEmail);
            await api.updateDetallesTurno(turno.idTurno, { estado: EstadoTurnoDia.CANCELADO }, user);
            fetchTurnos();
        } catch {
            setSaveError('No se pudo cancelar el turno.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGuardarEdicion = async () => {
        if (!editingTurno) return;
        setIsSaving(true);
        setSaveError(null);
        try {
            const user = await api.getProfesional(userEmail);
            await api.updateDetallesTurno(editingTurno.idTurno, {
                fechaTurno:  editingTurno.fechaTurno,
                estado:      editingTurno.estado,
                notaInterna: editingTurno.notaInterna,
            }, user);
            setEditingTurno(null);
            fetchTurnos();
        } catch (e: any) {
            setSaveError(e?.message || 'No se pudo guardar los cambios.');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Modal de edición ──────────────────────────────────────────────────────
    if (editingTurno) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-bold text-slate-800">Editar Turno</h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {contacto.lastName}, {contacto.firstName}
                        </p>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha y hora</label>
                            <input
                                type="datetime-local"
                                value={format(new Date(editingTurno.fechaTurno), "yyyy-MM-dd'T'HH:mm")}
                                onChange={e => setEditingTurno(prev =>
                                    prev ? { ...prev, fechaTurno: new Date(e.target.value).toISOString() } : prev
                                )}
                                className="w-full rounded-md border-slate-300 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                            <select
                                value={editingTurno.estado}
                                onChange={e => setEditingTurno(prev =>
                                    prev ? { ...prev, estado: e.target.value as EstadoTurnoDia } : prev
                                )}
                                className="w-full rounded-md border-slate-300 text-sm"
                            >
                                {Object.values(EstadoTurnoDia).map(e => (
                                    <option key={e} value={e}>{e}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nota interna</label>
                            <textarea
                                value={editingTurno.notaInterna ?? ''}
                                onChange={e => setEditingTurno(prev =>
                                    prev ? { ...prev, notaInterna: e.target.value } : prev
                                )}
                                rows={3}
                                className="w-full rounded-md border-slate-300 text-sm resize-none"
                                placeholder="Nota opcional..."
                            />
                        </div>
                        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                    </div>
                    <div className="p-4 border-t flex justify-end gap-3">
                        <button
                            onClick={() => { setEditingTurno(null); setSaveError(null); }}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleGuardarEdicion}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Fila de turno con acciones ────────────────────────────────────────────
    const TurnoRowEditable = ({ t }: { key?: React.Key; t: Turno }) => (
        <div className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border gap-3">
            <div className="flex-grow min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                    {format(new Date(t.fechaTurno), 'EEEE dd/MM/yyyy', { locale: es })}
                    {' — '}
                    {format(new Date(t.fechaTurno), 'HH:mm')}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                    {t.especialidad || 'Sin especialidad'}
                    {t.esVideoconsulta && ' · Videoconsulta'}
                    {t.esSobreturno   && ' · Sobreturno'}
                </p>
                {t.notaInterna && (
                    <p className="text-xs text-slate-400 mt-0.5 italic">"{t.notaInterna}"</p>
                )}
                {t.valorCobrado ? (
                    <p className="text-xs text-green-700 mt-0.5 font-medium">
                        Cobrado: ${t.valorCobrado.toLocaleString('es-AR')}
                        {t.metodoPago ? ` (${t.metodoPago})` : ''}
                    </p>
                ) : null}
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <EstadoTurnoBadge estado={t.estado} />
                {t.estado !== EstadoTurnoDia.CANCELADO && t.estado !== EstadoTurnoDia.ATENDIDO && (
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => { setSaveError(null); setEditingTurno(t); }}
                            title="Editar / reagendar"
                            className="p-1.5 text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => handleCancelar(t)}
                            title="Cancelar turno"
                            disabled={isSaving}
                            className="p-1.5 text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    // ── Vista principal ───────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 flex flex-col max-h-[85vh]">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">
                        Historial de Turnos — {contacto.lastName}, {contacto.firstName}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {turnos.length} turno{turnos.length !== 1 ? 's' : ''} en total
                    </p>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-5">
                    {isLoading && <p className="text-center text-slate-500 py-8">Cargando...</p>}
                    {error    && <p className="text-center text-red-500 py-8">{error}</p>}
                    {!isLoading && !error && (
                        <>
                            {turnosFuturos.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <CalendarDaysIcon className="w-4 h-4" /> Próximos ({turnosFuturos.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {turnosFuturos.map(t => <TurnoRowEditable key={t.idTurno} t={t} />)}
                                    </div>
                                </div>
                            )}
                            {turnosPasados.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <HistoryIcon className="w-4 h-4" /> Anteriores ({turnosPasados.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {turnosPasados.map(t => <TurnoRowEditable key={t.idTurno} t={t} />)}
                                    </div>
                                </div>
                            )}
                            {turnos.length === 0 && (
                                <p className="text-center text-slate-400 py-8">
                                    Este paciente no tiene turnos registrados.
                                </p>
                            )}
                        </>
                    )}
                </div>

                {saveError && (
                    <p className="text-sm text-red-600 text-center px-4 pb-2">{saveError}</p>
                )}
                <div className="p-4 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};