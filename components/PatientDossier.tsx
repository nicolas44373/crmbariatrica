import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { PacienteCompleto, EtiquetaFlujo, UserRole, CirugiaTipo, Profesional, Turno, ConfiguracionGeneral, DiaSemana, TurnoConPaciente, EstadoTurnoDia, PacienteFiliatorio, HistoriaClinicaEstatica, TipoEstudio, EvolucionClinica, EstudioRealizado, ResultadoLaboratorio, PlantillaLaboratorioParametro, CirugiaInfo, TipoCirugiaBariatrica, NutricionInfo, PsicologiaInfo, InformeClinico, Task } from '../types';
import { api } from '../services/mockApi';
import { AuthContext } from '../App';
import { ETIQUETAS_FLUJO, PROFESIONALES, DIAS_SEMANA_MAP, ESTADO_TURNO_MAP, COMORBILIDADES_PREDEFINIDAS, TIPOS_ESTUDIO, TIPOS_CIRUGIA_BARIATRICA } from '../constants';
import { GoogleGenAI } from "@google/genai";
import { 
    format, 
    differenceInMonths,
    differenceInYears, 
    addMinutes, 
    getDay, 
    endOfMonth, 
    eachDayOfInterval, 
    endOfWeek, 
    isSameMonth, 
    isToday, 
    isSameDay, 
    addMonths, 
    isBefore,
    isAfter,
    formatDistanceToNowStrict,
    startOfMonth,
    startOfWeek,
    subMonths,
    startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../services/supabaseClient';

// --- Icons ---
const UserPhotoPlaceholderIcon = () => (
    <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center ring-4 ring-white shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-slate-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
    </div>
);
const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
);
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
  </svg>
);
const ChevronLeftIconSmall = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
);
const ChevronRightIconSmall = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
);
const TagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
  </svg>
);
const CalendarPlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18M12 12.75h.008v.008H12v-.008Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75h.008v.008H12v-.008ZM12 12.75v3M10.5 14.25h3" />
    </svg>
);
const UserCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 text-slate-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);
const VideoCameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-purple-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 011.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
    </svg>
);

const PlusCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-orange-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const PencilSquareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);
const DocumentPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);
const PaperClipIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-slate-500">
      <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.122 2.122l7.81-7.81" />
    </svg>
);
const ChartBarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
);
const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
    </svg>
);
const LockClosedIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5 mr-2"}>
      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
    </svg>
);
const IdentificationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5ZM6 6.75h.75v.75H6v-.75Z" />
    </svg>
);
const CalendarDaysIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18M9.75 14.25h.008v.008H9.75v-.008Zm3 0h.008v.008H12.75v-.008Zm3 0h.008v.008H15.75v-.008Zm-6-3h.008v.008H9.75v-.008Zm3 0h.008v.008H12.75v-.008Zm3 0h.008v.008H15.75v-.008Z" />
    </svg>
);
const AiSparklesIcon = ({ className = "w-5 h-5 mr-2" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);
const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.012-1.244h3.86M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);
const PrintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6 3.012m10.56 10.817L18 3.012m0 0a2.25 2.25 0 0 0-2.25-2.25h-5.25A2.25 2.25 0 0 0 8.25 3.012m9.75 10.817a42.453 42.453 0 0 0-10.56 0m10.56 0c.24.03.48.062.72.096m-11.28 0c-.24.03-.48.062-.72.096M12 21V11.829m0 0a2.25 2.25 0 0 1 2.25-2.25h.562a2.25 2.25 0 0 1 2.25 2.25v.003a2.25 2.25 0 0 1-2.25 2.25H12M12 11.829a2.25 2.25 0 0 0-2.25-2.25h-.562a2.25 2.25 0 0 0-2.25 2.25v.003a2.25 2.25 0 0 0 2.25 2.25H12" />
    </svg>
);
const ClipboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 0 1-2.25 2.25h-1.5a2.25 2.25 0 0 1-2.25-2.25V5.25a2.25 2.25 0 0 1 2.25-2.25h1.5a2.25 2.25 0 0 1 2.25 2.25v0c0 .212.029.418.084.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V8.25c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
    </svg>
);
const ClipboardPlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6v-.75c0-.231.035-.454.1-.664M5.25 7.5h6v2.25h2.25m3-2.25H21a.75.75 0 0 1 .75.75v.75m0 0H3.75m0 0h-.375a.75.75 0 0 0-.75.75V18a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18v-9.75a.75.75 0 0 0-.75-.75H17.25m-12 0h12M12 15v3m-1.5-1.5h3" />
    </svg>
);


// --- Sub-components defined inside PatientDossier to reduce file count ---

type AvailabilityStatus = 'disponible' | 'completo' | 'bloqueado' | 'pasado' | 'no-laboral';

