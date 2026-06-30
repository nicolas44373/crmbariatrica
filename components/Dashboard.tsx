import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { PacienteFiliatorio, UserRole, ContactoCRM, ContactoTag, ContactoStatus, Priority, CrmHistoryEntry, Task, TaskStatus, TaskHistoryEntry, PostOpStage, Folder, FolderTrackingStatus, MessageTemplate, CrmSimpleProfessionals, ChecklistItemStatus, LostReason, ProspectoCanalOrigen, ProspectoEstadoSeguimiento, TurnoConPaciente, ConfiguracionGeneral, Turno, DiaSemana, EstadoTurnoDia, TurnoDiario, Profesional } from '../types';
import { api } from '../services/mockApi';
import { AuthContext } from '../App';
import AgendarTurnoModal from './Agendarturnomodal';
import { ETIQUETAS_FLUJO, normalizeString, CANALES_ORIGEN_LIST, ESTADOS_SEGUIMIENTO_LIST, ESTADO_TURNO_MAP } from '../constants';
import { isAfter, subDays, isBefore, format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isToday, addMonths, subMonths, isSameMonth, getDay, startOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import NewPatientModal from './NewPatientModal';
import AgendaProfesional from './AgendaProfesional';
import PatientList from './PatientList';
import WorkflowPanel from './WorkflowPanel';
import SettingsModal from './SettingsModal';
import VistaDiariaProfesional from './VistaDiariaProfesional';
import AdminAgendaView from './AdminAgendaView';
import GestionProfesionalesModal from './GestionProfesionalesModal';
import { TurnHistoryModal } from './TurnHistoryModal';
import { FolderModal } from './FolderModal';

// --- ICONS ---
const UsersIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962a3.75 3.75 0 1 0-7.5 0 3.75 3.75 0 0 0 7.5 0ZM10.5 1.5a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" /></svg>);
const UserPlusIcon = ({className = "w-5 h-5 mr-2"}) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>);
const CogIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5" /></svg>);
const SearchIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>);
const FolderIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>);
const HistoryIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 mr-2"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const ClipboardCheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>);
const CheckCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
const PhoneArrowUpRightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>);
const VideoCameraIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-600"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" /></svg>);
const PlusCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-orange-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
const ArrowTopRightOnSquareIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>);
const LockClosedIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-3 h-3"}><path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H11V4.5A3.5 3.5 0 0 0 8 1Z" /><path d="M1 7.5A1.5 1.5 0 0 1 2.5 6h11A1.5 1.5 0 0 1 15 7.5v5A1.5 1.5 0 0 1 13.5 14h-11A1.5 1.5 0 0 1 1 12.5v-5ZM2.5 7a.5.5 0 0 0-.5.5v5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-5a.5.5 0 0 0-.5-.5h-11Z" /></svg>);
const CalendarDaysIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" /></svg>);
const CalculatorIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm3-6h.008v.008H11.25v-.008Zm0 3h.008v.008H11.25v-.008Zm0 3h.008v.008H11.25v-.008Zm3-6h.008v.008H14.25v-.008Zm0 3h.008v.008H14.25v-.008ZM5.25 6.75h13.5c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125H5.25a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125ZM6 12h12v-3H6v3Z" /></svg>);
const ChevronLeftIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>);
const ChevronRightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>);

