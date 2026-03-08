import React, { useState, useEffect, useCallback } from 'react';
import { Profesional, UserRole } from '../types';
import { api } from '../services/mockApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HorarioBloque {
    id: string;
    dia: number;       // 0=Dom, 1=Lun, …, 6=Sáb
    horaInicio: string;
    horaFin: string;
}

interface ConfigTurnos {
    horarios: HorarioBloque[];
    diasBloqueados: string[];
    horariosEspeciales: any[];
    duracionTurnoMinutos: number;
}

interface ProfesionalForm {
    email: string;
    nombres: string;
    apellido: string;
    rol: UserRole;
    especialidad: string;
    matricula: string;
    telefono: string;
    activo: boolean;
    config_turnos: ConfigTurnos;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIAS = [
    { num: 1, label: 'Lunes',     short: 'Lun' },
    { num: 2, label: 'Martes',    short: 'Mar' },
    { num: 3, label: 'Miércoles', short: 'Mié' },
    { num: 4, label: 'Jueves',    short: 'Jue' },
    { num: 5, label: 'Viernes',   short: 'Vie' },
    { num: 6, label: 'Sábado',    short: 'Sáb' },
    { num: 0, label: 'Domingo',   short: 'Dom' },
];

const DURACIONES = [10, 15, 20, 30, 45, 60, 90];

const defaultConfig = (): ConfigTurnos => ({
    horarios: [],
    diasBloqueados: [],
    horariosEspeciales: [],
    duracionTurnoMinutos: 20,
});

const defaultForm = (): ProfesionalForm => ({
    email: '',
    nombres: '',
    apellido: '',
    rol: UserRole.MEDICO,
    especialidad: '',
    matricula: '',
    telefono: '',
    activo: true,
    config_turnos: defaultConfig(),
});

// ─── Icons ────────────────────────────────────────────────────────────────────

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.077-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18" />
    </svg>
);

// ─── Schedule Builder Sub-component ──────────────────────────────────────────

