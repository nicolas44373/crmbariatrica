import React, { useState, useContext, useEffect, useMemo } from 'react';
import { PacienteFiliatorio, UserRole, Profesional, ConfiguracionGeneral, Turno, DiaSemana, TurnoConPaciente, EstadoTurnoDia } from '../types';
import { api } from '../services/mockApi';
import { AuthContext } from '../App';
import { format, addMinutes, getDay, endOfMonth, eachDayOfInterval, endOfWeek, isSameMonth, isToday, isSameDay, addMonths, isBefore, startOfMonth, startOfWeek, subMonths, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface NewPatientModalProps {
    onClose: () => void;
    onSuccess: (newPatient: PacienteFiliatorio) => void;
    initialData?: Partial<Omit<PacienteFiliatorio, 'idPaciente'>>;
    prospectoId?: string;
}

type NewPatientData = Omit<PacienteFiliatorio, 'idPaciente' | 'etiquetaPrincipalActiva' | 'cirujanoAsignado' | 'nutricionistaAsignado' | 'psicologoAsignado' | 'fechaCirugia' | 'tipoCirugia'>;

const ChevronLeftIconSmall = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>);
const ChevronRightIconSmall = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>);
type AvailabilityStatus = 'disponible' | 'completo' | 'bloqueado' | 'pasado' | 'no-laboral';