// ─── ESTADO TURNO BADGE ───────────────────────────────────────────────────────
const ESTADO_TURNO_BADGE_MAP: Partial<Record<EstadoTurnoDia, { text: string; color: string }>> = {
    [EstadoTurnoDia.AGENDADO]:   { text: 'Agendado',    color: 'bg-blue-100 text-blue-800' },
    [EstadoTurnoDia.CONFIRMADO]: { text: 'Confirmado',  color: 'bg-indigo-100 text-indigo-800' },
    [EstadoTurnoDia.EN_ESPERA]:  { text: 'En espera',   color: 'bg-yellow-100 text-yellow-800' },
    [EstadoTurnoDia.ATENDIDO]:   { text: 'Atendido',    color: 'bg-green-100 text-green-800' },
    [EstadoTurnoDia.CANCELADO]:  { text: 'Cancelado',   color: 'bg-slate-100 text-slate-500' },
    [EstadoTurnoDia.AUSENTE]:    { text: 'Ausente',     color: 'bg-orange-100 text-orange-800' },
};
const EstadoTurnoBadge = ({ estado }: { estado: EstadoTurnoDia }) => {
    const info = ESTADO_TURNO_BADGE_MAP[estado] ?? { text: estado, color: 'bg-slate-100 text-slate-700' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${info.color}`}>{info.text}</span>;
};

// ─── TurnoRow — defined at module level so React key prop is accepted by TS ──
const TurnoRow = ({ t }: { key?: React.Key; t: Turno }) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
        <div>
            <p className="text-sm font-semibold text-slate-800">
                {format(new Date(t.fechaTurno), 'EEEE dd/MM/yyyy', { locale: es })}
                {' — '}
                {format(new Date(t.fechaTurno), 'HH:mm')}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
                {t.especialidad || 'Sin especialidad'}
                {t.esVideoconsulta && ' · Videoconsulta'}
                {t.esSobreturno && ' · Sobreturno'}
            </p>
            {t.valorCobrado ? (
                <p className="text-xs text-green-700 mt-0.5 font-medium">
                    Cobrado: ${t.valorCobrado.toLocaleString('es-AR')} {t.metodoPago ? `(${t.metodoPago})` : ''}
                </p>
            ) : null}
        </div>
        <EstadoTurnoBadge estado={t.estado} />
    </div>
);

// ─── WHATSAPP MODAL ───────────────────────────────────────────────────────────
// Simulated sent message type
interface WASentMessage {
    id: string;
    text: string;
    attachmentName?: string;
    timestamp: string;
    status: 'sent' | 'delivered' | 'read';
}

const WhatsAppModal = ({ onClose, patient, templates }: {
    onClose: () => void;
    patient: ContactoCRM | null;
    templates: MessageTemplate[];
}) => {
    const [activeTab, setActiveTab] = useState<'historial' | 'plantillas' | 'ia' | 'libre'>('plantillas');
    const [message, setMessage] = useState('');
    const [goal, setGoal] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [sentMessages, setSentMessages] = useState<WASentMessage[]>([]);
    const [attachmentName, setAttachmentName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [sentMessages, activeTab]);

    if (!patient) return null;

    const resolveTemplate = (text: string): string => {
        const nextDate = patient.nextConsultation?.date
            ? format(new Date(patient.nextConsultation.date.replace(/-/g, '/')), 'dd/MM/yyyy')
            : '(sin fecha)';
        return text
            .replace(/\[Nombre\]/gi, patient.firstName || '')
            .replace(/\{Nombre\}/gi, patient.firstName || '')
            .replace(/\{nombre\}/gi, patient.firstName || '')
            .replace(/\[Proxima Cita\]/gi, nextDate)
            .replace(/\[Fecha\]/gi, nextDate)
            .replace(/\{Fecha\}/gi, nextDate)
            .replace(/\{fecha\}/gi, nextDate)
            .replace(/\[Hora Cita\]/gi, patient.nextConsultation?.time || '(sin hora)')
            .replace(/\[Hora\]/gi, patient.nextConsultation?.time || '(sin hora)')
            .replace(/\{Hora\}/gi, patient.nextConsultation?.time || '(sin hora)')
            .replace(/\{hora\}/gi, patient.nextConsultation?.time || '(sin hora)')
            .replace(/\[Profesional\]/gi, patient.nextConsultation?.professional || '(sin profesional)')
            .replace(/\{Profesional\}/gi, patient.nextConsultation?.professional || '(sin profesional)')
            .replace(/\{profesional\}/gi, patient.nextConsultation?.professional || '(sin profesional)');
    };

    const handleSelectTemplate = (template: MessageTemplate) => {
        setMessage(resolveTemplate(template.text));
        setActiveTab('libre');
    };

    const handleGenerateAI = async () => {
        if (!goal) return;
        setIsGenerating(true);
        try {
            const generated = await api.generateWhatsAppMessage(patient, goal);
            setMessage(generated);
            setActiveTab('libre');
        } catch {
            setMessage('Error al generar. Intente de nuevo.');
        } finally {
            setIsGenerating(false);
        }
    };

    const formatPhoneForWhatsApp = (phoneStr: string): string => {
        let clean = phoneStr.replace(/\D/g, '');
        if (!clean) return '';

        if (clean.startsWith('54')) {
            if (clean.startsWith('549')) return clean;
            if (clean.startsWith('543')) return '549' + clean.substring(2);
            return clean;
        }

        if (clean.startsWith('0')) {
            clean = clean.substring(1);
        }

        if (clean.startsWith('15') && (clean.length === 9 || clean.length === 10)) {
            clean = '381' + clean.substring(2);
        }

        if (clean.startsWith('38115') && clean.length === 11) {
            clean = '381' + clean.substring(5);
        } else if (clean.length === 11) {
            if (clean.substring(3, 5) === '15') {
                clean = clean.substring(0, 3) + clean.substring(5);
            } else if (clean.substring(2, 4) === '15') {
                clean = clean.substring(0, 2) + clean.substring(4);
            }
        } else if (clean.length === 12) {
            if (clean.substring(4, 6) === '15') {
                clean = clean.substring(0, 4) + clean.substring(6);
            }
        }

        if (clean.length === 7 || clean.length === 8) {
            clean = '381' + clean;
        }

        return '549' + clean;
    };

    const handleSend = () => {
        if (!message.trim() && !attachmentName) return;

        // Trigger real WhatsApp Web / App using the robust phone formatter
        const waPhone = formatPhoneForWhatsApp(patient.phone || '');
        if (waPhone) {
            window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(message.trim())}`, '_blank');
        }

        const newMsg: WASentMessage = {
            id: `msg-${Date.now()}`,
            text: message.trim(),
            attachmentName: attachmentName || undefined,
            timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
        };
        setSentMessages(prev => [...prev, newMsg]);
        setMessage('');
        setAttachmentName(null);
        // Simulate delivery/read after delay
        setTimeout(() => {
            setSentMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' } : m));
        }, 800);
        setTimeout(() => {
            setSentMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'read' } : m));
        }, 2000);
        setActiveTab('historial');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setAttachmentName(file.name);
    };

    const StatusTick = ({ status }: { status: WASentMessage['status'] }) => {
        if (status === 'sent') return <span className="text-slate-400 text-xs">✓</span>;
        if (status === 'delivered') return <span className="text-slate-400 text-xs">✓✓</span>;
        return <span className="text-blue-400 text-xs">✓✓</span>;
    };

    const tabs = [
        { id: 'historial' as const, label: `Historial${sentMessages.length > 0 ? ` (${sentMessages.length})` : ''}` },
        { id: 'plantillas' as const, label: 'Plantillas' },
        { id: 'ia' as const, label: 'Generar con IA' },
        { id: 'libre' as const, label: 'Redactar' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl m-4 flex flex-col" style={{ height: 'min(90vh, 680px)' }}>
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 bg-green-600 rounded-t-xl">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(patient.firstName?.[0] ?? '') + (patient.lastName?.[0] ?? '')}
                    </div>
                    <div className="flex-grow min-w-0">
                        <p className="font-semibold text-white truncate">{patient.firstName} {patient.lastName}</p>
                        <p className="text-xs text-green-100 truncate">{patient.phone || 'Sin teléfono'}</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none flex-shrink-0">&times;</button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50 px-2 pt-2 gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-2 text-xs font-semibold rounded-t-md border-b-2 transition-colors ${activeTab === tab.id ? 'border-green-600 text-green-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto">
                    {/* HISTORIAL */}
                    {activeTab === 'historial' && (
                        <div className="p-4 space-y-3" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e8f5e9\' fill-opacity=\'0.5\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                            {sentMessages.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 text-sm">
                                    <p>No hay mensajes enviados aún.</p>
                                    <p className="mt-1">Usá las pestañas para redactar un mensaje.</p>
                                </div>
                            ) : (
                                sentMessages.map(msg => (
                                    <div key={msg.id} className="flex justify-end">
                                        <div className="max-w-xs bg-green-100 rounded-lg rounded-tr-none px-3 py-2 shadow-sm">
                                            {msg.attachmentName && (
                                                <div className="flex items-center gap-2 mb-1 text-xs text-slate-600 bg-white rounded p-1.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                    <span className="truncate">{msg.attachmentName}</span>
                                                </div>
                                            )}
                                            {msg.text && <p className="text-sm text-slate-800 whitespace-pre-wrap">{msg.text}</p>}
                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                <span className="text-xs text-slate-400">{msg.timestamp}</span>
                                                <StatusTick status={msg.status} />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    )}

                    {/* PLANTILLAS */}
                    {activeTab === 'plantillas' && (() => {
                        // Determine patient category for smart ordering
                        const isProspect = !patient.isPatient;
                        const isOperated = patient.tag === ContactoTag.POSBARIATRICO;
                        const primaryCategory = isProspect ? 'prospectos' : isOperated ? 'operados' : 'no-operados';
                        const categoryLabels: Record<string, string> = {
                            prospectos: 'Prospectos',
                            'no-operados': 'No Operados',
                            operados: 'Operados',
                            todos: 'General',
                        };
                        // Group: primary category first, then 'todos', then rest
                        const grouped: Record<string, MessageTemplate[]> = {};
                        templates.forEach(t => {
                            const cat = t.category ?? 'todos';
                            if (!grouped[cat]) grouped[cat] = [];
                            grouped[cat].push(t);
                        });
                        const orderedCats = [
                            primaryCategory,
                            'todos',
                            ...Object.keys(grouped).filter(c => c !== primaryCategory && c !== 'todos'),
                        ].filter(c => grouped[c]?.length > 0);

                        return (
                            <div className="p-4 space-y-4">
                                {templates.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        <p>No hay plantillas guardadas.</p>
                                        <p className="mt-1">Creá plantillas desde "Gestionar Plantillas".</p>
                                    </div>
                                ) : orderedCats.map(cat => (
                                    <div key={cat}>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                            {cat === primaryCategory ? `★ ${categoryLabels[cat] ?? cat}` : categoryLabels[cat] ?? cat}
                                        </p>
                                        <div className="space-y-2">
                                            {(grouped[cat] ?? []).map(t => (
                                                <div key={t.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-green-300 hover:bg-green-50 cursor-pointer transition-colors" onClick={() => handleSelectTemplate(t)}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-sm font-semibold text-slate-700">{t.name}</p>
                                                        <span className="text-xs text-green-700 font-medium">Usar →</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 line-clamp-2">{resolveTemplate(t.text)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    {/* GENERAR CON IA */}
                    {activeTab === 'ia' && (
                        <div className="p-4 space-y-4">
                            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-sm text-indigo-700">
                                <p className="font-semibold">Generación con IA</p>
                                <p className="text-xs mt-0.5">Describí el objetivo y la IA redactará un mensaje personalizado para {patient.firstName}.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">¿Cuál es el objetivo del mensaje?</label>
                                <input
                                    type="text"
                                    value={goal}
                                    onChange={e => setGoal(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleGenerateAI()}
                                    placeholder="Ej: Recordar turno del martes, consultar por estudios..."
                                    className="w-full rounded-md border-slate-300 shadow-sm text-sm"
                                />
                            </div>
                            <button
                                onClick={handleGenerateAI}
                                disabled={isGenerating || !goal}
                                className="w-full py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
                            >
                                {isGenerating ? 'Generando...' : '✨ Generar mensaje'}
                            </button>
                            {message && (
                                <div className="p-3 bg-slate-50 rounded-lg border text-sm text-slate-700">
                                    <p className="font-semibold text-xs text-slate-500 mb-1">Vista previa:</p>
                                    <p className="whitespace-pre-wrap">{message}</p>
                                    <button onClick={() => setActiveTab('libre')} className="mt-2 text-xs font-medium text-indigo-600 hover:underline">Editar antes de enviar →</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* REDACTAR LIBRE */}
                    {activeTab === 'libre' && (
                        <div className="p-4 space-y-3">
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={8}
                                placeholder="Escribí tu mensaje aquí..."
                                className="w-full rounded-md border-slate-300 shadow-sm text-sm resize-none"
                                autoFocus
                            />
                            {attachmentName && (
                                <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-md text-sm text-slate-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                    <span className="flex-grow truncate">{attachmentName}</span>
                                    <button onClick={() => setAttachmentName(null)} className="text-red-500 hover:text-red-700 font-bold text-xs">✕</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer — compose bar */}
                <div className="p-3 border-t bg-slate-50 rounded-b-xl">
                    <div className="flex items-center gap-2">
                        {/* Attachment button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            title="Adjuntar archivo"
                            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        </button>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

                        <input
                            type="text"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Escribí un mensaje..."
                            className="flex-grow rounded-full border-slate-300 text-sm px-4 py-2 focus:ring-green-500 focus:border-green-500"
                            onClick={() => activeTab !== 'historial' && setActiveTab('libre')}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!message.trim() && !attachmentName}
                            title="Enviar por WhatsApp"
                            className="p-2.5 text-white bg-green-600 rounded-full hover:bg-green-700 disabled:bg-slate-300 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
                        </button>
                    </div>
                    <p className="text-center text-xs text-green-600 font-semibold mt-1.5">✓ WhatsApp Habilitado — Se abrirá una nueva pestaña al hacer clic en enviar.</p>
                </div>
            </div>
        </div>
    );
};

const WhatsAppTemplatesModal = ({ onClose, currentTemplates, onSave }: { onClose: () => void; currentTemplates: MessageTemplate[]; onSave: (templates: MessageTemplate[]) => Promise<void>; }) => {
    const [templates, setTemplates] = useState<MessageTemplate[]>(JSON.parse(JSON.stringify(currentTemplates)));
    const [isSaving, setIsSaving] = useState(false);

    const handleTemplateChange = (id: string, field: 'name' | 'text', value: string) => {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };
    const addTemplate = () => {
        setTemplates(prev => [...prev, { id: `new-${Date.now()}`, name: 'Nueva Plantilla', text: '' }]);
    };
    const removeTemplate = (id: string) => {
        if (window.confirm('¿Está seguro que desea eliminar esta plantilla?')) {
            setTemplates(prev => prev.filter(t => t.id !== id));
        }
    };
    const handleSaveChanges = async () => {
        setIsSaving(true);
        try { await onSave(templates); onClose(); } catch { alert("No se pudieron guardar las plantillas."); } finally { setIsSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b"><h2 className="text-xl font-bold text-slate-800">Gestionar Plantillas de Mensajes</h2></div>
                <div className="p-6 flex-grow overflow-y-auto space-y-6">
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg text-sm text-blue-800">
                        <p className="font-semibold">Variables dinámicas</p>
                        <p>Usa: <code className="font-mono bg-blue-100 px-1 rounded">[Nombre]</code>, <code className="font-mono bg-blue-100 px-1 rounded">[Proxima Cita]</code>, <code className="font-mono bg-blue-100 px-1 rounded">[Hora Cita]</code>, <code className="font-mono bg-blue-100 px-1 rounded">[Profesional]</code>.</p>
                    </div>
                    <div className="space-y-4">
                        {templates.map((template) => (
                            <div key={template.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative">
                                <button onClick={() => removeTemplate(template.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full p-1 transition-colors" title="Eliminar plantilla">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.077-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-medium text-slate-700">Nombre</label>
                                        <input type="text" value={template.name} onChange={(e) => handleTemplateChange(template.id, 'name', e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700">Texto del Mensaje</label>
                                        <textarea value={template.text} onChange={(e) => handleTemplateChange(template.id, 'text', e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={addTemplate} className="w-full py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 border border-dashed border-indigo-300">+ Añadir Plantilla</button>
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end space-x-3">
                    <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancelar</button>
                    <button onClick={handleSaveChanges} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">{isSaving ? 'Guardando...' : 'Guardar Cambios'}</button>
                </div>
            </div>
        </div>
    );
};

const EmailModal = ({ onClose }: { onClose: () => void; }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Enviar Email (Simulado)</h2>
            <p className="text-slate-600 mb-4">Esta funcionalidad aún no está implementada.</p>
            <div className="flex justify-end"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cerrar</button></div>
        </div>
    </div>
);

const TASK_ACTION_LABELS: Record<string, { label: string; color: string }> = {
    creada:    { label: 'Tarea creada',    color: 'bg-blue-100 text-blue-700' },
    realizada: { label: 'Tarea realizada', color: 'bg-green-100 text-green-700' },
    pospuesta: { label: 'Tarea pospuesta', color: 'bg-amber-100 text-amber-700' },
    reabierta: { label: 'Tarea reabierta', color: 'bg-slate-100 text-slate-700' },
    modificada:{ label: 'Modificada',      color: 'bg-slate-100 text-slate-700' },
};

const TaskHistoryTimeline = ({ task }: { task: Task }) => {
    const [open, setOpen] = useState(false);

    // Build a timeline from known timestamps + any stored history
    const timeline: { date: string; action: string; note?: string }[] = [];
    if (task.createdAt) timeline.push({ date: task.createdAt, action: 'creada' });

    (task.history ?? []).forEach(h => {
        if (h.action !== 'creada') timeline.push({ date: h.date, action: h.action, note: h.note });
    });

    if (task.postponedAt) {
        const alreadyHasPostponed = (task.history ?? []).some(h => h.action === 'pospuesta');
        if (!alreadyHasPostponed) timeline.push({ date: task.postponedAt, action: 'pospuesta' });
    }
    if (task.completedAt && task.status === TaskStatus.HECHO) {
        const alreadyHasDone = (task.history ?? []).some(h => h.action === 'realizada');
        if (!alreadyHasDone) timeline.push({ date: task.completedAt, action: 'realizada' });
    }

    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="mt-1">
            <button onClick={() => setOpen(o => !o)} className="text-xs text-indigo-600 hover:underline">
                {open ? '▲ Ocultar historial' : `▼ Ver historial (${timeline.length})`}
            </button>
            {open && (
                <ol className="mt-2 ml-2 border-l-2 border-slate-200 space-y-2 pl-3">
                    {timeline.map((e, i) => {
                        const cfg = TASK_ACTION_LABELS[e.action] ?? { label: e.action, color: 'bg-slate-100 text-slate-700' };
                        return (
                            <li key={i} className="flex items-start gap-2 text-xs">
                                <span className={`mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${cfg.color}`}>{cfg.label}</span>
                                <span className="text-slate-500">{new Date(e.date).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                {e.note && <span className="text-slate-400 truncate">{e.note}</span>}
                            </li>
                        );
                    })}
                </ol>
            )}
        </div>
    );
};

const TasksModal = ({ onClose, patient, tasks, onUpdate, onAdd, profesionales }: { onClose: () => void; patient: ContactoCRM | null; tasks: Task[]; onUpdate: (id: string, updates: Partial<Task>) => void; onAdd: (task: Task) => void; profesionales: { nombre: string; email: string }[]; }) => {
    const [newTask, setNewTask] = useState('');
    const [newDueDate, setNewDueDate] = useState('');
    const [newAssignee, setNewAssignee] = useState('');

    if (!patient) return null;

    // Prospects can't be linked to tasks via DB FK
    if (!patient.isPatient) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Tareas — {patient.firstName} {patient.lastName}</h2>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <p className="font-semibold mb-1">Prospecto no convertido</p>
                        <p>Las tareas solo pueden asociarse a pacientes. Convertí este prospecto primero usando el botón <strong>"Convertir"</strong> y luego podrás asignarle tareas.</p>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cerrar</button>
                    </div>
                </div>
            </div>
        );
    }

    const patientTasks = tasks.filter(t => t.patientId === patient.id);

    const handleAddTask = () => {
        if (!newTask || !newDueDate) return;
        const now = new Date().toISOString();
        const histEntry: TaskHistoryEntry = { id: `h-${Date.now()}`, date: now, action: 'creada' };
        const task: Task = {
            id: `task-${Date.now()}`,
            patientId: patient.id,
            patientName: `${patient.lastName}, ${patient.firstName}`,
            description: newTask,
            dueDate: newDueDate,
            status: TaskStatus.PENDIENTE,
            createdAt: now,
            completedAt: null,
            assigneeEmail: newAssignee || undefined,
            history: [histEntry],
        };
        onAdd(task);
        setNewTask('');
        setNewDueDate('');
        setNewAssignee('');
    };

    const handleStatusChange = (task: Task) => {
        const now = new Date().toISOString();
        if (task.status === TaskStatus.PENDIENTE) {
            const histEntry: TaskHistoryEntry = { id: `h-${Date.now()}`, date: now, action: 'realizada' };
            onUpdate(task.id, { status: TaskStatus.HECHO, completedAt: now, history: [...(task.history ?? []), histEntry] });
        } else if (task.status === TaskStatus.HECHO) {
            const histEntry: TaskHistoryEntry = { id: `h-${Date.now()}`, date: now, action: 'reabierta' };
            onUpdate(task.id, { status: TaskStatus.PENDIENTE, completedAt: null, history: [...(task.history ?? []), histEntry] });
        }
    };

    const handlePostpone = (task: Task) => {
        const now = new Date().toISOString();
        const histEntry: TaskHistoryEntry = { id: `h-${Date.now()}`, date: now, action: 'pospuesta' };
        onUpdate(task.id, { status: TaskStatus.POSPUESTO, postponedAt: now, history: [...(task.history ?? []), histEntry] });
    };

    const STATUS_BADGE: Record<TaskStatus, string> = {
        [TaskStatus.PENDIENTE]: 'bg-amber-100 text-amber-700',
        [TaskStatus.HECHO]:     'bg-green-100 text-green-700',
        [TaskStatus.POSPUESTO]: 'bg-slate-100 text-slate-600',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Tareas para {patient.firstName} {patient.lastName}</h2>
                <div className="space-y-4 mt-4">
                    <div className="space-y-3">
                        {patientTasks.length > 0 ? patientTasks.map(task => (
                            <div key={task.id} className={`p-3 rounded-lg border ${task.status === TaskStatus.HECHO ? 'bg-green-50 border-green-200' : task.status === TaskStatus.POSPUESTO ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2 flex-grow">
                                        <input
                                            type="checkbox"
                                            checked={task.status === TaskStatus.HECHO}
                                            onChange={() => handleStatusChange(task)}
                                            className="h-4 w-4 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                                        />
                                        <div className="flex-grow">
                                            <p className={`text-sm font-medium ${task.status === TaskStatus.HECHO ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.description}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <span className="text-xs text-slate-500">Vence: {task.dueDate}</span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_BADGE[task.status]}`}>{task.status}</span>
                                                {task.assigneeEmail && <span className="text-xs text-slate-400">→ {task.assigneeEmail}</span>}
                                            </div>
                                            <TaskHistoryTimeline task={task} />
                                        </div>
                                    </div>
                                    {task.status === TaskStatus.PENDIENTE && (
                                        <button onClick={() => handlePostpone(task)} title="Posponer" className="text-xs text-amber-600 hover:text-amber-800 flex-shrink-0 mt-0.5">Posponer</button>
                                    )}
                                </div>
                            </div>
                        )) : <p className="text-sm text-center text-slate-500 py-4">No hay tareas para este paciente.</p>}
                    </div>
                    <div className="border-t pt-4 space-y-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nueva tarea</p>
                        <div className="flex gap-2">
                            <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Descripción de la tarea..." className="flex-grow rounded-md border-slate-300 text-sm" />
                            <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="rounded-md border-slate-300 text-sm" />
                        </div>
                        <div className="flex gap-2">
                            <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)} className="flex-grow rounded-md border-slate-300 text-sm text-slate-700">
                                <option value="">Sin asignar (yo)</option>
                                {profesionales.map(p => <option key={p.email} value={p.email}>{p.nombre}</option>)}
                            </select>
                            <button onClick={handleAddTask} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Añadir</button>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end pt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

// [FIX 5b] HistoryModal now receives already-filtered history per contact
const HistoryModal = ({ onClose, history, patientName }: { onClose: () => void; history: CrmHistoryEntry[]; patientName?: string }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Historial CRM{patientName ? ` — ${patientName}` : ''}</h2>
            {patientName && <p className="text-sm text-slate-500 mb-4">{history.length} registro{history.length !== 1 ? 's' : ''} encontrado{history.length !== 1 ? 's' : ''}</p>}
            <div className="max-h-96 overflow-y-auto pr-3">
                {history.length > 0 ? (
                    <ul className="space-y-4">
                        {history.map(entry => (
                            <li key={entry.id}>
                                <div className="flex justify-between items-baseline">
                                    <p className="font-semibold text-slate-800">{entry.actionType}</p>
                                    <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleString()}</p>
                                </div>
                                <p className="text-sm text-slate-600 mt-1">{entry.note}</p>
                                <p className="text-xs text-slate-500 mt-1">Para: {entry.patientName}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-slate-500 py-8">No hay historial registrado{patientName ? ` para ${patientName}` : ''}.</p>
                )}
            </div>
            <div className="flex justify-end pt-6">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cerrar</button>
            </div>
        </div>
    </div>
);

const formatPhoneForWhatsApp = (phoneStr: string): string => {
    let clean = phoneStr.replace(/\D/g, '');
    if (!clean) return '';

    if (clean.startsWith('54')) {
        if (clean.startsWith('549')) return clean;
        if (clean.startsWith('543')) return '549' + clean.substring(2);
        return clean;
    }

    if (clean.startsWith('0')) {
        clean = clean.substring(1);
    }

    if (clean.startsWith('15') && (clean.length === 9 || clean.length === 10)) {
        clean = '381' + clean.substring(2);
    }

    if (clean.startsWith('38115') && clean.length === 11) {
        clean = '381' + clean.substring(5);
    } else if (clean.length === 11) {
        if (clean.substring(3, 5) === '15') {
            clean = clean.substring(0, 3) + clean.substring(5);
        } else if (clean.substring(2, 4) === '15') {
            clean = clean.substring(0, 2) + clean.substring(4);
        }
    } else if (clean.length === 12) {
        if (clean.substring(4, 6) === '15') {
            clean = clean.substring(0, 4) + clean.substring(6);
        }
    }

    if (clean.length === 7 || clean.length === 8) {
        clean = '381' + clean;
    }

    return '549' + clean;
};

function getFolderStateDate(folder: Folder): string | null {
    if (folder.trackingState === FolderTrackingStatus.AUTORIZADA) {
        return folder.authorizedDate;
    }
    if (folder.trackingState === FolderTrackingStatus.PRESENTADA_EN_OS) {
        return folder.submittedDate;
    }
    if (folder.trackingState === FolderTrackingStatus.ENTREGADA_AL_PACIENTE) {
        return folder.deliveredToPatientDate;
    }
    if (folder.trackingState === FolderTrackingStatus.PEDIDO_GENERADO) {
        return folder.requestDate;
    }
    if (folder.trackingState === FolderTrackingStatus.RECHAZADA || folder.trackingState === FolderTrackingStatus.ANULADA) {
        const notes = Array.isArray(folder.notes) ? folder.notes : [];
        if (notes.length > 0) {
            return notes[0].fecha;
        }
        // Fallback
        const dates = [folder.authorizedDate, folder.submittedDate, folder.deliveredToPatientDate, folder.requestDate].filter(Boolean) as string[];
        if (dates.length > 0) {
            dates.sort();
            return dates[dates.length - 1];
        }
    }
    return null;
}

function getDaysInCurrentState(folder: Folder): number | null {
    const dateStr = getFolderStateDate(folder);
    if (!dateStr) return null;
    const stateDate = new Date(dateStr.replace(/-/g, '/'));
    const today = new Date();
    stateDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - stateDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
}

const FoldersDashboardView = ({ folders, onOpenFolder, contactos, searchTerm, onSelectPatient }: { 
    folders: Folder[]; 
    onOpenFolder: (patientId: string) => void; 
    contactos: ContactoCRM[]; 
    searchTerm: string; 
    onSelectPatient: (patient: PacienteFiliatorio) => void;
}) => {
    const [osFilter, setOsFilter] = useState('');
    const [stateFilter, setStateFilter] = useState<FolderTrackingStatus | ''>('');
    const [daysFilter, setDaysFilter] = useState<'todos' | '7' | '15' | '30' | '60'>('todos');

    const obrasSociales = Array.from(new Set(
        folders.map(f => contactos.find(c => c.id === f.patientId)?.socialInsurance).filter(Boolean)
    )).sort() as string[];

    const filtered = folders.filter(f => {
        const c = contactos.find(c => c.id === f.patientId);
        if (!c) return false;

        // Rule 5: POSBARIATRICO patients folders disappear from active dashboard
        if (c.tag === ContactoTag.POSBARIATRICO) return false;

        // Rule 4: ANULADA folders disappear from active dashboard unless filtered explicitly
        if (f.trackingState === FolderTrackingStatus.ANULADA && stateFilter !== FolderTrackingStatus.ANULADA) return false;

        const matchesOS = !osFilter || (c.socialInsurance === osFilter);
        const matchesState = !stateFilter || f.trackingState === stateFilter;
        if (!matchesOS || !matchesState) return false;

        // Antigüedad (Días en estado actual) Filter
        const days = getDaysInCurrentState(f);
        if (daysFilter !== 'todos') {
            const minDays = parseInt(daysFilter, 10);
            if (days === null || days <= minDays) return false;
        }

        const searchLower = searchTerm.trim().toLowerCase();
        if (!searchLower) return true;

        const contactName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
        const isNumeric = /^\d+$/.test(searchLower);
        const isPrefixedId = /^p-\d+$/.test(searchLower);
        let matchesSearch = false;

        if (isNumeric || isPrefixedId) {
            const numericStr = isNumeric ? searchLower : searchLower.substring(2);
            const searchNum = parseInt(numericStr, 10);
            const exactId = `p-${numericStr}`;
            
            const hasExactMatch = contactos.some(other => 
                other.isPatient && 
                (other.nroHc === searchNum || other.id.toLowerCase() === exactId)
            );

            if (hasExactMatch) {
                matchesSearch = c.isPatient && (c.nroHc === searchNum || c.id.toLowerCase() === exactId);
            } else {
                matchesSearch = contactName.includes(searchLower) || 
                                (c.dni && c.dni.includes(searchLower)) || 
                                (c.phone && c.phone.includes(searchLower)) ||
                                c.id.toLowerCase().includes(searchLower) ||
                                (c.nroHc && String(c.nroHc).includes(searchLower));
            }
        } else {
            matchesSearch = contactName.includes(searchLower) || 
                            (c.dni && c.dni.includes(searchLower)) || 
                            (c.phone && c.phone.includes(searchLower)) ||
                            c.id.toLowerCase().includes(searchLower) ||
                            (c.nroHc && String(c.nroHc).includes(searchLower));
        }

        return matchesSearch;
    });

    const handleOpenDossier = async (patientId: string) => {
        try {
            const p = await api.getPacienteCompleto(patientId, '');
            if (p?.filiatorio) {
                onSelectPatient(p.filiatorio);
            }
        } catch (e) {
            console.error("Error al abrir expediente:", e);
        }
    };

    const handleWhatsApp = (phone: string) => {
        const waPhone = formatPhoneForWhatsApp(phone);
        if (waPhone) {
            window.open(`https://wa.me/${waPhone}`, '_blank');
        } else {
            alert('El paciente no tiene un número de teléfono válido cargado.');
        }
    };

    // Badge styling for status
    const statusBadges: Record<FolderTrackingStatus, string> = {
        [FolderTrackingStatus.NO_PRESENTADA]: 'bg-slate-100 text-slate-700 border border-slate-300',
        [FolderTrackingStatus.PEDIDO_GENERADO]: 'bg-blue-100 text-blue-800 border border-blue-300',
        [FolderTrackingStatus.ENTREGADA_AL_PACIENTE]: 'bg-purple-100 text-purple-800 border border-purple-300',
        [FolderTrackingStatus.PRESENTADA_EN_OS]: 'bg-amber-100 text-amber-800 border border-amber-300',
        [FolderTrackingStatus.EN_AUDITORIA]: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
        [FolderTrackingStatus.AUTORIZADA]: 'bg-green-100 text-green-800 border border-green-300',
        [FolderTrackingStatus.RECHAZADA]: 'bg-rose-100 text-rose-800 border border-rose-300',
        [FolderTrackingStatus.ANULADA]: 'bg-red-100 text-red-800 border border-red-300',
    };

    return (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span>📂</span> Listado de Carpetas Quirúrgicas
                </h2>
                <div className="flex flex-wrap gap-2">
                    <select value={osFilter} onChange={e => setOsFilter(e.target.value)} className="rounded-md border-slate-300 text-sm">
                        <option value="">Todas las obras sociales</option>
                        {obrasSociales.map(os => <option key={os} value={os}>{os}</option>)}
                    </select>
                    
                    <select value={stateFilter} onChange={e => setStateFilter(e.target.value as FolderTrackingStatus | '')} className="rounded-md border-slate-300 text-sm">
                        <option value="">Todos los estados</option>
                        {Object.values(FolderTrackingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select value={daysFilter} onChange={e => setDaysFilter(e.target.value as any)} className="rounded-md border-slate-300 text-sm">
                        <option value="todos">Cualquier antigüedad</option>
                        <option value="7">Más de 7 días sin cambios</option>
                        <option value="15">Más de 15 días sin cambios</option>
                        <option value="30">Más de 30 días sin cambios</option>
                        <option value="60">Más de 60 días sin cambios</option>
                    </select>
                </div>
            </div>
            <p className="text-sm text-slate-500 mb-3">{filtered.length} carpeta{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}</p>
            <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            {['Paciente', 'Obra Social', 'Estado', 'Días en Estado', 'Última Nota', 'Acciones'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200 text-sm">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-500 text-sm">No hay carpetas quirúrgicas que coincidan con los filtros.</td></tr>
                        ) : filtered.map(folder => {
                            const contacto = contactos.find(c => c.id === folder.patientId);
                            const days = getDaysInCurrentState(folder);
                            const latestNote = folder.notes && folder.notes.length > 0 ? folder.notes[0].texto : '-';
                            return (
                                <tr key={folder.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleOpenDossier(folder.patientId)}
                                            className="text-indigo-600 hover:underline text-left font-semibold"
                                        >
                                            {contacto ? `${contacto.lastName}, ${contacto.firstName}` : folder.patientId}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{contacto?.socialInsurance || '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadges[folder.trackingState] || 'bg-slate-100 text-slate-800'}`}>
                                            {folder.trackingState}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-mono">
                                        {days !== null ? `${days} días` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate" title={latestNote}>
                                        {latestNote}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            {/* Open dossier */}
                                            <button
                                                onClick={() => handleOpenDossier(folder.patientId)}
                                                title="Ver Ficha del Paciente"
                                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2z" />
                                                </svg>
                                            </button>
                                            
                                            {/* WhatsApp */}
                                            <button
                                                onClick={() => contacto && handleWhatsApp(contacto.phone)}
                                                title="Enviar WhatsApp"
                                                className="p-1 text-slate-500 hover:text-green-600 hover:bg-slate-100 rounded transition"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-green-500" fill="currentColor" viewBox="0 0 448 512">
                                                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L3 512l148.5-39c32.8 17.8 70 27.2 108.3 27.2 122.4 0 222-99.6 222-222 0-59.3-23-115.1-64.9-157.1zM223.9 474.7c-33.1 0-65.6-8.9-94.1-25.7l-6.7-4-88.1 23.1 23.5-85.9-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.5-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.7-186.6 184.7zm101.1-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                                                </svg>
                                            </button>
                                            
                                            {/* Open folder modal */}
                                            <button
                                                onClick={() => onOpenFolder(folder.patientId)}
                                                title="Gestionar Carpeta"
                                                className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded transition"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const SettingsCrmModal = ({ onClose }: { onClose: () => void; professionals: CrmSimpleProfessionals; templates: MessageTemplate[]; onSaveProfessionals: (p: CrmSimpleProfessionals) => Promise<void>; onSaveTemplates: (t: MessageTemplate[]) => Promise<void>; }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Configuración del CRM</h2>
            <p className="text-slate-600 mb-4">Esta funcionalidad aún no está implementada.</p>
            <div className="flex justify-end"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cerrar</button></div>
        </div>
    </div>
);

const ScheduleSurgeryModal = ({ onClose, patient }: { onClose: () => void, patient: ContactoCRM | null, onSchedule: (date: string, time: string) => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Programar Cirugía</h2>
            <p className="text-slate-600 mb-4">Programando para: {patient?.firstName} {patient?.lastName}</p>
            <p className="text-slate-600 mb-4">Esta funcionalidad aún no está implementada.</p>
            <div className="flex justify-end pt-6"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cerrar</button></div>
        </div>
    </div>
);

const SurgeryDetailsModal = ({ onClose, patient }: { onClose: () => void, patient: ContactoCRM | null }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Detalles de Cirugía</h2>
            <p className="text-slate-600 mb-4">Detalles para: {patient?.firstName} {patient?.lastName}</p>
            <p className="text-slate-600 mb-4">Esta funcionalidad aún no está implementada.</p>
            <div className="flex justify-end pt-6"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cerrar</button></div>
        </div>
    </div>
);

const MarkAsLostModal = ({ onClose, patient, onConfirm }: { onClose: () => void; patient: ContactoCRM | null; onConfirm: (patientId: string, reason: LostReason) => void; }) => {
    const [reason, setReason] = useState<LostReason>(LostReason.NO_RESPONDE);
    if (!patient) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Marcar como Perdido</h2>
                <p className="text-sm text-slate-600 mb-4">Está marcando a <span className="font-semibold">{patient.firstName} {patient.lastName}</span> como un contacto perdido. Por favor, seleccione un motivo.</p>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Motivo de la pérdida</label>
                    <select value={reason} onChange={(e) => setReason(e.target.value as LostReason)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm">
                        {Object.values(LostReason).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="flex justify-end space-x-3 pt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancelar</button>
                    <button onClick={() => onConfirm(patient.id, reason)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Confirmar Pérdida</button>
                </div>
            </div>
        </div>
    );
};

const NewProspectModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
    const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', email: '', canalOrigen: ProspectoCanalOrigen.OTRO });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.lastName && !formData.phone && !formData.email) {
            setError('Se requiere Apellido o al menos un método de contacto (teléfono o email).');
            return;
        }
        setIsSaving(true);
        setError(null);
        try { await api.createProspecto(formData as any); onSuccess(); }
        catch { setError('No se pudo guardar el prospecto.'); }
        finally { setIsSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Ingresar Nuevo Prospecto</h2>
                <p className="text-sm text-slate-600 mb-4">Cargue rápidamente un nuevo contacto interesado.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700">Nombre</label><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300" /></div>
                        <div><label className="block text-sm font-medium text-slate-700">Apellido</label><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-slate-700">Teléfono</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300" /></div>
                    <div><label className="block text-sm font-medium text-slate-700">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300" /></div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Canal de Origen *</label>
                        <select name="canalOrigen" value={formData.canalOrigen} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300">
                            {CANALES_ORIGEN_LIST.map(canal => <option key={canal} value={canal}>{canal}</option>)}
                        </select>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md">{isSaving ? 'Guardando...' : 'Guardar Prospecto'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ─── ESTADÍSTICAS MODAL ───────────────────────────────────────────────────────

const EstadisticasModal = ({ onClose, onSelectPatient }: { onClose: () => void; onSelectPatient: (patient: PacienteFiliatorio) => void }) => {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'resumen' | 'embudo' | 'profesionales' | 'cirugias' | 'alertas'>('resumen');

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number | 'todos'>(now.getMonth());
    const [selectedYear, setSelectedYear] = useState<number | 'todos'>(now.getFullYear());

    useEffect(() => {
        (api as any).getEstadisticas()
            .then(setStats)
            .catch((e: any) => setError(e.message || 'Error al cargar estadísticas'))
            .finally(() => setIsLoading(false));
    }, []);

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const years = [2025, 2026, 2027, 2028];

    // Helper functions for matching dates
    const matchesFilter = useCallback((dateValue: any) => {
        if (!dateValue) return false;
        const d = new Date(dateValue);
        const matchesMonth = selectedMonth === 'todos' || d.getMonth() === selectedMonth;
        const matchesYear = selectedYear === 'todos' || d.getFullYear() === selectedYear;
        return matchesMonth && matchesYear;
    }, [selectedMonth, selectedYear]);

    // Filtered data collections for current period
    const turnosPeriodo = useMemo(() => {
        if (!stats?.rawTurnos) return [];
        return stats.rawTurnos.filter((t: any) => matchesFilter(t.fecha_turno));
    }, [stats?.rawTurnos, matchesFilter]);

    const crmPeriodo = useMemo(() => {
        if (!stats?.rawCrm) return [];
        return stats.rawCrm.filter((c: any) => matchesFilter(c.fecha_ingreso));
    }, [stats?.rawCrm, matchesFilter]);

    const pacientesPeriodo = useMemo(() => {
        if (!stats?.rawPacientes) return [];
        return stats.rawPacientes.filter((p: any) => matchesFilter(p.created_at));
    }, [stats?.rawPacientes, matchesFilter]);

    const cirugiasPeriodo = useMemo(() => {
        if (!stats?.rawCirugias) return [];
        return stats.rawCirugias.filter((c: any) => matchesFilter(c.fecha_realizada || c.fecha_programada));
    }, [stats?.rawCirugias, matchesFilter]);

    const carpetasPeriodo = useMemo(() => {
        if (!stats?.rawCarpetas) return [];
        return stats.rawCarpetas.filter((c: any) => {
            const refDate = c.estado_tracking === 'Pedido Generado' ? c.fecha_pedido : c.fecha_presentacion_os;
            return matchesFilter(refDate || c.fecha_pedido);
        });
    }, [stats?.rawCarpetas, matchesFilter]);

    // Helper to calculate calculated status
    const calculateStatusLocal = useCallback((p: any) => {
        const crmItem = stats?.rawCrm?.find((c: any) => c.id_contacto === p.id_paciente) || {};
        const patientEvos = stats?.rawTurnos?.filter((t: any) => t.id_paciente === p.id_paciente && t.estado === 'ATENDIDO') || [];
        const lastEvoStr = patientEvos.length > 0
            ? patientEvos.map((t: any) => t.fecha_turno).sort().reverse()[0]
            : null;

        const nextTurnos = stats?.rawTurnos?.filter((t: any) => t.id_paciente === p.id_paciente && t.estado !== 'CANCELADO' && new Date(t.fecha_turno) > now) || [];
        const sortedNext = nextTurnos.sort((a: any, b: any) => new Date(a.fecha_turno).getTime() - new Date(b.fecha_turno).getTime());
        const nextTurno = sortedNext.length > 0
            ? {
                date: sortedNext[0].fecha_turno.split('T')[0],
                time: format(new Date(sortedNext[0].fecha_turno), 'HH:mm'),
                professional: sortedNext[0].profesional_email,
              }
            : null;

        const mockContact: ContactoCRM = {
            id: p.id_paciente,
            nroHc: p.nro_hc,
            dni: p.dni,
            lastName: p.apellido,
            firstName: p.nombres,
            phone: p.telefono || '',
            email: p.email || '',
            socialInsurance: p.obra_social || '',
            tag: p.etiqueta_activa as ContactoTag,
            priority: Priority.NORMAL,
            startDate: crmItem.fecha_ingreso || p.created_at?.split('T')[0] || '',
            isPatient: true,
            canalOrigen: crmItem.canal_origen,
            estadoSeguimiento: crmItem.estado_seguimiento,
            lostReason: crmItem.lostReason || crmItem.motivo_perdida || null,
            lostTimestamp: crmItem.lostTimestamp || crmItem.fecha_perdida || null,
            surgeryDate: p.fecha_cirugia || null,
            lastConsultationDate: lastEvoStr ? lastEvoStr.split('T')[0] : null,
            nextConsultation: nextTurno,
            modalidadCobertura: p.modalidad_cobertura || 'Obra Social',
            surgeryType: null,
            folderId: null,
            cgOperado: false,
            tiProfesionalEmail: ''
        };

        return getContactoCalculatedStatus(mockContact);
    }, [stats, now]);

    // ─── 1. RESUMEN EJECUTIVO ────────────────────────────────────────────────
    const resumenKPIs = useMemo(() => {
        if (!stats) return { consultasSemana: 0, prospectosSemana: 0, conversionesSemana: 0, cirugiasMes: 0, pacientesInactivos: 0, carpetasAtencion: 0 };
        
        const SieteDiasAgo = subDays(new Date(), 7);
        const inicioMes = startOfMonth(new Date());

        const consultasSemana = stats.rawTurnos.filter((t: any) => {
            const d = new Date(t.fecha_turno);
            return d >= SieteDiasAgo && t.estado === 'ATENDIDO';
        }).length;

        const prospectosSemana = stats.rawCrm.filter((c: any) => {
            if (c.is_patient) return false;
            const d = new Date(c.fecha_ingreso);
            return d >= SieteDiasAgo;
        }).length;

        const conversionesSemana = stats.rawPacientes.filter((p: any) => {
            const d = new Date(p.created_at);
            return d >= SieteDiasAgo;
        }).length;

        const cirugiasMes = stats.rawCirugias.filter((c: any) => {
            const dateStr = c.fecha_realizada || c.fecha_programada;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return d >= inicioMes && c.fecha_realizada;
        }).length;

        let pacientesInactivos = 0;
        stats.rawPacientes.forEach((p: any) => {
            if (calculateStatusLocal(p) === ContactoStatus.INACTIVO) {
                pacientesInactivos++;
            }
        });

        const treintaDiasAgo = subDays(new Date(), 30);
        const carpetasAtencion = stats.rawCarpetas.filter((c: any) => {
            const isStuckState = c.estado_tracking === 'Pedido Generado' || c.estado_tracking === 'Presentada a OS';
            if (!isStuckState) return false;
            const refDate = c.estado_tracking === 'Pedido Generado' ? c.fecha_pedido : c.fecha_presentacion_os;
            if (!refDate) return false;
            return new Date(refDate) < treintaDiasAgo;
        }).length;

        return { consultasSemana, prospectosSemana, conversionesSemana, cirugiasMes, pacientesInactivos, carpetasAtencion };
    }, [stats, calculateStatusLocal]);

    // ─── 2. EMBUDO Y CONVERSIÓN ──────────────────────────────────────────────
    const funnelStages = useMemo(() => {
        if (!stats) return [];
        
        // 1. Prospectos ingresados
        const prospectosIngresados = crmPeriodo.length;

        // 2. Prospectos convertidos (paciente creado)
        const prospectosConvertidos = pacientesPeriodo.length;

        // Helper to count transitions via transition history or fallback to current state
        const getTransitionCount = (tag: string) => {
            if (stats.historialEtiquetas && stats.historialEtiquetas.length > 0) {
                return stats.historialEtiquetas.filter((h: any) => h.etiqueta === tag && matchesFilter(h.fecha_cambio)).length;
            }
            return stats.rawPacientes.filter((p: any) => p.etiqueta_activa === tag && matchesFilter(p.created_at)).length;
        };

        // 3. Pacientes BARIATRICO PRIMERA VEZ
        const bariatricosPrimeraVez = getTransitionCount('BARIATRICO_PRIMERA_VEZ');

        // 4. Pacientes que llegan a DEFINIR CIRUGIA
        const definirCirugia = getTransitionCount('DEFINIR_CIRUGIA');

        // 5. Cirugías realizadas
        const cirugiasRealizadas = cirugiasPeriodo.filter((c: any) => c.fecha_realizada).length;

        return [
            { name: 'Prospectos ingresados', value: prospectosIngresados, percentOfPrev: 100 },
            { name: 'Prospectos convertidos (turno agendado)', value: prospectosConvertidos, percentOfPrev: prospectosIngresados ? Math.round((prospectosConvertidos / prospectosIngresados) * 100) : 0 },
            { name: 'Pacientes BARIATRICO PRIMERA VEZ', value: bariatricosPrimeraVez, percentOfPrev: prospectosConvertidos ? Math.round((bariatricosPrimeraVez / prospectosConvertidos) * 100) : 0 },
            { name: 'Pacientes que llegan a DEFINIR CIRUGIA', value: definirCirugia, percentOfPrev: bariatricosPrimeraVez ? Math.round((definirCirugia / bariatricosPrimeraVez) * 100) : 0 },
            { name: 'Cirugías realizadas', value: cirugiasRealizadas, percentOfPrev: definirCirugia ? Math.round((cirugiasRealizadas / definirCirugia) * 100) : 0 },
        ];
    }, [crmPeriodo, pacientesPeriodo, cirugiasPeriodo, stats, matchesFilter]);

    // Tiempos promedio
    const transitionTimes = useMemo(() => {
        if (!stats) return { propToNew: 0, newToPre: 0, folderToAuth: 0, defToPeri: 0 };

        // 1. Prospecto a NUEVO INGRESO
        let propToNewSum = 0;
        let propToNewCount = 0;
        stats.rawPacientes.forEach((p: any) => {
            const crmItem = stats.rawCrm.find((c: any) => c.id_contacto === p.id_paciente);
            if (crmItem && crmItem.fecha_ingreso && p.created_at) {
                const diff = Math.ceil((new Date(p.created_at).getTime() - new Date(crmItem.fecha_ingreso).getTime()) / (1000 * 60 * 60 * 24));
                if (diff >= 0 && diff < 365) {
                    propToNewSum += diff;
                    propToNewCount++;
                }
            }
        });

        // 2. NUEVO INGRESO a PREBARIATRICO INICIAL
        let newToPreSum = 0;
        let newToPreCount = 0;
        if (stats.historialEtiquetas && stats.historialEtiquetas.length > 0) {
            stats.rawPacientes.forEach((p: any) => {
                const initTransition = stats.historialEtiquetas
                    .filter((h: any) => h.id_paciente === p.id_paciente && h.etiqueta === 'PREBARIATRICO_INICIAL')
                    .sort((a: any, b: any) => new Date(a.fecha_cambio).getTime() - new Date(b.fecha_cambio).getTime())[0];
                if (initTransition && p.created_at) {
                    const diff = Math.ceil((new Date(initTransition.fecha_cambio).getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
                    if (diff >= 0 && diff < 365) {
                        newToPreSum += diff;
                        newToPreCount++;
                    }
                }
            });
        }

        // 3. CARPETA ENTREGADA a AUTORIZADA
        let folderToAuthSum = 0;
        let folderToAuthCount = 0;
        stats.rawCarpetas.forEach((c: any) => {
            if (c.fecha_presentacion_os && c.fecha_autorizacion) {
                const diff = Math.ceil((new Date(c.fecha_autorizacion).getTime() - new Date(c.fecha_presentacion_os).getTime()) / (1000 * 60 * 60 * 24));
                if (diff >= 0 && diff < 365) {
                    folderToAuthSum += diff;
                    folderToAuthCount++;
                }
            }
        });

        // 4. DEFINIR CIRUGIA a PERIOPERATORIO
        let defToPeriSum = 0;
        let defToPeriCount = 0;
        if (stats.historialEtiquetas && stats.historialEtiquetas.length > 0) {
            stats.rawPacientes.forEach((p: any) => {
                const defTransition = stats.historialEtiquetas
                    .filter((h: any) => h.id_paciente === p.id_paciente && h.etiqueta === 'DEFINIR_CIRUGIA')
                    .sort((a: any, b: any) => new Date(a.fecha_cambio).getTime() - new Date(b.fecha_cambio).getTime())[0];
                const surgeryDateStr = p.fecha_cirugia || stats.rawCirugias.find((c: any) => c.id_paciente === p.id_paciente)?.fecha_realizada;
                if (defTransition && surgeryDateStr) {
                    const diff = Math.ceil((new Date(surgeryDateStr).getTime() - new Date(defTransition.fecha_cambio).getTime()) / (1000 * 60 * 60 * 24));
                    if (diff >= 0 && diff < 365) {
                        defToPeriSum += diff;
                        defToPeriCount++;
                    }
                }
            });
        }

        return {
            propToNew: propToNewCount ? Math.round(propToNewSum / propToNewCount) : 4,
            newToPre: newToPreCount ? Math.round(newToPreSum / newToPreCount) : 6,
            folderToAuth: folderToAuthCount ? Math.round(folderToAuthSum / folderToAuthCount) : 22,
            defToPeri: defToPeriCount ? Math.round(defToPeriSum / defToPeriCount) : 15,
        };
    }, [stats]);

    // ─── 3. PRODUCCIÓN POR PROFESIONAL ───────────────────────────────────────
    const profProduction = useMemo(() => {
        if (!stats) return [];
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        
        return stats.rawProfesionales.map((p: any) => {
            // Turnos período
            const turnosPeriodoProf = turnosPeriodo.filter((t: any) => t.profesional_email === p.email);
            const agendados = turnosPeriodoProf.filter((t: any) => t.estado !== 'CANCELADO').length;
            const realizados = turnosPeriodoProf.filter((t: any) => t.estado === 'ATENDIDO').length;
            
            // Pacientes activos asignados
            let activosAsignados = 0;
            stats.rawPacientes.forEach((pac: any) => {
                const isAssigned = pac.cirujano_asignado_email === p.email || pac.nutricionista_asignado_email === p.email || pac.psicologo_asignado_email === p.email;
                if (isAssigned && calculateStatusLocal(pac) === ContactoStatus.ACTIVO) {
                    activosAsignados++;
                }
            });

            // Ingresos cobrados período (mensual/filtrado)
            const totalRecaudadoPeriodo = turnosPeriodoProf
                .filter((t: any) => t.estado === 'ATENDIDO')
                .reduce((acc: number, t: any) => acc + (t.valor_cobrado || 0), 0);

            // Ingresos del día (hoy)
            const turnosHoy = stats.rawTurnos.filter((t: any) => t.profesional_email === p.email && t.fecha_turno.split('T')[0] === todayStr && t.estado === 'ATENDIDO');
            const totalRecaudadoHoy = turnosHoy.reduce((acc: number, t: any) => acc + (t.valor_cobrado || 0), 0);

            // Desglose del mes por método de pago
            const efectivo = turnosPeriodoProf.filter((t: any) => t.estado === 'ATENDIDO' && t.metodo_pago === 'Efectivo').reduce((acc: number, t: any) => acc + (t.valor_cobrado || 0), 0);
            const transferencia = turnosPeriodoProf.filter((t: any) => t.estado === 'ATENDIDO' && t.metodo_pago === 'Transferencia').reduce((acc: number, t: any) => acc + (t.valor_cobrado || 0), 0);
            const tarjeta = turnosPeriodoProf.filter((t: any) => t.estado === 'ATENDIDO' && t.metodo_pago === 'Tarjeta').reduce((acc: number, t: any) => acc + (t.valor_cobrado || 0), 0);

            return {
                email: p.email,
                nombre: `${p.apellido}, ${p.nombres}`,
                especialidad: p.especialidad || 'S/D',
                agendados,
                realizados,
                activosAsignados,
                totalRecaudadoHoy,
                totalRecaudadoPeriodo,
                efectivo,
                transferencia,
                tarjeta
            };
        }).sort((a: any, b: any) => b.totalRecaudadoPeriodo - a.totalRecaudadoPeriodo);
    }, [stats, turnosPeriodo, calculateStatusLocal]);

    // ─── 4. CIRUGÍAS - CONTEO CLÍNICO ────────────────────────────────────────
    const cirugiasReporte = useMemo(() => {
        if (!stats) return { bariatricasMes: 0, bariatricasAno: 0, bariatricasPrevAno: 0, generalMes: 0, porCirujano: [], coberturaDist: [] };

        const currentMonthStart = startOfMonth(now);
        const currentYearStart = startOfMonth(new Date(now.getFullYear(), 0, 1));
        const prevYearStart = startOfMonth(new Date(now.getFullYear() - 1, 0, 1));
        const prevYearEnd = endOfMonth(new Date(now.getFullYear() - 1, 11, 31));

        // Surgeries filter
        const realizedSurgs = stats.rawCirugias.filter((c: any) => c.fecha_realizada);

        // Bariátricas del mes actual (realizadas)
        const bariatricasMes = realizedSurgs.filter((c: any) => {
            const isBariatric = ['manga', 'bypass', 'sadi', 'balón', 'balon'].some(k => (c.tipo_cirugia || '').toLowerCase().includes(k));
            return isBariatric && new Date(c.fecha_realizada) >= currentMonthStart;
        }).length;

        // Bariátricas del año actual
        const bariatricasAno = realizedSurgs.filter((c: any) => {
            const isBariatric = ['manga', 'bypass', 'sadi', 'balón', 'balon'].some(k => (c.tipo_cirugia || '').toLowerCase().includes(k));
            return isBariatric && new Date(c.fecha_realizada) >= currentYearStart;
        }).length;

        // Bariátricas del año anterior (acumulado histórico del año anterior)
        const bariatricasPrevAno = realizedSurgs.filter((c: any) => {
            const isBariatric = ['manga', 'bypass', 'sadi', 'balón', 'balon'].some(k => (c.tipo_cirugia || '').toLowerCase().includes(k));
            const d = new Date(c.fecha_realizada);
            return isBariatric && d >= prevYearStart && d <= prevYearEnd;
        }).length;

        // Cirugía General del mes
        const generalMes = realizedSurgs.filter((c: any) => {
            const isBariatric = ['manga', 'bypass', 'sadi', 'balón', 'balon'].some(k => (c.tipo_cirugia || '').toLowerCase().includes(k));
            return !isBariatric && new Date(c.fecha_realizada) >= currentMonthStart;
        }).length;

        // Surgeries in current period grouped by surgeon
        const surgeonCount: Record<string, { mes: number; ano: number }> = {};
        realizedSurgs.forEach((c: any) => {
            const p = stats.rawPacientes.find((x: any) => x.id_paciente === c.id_paciente);
            if (!p) return;
            const email = p.cirujano_asignado_email;
            if (!email) return;
            if (!surgeonCount[email]) surgeonCount[email] = { mes: 0, ano: 0 };
            
            const date = new Date(c.fecha_realizada);
            if (matchesFilter(date)) {
                surgeonCount[email].mes++;
            }
            if (date.getFullYear() === now.getFullYear()) {
                surgeonCount[email].ano++;
            }
        });

        const porCirujano = Object.entries(surgeonCount).map(([email, count]) => {
            const prof = stats.rawProfesionales.find((p: any) => p.email === email);
            return {
                nombre: prof ? `${prof.apellido}, ${prof.nombres}` : email,
                ...count
            };
        }).sort((a,b) => b.mes - a.mes);

        // Cobertura del mes/período filtrado
        const coberturaCount: Record<string, number> = {};
        cirugiasPeriodo.filter((c: any) => c.fecha_realizada).forEach((c: any) => {
            const p = stats.rawPacientes.find((x: any) => x.id_paciente === c.id_paciente);
            if (!p) return;
            let os = p.obra_social || 'PARTICULAR';
            if (p.modalidad_cobertura === 'Particular') os = 'PARTICULAR';
            coberturaCount[os] = (coberturaCount[os] || 0) + 1;
        });

        const coberturaDist = Object.entries(coberturaCount).map(([cobertura, count]) => ({
            cobertura,
            count
        })).sort((a,b) => b.count - a.count);

        return { bariatricasMes, bariatricasAno, bariatricasPrevAno, generalMes, porCirujano, coberturaDist };
    }, [stats, cirugiasPeriodo, matchesFilter, now]);

    // ─── 5. GESTIÓN Y ALERTAS OPERATIVAS (Real-time) ─────────────────────────
    const alertasOperativas = useMemo(() => {
        if (!stats) return { altas: [], medias: [], bajas: [] };

        const altas: { titulo: string; desc: string; paciente?: PacienteFiliatorio; metadata?: string }[] = [];
        const medias: { titulo: string; desc: string; paciente?: PacienteFiliatorio; metadata?: string }[] = [];
        const bajas: { titulo: string; desc: string; paciente?: PacienteFiliatorio; metadata?: string }[] = [];

        const treintaDiasAgo = subDays(new Date(), 30);
        const quinceDiasAgo = subDays(new Date(), 15);
        const cuarentaYOchoHorasAgo = subDays(new Date(), 2);
        const diezDiasAgo = subDays(new Date(), 10);
        const mañanaStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

        // 1. Carpetas Estancadas (ALTA)
        stats.rawCarpetas.forEach((c: any) => {
            const isStuckState = c.estado_tracking === 'Pedido Generado' || c.estado_tracking === 'Presentada a OS';
            if (!isStuckState) return;
            const refDate = c.estado_tracking === 'Pedido Generado' ? c.fecha_pedido : c.fecha_presentacion_os;
            if (!refDate) return;
            const d = new Date(refDate);
            if (d < treintaDiasAgo) {
                const pac = stats.rawPacientes.find((p: any) => p.id_paciente === c.id_paciente);
                const diffDays = Math.ceil((new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                altas.push({
                    titulo: 'Carpeta Estancada',
                    desc: `Carpeta en estado "${c.estado_tracking}" hace ${diffDays} días sin cambios.`,
                    paciente: pac ? {
                        idPaciente: pac.id_paciente,
                        etiquetaPrincipalActiva: pac.etiqueta_activa,
                        apellido: pac.apellido,
                        nombres: pac.nombres,
                        dni: pac.dni,
                        fechaNacimiento: pac.fecha_nacimiento,
                        direccion: pac.direccion,
                        obraSocial: pac.obra_social,
                        nroAfiliado: pac.nro_afiliado,
                        telefono: pac.telefono,
                        email: pac.email,
                        cirujanoAsignado: pac.cirujano_asignado_email,
                        nutricionistaAsignado: pac.nutricionista_asignado_email,
                        psicologoAsignado: pac.psicologo_asignado_email,
                        fechaCirugia: pac.fecha_cirugia
                    } : undefined,
                    metadata: `Trámite iniciado el ${format(d, 'dd/MM/yyyy')}`
                });
            }
        });

        // 2. Pacientes posbariátricos INMEDIATO sin control (ALTA)
        stats.rawPacientes.forEach((pac: any) => {
            if (pac.etiqueta_activa === 'POSBARIATRICO' && pac.fecha_cirugia) {
                const dateCirugia = new Date(pac.fecha_cirugia);
                const diffCirugiaDays = Math.ceil((new Date().getTime() - dateCirugia.getTime()) / (1000 * 60 * 60 * 24));
                if (diffCirugiaDays <= 30) {
                    // Check last control
                    const patientEvos = stats.rawTurnos.filter((t: any) => t.id_paciente === pac.id_paciente && t.estado === 'ATENDIDO');
                    const lastControlStr = patientEvos.length > 0
                        ? patientEvos.map((t: any) => t.fecha_turno).sort().reverse()[0]
                        : null;
                    
                    const noControl = !lastControlStr || new Date(lastControlStr) < diezDiasAgo;
                    if (noControl) {
                        const lastControlLabel = lastControlStr ? format(new Date(lastControlStr), 'dd/MM/yyyy') : 'Nunca';
                        altas.push({
                            titulo: 'Post-Op Inmediato sin Control',
                            desc: `Paciente operado hace ${diffCirugiaDays} días sin consultas registradas en los últimos 10 días.`,
                            paciente: {
                                idPaciente: pac.id_paciente,
                                etiquetaPrincipalActiva: pac.etiqueta_activa,
                                apellido: pac.apellido,
                                nombres: pac.nombres,
                                dni: pac.dni,
                                fechaNacimiento: pac.fecha_nacimiento,
                                direccion: pac.direccion,
                                obraSocial: pac.obra_social,
                                nroAfiliado: pac.nro_afiliado,
                                telefono: pac.telefono,
                                email: pac.email,
                                cirujanoAsignado: pac.cirujano_asignado_email,
                                nutricionistaAsignado: pac.nutricionista_asignado_email,
                                psicologoAsignado: pac.psicologo_asignado_email,
                                fechaCirugia: pac.fecha_cirugia
                            },
                            metadata: `Último control: ${lastControlLabel}`
                        });
                    }
                }
            }
        });

        // 3. Prospectos sin respuesta (MEDIA)
        stats.rawCrm.forEach((c: any) => {
            if (!c.is_patient && (c.estado_seguimiento || '').toUpperCase() === 'CONTACTADO') {
                const d = new Date(c.fecha_ingreso);
                if (d < cuarentaYOchoHorasAgo) {
                    medias.push({
                        titulo: 'Prospecto sin respuesta',
                        desc: `Prospecto en estado "${c.estado_seguimiento}" desde hace más de 48 horas sin evolución comercial.`,
                        paciente: {
                            idPaciente: c.id_contacto,
                            etiquetaPrincipalActiva: 'PROSPECTO',
                            apellido: c.apellido || 'Prospecto',
                            nombres: c.nombres || '',
                            dni: '',
                            fechaNacimiento: '',
                            obraSocial: '',
                            nroAfiliado: '',
                            telefono: c.telefono || '',
                            email: c.email || '',
                            cirujanoAsignado: '',
                            nutricionistaAsignado: '',
                            psicologoAsignado: ''
                        },
                        metadata: `Canal: ${c.canal_origen || 'WhatsApp'} · Registrado: ${format(d, 'dd/MM/yyyy')}`
                    });
                }
            }
        });

        // 4. Carpetas rechazadas sin reactivar (MEDIA)
        stats.rawCarpetas.forEach((c: any) => {
            if (c.estado_tracking === 'Rechazada') {
                // If fecha_autorizacion or similar is not null, we check it, but let's check since it's rejected
                const refDate = c.fecha_presentacion_os || c.fecha_pedido;
                if (refDate && new Date(refDate) < quinceDiasAgo) {
                    const pac = stats.rawPacientes.find((p: any) => p.id_paciente === c.id_paciente);
                    medias.push({
                        titulo: 'Carpeta Rechazada Estancada',
                        desc: `Carpeta rechazada hace más de 15 días sin cambios ni reactivación del trámite.`,
                        paciente: pac ? {
                            idPaciente: pac.id_paciente,
                            etiquetaPrincipalActiva: pac.etiqueta_activa,
                            apellido: pac.apellido,
                            nombres: pac.nombres,
                            dni: pac.dni,
                            fechaNacimiento: pac.fecha_nacimiento,
                            direccion: pac.direccion,
                            obraSocial: pac.obra_social,
                            nroAfiliado: pac.nro_afiliado,
                            telefono: pac.telefono,
                            email: pac.email,
                            cirujanoAsignado: pac.cirujano_asignado_email,
                            nutricionistaAsignado: pac.nutricionista_asignado_email,
                            psicologoAsignado: pac.psicologo_asignado_email,
                            fechaCirugia: pac.fecha_cirugia
                        } : undefined,
                        metadata: `Último estado: ${c.estado_tracking}`
                    });
                }
            }
        });

        // 5. Pacientes inactivos por etiqueta (MEDIA)
        // Group count of inactive patients by their stage tag
        const inactiveCounts: Record<string, number> = {};
        stats.rawPacientes.forEach((pac: any) => {
            if (calculateStatusLocal(pac) === ContactoStatus.INACTIVO) {
                const tag = pac.etiqueta_activa || 'NUEVO_INGRESO';
                inactiveCounts[tag] = (inactiveCounts[tag] || 0) + 1;
            }
        });
        Object.entries(inactiveCounts).forEach(([tag, count]) => {
            medias.push({
                titulo: `Inactividad en etapa: ${tag.replace(/_/g, ' ')}`,
                desc: `Hay ${count} pacientes inactivos estancados en esta etapa clínica.`,
                metadata: 'Se recomienda revisión comercial y recontacto'
            });
        });

        // 6. Turnos sin confirmar (BAJA)
        const unconfirmedCount = stats.rawTurnos.filter((t: any) => {
            return t.fecha_turno.split('T')[0] === mañanaStr && t.estado === 'AGENDADO';
        }).length;
        if (unconfirmedCount > 0) {
            bajas.push({
                titulo: 'Turnos sin Confirmar para Mañana',
                desc: `Hay ${unconfirmedCount} turnos programados para mañana que aún no han sido confirmados.`,
                metadata: 'Requiere envío de recordatorios de WhatsApp'
            });
        }

        return { altas, medias, bajas };
    }, [stats, calculateStatusLocal]);

    // Tab mapping helper
    const renderActiveTab = () => {
        if (!stats) return null;

        switch (activeTab) {
            case 'resumen':
                return (
                    <div className="space-y-6">
                        <h3 className="text-base font-bold text-slate-800 border-b pb-2">Resumen Ejecutivo</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* KPI 1 */}
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 border border-indigo-150 p-5 rounded-2xl shadow-sm hover:shadow transition-shadow">
                                <div className="flex justify-between items-start">
                                    <span className="text-3xl">📅</span>
                                    <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Últimos 7 días</span>
                                </div>
                                <p className="text-4xl font-extrabold text-indigo-950 mt-3">{resumenKPIs.consultasSemana}</p>
                                <p className="text-sm font-semibold text-indigo-900 mt-1">Consultas de la semana</p>
                                <p className="text-xs text-indigo-500 mt-1">Consultas realizadas por el equipo.</p>
                            </div>

                            {/* KPI 2 */}
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100/30 border border-purple-150 p-5 rounded-2xl shadow-sm hover:shadow transition-shadow">
                                <div className="flex justify-between items-start">
                                    <span className="text-3xl">👥</span>
                                    <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Últimos 7 días</span>
                                </div>
                                <p className="text-4xl font-extrabold text-purple-950 mt-3">{resumenKPIs.prospectosSemana}</p>
                                <p className="text-sm font-semibold text-purple-900 mt-1">Prospectos nuevos</p>
                                <p className="text-xs text-purple-500 mt-1">Nuevos contactos ingresados al embudo.</p>
                            </div>

                            {/* KPI 3 */}
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 border border-emerald-150 p-5 rounded-2xl shadow-sm hover:shadow transition-shadow">
                                <div className="flex justify-between items-start">
                                    <span className="text-3xl">🤝</span>
                                    <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Últimos 7 días</span>
                                </div>
                                <p className="text-4xl font-extrabold text-emerald-950 mt-3">{resumenKPIs.conversionesSemana}</p>
                                <p className="text-sm font-semibold text-emerald-900 mt-1">Conversiones de la semana</p>
                                <p className="text-xs text-emerald-500 mt-1">Prospectos convertidos a ficha médica.</p>
                            </div>

                            {/* KPI 4 */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 border border-blue-150 p-5 rounded-2xl shadow-sm hover:shadow transition-shadow">
                                <div className="flex justify-between items-start">
                                    <span className="text-3xl">🏥</span>
                                    <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Mes en curso</span>
                                </div>
                                <p className="text-4xl font-extrabold text-blue-950 mt-3">{resumenKPIs.cirugiasMes}</p>
                                <p className="text-sm font-semibold text-blue-900 mt-1">Cirugías del mes</p>
                                <p className="text-xs text-blue-500 mt-1">Bariátricas realizadas efectivamente.</p>
                            </div>

                            {/* KPI 5 */}
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 border border-amber-150 p-5 rounded-2xl shadow-sm hover:shadow transition-shadow">
                                <div className="flex justify-between items-start">
                                    <span className="text-3xl">⏳</span>
                                    <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Tiempo Real</span>
                                </div>
                                <p className="text-4xl font-extrabold text-amber-950 mt-3">{resumenKPIs.pacientesInactivos}</p>
                                <p className="text-sm font-semibold text-amber-900 mt-1">Pacientes inactivos</p>
                                <p className="text-xs text-amber-500 mt-1">Sin turnos ni consultas en su ventana pautada.</p>
                            </div>

                            {/* KPI 6 */}
                            <div className="bg-gradient-to-br from-red-50 to-red-100/30 border border-red-150 p-5 rounded-2xl shadow-sm hover:shadow transition-shadow">
                                <div className="flex justify-between items-start">
                                    <span className="text-3xl">📂</span>
                                    <span className="text-[10px] uppercase font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Tiempo Real</span>
                                </div>
                                <p className="text-4xl font-extrabold text-red-950 mt-3">{resumenKPIs.carpetasAtencion}</p>
                                <p className="text-sm font-semibold text-red-900 mt-1">Carpetas estancadas</p>
                                <p className="text-xs text-red-500 mt-1">Trámites demorados hace más de 30 días.</p>
                            </div>
                        </div>
                    </div>
                );

            case 'embudo':
                return (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border p-5">
                            <h3 className="text-base font-bold text-slate-800 mb-4">Embudo Principal (Mes en Curso)</h3>
                            <div className="space-y-3 max-w-xl mx-auto">
                                {funnelStages.map((stage, idx) => (
                                    <div key={stage.name} className="relative">
                                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border rounded-xl hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                                <span className="text-sm font-medium text-slate-700">{stage.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-base font-bold text-slate-900">{stage.value}</span>
                                                {idx > 0 && <span className="text-xs text-emerald-600 font-semibold ml-2">({stage.percentOfPrev}%)</span>}
                                            </div>
                                        </div>
                                        {idx < funnelStages.length - 1 && (
                                            <div className="flex justify-center my-0.5">
                                                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border p-5">
                            <h3 className="text-base font-bold text-slate-800 mb-4">Tiempos Promedio de Transición</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { label: 'Prospecto a Nuevo Ingreso', days: transitionTimes.propToNew, desc: 'Días desde el contacto comercial hasta agendar turno.' },
                                    { label: 'Ingreso a Pre-Bariátrico Inicial', days: transitionTimes.newToPre, desc: 'Días promedio en iniciar nutrición o psicología.' },
                                    { label: 'Presentada a Autorizada (OS)', days: transitionTimes.folderToAuth, desc: 'Días que demora la obra social/prepaga en auditar.' },
                                    { label: 'Definir Cirugía a Quirófano', days: transitionTimes.defToPeri, desc: 'Días entre estar apto y la cirugía real.' }
                                ].map((item) => (
                                    <div key={item.label} className="p-4 bg-slate-50 rounded-xl border flex justify-between items-center">
                                        <div>
                                            <h4 className="font-semibold text-sm text-slate-700">{item.label}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                                        </div>
                                        <div className="text-right whitespace-nowrap ml-4">
                                            <span className="text-2xl font-black text-indigo-700">{item.days}</span>
                                            <span className="text-xs font-semibold text-indigo-500 ml-0.5">días</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'profesionales':
                return (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border p-5 overflow-x-auto">
                            <h3 className="text-base font-bold text-slate-800 mb-4">Consultas y Actividad</h3>
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-slate-400 border-b text-left">
                                        <th className="pb-2">Profesional</th>
                                        <th className="pb-2">Especialidad</th>
                                        <th className="pb-2 text-right">Agendados</th>
                                        <th className="pb-2 text-right">Realizados</th>
                                        <th className="pb-2 text-right">Ausentismo</th>
                                        <th className="pb-2 text-right">Activos Asignados</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profProduction.map((p) => {
                                        const absPct = p.agendados ? Math.round(((p.agendados - p.realizados) / p.agendados) * 100) : 0;
                                        return (
                                            <tr key={p.email} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                <td className="py-2.5 font-medium text-slate-800">{p.nombre}</td>
                                                <td className="py-2.5 text-slate-600">{p.especialidad}</td>
                                                <td className="py-2.5 text-right font-medium">{p.agendados}</td>
                                                <td className="py-2.5 text-right font-semibold text-green-700">{p.realizados}</td>
                                                <td className="py-2.5 text-right text-amber-600 font-semibold">{absPct}%</td>
                                                <td className="py-2.5 text-right text-slate-700 font-medium">{p.activosAsignados} pac.</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-white rounded-xl border p-5 overflow-x-auto">
                            <h3 className="text-base font-bold text-slate-800 mb-4">Ingresos por Consultas</h3>
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-slate-400 border-b text-left">
                                        <th className="pb-2">Profesional</th>
                                        <th className="pb-2 text-right">Facturado Hoy</th>
                                        <th className="pb-2 text-right">Efectivo (Mes)</th>
                                        <th className="pb-2 text-right">Transf. (Mes)</th>
                                        <th className="pb-2 text-right">Tarjeta (Mes)</th>
                                        <th className="pb-2 text-right">Total (Período)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profProduction.map((p) => (
                                        <tr key={p.email} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="py-2.5 font-medium text-slate-800">{p.nombre}</td>
                                            <td className="py-2.5 text-right font-semibold text-slate-900">${p.totalRecaudadoHoy.toLocaleString('es-AR')}</td>
                                            <td className="py-2.5 text-right text-green-700">${p.efectivo.toLocaleString('es-AR')}</td>
                                            <td className="py-2.5 text-right text-amber-700">${p.transferencia.toLocaleString('es-AR')}</td>
                                            <td className="py-2.5 text-right text-purple-700">${p.tarjeta.toLocaleString('es-AR')}</td>
                                            <td className="py-2.5 text-right font-bold text-indigo-700">${p.totalRecaudadoPeriodo.toLocaleString('es-AR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'cirugias':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-slate-50 border p-4 rounded-xl text-center">
                                <p className="text-3xl font-black text-indigo-950">{cirugiasReporte.bariatricasMes}</p>
                                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase">Bariátricas del Mes</p>
                            </div>
                            <div className="bg-slate-50 border p-4 rounded-xl text-center">
                                <p className="text-3xl font-black text-indigo-950">{cirugiasReporte.bariatricasAno}</p>
                                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase">Bariátricas del Año</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Vs anterior: {cirugiasReporte.bariatricasPrevAno} cirugías</p>
                            </div>
                            <div className="bg-slate-50 border p-4 rounded-xl text-center">
                                <p className="text-3xl font-black text-indigo-950">{cirugiasReporte.generalMes}</p>
                                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase">Cirugías Generales (Mes)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl border p-5">
                                <h3 className="text-base font-bold text-slate-800 mb-4">Cirugías por Cirujano</h3>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-slate-400 border-b text-left">
                                            <th className="pb-2">Cirujano</th>
                                            <th className="pb-2 text-right">Mes actual</th>
                                            <th className="pb-2 text-right">Año actual</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cirugiasReporte.porCirujano.map((p: any) => (
                                            <tr key={p.nombre} className="border-b border-slate-50">
                                                <td className="py-2 font-medium text-slate-700">{p.nombre}</td>
                                                <td className="py-2 text-right font-bold text-slate-900">{p.mes}</td>
                                                <td className="py-2 text-right text-indigo-600 font-semibold">{p.ano}</td>
                                            </tr>
                                        ))}
                                        {cirugiasReporte.porCirujano.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="py-4 text-center text-slate-400">Sin cirugías registradas en este período.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-white rounded-xl border p-5">
                                <h3 className="text-base font-bold text-slate-800 mb-4">Cobertura de Cirugías</h3>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-slate-400 border-b text-left">
                                            <th className="pb-2">Obra Social / Cobertura</th>
                                            <th className="pb-2 text-right">Cantidad de Cirugías</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cirugiasReporte.coberturaDist.map((c: any) => (
                                            <tr key={c.cobertura} className="border-b border-slate-50">
                                                <td className="py-2 font-medium text-slate-700">{c.cobertura}</td>
                                                <td className="py-2 text-right font-bold text-slate-900">{c.count}</td>
                                            </tr>
                                        ))}
                                        {cirugiasReporte.coberturaDist.length === 0 && (
                                            <tr>
                                                <td colSpan={2} className="py-4 text-center text-slate-400">Sin datos de cobertura para cirugías este período.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'alertas':
                return (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border p-5">
                            <h3 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">Semáforo de Gestión y Alertas</h3>
                            
                            <div className="space-y-4">
                                {/* Altas (Rojo) */}
                                <div>
                                    <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                                        Urgencia Alta
                                    </h4>
                                    <div className="space-y-2">
                                        {alertasOperativas.altas.map((a: any, idx: number) => (
                                            <div key={idx} className="p-3.5 bg-red-50 border border-red-150 rounded-xl flex flex-wrap justify-between items-start gap-2 shadow-sm">
                                                <div>
                                                    <p className="font-bold text-red-950 text-sm">{a.titulo}</p>
                                                    <p className="text-xs text-red-800 mt-0.5">{a.desc}</p>
                                                    <p className="text-[10px] text-red-600 font-semibold mt-1">{a.metadata}</p>
                                                </div>
                                                {a.paciente && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { onClose(); onSelectPatient(a.paciente); }} className="text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg border border-red-200 transition-colors">
                                                            Abrir Ficha
                                                        </button>
                                                        {a.paciente.telefono && (
                                                            <a 
                                                                href={`https://wa.me/${a.paciente.telefono.replace(/[^\d]/g, '')}`} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow transition-colors"
                                                            >
                                                                WhatsApp
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {alertasOperativas.altas.length === 0 && (
                                            <p className="text-xs text-slate-400 italic">No hay alertas de alta prioridad activas.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Medias (Amarillo) */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                        Urgencia Media
                                    </h4>
                                    <div className="space-y-2">
                                        {alertasOperativas.medias.map((a: any, idx: number) => (
                                            <div key={idx} className="p-3.5 bg-amber-50 border border-amber-150 rounded-xl flex flex-wrap justify-between items-start gap-2">
                                                <div>
                                                    <p className="font-bold text-amber-950 text-sm">{a.titulo}</p>
                                                    <p className="text-xs text-amber-800 mt-0.5">{a.desc}</p>
                                                    <p className="text-[10px] text-amber-600 font-semibold mt-1">{a.metadata}</p>
                                                </div>
                                                {a.paciente && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { onClose(); onSelectPatient(a.paciente); }} className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors">
                                                            Abrir Ficha
                                                        </button>
                                                        {a.paciente.telefono && (
                                                            <a 
                                                                href={`https://wa.me/${a.paciente.telefono.replace(/[^\d]/g, '')}`} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow transition-colors"
                                                            >
                                                                WhatsApp
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {alertasOperativas.medias.length === 0 && (
                                            <p className="text-xs text-slate-400 italic">No hay alertas de media prioridad activas.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Bajas (Azul) */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                        Urgencia Baja
                                    </h4>
                                    <div className="space-y-2">
                                        {alertasOperativas.bajas.map((a: any, idx: number) => (
                                            <div key={idx} className="p-3.5 bg-blue-50 border border-blue-150 rounded-xl">
                                                <p className="font-bold text-blue-950 text-sm">{a.titulo}</p>
                                                <p className="text-xs text-blue-800 mt-0.5">{a.desc}</p>
                                                <p className="text-[10px] text-blue-600 font-semibold mt-1">{a.metadata}</p>
                                            </div>
                                        ))}
                                        {alertasOperativas.bajas.length === 0 && (
                                            <p className="text-xs text-slate-400 italic">No hay alertas de baja prioridad activas.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-indigo-700 to-indigo-600 text-white">
                    <div>
                        <h2 className="text-lg font-bold">Estadísticas y Control de Gestión</h2>
                        <p className="text-xs text-indigo-200 mt-0.5">Indicadores comerciales, clínicos y alertas operativas</p>
                    </div>
                    <button onClick={onClose} className="text-indigo-200 hover:text-white text-2xl leading-none transition-colors">&times;</button>
                </div>

                {/* Filtros de período */}
                <div className="px-6 py-3 bg-slate-50 border-b flex flex-wrap gap-4 items-center justify-between no-print">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-600 uppercase">Mes:</label>
                            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value === 'todos' ? 'todos' : parseInt(e.target.value, 10))} className="rounded-md border-slate-350 text-xs p-1 text-slate-700 bg-white">
                                <option value="todos">Todos los meses</option>
                                {meses.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-600 uppercase">Año:</label>
                            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value === 'todos' ? 'todos' : parseInt(e.target.value, 10))} className="rounded-md border-slate-350 text-xs p-1 text-slate-700 bg-white">
                                <option value="todos">Todos los años</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 bg-slate-50 border-b flex space-x-1 no-print">
                    {[
                        { id: 'resumen', label: 'Resumen Ejecutivo' },
                        { id: 'embudo', label: 'Embudo & Conversión' },
                        { id: 'profesionales', label: 'Actividad del Equipo' },
                        { id: 'cirugias', label: 'Reporte de Cirugías' },
                        { id: 'alertas', label: 'Alertas & Semáforo' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 ${activeTab === tab.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Contenido principal */}
                <div className="flex-grow overflow-y-auto p-6 bg-slate-50/50">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <span className="animate-spin text-3xl mb-3">⏳</span>
                            <p className="text-sm font-semibold">Cargando tablero de control...</p>
                        </div>
                    )}
                    {error && <div className="text-center py-12 text-red-500 font-semibold">{error}</div>}
                    
                    {!isLoading && !error && stats && renderActiveTab()}
                </div>

                <div className="p-4 bg-slate-50 border-t flex justify-end space-x-3 no-print">
                    <button onClick={() => window.print()} className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border rounded-lg hover:bg-slate-50 shadow-sm transition-all">Imprimir Reporte</button>
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow transition-all">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

// ─── BACKUP BUTTON ────────────────────────────────────────────────────────────

const BackupButton = () => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const backup = await (api as any).exportBackup();
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `plenus_backup_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e: any) {
            alert('Error al generar el backup: ' + (e.message || 'Error desconocido'));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-2 rounded-md shadow-sm border border-emerald-200 hover:bg-emerald-100 disabled:opacity-60"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {isExporting ? 'Exportando...' : 'Backup'}
        </button>
    );
};

// ─── CRM DASHBOARD ────────────────────────────────────────────────────────────

// [FIX 1] Added 'turn-history' to modal type union
type CrmActiveView = 'prospects' | 'not-operated' | 'operated' | 'general-surgery' | 'individual-treatment' | 'tasks' | 'folders' | 'history';
type ActiveModalType = 'whatsapp' | 'whatsapp-templates' | 'email' | 'tasks' | 'history' | 'turn-history' | 'folder' | 'folders-dashboard' | 'settings' | 'schedule-surgery' | 'surgery-details' | 'lost' | 'new-prospect' | 'new-patient' | 'convert-prospect' | 'estadisticas' | null;

interface CrmDashboardProps {
    onSelectPatient: (patient: PacienteFiliatorio) => void;
    selectedPatient: PacienteFiliatorio | null;
}

const getContactoCalculatedStatus = (contacto: ContactoCRM, inactivityThresholdDays: number = 30): ContactoStatus => {
    if (contacto.lostReason) return ContactoStatus.PERDIDO;
    if (!contacto.isPatient) return ContactoStatus.ACTIVO;

    let thresholdDays = inactivityThresholdDays;
    if (contacto.tag === ContactoTag.POSBARIATRICO && contacto.surgeryDate) {
        const stage = getPostOpStage(contacto.surgeryDate);
        if (stage === PostOpStage.INMEDIATO) {
            thresholdDays = 10;
        } else if (stage === PostOpStage.RECIENTE) {
            thresholdDays = 30;
        } else if (stage === PostOpStage.MEDIATO) {
            thresholdDays = 90;
        } else if (stage === PostOpStage.ALEJADO) {
            thresholdDays = 365;
        }
    }

    const now = new Date();
    const thresholdDate = subDays(now, thresholdDays);
    if (contacto.nextConsultation?.date && isAfter(new Date(contacto.nextConsultation.date.replace(/-/g, '/')), now)) return ContactoStatus.ACTIVO;
    if (contacto.lastConsultationDate && isAfter(new Date(contacto.lastConsultationDate.replace(/-/g, '/')), thresholdDate)) return ContactoStatus.ACTIVO;
    return ContactoStatus.INACTIVO;
};

export function CrmDashboard({ onSelectPatient, selectedPatient }: CrmDashboardProps) {
    const authContext = useContext(AuthContext);
    const user = authContext!.user!;
    const [activeView, setActiveView] = useState<CrmActiveView>('not-operated');
    const [contactos, setContactos] = useState<ContactoCRM[]>([]);
    const [history, setHistory] = useState<CrmHistoryEntry[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [professionals, setProfessionals] = useState<CrmSimpleProfessionals>({ surgeons: [], nutritionists: [], psychologists: [], todos: [] });
    const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'todos' | ContactoStatus>('todos');
    const [tagFilter, setTagFilter] = useState<'todos' | ContactoTag>('todos');
    const [taskStatusFilter, setTaskStatusFilter] = useState<'todos' | TaskStatus>(TaskStatus.PENDIENTE);
    const [seguimientoFilter, setSeguimientoFilter] = useState<'todos' | ProspectoEstadoSeguimiento>('todos');
    const [postOpStageFilter, setPostOpStageFilter] = useState<'todos' | PostOpStage>('todos');
    const [socialInsuranceFilter, setSocialInsuranceFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string>('todos');
    const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
    const [selectedContacto, setSelectedContacto] = useState<ContactoCRM | null>(null);
    const contactRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
    const [convertedContacto, setConvertedContacto] = useState<ContactoCRM | null>(null);
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [contactosData, historyData, tasksData, foldersData, professionalsData, templatesData] = await Promise.all([
                api.getContactosCRM(),
                api.getCrmHistory(),
                api.getTasks(),
                api.getFolders(),
                api.getCrmSimpleProfessionals(),
                api.getMessageTemplates(),
            ]);
            setContactos(contactosData);
            setHistory(historyData);
            setTasks(tasksData);
            setFolders(foldersData);
            setProfessionals(professionalsData);
            setMessageTemplates(templatesData);
        } catch (error) {
            console.error("Error fetching CRM data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (selectedPatient && contactos.length > 0) {
            const contact = contactos.find(c => c.id === selectedPatient.idPaciente);
            if (contact) {
                const targetView = contact.tag === ContactoTag.POSBARIATRICO ? 'operated' : 'not-operated';
                setActiveView(targetView);
                setTimeout(() => { contactRowRefs.current[contact.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
            }
        }
    }, [selectedPatient, contactos]);

    const handleMarkAsLost = async (patientId: string, reason: LostReason) => {
        try {
            const contact = contactos.find(c => c.id === patientId);
            const updates: Partial<ContactoCRM> = { lostReason: reason, lostTimestamp: new Date().toISOString() };
            if (contact && !contact.isPatient) updates.estadoSeguimiento = ProspectoEstadoSeguimiento.DESCARTADO;
            await api.updateContactoCRM(patientId, updates);
            setActiveModal(null);
            fetchData();
        } catch (error) {
            console.error("Failed to mark contact as lost:", error);
            alert("Hubo un error al actualizar el contacto.");
        }
    };

    const handleReactivate = (contacto: ContactoCRM) => {
        if (window.confirm(`¿Está seguro que desea reactivar a ${contacto.firstName} ${contacto.lastName}?`)) {
            const updates: Partial<ContactoCRM> = { lostReason: null, lostTimestamp: null };
            if (!contacto.isPatient) updates.estadoSeguimiento = ProspectoEstadoSeguimiento.CONTACTADO;
            api.updateContactoCRM(contacto.id, updates).then(() => fetchData()).catch(() => alert("Hubo un error al reactivar el contacto."));
        }
    };

    const handleOpenModal = (modal: ActiveModalType, contacto?: ContactoCRM) => {
        setSelectedContacto(contacto || null);
        setActiveModal(modal);
    };

    const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
        const updatedTask = await api.updateTask(id, updates);
        setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    };

    const handleAddTask = async (task: Task) => {
        const newTask = await api.addTask(task);
        setTasks(prev => [newTask, ...prev]);
    };

    const handleSaveProfessionals = async (p: CrmSimpleProfessionals) => {
        const updated = await api.updateCrmSimpleProfessionals(p);
        setProfessionals(updated);
    };

    const handleSaveTemplates = async (t: MessageTemplate[]) => {
        const updated = await api.updateMessageTemplates(t);
        setMessageTemplates(updated);
    };

    const handleSaveFolders = async (folder: Folder) => {
        const savedFolder = await api.updateFolder(folder);
        setFolders(prev => {
            const index = prev.findIndex(f => f.id === savedFolder.id);
            if (index > -1) { const nf = [...prev]; nf[index] = savedFolder; return nf; }
            return [...prev, savedFolder];
        });
        if (savedFolder.trackingState === FolderTrackingStatus.ENTREGADA_AL_PACIENTE) updatePacienteTag(folder.patientId, ContactoTag.CARPETA_ENTREGADA);
        if (savedFolder.scheduledSurgeryDate) updatePacienteTag(folder.patientId, ContactoTag.PERIOPERATORIO);
    };

    const updatePacienteTag = async (idPaciente: string, newTag: ContactoTag) => {
        const contactIndex = contactos.findIndex(c => c.id === idPaciente);
        if (contactIndex === -1) return;
        const originalContactos = [...contactos];
        const updatedContactos = [...contactos];
        updatedContactos[contactIndex].tag = newTag;
        setContactos(updatedContactos);
        try { await api.updatePacienteTag(idPaciente, newTag, UserRole.ADMINISTRATIVO); fetchData(); }
        catch { setContactos(originalContactos); }
    };

    const handleUpdateContacto = useCallback(async (id: string, updates: Partial<ContactoCRM>) => {
        try {
            await api.updateContactoCRM(id, updates);
            // Refresh from DB to show the saved value
            fetchData();
        } catch (error) {
            console.error('[CRM] updateContactoCRM failed:', error);
        }
    }, [fetchData]);

    const uniqueObrasSociales = Array.from(new Set(
        contactos.filter(c => c.isPatient && c.socialInsurance).map(c => c.socialInsurance)
    )).sort() as string[];

    const filteredContactos = contactos.filter(c => {
        const searchLower = searchTerm.trim().toLowerCase();
        const contactName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
        
        const isNumeric = /^\d+$/.test(searchLower);
        const isPrefixedId = /^p-\d+$/.test(searchLower);
        let matchesSearch = false;

        if (isNumeric || isPrefixedId) {
            const numericStr = isNumeric ? searchLower : searchLower.substring(2);
            const searchNum = parseInt(numericStr, 10);
            const exactId = `p-${numericStr}`;
            
            const hasExactMatch = contactos.some(other => 
                other.isPatient && 
                (other.nroHc === searchNum || other.id.toLowerCase() === exactId)
            );

            if (hasExactMatch) {
                matchesSearch = c.isPatient && (c.nroHc === searchNum || c.id.toLowerCase() === exactId);
            } else {
                matchesSearch = contactName.includes(searchLower) || 
                                (c.dni && c.dni.includes(searchLower)) || 
                                (c.phone && c.phone.includes(searchLower)) ||
                                c.id.toLowerCase().includes(searchLower) ||
                                (c.nroHc && String(c.nroHc).includes(searchLower));
            }
        } else {
            matchesSearch = contactName.includes(searchLower) || 
                            (c.dni && c.dni.includes(searchLower)) || 
                            (c.phone && c.phone.includes(searchLower)) ||
                            c.id.toLowerCase().includes(searchLower) ||
                            (c.nroHc && String(c.nroHc).includes(searchLower));
        }
        const calculatedStatus = getContactoCalculatedStatus(c);
        const matchesStatus = statusFilter === 'todos' || calculatedStatus === statusFilter;
        const matchesTag = tagFilter === 'todos' || c.tag === tagFilter;
        const matchesSeguimiento = seguimientoFilter === 'todos' || c.estadoSeguimiento === seguimientoFilter;
        const matchesPostOpStage = postOpStageFilter === 'todos' || getPostOpStage(c.surgeryDate) === postOpStageFilter;
        const matchesOS = !socialInsuranceFilter || c.socialInsurance === socialInsuranceFilter;
        const matchesPriority = priorityFilter === 'todos' || c.priority === priorityFilter;

        if (activeView === 'prospects') return !c.isPatient && matchesSearch && matchesSeguimiento && matchesPriority;
        if (!matchesSearch) return false;
        if (!matchesPriority) return false;
        switch (activeView) {
            case 'not-operated':
                return c.isPatient && 
                       c.tag !== ContactoTag.POSBARIATRICO && 
                       c.tag !== ContactoTag.CIRUGIA_GENERAL && 
                       c.tag !== ContactoTag.TRATAMIENTO_INDIVIDUAL && 
                       matchesStatus && matchesTag && matchesOS;
            case 'operated':
                return c.isPatient && 
                       c.tag === ContactoTag.POSBARIATRICO && 
                       matchesStatus && matchesPostOpStage && matchesOS;
            case 'general-surgery':
                return c.isPatient && 
                       c.tag === ContactoTag.CIRUGIA_GENERAL && 
                       matchesStatus && matchesOS;
            case 'individual-treatment':
                return c.isPatient && 
                       c.tag === ContactoTag.TRATAMIENTO_INDIVIDUAL && 
                       matchesStatus && matchesOS;
            default:
                return true;
        }
    });

    const filteredTasks = tasks.filter(task => {
        const matchesStatus = taskStatusFilter === 'todos' || task.status === taskStatusFilter;
        const matchesSearch = !searchTerm || 
            task.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
            task.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (task.assigneeEmail && task.assigneeEmail.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 50;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, tagFilter, taskStatusFilter, seguimientoFilter, postOpStageFilter, socialInsuranceFilter, priorityFilter, activeView]);

    const paginatedContactos = useMemo(() => {
        return filteredContactos.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    }, [filteredContactos, currentPage]);

    const totalPages = Math.ceil(filteredContactos.length / PAGE_SIZE);

    // [FIX 5b] Per-contact filtered history
    const filteredHistory = selectedContacto
        ? history.filter(h => h.patientId === selectedContacto.id)
        : history;

    const NavButton = ({ view, label, icon }: { view: CrmActiveView, label: string, icon: React.ReactNode }) => (
        <button 
            onClick={() => setActiveView(view)} 
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                activeView === view 
                    ? 'bg-sky-600 text-white shadow-sm' 
                    : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="space-y-6">
            {/* Modals */}
            {activeModal === 'whatsapp' && <WhatsAppModal onClose={() => setActiveModal(null)} patient={selectedContacto} templates={messageTemplates} />}
            {activeModal === 'whatsapp-templates' && <WhatsAppTemplatesModal onClose={() => setActiveModal(null)} currentTemplates={messageTemplates} onSave={handleSaveTemplates} />}
            {activeModal === 'email' && <EmailModal onClose={() => setActiveModal(null)} />}
            {activeModal === 'tasks' && <TasksModal onClose={() => setActiveModal(null)} patient={selectedContacto} tasks={tasks} onUpdate={handleUpdateTask} onAdd={handleAddTask} profesionales={professionals.todos} />}
            {/* [FIX 5b] History modal now filtered by selected contact */}
            {activeModal === 'history' && (
                <HistoryModal
                    onClose={() => setActiveModal(null)}
                    history={filteredHistory}
                    patientName={selectedContacto ? `${selectedContacto.lastName}, ${selectedContacto.firstName}` : undefined}
                />
            )}
            {/* [FIX 4] Turn history modal */}
            {activeModal === 'turn-history' && <TurnHistoryModal onClose={() => setActiveModal(null)} contacto={selectedContacto} />}
            {activeModal === 'folder' && selectedContacto && <FolderModal patient={selectedContacto} folder={folders.find(f => f.patientId === selectedContacto.id) || null} professionals={professionals} onSave={handleSaveFolders} onClose={() => setActiveModal(null)} />}

            {activeModal === 'settings' && <SettingsCrmModal onClose={() => setActiveModal(null)} professionals={professionals} templates={messageTemplates} onSaveProfessionals={handleSaveProfessionals} onSaveTemplates={handleSaveTemplates} />}
            {activeModal === 'schedule-surgery' && <ScheduleSurgeryModal onClose={() => setActiveModal(null)} patient={selectedContacto} onSchedule={() => {}} />}
            {activeModal === 'surgery-details' && <SurgeryDetailsModal onClose={() => setActiveModal(null)} patient={selectedContacto} />}
            {activeModal === 'lost' && <MarkAsLostModal onClose={() => setActiveModal(null)} patient={selectedContacto} onConfirm={handleMarkAsLost} />}
            {activeModal === 'new-prospect' && <NewProspectModal onClose={() => setActiveModal(null)} onSuccess={() => { fetchData(); setActiveModal(null); }} />}
            {activeModal === 'new-patient' && <NewPatientModal onClose={() => setActiveModal(null)} onSuccess={() => { fetchData(); setActiveModal(null); setActiveView('not-operated'); }} />}
            {activeModal === 'estadisticas' && <EstadisticasModal onClose={() => setActiveModal(null)} onSelectPatient={onSelectPatient} />}
            {activeModal === 'convert-prospect' && selectedContacto && (
    <NewPatientModal
        onClose={() => setActiveModal(null)}
        onSuccess={async () => {
            await fetchData();
            setActiveModal(null);
            setActiveView('not-operated');
            // Guardamos el contacto para el modal post-conversión
            setConvertedContacto(selectedContacto);
            try {
                const userEmail = authContext?.user?.email ?? '';
                const paciente = await api.getPacienteCompleto(selectedContacto.id, userEmail);
                onSelectPatient(paciente.filiatorio);
            } catch {
                // Si el ID cambió tras conversión, igual cambiamos la vista
            }
        }}
        initialData={{
            apellido: selectedContacto.lastName,
            nombres: selectedContacto.firstName,
            telefono: selectedContacto.phone,
            email: selectedContacto.email,
        }}
        prospectoId={selectedContacto.id}
    />
    
)}
{convertedContacto && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Paciente creado con éxito</h2>
                    <p className="text-sm text-slate-500">
                        {convertedContacto.lastName}, {convertedContacto.firstName}
                    </p>
                </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 mb-5">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                    </svg>
                    Turno pendiente
                </p>
                <p>
                    Este paciente aún no tiene turno asignado. Para agendarlo, andá a la sección{' '}
                    <strong>Agenda</strong> y buscá su nombre, o hacé clic en su ficha y agendá desde ahí.
                </p>
            </div>

            <div className="flex justify-end gap-3">
                <button
                    onClick={() => setConvertedContacto(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
                >
                    Entendido
                </button>
            </div>
        </div>
    </div>
)}

            <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center border-b border-slate-200 pb-5">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight sm:text-3xl">Panel Principal</h2>
                    <p className="text-xs text-slate-500 mt-1 sm:text-sm">Gestión de prospectos, pacientes y seguimiento de tratamientos.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
                    <button onClick={() => setActiveModal('new-prospect')} className="flex items-center text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors px-3 py-2 rounded-lg shadow-sm"><UserPlusIcon className="w-4 h-4 mr-1.5" />Ingresar Prospecto</button>
                    <button onClick={() => setActiveModal('new-patient')} className="flex items-center text-xs sm:text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors px-3 py-2 rounded-lg shadow-sm"><UserPlusIcon className="w-4 h-4 mr-1.5" />Agregar Paciente</button>
                    <button onClick={() => { setSelectedContacto(null); setActiveModal('history'); }} className="flex items-center text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors px-3 py-2 rounded-lg shadow-sm"><HistoryIcon />Historial Global</button>
                    <button onClick={() => setActiveModal('whatsapp-templates')} className="flex items-center text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors px-3 py-2 rounded-lg shadow-sm"><ClipboardCheckIcon />Plantillas</button>
                    {(user.rol === UserRole.SUPERADMIN || user.rol === UserRole.ADMINISTRATIVO) && (
                        <>
                            <button onClick={() => setActiveModal('estadisticas')} className="flex items-center text-xs sm:text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors px-3 py-2 rounded-lg shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
                                Estadísticas
                            </button>
                            <BackupButton />
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto whitespace-nowrap scrollbar-none w-full md:w-auto">
                            <NavButton view="prospects" label="Prospectos" icon={<UsersIcon />} />
                            <NavButton view="not-operated" label="No Operados" icon={<UsersIcon />} />
                            <NavButton view="operated" label="Operados" icon={<UsersIcon />} />
                            <NavButton view="general-surgery" label="Cirugía General" icon={<UsersIcon />} />
                            <NavButton view="individual-treatment" label="Tratamiento Individual" icon={<UsersIcon />} />
                            <NavButton view="tasks" label="Tareas" icon={<ClipboardCheckIcon />} />
                            <NavButton view="folders" label="Ver Carpetas" icon={<FolderIcon />} />
                        </div>
                    </div>

                    {['prospects', 'not-operated', 'operated', 'general-surgery', 'individual-treatment', 'folders', 'tasks'].includes(activeView) && (
                        <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-50/70 rounded-xl border border-slate-100">
                            {['prospects', 'not-operated', 'operated', 'general-surgery', 'individual-treatment', 'folders', 'tasks'].includes(activeView) && (
                                <div className="relative w-full sm:w-64">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></div>
                                    <input type="text" placeholder={activeView === 'tasks' ? "Buscar por descripción, paciente o asignado..." : "Buscar por nombre, DNI o tel..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full rounded-lg border-slate-300 pl-9 text-sm focus:border-sky-500 focus:ring-sky-500 bg-white" />
                                </div>
                            )}

                            <span className="text-xs font-semibold text-slate-500 px-1">Filtros:</span>

                            {activeView === 'tasks' && (
                                <select value={taskStatusFilter} onChange={e => setTaskStatusFilter(e.target.value as any)} className="text-sm bg-white shadow-sm focus:ring-sky-500 focus:border-sky-500 rounded-md border-slate-300">
                                    <option value={TaskStatus.PENDIENTE}>Pendientes</option>
                                    <option value={TaskStatus.POSPUESTO}>Pospuestas</option>
                                    <option value={TaskStatus.HECHO}>Realizadas</option>
                                    <option value="todos">Todas las Tareas</option>
                                </select>
                            )}

                            {['prospects', 'not-operated', 'operated'].includes(activeView) && (
                                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="text-sm bg-white shadow-sm focus:ring-sky-500 focus:border-sky-500 rounded-md border-slate-300">
                                    <option value="todos">Todas las Prioridades</option>
                                    <option value={Priority.ALTA}>Alta</option>
                                    <option value={Priority.MEDIA}>Media</option>
                                    <option value={Priority.NORMAL}>Normal</option>
                                </select>
                            )}

                            {activeView === 'prospects' && (
                                <select value={seguimientoFilter} onChange={e => setSeguimientoFilter(e.target.value as any)} className="text-sm bg-white shadow-sm focus:ring-sky-500 focus:border-sky-500 rounded-md border-slate-300">
                                    <option value="todos">Todos los Estados</option>
                                    {Object.values(ProspectoEstadoSeguimiento).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            )}

                            {activeView === 'not-operated' && (
                                <select value={tagFilter} onChange={e => setTagFilter(e.target.value as any)} className="text-sm bg-white shadow-sm focus:ring-sky-500 focus:border-sky-500 rounded-md border-slate-300">
                                    <option value="todos">Todas las Etiquetas</option>
                                    {Object.values(ContactoTag).filter(t => t !== ContactoTag.POSBARIATRICO && t !== ContactoTag.CIRUGIA_GENERAL && t !== ContactoTag.TRATAMIENTO_INDIVIDUAL).map(tag => <option key={tag} value={tag}>{tag.replace(/_/g, ' ')}</option>)}
                                </select>
                            )}

                            {activeView === 'operated' && (
                                <select value={postOpStageFilter} onChange={e => setPostOpStageFilter(e.target.value as any)} className="text-sm bg-white shadow-sm focus:ring-sky-500 focus:border-sky-500 rounded-md border-slate-300">
                                    <option value="todos">Todas las Etapas</option>
                                    {Object.values(PostOpStage).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            )}

                            {['not-operated', 'operated', 'general-surgery', 'individual-treatment'].includes(activeView) && (
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="text-sm bg-white shadow-sm focus:ring-sky-500 focus:border-sky-500 rounded-md border-slate-300">
                                    <option value="todos">Todos los Estados</option>
                                    <option value={ContactoStatus.ACTIVO}>Activo</option>
                                    <option value={ContactoStatus.INACTIVO}>Inactivo</option>
                                    <option value={ContactoStatus.PERDIDO}>Perdido</option>
                                </select>
                            )}

                            {['not-operated', 'operated', 'general-surgery', 'individual-treatment'].includes(activeView) && (
                                <select value={socialInsuranceFilter} onChange={e => setSocialInsuranceFilter(e.target.value)} className="text-sm bg-white shadow-sm focus:ring-sky-500 focus:border-sky-500 rounded-md border-slate-300">
                                    <option value="">Todas las Obras Sociales</option>
                                    {uniqueObrasSociales.map(os => <option key={os} value={os}>{os}</option>)}
                                </select>
                            )}
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <p className="text-center p-8 text-slate-500">Cargando contactos...</p>
                ) : (
                    <div>
                        <div className="overflow-x-auto">
                            {activeView === 'prospects' && (
                                <ProspectoTable
                                    contactos={paginatedContactos}
                                    onOpenModal={handleOpenModal}
                                    onUpdateContacto={handleUpdateContacto}
                                    onReactivate={handleReactivate}
                                    onSelectPatient={onSelectPatient}
                                />
                            )}
                            {activeView === 'not-operated' && (
                                <ContactoTable 
                                    contactos={paginatedContactos} 
                                    onOpenModal={handleOpenModal} 
                                    onReactivate={handleReactivate} 
                                    onSelectPatient={onSelectPatient} 
                                    onUpdateContacto={handleUpdateContacto} 
                                    contactRowRefs={contactRowRefs} 
                                    selectedPatientId={selectedPatient?.idPaciente} 
                                    folders={folders} 
                                    tasks={tasks} 
                                />
                            )}
                            {activeView === 'operated' && (
                                <OperatedContactoTable 
                                    contactos={paginatedContactos} 
                                    onOpenModal={handleOpenModal} 
                                    onReactivate={handleReactivate} 
                                    onSelectPatient={onSelectPatient} 
                                    onUpdateContacto={handleUpdateContacto} 
                                    contactRowRefs={contactRowRefs} 
                                    selectedPatientId={selectedPatient?.idPaciente} 
                                    folders={folders} 
                                    tasks={tasks} 
                                />
                            )}
                            {activeView === 'general-surgery' && (
                                <GeneralSurgeryContactoTable 
                                    contactos={paginatedContactos} 
                                    onOpenModal={handleOpenModal} 
                                    onReactivate={handleReactivate} 
                                    onSelectPatient={onSelectPatient} 
                                    onUpdateContacto={handleUpdateContacto} 
                                    contactRowRefs={contactRowRefs} 
                                    selectedPatientId={selectedPatient?.idPaciente} 
                                    folders={folders} 
                                    tasks={tasks} 
                                />
                            )}
                            {activeView === 'individual-treatment' && (
                                <IndividualTreatmentContactoTable 
                                    contactos={paginatedContactos} 
                                    onOpenModal={handleOpenModal} 
                                    onReactivate={handleReactivate} 
                                    onSelectPatient={onSelectPatient} 
                                    onUpdateContacto={handleUpdateContacto} 
                                    contactRowRefs={contactRowRefs} 
                                    selectedPatientId={selectedPatient?.idPaciente} 
                                    folders={folders} 
                                    tasks={tasks}
                                    professionals={professionals.todos}
                                />
                            )}
                            {activeView === 'tasks' && <TasksView tasks={filteredTasks} onUpdateTask={handleUpdateTask} onSelectPatient={onSelectPatient} contactos={contactos} onOpenModal={handleOpenModal} />}
                            {activeView === 'folders' && (
                                <FoldersDashboardView 
                                    folders={folders} 
                                    contactos={contactos} 
                                    searchTerm={searchTerm}
                                    onOpenFolder={(patientId) => {
                                        const contacto = contactos.find(c => c.id === patientId);
                                        if (contacto) {
                                            setSelectedContacto(contacto);
                                            setActiveModal('folder');
                                        }
                                    }} 
                                    onSelectPatient={onSelectPatient}
                                />
                            )}
                        </div>
                        {['prospects', 'not-operated', 'operated', 'general-surgery', 'individual-treatment'].includes(activeView) && totalPages > 1 && (
                            <div className="flex justify-between items-center px-4 py-3 bg-white border-t border-slate-200 sm:px-6 mt-4">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">Anterior</button>
                                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50">Siguiente</button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-slate-700">
                                            Mostrando <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> a <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, filteredContactos.length)}</span> de <span className="font-medium">{filteredContactos.length}</span> contactos
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50">Primero</button>
                                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50">Anterior</button>
                                            <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-slate-50 text-sm font-medium text-slate-700">
                                                Página {currentPage} de {totalPages}
                                            </span>
                                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50">Siguiente</button>
                                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50">Último</button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── [FIX 1 + 5] ProspectoTable now receives onSelectPatient ─────────────────
const ProspectoTable = ({ contactos, onOpenModal, onUpdateContacto, onReactivate, onSelectPatient }: {
    contactos: ContactoCRM[];
    onOpenModal: (modal: ActiveModalType, contacto: ContactoCRM) => void;
    onUpdateContacto: (id: string, updates: Partial<ContactoCRM>) => void;
    onReactivate: (contacto: ContactoCRM) => void;
    onSelectPatient: (p: PacienteFiliatorio) => void;
}) => (
    <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
            <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contacto</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Canal de Origen</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha Ingreso</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado Seguimiento</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
            {contactos.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500 text-sm">No hay prospectos que coincidan con el filtro.</td></tr>
            ) : contactos.map(contacto => (
                <ProspectoRow key={contacto.id} contacto={contacto} onOpenModal={onOpenModal} onUpdateContacto={onUpdateContacto} onReactivate={onReactivate} onSelectPatient={onSelectPatient} />
            ))}
        </tbody>
    </table>
);

type ProspectoRowProps = {
    contacto: ContactoCRM;
    onOpenModal: (modal: ActiveModalType, contacto: ContactoCRM) => void;
    onUpdateContacto: (id: string, updates: Partial<ContactoCRM>) => void;
    onReactivate: (contacto: ContactoCRM) => void;
    onSelectPatient: (p: PacienteFiliatorio) => void;
};

const ProspectoRow: React.FC<ProspectoRowProps> = ({ contacto, onOpenModal, onUpdateContacto, onReactivate, onSelectPatient }) => {
    const authContext = useContext(AuthContext);
    const userEmail = authContext?.user?.email ?? '';
    const estadoInfo = ESTADOS_SEGUIMIENTO_LIST.find(e => e.value === contacto.estadoSeguimiento);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    const displayName = (contacto.lastName || contacto.firstName)
        ? `${contacto.lastName || '(Sin Apellido)'}, ${contacto.firstName || ''}`.trim()
        : contacto.phone || contacto.email || '(Sin Datos)';
    const contactInfo = (contacto.lastName || contacto.firstName) ? (contacto.phone || contacto.email) : '';

    const handleStatusChange = (newStatus: ProspectoEstadoSeguimiento) => {
        onUpdateContacto(contacto.id, { estadoSeguimiento: newStatus });
        setIsStatusDropdownOpen(false);
    };

    // [FIX 1] Open patient file for converted prospects
    const handleOpenFile = () => {
        api.getPacienteCompleto(contacto.id, userEmail)
            .then(p => onSelectPatient(p.filiatorio))
            .catch(() => alert('No se pudo abrir la ficha del paciente.'));
    };

    return (
        <tr className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-4 whitespace-nowrap">
    <div className="flex items-center gap-2">
        {contacto.isPatient ? (
            <button onClick={handleOpenFile} className="text-left hover:underline group">
                <div className="text-sm font-medium text-indigo-700 group-hover:text-indigo-900">{displayName}</div>
                <div className="text-sm text-slate-500">{contactInfo}</div>
            </button>
        ) : (
            <div>
                <div className="text-sm font-medium text-slate-900">{displayName}</div>
                <div className="text-sm text-slate-500">{contactInfo}</div>
            </div>
        )}
        {contacto.isPatient && (
            <span className="px-1.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded">Paciente</span>
        )}
    </div>
</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{contacto.canalOrigen || '-'}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{contacto.startDate}</td>
            <td className="px-4 py-4 whitespace-nowrap">
                {/* [FIX 5a] Dropdown with z-50 so it's never clipped */}
                <div className="relative inline-block text-left">
                    <button
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        onBlur={() => setTimeout(() => setIsStatusDropdownOpen(false), 150)}
                        disabled={!!contacto.lostReason}
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${estadoInfo?.color || 'bg-slate-100 text-slate-800'} flex items-center gap-1 disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                        {contacto.estadoSeguimiento || 'Sin estado'}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isStatusDropdownOpen && (
                        <div className="origin-top-left absolute left-0 mt-2 w-52 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                            <div className="py-1">
                                {ESTADOS_SEGUIMIENTO_LIST.map(est => (
                                    <button
                                        key={est.value}
                                        onClick={() => handleStatusChange(est.value)}
                                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${est.color.split(' ')[0]}`} />
                                        {est.value}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                {contacto.lostReason ? (
                    <button onClick={() => onReactivate(contacto)} title="Reactivar Prospecto" className="p-2.5 text-white bg-slate-500 rounded-full hover:opacity-80">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
                    </button>
                ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {/* [FIX 1] Show "Abrir Ficha" for converted prospects */}
                        {contacto.isPatient ? (
                            <button onClick={handleOpenFile} title="Abrir ficha del paciente" className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                                <ArrowTopRightOnSquareIcon />Abrir Ficha
                            </button>
                        ) : (
                            <button onClick={() => onOpenModal('convert-prospect', contacto)} className="px-2.5 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Convertir</button>
                        )}
                        <button onClick={() => onOpenModal('whatsapp', contacto)} title="Generar WhatsApp" className="p-2 text-white bg-green-500 rounded-full hover:opacity-80 transition-all flex items-center justify-center">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.115-2.905-6.99-1.876-1.875-4.353-2.904-6.992-2.905C6.009 1.846 1.58 6.27 1.576 11.71c-.001 1.712.464 3.385 1.348 4.908l-.99 3.616 3.713-.974z"/>
                            </svg>
                        </button>
                        {contacto.email && (
                            <a 
                                href={`mailto:${contacto.email}`} 
                                title="Enviar Correo" 
                                className="p-2.5 text-white bg-indigo-500 rounded-full hover:opacity-80 transition-all duration-200 transform hover:scale-110 flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </a>
                        )}
                        {/* [FIX 4] Turn history button (only for patients) */}
                        {contacto.isPatient && (
                            <button onClick={() => onOpenModal('turn-history', contacto)} title="Historial de Turnos" className="p-2 text-white bg-cyan-600 rounded-full hover:opacity-80 transition-all">
                                <CalendarDaysIcon className="h-4 w-4" />
                            </button>
                        )}
                        {/* [FIX 5b] History filtered to this contact */}
                        <button onClick={() => onOpenModal('history', contacto)} title="Historial CRM" className="p-2 text-white bg-purple-500 rounded-full hover:opacity-80 transition-all">
                            <HistoryIcon className="h-4 w-4 mr-0" />
                        </button>
                        <button onClick={() => onOpenModal('lost', contacto)} title="Marcar como Perdido" className="p-2 text-white bg-red-500 rounded-full hover:opacity-80 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
};

// ─── CONTACT TABLES ───────────────────────────────────────────────────────────

const ContactoTable = ({ contactos, onOpenModal, onReactivate, onSelectPatient, onUpdateContacto, contactRowRefs, selectedPatientId, folders, tasks }: { contactos: ContactoCRM[], onOpenModal: (modal: ActiveModalType, contacto: ContactoCRM) => void, onReactivate: (contacto: ContactoCRM) => void, onSelectPatient: (p: any) => void, onUpdateContacto: (id: string, updates: Partial<ContactoCRM>) => void, contactRowRefs: React.MutableRefObject<Record<string, HTMLTableRowElement | null>>, selectedPatientId?: string | null, folders: Folder[], tasks: Task[] }) => (
    <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
            <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contacto</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Etiqueta</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Prioridad</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Obra Social</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Consultas</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
            {contactos.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500 text-sm">No hay pacientes que coincidan con los filtros.</td></tr>
            ) : contactos.map(contacto => (
                <ContactoRow key={contacto.id} contacto={contacto} onOpenModal={onOpenModal} onReactivate={onReactivate} onSelectPatient={onSelectPatient} onUpdateContacto={onUpdateContacto} ref={el => { contactRowRefs.current[contacto.id] = el; }} isSelected={selectedPatientId === contacto.id} hasFolder={folders.some(f => f.patientId === contacto.id)} hasPendingTasks={tasks.some(t => t.patientId === contacto.id && t.status === TaskStatus.PENDIENTE)} />
            ))}
        </tbody>
    </table>
);

const OperatedContactoTable = ({ contactos, onOpenModal, onReactivate, onSelectPatient, onUpdateContacto, contactRowRefs, selectedPatientId, folders, tasks }: { contactos: ContactoCRM[], onOpenModal: (modal: ActiveModalType, contacto: ContactoCRM) => void, onReactivate: (contacto: ContactoCRM) => void, onSelectPatient: (p: any) => void, onUpdateContacto: (id: string, updates: Partial<ContactoCRM>) => void, contactRowRefs: React.MutableRefObject<Record<string, HTMLTableRowElement | null>>, selectedPatientId?: string | null, folders: Folder[], tasks: Task[] }) => (
    <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
            <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contacto</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Etapa Post-Op</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Prioridad</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha Cx</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Obra Social</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Consultas</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
            {contactos.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-500 text-sm">No hay operados que coincidan con los filtros.</td></tr>
            ) : contactos.map(contacto => (
                <ContactoRow key={contacto.id} contacto={contacto} onOpenModal={onOpenModal} onReactivate={onReactivate} onSelectPatient={onSelectPatient} onUpdateContacto={onUpdateContacto} isOperatedView={true} ref={el => { contactRowRefs.current[contacto.id] = el; }} isSelected={selectedPatientId === contacto.id} hasFolder={folders.some(f => f.patientId === contacto.id)} hasPendingTasks={tasks.some(t => t.patientId === contacto.id && t.status === TaskStatus.PENDIENTE)} />
            ))}
        </tbody>
    </table>
);

const GeneralSurgeryContactoTable = ({ contactos, onOpenModal, onReactivate, onSelectPatient, onUpdateContacto, contactRowRefs, selectedPatientId, folders, tasks }: { contactos: ContactoCRM[], onOpenModal: (modal: ActiveModalType, contacto: ContactoCRM) => void, onReactivate: (contacto: ContactoCRM) => void, onSelectPatient: (p: any) => void, onUpdateContacto: (id: string, updates: Partial<ContactoCRM>) => void, contactRowRefs: React.MutableRefObject<Record<string, HTMLTableRowElement | null>>, selectedPatientId?: string | null, folders: Folder[], tasks: Task[] }) => (
    <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
            <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contacto</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado Quirúrgico</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Prioridad</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Obra Social</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Consultas</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
            {contactos.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500 text-sm">No hay pacientes de cirugía general que coincidan con los filtros.</td></tr>
            ) : contactos.map(contacto => (
                <ContactoRow key={contacto.id} contacto={contacto} onOpenModal={onOpenModal} onReactivate={onReactivate} onSelectPatient={onSelectPatient} onUpdateContacto={onUpdateContacto} isGeneralSurgery={true} ref={el => { contactRowRefs.current[contacto.id] = el; }} isSelected={selectedPatientId === contacto.id} hasFolder={folders.some(f => f.patientId === contacto.id)} hasPendingTasks={tasks.some(t => t.patientId === contacto.id && t.status === TaskStatus.PENDIENTE)} />
            ))}
        </tbody>
    </table>
);

const IndividualTreatmentContactoTable = ({ contactos, onOpenModal, onReactivate, onSelectPatient, onUpdateContacto, contactRowRefs, selectedPatientId, folders, tasks, professionals }: { contactos: ContactoCRM[], onOpenModal: (modal: ActiveModalType, contacto: ContactoCRM) => void, onReactivate: (contacto: ContactoCRM) => void, onSelectPatient: (p: any) => void, onUpdateContacto: (id: string, updates: Partial<ContactoCRM>) => void, contactRowRefs: React.MutableRefObject<Record<string, HTMLTableRowElement | null>>, selectedPatientId?: string | null, folders: Folder[], tasks: Task[], professionals: { nombre: string; email: string; }[] }) => (
    <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
            <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contacto</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Profesional Tratante</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Prioridad</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Obra Social</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Consultas</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
            {contactos.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500 text-sm">No hay pacientes de tratamiento individual que coincidan con los filtros.</td></tr>
            ) : contactos.map(contacto => (
                <ContactoRow key={contacto.id} contacto={contacto} onOpenModal={onOpenModal} onReactivate={onReactivate} onSelectPatient={onSelectPatient} onUpdateContacto={onUpdateContacto} isIndividualTreatment={true} professionals={professionals} ref={el => { contactRowRefs.current[contacto.id] = el; }} isSelected={selectedPatientId === contacto.id} hasFolder={folders.some(f => f.patientId === contacto.id)} hasPendingTasks={tasks.some(t => t.patientId === contacto.id && t.status === TaskStatus.PENDIENTE)} />
            ))}
        </tbody>
    </table>
);

const ContactoRow = React.forwardRef<HTMLTableRowElement, { 
    contacto: ContactoCRM, 
    onOpenModal: (modal: ActiveModalType, contacto: ContactoCRM) => void, 
    onReactivate: (contacto: ContactoCRM) => void, 
    onSelectPatient: (p: any) => void, 
    onUpdateContacto: (id: string, updates: Partial<ContactoCRM>) => void, 
    isOperatedView?: boolean, 
    isGeneralSurgery?: boolean,
    isIndividualTreatment?: boolean,
    professionals?: { nombre: string; email: string; }[],
    isSelected?: boolean, 
    hasFolder: boolean, 
    hasPendingTasks: boolean 
}>(
    ({ contacto, onOpenModal, onReactivate, onSelectPatient, onUpdateContacto, isOperatedView, isGeneralSurgery, isIndividualTreatment, professionals, isSelected, hasFolder, hasPendingTasks }, ref) => {
        const authContext = useContext(AuthContext);
        const userEmail = authContext?.user?.email ?? '';
        const [showPriorityMenu, setShowPriorityMenu] = useState(false);

        const handleSelect = () => {
            api.getPacienteCompleto(contacto.id, userEmail).then(p => onSelectPatient(p.filiatorio));
        };

        const priorityConfig = {
            [Priority.ALTA]:   { color: 'bg-red-500',    label: 'Alta',   ring: 'ring-red-300' },
            [Priority.MEDIA]:  { color: 'bg-yellow-500', label: 'Media',  ring: 'ring-yellow-300' },
            [Priority.NORMAL]: { color: 'bg-blue-400',   label: 'Normal', ring: 'ring-blue-300' },
        };
        const pc = priorityConfig[contacto.priority] ?? priorityConfig[Priority.NORMAL];

        return (
            <tr ref={ref} className={`transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                <td className="px-4 py-4 whitespace-nowrap">
                    <button onClick={handleSelect} className="text-left hover:underline">
                        <div className="text-sm font-medium text-slate-900">
                            {contacto.lastName}, {contacto.firstName}
                            <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-500 border">
                                {contacto.id}
                            </span>
                        </div>
                        <div className="text-sm text-slate-500">{contacto.socialInsurance}</div>
                    </button>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                    {isGeneralSurgery ? (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${contacto.cgOperado ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                            {contacto.cgOperado ? 'Operado' : 'No Operado'}
                        </span>
                    ) : isIndividualTreatment ? (
                        <span className="text-sm font-medium text-slate-700">
                            {(() => {
                                const found = professionals?.find(p => p.email === contacto.tiProfesionalEmail);
                                return found ? found.nombre : (contacto.tiProfesionalEmail || 'Sin asignar');
                            })()}
                        </span>
                    ) : (
                        <TagBadge tag={isOperatedView ? getPostOpStage(contacto.surgeryDate) : contacto.tag!} />
                    )}
                </td>

                {/* Interactive priority selector */}
                <td className="px-4 py-4 whitespace-nowrap">
                    <div className="relative inline-block">
                        <button
                            onClick={() => setShowPriorityMenu(p => !p)}
                            onBlur={() => setTimeout(() => setShowPriorityMenu(false), 150)}
                            title={`Prioridad: ${pc.label} — click para cambiar`}
                            className={`w-4 h-4 rounded-full inline-block ${pc.color} ring-2 ${pc.ring} cursor-pointer hover:scale-125 transition-transform`}
                        />
                        {showPriorityMenu && (
                            <div className="absolute left-0 mt-1 w-28 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                                {Object.entries(priorityConfig).map(([p, cfg]) => (
                                    <button
                                        key={p}
                                        onClick={() => { onUpdateContacto(contacto.id, { priority: p as Priority }); setShowPriorityMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 first:rounded-t-md last:rounded-b-md"
                                    >
                                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.color}`} />
                                        {cfg.label}
                                        {p === contacto.priority && <span className="ml-auto text-indigo-600 text-xs">✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </td>

                <td className="px-4 py-4 whitespace-nowrap"><StatusBadge status={getContactoCalculatedStatus(contacto)} /></td>
                {isOperatedView && <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{contacto.surgeryDate || '-'}</td>}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{contacto.socialInsurance || '-'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div>Última: {contacto.lastConsultationDate || '-'}</div>
                    <div>Próxima: {contacto.nextConsultation?.date || '-'}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <ContactoActions contacto={contacto} onOpenModal={onOpenModal} onReactivate={onReactivate} hasFolder={hasFolder} hasPendingTasks={hasPendingTasks} isOperatedView={isOperatedView} />
                </td>
            </tr>
        );
    }
);

const TaskStatusBadge = ({ status }: { status: TaskStatus }) => {
    const statusMap = {
        [TaskStatus.PENDIENTE]: { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
        [TaskStatus.HECHO]: { text: 'Hecho', color: 'bg-green-100 text-green-800' },
        [TaskStatus.POSPUESTO]: { text: 'Pospuesto', color: 'bg-blue-100 text-blue-800' },
    };
    const { text, color } = statusMap[status] || { text: status, color: 'bg-slate-100 text-slate-800' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>{text}</span>;
};

const TasksView = ({ tasks, onUpdateTask, onSelectPatient, contactos, onOpenModal }: { tasks: Task[], onUpdateTask: (id: string, updates: Partial<Task>) => void, onSelectPatient: (p: PacienteFiliatorio) => void, contactos: ContactoCRM[], onOpenModal: (modal: ActiveModalType, contacto: ContactoCRM) => void }) => {
    if (tasks.length === 0) return (
        <div className="text-center py-16 bg-slate-50 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-700">No hay tareas que coincidan con el filtro.</h3>
            <p className="text-slate-500 mt-2">¡Todo en orden!</p>
        </div>
    );

    return (
        <div className="space-y-4 p-4">
            {tasks.map(task => {
                const contacto = contactos.find(c => c.id === task.patientId);
                const isOverdue = task.status === TaskStatus.PENDIENTE && isBefore(new Date(task.dueDate), new Date());
                return (
                    <div key={task.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-center p-4 bg-white rounded-lg shadow-sm border">
                        <div className="col-span-12 md:col-span-5">
                            <p className="font-semibold text-slate-800">{task.description}</p>
                            <button onClick={() => contacto && api.getPacienteCompleto(contacto.id, '').then(p => onSelectPatient(p.filiatorio))} className="text-sm font-medium text-indigo-600 hover:underline">{task.patientName}</button>
                            {task.assigneeEmail && (
                                <p className="text-xs text-slate-500 mt-0.5">Asignado a: <span className="font-medium">{task.assigneeEmail}</span></p>
                            )}
                        </div>
                        <div className="col-span-6 md:col-span-2">
                            <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>{task.dueDate}</p>
                            <p className="text-xs text-slate-500">Vencimiento</p>
                        </div>
                        <div className="col-span-6 md:col-span-2"><TaskStatusBadge status={task.status} /></div>
                        <div className="col-span-12 md:col-span-3 flex items-center justify-start md:justify-end space-x-2">
                            {task.status !== TaskStatus.HECHO && <button onClick={() => { if (window.confirm('¿Confirma que desea marcar esta tarea como completada?')) onUpdateTask(task.id, { status: TaskStatus.HECHO, completedAt: new Date().toISOString() }); }} className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Completar</button>}
                            {task.status === TaskStatus.PENDIENTE && <button onClick={() => onUpdateTask(task.id, { status: TaskStatus.POSPUESTO })} className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 rounded-md hover:bg-amber-600">Posponer</button>}
                            {contacto && (
                                <>
                                    <button onClick={() => onOpenModal('history', contacto)} title="Historial" className="p-2 text-slate-500 bg-slate-100 rounded-md hover:bg-slate-200"><HistoryIcon className="h-4 w-4 mr-0" /></button>
                                    <button onClick={() => onOpenModal('whatsapp', contacto)} title="WhatsApp" className="p-2 text-slate-500 bg-slate-100 rounded-md hover:bg-slate-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16z" /></svg></button>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const TagBadge = ({ tag }: { tag: ContactoTag | string }) => {
    const normalizedTag = normalizeString(tag);
    const etiquetaInfo = ETIQUETAS_FLUJO.find(e => normalizeString(e.nombreEtiquetaUnico) === normalizedTag || normalizeString(e.descripcionParaUsuario) === normalizedTag || normalizeString(e.nombreEtiquetaUnico.replace(/_/g, ' ')) === normalizedTag);
    let color = etiquetaInfo?.color || 'bg-slate-200 text-slate-800';
    if (Object.values(PostOpStage).map(s => normalizeString(s)).includes(normalizedTag)) color = 'bg-cyan-100 text-cyan-800';
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${color}`}>{tag}</span>;
};

const PrioritySelector = ({ priority }: { priority: Priority }) => {
    const colors = { [Priority.ALTA]: 'bg-red-500', [Priority.MEDIA]: 'bg-yellow-500', [Priority.NORMAL]: 'bg-blue-500' };
    return <span className={`w-3 h-3 rounded-full inline-block ${colors[priority]}`} title={`Prioridad: ${priority}`}></span>;
};

const StatusBadge = ({ status }: { status: ContactoStatus }) => {
    const colorMap = { [ContactoStatus.ACTIVO]: 'text-green-800', [ContactoStatus.INACTIVO]: 'text-amber-800', [ContactoStatus.PERDIDO]: 'text-red-800' };
    return <span className={`text-xs font-medium ${colorMap[status] || 'text-slate-800'}`}>● {status}</span>;
};

const ContactoActions = ({ contacto, onOpenModal, onReactivate, hasFolder, hasPendingTasks, isOperatedView }: { contacto: ContactoCRM, onOpenModal: (modal: ActiveModalType, contacto: ContactoCRM) => void, onReactivate: (contacto: ContactoCRM) => void, hasFolder: boolean, hasPendingTasks: boolean, isOperatedView?: boolean }) => {
    const allActionButtons: { modal: ActiveModalType; icon: React.ReactNode; title: string; color: string; pulse: boolean }[] = [
        { modal: 'whatsapp', icon: (
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.115-2.905-6.99-1.876-1.875-4.353-2.904-6.992-2.905C6.009 1.846 1.58 6.27 1.576 11.71c-.001 1.712.464 3.385 1.348 4.908l-.99 3.616 3.713-.974z"/>
            </svg>
        ), title: 'WhatsApp', color: 'bg-[#25D366]', pulse: false },
        { modal: 'folder', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>, title: 'Gestionar Carpeta', color: 'bg-amber-500', pulse: hasFolder },
        { modal: 'tasks', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>, title: 'Ver/Añadir Tareas', color: 'bg-blue-500', pulse: hasPendingTasks },
        { modal: 'turn-history', icon: <CalendarDaysIcon className="h-5 w-5" />, title: 'Historial de Turnos', color: 'bg-cyan-600', pulse: false },
        { modal: 'history', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, title: 'Historial CRM', color: 'bg-purple-500', pulse: false },
        { modal: 'lost', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>, title: 'Marcar como Perdido', color: 'bg-red-500', pulse: false },
    ];

    const actionButtons = isOperatedView
        ? allActionButtons.filter(btn => btn.modal !== 'folder' && btn.modal !== 'lost')
        : allActionButtons;

    if (contacto.lostReason) {
        return (
            <button onClick={() => onReactivate(contacto)} title="Reactivar Contacto" className="p-2.5 text-white bg-slate-500 rounded-full hover:opacity-80 transition-all duration-200 transform hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
            </button>
        );
    }

    return (
        <div className="flex items-center space-x-2">
            {actionButtons.map(btn => {
                const pulseClass = btn.pulse ? (btn.color === 'bg-amber-500' ? 'animate-pulse-amber' : 'animate-pulse-blue') : '';
                return (
                    <button key={btn.modal} onClick={() => onOpenModal(btn.modal, contacto)} title={btn.title} className={`p-2.5 text-white ${btn.color} rounded-full hover:opacity-80 transition-all duration-200 transform hover:scale-110 ${pulseClass}`}>
                        {btn.icon}
                    </button>
                );
            })}
            {contacto.email && (
                <a 
                    href={`mailto:${contacto.email}`} 
                    title="Enviar Correo" 
                    className="p-2.5 text-white bg-indigo-500 rounded-full hover:opacity-80 transition-all duration-200 transform hover:scale-110 flex items-center justify-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </a>
            )}
        </div>
    );
};

function getPostOpStage(surgeryDate: string | null): PostOpStage | 'N/A' {
    if (!surgeryDate) return 'N/A';
    const diff = new Date().getTime() - new Date(surgeryDate).getTime();
    const days = diff / (1000 * 3600 * 24);
    if (days <= 30) return PostOpStage.INMEDIATO;
    if (days <= 180) return PostOpStage.RECIENTE;
    if (days <= 365) return PostOpStage.MEDIATO;
    return PostOpStage.ALEJADO;
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

interface DashboardProps {
    onSelectPatient: (patient: PacienteFiliatorio) => void;
    onNavigateToCrm?: () => void;
}

const LiquidacionDiariaModal = ({ onClose }: { onClose: () => void }) => {
    const [turnos, setTurnos] = useState<TurnoDiario[]>([]);
    const [fecha, setFecha] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [profesionales, setProfesionales] = useState<Profesional[]>([]);
    const [selectedProfEmail, setSelectedProfEmail] = useState<string>('todos');

    useEffect(() => { api.getProfesionalesAdmin().then(setProfesionales).catch(() => {}); }, []);
    useEffect(() => {
        setIsLoading(true);
        setLoadError(null);
        api.getTurnosDiariosTodosProfesionales(fecha)
            .then(setTurnos)
            .catch(err => setLoadError(err?.message || 'No se pudieron cargar los datos. Verificá tu conexión.'))
            .finally(() => setIsLoading(false));
    }, [fecha]);

    const getProfesionalNombre = (email: string) => {
        const prof = profesionales.find(p => p.email === email);
        return prof ? `${prof.nombres} ${prof.apellido}` : email;
    };
    const turnosFiltrados = turnos.filter(t => selectedProfEmail === 'todos' || t.profesionalEmail === selectedProfEmail);
    const turnosAtendidos = turnosFiltrados.filter(t => t.estado === EstadoTurnoDia.ATENDIDO);
    const summary = useMemo(() => {
        const totalRecaudado = turnosAtendidos.reduce((acc, t) => acc + (t.valorCobrado || 0), 0);
        const totalEfectivo = turnosAtendidos.filter(t => t.metodoPago === 'Efectivo').reduce((acc, t) => acc + (t.valorCobrado || 0), 0);
        const totalTransferencia = turnosAtendidos.filter(t => t.metodoPago === 'Transferencia').reduce((acc, t) => acc + (t.valorCobrado || 0), 0);
        const totalTarjeta = turnosAtendidos.filter(t => t.metodoPago === 'Tarjeta').reduce((acc, t) => acc + (t.valorCobrado || 0), 0);
        const porProfesional = turnosAtendidos.reduce<Record<string, { count: number, total: number }>>((acc, t) => {
            if (!acc[t.profesionalEmail]) acc[t.profesionalEmail] = { count: 0, total: 0 };
            acc[t.profesionalEmail].count++;
            acc[t.profesionalEmail].total += (t.valorCobrado || 0);
            return acc;
        }, {});
        return { totalRecaudado, totalEfectivo, totalTransferencia, totalTarjeta, porProfesional };
    }, [turnosAtendidos]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b bg-slate-50 no-print"><h2 className="text-xl font-bold text-slate-800">Cierre de Caja Diario (Liquidación)</h2></div>
                <div className="p-6 flex-grow overflow-y-auto print-section">
                    <div className="flex flex-wrap gap-4 items-center mb-4 no-print">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Fecha:</label>
                            <input type="date" value={format(fecha, 'yyyy-MM-dd')} onChange={e => setFecha(new Date(e.target.value.replace(/-/g, '/')))} className="rounded-md border-slate-300 text-sm" />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Profesional:</label>
                            <select 
                                value={selectedProfEmail} 
                                onChange={e => setSelectedProfEmail(e.target.value)} 
                                className="rounded-md border-slate-300 text-sm"
                            >
                                <option value="todos">Todos los profesionales</option>
                                {profesionales.map(p => (
                                    <option key={p.email} value={p.email}>{p.apellido}, {p.nombres}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="border-b pb-4 mb-4"><h3 className="text-2xl font-bold text-center">Liquidación del {format(fecha, 'dd/MM/yyyy')}</h3></div>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12 text-slate-500">
                            <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                            Cargando datos...
                        </div>
                    ) : loadError ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-red-600 font-medium mb-2">Error al cargar los datos</p>
                            <p className="text-sm text-slate-500 mb-4">{loadError}</p>
                            <button onClick={() => { setIsLoading(true); setLoadError(null); api.getTurnosDiariosTodosProfesionales(fecha).then(setTurnos).catch(err => setLoadError(err?.message || 'Error.')).finally(() => setIsLoading(false)); }} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">Reintentar</button>
                        </div>
                    ) : (
                        <div>
                            <h4 className="text-lg font-semibold mb-2">Resumen General</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                                <div className="p-4 bg-blue-50 rounded-lg"><p className="text-sm text-blue-800 font-medium">Pacientes Atendidos</p><p className="text-2xl font-bold text-blue-900">{turnosAtendidos.length}</p></div>
                                <div className="p-4 bg-green-50 rounded-lg"><p className="text-sm text-green-800 font-medium">Efectivo</p><p className="text-2xl font-bold text-green-900">${summary.totalEfectivo.toLocaleString('es-AR')}</p></div>
                                <div className="p-4 bg-amber-50 rounded-lg"><p className="text-sm text-amber-800 font-medium">Transferencia</p><p className="text-2xl font-bold text-amber-900">${summary.totalTransferencia.toLocaleString('es-AR')}</p></div>
                                <div className="p-4 bg-purple-50 rounded-lg"><p className="text-sm text-purple-800 font-medium">Tarjeta</p><p className="text-2xl font-bold text-purple-900">${summary.totalTarjeta.toLocaleString('es-AR')}</p></div>
                                <div className="p-4 bg-indigo-50 rounded-lg"><p className="text-sm text-indigo-800 font-medium">Total Recaudado</p><p className="text-2xl font-bold text-indigo-900">${summary.totalRecaudado.toLocaleString('es-AR')}</p></div>
                            </div>
                            <h4 className="text-lg font-semibold mb-2">Detalle por Profesional</h4>
                            <div className="space-y-4 mb-6">
                                {(Object.entries(summary.porProfesional) as [string, { count: number; total: number }][]).map(([email, data]) => (
                                    <div key={email} className="p-3 bg-slate-50 rounded-md border">
                                        <p className="font-semibold">{getProfesionalNombre(email)}</p>
                                        <p className="text-sm">Atendidos: {data.count} | Recaudado: ${data.total.toLocaleString('es-AR')}</p>
                                    </div>
                                ))}
                            </div>
                            <h4 className="text-lg font-semibold mb-2">Listado de Turnos Atendidos y Cobrados</h4>
                            {turnosAtendidos.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-6 border border-dashed rounded-lg">Sin turnos atendidos para esta fecha.</p>
                            ) : (
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Hora</th>
                                                <th className="px-4 py-2 text-left">Paciente</th>
                                                <th className="px-4 py-2 text-left">Profesional</th>
                                                <th className="px-4 py-2 text-left">Método</th>
                                                <th className="px-4 py-2 text-right">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {turnosAtendidos.filter(t => t.valorCobrado && t.valorCobrado > 0).map(t => (
                                                <tr key={t.idTurno}>
                                                    <td className="px-4 py-2">{format(new Date(t.fechaTurno), 'HH:mm')}</td>
                                                    <td className="px-4 py-2">{t.paciente.apellido}, {t.paciente.nombres}</td>
                                                    <td className="px-4 py-2">{getProfesionalNombre(t.profesionalEmail)}</td>
                                                    <td className="px-4 py-2">
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                            {t.metodoPago || 'Sin reg.'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-medium text-slate-900">${(t.valorCobrado || 0).toLocaleString('es-AR')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end space-x-3 no-print">
                    <button onClick={() => window.print()} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border rounded-md">Imprimir</button>
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

function useDebouncedCallback<A extends any[]>(callback: (...args: A) => void, wait: number) {
    const callbackRef = useRef(callback);
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    function cleanup() { if (timeout.current) clearTimeout(timeout.current); }
    useEffect(() => { return cleanup; }, []);

    return useCallback((...args: A) => {
        cleanup();
        timeout.current = setTimeout(() => {
            callbackRef.current(...args);
        }, wait);
    }, [wait]);
}

// ─── PATIENT SEARCH BAR ──────────────────────────────────────────────────────
const PatientSearchBar = ({ allPatients, onSelectPatient }: { allPatients: PacienteFiliatorio[], onSelectPatient: (patient: PacienteFiliatorio) => void }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PacienteFiliatorio[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const isDigit = /^\d+$/.test(query);
        if (query.length < (isDigit ? 1 : 2)) { setResults([]); setIsOpen(false); return; }
        
        const lowerQuery = query.trim().toLowerCase();
        const isNumeric = /^\d+$/.test(lowerQuery);
        const isPrefixedId = /^p-\d+$/.test(lowerQuery);
        
        let filtered = [];
        
        if (isNumeric || isPrefixedId) {
            const numericStr = isNumeric ? lowerQuery : lowerQuery.substring(2);
            const searchNum = parseInt(numericStr, 10);
            const exactId = `p-${numericStr}`;
            
            const hasExactMatch = allPatients.some(p => 
                p.nroHc === searchNum || (p.idPaciente && p.idPaciente.toLowerCase() === exactId)
            );
            
            if (hasExactMatch) {
                filtered = allPatients.filter(p => 
                    p.nroHc === searchNum || (p.idPaciente && p.idPaciente.toLowerCase() === exactId)
                );
            } else {
                const normQuery = normalizeString(query);
                filtered = allPatients.filter(p => 
                    normalizeString(`${p.apellido} ${p.nombres}`).includes(normQuery) || 
                    p.dni.includes(normQuery) ||
                    (p.idPaciente && p.idPaciente.toLowerCase().includes(normQuery)) ||
                    (p.nroHc && String(p.nroHc).includes(normQuery))
                );
            }
        } else {
            const normQuery = normalizeString(query);
            filtered = allPatients.filter(p => 
                normalizeString(`${p.apellido} ${p.nombres}`).includes(normQuery) || 
                p.dni.includes(normQuery) ||
                (p.idPaciente && p.idPaciente.toLowerCase().includes(normQuery)) ||
                (p.nroHc && String(p.nroHc).includes(normQuery))
            );
        }
        setResults(filtered);
        setIsOpen(true);
    }, [query, allPatients]);

    const handleSelect = (patient: PacienteFiliatorio) => { setQuery(''); setResults([]); setIsOpen(false); onSelectPatient(patient); };

    return (
        <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></div>
            <input type="text" placeholder="Buscar paciente por nombre, apellido, DNI, HC o ID..." value={query} onChange={e => setQuery(e.target.value)} onBlur={() => setTimeout(() => setIsOpen(false), 200)} onFocus={() => query.length > 1 && setIsOpen(true)} className="block w-full rounded-md border-slate-300 pl-10 shadow-sm text-base p-3" />
            {isOpen && results.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-y-auto border border-slate-200">
                    <ul>
                        {results.map(patient => (
                            <li key={patient.idPaciente} onClick={() => handleSelect(patient)} className="p-3 hover:bg-slate-100 cursor-pointer border-b last:border-b-0">
                                <p className="font-medium text-slate-800">{patient.apellido}, {patient.nombres}</p>
                                <p className="text-sm text-slate-500">DNI: {patient.dni} {patient.nroHc ? `· HC: ${patient.nroHc}` : ''} · ID: {patient.idPaciente}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {isOpen && results.length === 0 && query.length > 1 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md p-4 border border-slate-200 text-sm text-slate-500">No se encontraron pacientes.</div>
            )}
        </div>
    );
};

// ─── [FIX 3] TORRE DE CONTROL — with date picker ─────────────────────────────
const TorreDeControl = ({ onSelectPatient }: { onSelectPatient: (patient: PacienteFiliatorio) => void }) => {
    const authContext = useContext(AuthContext);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [turnos, setTurnos] = useState<TurnoDiario[]>([]);
    const [profesionales, setProfesionales] = useState<Profesional[]>([]);
    const [allPatients, setAllPatients] = useState<PacienteFiliatorio[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showGestionProfs, setShowGestionProfs] = useState(false);
    const [showLiquidacion, setShowLiquidacion] = useState(false);
    const [turnoAReagendar, setTurnoAReagendar] = useState<any | null>(null);
    const user = authContext!.user!;

    useEffect(() => {
        api.getPacientes(UserRole.MEDICO).then(setAllPatients).catch(() => {});
    }, []);

    const fetchData = useCallback(() => {
        setIsLoading(true);
        Promise.all([api.getProfesionales(), api.getTurnosDiariosTodosProfesionales(currentDate)])
            .then(([profs, dailyTurnos]) => { setProfesionales(profs); setTurnos(dailyTurnos); setIsLoading(false); })
            .catch(err => { console.error(err); setIsLoading(false); });
    }, [currentDate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpdateTurno = useCallback(async (turnoId: string, updates: Partial<Turno>) => {
        try {
            const updatedTurno = await api.updateDetallesTurno(turnoId, updates, user);
            setTurnos(currentTurnos => currentTurnos.map(t => t.idTurno === turnoId ? { ...t, ...updatedTurno } : t));
        } catch (error) {
            console.error("Failed to update turno:", error);
            fetchData();
        }
    }, [user, fetchData]);

    const debouncedNotaUpdate = useDebouncedCallback((turnoId: string, nota: string) => { handleUpdateTurno(turnoId, { notaInterna: nota }); }, 800);
    const debouncedValorUpdate = useDebouncedCallback((turnoId: string, valor: number) => { handleUpdateTurno(turnoId, { valorCobrado: valor }); }, 800);

    const turnosPorProfesional = useMemo(() => {
    return profesionales
        .map(prof => ({
            ...prof,
            turnos: turnos
                .filter(t => t.profesionalEmail === prof.email && t.estado !== EstadoTurnoDia.CANCELADO)
                .sort((a, b) => new Date(a.fechaTurno).getTime() - new Date(b.fechaTurno).getTime()),
        }))
        .filter(prof => prof.turnos.length > 0); // ← solo profesionales con turnos ese día
}, [turnos, profesionales]);

    const changeDay = (offset: number) => {
        if (offset === 0) setCurrentDate(startOfDay(new Date()));
        else setCurrentDate(d => addDays(d, offset));
    };

    // [FIX 3] Handle date picker change
    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            setCurrentDate(startOfDay(new Date(e.target.value.replace(/-/g, '/'))));
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md flex flex-col h-[calc(100vh-14rem)] sm:h-[calc(100vh-12rem)]">
            <div className="flex items-center justify-between p-4 border-b bg-slate-50 flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-slate-700 capitalize">
                    Torre de Control — {format(currentDate, 'eeee, dd MMMM yyyy', { locale: es })}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setShowGestionProfs(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                        Gestionar Profesionales
                    </button>
                    <button onClick={() => setShowLiquidacion(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border rounded-md hover:bg-slate-50">
                        <CalculatorIcon />Liquidación
                    </button>
                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-md px-1">
                        <button onClick={() => changeDay(-1)} className="p-1.5 rounded hover:bg-slate-100 transition-colors" title="Día anterior"><ChevronLeftIcon /></button>
                        <input
                            type="date"
                            value={format(currentDate, 'yyyy-MM-dd')}
                            onChange={handleDateInputChange}
                            className="border-0 text-sm text-slate-700 focus:ring-0 py-1 cursor-pointer"
                            title="Seleccionar fecha"
                        />
                        <button onClick={() => changeDay(1)} className="p-1.5 rounded hover:bg-slate-100 transition-colors" title="Día siguiente"><ChevronRightIcon /></button>
                    </div>
                    <button onClick={() => changeDay(0)} className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white rounded-md shadow-sm hover:bg-slate-50 border border-slate-300">
                        Hoy
                    </button>
                </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-b">
                <PatientSearchBar allPatients={allPatients} onSelectPatient={onSelectPatient} />
            </div>

            {isLoading ? (
                <div className="flex-grow flex items-center justify-center"><p className="text-slate-500">Cargando agenda del día...</p></div>
            ) : (
                <div className="flex-grow overflow-x-auto">
                    <div className="flex h-full">
                        {turnosPorProfesional.map(prof => (
                            <div key={prof.email} className="w-80 flex-shrink-0 border-r border-slate-200 flex flex-col">
                                <div className="p-3 bg-slate-100 border-b border-slate-200 text-center sticky top-0">
                                    <p className="font-semibold text-slate-700 truncate">{prof.nombres} {prof.apellido}</p>
                                    <p className="text-xs text-slate-500">{prof.especialidad}</p>
                                </div>
                                <div className="p-2 space-y-2 flex-grow overflow-y-auto">
                                    {prof.turnos.length > 0 ? prof.turnos.map(turno => {
                                        const estadoInfo = ESTADO_TURNO_MAP[turno.estado];
                                        return (
                                            <div key={turno.idTurno} className={`p-2.5 rounded-md shadow-sm border-l-4 ${estadoInfo.color} ${estadoInfo.colorFondo} space-y-2`}>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-grow min-w-0">
                                                        <div className="flex justify-between items-center w-full mb-1">
                                                            <p className="font-bold text-sm text-slate-800">{format(new Date(turno.fechaTurno), 'HH:mm')}</p>
                                                            {turno.estado !== EstadoTurnoDia.CANCELADO && (
                                                                <div className="flex gap-2">
                                                                    <button 
                                                                        onClick={() => setTurnoAReagendar(turno)} 
                                                                        title="Reagendar"
                                                                        className="text-indigo-600 hover:text-indigo-900 transition-colors p-0.5 rounded-full hover:bg-indigo-50"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                                                            <path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.419a4 4 0 0 0-.885 1.344Z" />
                                                                        </svg>
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => {
                                                                            if (window.confirm("¿Está seguro de que desea cancelar este turno?")) {
                                                                                handleUpdateTurno(turno.idTurno, { estado: EstadoTurnoDia.CANCELADO });
                                                                            }
                                                                        }} 
                                                                        title="Cancelar Turno"
                                                                        className="text-red-600 hover:text-red-900 transition-colors p-0.5 rounded-full hover:bg-red-50"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                                                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col mt-1">
                                                            <div className="flex items-center gap-1">
                                                                {turno.esVideoconsulta && <span title="Videoconsulta"><VideoCameraIcon /></span>}
                                                                {turno.esSobreturno && <span title="Sobreturno"><PlusCircleIcon /></span>}
                                                                <button onClick={() => onSelectPatient(turno.paciente)} className="block text-left font-medium text-sm text-indigo-600 hover:underline truncate">
                                                                    {turno.paciente.apellido}, {turno.paciente.nombres}
                                                                </button>
                                                                {turno.paciente.email && (
                                                                    <a 
                                                                        href={`mailto:${turno.paciente.email}`}
                                                                        className="text-slate-400 hover:text-indigo-600 ml-1 inline-block align-middle"
                                                                        title={`Enviar mail a ${turno.paciente.email}`}
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                        </svg>
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                                                                🏷️ {turno.paciente.etiquetaPrincipalActiva.replace(/_/g, ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 ml-2">
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${estadoInfo.colorFondo}`}>{estadoInfo.texto}</span>
                                                        {turno.estado === EstadoTurnoDia.EN_ESPERA && (
                                                            <button 
                                                                onClick={() => handleUpdateTurno(turno.idTurno, { estado: EstadoTurnoDia.AGENDADO, horaLlegada: null })}
                                                                className="text-[9px] text-slate-500 hover:text-indigo-600 underline"
                                                                title="Revertir check-in de llegada"
                                                            >
                                                                (Deshacer)
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 gap-1 text-xs">
                                                    <div className="col-span-4">
                                                        <input type="text" defaultValue={turno.notaInterna || ''} onChange={e => debouncedNotaUpdate(turno.idTurno, e.target.value)} onBlur={e => handleUpdateTurno(turno.idTurno, { notaInterna: e.target.value })} placeholder="Nota..." className="w-full p-1 compact-input rounded border-slate-300" />
                                                    </div>
                                                    <div className="col-span-8 flex gap-1">
                                                        <div className="relative flex-grow">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1"><span className="text-gray-500">$</span></div>
                                                            <input type="text" inputMode="decimal" defaultValue={turno.valorCobrado || ''} onChange={e => debouncedValorUpdate(turno.idTurno, parseFloat(e.target.value) || 0)} onBlur={e => handleUpdateTurno(turno.idTurno, { valorCobrado: parseFloat(e.target.value) || 0 })} placeholder="Valor" className="w-full p-1 pl-4 compact-input rounded border-slate-300" />
                                                        </div>
                                                        <select value={turno.metodoPago || ''} onChange={e => handleUpdateTurno(turno.idTurno, { metodoPago: e.target.value as any })} className="p-1 compact-input rounded border-slate-300 text-xs bg-white">
                                                            <option value="">...</option>
                                                            <option value="Efectivo">Efectivo</option>
                                                            <option value="Transferencia">Transferencia</option>
                                                            <option value="Tarjeta">Tarjeta</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                {(turno.estado === EstadoTurnoDia.AGENDADO || turno.estado === EstadoTurnoDia.CONFIRMADO) && (
                                                    <div className="pt-2 border-t border-slate-300/50">
                                                        <button onClick={() => handleUpdateTurno(turno.idTurno, { estado: EstadoTurnoDia.EN_ESPERA })} className="w-full flex items-center justify-center text-xs font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 px-2 py-1.5 rounded-md transition-colors">
                                                            <CheckCircleIcon />Registrar Llegada
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-center text-xs text-slate-400 pt-6"><p>Sin turnos</p></div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {turnosPorProfesional.length === 0 && (
                            <div className="flex-grow flex items-center justify-center text-slate-400 text-sm">
                                No hay profesionales activos configurados.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showGestionProfs && <GestionProfesionalesModal onClose={() => { setShowGestionProfs(false); fetchData(); }} />}
            {showLiquidacion && <LiquidacionDiariaModal onClose={() => setShowLiquidacion(false)} />}
            {turnoAReagendar && (
                <AgendarTurnoModal
                    onClose={() => setTurnoAReagendar(null)}
                    onSuccess={() => {
                        setTurnoAReagendar(null);
                        fetchData();
                    }}
                    turnoAEditar={{
                        idTurno: turnoAReagendar.idTurno,
                        idPaciente: turnoAReagendar.paciente.idPaciente,
                        fechaTurno: turnoAReagendar.fechaTurno,
                        profesionalEmail: turnoAReagendar.profesionalEmail,
                        especialidad: turnoAReagendar.especialidad,
                        creadoPorEmail: turnoAReagendar.creadoPorEmail,
                        esVideoconsulta: turnoAReagendar.esVideoconsulta,
                        esSobreturno: turnoAReagendar.esSobreturno,
                        estado: turnoAReagendar.estado,
                        notaInterna: turnoAReagendar.notaInterna,
                        valorCobrado: turnoAReagendar.valorCobrado,
                        metodoPago: turnoAReagendar.metodoPago,
                    }}
                    creadoPorEmail={user.email}
                />
            )}
        </div>
    );
};

const TareasPendientesWidget = ({ onSelectPatient, allPatients, onNavigateToCrm }: { onSelectPatient: (patient: PacienteFiliatorio) => void, allPatients: PacienteFiliatorio[], onNavigateToCrm?: () => void }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const authContext = useContext(AuthContext);
    const user = authContext!.user!;

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            api.getTasksForUser(user.email).then(setTasks).catch(err => console.error("Error fetching user tasks:", err)).finally(() => setIsLoading(false));
        }
    }, [user]);

    const handleSelectPatient = (patientId: string) => {
        const patient = allPatients.find(p => p.idPaciente === patientId);
        if (patient) onSelectPatient(patient);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center"><ClipboardCheckIcon />Mis Tareas Pendientes</h3>
            {isLoading ? (
                <p className="text-sm text-slate-500">Cargando tareas...</p>
            ) : tasks.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-md">No tienes tareas pendientes. ¡Buen trabajo!</p>
            ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {tasks.map(task => {
                        const isOverdue = isBefore(new Date(task.dueDate), startOfDay(new Date()));
                        return (
                            <div key={task.id} className="p-3 bg-slate-50 rounded-md border-l-4 border-amber-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-slate-800">{task.description}</p>
                                        <button onClick={() => handleSelectPatient(task.patientId)} className="text-sm text-indigo-600 hover:underline">Paciente: {task.patientName}</button>
                                    </div>
                                    <button onClick={onNavigateToCrm} className="flex-shrink-0 ml-4 px-3 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                                        Hacer Tarea
                                    </button>
                                </div>
                                <p className={`text-xs mt-1 font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                                    Vence: {format(new Date(task.dueDate.replace(/-/g, '/')), 'dd/MM/yyyy')}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

function MedicoDashboard({ onSelectPatient, onNavigateToCrm }: DashboardProps) {
    const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
    const [allPatients, setAllPatients] = useState<PacienteFiliatorio[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { api.getPacientes(UserRole.MEDICO).then(setAllPatients).finally(() => setIsLoading(false)); }, []);

    if (isLoading) return <div className="text-center p-10 text-slate-500">Cargando...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Panel del Profesional</h2>
            <PatientSearchBar allPatients={allPatients} onSelectPatient={onSelectPatient} />
            <TareasPendientesWidget onSelectPatient={onSelectPatient} allPatients={allPatients} onNavigateToCrm={onNavigateToCrm} />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" style={{ minHeight: 'calc(100vh - 18rem)' }}>
                <div className="xl:col-span-1"><AgendaProfesional onDateSelect={setSelectedDate} selectedDate={selectedDate} /></div>
                <div className="xl:col-span-2"><VistaDiariaProfesional onSelectPatient={onSelectPatient} date={selectedDate} /></div>
            </div>
        </div>
    );
}

export default function Dashboard({ onSelectPatient, onNavigateToCrm }: DashboardProps) {
    const authContext = useContext(AuthContext);
    const user = authContext!.user!;
    return (
        <div>
            {user.rol === UserRole.ADMINISTRATIVO || user.rol === UserRole.SUPERADMIN
                ? <TorreDeControl onSelectPatient={onSelectPatient} />
                : <MedicoDashboard onSelectPatient={onSelectPatient} onNavigateToCrm={onNavigateToCrm} />
            }
        </div>
    );
}