const ScheduleBuilder = ({
    config,
    onChange,
}: {
    config: ConfigTurnos;
    onChange: (config: ConfigTurnos) => void;
}) => {
    const addBloque = (dia: number) => {
        const newBloque: HorarioBloque = {
            id: `bloque-${Date.now()}`,
            dia,
            horaInicio: '09:00',
            horaFin: '13:00',
        };
        onChange({ ...config, horarios: [...config.horarios, newBloque] });
    };

    const removeBloque = (id: string) => {
        onChange({ ...config, horarios: config.horarios.filter(h => h.id !== id) });
    };

    const updateBloque = (id: string, field: 'horaInicio' | 'horaFin', value: string) => {
        onChange({
            ...config,
            horarios: config.horarios.map(h => h.id === id ? { ...h, [field]: value } : h),
        });
    };

    return (
        <div className="space-y-4">
            {/* Duration */}
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <CalendarIcon />
                <label className="text-sm font-semibold text-indigo-800 whitespace-nowrap">
                    Duración por turno:
                </label>
                <div className="flex flex-wrap gap-2">
                    {DURACIONES.map(min => (
                        <button
                            key={min}
                            type="button"
                            onClick={() => onChange({ ...config, duracionTurnoMinutos: min })}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                config.duracionTurnoMinutos === min
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'bg-white text-slate-600 border border-slate-300 hover:border-indigo-400'
                            }`}
                        >
                            {min} min
                        </button>
                    ))}
                </div>
            </div>

            {/* Days */}
            <div className="space-y-3">
                {DIAS.map(dia => {
                    const bloques = config.horarios.filter(h => h.dia === dia.num);
                    const isActive = bloques.length > 0;

                    return (
                        <div
                            key={dia.num}
                            className={`rounded-lg border transition-colors ${
                                isActive
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-slate-200 bg-slate-50'
                            }`}
                        >
                            <div className="flex items-center justify-between px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`w-2 h-2 rounded-full ${
                                            isActive ? 'bg-green-500' : 'bg-slate-300'
                                        }`}
                                    />
                                    <span
                                        className={`text-sm font-semibold w-24 ${
                                            isActive ? 'text-green-800' : 'text-slate-500'
                                        }`}
                                    >
                                        {dia.label}
                                    </span>
                                    {!isActive && (
                                        <span className="text-xs text-slate-400">Sin turnos</span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => addBloque(dia.num)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                                >
                                    <PlusIcon />
                                    Agregar bloque
                                </button>
                            </div>

                            {bloques.length > 0 && (
                                <div className="px-3 pb-3 space-y-2">
                                    {bloques.map(bloque => (
                                        <div
                                            key={bloque.id}
                                            className="flex items-center gap-2 bg-white rounded-md p-2 border border-green-200 shadow-sm"
                                        >
                                            <span className="text-xs text-slate-500 w-6">De</span>
                                            <input
                                                type="time"
                                                value={bloque.horaInicio}
                                                onChange={e => updateBloque(bloque.id, 'horaInicio', e.target.value)}
                                                className="rounded border-slate-300 text-sm py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            <span className="text-xs text-slate-500">a</span>
                                            <input
                                                type="time"
                                                value={bloque.horaFin}
                                                onChange={e => updateBloque(bloque.id, 'horaFin', e.target.value)}
                                                className="rounded border-slate-300 text-sm py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeBloque(bloque.id)}
                                                className="ml-auto p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Professional Form ────────────────────────────────────────────────────────

const ProfesionalFormPanel = ({
    initial,
    isNew,
    onSave,
    onCancel,
}: {
    key?: React.Key;   // ← AGREGAR
    initial: ProfesionalForm;
    isNew: boolean;
    onSave: (data: ProfesionalForm) => Promise<void>;
    onCancel: () => void;
}) => {
    const [form, setForm] = useState<ProfesionalForm>(initial);
    const [activeTab, setActiveTab] = useState<'datos' | 'horarios'>('datos');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (field: keyof ProfesionalForm, value: any) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.nombres || !form.apellido) {
            setError('Email, Nombres y Apellido son requeridos.');
            return;
        }
        if (!form.email.includes('@')) {
            setError('Por favor ingrese un email válido.');
            return;
        }
        setError(null);
        setIsSaving(true);
        try {
            await onSave(form);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error al guardar.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Tabs */}
            <div className="border-b border-slate-200 px-6">
                <nav className="-mb-px flex gap-6">
                    {([
                        { id: 'datos',    label: 'Datos del Profesional' },
                        { id: 'horarios', label: 'Días y Horarios' },
                    ] as const).map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-6">
                {activeTab === 'datos' && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Apellido *</label>
                                <input
                                    type="text"
                                    value={form.apellido}
                                    onChange={e => set('apellido', e.target.value)}
                                    required
                                    className="w-full rounded-md border-slate-300 shadow-sm text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombres *</label>
                                <input
                                    type="text"
                                    value={form.nombres}
                                    onChange={e => set('nombres', e.target.value)}
                                    required
                                    className="w-full rounded-md border-slate-300 shadow-sm text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Email (se usa como ID de login) *</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => set('email', e.target.value)}
                                disabled={!isNew}
                                required
                                className={`w-full rounded-md border-slate-300 shadow-sm text-sm ${
                                    !isNew ? 'bg-slate-100 cursor-not-allowed' : ''
                                }`}
                            />
                            {!isNew && (
                                <p className="text-xs text-slate-400 mt-1">El email no puede modificarse.</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Rol</label>
                                <select
                                    value={form.rol}
                                    onChange={e => set('rol', e.target.value as UserRole)}
                                    className="w-full rounded-md border-slate-300 shadow-sm text-sm"
                                >
                                    <option value={UserRole.MEDICO}>Médico / Profesional</option>
                                    <option value={UserRole.ADMINISTRATIVO}>Administrativo</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Especialidad</label>
                                <input
                                    type="text"
                                    value={form.especialidad}
                                    onChange={e => set('especialidad', e.target.value)}
                                    placeholder="Ej: Cirugía Bariátrica"
                                    className="w-full rounded-md border-slate-300 shadow-sm text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Matrícula</label>
                                <input
                                    type="text"
                                    value={form.matricula}
                                    onChange={e => set('matricula', e.target.value)}
                                    placeholder="Ej: MP-12345"
                                    className="w-full rounded-md border-slate-300 shadow-sm text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono</label>
                                <input
                                    type="tel"
                                    value={form.telefono}
                                    onChange={e => set('telefono', e.target.value)}
                                    className="w-full rounded-md border-slate-300 shadow-sm text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={form.activo}
                                    onChange={e => set('activo', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">
                                    Profesional {form.activo ? 'Activo' : 'Inactivo'}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {form.activo
                                        ? 'Aparece en la agenda y puede recibir turnos.'
                                        : 'No aparece en la agenda ni recibe turnos.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'horarios' && (
                    <div className="space-y-4">
                        <div className="p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg text-sm text-amber-800">
                            <p className="font-semibold">¿Cómo funciona?</p>
                            <p className="text-xs mt-1">
                                Activá los días de atención agregando bloques de horario. Podés tener múltiples bloques por día (ej: mañana y tarde). La duración de turno se aplica a todos los días.
                            </p>
                        </div>
                        <ScheduleBuilder
                            config={form.config_turnos}
                            onChange={newConfig => set('config_turnos', newConfig)}
                        />
                    </div>
                )}
            </div>

            {/* Footer */}
            {error && (
                <div className="px-6 py-2 bg-red-50 border-t border-red-200">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}
            <div className="px-6 py-4 bg-slate-50 border-t flex justify-between items-center">
                <div className="text-xs text-slate-400">
                    {form.config_turnos.horarios.length === 0
                        ? 'Sin días de atención configurados'
                        : `${[...new Set(form.config_turnos.horarios.map(h => h.dia))].length} día(s) activo(s) · ${form.config_turnos.duracionTurnoMinutos} min/turno`}
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 shadow-sm"
                    >
                        {isSaving ? 'Guardando...' : isNew ? 'Crear Profesional' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </form>
    );
};

// ─── Profesional Card ─────────────────────────────────────────────────────────

const ProfesionalCard = ({
    prof,
    isSelected,
    onSelect,
}: {
    key?: React.Key;   // ← AGREGAR
    prof: Profesional;
    isSelected: boolean;
    onSelect: () => void;
}) => {
    const config = prof.config_turnos as ConfigTurnos | null;
    const diasActivos = config?.horarios
        ? [...new Set(config.horarios.map(h => h.dia))].length
        : 0;

    return (
        <button
            onClick={onSelect}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
                isSelected
                    ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
        >
            <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    prof.activo ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                }`}>
                    <UserIcon />
                </div>
                <div className="min-w-0 flex-grow">
                    <p className={`font-semibold text-sm truncate ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {prof.apellido}, {prof.nombres}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{prof.especialidad || prof.rol}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            prof.activo
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-500'
                        }`}>
                            {prof.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        {diasActivos > 0 && (
                            <span className="text-xs text-slate-400">
                                {diasActivos} día{diasActivos !== 1 ? 's' : ''} · {config?.duracionTurnoMinutos}min
                            </span>
                        )}
                    </div>
                </div>
                <div className={`flex-shrink-0 text-slate-400 ${isSelected ? 'text-indigo-400' : ''}`}>
                    <PencilIcon />
                </div>
            </div>
        </button>
    );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface GestionProfesionalesModalProps {
    onClose: () => void;
}

// Helper to safely parse config_turnos from the DB (which may be a raw JSON or a number)
const parseConfigTurnos = (raw: any): ConfigTurnos => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaultConfig();
    return {
        horarios: Array.isArray(raw.horarios) ? raw.horarios : [],
        diasBloqueados: Array.isArray(raw.diasBloqueados) ? raw.diasBloqueados : [],
        horariosEspeciales: Array.isArray(raw.horariosEspeciales) ? raw.horariosEspeciales : [],
        duracionTurnoMinutos: typeof raw.duracionTurnoMinutos === 'number' ? raw.duracionTurnoMinutos : 20,
    };
};

export default function GestionProfesionalesModal({ onClose }: GestionProfesionalesModalProps) {
    const [profesionales, setProfesionales] = useState<Profesional[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const fetchProfesionales = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getProfesionalesAdmin();
            setProfesionales(data);
        } catch (err) {
            console.error('Error fetching profesionales', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfesionales();
    }, [fetchProfesionales]);

    const selectedProf = profesionales.find(p => p.email === selectedEmail) ?? null;

    const buildFormFromProf = (prof: Profesional): ProfesionalForm => ({
        email: prof.email,
        nombres: prof.nombres,
        apellido: prof.apellido,
        rol: prof.rol as UserRole,
        especialidad: prof.especialidad || '',
        matricula: (prof as any).matricula || '',
        telefono: prof.telefono || '',
        activo: prof.activo,
        config_turnos: parseConfigTurnos((prof as any).config_turnos),
    });

    const handleSave = async (data: ProfesionalForm) => {
        const payload = {
            ...data,
            config_turnos: data.config_turnos,
        };

        if (isCreating) {
            // Call your API create method here.
            // Example: await api.createProfesional(payload);
            // For now we use supabase via a generic upsert pattern:
            await (api as any).upsertProfesional(payload);
        } else {
            await (api as any).updateProfesionalConfig(data.email, payload);
        }

        await fetchProfesionales();
        setIsCreating(false);
        setSelectedEmail(data.email);
    };

    const handleStartCreate = () => {
        setSelectedEmail(null);
        setIsCreating(true);
    };

    const handleCancel = () => {
        setIsCreating(false);
        setSelectedEmail(null);
    };

    const showForm = isCreating || selectedEmail !== null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden"
                 style={{ height: 'min(90vh, 720px)' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-slate-800 to-slate-700">
                    <div>
                        <h2 className="text-lg font-bold text-white">Gestión de Profesionales</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Cree, edite y configure los horarios de su equipo
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors text-2xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-grow overflow-hidden">

                    {/* Left panel — professional list */}
                    <div className="w-72 flex-shrink-0 border-r border-slate-200 flex flex-col bg-slate-50">
                        <div className="p-3 border-b border-slate-200">
                            <button
                                onClick={handleStartCreate}
                                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm transition-colors"
                            >
                                <PlusIcon />
                                Nuevo Profesional
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-3 space-y-2">
                            {isLoading ? (
                                <p className="text-xs text-center text-slate-400 pt-6">Cargando...</p>
                            ) : profesionales.length === 0 ? (
                                <p className="text-xs text-center text-slate-400 pt-6">No hay profesionales.</p>
                            ) : (
                                profesionales.map(prof => (
                                    <ProfesionalCard
                                        key={prof.email}
                                        prof={prof}
                                        isSelected={prof.email === selectedEmail}
                                        onSelect={() => { setIsCreating(false); setSelectedEmail(prof.email); }}
                                    />
                                ))
                            )}
                        </div>

                        <div className="p-3 border-t border-slate-200">
                            <p className="text-xs text-center text-slate-400">
                                {profesionales.length} profesional{profesionales.length !== 1 ? 'es' : ''} registrado{profesionales.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Right panel — form */}
                    <div className="flex-grow overflow-hidden flex flex-col">
                        {showForm ? (
                            <ProfesionalFormPanel
                                key={isCreating ? 'new' : selectedEmail!}
                                initial={
                                    isCreating
                                        ? defaultForm()
                                        : buildFormFromProf(selectedProf!)
                                }
                                isNew={isCreating}
                                onSave={handleSave}
                                onCancel={handleCancel}
                            />
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-slate-400">
                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                    <UserIcon />
                                </div>
                                <p className="font-semibold text-slate-600">Seleccioná un profesional</p>
                                <p className="text-sm mt-1">
                                    Elegí uno de la lista para editar sus datos y horarios,
                                    o creá uno nuevo.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}