export default function NewPatientModal({ onClose, onSuccess, initialData = {}, prospectoId }: NewPatientModalProps) {
    const authContext = useContext(AuthContext);
    const [step, setStep] = useState(1);
    const [newlyCreatedPatient, setNewlyCreatedPatient] = useState<PacienteFiliatorio | null>(null);

    const [formData, setFormData] = useState<NewPatientData>({
        apellido: '',
        nombres: '',
        dni: '',
        fechaNacimiento: '',
        direccion: '',
        obraSocial: '',
        nroAfiliado: '',
        telefono: '',
        email: '',
        ...initialData
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const user = authContext!.user!;
    const isConversion = !!prospectoId;

    // --- State for Step 2: Scheduling ---
    const [profesionales, setProfesionales] = useState<Profesional[]>([]);
    const [config, setConfig] = useState<ConfiguracionGeneral | null>(null);
    const [profesionalEmail, setProfesionalEmail] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [allSlots, setAllSlots] = useState<Date[]>([]);
    const [bookedSlots, setBookedSlots] = useState<number[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [monthlyAvailability, setMonthlyAvailability] = useState<Record<string, AvailabilityStatus>>({});
    const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);

    const selectedProfesional = profesionales.find(p => p.email === profesionalEmail);
    const professionalConfig = config?.configuracionesProfesionales.find(h => h.profesionalEmail === profesionalEmail);


    useEffect(() => {
        if (step === 2) {
            Promise.all([
                api.getProfesionales(),
                api.getConfiguracionGeneral(user.rol)
            ]).then(([profs, conf]) => {
                setProfesionales(profs);
                setConfig(conf);
                if (profs.length > 0) {
                    setProfesionalEmail(profs[0].email);
                }
            }).catch(() => setError("No se pudo cargar la configuración de la agenda."));
        }
    }, [step, user.rol]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // FIX: Changed formData.phone to formData.telefono to match the NewPatientData type.
        if (!formData.apellido && !formData.telefono && !formData.email) {
            setError('Se requiere Apellido o al menos un método de contacto (teléfono o email).');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const newPatient = await api.createPaciente(formData, user.rol, prospectoId);
            setNewlyCreatedPatient(newPatient);
            if (isConversion) {
                setStep(2); // Go to scheduling
            } else {
                onSuccess(newPatient); // Finish for direct creation
            }
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error al guardar el paciente.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSubmitStep2 = async () => {
        if (!newlyCreatedPatient || !selectedTime || !profesionalEmail || !selectedProfesional) {
            alert('Por favor, seleccione un horario para el turno.');
            return;
        }
        setIsSaving(true);
        try {
            await api.createTurno({
                idPaciente: newlyCreatedPatient.idPaciente,
                fechaTurno: new Date(selectedTime).toISOString(),
                profesionalEmail,
                especialidad: selectedProfesional.especialidad || 'Consulta',
                creadoPorEmail: user.email,
            }, user.rol);
            onSuccess(newlyCreatedPatient);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error al agendar el turno.');
        } finally {
            setIsSaving(false);
        }
    }

    const title = isConversion 
        ? (step === 1 ? "Paso 1/2: Convertir a Paciente" : `Paso 2/2: Agendar 1ra Consulta`) 
        : "Ingresar Nuevo Paciente";

    // --- Scheduling Logic (adapted from PatientDossier) ---
    // (A lot of this is copied and simplified from AgendarTurnoModal)
    // ... Calendar useEffects and handlers ...
    useEffect(() => {
        if (step !== 2 || !professionalConfig) return;
        
        setIsLoadingCalendar(true);
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const daysInMonth = eachDayOfInterval({start, end});
        const newAvailability: Record<string, AvailabilityStatus> = {};
        const today = startOfDay(new Date());

        daysInMonth.forEach(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            if (isBefore(day, today)) {
                newAvailability[dayKey] = 'pasado'; return;
            }
            if (professionalConfig.diasBloqueados?.includes(dayKey)) {
                newAvailability[dayKey] = 'bloqueado'; return;
            }
            const workingBlocks = professionalConfig.horarios.filter(h => h.dia === getDay(day));
            if (workingBlocks.length === 0) {
                 newAvailability[dayKey] = 'no-laboral'; return;
            }
            newAvailability[dayKey] = 'disponible';
        });
        setMonthlyAvailability(newAvailability);
        setIsLoadingCalendar(false);

    }, [step, currentMonth, professionalConfig]);

    useEffect(() => {
        const calculateSlots = async () => {
            if (step !== 2 || !professionalConfig || !selectedDate) return;
            setIsLoadingSlots(true);
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            try {
                const turnosDelDia = await api.getTurnosPorFechaYProfesional(dateStr, profesionalEmail);
                setBookedSlots(turnosDelDia.map(t => new Date(t.fechaTurno).getTime()));

                const slots: Date[] = [];
                const blocks = professionalConfig.horarios.filter(h => h.dia === getDay(selectedDate));
                blocks.forEach(block => {
                    let currentTime = new Date(`${dateStr}T${block.horaInicio}:00`);
                    const endTime = new Date(`${dateStr}T${block.horaFin}:00`);
                    while(currentTime < endTime) {
                        slots.push(new Date(currentTime));
                        currentTime = addMinutes(currentTime, professionalConfig.duracionTurnoMinutos);
                    }
                });
                setAllSlots(slots);

            } catch(e) { console.error(e); } 
            finally { setIsLoadingSlots(false); }
        };
        calculateSlots();
    }, [step, selectedDate, professionalConfig, profesionalEmail]);

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        return eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }) });
    }, [currentMonth]);


    const renderStep1 = () => (
        <form onSubmit={handleSubmitStep1}>
            <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <p className="text-sm text-slate-500">{isConversion ? "Complete los datos para crear el registro clínico." : "Complete los datos filiatorios."}</p>
            </div>
            <div className="p-6 flex-grow overflow-y-auto space-y-4">
                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="apellido" className="block text-sm font-medium text-slate-700">Apellido</label>
                        <input type="text" name="apellido" id="apellido" value={formData.apellido} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300"/>
                    </div>
                    <div>
                        <label htmlFor="nombres" className="block text-sm font-medium text-slate-700">Nombres</label>
                        <input type="text" name="nombres" id="nombres" value={formData.nombres} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300" />
                    </div>
                </div>
                 <div>
                    <label htmlFor="dni" className="block text-sm font-medium text-slate-700">DNI</label>
                    <input type="text" name="dni" id="dni" value={formData.dni} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300" />
                </div>
                {/* ... other fields ... */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="telefono" className="block text-sm font-medium text-slate-700">Teléfono</label>
                        <input type="tel" name="telefono" id="telefono" value={formData.telefono} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300" />
                    </div>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-end space-x-3">
                <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md">
                    {isSaving ? 'Guardando...' : (isConversion ? 'Guardar y Agendar Turno' : 'Guardar Paciente')}
                </button>
            </div>
        </form>
    );

    const renderStep2 = () => (
         <>
            <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-slate-800">{title} para {newlyCreatedPatient?.nombres} {newlyCreatedPatient?.apellido}</h2>
            </div>
             <div className="p-6 flex-grow overflow-y-auto space-y-4">
                <select value={profesionalEmail} onChange={e => setProfesionalEmail(e.target.value)} className="w-full rounded-md border-slate-300">
                    {profesionales.map(p => <option key={p.email} value={p.email}>{p.nombres} {p.apellido} - {p.especialidad}</option>)}
                </select>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Calendar */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                             <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded-full hover:bg-slate-100"><ChevronLeftIconSmall /></button>
                             <h3 className="font-semibold text-slate-700 capitalize">{format(currentMonth, 'LLLL yyyy', { locale: es })}</h3>
                             <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded-full hover:bg-slate-100"><ChevronRightIconSmall /></button>
                         </div>
                         <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-2">
                            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => <div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map(day => {
                                const dayKey = format(day, 'yyyy-MM-dd');
                                const status = monthlyAvailability[dayKey];
                                const isSel = selectedDate && isSameDay(day, selectedDate);
                                return <button type="button" key={dayKey} onClick={() => status === 'disponible' && setSelectedDate(day)} disabled={status !== 'disponible'}
                                    className={`h-8 w-8 rounded-full text-sm ${isSel ? 'bg-indigo-600 text-white' : status === 'disponible' ? 'bg-green-100' : 'bg-slate-100 text-slate-400'}`}>
                                    {format(day, 'd')}
                                </button>
                            })}
                        </div>
                    </div>
                    {/* Slots */}
                     <div>
                        <h3 className="font-semibold text-slate-700">Horarios</h3>
                        <div className="grid grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto">
                            {isLoadingSlots ? <p>Cargando...</p> : allSlots.map(slot => {
                                const isBooked = bookedSlots.includes(slot.getTime());
                                return <button key={slot.toISOString()} type="button" onClick={() => !isBooked && setSelectedTime(slot.toISOString())} disabled={isBooked}
                                    className={`p-2 text-sm rounded-md ${selectedTime === slot.toISOString() ? 'bg-indigo-600 text-white' : isBooked ? 'bg-red-200 text-red-500 line-through' : 'bg-slate-100 hover:bg-slate-200'}`}>
                                    {format(slot, 'HH:mm')}
                                </button>
                            })}
                        </div>
                    </div>
                </div>
             </div>
             <div className="p-4 bg-slate-50 border-t flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md">Cancelar</button>
                <button type="button" onClick={handleSubmitStep2} disabled={!selectedTime || isSaving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md">
                   {isSaving ? 'Agendando...' : 'Confirmar Turno y Finalizar'}
                </button>
            </div>
         </>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 transform transition-all duration-300 scale-95 opacity-0 animate-fadeInScale flex flex-col">
                {step === 1 ? renderStep1() : renderStep2()}
            </div>
            <style>{`
                @keyframes fadeInScale { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                .animate-fadeInScale { animation: fadeInScale 0.3s forwards; }
            `}</style>
        </div>
    );
}
