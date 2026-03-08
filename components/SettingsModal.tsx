import React, { useState, useEffect, useContext } from 'react';
import { ConfiguracionGeneral, Profesional, DiaSemana, BloqueHorario, ConfiguracionProfesional, HorarioEspecial, UserRole, PlantillaLaboratorioParametro } from '../types';
import { api } from '../services/supabaseApi';
import { supabase } from '../services/supabaseClient';
import { AuthContext } from '../App';
import { DIAS_SEMANA_MAP } from '../constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SettingsModalProps {
    onClose: () => void;
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.077-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>);
const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
const UserPlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>);
const ClockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
const CalendarIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18" /></svg>);
const ShieldIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>);
const EyeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>);
const EyeOffIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>);

type Tab = 'usuarios' | 'horarios' | 'plantillas';

// ─── NUEVO USUARIO MODAL ──────────────────────────────────────────────────────
interface NuevoUsuarioModalProps {
    onClose: () => void;
    onSuccess: (prof: Profesional) => void;
}

const NuevoUsuarioModal = ({ onClose, onSuccess }: NuevoUsuarioModalProps) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nombres: '',
        apellido: '',
        rol: UserRole.MEDICO,
        especialidad: '',
        matricula: '',
        telefono: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleStep1 = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            setError('Email y contraseña son obligatorios.');
            return;
        }
        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        setError(null);
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombres || !formData.apellido) {
            setError('Nombre y apellido son obligatorios.');
            return;
        }
        setIsSaving(true);
        setError(null);

        try {
            // 1. Crear usuario en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: formData.email,
                password: formData.password,
                email_confirm: true,
            });

            if (authError) {
                // Si no tenemos acceso admin, usar signUp normal
                const { error: signUpError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                });
                if (signUpError) throw new Error(signUpError.message);
            }

            // 2. Insertar en tabla profesionales
            const { data, error: insertError } = await supabase
                .from('profesionales')
                .insert({
                    email: formData.email,
                    nombres: formData.nombres,
                    apellido: formData.apellido,
                    rol: formData.rol,
                    activo: true,
                    especialidad: formData.especialidad || null,
                    matricula: formData.matricula || null,
                    telefono: formData.telefono || null,
                    config_turnos: {
                        duracionTurnoMinutos: 30,
                        horarios: [],
                        diasBloqueados: [],
                        horariosEspeciales: [],
                    },
                })
                .select()
                .single();

            if (insertError) throw new Error(insertError.message);

            onSuccess({
                email: data.email,
                nombres: data.nombres,
                apellido: data.apellido,
                rol: data.rol as UserRole,
                activo: data.activo,
                especialidad: data.especialidad ?? '',
                matricula: data.matricula ?? '',
                telefono: data.telefono ?? '',
            });
        } catch (err: any) {
            setError(err.message || 'Error al crear el usuario.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
                <div className="p-5 border-b flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><UserPlusIcon /></div>
                    <div>
                        <h3 className="font-bold text-slate-800">Crear Nuevo Usuario</h3>
                        <p className="text-xs text-slate-500">Paso {step} de 2 — {step === 1 ? 'Credenciales de acceso' : 'Datos del profesional'}</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-slate-100">
                    <div className={`h-1 bg-indigo-500 transition-all duration-300 ${step === 1 ? 'w-1/2' : 'w-full'}`} />
                </div>

                <div className="p-5">
                    {step === 1 ? (
                        <form onSubmit={handleStep1} className="space-y-4">
                            <p className="text-sm text-slate-600">Estas serán las credenciales que el usuario usará para iniciar sesión.</p>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email institucional *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                                    placeholder="medico@clinica.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña inicial *</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                        className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">El usuario podrá cambiarla después.</p>
                            </div>
                            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Siguiente →</button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-sm text-slate-600">Completá los datos del profesional. Podrán editarse después.</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Nombres *</label>
                                    <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} required className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Apellido *</label>
                                    <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Rol</label>
                                <select name="rol" value={formData.rol} onChange={handleChange} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none">
                                    <option value={UserRole.MEDICO}>Médico</option>
                                    <option value={UserRole.ADMINISTRATIVO}>Administrativo</option>
                                </select>
                            </div>
                            {formData.rol === UserRole.MEDICO && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Especialidad</label>
                                        <input type="text" name="especialidad" value={formData.especialidad} onChange={handleChange} placeholder="Ej: Cirugía, Nutrición, Psicología..." className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Matrícula</label>
                                            <input type="text" name="matricula" value={formData.matricula} onChange={handleChange} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
                                            <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                                        </div>
                                    </div>
                                </>
                            )}
                            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
                            <div className="flex justify-between gap-2 pt-2">
                                <button type="button" onClick={() => { setStep(1); setError(null); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">← Atrás</button>
                                <div className="flex gap-2">
                                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-lg">
                                        {isSaving ? 'Creando...' : 'Crear Usuario'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── MAIN SETTINGS MODAL ──────────────────────────────────────────────────────
export default function SettingsModal({ onClose }: SettingsModalProps) {
    const authContext = useContext(AuthContext);
    const user = authContext!.user!;

    const [activeTab, setActiveTab] = useState<Tab>('usuarios');
    const [config, setConfig] = useState<ConfiguracionGeneral | null>(null);
    const [usuarios, setUsuarios] = useState<Profesional[]>([]);
    const [horariosProfesionales, setHorariosProfesionales] = useState<Profesional[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [showNuevoUsuario, setShowNuevoUsuario] = useState(false);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [newBlockedDates, setNewBlockedDates] = useState<Record<string, string>>({});
    const [newSpecialSchedule, setNewSpecialSchedule] = useState<Record<string, Omit<HorarioEspecial, 'id'>>>({});

    const fetchData = async () => {
        if (user.rol !== UserRole.ADMINISTRATIVO) { setError('Acceso denegado.'); setIsLoading(false); return; }
        try {
            const [configData, profData, allProfData] = await Promise.all([
                api.getConfiguracionGeneral(user.rol),
                api.getProfesionales(),
                api.getProfesionalesAdmin(),
            ]);

            const synchronizedConfigs = profData.map(prof => {
                const existing = configData.configuracionesProfesionales.find(h => h.profesionalEmail === prof.email);
                return existing
                    ? { diasBloqueados: [], horariosEspeciales: [], ...existing }
                    : { profesionalEmail: prof.email, duracionTurnoMinutos: 30, horarios: [], diasBloqueados: [], horariosEspeciales: [] };
            });

            setConfig({ ...configData, configuracionesProfesionales: synchronizedConfigs, plantillaLaboratorio: configData.plantillaLaboratorio || [] });
            setHorariosProfesionales(profData);
            setUsuarios(allProfData);
        } catch {
            setError('No se pudo cargar la configuración.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 3000);
    };

    // ─── HORARIOS LOGIC ───────────────────────────────────────────────────────
    const updateProfConfig = (email: string, field: keyof ConfiguracionProfesional, value: any) => {
        if (!config) return;
        setConfig(prev => prev ? ({
            ...prev,
            configuracionesProfesionales: prev.configuracionesProfesionales.map(c =>
                c.profesionalEmail === email ? { ...c, [field]: value } : c
            )
        }) : null);
    };

    const getProfConfig = (email: string): ConfiguracionProfesional | undefined =>
        config?.configuracionesProfesionales.find(c => c.profesionalEmail === email);

    const addBloque = (email: string) => {
        const pc = getProfConfig(email);
        if (!pc) return;
        updateProfConfig(email, 'horarios', [...pc.horarios, { id: `blk-${Date.now()}`, dia: DiaSemana.LUNES, horaInicio: '09:00', horaFin: '13:00' }]);
    };

    const removeBloque = (email: string, id: string) => {
        const pc = getProfConfig(email);
        if (!pc) return;
        updateProfConfig(email, 'horarios', pc.horarios.filter(h => h.id !== id));
    };

    const updateBloque = (email: string, id: string, field: keyof BloqueHorario, value: any) => {
        const pc = getProfConfig(email);
        if (!pc) return;
        updateProfConfig(email, 'horarios', pc.horarios.map(h => h.id === id ? { ...h, [field]: value } : h));
    };

    const addBlockedDay = (email: string) => {
        const date = newBlockedDates[email];
        if (!date) return;
        const pc = getProfConfig(email);
        if (!pc) return;
        const current = pc.diasBloqueados || [];
        if (current.includes(date)) return;
        updateProfConfig(email, 'diasBloqueados', [...current, date].sort());
        setNewBlockedDates(p => ({ ...p, [email]: '' }));
    };

    const removeBlockedDay = (email: string, date: string) => {
        const pc = getProfConfig(email);
        if (!pc) return;
        updateProfConfig(email, 'diasBloqueados', (pc.diasBloqueados || []).filter(d => d !== date));
    };

    const addSpecialSchedule = (email: string) => {
        const data = newSpecialSchedule[email];
        if (!data?.fecha) return;
        const pc = getProfConfig(email);
        if (!pc) return;
        updateProfConfig(email, 'horariosEspeciales', [...(pc.horariosEspeciales || []), { id: `sp-${Date.now()}`, ...data }]);
        setNewSpecialSchedule(p => ({ ...p, [email]: { fecha: '', horaInicio: '09:00', horaFin: '12:00' } }));
    };

    const removeSpecialSchedule = (email: string, id: string) => {
        const pc = getProfConfig(email);
        if (!pc) return;
        updateProfConfig(email, 'horariosEspeciales', (pc.horariosEspeciales || []).filter(s => s.id !== id));
    };

    // ─── SAVE ─────────────────────────────────────────────────────────────────
    const handleSaveHorarios = async () => {
        if (!config) return;
        setIsSaving(true);
        setError(null);
        try {
            await api.updateConfiguracionGeneral(config, user.rol);
            showSuccess('Horarios guardados correctamente.');
        } catch {
            setError('Error al guardar los horarios.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActivo = async (email: string, activo: boolean) => {
        try {
            await supabase.from('profesionales').update({ activo }).eq('email', email);
            setUsuarios(prev => prev.map(u => u.email === email ? { ...u, activo } : u));
            showSuccess(`Usuario ${activo ? 'activado' : 'desactivado'}.`);
        } catch {
            setError('Error al actualizar el usuario.');
        }
    };

    // ─── TABS ─────────────────────────────────────────────────────────────────
    const TabBtn = ({ tab, label, icon }: { tab: Tab; label: string; icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
            {icon} {label}
        </button>
    );

    // ─── RENDER USUARIOS ──────────────────────────────────────────────────────
    const renderUsuarios = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Gestión de todos los usuarios del sistema.</p>
                <button
                    onClick={() => setShowNuevoUsuario(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                    <UserPlusIcon /> Nuevo Usuario
                </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {usuarios.map((prof) => (
                    <div key={prof.email} className={`rounded-xl border transition-all ${prof.activo ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${prof.rol === UserRole.ADMINISTRATIVO ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                    {prof.nombres.charAt(0)}{prof.apellido.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{prof.nombres} {prof.apellido}</p>
                                    <p className="text-xs text-slate-500">{prof.email} · {prof.rol}{prof.especialidad && ` · ${prof.especialidad}`}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${prof.activo ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                                    {prof.activo ? 'Activo' : 'Inactivo'}
                                </span>
                                <button
                                    onClick={() => handleToggleActivo(prof.email, !prof.activo)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${prof.activo ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}
                                >
                                    {prof.activo ? 'Desactivar' : 'Activar'}
                                </button>
                                {prof.rol === UserRole.MEDICO && (
                                    <button
                                        onClick={() => setExpandedUser(expandedUser === prof.email ? null : prof.email)}
                                        className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                    >
                                        {expandedUser === prof.email ? 'Cerrar' : 'Ver horarios →'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Inline horarios cuando se expande desde usuarios */}
                        {expandedUser === prof.email && prof.rol === UserRole.MEDICO && config && (() => {
                            const pc = getProfConfig(prof.email);
                            if (!pc) return <p className="px-4 pb-4 text-sm text-slate-400">Sin configuración de horarios.</p>;
                            const newSpecial = newSpecialSchedule[prof.email] || { fecha: '', horaInicio: '09:00', horaFin: '12:00' };
                            return (
                                <div className="border-t border-slate-100 p-4 bg-slate-50 rounded-b-xl space-y-5">
                                    {/* Duración turno */}
                                    <div className="flex items-center gap-3">
                                        <ClockIcon />
                                        <label className="text-sm font-medium text-slate-700">Duración del turno</label>
                                        <select
                                            value={pc.duracionTurnoMinutos}
                                            onChange={e => updateProfConfig(prof.email, 'duracionTurnoMinutos', parseInt(e.target.value))}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 outline-none"
                                        >
                                            {[10, 15, 20, 30, 45, 60].map(m => <option key={m} value={m}>{m} min</option>)}
                                        </select>
                                    </div>

                                    {/* Bloques recurrentes */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1"><ClockIcon /> Horarios semanales</h4>
                                        <div className="space-y-2">
                                            {pc.horarios.map(bloque => (
                                                <div key={bloque.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                                                    <select
                                                        value={bloque.dia}
                                                        onChange={e => updateBloque(prof.email, bloque.id, 'dia', parseInt(e.target.value))}
                                                        className="flex-1 rounded-md border-slate-300 text-sm py-1.5"
                                                    >
                                                        {Object.entries(DIAS_SEMANA_MAP).map(([val, nombre]) => (
                                                            <option key={val} value={val}>{nombre}</option>
                                                        ))}
                                                    </select>
                                                    <span className="text-xs text-slate-400">de</span>
                                                    <input
                                                        type="time"
                                                        value={bloque.horaInicio}
                                                        onChange={e => updateBloque(prof.email, bloque.id, 'horaInicio', e.target.value)}
                                                        className="rounded-md border-slate-300 text-sm py-1.5 w-28"
                                                    />
                                                    <span className="text-xs text-slate-400">a</span>
                                                    <input
                                                        type="time"
                                                        value={bloque.horaFin}
                                                        onChange={e => updateBloque(prof.email, bloque.id, 'horaFin', e.target.value)}
                                                        className="rounded-md border-slate-300 text-sm py-1.5 w-28"
                                                    />
                                                    <button onClick={() => removeBloque(prof.email, bloque.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md"><TrashIcon /></button>
                                                </div>
                                            ))}
                                            {pc.horarios.length === 0 && (
                                                <p className="text-xs text-slate-400 text-center py-3 bg-white rounded-lg border border-dashed border-slate-300">Sin horarios semanales. Agregá uno.</p>
                                            )}
                                        </div>
                                        <button onClick={() => addBloque(prof.email)} className="mt-2 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                            <PlusIcon /> Agregar bloque semanal
                                        </button>
                                    </div>

                                    {/* Días bloqueados */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1"><CalendarIcon /> Días bloqueados / Feriados</h4>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(pc.diasBloqueados || []).map(date => (
                                                <span key={date} className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full border border-red-200">
                                                    {format(new Date(date.replace(/-/g, '/')), 'dd MMM yyyy', { locale: es })}
                                                    <button onClick={() => removeBlockedDay(prof.email, date)} className="hover:text-red-900 ml-1">×</button>
                                                </span>
                                            ))}
                                            {(pc.diasBloqueados || []).length === 0 && (
                                                <p className="text-xs text-slate-400">Sin días bloqueados.</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                value={newBlockedDates[prof.email] || ''}
                                                onChange={e => setNewBlockedDates(p => ({ ...p, [prof.email]: e.target.value }))}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 outline-none"
                                            />
                                            <button onClick={() => addBlockedDay(prof.email)} className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg">
                                                Bloquear
                                            </button>
                                        </div>
                                    </div>

                                    {/* Horarios especiales */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1"><CalendarIcon /> Horarios especiales (por fecha)</h4>
                                        <div className="space-y-1 mb-2">
                                            {(pc.horariosEspeciales || []).map(s => (
                                                <div key={s.id} className="flex items-center gap-2 text-xs bg-white p-2 rounded-lg border">
                                                    <span className="font-medium">{format(new Date(s.fecha.replace(/-/g, '/')), 'dd MMM yyyy', { locale: es })}</span>
                                                    <span className="text-slate-400">·</span>
                                                    <span>{s.horaInicio} – {s.horaFin}</span>
                                                    <button onClick={() => removeSpecialSchedule(prof.email, s.id)} className="ml-auto p-1 text-red-400 hover:text-red-600"><TrashIcon /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="date" value={newSpecial.fecha} onChange={e => setNewSpecialSchedule(p => ({ ...p, [prof.email]: { ...newSpecial, fecha: e.target.value } }))} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none" />
                                            <input type="time" value={newSpecial.horaInicio} onChange={e => setNewSpecialSchedule(p => ({ ...p, [prof.email]: { ...newSpecial, horaInicio: e.target.value } }))} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none w-28" />
                                            <span className="text-xs text-slate-400">a</span>
                                            <input type="time" value={newSpecial.horaFin} onChange={e => setNewSpecialSchedule(p => ({ ...p, [prof.email]: { ...newSpecial, horaFin: e.target.value } }))} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none w-28" />
                                            <button onClick={() => addSpecialSchedule(prof.email)} className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg">Agregar</button>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2 border-t border-slate-200">
                                        <button onClick={handleSaveHorarios} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-lg">
                                            {isSaving ? 'Guardando...' : 'Guardar horarios'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                ))}
                {usuarios.length === 0 && !isLoading && (
                    <div className="text-center py-12 text-slate-400">
                        <p className="text-lg">No hay usuarios creados.</p>
                        <p className="text-sm">Creá el primero con el botón de arriba.</p>
                    </div>
                )}
            </div>
        </div>
    );

    // ─── RENDER HORARIOS TAB ──────────────────────────────────────────────────
    const renderHorarios = () => {
        if (!config) return null;
        const medicos = horariosProfesionales.filter(p => p.rol === UserRole.MEDICO && p.activo);
        return (
            <div className="space-y-4">
                <p className="text-sm text-slate-500">Configurá los horarios de atención de cada profesional médico activo.</p>
                {medicos.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500">No hay médicos activos. Creá uno en la pestaña Usuarios.</p>
                    </div>
                )}
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    {medicos.map(prof => {
                        const pc = getProfConfig(prof.email);
                        if (!pc) return null;
                        const newSpecial = newSpecialSchedule[prof.email] || { fecha: '', horaInicio: '09:00', horaFin: '12:00' };
                        const isExpanded = expandedUser === prof.email;

                        return (
                            <div key={prof.email} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                                {/* Header del profesional */}
                                <button
                                    onClick={() => setExpandedUser(isExpanded ? null : prof.email)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
                                            {prof.nombres.charAt(0)}{prof.apellido.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-slate-800">{prof.nombres} {prof.apellido}</p>
                                            <p className="text-xs text-slate-500">{prof.especialidad || 'Sin especialidad'} · Turno: {pc.duracionTurnoMinutos} min · {pc.horarios.length} bloques</p>
                                        </div>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-slate-100 p-4 space-y-5 bg-slate-50">
                                        {/* Duración */}
                                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                                            <ClockIcon />
                                            <span className="text-sm font-medium text-slate-700">Duración del turno:</span>
                                            <select
                                                value={pc.duracionTurnoMinutos}
                                                onChange={e => updateProfConfig(prof.email, 'duracionTurnoMinutos', parseInt(e.target.value))}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                                            >
                                                {[10, 15, 20, 30, 45, 60].map(m => <option key={m} value={m}>{m} minutos</option>)}
                                            </select>
                                        </div>

                                        {/* Bloques semanales */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-semibold text-slate-700">Horarios semanales recurrentes</h4>
                                                <button onClick={() => addBloque(prof.email)} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 px-2 py-1 rounded-lg">
                                                    <PlusIcon /> Agregar bloque
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {pc.horarios.length === 0 && (
                                                    <p className="text-xs text-slate-400 text-center py-4 bg-white rounded-lg border border-dashed">Sin bloques. Agregá días y horarios de atención.</p>
                                                )}
                                                {pc.horarios.map(bloque => (
                                                    <div key={bloque.id} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border">
                                                        <select value={bloque.dia} onChange={e => updateBloque(prof.email, bloque.id, 'dia', parseInt(e.target.value))} className="flex-1 rounded-md border-slate-300 text-sm">
                                                            {Object.entries(DIAS_SEMANA_MAP).map(([v, n]) => <option key={v} value={v}>{n}</option>)}
                                                        </select>
                                                        <span className="text-xs text-slate-400 shrink-0">de</span>
                                                        <input type="time" value={bloque.horaInicio} onChange={e => updateBloque(prof.email, bloque.id, 'horaInicio', e.target.value)} className="rounded-md border-slate-300 text-sm w-28" />
                                                        <span className="text-xs text-slate-400 shrink-0">a</span>
                                                        <input type="time" value={bloque.horaFin} onChange={e => updateBloque(prof.email, bloque.id, 'horaFin', e.target.value)} className="rounded-md border-slate-300 text-sm w-28" />
                                                        <button onClick={() => removeBloque(prof.email, bloque.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><TrashIcon /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Días bloqueados */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Días bloqueados / Ausencias</h4>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {(pc.diasBloqueados || []).length === 0 && <p className="text-xs text-slate-400">Sin días bloqueados.</p>}
                                                {(pc.diasBloqueados || []).map(date => (
                                                    <span key={date} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs rounded-full border border-red-200">
                                                        {format(new Date(date.replace(/-/g, '/')), 'dd MMM yyyy', { locale: es })}
                                                        <button onClick={() => removeBlockedDay(prof.email, date)} className="hover:text-red-900 font-bold ml-1">×</button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="date" value={newBlockedDates[prof.email] || ''} onChange={e => setNewBlockedDates(p => ({ ...p, [prof.email]: e.target.value }))} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none" />
                                                <button onClick={() => addBlockedDay(prof.email)} className="px-3 py-1.5 text-sm bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700">Bloquear día</button>
                                            </div>
                                        </div>

                                        {/* Horarios especiales */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Horarios especiales por fecha</h4>
                                            <div className="space-y-1 mb-2">
                                                {(pc.horariosEspeciales || []).length === 0 && <p className="text-xs text-slate-400">Sin horarios especiales.</p>}
                                                {(pc.horariosEspeciales || []).map(s => (
                                                    <div key={s.id} className="flex items-center gap-3 text-sm bg-white p-2 rounded-lg border">
                                                        <span className="font-medium text-slate-700">{format(new Date(s.fecha.replace(/-/g, '/')), 'dd MMM yyyy', { locale: es })}</span>
                                                        <span className="text-slate-400">·</span>
                                                        <span className="text-slate-600">{s.horaInicio} – {s.horaFin}</span>
                                                        <button onClick={() => removeSpecialSchedule(prof.email, s.id)} className="ml-auto p-1 text-red-400 hover:text-red-600"><TrashIcon /></button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <input type="date" value={newSpecial.fecha} onChange={e => setNewSpecialSchedule(p => ({ ...p, [prof.email]: { ...newSpecial, fecha: e.target.value } }))} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none" />
                                                <input type="time" value={newSpecial.horaInicio} onChange={e => setNewSpecialSchedule(p => ({ ...p, [prof.email]: { ...newSpecial, horaInicio: e.target.value } }))} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none w-28" />
                                                <span className="text-xs text-slate-400">a</span>
                                                <input type="time" value={newSpecial.horaFin} onChange={e => setNewSpecialSchedule(p => ({ ...p, [prof.email]: { ...newSpecial, horaFin: e.target.value } }))} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none w-28" />
                                                <button onClick={() => addSpecialSchedule(prof.email)} className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg">+ Agregar</button>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-2 border-t border-slate-200">
                                            <button onClick={handleSaveHorarios} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-lg">
                                                {isSaving ? 'Guardando...' : '💾 Guardar cambios'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ─── RENDER PLANTILLAS ────────────────────────────────────────────────────
    const renderPlantillas = () => {
        if (!config) return null;
        return (
            <div className="space-y-4">
                <p className="text-sm text-slate-500">Plantilla global para la carga de resultados de laboratorio.</p>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="grid grid-cols-8 gap-2 px-4 py-2 bg-slate-50 border-b text-xs font-semibold text-slate-500">
                        <span className="col-span-5">Parámetro</span>
                        <span className="col-span-2">Unidad</span>
                        <span className="col-span-1"></span>
                    </div>
                    <div className="max-h-[55vh] overflow-y-auto divide-y divide-slate-100">
                        {(config.plantillaLaboratorio || []).map(param => (
                            <div key={param.id} className="grid grid-cols-8 gap-2 px-4 py-2 items-center">
                                <input
                                    type="text"
                                    value={param.parametro}
                                    onChange={e => {
                                        setConfig(prev => prev ? ({
                                            ...prev,
                                            plantillaLaboratorio: prev.plantillaLaboratorio.map(p => p.id === param.id ? { ...p, parametro: e.target.value } : p)
                                        }) : null);
                                    }}
                                    className="col-span-5 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-indigo-400 outline-none"
                                />
                                <input
                                    type="text"
                                    value={param.unidad}
                                    onChange={e => {
                                        setConfig(prev => prev ? ({
                                            ...prev,
                                            plantillaLaboratorio: prev.plantillaLaboratorio.map(p => p.id === param.id ? { ...p, unidad: e.target.value } : p)
                                        }) : null);
                                    }}
                                    className="col-span-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-indigo-400 outline-none"
                                />
                                <button
                                    onClick={() => setConfig(prev => prev ? ({ ...prev, plantillaLaboratorio: prev.plantillaLaboratorio.filter(p => p.id !== param.id) }) : null)}
                                    className="col-span-1 flex justify-center p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="px-4 py-3 border-t bg-slate-50">
                        <button
                            onClick={() => setConfig(prev => prev ? ({ ...prev, plantillaLaboratorio: [...(prev.plantillaLaboratorio || []), { id: `lab-${Date.now()}`, parametro: '', unidad: '' }] }) : null)}
                            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            <PlusIcon /> Agregar parámetro
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ─── MAIN RENDER ──────────────────────────────────────────────────────────
    return (
        <>
            {showNuevoUsuario && (
                <NuevoUsuarioModal
                    onClose={() => setShowNuevoUsuario(false)}
                    onSuccess={(prof) => {
                        setUsuarios(prev => [...prev, prof]);
                        setShowNuevoUsuario(false);
                        showSuccess(`Usuario ${prof.nombres} ${prof.apellido} creado correctamente.`);
                    }}
                />
            )}

            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl m-4 flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="p-5 border-b flex items-center justify-between bg-slate-50 rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><ShieldIcon /></div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Configuración del Sistema</h2>
                                <p className="text-xs text-slate-500">Panel de administración</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-xl leading-none">&times;</button>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-slate-200 px-5">
                        <nav className="-mb-px flex gap-1">
                            <TabBtn tab="usuarios" label="Usuarios" icon={<UserPlusIcon />} />
                            <TabBtn tab="horarios" label="Horarios" icon={<ClockIcon />} />
                            <TabBtn tab="plantillas" label="Plantillas" icon={<CalendarIcon />} />
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-grow overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16 text-slate-400">Cargando configuración...</div>
                        ) : error && !successMsg ? (
                            <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</p>
                        ) : (
                            <>
                                {activeTab === 'usuarios' && renderUsuarios()}
                                {activeTab === 'horarios' && renderHorarios()}
                                {activeTab === 'plantillas' && renderPlantillas()}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t bg-slate-50 rounded-b-2xl flex items-center justify-between">
                        <div>
                            {successMsg && (
                                <span className="text-sm text-green-700 bg-green-100 px-3 py-1.5 rounded-lg font-medium">
                                    ✓ {successMsg}
                                </span>
                            )}
                            {error && !successMsg && (
                                <span className="text-sm text-red-600">{error}</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                                Cerrar
                            </button>
                            {activeTab === 'plantillas' && config && (
                                <button
                                    onClick={async () => {
                                        setIsSaving(true);
                                        try {
                                            await api.updateConfiguracionGeneral(config, user.rol);
                                            showSuccess('Plantilla guardada.');
                                        } catch {
                                            setError('Error al guardar.');
                                        } finally { setIsSaving(false); }
                                    }}
                                    disabled={isSaving}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-lg"
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}