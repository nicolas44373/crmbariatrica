import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PacienteCompleto, EtiquetaFlujo, UserRole, CirugiaTipo, Profesional, Turno, ConfiguracionGeneral, DiaSemana, TurnoConPaciente, EstadoTurnoDia, PacienteFiliatorio, HistoriaClinicaEstatica, TipoEstudio, EvolucionClinica, EstudioRealizado, ResultadoLaboratorio, PlantillaLaboratorioParametro, CirugiaInfo, TipoCirugiaBariatrica, NutricionInfo, PsicologiaInfo, InformeClinico, Task, Priority, PostOpStage } from '../types';
import { api } from '../services/mockApi';
import { AuthContext } from '../App';
import { ETIQUETAS_FLUJO, PROFESIONALES, DIAS_SEMANA_MAP, ESTADO_TURNO_MAP, COMORBILIDADES_PREDEFINIDAS, COMORBILIDADES_CATEGORIZADAS, TIPOS_ESTUDIO, TIPOS_CIRUGIA_BARIATRICA } from '../constants';
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
import { checkPrintFit, PRINT_OVERFLOW_MESSAGE } from '../services/printGuard';
import { TurnHistoryModal } from './TurnHistoryModal';
import { PedidosRecetasModal } from './Pedidosrecetasmodal';
import AgendarTurnoModal from './Agendarturnomodal';
import { FolderModal } from './FolderModal';
import { CrmSimpleProfessionals } from '../types';
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
const EditarPacienteModal = ({ paciente, onClose, onSuccess, onDelete }: { paciente: PacienteFiliatorio, onClose: () => void, onSuccess: () => void, onDelete?: () => void }) => {
    const authContext = useContext(AuthContext);
    const [formData, setFormData] = useState(paciente);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [obrasSociales, setObrasSociales] = useState<string[]>([]);
    const [profesionales, setProfesionales] = useState<Profesional[]>([]);
    const [isUploadingFoto, setIsUploadingFoto] = useState(false);

    const user = authContext!.user!;

    const handleFotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setIsUploadingFoto(true);
        setError(null);
        try {
            const url = await (api as any).uploadEstudioFile(paciente.idPaciente, file, 'foto-perfil');
            setFormData(prev => ({ ...prev, fotoPerfil: url }));
        } catch (err: any) {
            setError('Error al subir la foto: ' + (err.message || err));
        } finally {
            setIsUploadingFoto(false);
        }
    };

    useEffect(() => {
        const fetchObrasSociales = async () => {
            try {
                const data = await api.getContactosCRM();
                const uniqueOS = Array.from(new Set(
                    data.filter((c: any) => c.isPatient && c.socialInsurance).map((c: any) => c.socialInsurance)
                )).sort() as string[];
                setObrasSociales(uniqueOS);
            } catch (err) {
                console.error("Failed to load unique health insurances:", err);
            }
        };
        fetchObrasSociales();

        api.getProfesionalesAdmin().then(data => {
            setProfesionales(data.filter(p => p.activo));
        }).catch(err => console.error("Error fetching professionals:", err));
    }, []);

    const cirujanos = profesionales.filter(p => p.especialidad?.toLowerCase().includes('ciruj') || p.especialidad?.toLowerCase().includes('bariat'));
    const nutricionistas = profesionales.filter(p => p.especialidad?.toLowerCase().includes('nutri'));
    const psicologos = profesionales.filter(p => p.especialidad?.toLowerCase().includes('psic') || p.especialidad?.toLowerCase().includes('psiq'));

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
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="modalidadCobertura" className="block text-sm font-medium text-slate-700">Modalidad de Cobertura</label>
                                <select
                                    name="modalidadCobertura"
                                    id="modalidadCobertura"
                                    value={formData.modalidadCobertura || 'Obra Social'}
                                    onChange={e => setFormData(prev => ({ ...prev, modalidadCobertura: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                    <option value="Obra Social">Obra Social</option>
                                    <option value="Prepaga">Prepaga</option>
                                    <option value="Particular">Particular</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="obraSocial" className="block text-sm font-medium text-slate-700">Obra Social / Prepaga</label>
                                <input 
                                    type="text" 
                                    name="obraSocial" 
                                    id="obraSocial" 
                                    list="obras-sociales-list"
                                    value={formData.obraSocial || ''} 
                                    onChange={handleChange} 
                                    className="mt-1 block w-full rounded-md border-slate-300" 
                                />
                                <datalist id="obras-sociales-list">
                                    {obrasSociales.map(os => (
                                        <option key={os} value={os} />
                                    ))}
                                </datalist>
                            </div>
                            <div>
                                <label htmlFor="nroAfiliado" className="block text-sm font-medium text-slate-700">Nro de Afiliado</label>
                                <input 
                                    type="text" 
                                    name="nroAfiliado" 
                                    id="nroAfiliado" 
                                    value={formData.nroAfiliado || ''} 
                                    onChange={handleChange} 
                                    className="mt-1 block w-full rounded-md border-slate-300" 
                                />
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="cirujanoAsignado" className="block text-sm font-medium text-slate-700">Cirujano Asignado</label>
                                <select
                                    name="cirujanoAsignado"
                                    id="cirujanoAsignado"
                                    value={formData.cirujanoAsignado || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, cirujanoAsignado: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                    <option value="">No asignado</option>
                                    {cirujanos.map(p => (
                                        <option key={p.email} value={p.email}>{p.apellido}, {p.nombres}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="nutricionistaAsignado" className="block text-sm font-medium text-slate-700">Nutricionista Asignado</label>
                                <select
                                    name="nutricionistaAsignado"
                                    id="nutricionistaAsignado"
                                    value={formData.nutricionistaAsignado || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, nutricionistaAsignado: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                    <option value="">No asignado</option>
                                    {nutricionistas.map(p => (
                                        <option key={p.email} value={p.email}>{p.apellido}, {p.nombres}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="psicologoAsignado" className="block text-sm font-medium text-slate-700">Psicólogo Asignado</label>
                                <select
                                    name="psicologoAsignado"
                                    id="psicologoAsignado"
                                    value={formData.psicologoAsignado || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, psicologoAsignado: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                    <option value="">No asignado</option>
                                    {psicologos.map(p => (
                                        <option key={p.email} value={p.email}>{p.apellido}, {p.nombres}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {formData.etiquetaPrincipalActiva === 'CIRUGIA_GENERAL' && (
                            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <input
                                    type="checkbox"
                                    name="cgOperado"
                                    id="cgOperado"
                                    checked={formData.cgOperado || false}
                                    onChange={e => setFormData(prev => ({ ...prev, cgOperado: e.target.checked }))}
                                    className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="cgOperado" className="text-sm font-medium text-slate-700 select-none">
                                    ¿Paciente ya fue operado? (Cirugía General)
                                </label>
                            </div>
                        )}

                        {formData.etiquetaPrincipalActiva === 'TRATAMIENTO_INDIVIDUAL' && (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                                <label htmlFor="tiProfesionalEmail" className="block text-sm font-medium text-slate-700">
                                    Profesional Tratante Asignado
                                </label>
                                <select
                                    name="tiProfesionalEmail"
                                    id="tiProfesionalEmail"
                                    value={formData.tiProfesionalEmail || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, tiProfesionalEmail: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
                                >
                                    <option value="">No asignado</option>
                                    {profesionales.map(p => (
                                        <option key={p.email} value={p.email}>
                                            {p.apellido}, {p.nombres} ({p.especialidad || 'Sin esp.'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex items-end gap-4">
                            <div className="flex-grow space-y-1.5">
                                <label className="block text-sm font-medium text-slate-700">Foto de Perfil</label>
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-md hover:bg-indigo-100">
                                        {isUploadingFoto ? 'Subiendo...' : '📷 Subir foto'}
                                        <input type="file" accept="image/*" className="hidden" disabled={isUploadingFoto} onChange={handleFotoFileChange} />
                                    </label>
                                    <span className="text-xs text-slate-400">o pegá una URL:</span>
                                </div>
                                <input type="url" name="fotoPerfil" id="fotoPerfil" value={formData.fotoPerfil || ''} onChange={handleChange} placeholder="https://..." className="block w-full rounded-md border-slate-300 text-sm" />
                            </div>
                            {formData.fotoPerfil && (
                                <img src={formData.fotoPerfil} alt="preview" className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 flex-shrink-0" />
                            )}
                        </div>
                        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                    </div>
                    <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
                        <div>
                            {(user.rol === UserRole.ADMINISTRATIVO || user.rol === UserRole.MEDICO) && onDelete && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (window.confirm(`¿Está seguro de que desea eliminar permanentemente al paciente ${paciente.apellido}, ${paciente.nombres}? Esta acción no se puede deshacer y borrará todo su historial clínico, turnos, informes y registros.`)) {
                                            try {
                                                setIsSaving(true);
                                                await api.deletePaciente(paciente.idPaciente, user.rol);
                                                onDelete();
                                            } catch (err: any) {
                                                setError(err.message || 'Error al eliminar el paciente.');
                                                setIsSaving(false);
                                            }
                                        }
                                    }}
                                    disabled={isSaving}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-300 transition-colors"
                                >
                                    {isSaving ? 'Eliminando...' : 'Eliminar Paciente'}
                                </button>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancelar</button>
                            <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};


// FichaModal Component
const FichaModal = ({ paciente, equipoAsignado, allProfesionales, onClose, onEdit, canEdit }: { 
    paciente: PacienteCompleto;
    equipoAsignado: { cirujano: string; nutricionista: string; psicologo: string; };
    allProfesionales: Profesional[];
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
                    <h2 className="text-xl font-bold text-slate-800">Ficha del Paciente: {filiatorio.apellido}, {filiatorio.nombres}</h2>
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
                        <div><strong className="text-slate-600">Nro HC / ID:</strong> {filiatorio.nroHc ? `${filiatorio.nroHc} (ID: ${filiatorio.idPaciente})` : filiatorio.idPaciente}</div>
                        <div><strong className="text-slate-600">Fecha de Nacimiento:</strong> {filiatorio.fechaNacimiento ? format(new Date(filiatorio.fechaNacimiento.replace(/-/g, '/')), 'dd/MM/yyyy') : 'N/A'}</div>
                        <div><strong className="text-slate-600">Edad:</strong> {edad !== null ? `${edad} años` : 'N/A'}</div>
                        <div className="lg:col-span-3"><strong className="text-slate-600">Dirección:</strong> {filiatorio.direccion || 'No especificada'}</div>
                        <div><strong className="text-slate-600">Obra Social / Prepaga:</strong> {filiatorio.obraSocial || 'N/A'} ({filiatorio.nroAfiliado || 'N/A'})</div>
                        <div><strong className="text-slate-600">Modalidad Cobertura:</strong> {filiatorio.modalidadCobertura || 'Obra Social'}</div>
                        <div><strong className="text-slate-600">Teléfono:</strong> {filiatorio.telefono}</div>
                        <div className="lg:col-span-2"><strong className="text-slate-600">Email:</strong> {filiatorio.email}</div>
                    </div>

                    {filiatorio.etiquetaPrincipalActiva === 'CIRUGIA_GENERAL' ? (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-2 mt-4">Detalles Cirugía General</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <strong className="text-slate-600">Estado Quirúrgico:</strong>{' '}
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${filiatorio.cgOperado ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                                        {filiatorio.cgOperado ? 'Operado' : 'No Operado'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : filiatorio.etiquetaPrincipalActiva === 'TRATAMIENTO_INDIVIDUAL' ? (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-2 mt-4">Detalles Tratamiento Individual</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <strong className="text-slate-600">Profesional Tratante:</strong>{' '}
                                    {(() => {
                                        const prof = allProfesionales.find(p => p.email === filiatorio.tiProfesionalEmail);
                                        return prof ? `${prof.apellido}, ${prof.nombres}` : (filiatorio.tiProfesionalEmail || 'Sin asignar');
                                    })()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-2 mt-4">Equipo Asignado</h3>
                            <p className="text-xs text-slate-500 mb-3 -mt-2">Profesionales de cabecera asignados al paciente. (Se modifican haciendo clic en 'Editar Ficha' arriba)</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div><strong className="text-slate-600">Cirujano:</strong> {equipoAsignado.cirujano}</div>
                                <div><strong className="text-slate-600">Nutricionista:</strong> {equipoAsignado.nutricionista}</div>
                                <div><strong className="text-slate-600">Psicólogo:</strong> {equipoAsignado.psicologo}</div>
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
                {evolucion.notaConfidencial && 
                 evolucion.notaConfidencial.trim() !== '' && 
                 evolucion.notaConfidencial !== 'null' && 
                 evolucion.notaConfidencial !== 'undefined' && (
                    <div className="p-2 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-yellow-800">
                        <p className="font-semibold">Nota Confidencial:</p>
                        <p>{evolucion.notaConfidencial}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const INFORME_TIPOS_POR_ROL: Record<string, { tipo: string; plantilla: string }[]> = {
    cirugia: [
        { tipo: 'Informe Quirúrgico', plantilla: `INFORME QUIRÚRGICO\n\nFecha de cirugía: \nCirujano interviniente: \nAnestesista: \n\nTécnica quirúrgica utilizada:\n\nHallazgos intraoperatorios:\n\nComplicaciones intraoperatorias: Sin complicaciones / (describir)\n\nDesarrollo del acto quirúrgico:\n\nEstado postoperatorio inmediato:\n\nIndicaciones postoperatorias:\n\nFirma y sello del cirujano:` },
        { tipo: 'Epicrisis / Resumen de Alta', plantilla: `EPICRISIS\n\nFecha de ingreso: \nFecha de alta: \n\nDiagnóstico de ingreso:\nDiagnóstico de egreso:\n\nResumen de la internación:\n\nProcedimientos realizados:\n\nMedicación al alta:\n\nIndicaciones al alta:\n\nTurnos de seguimiento:\n\nFirma y sello del médico tratante:` },
        { tipo: 'Informe de Consulta', plantilla: `INFORME DE CONSULTA\n\nMotivo de consulta:\n\nAntecedentes relevantes:\n\nExamen físico:\nPeso: \nTalla: \nIMC: \nTA: \n\nImpresión diagnóstica:\n\nPlan de tratamiento:\n\nPróximo control:\n\nFirma y sello:` },
    ],
    nutricion: [
        { tipo: 'Informe Nutricional', plantilla: `INFORME NUTRICIONAL\n\nEvaluación nutricional:\n\nAntropometría:\n- Peso actual: \n- Talla: \n- IMC: \n- Perímetro cintura: \n- Perímetro cuello: \n\nComposición corporal:\n\nHábitos alimentarios actuales:\n\nHábitos de ejercicio:\n\nDiagnóstico nutricional:\n\nPlan alimentario indicado:\n\nObjetivos del tratamiento:\n\nPróxima consulta:\n\nFirma y sello de la Lic. en Nutrición:` },
        { tipo: 'Plan Alimentario', plantilla: `PLAN ALIMENTARIO\n\nPaciente: \nFecha: \n\nObjetivo calórico: \nDistribución de macronutrientes:\n\nComidas permitidas:\n\nAlimentos a evitar:\n\nPautas generales:\n\nSuplementación indicada:\n\nFirma y sello:` },
    ],
    psicologia: [
        { tipo: 'Informe Psicológico', plantilla: `INFORME PSICOLÓGICO\n\nMotivo de consulta:\n\nEvaluación psicológica:\n- Estado afectivo: \n- Nivel de ansiedad: \n- Adherencia al tratamiento: \n- Red de apoyo social: \n\nTécnicas aplicadas:\n\nImpresión diagnóstica:\n\nObjetivos terapéuticos:\n\nConclusiones y recomendaciones:\n\nFirma y sello de la/el Lic. en Psicología:\n\n⚠️ Documento confidencial — solo para uso del equipo tratante.` },
        { tipo: 'Apto Psicológico', plantilla: `CERTIFICADO DE APTO PSICOLÓGICO\n\nPor medio del presente se certifica que el/la paciente:\n\nNombre: \nDNI: \n\nFue evaluado/a psicológicamente y se encuentra en condiciones de:\n☐ Iniciar tratamiento bariátrico\n☐ Ser intervenido/a quirúrgicamente\n\nObservaciones:\n\nFirma y sello:` },
    ],
    general: [
        { tipo: 'Resumen Clínico', plantilla: `RESUMEN CLÍNICO\n\nMotivo:\n\nAntecedentes:\n\nEstado actual:\n\nPlan:\n\nFirma:` },
        { tipo: 'Presupuesto', plantilla: `PRESUPUESTO MÉDICO\n\nFecha: \n\nPaciente:\nDNI:\n\nProcedimiento / Servicio:\n\nDetalle de honorarios:\n\n- Consulta inicial: $\n- Estudios preoperatorios: $\n- Cirugía (honorarios): $\n- Internación estimada: $\n- Seguimiento postoperatorio: $\n\nTotal estimado: $\n\nFormas de pago aceptadas:\n\nVigencia del presupuesto: 30 días desde la fecha\n\nFirma y sello:` },
        { tipo: 'Certificado Médico', plantilla: `CERTIFICADO MÉDICO\n\nSe certifica que el/la paciente:\n\nNombre completo: \nDNI: \nFecha de nacimiento: \n\n\n\n\n\nCiudad y fecha: \n\nFirma y sello del profesional:` },
    ],
};

function getInformeTipos(user: Profesional, paciente?: PacienteCompleto) {
    const esp = (user.especialidad || '').toLowerCase();
    
    let plantillaQuirurgico = `INFORME QUIRÚRGICO\n\nFecha de cirugía: \nCirujano interviniente: \nAnestesista: \n\nTécnica quirúrgica utilizada:\n\nHallazgos intraoperatorios:\n\nComplicaciones intraoperatorias: Sin complicaciones\n\nDesarrollo del acto quirúrgico:\n\nEstado postoperatorio inmediato:\n\nIndicaciones postoperatorias:\n\nFirma y sello del cirujano:`;
    
    if (paciente) {
        const { filiatorio, historiaClinica, cirugia } = paciente;
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const hoy = new Date();
        const fechaHoyStr = `${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;
        
        let edad = '';
        if (filiatorio.fechaNacimiento) {
            try {
                const birthDate = new Date(filiatorio.fechaNacimiento.replace(/-/g, '/'));
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                edad = age.toString();
            } catch (e) {
                console.error(e);
            }
        }
        
        let pesoPostStr = '[peso_post]';
        if (historiaClinica && historiaClinica.talla && historiaClinica.pesoInicial) {
            const tallaM = historiaClinica.talla / 100;
            const pesoInicial = historiaClinica.pesoInicial;
            const pesoObjetivo = 25 * Math.pow(tallaM, 2);
            const pesoPost = pesoInicial - (pesoInicial - pesoObjetivo) * 0.80;
            pesoPostStr = pesoPost.toFixed(1);
        }
        
        const comorbilidadesStr = historiaClinica && historiaClinica.comorbilidades && historiaClinica.comorbilidades.length > 0 
            ? historiaClinica.comorbilidades.join(', ')
            : 'Ninguna';
            
        const tallaMStr = historiaClinica && historiaClinica.talla ? (historiaClinica.talla / 100).toFixed(2) : '[talla]';
        const pesoInicialStr = historiaClinica && historiaClinica.pesoInicial ? historiaClinica.pesoInicial.toString() : '[peso]';
        const imcInicialStr = historiaClinica && historiaClinica.imcInicial ? historiaClinica.imcInicial.toString() : '[imc]';
        
        const tipoCirugiaStr = cirugia?.tipoCirugia || filiatorio.tipoCirugia || '[tipo de cirugia seleccionado en Resumen Clínico]';
        const osStr = filiatorio.obraSocial || '[os]';
        const afiliadoStr = filiatorio.nroAfiliado || '[numero de afiliado]';
        
        plantillaQuirurgico = `INFORME QUIRÚRGICO\nTucumán, ${fechaHoyStr}\nPACIENTE: ${filiatorio.apellido} ${filiatorio.nombres}   Obra Social: ${osStr}, ${afiliadoStr}\n\nPaciente de ${edad || '[edad]'} años, con diagnóstico de obesidad, en evaluación para eventual cirugía bariátrica luego de tratamientos médicos previos sin respuesta sostenida.\nAntecedentes generales:    (esto es lo que en general se edita)\nObesidad de más de 10 años de evolución\nRealizo tratamientos previos detallados en informe nutricional\nComorbilidades asociadas:\n${comorbilidadesStr}\n\nTalla\tPeso Inicial\tIMC\n${tallaMStr} m\t${pesoInicialStr} kg\t${imcInicialStr} kg/m2\n\nSe realizo una exhaustiva evaluación multidisciplinaria que incluye análisis de laboratorio, ECG y riesgo quirúrgico, radiografía de tórax, ecografía abdominal, examen funcional respiratorio, seriada esofagogastroduodenal y endoscopia digestiva alta, e interconsultas con psicología, nutrición, clínica médica, gastroenterología y cirugía.\n\nConclusión:\nReune los criterios clínicos para la realización de un ${tipoCirugiaStr} por via laparoscópica, con un descenso de peso estimado en ${pesoPostStr} kg en un periodo de 12 a 18 meses luego de la intervención. A esto se sumará la mejoría y/o remisión de sus enfermedades asociadas.\n\nPor lo expuesto, solicito la autorización correspondiente para la realización de la cirugía indicada.`;
    }

    const list = [
        { tipo: 'Informe Quirúrgico', plantilla: plantillaQuirurgico },
        { tipo: 'Epicrisis / Resumen de Alta', plantilla: `EPICRISIS\n\nFecha de ingreso: \nFecha de alta: \n\nDiagnóstico de ingreso:\nDiagnóstico de egreso:\n\nResumen de la internación:\n\nProcedimientos realizados:\n\nMedicación al alta:\n\nIndicaciones al alta:\n\nTurnos de seguimiento:\n\nFirma y sello del médico tratante:` },
        { tipo: 'Informe de Consulta', plantilla: `INFORME DE CONSULTA\n\nMotivo de consulta:\n\nAntecedentes relevantes:\n\nExamen físico:\nPeso: \nTalla: \nIMC: \nTA: \n\nImpresión diagnóstica:\n\nPlan de tratamiento:\n\nPróximo control:\n\nFirma y sello:` }
    ];

    if (esp.includes('ciruj') || esp.includes('bariat') || user.rol === UserRole.SUPERADMIN) return [...list, ...INFORME_TIPOS_POR_ROL.general];
    if (esp.includes('nutri')) return [...INFORME_TIPOS_POR_ROL.nutricion, ...INFORME_TIPOS_POR_ROL.general];
    if (esp.includes('psic')) return [...INFORME_TIPOS_POR_ROL.psicologia, ...INFORME_TIPOS_POR_ROL.general];
    return INFORME_TIPOS_POR_ROL.general;
}

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
    const informeTipos = getInformeTipos(user, paciente);
    const [informe, setInforme] = useState({ ...initialInforme, tipoInforme: initialInforme.tipoInforme || informeTipos[0]?.tipo || 'Resumen Clínico' });
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [clipboardStatus, setClipboardStatus] = useState('');
    const [showTemplates, setShowTemplates] = useState(!initialInforme.contenido);
    const printRef = useRef<HTMLDivElement>(null);
    const printOnlyRef = useRef<HTMLDivElement>(null);
    const [printError, setPrintError] = useState<string | null>(null);
    const [printFormat, setPrintFormat] = useState<'A5' | 'A4'>('A5');
    const esInformeQuirurgico = informe.tipoInforme === 'Informe Quirúrgico';

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

    const [saveError, setSaveError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!informe.contenido?.trim()) {
            setSaveError('El informe no puede estar vacío.');
            return;
        }
        setIsSaving(true);
        setSaveError(null);
        try {
            await api.guardarInforme(informe as any);
            onSaveSuccess();
        } catch (error: any) {
            setSaveError(error?.message || 'Error al guardar el informe. Intente de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const doPrint = () => {
        const oldTitle = document.title;
        document.title = '';
        window.print();
        document.title = oldTitle;
    };

    const handlePrint = () => {
        setPrintError(null);
        if (!printOnlyRef.current) {
            setPrintFormat('A5');
            doPrint();
            return;
        }
        const fitA5 = checkPrintFit(printOnlyRef.current, 108, 155);
        if (fitA5.fits) {
            setPrintFormat('A5');
            requestAnimationFrame(doPrint);
            return;
        }
        const fitA4 = checkPrintFit(printOnlyRef.current, 170, 242);
        if (fitA4.fits) {
            setPrintFormat('A4');
            requestAnimationFrame(doPrint);
            return;
        }
        setPrintError(PRINT_OVERFLOW_MESSAGE);
    };
    
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

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center no-print">
                    <div className="flex items-center gap-4 flex-wrap">
                        <h2 className="text-xl font-bold text-slate-800">Editor de Informes</h2>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-600">Tipo:</label>
                            <select
                                value={informe.tipoInforme || ''}
                                onChange={e => setInforme(p => ({ ...p, tipoInforme: e.target.value }))}
                                className="rounded-md border-slate-300 text-sm py-1"
                            >
                                {informeTipos.map(t => <option key={t.tipo} value={t.tipo}>{t.tipo}</option>)}
                            </select>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-2xl font-bold">&times;</button>
                </div>

                {/* Template picker */}
                {showTemplates && (
                    <div className="px-6 pt-4 pb-2 bg-indigo-50 border-b no-print">
                        <p className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wide">Usar plantilla estructurada</p>
                        <div className="flex flex-wrap gap-2">
                            {informeTipos.map(t => (
                                <button
                                    key={t.tipo}
                                    onClick={() => {
                                        setInforme(p => ({ ...p, tipoInforme: t.tipo, contenido: t.plantilla }));
                                        setShowTemplates(false);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-100 transition-colors"
                                >
                                    📄 {t.tipo}
                                </button>
                            ))}
                            <button
                                onClick={() => setShowTemplates(false)}
                                className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                            >
                                Redactar libre
                            </button>
                        </div>
                    </div>
                )}

                <div className="p-6 flex-grow overflow-y-auto" ref={printRef}>
                    <style>
                        {`
                        @media print {
                            html, body {
                                height: auto !important;
                                overflow: visible !important;
                            }
                            body * {
                                visibility: hidden !important;
                            }
                            .print-section, .print-section * {
                                visibility: visible !important;
                            }
                            /* El resto de la app queda oculto con visibility:hidden, pero sigue
                               ocupando espacio en el flujo (max-height/overflow del modal y del
                               fondo) — eso es lo que generaba hojas extra o repetidas al imprimir.
                               Como este modal ahora se renderiza en un portal fuera de #root, se
                               puede ocultar #root por completo sin afectar el contenido a imprimir. */
                            #root {
                                display: none !important;
                            }
                            .fixed.inset-0 {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                height: auto !important;
                                overflow: visible !important;
                                display: block !important;
                                background: none !important;
                            }
                            .fixed.inset-0 > div {
                                max-height: none !important;
                                height: auto !important;
                                overflow: visible !important;
                                display: block !important;
                                box-shadow: none !important;
                                border: none !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                width: 100% !important;
                            }
                            .flex-grow.overflow-y-auto {
                                overflow: visible !important;
                                max-height: none !important;
                                height: auto !important;
                                display: block !important;
                            }
                            .print-section {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                padding: 4cm 2cm 1.5cm 2cm !important;
                                font-size: 11pt !important;
                                line-height: 1.6 !important;
                                font-family: 'Outfit', sans-serif !important;
                            }
                            .no-print {
                                display: none !important;
                            }
                            .print-only {
                                display: block !important;
                            }
                            .print-avoid-break {
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                            }
                            @page {
                                size: ${printFormat === 'A4' ? 'A4' : 'A5'} portrait;
                                margin: 0;
                            }
                        }
                        `}
                    </style>
                    <div className="print-section">
                        <h3 className="text-lg font-bold text-center text-slate-800 no-print">{informe.tipoInforme || 'Informe Clínico'}</h3>
                        <div className="flex justify-between text-sm mt-4 mb-6 border-y py-2 text-slate-600 no-print">
                            <span><span className="font-semibold">Paciente:</span> {paciente.filiatorio.nombres} {paciente.filiatorio.apellido}</span>
                            <span><span className="font-semibold">Fecha:</span> {format(new Date(), 'dd/MM/yyyy')}</span>
                        </div>
                        <textarea
                            value={informe.contenido || ''}
                            onChange={(e) => setInforme(p => ({...p, contenido: e.target.value}))}
                            placeholder="Escriba el informe aquí, elija una plantilla arriba, o genere con IA..."
                            className="w-full h-96 p-3 border rounded-md font-mono text-sm leading-relaxed no-print"
                            disabled={isGenerating}
                        />
                        <div className="print-only hidden" ref={printOnlyRef}>
                            {/* Encabezado profesional — solo en pantalla, no se imprime (se usa hoja membretada) */}
                            <div className="no-print print-avoid-break flex justify-between items-start border-b-2 border-slate-800 pb-3 mb-4">
                                <div>
                                    <p className="text-lg font-bold uppercase tracking-wide text-slate-900">
                                        Dr/a. {user.apellido}, {user.nombres}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        {user.especialidad || 'Medicina'}
                                        {user.matricula ? ` — M.P. ${user.matricula}` : ''}
                                    </p>
                                </div>
                                <div className="text-right text-sm text-slate-600">
                                    <p className="font-semibold text-slate-800">{informe.tipoInforme || 'Informe Clínico'}</p>
                                    <p>{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}</p>
                                </div>
                            </div>
                            {!esInformeQuirurgico && (
                                <div className="print-avoid-break grid grid-cols-2 gap-x-4 gap-y-1 text-xs bg-slate-50 rounded p-3 border mb-6">
                                    <div><span className="text-slate-500">Paciente:</span> <strong>{paciente.filiatorio.apellido}, {paciente.filiatorio.nombres}</strong></div>
                                    <div><span className="text-slate-500">DNI:</span> {paciente.filiatorio.dni}</div>
                                    <div><span className="text-slate-500">Fecha de nacimiento:</span> {paciente.filiatorio.fechaNacimiento ? format(new Date(paciente.filiatorio.fechaNacimiento.replace(/-/g, '/')), 'dd/MM/yyyy') : 'N/A'}</div>
                                    <div><span className="text-slate-500">Obra Social:</span> {paciente.filiatorio.obraSocial || '-'}</div>
                                </div>
                            )}
                            <div className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-slate-800" style={{ minHeight: '8cm' }}>
                                {informe.contenido}
                            </div>
                            <div className="print-avoid-break mt-10 pt-4 text-right text-xs text-slate-700">
                                <div className="inline-block border-t border-slate-400 pt-2 min-w-[220px]">
                                    <p className="font-semibold">Dr/a. {user.apellido}, {user.nombres}</p>
                                    {user.matricula && <p className="text-slate-500">M.P. {user.matricula}</p>}
                                    {user.especialidad && <p className="text-slate-500">{user.especialidad}</p>}
                                </div>
                            </div>
                            <div className="mt-4 pt-2 text-right text-[10px] text-slate-400">
                                {format(new Date(), 'd/M/yy')}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t flex flex-wrap justify-between items-center gap-3 no-print">
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setShowTemplates(v => !v)}
                            className="flex items-center px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 border border-indigo-200"
                        >
                            📄 Plantillas
                        </button>
                        <button
                            onClick={handleGenerateInforme}
                            disabled={isGenerating}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-purple-300"
                        >
                            <AiSparklesIcon/>
                            {isGenerating ? 'Generando...' : 'Generar con IA'}
                        </button>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {saveError && <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-md border border-red-200">{saveError}</p>}
                        {printError && <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-md border border-red-200">{printError}</p>}
                        {!printError && printFormat === 'A4' && <p className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">El contenido no entra en A5: se imprimirá en A4 (1 sola hoja).</p>}
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
                            <button onClick={handleSave} disabled={isSaving || isGenerating || !informe.contenido?.trim()} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                                <SaveIcon/>
                                {isSaving ? 'Guardando...' : 'Guardar Informe'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const getFileNameFromUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) {
        const withoutQuery = url.split('?')[0];
        const parts = withoutQuery.split('/');
        const lastPart = decodeURIComponent(parts[parts.length - 1]);
        const underscoreIndex = lastPart.indexOf('_');
        if (underscoreIndex !== -1 && !isNaN(Number(lastPart.substring(0, underscoreIndex)))) {
            return lastPart.substring(underscoreIndex + 1);
        }
        return lastPart;
    }
    return url;
};

export default function PatientDossier({ patientId, onBack }: PatientDossierProps) {
    const authContext = useContext(AuthContext);
    const [paciente, setPaciente] = useState<PacienteCompleto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [prioridad, setPrioridad] = useState<Priority>(Priority.NORMAL);
   type ModalType = 'agendarTurno' | 'definirCirugia' | 'editarFicha' | 'verFicha' | 'createTask' | 'editResumen' | 'newEvolucion' | 'editEvolucion' | 'newEstudio' | 'weightCurve' | 'newInforme' | 'editInforme' | 'editCirugia' | 'editNutricion' | 'editPsicologia' | 'turnHistorial' | 'pedidosRecetas' | 'folder' | null;
    const [modal, setModal] = useState<ModalType>(null);
    
    const [config, setConfig] = useState<ConfiguracionGeneral | null>(null);
    const [allProfesionales, setAllProfesionales] = useState<Profesional[]>([]);
    const [crmSimpleProfessionals, setCrmSimpleProfessionals] = useState<CrmSimpleProfessionals>({ surgeons: [], nutritionists: [], psychologists: [], todos: [] });
    
    const chartRef = useRef<SVGSVGElement>(null);
    const [activeEstudiosTab, setActiveEstudiosTab] = useState<TipoEstudio>(TipoEstudio.LABORATORIO);
    const [isSaving, setIsSaving] = useState(false);
    const [chartViewMode, setChartViewMode] = useState<'peso' | 'imc'>('peso');
    const [resumenData, setResumenData] = useState<Partial<HistoriaClinicaEstatica>>({});
    const [evolucionData, setEvolucionData] = useState<Partial<EvolucionClinica>>({});
    const [estudioData, setEstudioData] = useState<Partial<EstudioRealizado>>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [cirugiaData, setCirugiaData] = useState<Partial<CirugiaInfo>>({});
    const [nutricionData, setNutricionData] = useState<Partial<NutricionInfo>>({});
    const [psicologiaData, setPsicologiaData] = useState<Partial<PsicologiaInfo>>({});
    
    const [currentInforme, setCurrentInforme] = useState<Partial<InformeClinico> | null>(null);
    const [activeResumenSubTab, setActiveResumenSubTab] = useState<'general' | 'cirugia' | 'nutricion' | 'psicologia'>('general');


    const user = authContext!.user!;
    const isSuperAdmin = user.rol === UserRole.SUPERADMIN;
    const canEdit = user.rol === UserRole.ADMINISTRATIVO || user.rol === UserRole.MEDICO || isSuperAdmin;

    const fetchData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([
        api.getPacienteCompleto(patientId, user.email),
        api.getConfiguracionGeneral(user.rol),
        api.getProfesionalesAdmin(),
        api.getContactosCRM(),
        api.getCrmSimpleProfessionals(),
    ]).then(([pacienteData, configData, profsData, contactosData, crmProfs]) => {
        setPaciente(pacienteData);
        setConfig(configData);
        setAllProfesionales(profsData);
        setCrmSimpleProfessionals(crmProfs);
        // Cargar prioridad del CRM
        const contacto = contactosData.find((c: any) => c.id === patientId);
        if (contacto) setPrioridad(contacto.priority);
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

    const handleCambioPrioridad = async (nuevaPrioridad: Priority) => {
        setPrioridad(nuevaPrioridad);
        await api.updateContactoCRM(patientId, { priority: nuevaPrioridad });
    };
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
        if (!paciente) return { cirujano: 'No asignado', nutricionista: 'No asignado', psicologo: 'No asignado' };
        
        const cirujanoProf = allProfesionales.find(p => p.email === paciente.filiatorio.cirujanoAsignado);
        const nutricionistaProf = allProfesionales.find(p => p.email === paciente.filiatorio.nutricionistaAsignado);
        const psicologoProf = allProfesionales.find(p => p.email === paciente.filiatorio.psicologoAsignado);

        return {
            cirujano: cirujanoProf ? `${cirujanoProf.apellido}, ${cirujanoProf.nombres}` : 'No asignado',
            nutricionista: nutricionistaProf ? `${nutricionistaProf.apellido}, ${nutricionistaProf.nombres}` : 'No asignado',
            psicologo: psicologoProf ? `${psicologoProf.apellido}, ${psicologoProf.nombres}` : 'No asignado',
        };
    }, [paciente, allProfesionales]);

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
            let uploadedUrl = estudioData.nombreArchivo || '';
            if (selectedFile) {
                try {
                    uploadedUrl = await (api as any).uploadEstudioFile(paciente.filiatorio.idPaciente, selectedFile);
                } catch (err: any) {
                    alert('Error al subir el archivo. Asegúrese de que el storage de Supabase tenga un bucket llamado "estudios": ' + (err.message || err));
                    setIsSaving(false);
                    return;
                }
            }

            const estudioPayload = {
                fecha: estudioData.fecha || format(new Date(), 'yyyy-MM-dd'),
                tipo: estudioData.tipo || TipoEstudio.OTROS,
                nombreArchivo: uploadedUrl,
                descripcion: estudioData.descripcion,
                resultados: estudioData.tipo === TipoEstudio.LABORATORIO
                    ? estudioData.resultados?.filter(r => r.valor && r.valor.trim() !== '')
                    : undefined,
                resultadoBiopsia: estudioData.tipo === TipoEstudio.ENDOSCOPIA ? estudioData.resultadoBiopsia : undefined,
            };
            if (estudioData.idEstudio) {
                await api.updateEstudio(estudioData.idEstudio, estudioPayload, user.rol);
            } else {
                await api.createEstudio({ idPaciente: paciente.filiatorio.idPaciente, ...estudioPayload }, user);
            }
            setSelectedFile(null);
            fetchData();
            setModal(null);
        } catch (error) { console.error("Error creating study:", error); }
        finally { setIsSaving(false); }
    };

    const handleDeleteEstudio = async (idEstudio: string) => {
        if (!window.confirm('¿Eliminar este estudio/archivo? Esta acción no se puede deshacer.')) return;
        try {
            await api.deleteEstudio(idEstudio, user.rol);
            fetchData();
        } catch (error: any) {
            alert('Error al eliminar el estudio: ' + (error?.message || error));
        }
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
            const tipos = getInformeTipos(user, paciente!);
            setCurrentInforme({
                idPaciente: paciente!.filiatorio.idPaciente,
                emailProfesionalAutor: user.email,
                tipoInforme: tipos[0]?.tipo || 'Resumen Clínico',
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
    const edad = filiatorio.fechaNacimiento
        ? differenceInYears(new Date(), new Date(filiatorio.fechaNacimiento.replace(/-/g, '/')))
        : null;
    const etiquetaInfo = ETIQUETAS_FLUJO.find(e => e.nombreEtiquetaUnico === filiatorio.etiquetaPrincipalActiva) || { color: 'bg-gray-200 text-gray-800' };

    const tallaMetros = (historiaClinica.talla || 0) / 100;
    const pesoObjetivo = tallaMetros > 0 ? parseFloat((25 * Math.pow(tallaMetros, 2)).toFixed(1)) : null;
    const pesoPostOp = (historiaClinica.pesoInicial && pesoObjetivo) 
        ? parseFloat((historiaClinica.pesoInicial - (historiaClinica.pesoInicial - pesoObjetivo) * 0.8).toFixed(1))
        : null;

    const getPostOpStageLabel = (surgeryDate?: string | null): string => {
        if (!surgeryDate) return 'Sin fecha';
        // Replace dashes with slashes so JS parses as local time (not UTC midnight)
        const parsed = new Date(surgeryDate.replace(/-/g, '/'));
        if (isNaN(parsed.getTime())) return 'Sin fecha';
        const days = (new Date().getTime() - parsed.getTime()) / (1000 * 3600 * 24);
        if (days <= 30) return PostOpStage.INMEDIATO;
        if (days <= 180) return PostOpStage.RECIENTE;
        if (days <= 365) return PostOpStage.MEDIATO;
        return PostOpStage.ALEJADO;
    };

    const renderResumenClinico = () => (
        <div className="bg-white p-6 rounded-lg shadow space-y-4 h-full">
            <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xl font-bold text-slate-800">Resumen Clínico</h3>
                {activeResumenSubTab === 'general' && (user.rol === UserRole.MEDICO || isSuperAdmin) && (
                    <div className="flex items-center gap-2">
                         <button onClick={() => setModal('weightCurve')} className="flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-md hover:bg-indigo-100"><ChartBarIcon/>Curva</button>
                         <button onClick={() => { setResumenData(paciente.historiaClinica); setModal('editResumen'); }} className="flex items-center text-sm font-medium text-white bg-indigo-600 px-3 py-1.5 rounded-md shadow-sm hover:bg-indigo-700"><PencilIcon/>Editar</button>
                    </div>
                )}
                {activeResumenSubTab === 'cirugia' && (user.rol === UserRole.MEDICO || isSuperAdmin) && (
                    <button onClick={() => { setCirugiaData(paciente.cirugia || {}); setModal('editCirugia'); }} className="flex items-center text-sm font-medium text-white bg-indigo-600 px-3 py-1.5 rounded-md shadow-sm hover:bg-indigo-700"><PencilIcon/>Editar</button>
                )}
                {activeResumenSubTab === 'nutricion' && (user.rol === UserRole.MEDICO || isSuperAdmin) && (
                    <button onClick={() => { setNutricionData(paciente.nutricion || {}); setModal('editNutricion'); }} className="flex items-center text-sm font-medium text-white bg-indigo-600 px-3 py-1.5 rounded-md shadow-sm hover:bg-indigo-700"><PencilIcon/>Editar</button>
                )}
                {activeResumenSubTab === 'psicologia' && user.especialidad?.toLowerCase().includes('psic') && (!paciente.psicologia || paciente.psicologia.psicologoEmailAutor === user.email) && (
                    <button onClick={() => { setPsicologiaData(paciente.psicologia || {}); setModal('editPsicologia'); }} className="flex items-center text-sm font-medium text-white bg-indigo-600 px-3 py-1.5 rounded-md shadow-sm hover:bg-indigo-700"><PencilIcon/>{paciente.psicologia ? 'Editar' : 'Crear Notas'}</button>
                )}
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto whitespace-nowrap scrollbar-thin">
                    <button onClick={() => setActiveResumenSubTab('general')} className={`py-2 px-1 border-b-2 text-sm font-medium ${activeResumenSubTab === 'general' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>General</button>
                    <button onClick={() => setActiveResumenSubTab('cirugia')} className={`py-2 px-1 border-b-2 text-sm font-medium ${activeResumenSubTab === 'cirugia' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Cirugía</button>
                    <button onClick={() => setActiveResumenSubTab('nutricion')} className={`py-2 px-1 border-b-2 text-sm font-medium ${activeResumenSubTab === 'nutricion' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Nutrición</button>
                    <button onClick={() => setActiveResumenSubTab('psicologia')} className={`py-2 px-1 border-b-2 text-sm font-medium ${activeResumenSubTab === 'psicologia' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Psicología</button>
                </nav>
            </div>

            <div className="pt-4">
                {activeResumenSubTab === 'general' && (
                    <div className="space-y-4">
                         <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 text-center">
                            <div className="bg-slate-50 p-3 rounded-lg"><span className="text-xs text-slate-500">Peso Inicial</span><p className="font-bold text-lg">{historiaClinica.pesoInicial} kg</p></div>
                            <div className="bg-slate-50 p-3 rounded-lg"><span className="text-xs text-slate-500">Talla</span><p className="font-bold text-lg">{historiaClinica.talla} cm</p></div>
                            <div className="bg-slate-50 p-3 rounded-lg"><span className="text-xs text-slate-500">IMC Inicial</span><p className="font-bold text-lg">{historiaClinica.imcInicial}</p></div>
                            <div className="bg-slate-50 p-3 rounded-lg"><span className="text-xs text-slate-500">Último Peso</span><p className="font-bold text-lg text-indigo-600">{paciente.evoluciones?.[0]?.pesoActual || '-'} kg</p></div>
                            <div className="bg-slate-50 p-3 rounded-lg"><span className="text-xs text-slate-500">Peso Objetivo (IMC 25)</span><p className="font-bold text-lg text-emerald-600">{pesoObjetivo !== null ? `${pesoObjetivo} kg` : '-'}</p></div>
                            <div className="bg-slate-50 p-3 rounded-lg" title="Peso post operatorio estimado (Pérdida del 80% del exceso de peso)"><span className="text-xs text-slate-500">Post-Op Est. (80% Excess)</span><p className="font-bold text-lg text-purple-600">{pesoPostOp !== null ? `${pesoPostOp} kg` : '-'}</p></div>
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
                         {/* Acordeón con datos adicionales */}
                        <details className="group bg-slate-50 rounded-lg border border-slate-200">
                            <summary className="flex items-center justify-between p-3 cursor-pointer text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg list-none">
                                <span>Ver información completa</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </summary>
                            <div className="p-4 border-t space-y-3 text-sm">
                                <div>
                                    <strong className="text-slate-600">Antecedentes Médicos:</strong>
                                    <p className="text-slate-800 mt-0.5">{historiaClinica.antecedentesMedicos || 'No registrado.'}</p>
                                </div>
                                <div>
                                    <strong className="text-slate-600">Antecedentes Quirúrgicos:</strong>
                                    <p className="text-slate-800 mt-0.5">{historiaClinica.antecedentesQuirurgicos || 'No registrado.'}</p>
                                </div>
                                <div>
                                    <strong className="text-slate-600">Medicación Crónica:</strong>
                                    <p className="text-slate-800 mt-0.5">{historiaClinica.medicacionCronica || 'No registrado.'}</p>
                                </div>
                                <div>
                                    <strong className="text-slate-600">Comorbilidades:</strong>
                                    <p className="text-slate-800 mt-0.5">{historiaClinica.comorbilidades?.join(', ') || 'Ninguna referida.'}</p>
                                </div>
                            </div>
                        </details>

                    </div>
                )}
                    
                {activeResumenSubTab === 'cirugia' && (
                    <div className="space-y-2 text-sm">
                        <p><strong>Fecha Programada:</strong> {paciente.cirugia?.fechaProgramada ? format(new Date(paciente.cirugia.fechaProgramada.replace(/-/g, '/')), 'dd/MM/yyyy') : 'N/A'}</p>
                        <p><strong>Fecha Realizada:</strong> {paciente.cirugia?.fechaRealizada ? format(new Date(paciente.cirugia.fechaRealizada.replace(/-/g, '/')), 'dd/MM/yyyy') : 'N/A'}</p>
                        <p><strong>Tipo de Cirugía:</strong> {paciente.cirugia?.tipoCirugia || 'N/A'}</p>
                        <p><strong>Notas:</strong> {paciente.cirugia?.notas || 'Sin notas.'}</p>
                    </div>
                )}
                {activeResumenSubTab === 'nutricion' && (
                    <div className="space-y-2">
                        <div className="space-y-2 text-sm">
                            <p><strong>Perímetro Cintura:</strong> {paciente.nutricion?.perimetroCintura ? `${paciente.nutricion.perimetroCintura} cm` : 'N/A'}</p>
                            <p><strong>Perímetro Cuello:</strong> {paciente.nutricion?.perimetroCuello ? `${paciente.nutricion.perimetroCuello} cm` : 'N/A'}</p>
                            <p><strong>Composición Corporal:</strong> {paciente.nutricion?.composicionCorporal || 'N/A'}</p>
                        </div>
                        <details className="mt-4 group bg-slate-50 rounded-lg border border-slate-200">
                            <summary className="flex items-center justify-between p-3 cursor-pointer text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg list-none">
                                <span>Ver información completa</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </summary>
                            <div className="p-4 border-t space-y-3 text-sm">
                                <div>
                                    <strong className="text-slate-600">Hábitos Alimentarios:</strong>
                                    <p className="text-slate-800 mt-0.5 whitespace-pre-wrap">{paciente.nutricion?.habitosAlimentarios || 'No registrado.'}</p>
                                </div>
                                <div>
                                    <strong className="text-slate-600">Hábitos de Ejercicio:</strong>
                                    <p className="text-slate-800 mt-0.5 whitespace-pre-wrap">{paciente.nutricion?.habitosEjercicio || 'No registrado.'}</p>
                                </div>
                            </div>
                        </details>
                    </div>
                )}
                {activeResumenSubTab === 'psicologia' && (
                    <div className="space-y-2">
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

    const handleOpenEditEstudio = (estudio: EstudioRealizado) => {
        setEstudioData({
            idEstudio: estudio.idEstudio,
            fecha: estudio.fecha,
            tipo: estudio.tipo,
            descripcion: estudio.descripcion,
            nombreArchivo: estudio.nombreArchivo,
            resultados: estudio.resultados,
            resultadoBiopsia: estudio.resultadoBiopsia,
        });
        setSelectedFile(null);
        setModal('newEstudio');
    };

    const renderEstudios = () => (
        <div className="bg-white rounded-lg shadow h-full">
             <div className="flex justify-between items-center p-4 border-b">
                 <h3 className="text-xl font-bold text-slate-800">Estudios y Archivos</h3>
                 {(user.rol === UserRole.MEDICO || isSuperAdmin) && (
                    <button onClick={() => {
                        setEstudioData({
                            fecha: format(new Date(), 'yyyy-MM-dd'),
                            tipo: activeEstudiosTab,
                            resultados: activeEstudiosTab === TipoEstudio.LABORATORIO ? [] : undefined,
                        });
                        setModal('newEstudio');
                    }} className="flex items-center text-sm font-medium text-white bg-green-600 px-4 py-2 rounded-md shadow-sm hover:bg-green-700"><DocumentPlusIcon/>Registrar</button>
                 )}
            </div>
             <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6 px-4 overflow-x-auto whitespace-nowrap scrollbar-thin">
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
                {(paciente.estudios || []).filter(e => e.tipo === activeEstudiosTab).length > 0 ? (() => {
                    const estudiosFiltrados = (paciente.estudios || []).filter(e => e.tipo === activeEstudiosTab);
                    const PREVIEW_COUNT = 3;
                    const visibleEstudios = estudiosFiltrados.slice(0, PREVIEW_COUNT);
                    const hiddenEstudios = estudiosFiltrados.slice(PREVIEW_COUNT);
                    return (
                        <>
                            {visibleEstudios.map(estudio => (
                                <div key={estudio.idEstudio} className="bg-slate-50 p-3 rounded-md border">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-semibold text-sm">{format(new Date(estudio.fecha.replace(/-/g, '/')), 'dd/MM/yyyy')} - {estudio.descripcion || estudio.tipo}</p>
                                        {(user.rol === UserRole.MEDICO || isSuperAdmin) && (
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button onClick={() => handleOpenEditEstudio(estudio)} className="text-xs text-slate-500 hover:text-indigo-600 hover:underline">Editar</button>
                                                <button onClick={() => handleDeleteEstudio(estudio.idEstudio)} className="text-xs text-slate-500 hover:text-red-600 hover:underline">Eliminar</button>
                                            </div>
                                        )}
                                    </div>
                                    {estudio.nombreArchivo && (
                                        <a
                                            href={estudio.nombreArchivo}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1 font-semibold"
                                        >
                                            📄 {getFileNameFromUrl(estudio.nombreArchivo)}
                                        </a>
                                    )}
                                    {estudio.resultados && (
                                        <div className="mt-2 text-xs grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                                            {estudio.resultados.map(r => <div key={r.parametro}><strong>{r.parametro}:</strong> {r.valor} {r.unidad}</div>)}
                                        </div>
                                    )}
                                    {estudio.resultadoBiopsia && <p className="mt-2 text-xs"><strong>Biopsia:</strong> {estudio.resultadoBiopsia}</p>}
                                </div>
                            ))}
                            {hiddenEstudios.length > 0 && (
                                <details className="group">
                                    <summary className="flex items-center gap-2 p-2 cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-800 list-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        Ver {hiddenEstudios.length} estudio{hiddenEstudios.length > 1 ? 's' : ''} más
                                    </summary>
                                    <div className="space-y-3 pt-2">
                                        {hiddenEstudios.map(estudio => (
                                            <div key={estudio.idEstudio} className="bg-slate-50 p-3 rounded-md border">
                                                <p className="font-semibold text-sm">{format(new Date(estudio.fecha.replace(/-/g, '/')), 'dd/MM/yyyy')} - {estudio.descripcion || estudio.tipo}</p>
                                                {estudio.nombreArchivo && (
                                                    <a 
                                                        href={estudio.nombreArchivo} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1 font-semibold"
                                                    >
                                                        📄 {getFileNameFromUrl(estudio.nombreArchivo)}
                                                    </a>
                                                )}
                                                {estudio.resultados && (
                                                    <div className="mt-2 text-xs grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                                                        {estudio.resultados.map(r => <div key={r.parametro}><strong>{r.parametro}:</strong> {r.valor} {r.unidad}</div>)}
                                                    </div>
                                                )}
                                                {estudio.resultadoBiopsia && <p className="mt-2 text-xs"><strong>Biopsia:</strong> {estudio.resultadoBiopsia}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}
                        </>
                    );
                })() : (
                     <p className="text-sm text-center text-slate-500 py-4">No hay estudios de este tipo.</p>
                )}
            </div>
        </div>
    );

    const renderEvoluciones = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
                 <h3 className="text-xl font-bold text-slate-800">Evoluciones</h3>
                 {(user.rol === UserRole.MEDICO || isSuperAdmin) && (
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

    const renderInformes = () => (
    <div className="bg-white rounded-lg shadow">
        <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-bold text-slate-800">Informes Clínicos</h3>
            <button
                onClick={() => handleOpenInformeModal()}
                className="flex items-center text-sm font-medium text-white bg-purple-600 px-4 py-2 rounded-md shadow-sm hover:bg-purple-700"
            >
                <DocumentPlusIcon />
                Nuevo Informe
            </button>
        </div>
        <div className="p-4">
            {!paciente.informes || paciente.informes.length === 0 ? (
                <p className="text-sm text-center text-slate-500 py-6">
                    No hay informes guardados para este paciente.
                </p>
            ) : (
                <div className="space-y-3">
                    {paciente.informes.map(informe => (
                        <div
                            key={informe.idInforme}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border hover:border-indigo-300 transition-colors"
                        >
                            <div className="flex-grow min-w-0">
                                <p className="text-sm font-semibold text-slate-800">
                                    {informe.tipoInforme || 'Resumen Clínico'}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Creado: {format(new Date(informe.fechaCreacion), 'dd/MM/yyyy HH:mm')}
                                    {informe.fechaUltimaEdicion !== informe.fechaCreacion && (
                                        <span className="ml-2 text-slate-400">
                                            · Editado: {format(new Date(informe.fechaUltimaEdicion), 'dd/MM/yyyy HH:mm')}
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xl">
                                    {informe.contenido?.substring(0, 120)}...
                                </p>
                            </div>
                            <button
                                onClick={() => handleOpenInformeModal(informe)}
                                title="Abrir / Editar informe"
                                className="ml-4 flex-shrink-0 p-2 text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                            >
                                <PencilIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

    return (
        <div>
            {/* Modals */}
            {modal === 'agendarTurno' && (
                <AgendarTurnoModal
                    onClose={() => setModal(null)}
                    onSuccess={() => {
                        setModal(null);
                        fetchData();
                    }}
                    pacientePreseleccionado={filiatorio}
                    creadoPorEmail={user.email}
                />
            )}
            {modal === 'folder' && (
                <FolderModal 
                    patient={{ id: filiatorio.idPaciente, firstName: filiatorio.nombres, lastName: filiatorio.apellido }}
                    folder={paciente.carpeta || null}
                    professionals={crmSimpleProfessionals}
                    onSave={async (folder) => {
                        await api.updateFolder(folder);
                        fetchData();
                    }}
                    onClose={() => setModal(null)}
                />
            )}
            {modal === 'definirCirugia' && <DefinirCirugiaModal onConfirm={handleDefinirCirugia} onCancel={() => setModal(null)} />}
            {modal === 'editarFicha' && <EditarPacienteModal paciente={filiatorio} onClose={() => setModal(null)} onSuccess={() => { setModal(null); fetchData(); }} onDelete={() => { setModal(null); onBack(); }} />}
            {modal === 'verFicha' && <FichaModal paciente={paciente} equipoAsignado={equipoAsignado} allProfesionales={allProfesionales} onClose={() => setModal(null)} onEdit={() => { setModal(null); setTimeout(() => setModal('editarFicha'), 100); }} canEdit={canEdit} />}
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
            {modal === 'turnHistorial' && (
    <TurnHistoryModal
        onClose={() => setModal(null)}
        contacto={{
            id: filiatorio.idPaciente,
            firstName: filiatorio.nombres,
            lastName: filiatorio.apellido,
            isPatient: true,
            dni: filiatorio.dni,
            phone: filiatorio.telefono,
            email: filiatorio.email,
        } as any}
    />
)}
            {modal === 'pedidosRecetas' && (
    <PedidosRecetasModal
        paciente={paciente}
        user={user}
        onClose={() => setModal(null)}
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
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Comorbilidades</label>
                            <div className="space-y-4">
                                {COMORBILIDADES_CATEGORIZADAS.map(cat => (
                                    <div key={cat.categoria} className="border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{cat.categoria}</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {cat.items.map(c => (
                                                <label key={c} className="flex items-center text-sm font-normal text-slate-700 select-none cursor-pointer">
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
                                                        className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 mr-2"
                                                    />
                                                    {c}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
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
                <Modal title={estudioData.idEstudio ? 'Editar Estudio' : 'Registrar Nuevo Estudio'} onClose={() => setModal(null)} maxWidth="max-w-3xl">
                    <ModalForm onSave={handleCreateEstudio} onCancel={() => setModal(null)} isSaving={isSaving}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Fecha</label>
                                <input type="date" value={estudioData.fecha ?? ''} onChange={e => setEstudioData(p => ({...p, fecha: e.target.value}))} className="mt-1 block w-full rounded-md border-slate-300" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Tipo de Estudio</label>
                                <select
                                    value={estudioData.tipo ?? TipoEstudio.LABORATORIO}
                                    onChange={e => setEstudioData(p => ({
                                        ...p,
                                        tipo: e.target.value as TipoEstudio,
                                        resultados: e.target.value === TipoEstudio.LABORATORIO ? (p.resultados || []) : undefined,
                                        resultadoBiopsia: e.target.value === TipoEstudio.ENDOSCOPIA ? (p.resultadoBiopsia || '') : undefined,
                                    }))}
                                    className="mt-1 block w-full rounded-md border-slate-300"
                                >
                                    {TIPOS_ESTUDIO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Descripción / Título</label>
                            <input type="text" value={estudioData.descripcion ?? ''} onChange={e => setEstudioData(p => ({...p, descripcion: e.target.value}))} className="mt-1 block w-full rounded-md border-slate-300" />
                        </div>
                        <div>
    <label className="block text-sm font-medium">Adjuntar Archivo (PDF, imagen)</label>
    <input
        type="file"
        accept=".pdf,image/*"
        onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
                setEstudioData(p => ({ ...p, nombreArchivo: file.name }));
                setSelectedFile(file);
            }
        }}
        className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
    />
    {estudioData.nombreArchivo && (
        <p className="text-xs text-slate-500 mt-1">Archivo: {selectedFile ? selectedFile.name : getFileNameFromUrl(estudioData.nombreArchivo)}</p>
    )}
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
                 <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
                    {filiatorio.fotoPerfil ? (
                        <div className="w-24 h-24 rounded-full ring-4 ring-white shadow-md overflow-hidden flex-shrink-0">
                            <img src={filiatorio.fotoPerfil} alt="" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <UserPhotoPlaceholderIcon />
                    )}
                    <div className="mt-4 sm:mt-0 sm:ml-6 flex-grow w-full">
                         
<div className="flex flex-col md:flex-row justify-between items-center gap-4">
    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
        {filiatorio.apellido}, {filiatorio.nombres}
        <span className="text-base font-normal text-slate-500 ml-3 block sm:inline mt-1 sm:mt-0">
            (HC: {filiatorio.nroHc || 'N/A'} · {filiatorio.obraSocial || 'Sin Obra Social'} · {edad !== null ? `${edad} años` : 'Edad N/A'})
        </span>
    </h2>
    <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Selector de prioridad */}
        <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Prioridad:</span>
            {([Priority.ALTA, Priority.MEDIA, Priority.NORMAL] as const).map(p => {
                const cfg = {
                    [Priority.ALTA]:   { color: 'bg-red-500',    label: 'Alta' },
                    [Priority.MEDIA]:  { color: 'bg-yellow-500', label: 'Media' },
                    [Priority.NORMAL]: { color: 'bg-blue-400',   label: 'Normal' },
                }[p];
                return (
                    <button
                        key={p}
                        onClick={() => handleCambioPrioridad(p)}
                        title={`Prioridad ${cfg.label}`}
                        className={`px-2 py-1 text-xs font-semibold rounded-full transition-all ${
                            prioridad === p
                                ? `${cfg.color} text-white ring-2 ring-offset-1`
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {cfg.label}
                    </button>
                );
            })}
        </div>
        {/* Tag dropdown con sub-etiqueta para POSBARIATRICO */}
        <div className="flex flex-col items-center sm:items-end gap-1">
            <div className="relative">
                <button onClick={() => setShowTagDropdown(!showTagDropdown)} onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)} className={`flex items-center px-3 py-2 text-sm font-semibold rounded-full ${etiquetaInfo.color}`}>
                    <TagIcon />
                    {filiatorio.etiquetaPrincipalActiva.replace(/_/g, ' ')}
                    <ChevronDownIcon/>
                </button>
                {showTagDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border text-left">
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
            {filiatorio.etiquetaPrincipalActiva === 'POSBARIATRICO' && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800">
                    Etapa post-op: {getPostOpStageLabel(paciente.cirugia?.fechaRealizada || filiatorio.fechaCirugia)}
                </span>
            )}
        </div>
    </div>
</div>
                         <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 mt-6 text-sm text-slate-600">
                            <button onClick={() => setModal('verFicha')} className="flex items-center gap-1 hover:text-indigo-600 hover:underline"><IdentificationIcon /> Ver Ficha</button>
                            <button onClick={() => setModal('agendarTurno')} className="flex items-center gap-1 hover:text-indigo-600 hover:underline"><CalendarDaysIcon /> Agendar Turno</button>
                            <button onClick={() => setModal('turnHistorial')} className="flex items-center gap-1 hover:text-cyan-600 hover:underline">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                Historial de Turnos
                            </button>
                            <button onClick={() => setModal('createTask')} className="flex items-center gap-1 hover:text-indigo-600 hover:underline"><ClipboardPlusIcon />+ Crear Tarea</button>
                            <button onClick={() => handleOpenInformeModal()} className="flex items-center gap-1 hover:text-indigo-600 hover:underline"><PencilSquareIcon /> Ver/Crear Informes</button>
                            <button onClick={() => setModal('pedidosRecetas')} className="flex items-center gap-1 hover:text-indigo-600 hover:underline">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                                Pedidos / Recetas
                            </button>
                            
                            {/* Standalone WhatsApp Action */}
                            <a 
                                href={`https://wa.me/${(() => {
                                    const clean = filiatorio.telefono.replace(/\D/g, '');
                                    return clean.startsWith('54') ? clean : ('549' + clean);
                                })()}?text=${encodeURIComponent(
                                    paciente.carpeta 
                                        ? `Hola ${filiatorio.nombres}, te escribimos para informarte que el estado de tu carpeta quirúrgica es: ${paciente.carpeta.trackingState}.`
                                        : `Hola ${filiatorio.nombres}, te escribimos de Plenus para saludarte y coordinar tus próximas consultas.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 bg-[#25D366] hover:bg-[#20ba5a] text-white px-2.5 py-1.5 rounded-md font-semibold text-xs transition-colors"
                            >
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.115-2.905-6.99-1.876-1.875-4.353-2.904-6.992-2.905C6.009 1.846 1.58 6.27 1.576 11.71c-.001 1.712.464 3.385 1.348 4.908l-.99 3.616 3.713-.974z"/>
                                </svg>
                                WhatsApp
                            </a>

                            {/* Surgical Folder State Action */}
                            {filiatorio.modalidadCobertura !== 'Particular' && 
                             filiatorio.etiquetaPrincipalActiva !== 'CIRUGIA_GENERAL' && 
                             filiatorio.etiquetaPrincipalActiva !== 'TRATAMIENTO_INDIVIDUAL' && (
                                paciente.carpeta ? (
                                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1 text-xs font-semibold text-indigo-800">
                                        <span>📁 Carpeta: <strong>{paciente.carpeta.trackingState}</strong></span>
                                        <button 
                                            onClick={() => setModal('folder')} 
                                            className="text-indigo-600 hover:text-indigo-900 underline ml-1"
                                        >
                                            Ver/Editar
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setModal('folder')} 
                                        className="flex items-center gap-1 hover:text-indigo-700 hover:underline bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-800"
                                    >
                                        📁 Crear Carpeta Quirúrgica
                                    </button>
                                )
                            )}
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
    <div className="lg:col-span-2">
        {renderInformes()}
    </div>
</div>
        </div>
    );
}