// AgendarTurnoModal Component
const AgendarTurnoModal = ({ onConfirm, onCancel, profesionales, pacienteId, config, currentUser }: { 
    onConfirm: (turnoData: Omit<Turno, 'idTurno' | 'estado'>) => void, 
    onCancel: () => void,
    profesionales: Profesional[],
    pacienteId: string,
    config: ConfiguracionGeneral,
    currentUser: Profesional,
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [profesionalEmail, setProfesionalEmail] = useState(profesionales[0]?.email || '');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [esVideoconsulta, setEsVideoconsulta] = useState(false);
    const [esSobreturno, setEsSobreturno] = useState(false);
    const [allSlots, setAllSlots] = useState<Date[]>([]);
    const [bookedSlots, setBookedSlots] = useState<number[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [turnosProfesional, setTurnosProfesional] = useState<TurnoConPaciente[]>([]);
    const [monthlyAvailability, setMonthlyAvailability] = useState<Record<string, AvailabilityStatus>>({});
    const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);

    const selectedProfesional = profesionales.find(p => p.email === profesionalEmail);
    const professionalConfig = config.configuracionesProfesionales.find(h => h.profesionalEmail === profesionalEmail);

    useEffect(() => {
        if (!profesionalEmail) return;
        setIsLoadingCalendar(true);
        api.getTurnosParaProfesional(profesionalEmail).then(setTurnosProfesional);
    }, [profesionalEmail]);
    

    useEffect(() => {
        if (!professionalConfig) return;
        
        setIsLoadingCalendar(true);
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const daysInMonth = eachDayOfInterval({start, end});
        const newAvailability: Record<string, AvailabilityStatus> = {};
        const today = startOfDay(new Date());

        daysInMonth.forEach(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayOfWeek = getDay(day);

            if (isBefore(day, today)) {
                newAvailability[dayKey] = 'pasado';
                return;
            }
            
            const specialBlocks = professionalConfig.horariosEspeciales?.filter(h => h.fecha === dayKey) || [];
            if (specialBlocks.length > 0) {
                 newAvailability[dayKey] = 'disponible';
                 return;
            }

            if (professionalConfig.diasBloqueados?.includes(dayKey)) {
                newAvailability[dayKey] = 'bloqueado';
                return;
            }
            const workingBlocks = professionalConfig.horarios.filter(h => h.dia === dayOfWeek);
            if (workingBlocks.length === 0) {
                newAvailability[dayKey] = 'no-laboral';
                return;
            }
            
            newAvailability[dayKey] = 'disponible';
        });
        
        setMonthlyAvailability(newAvailability);
        setIsLoadingCalendar(false);

    }, [currentMonth, professionalConfig, turnosProfesional]);

    useEffect(() => {
        const calculateAvailableSlots = async () => {
            if (!profesionalEmail || !selectedDate || !config || !professionalConfig) {
                 setAllSlots([]);
                 setBookedSlots([]);
                return;
            };

            setIsLoadingSlots(true);
            const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
            
            try {
                const turnosDelDia = await api.getTurnosPorFechaYProfesional(selectedDateStr, profesionalEmail);
                setBookedSlots(turnosDelDia.map(t => new Date(t.fechaTurno).getTime()));

                const { duracionTurnoMinutos } = professionalConfig;
                const possibleSlots: Date[] = [];
                const specialBlocksForDay = professionalConfig.horariosEspeciales?.filter(h => h.fecha === selectedDateStr) || [];
                
                const blocksForCalculation = specialBlocksForDay.length > 0 
                    ? specialBlocksForDay 
                    : professionalConfig.horarios.filter(h => h.dia === getDay(selectedDate));


                for (const block of blocksForCalculation) {
                    let currentTime = new Date(`${selectedDateStr}T${block.horaInicio}:00.000`);
                    const endTime = new Date(`${selectedDateStr}T${block.horaFin}:00.000`);

                    while (currentTime < endTime) {
                       possibleSlots.push(new Date(currentTime));
                       currentTime = addMinutes(currentTime, duracionTurnoMinutos);
                    }
                }
                
                setAllSlots(possibleSlots.sort((a, b) => a.getTime() - b.getTime()));

            } catch (error) {
                console.error("Error fetching slots:", error);
                 setAllSlots([]);
                 setBookedSlots([]);
            } finally {
                setIsLoadingSlots(false);
            }
        };

        calculateAvailableSlots();
    }, [profesionalEmail, selectedDate, config, professionalConfig]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
                window.location.href = '/login';
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleDateSelect = (day: Date) => {
        const status = monthlyAvailability[format(day, 'yyyy-MM-dd')];
        if (status === 'disponible') {
            setSelectedDate(day);
            setSelectedTime(null);
            setEsSobreturno(false);
        }
    }
    
    const handleTimeClick = (slotDate: Date) => {
        const isBooked = bookedSlots.includes(slotDate.getTime());
        if (isBooked) {
            if (window.confirm("Este horario ya está ocupado. ¿Desea agendar un sobreturno?")) {
                setSelectedTime(slotDate.toISOString());
                setEsSobreturno(true);
            }
        } else {
            setSelectedTime(slotDate.toISOString());
            setEsSobreturno(false);
        }
    };


    const handleSubmit = async () => {
        if (!selectedDate || !selectedTime || !profesionalEmail || !selectedProfesional?.especialidad) {
            alert('Por favor complete todos los campos requeridos.');
            return;
        }
        setIsSaving(true);
        try {
            await onConfirm({
                idPaciente: pacienteId,
                fechaTurno: new Date(selectedTime).toISOString(),
                profesionalEmail,
                especialidad: selectedProfesional.especialidad,
                creadoPorEmail: currentUser.email,
                esVideoconsulta,
                esSobreturno,
            });
        } catch(e: any) {
             alert(`Error al guardar: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl m-4 transform transition-all duration-300 scale-95 opacity-0 animate-fadeInScale">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Agendar Nuevo Turno</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="profesional" className="block text-sm font-medium text-slate-700">Profesional</label>
                            <select
                                id="profesional"
                                value={profesionalEmail}
                                onChange={(e) => {
                                    setProfesionalEmail(e.target.value);
                                    setSelectedDate(null);
                                    setSelectedTime(null);
                                }}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                {profesionales.map(p => <option key={p.email} value={p.email}>{`${p.nombres} ${p.apellido}`}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="especialidad" className="block text-sm font-medium text-slate-700">Especialidad</label>
                            <input type="text" id="especialidad" disabled value={selectedProfesional?.especialidad || 'N/A'} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-slate-50 sm:text-sm" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Calendario */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded-full hover:bg-slate-100"><ChevronLeftIconSmall /></button>
                                <h3 className="font-semibold text-slate-700 capitalize">{format(currentMonth, 'LLLL yyyy', { locale: es })}</h3>
                                <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded-full hover:bg-slate-100"><ChevronRightIconSmall /></button>
                            </div>
                             {isLoadingCalendar ? <div className="text-center p-10">Cargando calendario...</div> : (
                                <>
                                <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-2">
                                    {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => <div key={d}>{d}</div>)}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {calendarDays.map(day => {
                                        const dayKey = format(day, 'yyyy-MM-dd');
                                        const status = monthlyAvailability[dayKey];
                                        const isSel = selectedDate && isSameDay(day, selectedDate);
                                        const isCurrMonth = isSameMonth(day, currentMonth);

                                        let statusClasses = 'bg-white ';
                                        if (isCurrMonth) {
                                           switch (status) {
                                            case 'disponible': statusClasses += 'bg-green-100 text-green-900 font-semibold hover:bg-green-200 cursor-pointer'; break;
                                            case 'bloqueado': statusClasses += 'bg-slate-200 text-slate-500 line-through cursor-not-allowed'; break;
                                            case 'pasado': statusClasses += 'text-slate-400 cursor-not-allowed'; break;
                                            default: statusClasses += 'text-slate-700';
                                           }
                                        } else {
                                            statusClasses += 'text-slate-400 cursor-not-allowed';
                                        }
                                        
                                        if (isSel) {
                                            statusClasses = 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-400';
                                        } else if (isToday(day)) {
                                            statusClasses += ' border-2 border-indigo-300';
                                        }

                                        return (
                                            <button
                                                type="button"
                                                key={dayKey}
                                                onClick={() => handleDateSelect(day)}
                                                disabled={status !== 'disponible'}
                                                className={`h-9 w-9 flex items-center justify-center rounded-full text-sm transition-colors duration-150 ${statusClasses}`}
                                            >
                                                {format(day, 'd')}
                                            </button>
                                        );
                                    })}
                                </div>
                                </>
                             )}
                        </div>
                        {/* Horarios */}
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-2">Horarios disponibles</label>
                             {!selectedDate ? <div className="text-center p-4 text-slate-500 text-sm bg-slate-50 rounded-md">Seleccione un día verde en el calendario.</div>
                             : isLoadingSlots ? <div className="text-center p-4 text-slate-500">Buscando horarios...</div>
                             : allSlots.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2">
                                    {allSlots.map(slot => {
                                        const isBooked = bookedSlots.includes(slot.getTime());
                                        const isSelected = selectedTime === slot.toISOString();
                                        return (
                                            <button
                                                type="button"
                                                key={slot.toISOString()}
                                                onClick={() => handleTimeClick(slot)}
                                                className={`p-2 text-sm rounded-md text-center transition-colors ${
                                                    isSelected ? 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-400' : 
                                                    isBooked ? 'bg-red-100 text-red-700 hover:bg-red-200' : 
                                                    'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                            >
                                                {format(slot, 'HH:mm')}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center p-4 bg-slate-50 rounded-md mt-1 text-slate-600 text-sm">No hay horarios para este día.</div>
                            )}
                        </div>
                    </div>
                     <div className="pt-2">
                        <label className="flex items-center space-x-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={esVideoconsulta}
                                onChange={(e) => setEsVideoconsulta(e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                            />
                            <span>Marcar como Videoconsulta</span>
                        </label>
                    </div>
                    {/* Botones */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancelar</button>
                        <button type="button" onClick={handleSubmit} disabled={isSaving || !selectedTime} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center">
                            {isSaving ? 'Guardando...' : 'Agendar Turno'}
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fadeInScale {
                    0% { transform: scale(0.95); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-fadeInScale { animation: fadeInScale 0.3s forwards; }
            `}</style>
        </div>
    );
};


// DefinirCirugiaModal Component
const DefinirCirugiaModal = ({ onConfirm, onCancel }: { onConfirm: (tipo: CirugiaTipo, fecha: string) => void, onCancel: () => void }) => {
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Definir Cirugía</h2>
                <p className="text-slate-600 mb-6">Por favor, complete los detalles para programar la cirugía del paciente.</p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="fechaCirugia" className="block text-sm font-medium text-slate-700">Fecha de Cirugía</label>
                        <input 
                            type="date" 
                            id="fechaCirugia"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancelar</button>
                        <button onClick={() => onConfirm(CirugiaTipo.PARTICULAR, fecha)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Guardar como Particular</button>
                        <button onClick={() => onConfirm(CirugiaTipo.OBRA_SOCIAL, fecha)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Guardar por Obra Social</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// EditarPacienteModal Component
const EditarPacienteModal = ({ paciente, onClose, onSuccess }: { paciente: PacienteFiliatorio, onClose: () => void, onSuccess: () => void }) => {
    const authContext = useContext(AuthContext);
    const [formData, setFormData] = useState(paciente);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const user = authContext!.user!;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.apellido || !formData.nombres || !formData.dni) {
            setError('Apellido, Nombres y DNI son campos requeridos.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await api.updatePacienteFiliatorio(paciente.idPaciente, formData, user.rol);
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error al actualizar el paciente.');
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 flex flex-col">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold text-slate-800">Editar Ficha del Paciente</h2>
                        <p className="text-sm text-slate-500">Actualice los datos filiatorios del paciente.</p>
                    </div>
                    <div className="p-6 flex-grow overflow-y-auto space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="apellido" className="block text-sm font-medium text-slate-700">Apellido</label>
                                <input type="text" name="apellido" id="apellido" value={formData.apellido} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300" />
                            </div>
                            <div>
                                <label htmlFor="nombres" className="block text-sm font-medium text-slate-700">Nombres</label>
                                <input type="text" name="nombres" id="nombres" value={formData.nombres} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="dni" className="block text-sm font-medium text-slate-700">DNI</label>
                                <input type="text" name="dni" id="dni" value={formData.dni} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300" />
                            </div>
                            <div>
                                <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-slate-700">Fecha de Nacimiento</label>
                                <input type="date" name="fechaNacimiento" id="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300" />
                            </div>
                        </div>
                         <div>
                            <label htmlFor="direccion" className="block text-sm font-medium text-slate-700">Dirección</label>
                            <input type="text" name="direccion" id="direccion" value={formData.direccion || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300" />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="obraSocial" className="block text-sm font-medium text-slate-700">Obra Social</label>
                                <input type="text" name="obraSocial" id="obraSocial" value={formData.obraSocial} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300" />
                            </div>
                            <div>
                                <label htmlFor="nroAfiliado" className="block text-sm font-medium text-slate-700">Nro de Afiliado</label>
                                <input type="text" name="nroAfiliado" id="nroAfiliado" value={formData.nroAfiliado} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300" />
                            </div>
                        </div>
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
                        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                    </div>
                    <div className="p-4 bg-slate-50 border-t flex justify-end space-x-3">
                        <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// FichaModal Component
const FichaModal = ({ paciente, equipoAsignado, onClose, onEdit, canEdit }: { 
    paciente: PacienteCompleto;
    equipoAsignado: { cirujano: string; nutricionista: string; psicologo: string; };
    onClose: () => void;
    onEdit: () => void;
    canEdit: boolean;
}) => {
    const { filiatorio } = paciente;
    const edad = filiatorio.fechaNacimiento
    ? differenceInYears(new Date(), new Date(filiatorio.fechaNacimiento.replace(/-/g, '/')))
    : null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">Ficha Administrativa</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-2xl font-bold">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-2 flex-grow">Datos Filiatorios</h3>
                        {canEdit && (
                            <button onClick={onEdit} className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-md shadow-sm hover:bg-slate-200 transition-colors">
                                <PencilSquareIcon />
                                Editar Ficha
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div><strong className="text-slate-600">DNI:</strong> {filiatorio.dni}</div>
                        <div><strong className="text-slate-600">Fecha de Nacimiento:</strong> {filiatorio.fechaNacimiento ? format(new Date(filiatorio.fechaNacimiento.replace(/-/g, '/')), 'dd/MM/yyyy') : 'N/A'}</div>
                        <div><strong className="text-slate-600">Edad:</strong> {edad !== null ? `${edad} años` : 'N/A'}</div>
                        <div className="lg:col-span-3"><strong className="text-slate-600">Dirección:</strong> {filiatorio.direccion || 'No especificada'}</div>
                        <div><strong className="text-slate-600">Obra Social:</strong> {filiatorio.obraSocial} ({filiatorio.nroAfiliado})</div>
                        <div><strong className="text-slate-600">Teléfono:</strong> {filiatorio.telefono}</div>
                        <div className="lg:col-span-2"><strong className="text-slate-600">Email:</strong> {filiatorio.email}</div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-2 mt-4">Equipo Asignado</h3>
                        <p className="text-xs text-slate-500 mb-3 -mt-2">Basado en la primera consulta registrada para cada especialidad.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div><strong className="text-slate-600">Cirujano:</strong> {equipoAsignado.cirujano}</div>
                            <div><strong className="text-slate-600">Nutricionista:</strong> {equipoAsignado.nutricionista}</div>
                            <div><strong className="text-slate-600">Psicólogo:</strong> {equipoAsignado.psicologo}</div>
                        </div>
                    </div>

                    {filiatorio.etiquetaPrincipalActiva === 'POSBARIATRICO' && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-2 mt-4">Detalles de Cirugía</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div><strong className="text-slate-600">Fecha de Cirugía:</strong> {filiatorio.fechaCirugia ? format(new Date(filiatorio.fechaCirugia.replace(/-/g, '/')), 'dd/MM/yyyy') : 'N/A'}</div>
                                <div><strong className="text-slate-600">Tipo de Gestión:</strong> {filiatorio.tipoCirugia || 'N/A'}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface CreateTaskModalProps {
    open: boolean;
    onClose: () => void;
    allProfesionales: Profesional[];
    onConfirm: (data: { description: string; assigneeEmail: string; dueDate: string; }) => Promise<void>;
}

const CreateTaskModal = ({ open, onClose, allProfesionales, onConfirm }: CreateTaskModalProps) => {
    const [description, setDescription] = useState('');
    const [assigneeEmail, setAssigneeEmail] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setDescription('');
            setAssigneeEmail('');
            setDueDate('');
            setIsSaving(false);
        }
    }, [open]);

    if (!open) return null;

    const handleSave = async () => {
        if (!description || !assigneeEmail || !dueDate) {
            alert("Por favor complete todos los campos.");
            return;
        }
        setIsSaving(true);
        try {
            await onConfirm({ description, assigneeEmail, dueDate });
        } catch (e) {
            // Error handled by parent
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Crear Nueva Tarea</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="task-description" className="block text-sm font-medium text-slate-700">Descripción de la Tarea</label>
                        <textarea
                            id="task-description"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
                            placeholder="Ej: Llamar al paciente para control, enviar plan de ejercicio..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="task-assignee" className="block text-sm font-medium text-slate-700">Asignar a</label>
                            <select 
                                id="task-assignee" 
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
                                value={assigneeEmail}
                                onChange={(e) => setAssigneeEmail(e.target.value)}
                            >
                                <option value="">Seleccionar miembro...</option>
                                {allProfesionales.map(p => (
                                    <option key={p.email} value={p.email}>
                                        {p.apellido}, {p.nombres} ({p.rol})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="task-duedate" className="block text-sm font-medium text-slate-700">Fecha de Vencimiento</label>
                            <input 
                                type="date" 
                                id="task-duedate" 
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-6">
                    <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Tarea'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- HISTORY TAB SUB-COMPONENTS ---
const WeightCurveChart = ({ paciente, chartRef, viewMode, surgeryDate, heightInCm }: { 
    paciente: PacienteCompleto, 
    chartRef: React.RefObject<SVGSVGElement>,
    viewMode: 'peso' | 'imc',
    surgeryDate?: string,
    heightInCm: number,
}) => {
    const dataPoints = useMemo(() => {
        if (!paciente.historiaClinica) return [];
        
        const initialPoint = {
            date: paciente.turnos && paciente.turnos.length > 0
                ? new Date(paciente.turnos[paciente.turnos.length - 1].fechaTurno)
                : addMonths(new Date(), -6),
            weight: paciente.historiaClinica.pesoInicial
        };
        
        const evolutionPoints = (paciente.evoluciones || [])
            .map(e => ({
                date: new Date(e.fechaConsulta),
                weight: e.pesoActual
            }))
            .filter(e => e.weight != null && e.weight > 0) as { date: Date; weight: number }[];
            
        const allPoints = [initialPoint, ...evolutionPoints].sort((a, b) => a.date.getTime() - b.date.getTime());

        return allPoints.map(p => ({
            ...p,
            imc: p.weight ? parseFloat((p.weight / ((heightInCm / 100) ** 2)).toFixed(1)) : null
        }));

    }, [paciente, heightInCm]);

    const yAccessor = (d: typeof dataPoints[0]) => viewMode === 'peso' ? d.weight : d.imc;
    const yUnit = viewMode === 'peso' ? 'kg' : 'kg/m²';
    const yAxisTitle = viewMode === 'peso' ? 'Peso (kg)' : 'IMC (kg/m²)';
    
    const validDataPoints = dataPoints.filter(d => yAccessor(d) !== null);

    if (validDataPoints.length < 2) {
        return <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-lg">No hay suficientes datos para mostrar la curva de {viewMode}.</div>;
    }
    
    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const minYValue = Math.min(...validDataPoints.map(yAccessor) as number[]);
    const maxYValue = Math.max(...validDataPoints.map(yAccessor) as number[]);
    const yDomainPadding = (maxYValue - minYValue) * 0.1;

    const minDate = validDataPoints[0].date;
    const maxDate = validDataPoints[validDataPoints.length - 1].date;

    const xScale = (date: Date) => {
        return ((date.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * innerWidth;
    };

    const yScale = (value: number) => {
        return innerHeight - ((value - (minYValue - yDomainPadding)) / ((maxYValue + yDomainPadding) - (minYValue - yDomainPadding))) * innerHeight;
    };
    
    const linePath = validDataPoints.map(d => `${xScale(d.date)},${yScale(yAccessor(d)!)}`).join(' L ');
    const areaPath = `M ${xScale(validDataPoints[0].date)},${innerHeight} L ${linePath} L ${xScale(validDataPoints[validDataPoints.length - 1].date)},${innerHeight} Z`;

    const yAxisTicksCount = 5;
    const yAxisTicks = Array.from({ length: yAxisTicksCount }, (_, i) => {
        const value = (minYValue - yDomainPadding) + i * (((maxYValue + yDomainPadding) - (minYValue - yDomainPadding)) / (yAxisTicksCount - 1));
        return viewMode === 'imc' ? parseFloat(value.toFixed(1)) : Math.round(value);
    });
    
    const xAxisTicksCount = 4;
    const xAxisTicks = Array.from({ length: xAxisTicksCount }, (_, i) => {
       return new Date(minDate.getTime() + i * ((maxDate.getTime() - minDate.getTime()) / (xAxisTicksCount - 1)));
    });

    const surgeryDateObj = surgeryDate ? new Date(surgeryDate.replace(/-/g, '/')) : null;

    return (
        <svg ref={chartRef} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
             <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
             </defs>
            <rect width={width} height={height} fill="white" />
            <g transform={`translate(${margin.left}, ${margin.top})`}>
                {yAxisTicks.map((tick, i) => (
                    <line key={`ygrid-${i}`} x1="0" y1={yScale(tick)} x2={innerWidth} y2={yScale(tick)} stroke="#e2e8f0" strokeWidth="1" />
                ))}
                 {xAxisTicks.map((tick, i) => (
                    <line key={`xgrid-${i}`} x1={xScale(tick)} y1="0" x2={xScale(tick)} y2={innerHeight} stroke="#e2e8f0" strokeWidth="1" />
                ))}
                <line x1="0" y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="#94a3b8" />
                <line x1="0" y1="0" x2="0" y2={innerHeight} stroke="#94a3b8" />
                {yAxisTicks.map((tick,i) => (
                    <g key={`ylabel-${i}`} transform={`translate(0, ${yScale(tick)})`}>
                        <text x="-10" y="4" textAnchor="end" fill="#64748b" fontSize="10">{tick}</text>
                    </g>
                ))}
                 {xAxisTicks.map((tick, i) => (
                    <g key={`xlabel-${i}`} transform={`translate(${xScale(tick)}, ${innerHeight})`}>
                        <text x="0" y="20" textAnchor="middle" fill="#64748b" fontSize="10">{format(tick, 'dd MMM yy')}</text>
                    </g>
                ))}
                 <text x={innerWidth / 2} y={innerHeight + 45} textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">Fecha</text>
                 <text transform={`translate(${-margin.left + 15}, ${innerHeight/2}) rotate(-90)`} textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">{yAxisTitle}</text>
                <path d={areaPath} fill="url(#areaGradient)" />
                <path d={`M ${linePath}`} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {surgeryDateObj && surgeryDateObj >= minDate && surgeryDateObj <= maxDate && (
                    <g transform={`translate(${xScale(surgeryDateObj)}, 0)`}>
                        <line y1="0" y2={innerHeight} stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" />
                        <text x="5" y="15" fill="#ef4444" fontSize="10" fontWeight="bold">Cirugía</text>
                    </g>
                )}
                {validDataPoints.map((d, i) => (
                    <circle key={i} cx={xScale(d.date)} cy={yScale(yAccessor(d)!)} r="4" fill="white" stroke="#4f46e5" strokeWidth="2" className="cursor-pointer">
                        <title>{`${format(d.date, 'dd/MM/yyyy')}: ${yAccessor(d)} ${yUnit}`}</title>
                    </circle>
                ))}
            </g>
        </svg>
    );
};


// Modals for Historia Clinica
type ModalProps = React.PropsWithChildren<{
    title: string;
    onClose: () => void;
    maxWidth?: string;
}>;
const Modal = ({ children, title, onClose, maxWidth = "max-w-xl" }: ModalProps) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className={`bg-white rounded-lg shadow-xl w-full m-4 flex flex-col ${maxWidth}`}>
            <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            {children}
        </div>
    </div>
);

type ModalFormProps = React.PropsWithChildren<{
    onSave: (e: React.FormEvent) => Promise<void>;
    onCancel: () => void;
    isSaving: boolean;
}>;
const ModalForm = ({ children, onSave, onCancel, isSaving }: ModalFormProps) => (
    <form onSubmit={onSave}>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">{children}</div>
        <div className="p-4 bg-slate-50 border-t flex justify-end space-x-3">
            <button type="button" onClick={onCancel} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancelar</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
        </div>
    </form>
);

// Main PatientDossier Component
interface PatientDossierProps {
  patientId: string;
  onBack: () => void;
}

const EvolucionItem = ({ evolucion, allProfesionales, user, onEdit }: {
    key?: React.Key;
    evolucion: EvolucionClinica;
    allProfesionales: Profesional[];
    user: Profesional;
    onEdit: (evolucion: EvolucionClinica) => void;
}) => {
    const profesional = allProfesionales.find(p => p.email === evolucion.emailProfesionalAutor);
    const canEdit = evolucion.emailProfesionalAutor === user.email && isToday(new Date(evolucion.fechaConsulta));

    return (
        <div className="py-4 first:pt-0 last:pb-0">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-slate-800">{evolucion.especialidad}</p>
                    <p className="text-sm text-slate-500">{profesional ? `${profesional.nombres} ${profesional.apellido}` : evolucion.emailProfesionalAutor}</p>
                    <p className="text-xs text-slate-400">{format(new Date(evolucion.fechaConsulta), 'dd/MM/yyyy HH:mm')}hs</p>
                </div>
                <div className="flex items-center gap-2">
                    {evolucion.pesoActual && <span className="text-lg font-bold text-indigo-600">{evolucion.pesoActual} kg</span>}
                    {canEdit && (
                        <button onClick={() => onEdit(evolucion)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md">
                            <PencilIcon />
                        </button>
                    )}
                </div>
            </div>
            <div className="mt-3 space-y-2">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{evolucion.evolucionClinica}</p>
                {evolucion.notaConfidencial && evolucion.notaConfidencial.trim() && (
                    <div className="p-2 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-yellow-800">
                        <p className="font-semibold">Nota Confidencial:</p>
                        <p>{evolucion.notaConfidencial}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const InformeModal = ({
    paciente,
    user,
    informe: initialInforme,
    onClose,
    onSaveSuccess,
}: {
    paciente: PacienteCompleto;
    user: Profesional;
    informe: Partial<InformeClinico>;
    onClose: () => void;
    onSaveSuccess: () => void;
}) => {
    const [informe, setInforme] = useState(initialInforme);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [clipboardStatus, setClipboardStatus] = useState('');
    const printRef = useRef<HTMLDivElement>(null);

    const handleGenerateInforme = async () => {
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const { filiatorio, historiaClinica, evoluciones, cirugia } = paciente;
            const edad = differenceInYears(new Date(), new Date(filiatorio.fechaNacimiento.replace(/-/g, '/')));

            let prompt = `Actúa como un médico especialista en cirugía bariátrica. Genera un informe clínico conciso y profesional para el siguiente paciente. El informe debe ser claro, estructurado y utilizar terminología médica adecuada. No inventes información.

PACIENTE: ${filiatorio.nombres} ${filiatorio.apellido}
EDAD: ${edad} años
DNI: ${filiatorio.dni}

RESUMEN CLÍNICO INICIAL:
- Peso Inicial: ${historiaClinica.pesoInicial} kg
- Talla: ${historiaClinica.talla} cm
- IMC Inicial: ${historiaClinica.imcInicial}
- Comorbilidades: ${historiaClinica.comorbilidades.join(', ') || 'Ninguna referida.'}
- Antecedentes Médicos Relevantes: ${historiaClinica.antecedentesMedicos || 'Sin particularidades.'}
- Medicación Crónica: ${historiaClinica.medicacionCronica || 'Ninguna.'}
`;
            if (cirugia?.fechaRealizada) {
                prompt += `
CIRUGÍA BARIÁTRICA REALIZADA:
- Tipo: ${cirugia.tipoCirugia || 'No especificado'}
- Fecha: ${format(new Date(cirugia.fechaRealizada.replace(/-/g, '/')), 'dd/MM/yyyy')}
`;
            } else if (filiatorio.fechaCirugia) {
                prompt += `
CIRUGÍA BARIÁTRICA PROGRAMADA:
- Fecha: ${format(new Date(filiatorio.fechaCirugia.replace(/-/g, '/')), 'dd/MM/yyyy')}
`;
            }

            if (evoluciones && evoluciones.length > 0) {
                const ultimasEvoluciones = evoluciones.slice(0, 3);
                prompt += `
ÚLTIMAS EVOLUCIONES (resumidas):
${ultimasEvoluciones.map(e => `- Fecha: ${format(new Date(e.fechaConsulta), 'dd/MM/yyyy')}, Peso: ${e.pesoActual || 'N/A'} kg. Nota: ${e.evolucionClinica.substring(0, 100)}...`).join('\n')}
`;
            }

            prompt += `
INSTRUCCIÓN: Basado en la información anterior, genera un informe de resumen del estado actual del paciente, destacando su evolución y estado clínico general.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setInforme(prev => ({ ...prev, contenido: response.text }));
        } catch (error) {
            console.error("Error generando informe con IA:", error);
            alert("No se pudo generar el informe. Verifique la configuración de la API Key.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.guardarInforme(informe as any);
            onSaveSuccess();
        } catch (error) {
            alert("Error al guardar el informe.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handlePrint = () => window.print();
    
    const handleCopy = () => {
        if (informe.contenido) {
            navigator.clipboard.writeText(informe.contenido).then(() => {
                setClipboardStatus('Copiado!');
                setTimeout(() => setClipboardStatus(''), 2000);
            }, () => {
                setClipboardStatus('Error al copiar');
                 setTimeout(() => setClipboardStatus(''), 2000);
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center no-print">
                    <h2 className="text-xl font-bold text-slate-800">Editor de Informes</h2>
                     <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-2xl font-bold">&times;</button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto" ref={printRef}>
                    <div className="print-section">
                        <h3 className="text-lg font-bold text-center">Informe Clínico</h3>
                        <div className="flex justify-between text-sm mt-4 mb-6 border-y py-2">
                            <span><span className="font-semibold">Paciente:</span> {paciente.filiatorio.nombres} {paciente.filiatorio.apellido}</span>
                            <span><span className="font-semibold">Fecha:</span> {format(new Date(), 'dd/MM/yyyy')}</span>
                        </div>
                        <textarea
                            value={informe.contenido || ''}
                            onChange={(e) => setInforme(p => ({...p, contenido: e.target.value}))}
                            placeholder="Escriba el informe aquí o genere uno con IA..."
                            className="w-full h-96 p-2 border rounded-md"
                            disabled={isGenerating}
                        />
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-between items-center no-print">
                     <button
                        onClick={handleGenerateInforme}
                        disabled={isGenerating}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-purple-300"
                    >
                        <AiSparklesIcon/>
                        {isGenerating ? 'Generando...' : 'Generar Resumen con IA'}
                    </button>
                    <div className="flex items-center space-x-3">
                         <button onClick={handleCopy} className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300">
                             <ClipboardIcon/>
                             {clipboardStatus || 'Copiar'}
                         </button>
                         <button onClick={handlePrint} className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300">
                             <PrintIcon/>
                             Imprimir
                         </button>
                        <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancelar</button>
                        <button onClick={handleSave} disabled={isSaving || isGenerating} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                            <SaveIcon/>
                            {isSaving ? 'Guardando...' : 'Guardar Informe'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function PatientDossier({ patientId, onBack }: PatientDossierProps) {
    const authContext = useContext(AuthContext);
    const [paciente, setPaciente] = useState<PacienteCompleto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    
    type ModalType = 'agendarTurno' | 'definirCirugia' | 'editarFicha' | 'verFicha' | 'createTask' | 'editResumen' | 'newEvolucion' | 'editEvolucion' | 'newEstudio' | 'weightCurve' | 'newInforme' | 'editInforme' | 'editCirugia' | 'editNutricion' | 'editPsicologia' | null;
    const [modal, setModal] = useState<ModalType>(null);
    
    const [config, setConfig] = useState<ConfiguracionGeneral | null>(null);
    const [allProfesionales, setAllProfesionales] = useState<Profesional[]>([]);
    
    const chartRef = useRef<SVGSVGElement>(null);
    const [activeEstudiosTab, setActiveEstudiosTab] = useState<TipoEstudio>(TipoEstudio.LABORATORIO);
    const [isSaving, setIsSaving] = useState(false);
    const [chartViewMode, setChartViewMode] = useState<'peso' | 'imc'>('peso');
    const [resumenData, setResumenData] = useState<Partial<HistoriaClinicaEstatica>>({});
    const [evolucionData, setEvolucionData] = useState<Partial<EvolucionClinica>>({});
    const [estudioData, setEstudioData] = useState<Partial<EstudioRealizado>>({});
    const [cirugiaData, setCirugiaData] = useState<Partial<CirugiaInfo>>({});
    const [nutricionData, setNutricionData] = useState<Partial<NutricionInfo>>({});
    const [psicologiaData, setPsicologiaData] = useState<Partial<PsicologiaInfo>>({});
    
    const [currentInforme, setCurrentInforme] = useState<Partial<InformeClinico> | null>(null);
    const [activeResumenSubTab, setActiveResumenSubTab] = useState<'general' | 'cirugia' | 'nutricion' | 'psicologia'>('general');


    const user = authContext!.user!;
    const canEdit = user.rol === UserRole.ADMINISTRATIVO || user.rol === UserRole.MEDICO;

    const fetchData = useCallback(() => {
        setIsLoading(true);
        setError(null);
        Promise.all([
            api.getPacienteCompleto(patientId, user.email),
            api.getConfiguracionGeneral(user.rol),
            api.getProfesionalesAdmin()
        ]).then(([pacienteData, configData, profsData]) => {
            setPaciente(pacienteData);
            setConfig(configData);
            setAllProfesionales(profsData);
        }).catch(err => {
            console.error("Error fetching patient data:", err);
            setError("No se pudo cargar la información del paciente.");
        }).finally(() => {
            setIsLoading(false);
        });
    }, [patientId, user.email, user.rol]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTagChange = async (newTag: string) => {
        if (!paciente) return;
        setShowTagDropdown(false);
        try {
            const updatedFiliatorio = await api.updatePacienteTag(paciente.filiatorio.idPaciente, newTag, user.rol);
            setPaciente(prev => prev ? { ...prev, filiatorio: updatedFiliatorio } : null);
        } catch (error) {
            console.error("Error updating tag:", error);
            alert("No se pudo actualizar la etiqueta.");
        }
    };
    
    const handleConfirmarTurno = async (turnoData: Omit<Turno, 'idTurno' | 'estado'>) => {
        try {
            await api.createTurno(turnoData, user.rol);
            setModal(null);
            fetchData();
        } catch (error) {
            console.error(error);
            alert(`Error al agendar el turno: ${(error as Error).message}`);
            throw error;
        }
    };

    const handleDefinirCirugia = async (tipo: CirugiaTipo, fecha: string) => {
        if (!paciente) return;
        try {
            const updatedFiliatorio = await api.definirCirugia(paciente.filiatorio.idPaciente, tipo, fecha, user.rol);
            setPaciente(prev => prev ? { ...prev, filiatorio: updatedFiliatorio } : null);
            setModal(null);
        } catch (error) {
            console.error("Error defining surgery:", error);
            alert("No se pudo definir la cirugía.");
        }
    };
    
    const handleConfirmTask = async (data: { description: string; assigneeEmail: string; dueDate: string; }) => {
        if (!paciente || !user) return;
        
        try {
            await api.createTask({
                ...data,
                patientId: paciente.filiatorio.idPaciente,
                patientName: `${paciente.filiatorio.apellido}, ${paciente.filiatorio.nombres}`,
                creatorEmail: user.email,
            });
            setModal(null);
            alert('Tarea creada con éxito.');
        } catch(e) {
            console.error(e);
            alert('Error al crear la tarea.');
            throw e; 
        }
    };

    const equipoAsignado = useMemo(() => {
        if (!paciente) return { cirujano: 'N/A', nutricionista: 'N/A', psicologo: 'N/A' };
        
        return {
            cirujano: paciente.filiatorio.cirujanoAsignado || 'No asignado',
            nutricionista: paciente.filiatorio.nutricionistaAsignado || 'No asignado',
            psicologo: paciente.filiatorio.psicologoAsignado || 'No asignado',
        };
    }, [paciente]);

    const handleSaveResumen = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paciente) return;
        setIsSaving(true);
        try {
            await api.updateHistoriaClinica(paciente.filiatorio.idPaciente, resumenData, user.rol);
            fetchData();
            setModal(null);
        } catch (error: any) {
            const isAuthError = error?.status === 400 ||
                error?.message?.toLowerCase().includes('refresh token') ||
                error?.message?.toLowerCase().includes('invalid');
            if (isAuthError) {
                alert('Tu sesión expiró. Por favor, volvé a iniciar sesión.');
                window.location.href = '/login';
                return;
            }
            console.error(error);
            alert('Error al guardar. Intente nuevamente.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSaveEvolucion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paciente) return;
        setIsSaving(true);
        const { idEvolucion, ...newDataPayload } = evolucionData;
        
        if (!newDataPayload.pesoActual || newDataPayload.pesoActual <= 0) {
            delete newDataPayload.pesoActual;
        }

        const newData: Omit<EvolucionClinica, 'idEvolucion'> = {
            idPaciente: paciente.filiatorio.idPaciente,
            fechaConsulta: new Date().toISOString(),
            emailProfesionalAutor: user.email,
            especialidad: user.especialidad || 'Médico',
            ...(newDataPayload as any)
        };
        try {
            await api.createEvolucion(newData, user.rol);
            fetchData();
            setModal(null);
        } catch (error) { console.error(error); } finally { setIsSaving(false); }
    };

    const handleUpdateEvolucion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!evolucionData.idEvolucion) return;
        setIsSaving(true);
        try {
            const { idEvolucion, ...updates } = evolucionData;
            
            if (!updates.pesoActual || updates.pesoActual <= 0) {
                updates.pesoActual = undefined;
            }

            await api.updateEvolucion(idEvolucion, updates as any, user);
            fetchData();
            setModal(null);
        } catch (error) {
            console.error("Error updating evolucion", error);
            alert(`Error: ${(error as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateEstudio = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paciente) return;
        setIsSaving(true);
        try {
            const newEstudio: Omit<EstudioRealizado, 'idEstudio'> = {
                idPaciente: paciente.filiatorio.idPaciente,
                fecha: estudioData.fecha || format(new Date(), 'yyyy-MM-dd'),
                tipo: estudioData.tipo || TipoEstudio.OTROS,
                nombreArchivo: estudioData.nombreArchivo,
                descripcion: estudioData.descripcion,
                resultados: estudioData.tipo === TipoEstudio.LABORATORIO 
                    ? estudioData.resultados?.filter(r => r.valor && r.valor.trim() !== '') 
                    : undefined,
                resultadoBiopsia: estudioData.tipo === TipoEstudio.ENDOSCOPIA ? estudioData.resultadoBiopsia : undefined,
            };
            await api.createEstudio(newEstudio, user);
            fetchData();
            setModal(null);
        } catch (error) { console.error("Error creating study:", error); } 
        finally { setIsSaving(false); }
    };

    const handleLabResultChange = (index: number, field: keyof ResultadoLaboratorio, value: string) => {
        if (!estudioData.resultados) return;
        const newResultados = [...estudioData.resultados];
        const updatedResult: ResultadoLaboratorio = { ...newResultados[index], [field]: value };
    
        if (field === 'parametro' && config?.plantillaLaboratorio) {
            const templateParam = config.plantillaLaboratorio.find(p => p.parametro === value);
            if (templateParam) {
                updatedResult.unidad = templateParam.unidad;
            }
        }
    
        newResultados[index] = updatedResult;
        setEstudioData(prev => ({ ...prev, resultados: newResultados }));
    };
    
    const addLabResultRow = () => {
        const newRow: ResultadoLaboratorio = { parametro: '', valor: '', unidad: '' };
        setEstudioData(prev => ({
            ...prev,
            resultados: [...(prev.resultados || []), newRow]
        }));
    };
    
    const removeLabResultRow = (index: number) => {
        if (!estudioData.resultados) return;
        const newResultados = estudioData.resultados.filter((_, i) => i !== index);
        setEstudioData(prev => ({ ...prev, resultados: newResultados }));
    };

    const handleExportChart = () => {
        const svg = chartRef.current;
        if (!svg) return;
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const svgSize = svg.getBoundingClientRect();
        canvas.width = svgSize.width * 2;
        canvas.height = svgSize.height * 2;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const a = document.createElement("a");
            a.href = canvas.toDataURL("image/png");
            a.setAttribute("download", `curva_peso_${paciente?.filiatorio.apellido}.png`);
            a.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };
    
    const handleOpenInformeModal = (informe?: InformeClinico) => {
        if (informe) {
            setCurrentInforme(informe);
            setModal('editInforme');
        } else {
            setCurrentInforme({
                idPaciente: paciente!.filiatorio.idPaciente,
                emailProfesionalAutor: user.email,
                tipoInforme: 'Resumen Clínico',
                contenido: '',
            });
            setModal('newInforme');
        }
    };

    const handleSaveCirugia = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paciente) return;
        setIsSaving(true);
        try {
            await api.updateCirugiaInfo(paciente.filiatorio.idPaciente, cirugiaData, user);
            fetchData();
            setModal(null);
        } catch (error) { console.error(error); alert((error as Error).message); }
        finally { setIsSaving(false); }
    };
    const handleSaveNutricion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paciente) return;
        setIsSaving(true);
        try {
            await api.updateNutricionInfo(paciente.filiatorio.idPaciente, nutricionData, user);
            fetchData();
            setModal(null);
        } catch (error) { console.error(error); alert((error as Error).message); }
        finally { setIsSaving(false); }
    };
    const handleSavePsicologia = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paciente) return;
        setIsSaving(true);
        try {
            await api.updatePsicologiaInfo(paciente.filiatorio.idPaciente, psicologiaData, user);
            fetchData();
            setModal(null);
        } catch (error) { console.error(error); alert((error as Error).message); }
        finally { setIsSaving(false); }
    };


    if (isLoading) return <div className="text-center p-10">Cargando legajo del paciente...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
    if (!paciente || !paciente.historiaClinica) return <div className="text-center p-10">No se encontró al paciente o su historia clínica.</div>;
    
    const { filiatorio, historiaClinica } = paciente;
    const etiquetaInfo = ETIQUETAS_FLUJO.find(e => e.nombreEtiquetaUnico === filiatorio.etiquetaPrincipalActiva) || { color: 'bg-gray-200 text-gray-800' };

    const renderResumenClinico = () => (
        <div className="bg-white p-6 rounded-lg shadow space-y-4 h-full">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setActiveResumenSubTab('general')} className={`py-2 px-1 border-b-2 text-sm font-medium ${activeResumenSubTab === 'general' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>General</button>
                    <button onClick={() => setActiveResumenSubTab('cirugia')} className={`py-2 px-1 border-b-2 text-sm font-medium ${activeResumenSubTab === 'cirugia' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Cirugía</button>
                    <button onClick={() => setActiveResumenSubTab('nutricion')} className={`py-2 px-1 border-b-2 text-sm font-medium ${activeResumenSubTab === 'nutricion' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Nutrición</button>
                    <button onClick={() => setActiveResumenSubTab('psicologia')} className={`py-2 px-1 border-b-2 text-sm font-medium ${activeResumenSubTab === 'psicologia' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Psicología</button>
                </nav>
            </div>

            <div className="pt-4">
                {activeResumenSubTab === 'general' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">Resumen Clínico</h3>
                            {user.rol === UserRole.MEDICO && (
                                <div className="flex items-center gap-2">
                                     <button onClick={() => setModal('weightCurve')} className="flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-2 rounded-md hover:bg-indigo-100"><ChartBarIcon/>Curva</button>
                                     <button onClick={() => { setResumenData(paciente.historiaClinica); setModal('editResumen'); }} className="flex items-center text-sm font-medium text-white bg-indigo-600 px-3 py-2 rounded-md shadow-sm hover:bg-indigo-700"><PencilIcon/>Editar</button>
                                </div>
                            )}
                        </div>
                         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                            <div className="bg-slate-50 p-3 rounded-lg"><span className="text-xs text-slate-500">Peso Inicial</span><p className="font-bold text-lg">{historiaClinica.pesoInicial} kg</p></div>
                            <div className="bg-slate-50 p-3 rounded-lg"><span className="text-xs text-slate-500">Talla</span><p className="font-bold text-lg">{historiaClinica.talla} cm</p></div>
                            <div className="bg-slate-50 p-3 rounded-lg"><span className="text-xs text-slate-500">IMC Inicial</span><p className="font-bold text-lg">{historiaClinica.imcInicial}</p></div>
                            <div className="bg-slate-50 p-3 rounded-lg"><span className="text-xs text-slate-500">Último Peso</span><p className="font-bold text-lg text-indigo-600">{paciente.evoluciones?.[0]?.pesoActual || '-'} kg</p></div>
                        </div>
                        
                        {(paciente.cirugia?.fechaRealizada || paciente.cirugia?.fechaProgramada) && (
                            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                                <h4 className="font-bold text-orange-800 mb-2">Info Quirúrgica</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    <div>
                                        <strong className="text-slate-600">
                                            {paciente.cirugia.fechaRealizada ? 'Fecha Cx Realizada:' : 'Fecha Cx Programada:'}
                                        </strong>
                                        <p className="text-slate-800 font-semibold">
                                            {format(new Date((paciente.cirugia.fechaRealizada || paciente.cirugia.fechaProgramada)!.replace(/-/g, '/')), 'dd/MM/yyyy')}
                                        </p>
                                    </div>
                                    <div>
                                        <strong className="text-slate-600">Tipo de Cirugía:</strong>
                                        <p className="text-slate-800 font-semibold">
                                            {paciente.cirugia.tipoCirugia || 'No especificado'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div><strong className="text-sm text-slate-600">Comorbilidades:</strong><p className="text-sm text-slate-800">{historiaClinica.comorbilidades.join(', ')}</p></div>
                        <div><strong className="text-sm text-slate-600">Medicación Crónica:</strong><p className="text-sm text-slate-800">{historiaClinica.medicacionCronica}</p></div>
                    </div>
                )}
                {activeResumenSubTab === 'cirugia' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-800">Información Quirúrgica</h3>
                            {user.rol === UserRole.MEDICO && <button onClick={() => { setCirugiaData(paciente.cirugia || {}); setModal('editCirugia'); }} className="flex items-center text-sm font-medium text-white bg-indigo-600 px-3 py-2 rounded-md"><PencilIcon/>Editar</button>}
                        </div>
                        <div className="space-y-2 text-sm">
                            <p><strong>Fecha Programada:</strong> {paciente.cirugia?.fechaProgramada ? format(new Date(paciente.cirugia.fechaProgramada.replace(/-/g, '/')), 'dd/MM/yyyy') : 'N/A'}</p>
                            <p><strong>Fecha Realizada:</strong> {paciente.cirugia?.fechaRealizada ? format(new Date(paciente.cirugia.fechaRealizada.replace(/-/g, '/')), 'dd/MM/yyyy') : 'N/A'}</p>
                            <p><strong>Tipo de Cirugía:</strong> {paciente.cirugia?.tipoCirugia || 'N/A'}</p>
                            <p><strong>Notas:</strong> {paciente.cirugia?.notas || 'Sin notas.'}</p>
                        </div>
                    </div>
                )}
                {activeResumenSubTab === 'nutricion' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-800">Seguimiento Nutricional</h3>
                            {user.rol === UserRole.MEDICO && <button onClick={() => { setNutricionData(paciente.nutricion || {}); setModal('editNutricion'); }} className="flex items-center text-sm font-medium text-white bg-indigo-600 px-3 py-2 rounded-md"><PencilIcon/>Editar</button>}
                        </div>
                         <div className="space-y-2 text-sm">
                            <p><strong>Perímetro Cintura:</strong> {paciente.nutricion?.perimetroCintura ? `${paciente.nutricion.perimetroCintura} cm` : 'N/A'}</p>
                            <p><strong>Perímetro Cuello:</strong> {paciente.nutricion?.perimetroCuello ? `${paciente.nutricion.perimetroCuello} cm` : 'N/A'}</p>
                            <p><strong>Composición Corporal:</strong> {paciente.nutricion?.composicionCorporal || 'N/A'}</p>
                        </div>
                    </div>
                )}
                {activeResumenSubTab === 'psicologia' && (
                    <div>
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-800">Notas de Psicología</h3>
                            {paciente.psicologia && paciente.psicologia.psicologoEmailAutor === user.email && <button onClick={() => { setPsicologiaData(paciente.psicologia || {}); setModal('editPsicologia'); }} className="flex items-center text-sm font-medium text-white bg-indigo-600 px-3 py-2 rounded-md"><PencilIcon/>Editar</button>}
                        </div>
                        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                            <div className="flex items-center">
                                <LockClosedIcon className="w-6 h-6 text-yellow-600 mr-3"/>
                                <div>
                                    <h4 className="font-bold text-yellow-800">Contenido Confidencial</h4>
                                    <p className="text-sm text-yellow-700 whitespace-pre-wrap">{paciente.psicologia?.notasPrivadas || 'No hay notas registradas o no tiene permiso para verlas.'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderEstudios = () => (
        <div className="bg-white rounded-lg shadow h-full">
             <div className="flex justify-between items-center p-4 border-b">
                 <h3 className="text-xl font-bold text-slate-800">Estudios y Archivos</h3>
                 {user.rol === UserRole.MEDICO && (
                    <button onClick={() => {
                        setEstudioData({
                            fecha: format(new Date(), 'yyyy-MM-dd'),
                            tipo: TipoEstudio.LABORATORIO,
                            resultados: [],
                        });
                        setModal('newEstudio');
                    }} className="flex items-center text-sm font-medium text-white bg-green-600 px-4 py-2 rounded-md shadow-sm hover:bg-green-700"><DocumentPlusIcon/>Registrar</button>
                 )}
            </div>
             <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6 px-4">
                    {TIPOS_ESTUDIO.map(tipo => {
                        const hasEstudios = paciente.estudios?.some(e => e.tipo === tipo.value);
                        const isActive = activeEstudiosTab === tipo.value;
                        
                        let buttonClasses = 'whitespace-nowrap py-3 px-1 border-b-2 text-sm transition-colors ';
                        if (isActive) {
                            buttonClasses += 'border-indigo-500 text-indigo-600 font-bold';
                        } else if (hasEstudios) {
                            buttonClasses += 'border-transparent text-sky-700 font-semibold hover:text-sky-800 hover:border-gray-300';
                        } else {
                            buttonClasses += 'border-transparent text-gray-500 font-medium hover:text-gray-700 hover:border-gray-300';
                        }

                        return (
                            <button key={tipo.value} onClick={() => setActiveEstudiosTab(tipo.value)} className={buttonClasses}>
                                {tipo.label}
                            </button>
                        )
                    })}
                </nav>
            </div>
             <div className="p-4 space-y-3">
                {(paciente.estudios || []).filter(e => e.tipo === activeEstudiosTab).length > 0 ? (
                    (paciente.estudios || []).filter(e => e.tipo === activeEstudiosTab).map(estudio => (
                        <div key={estudio.idEstudio} className="bg-slate-50 p-3 rounded-md border">
                            <p className="font-semibold text-sm">{format(new Date(estudio.fecha.replace(/-/g, '/')), 'dd/MM/yyyy')} - {estudio.descripcion || estudio.tipo}</p>
                            {estudio.nombreArchivo && <a href="#" className="text-xs text-indigo-600 hover:underline">{estudio.nombreArchivo}</a>}
                            {estudio.resultados && (
                                <div className="mt-2 text-xs grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                                    {estudio.resultados.map(r => <div key={r.parametro}><strong>{r.parametro}:</strong> {r.valor} {r.unidad}</div>)}
                                </div>
                            )}
                            {estudio.resultadoBiopsia && <p className="mt-2 text-xs"><strong>Biopsia:</strong> {estudio.resultadoBiopsia}</p>}
                        </div>
                    ))
                ) : (
                     <p className="text-sm text-center text-slate-500 py-4">No hay estudios de este tipo.</p>
                )}
            </div>
        </div>
    );

    const renderEvoluciones = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
                 <h3 className="text-xl font-bold text-slate-800">Evoluciones</h3>
                 {user.rol === UserRole.MEDICO && (
                    <button onClick={() => { setEvolucionData({ evolucionClinica: '', notaConfidencial: ''}); setModal('newEvolucion'); }} className="flex items-center text-sm font-medium text-white bg-green-600 px-4 py-2 rounded-md shadow-sm hover:bg-green-700"><DocumentPlusIcon/>Nueva Evolución</button>
                 )}
            </div>
            {paciente.evoluciones && paciente.evoluciones.length > 0 ? (
                <div className="bg-white p-4 rounded-lg shadow divide-y divide-slate-200">
                    {paciente.evoluciones.map(evo => (
                        <EvolucionItem 
                            key={evo.idEvolucion} 
                            evolucion={evo} 
                            allProfesionales={allProfesionales}
                            user={user}
                            onEdit={(e) => { setEvolucionData(e); setModal('editEvolucion'); }}
                        />
                    ))}
                </div>
            ) : (
                 <div className="bg-white p-6 rounded-lg shadow text-center text-slate-500">No hay evoluciones registradas.</div>
            )}
        </div>
    );

    return (
        <div>
            {/* Modals */}
            {modal === 'agendarTurno' && config && <AgendarTurnoModal onConfirm={handleConfirmarTurno} onCancel={() => setModal(null)} profesionales={allProfesionales.filter(p => p.rol === UserRole.MEDICO && p.activo)} pacienteId={filiatorio.idPaciente} config={config} currentUser={user} />}
            {modal === 'definirCirugia' && <DefinirCirugiaModal onConfirm={handleDefinirCirugia} onCancel={() => setModal(null)} />}
            {modal === 'editarFicha' && <EditarPacienteModal paciente={filiatorio} onClose={() => setModal(null)} onSuccess={() => { setModal(null); fetchData(); }} />}
            {modal === 'verFicha' && <FichaModal paciente={paciente} equipoAsignado={equipoAsignado} onClose={() => setModal(null)} onEdit={() => { setModal(null); setTimeout(() => setModal('editarFicha'), 100); }} canEdit={canEdit} />}
            {modal === 'createTask' && <CreateTaskModal open={modal==='createTask'} onClose={() => setModal(null)} allProfesionales={allProfesionales} onConfirm={handleConfirmTask} />}
            {(modal === 'newInforme' || modal === 'editInforme') && currentInforme && (
                <InformeModal 
                    paciente={paciente}
                    user={user}
                    informe={currentInforme}
                    onClose={() => setModal(null)}
                    onSaveSuccess={() => { setModal(null); fetchData(); }}
                />
            )}

            {/* ── editResumen modal ─────────────────────────────────────────────── */}
            {modal === 'editResumen' && (
                <Modal title="Editar Resumen Clínico" onClose={() => setModal(null)} maxWidth="max-w-3xl">
                    <ModalForm onSave={handleSaveResumen} onCancel={() => setModal(null)} isSaving={isSaving}>
                        <div className="grid grid-cols-2 gap-4">
                            {/* FIX: value con fallback '' y onChange con guard para string vacío */}
                            <div>
                                <label className="block text-sm font-medium">Peso Inicial (kg)</label>
                                <input
                                    type="number"
                                    value={resumenData.pesoInicial ?? ''}
                                    onChange={e => setResumenData(p => ({
                                        ...p,
                                        pesoInicial: e.target.value === '' ? 0 : parseFloat(e.target.value)
                                    }))}
                                    className="mt-1 block w-full rounded-md border-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Talla (cm)</label>
                                <input
                                    type="number"
                                    value={resumenData.talla ?? ''}
                                    onChange={e => setResumenData(p => ({
                                        ...p,
                                        talla: e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                                    }))}
                                    className="mt-1 block w-full rounded-md border-slate-300"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Comorbilidades</label>
                             <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {COMORBILIDADES_PREDEFINIDAS.map(c => (
                                    <label key={c} className="flex items-center text-sm">
                                        <input
                                            type="checkbox"
                                            checked={resumenData.comorbilidades?.includes(c) ?? false}
                                            onChange={e => {
                                                const currentComorbilidades = resumenData.comorbilidades || [];
                                                const newComorbilidades = e.target.checked
                                                    ? [...currentComorbilidades, c]
                                                    : currentComorbilidades.filter(item => item !== c);
                                                setResumenData(p => ({...p, comorbilidades: newComorbilidades}));
                                            }}
                                            className="rounded"
                                        />
                                        <span className="ml-2">{c}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        {/* FIX: textareas con fallback '' para evitar uncontrolled→controlled warning */}
                        <div>
                            <label className="block text-sm font-medium">Medicación Crónica</label>
                            <textarea
                                value={resumenData.medicacionCronica ?? ''}
                                onChange={e => setResumenData(p => ({...p, medicacionCronica: e.target.value}))}
                                rows={2}
                                className="mt-1 block w-full rounded-md border-slate-300"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Antecedentes Médicos</label>
                            <textarea
                                value={resumenData.antecedentesMedicos ?? ''}
                                onChange={e => setResumenData(p => ({...p, antecedentesMedicos: e.target.value}))}
                                rows={2}
                                className="mt-1 block w-full rounded-md border-slate-300"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Antecedentes Quirúrgicos</label>
                            <textarea
                                value={resumenData.antecedentesQuirurgicos ?? ''}
                                onChange={e => setResumenData(p => ({...p, antecedentesQuirurgicos: e.target.value}))}
                                rows={2}
                                className="mt-1 block w-full rounded-md border-slate-300"
                            />
                        </div>
                    </ModalForm>
                </Modal>
            )}

            {(modal === 'newEvolucion' || modal === 'editEvolucion') && (
                <Modal title={modal === 'newEvolucion' ? "Nueva Evolución" : "Editar Evolución"} onClose={() => setModal(null)} maxWidth="max-w-2xl">
                    <ModalForm onSave={modal === 'newEvolucion' ? handleSaveEvolucion : handleUpdateEvolucion} onCancel={() => setModal(null)} isSaving={isSaving}>
                        <div>
                            <label className="block text-sm font-medium">Peso Actual (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={evolucionData.pesoActual ?? ''}
                                onChange={e => setEvolucionData(p => ({
                                    ...p,
                                    pesoActual: e.target.value === '' ? undefined : parseFloat(e.target.value)
                                }))}
                                placeholder="Opcional"
                                className="mt-1 block w-full rounded-md border-slate-300"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Evolución Clínica</label>
                            <textarea
                                value={evolucionData.evolucionClinica ?? ''}
                                onChange={e => setEvolucionData(p => ({...p, evolucionClinica: e.target.value}))}
                                rows={5}
                                required
                                className="mt-1 block w-full rounded-md border-slate-300"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Nota Confidencial (solo visible para usted)</label>
                            <textarea
                                value={evolucionData.notaConfidencial ?? ''}
                                onChange={e => setEvolucionData(p => ({...p, notaConfidencial: e.target.value}))}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-slate-300"
                            />
                        </div>
                    </ModalForm>
                </Modal>
            )}
            {modal === 'newEstudio' && (
                <Modal title="Registrar Nuevo Estudio" onClose={() => setModal(null)} maxWidth="max-w-3xl">
                    <ModalForm onSave={handleCreateEstudio} onCancel={() => setModal(null)} isSaving={isSaving}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Fecha</label>
                                <input type="date" value={estudioData.fecha ?? ''} onChange={e => setEstudioData(p => ({...p, fecha: e.target.value}))} className="mt-1 block w-full rounded-md border-slate-300" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Tipo de Estudio</label>
                                <select value={estudioData.tipo} onChange={e => setEstudioData(p => ({...p, tipo: e.target.value as TipoEstudio, resultados: [], resultadoBiopsia: ''}))} className="mt-1 block w-full rounded-md border-slate-300">
                                    {TIPOS_ESTUDIO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Descripción / Título</label>
                            <input type="text" value={estudioData.descripcion ?? ''} onChange={e => setEstudioData(p => ({...p, descripcion: e.target.value}))} className="mt-1 block w-full rounded-md border-slate-300" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Nombre de Archivo (Opcional)</label>
                            <input type="text" value={estudioData.nombreArchivo ?? ''} onChange={e => setEstudioData(p => ({...p, nombreArchivo: e.target.value}))} placeholder="ej: ecografia_juan_perez.pdf" className="mt-1 block w-full rounded-md border-slate-300" />
                        </div>

                        {estudioData.tipo === TipoEstudio.LABORATORIO && (
                            <div className="pt-4 mt-4 border-t">
                                <h4 className="text-md font-semibold text-slate-700 mb-2">Resultados de Laboratorio</h4>
                                <div className="space-y-2">
                                    {(estudioData.resultados || []).map((res, index) => (
                                        <div key={index} className="grid grid-cols-10 gap-2 items-center">
                                            <div className="col-span-4">
                                                <label className="sr-only">Parámetro</label>
                                                <select 
                                                    value={res.parametro} 
                                                    onChange={e => handleLabResultChange(index, 'parametro', e.target.value)}
                                                    className="w-full rounded-md border-slate-300 text-sm"
                                                >
                                                    <option value="">Seleccionar parámetro...</option>
                                                    {config?.plantillaLaboratorio.map(p => <option key={p.id} value={p.parametro}>{p.parametro}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="sr-only">Valor</label>
                                                <input type="text" placeholder="Valor" value={res.valor} onChange={e => handleLabResultChange(index, 'valor', e.target.value)} className="w-full rounded-md border-slate-300 text-sm"/>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="sr-only">Unidad</label>
                                                <input type="text" placeholder="Unidad" value={res.unidad} onChange={e => handleLabResultChange(index, 'unidad', e.target.value)} className="w-full rounded-md border-slate-300 text-sm bg-slate-50"/>
                                            </div>
                                            <div className="col-span-2 flex justify-end">
                                                <button type="button" onClick={() => removeLabResultRow(index)} className="text-red-500 hover:text-red-700 p-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.077-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addLabResultRow} className="mt-3 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200">
                                    + Añadir Parámetro
                                </button>
                            </div>
                        )}
                        {estudioData.tipo === TipoEstudio.ENDOSCOPIA && (
                            <div className="pt-4 mt-4 border-t">
                                <label className="block text-sm font-medium">Resultado de Biopsia (Opcional)</label>
                                <textarea 
                                    value={estudioData.resultadoBiopsia ?? ''} 
                                    onChange={e => setEstudioData(p => ({...p, resultadoBiopsia: e.target.value}))} 
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-slate-300"
                                />
                            </div>
                        )}
                    </ModalForm>
                </Modal>
            )}
            {modal === 'weightCurve' && (
                <Modal title="Curva de Peso e IMC" onClose={() => setModal(null)} maxWidth="max-w-2xl">
                    <div className="p-4">
                        <div className="flex justify-center items-center gap-2 mb-4">
                            <button onClick={() => setChartViewMode('peso')} className={`px-3 py-1 text-sm rounded-full ${chartViewMode === 'peso' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>Peso</button>
                            <button onClick={() => setChartViewMode('imc')} className={`px-3 py-1 text-sm rounded-full ${chartViewMode === 'imc' ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>IMC</button>
                             <button onClick={handleExportChart} className="ml-auto px-3 py-1 text-sm rounded-md bg-slate-100 hover:bg-slate-200">Exportar</button>
                        </div>
                       <WeightCurveChart paciente={paciente} chartRef={chartRef} viewMode={chartViewMode} surgeryDate={paciente.cirugia?.fechaRealizada || filiatorio.fechaCirugia} heightInCm={paciente.historiaClinica.talla} />
                    </div>
                </Modal>
            )}
            {modal === 'editCirugia' && (
                <Modal title="Editar Información de Cirugía" onClose={() => setModal(null)} maxWidth="max-w-xl">
                    <ModalForm onSave={handleSaveCirugia} onCancel={() => setModal(null)} isSaving={isSaving}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Fecha Programada</label>
                                <input type="date" value={cirugiaData.fechaProgramada ?? ''} onChange={e => setCirugiaData(p => ({...p, fechaProgramada: e.target.value}))} className="mt-1 block w-full rounded-md border-slate-300" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Fecha Realizada</label>
                                <input type="date" value={cirugiaData.fechaRealizada ?? ''} onChange={e => setCirugiaData(p => ({...p, fechaRealizada: e.target.value}))} className="mt-1 block w-full rounded-md border-slate-300" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Tipo de Cirugía</label>
                            <select value={cirugiaData.tipoCirugia ?? ''} onChange={e => setCirugiaData(p => ({...p, tipoCirugia: e.target.value as TipoCirugiaBariatrica}))} className="mt-1 block w-full rounded-md border-slate-300">
                                <option value="">Seleccionar...</option>
                                {TIPOS_CIRUGIA_BARIATRICA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Notas</label>
                            <textarea value={cirugiaData.notas ?? ''} onChange={e => setCirugiaData(p => ({...p, notas: e.target.value}))} rows={3} className="mt-1 block w-full rounded-md border-slate-300" />
                        </div>
                    </ModalForm>
                </Modal>
            )}
             {modal === 'editNutricion' && (
                <Modal title="Editar Seguimiento Nutricional" onClose={() => setModal(null)} maxWidth="max-w-2xl">
                    <ModalForm onSave={handleSaveNutricion} onCancel={() => setModal(null)} isSaving={isSaving}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Perímetro Cintura (cm)</label>
                                <input
                                    type="number"
                                    value={nutricionData.perimetroCintura ?? ''}
                                    onChange={e => setNutricionData(p => ({
                                        ...p,
                                        perimetroCintura: e.target.value === '' ? undefined : e.target.valueAsNumber
                                    }))}
                                    className="mt-1 block w-full rounded-md border-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Perímetro Cuello (cm)</label>
                                <input
                                    type="number"
                                    value={nutricionData.perimetroCuello ?? ''}
                                    onChange={e => setNutricionData(p => ({
                                        ...p,
                                        perimetroCuello: e.target.value === '' ? undefined : e.target.valueAsNumber
                                    }))}
                                    className="mt-1 block w-full rounded-md border-slate-300"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Composición Corporal</label>
                            <textarea value={nutricionData.composicionCorporal ?? ''} onChange={e => setNutricionData(p => ({...p, composicionCorporal: e.target.value}))} rows={2} className="mt-1 block w-full rounded-md border-slate-300" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Hábitos Alimentarios</label>
                            <textarea value={nutricionData.habitosAlimentarios ?? ''} onChange={e => setNutricionData(p => ({...p, habitosAlimentarios: e.target.value}))} rows={3} className="mt-1 block w-full rounded-md border-slate-300" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Hábitos Ejercicio</label>
                            <textarea value={nutricionData.habitosEjercicio ?? ''} onChange={e => setNutricionData(p => ({...p, habitosEjercicio: e.target.value}))} rows={2} className="mt-1 block w-full rounded-md border-slate-300" />
                        </div>
                    </ModalForm>
                </Modal>
            )}
            {modal === 'editPsicologia' && (
                <Modal title="Editar Notas de Psicología" onClose={() => setModal(null)} maxWidth="max-w-xl">
                    <ModalForm onSave={handleSavePsicologia} onCancel={() => setModal(null)} isSaving={isSaving}>
                         <div>
                            <label className="block text-sm font-medium text-yellow-800 flex items-center"><LockClosedIcon className="w-4 h-4 mr-1"/>Notas Privadas</label>
                            <p className="text-xs text-slate-500 mb-2">Estas notas solo son visibles para usted.</p>
                            <textarea value={psicologiaData.notasPrivadas ?? ''} onChange={e => setPsicologiaData(p => ({...p, notasPrivadas: e.target.value}))} rows={8} className="mt-1 block w-full rounded-md border-slate-300 bg-yellow-50" />
                        </div>
                    </ModalForm>
                </Modal>
            )}

            <button onClick={onBack} className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 mb-4">
                <ArrowLeftIcon /> Volver al panel
            </button>
            
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6 relative">
                 <div className="flex items-start">
                    <UserPhotoPlaceholderIcon />
                    <div className="ml-6 flex-grow">
                         <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-bold text-slate-800">{filiatorio.apellido}, {filiatorio.nombres}</h2>
                            <div className="relative">
                                <button onClick={() => setShowTagDropdown(!showTagDropdown)} onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)} className={`flex items-center px-3 py-2 text-sm font-semibold rounded-full ${etiquetaInfo.color}`}>
                                    <TagIcon />
                                    {filiatorio.etiquetaPrincipalActiva.replace(/_/g, ' ')}
                                    <ChevronDownIcon/>
                                </button>
                                {showTagDropdown && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border">
                                        {ETIQUETAS_FLUJO.map(tag => (
                                            <button key={tag.nombreEtiquetaUnico} onClick={() => handleTagChange(tag.nombreEtiquetaUnico)} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 ${filiatorio.etiquetaPrincipalActiva === tag.nombreEtiquetaUnico ? 'font-bold' : ''}`}>
                                                {tag.nombreEtiquetaUnico.replace(/_/g, ' ')}
                                            </button>
                                        ))}
                                         {filiatorio.etiquetaPrincipalActiva === 'DEFINIR_CIRUGIA' && (
                                            <button onClick={() => setModal('definirCirugia')} className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 font-bold text-green-700 border-t">
                                                Definir Fecha de Cirugía...
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                         </div>
                         <div className="flex items-center gap-6 mt-4 text-sm text-slate-600">
                             <button onClick={() => setModal('verFicha')} className="flex items-center gap-1 hover:text-indigo-600 hover:underline"><IdentificationIcon /> Ver Ficha</button>
                             <button onClick={() => setModal('agendarTurno')} className="flex items-center gap-1 hover:text-indigo-600 hover:underline"><CalendarDaysIcon /> Agendar Turno</button>
                             <button onClick={() => setModal('createTask')} className="flex items-center gap-1 hover:text-indigo-600 hover:underline"><ClipboardPlusIcon />+ Crear Tarea</button>
                             <button onClick={() => handleOpenInformeModal()} className="flex items-center gap-1 hover:text-indigo-600 hover:underline"><PencilSquareIcon /> Ver/Crear Informes</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="lg:col-span-1">
                    {renderResumenClinico()}
                </div>
                <div className="lg:col-span-1">
                    {renderEstudios()}
                </div>
                <div className="lg:col-span-2">
                    {renderEvoluciones()}
                </div>
            </div>
        </div>
    );
}