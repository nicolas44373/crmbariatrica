import React, { useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import { PacienteFiliatorio, UserRole, ContactoCRM, ContactoTag, ContactoStatus, Priority, CrmHistoryEntry, Task, TaskStatus, PostOpStage, Folder, FolderTrackingStatus, MessageTemplate, CrmSimpleProfessionals, ChecklistItemStatus, LostReason, ProspectoCanalOrigen, ProspectoEstadoSeguimiento, TurnoConPaciente, ConfiguracionGeneral, Turno, DiaSemana, EstadoTurnoDia, TurnoDiario, Profesional } from '../types';
import { api } from '../services/mockApi';
import { AuthContext } from '../App';
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


// --- ICONS ---
const UsersIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962a3.75 3.75 0 1 0-7.5 0 3.75 3.75 0 0 0 7.5 0ZM10.5 1.5a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" /></svg>);
const UserPlusIcon = ({className = "w-5 h-5 mr-2"}) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>);
const CogIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5" /></svg>);
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
const LockOpenIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-3 h-3"}><path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6a.5.5 0 0 1 1 0V4.5A2.5 2.5 0 0 1 8 2a2.5 2.5 0 0 1 2.5 2.5v2.25a.75.75 0 0 0 1.5 0V4.5A3.5 3.5 0 0 0 8 1Zm-1.5 8a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5Z" clipRule="evenodd" /><path d="M2 7.5A1.5 1.5 0 0 1 3.5 6h9A1.5 1.5 0 0 1 14 7.5v5A1.5 1.5 0 0 1 12.5 14h-9A1.5 1.5 0 0 1 2 12.5v-5Z" /></svg>);
const CalculatorIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm3-6h.008v.008H11.25v-.008Zm0 3h.008v.008H11.25v-.008Zm0 3h.008v.008H11.25v-.008Zm3-6h.008v.008H14.25v-.008Zm0 3h.008v.008H14.25v-.008ZM5.25 6.75h13.5c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125H5.25a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125ZM6 12h12v-3H6v3Z" /></svg>);
const ChevronLeftIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>);
const ChevronRightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>);

// --- CRM COMPONENTS ---
// Some components are defined here to keep the file structure simple for this context.

// Placeholder for WhatsAppModal
const WhatsAppModal = ({ onClose, patient, onSend }: { onClose: () => void; patient: ContactoCRM | null; onSend: (message: string) => void; }) => {
    const [goal, setGoal] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!patient) return null;

    const generateMessage = async () => {
        if (!goal) return;
        setIsLoading(true);
        try {
            const generatedMessage = await api.generateWhatsAppMessage(patient, goal);
            setMessage(generatedMessage);
        } catch (error) {
            setMessage("Error: No se pudo generar el mensaje. Por favor, intente de nuevo.");
        }
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Generar Mensaje de WhatsApp</h2>
                <p className="text-sm text-slate-600 mb-4">
                    Genera un mensaje personalizado para <span className="font-semibold">{patient.firstName} {patient.lastName}</span> con la ayuda de IA.
                </p>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="goal" className="block text-sm font-medium text-slate-700">¿Cuál es el objetivo del mensaje?</label>
                        <div className="flex gap-2 mt-1">
                            <input
                                type="text"
                                id="goal"
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                placeholder="Ej: Recordar turno, consultar por estudios..."
                                className="flex-grow block w-full rounded-md border-slate-300 shadow-sm"
                            />
                            <button
                                onClick={generateMessage}
                                disabled={isLoading || !goal}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                            >
                                {isLoading ? 'Generando...' : 'Generar'}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-slate-700">Mensaje generado</label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
                            placeholder="El mensaje generado por la IA aparecerá aquí."
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSend(message)}
                        disabled={!message || message.startsWith("Error:")}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-300"
                    >
                        Enviar (Simulado)
                    </button>
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
    const newTemplate: MessageTemplate = {
      id: `new-${Date.now()}`,
      name: 'Nueva Plantilla',
      text: '',
    };
    setTemplates(prev => [...prev, newTemplate]);
  };

  const removeTemplate = (id: string) => {
    if (window.confirm('¿Está seguro que desea eliminar esta plantilla?')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await onSave(templates);
      onClose();
    } catch (error) {
      console.error("Error saving templates:", error);
      alert("No se pudieron guardar las plantillas.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-slate-800">Gestionar Plantillas de Mensajes</h2>
        </div>
        <div className="p-6 flex-grow overflow-y-auto space-y-6">
          <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg text-sm text-blue-800">
            <p className="font-semibold">Variables dinámicas</p>
            <p>Usa los siguientes placeholders en tus mensajes para que se reemplacen automáticamente: <code className="font-mono bg-blue-100 px-1 rounded">[Nombre]</code>, <code className="font-mono bg-blue-100 px-1 rounded">[Proxima Cita]</code>, <code className="font-mono bg-blue-100 px-1 rounded">[Hora Cita]</code>, <code className="font-mono bg-blue-100 px-1 rounded">[Profesional]</code>.</p>
          </div>
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative">
                <button 
                  onClick={() => removeTemplate(template.id)}
                  className="absolute top-2 right-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full p-1 transition-colors"
                  title="Eliminar plantilla"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.077-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label htmlFor={`name-${template.id}`} className="block text-sm font-medium text-slate-700">Nombre</label>
                    <input
                      type="text"
                      id={`name-${template.id}`}
                      value={template.name}
                      onChange={(e) => handleTemplateChange(template.id, 'name', e.target.value)}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                     <label htmlFor={`text-${template.id}`} className="block text-sm font-medium text-slate-700">Texto del Mensaje</label>
                    <textarea
                      id={`text-${template.id}`}
                      value={template.text}
                      onChange={(e) => handleTemplateChange(template.id, 'text', e.target.value)}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addTemplate}
            className="w-full py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 border border-dashed border-indigo-300"
          >
            + Añadir Plantilla
          </button>
        </div>
        <div className="p-4 bg-slate-50 border-t flex justify-end space-x-3">
          <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
            Cancelar
          </button>
          <button onClick={handleSaveChanges} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};


// Placeholder for EmailModal
const EmailModal = ({ onClose }: { onClose: () => void; }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Enviar Email (Simulado)</h2>
                <p className="text-slate-600 mb-4">Esta funcionalidad aún no está implementada.</p>
                <div className="flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
// Placeholder for TasksModal
const TasksModal = ({ onClose, patient, tasks, onUpdate, onAdd }: { onClose: () => void; patient: ContactoCRM | null; tasks: Task[]; onUpdate: (id: string, updates: Partial<Task>) => void; onAdd: (task: Task) => void; }) => {
    const [newTask, setNewTask] = useState('');
    const [newDueDate, setNewDueDate] = useState('');

    if (!patient) return null;

    const patientTasks = tasks.filter(t => t.patientId === patient.id);

    const handleAddTask = () => {
        if (!newTask || !newDueDate) return;
        const task: Task = {
            id: `task-${Date.now()}`,
            patientId: patient.id,
            patientName: `${patient.lastName}, ${patient.firstName}`,
            description: newTask,
            dueDate: newDueDate,
            status: TaskStatus.PENDIENTE,
            createdAt: new Date().toISOString(),
            completedAt: null,
        };
        onAdd(task);
        setNewTask('');
        setNewDueDate('');
    };

    const handleStatusChange = (task: Task) => {
        const newStatus = task.status === TaskStatus.PENDIENTE ? TaskStatus.HECHO : TaskStatus.PENDIENTE;
        const completedAt = newStatus === TaskStatus.HECHO ? new Date().toISOString() : null;
        onUpdate(task.id, { status: newStatus, completedAt });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Tareas para {patient.firstName} {patient.lastName}</h2>
                <div className="space-y-4 mt-4">
                    <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
                        {patientTasks.length > 0 ? patientTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={task.status === TaskStatus.HECHO}
                                        onChange={() => handleStatusChange(task)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div className="ml-3">
                                        <p className={`text-sm font-medium ${task.status === TaskStatus.HECHO ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{task.description}</p>
                                        <p className="text-xs text-slate-500">Vence: {task.dueDate}</p>
                                    </div>
                                </div>
                            </div>
                        )) : <p className="text-sm text-center text-slate-500">No hay tareas.</p>}
                    </div>
                    <div className="flex gap-2 border-t pt-4">
                        <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Nueva tarea..." className="flex-grow rounded-md border-slate-300" />
                        <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="rounded-md border-slate-300" />
                        <button onClick={handleAddTask} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Añadir</button>
                    </div>
                </div>
                <div className="flex justify-end pt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
// Placeholder for HistoryModal
const HistoryModal = ({ onClose, history }: { onClose: () => void; history: CrmHistoryEntry[]; }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Historial del CRM</h2>
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
                        <p className="text-center text-slate-500">No hay historial.</p>
                    )}
                </div>
                <div className="flex justify-end pt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
const FolderModal = ({ patient, folder, professionals, onSave, onClose }: { patient: ContactoCRM, folder: Folder | null, professionals: CrmSimpleProfessionals, onSave: (folder: Folder) => Promise<void>, onClose: () => void }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [currentFolder, setCurrentFolder] = useState<Folder>(() => {
        if (folder) return folder;

        const defaultSurgeon = professionals.surgeons[0];
        const defaultNutritionist = professionals.nutritionists[0];
        const defaultPsychologist = professionals.psychologists[0];

        return {
            id: `folder-${patient.id}`,
            patientId: patient.id,
            checklist: { consentimiento: ChecklistItemStatus.PENDIENTE, presupuesto: ChecklistItemStatus.PENDIENTE, informeCirujano: ChecklistItemStatus.PENDIENTE, informeNutricionista: ChecklistItemStatus.PENDIENTE, informePsicologo: ChecklistItemStatus.PENDIENTE },
            trackingState: FolderTrackingStatus.NO_PRESENTADA,
            requestDate: null,
            deliveredToPatientDate: null,
            submittedDate: null,
            authorizedDate: null,
            driveLink: '',
            notes: '',
            surgeon: defaultSurgeon || '',
            nutritionist: defaultNutritionist || '',
            psychologist: defaultPsychologist || '',
            scheduledSurgeryDate: null,
            scheduledSurgeryTime: null,
        };
    });

    useEffect(() => {
        if (!folder) { 
            api.getPacienteCompleto(patient.id, '').then(p => {
                if (p && p.filiatorio) {
                    setCurrentFolder(prev => ({
                        ...prev,
                        surgeon: p.filiatorio.cirujanoAsignado || professionals.surgeons[0],
                        nutritionist: p.filiatorio.nutricionistaAsignado || professionals.nutritionists[0],
                        psychologist: p.filiatorio.psicologoAsignado || professionals.psychologists[0],
                    }));
                }
            // FIX: Cast error object to Error to satisfy TypeScript compiler.
            }).catch(e => console.error("Could not fetch patient details for folder", e as Error));
        }
    }, [patient.id, folder, professionals]);

    const handleChecklistChange = (item: keyof Folder['checklist'], value: string) => {
        setCurrentFolder(prev => ({ ...prev, checklist: { ...prev.checklist, [item]: value as ChecklistItemStatus } }));
    };

    const handleFieldChange = (field: keyof Folder, value: string) => {
        setCurrentFolder(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(currentFolder);
        setIsSaving(false);
        onClose();
    };
    
    const checklistItems = [
        { key: 'consentimiento', label: 'Consentimiento' },
        { key: 'presupuesto', label: 'Presupuesto' },
        { key: 'informeCirujano', label: 'Informe Cirujano' },
        { key: 'informeNutricionista', label: 'Informe Nutricionista' },
        { key: 'informePsicologo', label: 'Informe Psicólogo' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">Gestionar Carpeta para {patient.firstName} {patient.lastName}</h2>
                </div>
                <div className="p-6 flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Columna 1: Checklist */}
                    <div className="md:col-span-1 space-y-4">
                        <h3 className="font-semibold text-slate-700">Checklist de Documentos</h3>
                        {checklistItems.map(item => (
                            <div key={item.key}>
                                <label className="text-sm font-medium text-slate-600">{item.label}</label>
                                <select
                                    value={currentFolder.checklist[item.key as keyof Folder['checklist']]}
                                    onChange={e => handleChecklistChange(item.key as keyof Folder['checklist'], e.target.value)}
                                    className="mt-1 block w-full rounded-md border-slate-300 text-sm"
                                >
                                    <option>Pendiente</option>
                                    <option>Recibido</option>
                                    <option>No Aplica</option>
                                </select>
                            </div>
                        ))}
                    </div>

                    {/* Columna 2: Tracking y Fechas */}
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="font-semibold text-slate-700">Seguimiento y Fechas Clave</h3>
                         <div>
                            <label className="text-sm font-medium text-slate-600">Estado General</label>
                            <select value={currentFolder.trackingState} onChange={e => handleFieldChange('trackingState', e.target.value)} className="mt-1 block w-full rounded-md border-slate-300">
                                {Object.values(FolderTrackingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-sm">Fecha Pedido</label><input type="date" value={currentFolder.requestDate || ''} onChange={e => handleFieldChange('requestDate', e.target.value)} className="mt-1 w-full rounded-md border-slate-300 text-sm" /></div>
                            <div><label className="text-sm">Fecha Entrega Paciente</label><input type="date" value={currentFolder.deliveredToPatientDate || ''} onChange={e => handleFieldChange('deliveredToPatientDate', e.target.value)} className="mt-1 w-full rounded-md border-slate-300 text-sm" /></div>
                            <div><label className="text-sm">Fecha Presentada</label><input type="date" value={currentFolder.submittedDate || ''} onChange={e => handleFieldChange('submittedDate', e.target.value)} className="mt-1 w-full rounded-md border-slate-300 text-sm" /></div>
                            <div><label className="text-sm">Fecha Autorizada</label><input type="date" value={currentFolder.authorizedDate || ''} onChange={e => handleFieldChange('authorizedDate', e.target.value)} className="mt-1 w-full rounded-md border-slate-300 text-sm" /></div>
                        </div>

                        <h3 className="font-semibold text-slate-700 pt-4">Equipo y Notas</h3>
                         <div className="grid grid-cols-3 gap-4">
                            <div><label className="text-sm">Cirujano</label><select value={currentFolder.surgeon} onChange={e => handleFieldChange('surgeon', e.target.value)} className="mt-1 w-full rounded-md border-slate-300 text-sm">{professionals.surgeons.map(s => <option key={s}>{s}</option>)}</select></div>
                            <div><label className="text-sm">Nutricionista</label><select value={currentFolder.nutritionist} onChange={e => handleFieldChange('nutritionist', e.target.value)} className="mt-1 w-full rounded-md border-slate-300 text-sm">{professionals.nutritionists.map(n => <option key={n}>{n}</option>)}</select></div>
                            <div><label className="text-sm">Psicólogo</label><select value={currentFolder.psychologist} onChange={e => handleFieldChange('psychologist', e.target.value)} className="mt-1 w-full rounded-md border-slate-300 text-sm">{professionals.psychologists.map(p => <option key={p}>{p}</option>)}</select></div>
                        </div>
                        <div><label className="text-sm">Link a Drive</label><input type="text" value={currentFolder.driveLink} onChange={e => handleFieldChange('driveLink', e.target.value)} placeholder="https://..." className="mt-1 w-full rounded-md border-slate-300 text-sm" /></div>
                        <div><label className="text-sm">Notas</label><textarea value={currentFolder.notes} onChange={e => handleFieldChange('notes', e.target.value)} rows={3} className="mt-1 w-full rounded-md border-slate-300 text-sm"></textarea></div>

                        {currentFolder.trackingState === FolderTrackingStatus.AUTORIZADA && (
                            <div className="pt-4 border-t">
                                <button className="w-full py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                                    Programar Cirugía
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end space-x-3">
                    <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">Cancelar</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">{isSaving ? 'Guardando...' : 'Guardar Carpeta'}</button>
                </div>
            </div>
        </div>
    );
};
// Placeholder for FoldersDashboardModal
const FoldersDashboardModal = ({ onClose, folders, onSelectPatient, contactos }: { onClose: () => void; folders: Folder[]; onSelectPatient: (patientId: string) => void; contactos: ContactoCRM[]; }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-5xl">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Dashboard de Carpetas</h2>
                <div className="max-h-[70vh] overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Paciente</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Obra Social</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Estado</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Fecha Autorizada</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Cirujano</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {folders.map(folder => {
                                const contacto = contactos.find(c => c.id === folder.patientId);
                                return (
                                    <tr key={folder.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onSelectPatient(folder.patientId)}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800">{contacto ? `${contacto.lastName}, ${contacto.firstName}`: folder.patientId}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{contacto?.socialInsurance || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{folder.trackingState}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{folder.authorizedDate || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{folder.surgeon}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end pt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
// Placeholder for SettingsCrmModal
const SettingsCrmModal = ({ onClose, professionals, templates, onSaveProfessionals, onSaveTemplates }: { onClose: () => void; professionals: CrmSimpleProfessionals; templates: MessageTemplate[]; onSaveProfessionals: (p: CrmSimpleProfessionals) => Promise<void>; onSaveTemplates: (t: MessageTemplate[]) => Promise<void>; }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Configuración del CRM</h2>
                <p className="text-slate-600 mb-4">Esta funcionalidad aún no está implementada.</p>
                <div className="flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
const ScheduleSurgeryModal = ({ onClose, patient, onSchedule }: { onClose: () => void, patient: ContactoCRM | null, onSchedule: (date: string, time: string) => void }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Programar Cirugía</h2>
                <p className="text-slate-600 mb-4">Programando para: {patient?.firstName} {patient?.lastName}</p>
                 <p className="text-slate-600 mb-4">Esta funcionalidad aún no está implementada.</p>
                <div className="flex justify-end pt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
const SurgeryDetailsModal = ({ onClose, patient }: { onClose: () => void, patient: ContactoCRM | null }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Detalles de Cirugía</h2>
                <p className="text-slate-600 mb-4">Detalles para: {patient?.firstName} {patient?.lastName}</p>
                 <p className="text-slate-600 mb-4">Esta funcionalidad aún no está implementada.</p>
                <div className="flex justify-end pt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

const MarkAsLostModal = ({ onClose, patient, onConfirm }: { 
    onClose: () => void; 
    patient: ContactoCRM | null; 
    onConfirm: (patientId: string, reason: LostReason) => void; 
}) => {
    const [reason, setReason] = useState<LostReason>(LostReason.NO_RESPONDE);
    if (!patient) return null;

    const handleConfirm = () => {
        onConfirm(patient.id, reason);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Marcar como Perdido</h2>
                <p className="text-sm text-slate-600 mb-4">
                    Está marcando a <span className="font-semibold">{patient.firstName} {patient.lastName}</span> como un contacto perdido. Por favor, seleccione un motivo.
                </p>
                <div>
                    <label htmlFor="lostReason" className="block text-sm font-medium text-slate-700">Motivo de la pérdida</label>
                    <select
                        id="lostReason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value as LostReason)}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
                    >
                        {Object.values(LostReason).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="flex justify-end space-x-3 pt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                        Confirmar Pérdida
                    </button>
                </div>
            </div>
        </div>
    );
};

const NewProspectModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        canalOrigen: ProspectoCanalOrigen.OTRO,
    });
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
        try {
            await api.createProspecto(formData as any);
            onSuccess();
        } catch (err) {
            setError('No se pudo guardar el prospecto.');
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Ingresar Nuevo Prospecto</h2>
                <p className="text-sm text-slate-600 mb-4">Cargue rápidamente un nuevo contacto interesado.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Nombre</label>
                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Apellido</label>
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Teléfono</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300"/>
                    </div>
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


type CrmActiveView = 'prospects' | 'not-operated' | 'operated' | 'tasks' | 'history';

interface CrmDashboardProps {
    onSelectPatient: (patient: PacienteFiliatorio) => void;
    selectedPatient: PacienteFiliatorio | null;
}

const getContactoCalculatedStatus = (contacto: ContactoCRM, inactivityThresholdDays: number = 30): ContactoStatus => {
    if (contacto.lostReason) {
        return ContactoStatus.PERDIDO;
    }

    if (!contacto.isPatient) {
        return ContactoStatus.ACTIVO; // Prospects are always active until lost
    }

    const now = new Date();
    const thresholdDate = subDays(now, inactivityThresholdDays);

    if (contacto.nextConsultation?.date && isAfter(new Date(contacto.nextConsultation.date.replace(/-/g, '/')), now)) {
        return ContactoStatus.ACTIVO;
    }

    if (contacto.lastConsultationDate && isAfter(new Date(contacto.lastConsultationDate.replace(/-/g, '/')), thresholdDate)) {
        return ContactoStatus.ACTIVO;
    }
    
    return ContactoStatus.INACTIVO;
};


export function CrmDashboard({ onSelectPatient, selectedPatient }: CrmDashboardProps) {
    const authContext = useContext(AuthContext);
    const [activeView, setActiveView] = useState<CrmActiveView>('not-operated');
    const [contactos, setContactos] = useState<ContactoCRM[]>([]);
    const [history, setHistory] = useState<CrmHistoryEntry[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [professionals, setProfessionals] = useState<CrmSimpleProfessionals>({ surgeons: [], nutritionists: [], psychologists: [] });
    const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'todos' | ContactoStatus>('todos');
    const [tagFilter, setTagFilter] = useState<'todos' | ContactoTag>('todos');
    const [taskStatusFilter, setTaskStatusFilter] = useState<'todos' | TaskStatus>(TaskStatus.PENDIENTE);
    const [seguimientoFilter, setSeguimientoFilter] = useState<'todos' | ProspectoEstadoSeguimiento>('todos');
    
    const [activeModal, setActiveModal] = useState<'whatsapp' | 'whatsapp-templates' | 'email' | 'tasks' | 'history' | 'folder' | 'folders-dashboard' | 'settings' | 'schedule-surgery' | 'surgery-details' | 'lost' | 'new-prospect' | 'convert-prospect' | null>(null);
    const [selectedContacto, setSelectedContacto] = useState<ContactoCRM | null>(null);
    const contactRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

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

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (selectedPatient && contactos.length > 0) {
            const contact = contactos.find(c => c.id === selectedPatient.idPaciente);
            if (contact) {
                const targetView = contact.tag === ContactoTag.POSBARIATRICO ? 'operated' : 'not-operated';
                setActiveView(targetView);
                setTimeout(() => {
                    contactRowRefs.current[contact.id]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                }, 100);
            }
        }
    }, [selectedPatient, contactos]);

    const handleMarkAsLost = async (patientId: string, reason: LostReason) => {
        try {
            const contact = contactos.find(c => c.id === patientId);
            const updates: Partial<ContactoCRM> = {
                lostReason: reason,
                lostTimestamp: new Date().toISOString()
            };
            if (contact && !contact.isPatient) {
                updates.estadoSeguimiento = ProspectoEstadoSeguimiento.DESCARTADO;
            }
            await api.updateContactoCRM(patientId, updates);
            setActiveModal(null);
            fetchData(); // Refetch to update UI
        } catch (error) {
            console.error("Failed to mark contact as lost:", error);
            alert("Hubo un error al actualizar el contacto.");
        }
    };
    
    const handleReactivate = (contacto: ContactoCRM) => {
        if (window.confirm(`¿Está seguro que desea reactivar a ${contacto.firstName} ${contacto.lastName}?`)) {
            const updates: Partial<ContactoCRM> = {
                lostReason: null,
                lostTimestamp: null
            };
            if (!contacto.isPatient) {
                updates.estadoSeguimiento = ProspectoEstadoSeguimiento.CONTACTADO;
            }
            api.updateContactoCRM(contacto.id, updates).then(() => {
                fetchData();
            }).catch(error => {
                console.error("Failed to reactivate contact:", error);
                alert("Hubo un error al reactivar el contacto.");
            });
        }
    };

    const handleOpenModal = (modal: any, contacto?: ContactoCRM) => {
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
            if (index > -1) {
                const newFolders = [...prev];
                newFolders[index] = savedFolder;
                return newFolders;
            }
            return [...prev, savedFolder];
        });
         if(savedFolder.trackingState === FolderTrackingStatus.ENTREGADA_AL_PACIENTE) {
            updatePacienteTag(folder.patientId, ContactoTag.CARPETA_ENTREGADA);
        }
        if(savedFolder.scheduledSurgeryDate) {
             updatePacienteTag(folder.patientId, ContactoTag.PERIOPERATORIO);
        }
    };
    
    const updatePacienteTag = async (idPaciente: string, newTag: ContactoTag) => {
        const contactIndex = contactos.findIndex(c => c.id === idPaciente);
        if (contactIndex === -1) return;

        const originalContactos = [...contactos];
        const updatedContactos = [...contactos];
        updatedContactos[contactIndex].tag = newTag;
        setContactos(updatedContactos);
        
        try {
             await api.updatePacienteTag(idPaciente, newTag, UserRole.ADMINISTRATIVO);
             fetchData();
        } catch (error) {
            console.error("Failed to update tag:", error);
            setContactos(originalContactos);
        }
    };

    const handleUpdateContacto = useCallback(async (id: string, updates: Partial<ContactoCRM>) => {
        try {
            const updated = await api.updateContactoCRM(id, updates);
            setContactos(prev => prev.map(c => c.id === id ? {...c, ...updated} : c));
        } catch (error) {
            console.error("Failed to update contact:", error);
            // Optionally show an error to the user
        }
    }, []);
    
    const filteredContactos = contactos.filter(c => {
        const searchLower = searchTerm.toLowerCase();
        const contactName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
        const matchesSearch = (
            contactName.includes(searchLower) ||
            (c.dni && c.dni.includes(searchLower)) ||
            (c.phone && c.phone.includes(searchLower))
        );

        const calculatedStatus = getContactoCalculatedStatus(c);
        const matchesStatus = statusFilter === 'todos' || calculatedStatus === statusFilter;
        
        const matchesTag = tagFilter === 'todos' || c.tag === tagFilter;
        const matchesSeguimiento = seguimientoFilter === 'todos' || c.estadoSeguimiento === seguimientoFilter;

        if (activeView === 'prospects') {
            return !c.isPatient && matchesSearch && matchesSeguimiento;
        }

        if (!matchesSearch || !matchesStatus || !matchesTag) return false;

        switch (activeView) {
            case 'not-operated':
                return c.isPatient && c.tag !== ContactoTag.POSBARIATRICO;
            case 'operated':
                return c.isPatient && c.tag === ContactoTag.POSBARIATRICO;
            default:
                return true;
        }
    });
    
    const filteredTasks = tasks.filter(task => {
        if (taskStatusFilter === 'todos') return true;
        return task.status === taskStatusFilter;
    });


    const NavButton = ({ view, label, icon }: { view: CrmActiveView, label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors duration-200 text-sm ${activeView === view ? 'bg-sky-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            {/* Modals */}
            {activeModal === 'whatsapp' && <WhatsAppModal onClose={() => setActiveModal(null)} patient={selectedContacto} onSend={(msg) => { alert('Mensaje enviado (simulado):\n' + msg); setActiveModal(null); }} />}
            {activeModal === 'whatsapp-templates' && <WhatsAppTemplatesModal onClose={() => setActiveModal(null)} currentTemplates={messageTemplates} onSave={handleSaveTemplates} />}
            {activeModal === 'email' && <EmailModal onClose={() => setActiveModal(null)} />}
            {activeModal === 'tasks' && <TasksModal onClose={() => setActiveModal(null)} patient={selectedContacto} tasks={tasks} onUpdate={handleUpdateTask} onAdd={handleAddTask} />}
            {activeModal === 'history' && <HistoryModal onClose={() => setActiveModal(null)} history={history} />}
            {activeModal === 'folder' && selectedContacto && <FolderModal patient={selectedContacto} folder={folders.find(f => f.patientId === selectedContacto.id) || null} professionals={professionals} onSave={handleSaveFolders} onClose={() => setActiveModal(null)} />}
            {activeModal === 'folders-dashboard' && <FoldersDashboardModal onClose={() => setActiveModal(null)} folders={folders} onSelectPatient={(patientId) => {
                const patient = contactos.find(c=>c.id === patientId);
                if (patient) {
                     api.getPacienteCompleto(patient.id, '').then(p => onSelectPatient(p.filiatorio));
                }
                setActiveModal(null);
            }} contactos={contactos} />}
            {activeModal === 'settings' && <SettingsCrmModal onClose={() => setActiveModal(null)} professionals={professionals} templates={messageTemplates} onSaveProfessionals={handleSaveProfessionals} onSaveTemplates={handleSaveTemplates} />}
            {activeModal === 'schedule-surgery' && <ScheduleSurgeryModal onClose={() => setActiveModal(null)} patient={selectedContacto} onSchedule={() => {}} />}
            {activeModal === 'surgery-details' && <SurgeryDetailsModal onClose={() => setActiveModal(null)} patient={selectedContacto} />}
            {activeModal === 'lost' && <MarkAsLostModal onClose={() => setActiveModal(null)} patient={selectedContacto} onConfirm={handleMarkAsLost} />}
            {activeModal === 'new-prospect' && <NewProspectModal onClose={() => setActiveModal(null)} onSuccess={() => { fetchData(); setActiveModal(null); }} />}
            {activeModal === 'convert-prospect' && selectedContacto && (
                <NewPatientModal 
                    onClose={() => setActiveModal(null)} 
                    onSuccess={() => { fetchData(); setActiveModal(null); }}
                    initialData={{
                        apellido: selectedContacto.lastName,
                        nombres: selectedContacto.firstName,
                        telefono: selectedContacto.phone,
                        email: selectedContacto.email,
                    }}
                    prospectoId={selectedContacto.id}
                />
            )}
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Panel Principal</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => setActiveModal('new-prospect')} className="flex items-center text-sm font-medium text-white bg-blue-600 px-3 py-2 rounded-md shadow-sm hover:bg-blue-700"><UserPlusIcon className="w-5 h-5 mr-1" />Ingresar Prospecto</button>
                    <button onClick={() => setActiveModal('folders-dashboard')} className="flex items-center text-sm font-medium text-slate-700 bg-white px-3 py-2 rounded-md shadow-sm border hover:bg-slate-50"><FolderIcon />Ver Carpetas</button>
                    <button onClick={() => setActiveModal('history')} className="flex items-center text-sm font-medium text-slate-700 bg-white px-3 py-2 rounded-md shadow-sm border hover:bg-slate-50"><HistoryIcon />Historial</button>
                    <button onClick={() => setActiveModal('whatsapp-templates')} className="flex items-center text-sm font-medium text-slate-700 bg-white px-3 py-2 rounded-md shadow-sm border hover:bg-slate-50"><ClipboardCheckIcon/>Gestionar Plantillas</button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                     <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                        <NavButton view="prospects" label="Prospectos" icon={<UsersIcon />} />
                        <NavButton view="not-operated" label="No Operados" icon={<UsersIcon />} />
                        <NavButton view="operated" label="Operados" icon={<UsersIcon />} />
                        <NavButton view="tasks" label="Tareas" icon={<ClipboardCheckIcon />} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {activeView === 'prospects' ? (
                            <select
                                value={seguimientoFilter}
                                onChange={(e) => setSeguimientoFilter(e.target.value as any)}
                                className="block w-full sm:w-auto rounded-md border-slate-300 shadow-sm text-sm"
                            >
                                <option value="todos">Todos los Seguimientos</option>
                                {Object.values(ProspectoEstadoSeguimiento).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        ) : activeView !== 'tasks' ? (
                        <>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="block w-full sm:w-auto rounded-md border-slate-300 shadow-sm text-sm"
                        >
                            <option value="todos">Todos los Estados</option>
                            <option value={ContactoStatus.ACTIVO}>Activo</option>
                            <option value={ContactoStatus.INACTIVO}>Inactivo</option>
                            <option value={ContactoStatus.PERDIDO}>Perdido</option>
                        </select>
                        <select
                            value={tagFilter}
                            onChange={(e) => setTagFilter(e.target.value as any)}
                            className="block w-full sm:w-auto rounded-md border-slate-300 shadow-sm text-sm"
                        >
                            <option value="todos">Todas las Etiquetas</option>
                            {Object.values(ContactoTag).map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                        </>
                        ) : (
                             <select
                                value={taskStatusFilter}
                                onChange={(e) => setTaskStatusFilter(e.target.value as any)}
                                className="block w-full sm:w-auto rounded-md border-slate-300 shadow-sm text-sm"
                            >
                                <option value="todos">Todas las Tareas</option>
                                <option value={TaskStatus.PENDIENTE}>Pendiente</option>
                                <option value={TaskStatus.HECHO}>Hecho</option>
                                <option value={TaskStatus.POSPUESTO}>Pospuesto</option>
                            </select>
                        )}
                         {(activeView === 'prospects' || activeView === 'not-operated' || activeView === 'operated') && (
                            <div className="relative w-full sm:w-64">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <SearchIcon />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, DNI o tel..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full rounded-md border-slate-300 pl-9"
                                />
                            </div>
                         )}
                    </div>
                </div>

                {isLoading ? (
                    <p className="text-center p-8 text-slate-500">Cargando contactos...</p>
                ) : (
                    <div className="overflow-x-auto">
                        {activeView === 'prospects' && <ProspectoTable contactos={filteredContactos} onOpenModal={handleOpenModal} onUpdateContacto={handleUpdateContacto} onReactivate={handleReactivate} />}
                        {activeView === 'not-operated' && <ContactoTable contactos={filteredContactos} onOpenModal={handleOpenModal} onReactivate={handleReactivate} onSelectPatient={onSelectPatient} contactRowRefs={contactRowRefs} selectedPatientId={selectedPatient?.idPaciente} folders={folders} tasks={tasks} />}
                        {activeView === 'operated' && <OperatedContactoTable contactos={filteredContactos} onOpenModal={handleOpenModal} onReactivate={handleReactivate} onSelectPatient={onSelectPatient} contactRowRefs={contactRowRefs} selectedPatientId={selectedPatient?.idPaciente} folders={folders} tasks={tasks} />}
                        {activeView === 'tasks' && <TasksView tasks={filteredTasks} onUpdateTask={handleUpdateTask} onSelectPatient={onSelectPatient} contactos={contactos} onOpenModal={handleOpenModal} />}
                    </div>
                )}
            </div>
        </div>
    );
}

// Table for prospects
const ProspectoTable = ({ contactos, onOpenModal, onUpdateContacto, onReactivate }: { contactos: ContactoCRM[], onOpenModal: (modal: any, contacto: ContactoCRM) => void, onUpdateContacto: (id: string, updates: Partial<ContactoCRM>) => void, onReactivate: (contacto: ContactoCRM) => void }) => (
    <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
            <tr>
                {['Contacto', 'Canal de Origen', 'Fecha Ingreso', 'Estado Seguimiento', 'Acciones'].map(header => (
                    <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{header}</th>
                ))}
            </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
            {contactos.map(contacto => (
                <ProspectoRow
                    key={contacto.id}
                    contacto={contacto}
                    onOpenModal={onOpenModal}
                    onUpdateContacto={onUpdateContacto}
                    onReactivate={onReactivate}
                />
            ))}
        </tbody>
    </table>
);

type ProspectoRowProps = {
    contacto: ContactoCRM;
    onOpenModal: (modal: any, contacto: ContactoCRM) => void;
    onUpdateContacto: (id: string, updates: Partial<ContactoCRM>) => void;
    onReactivate: (contacto: ContactoCRM) => void;
};

const ProspectoRow: React.FC<ProspectoRowProps> = ({ contacto, onOpenModal, onUpdateContacto, onReactivate }) => {
    const estadoInfo = ESTADOS_SEGUIMIENTO_LIST.find(e => e.value === contacto.estadoSeguimiento);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    const displayName = (contacto.lastName || contacto.firstName) 
        ? `${contacto.lastName || '(Sin Apellido)'}, ${contacto.firstName || ''}`.trim()
        : contacto.phone || contacto.email || '(Sin Datos)';
    
    const contactInfo = (contacto.lastName || contacto.firstName)
        ? contacto.phone || contacto.email
        : '';
        
    const handleStatusChange = (newStatus: ProspectoEstadoSeguimiento) => {
        onUpdateContacto(contacto.id, { estadoSeguimiento: newStatus });
        setIsStatusDropdownOpen(false);
    };

    return (
        <tr>
            <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-900">{displayName}</div>
                <div className="text-sm text-slate-500">{contactInfo}</div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">{contacto.canalOrigen || '-'}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{contacto.startDate}</td>
            <td className="px-4 py-4 whitespace-nowrap">
                <div className="relative inline-block text-left">
                    <button
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        onBlur={() => setTimeout(() => setIsStatusDropdownOpen(false), 150)}
                        disabled={!!contacto.lostReason}
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${estadoInfo?.color || 'bg-slate-100 text-slate-800'} flex items-center gap-1 disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                        {contacto.estadoSeguimiento}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isStatusDropdownOpen && (
                        <div className="origin-top-right absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                                {Object.values(ProspectoEstadoSeguimiento).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(status)}
                                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                {contacto.lostReason ? (
                     <button onClick={() => onReactivate(contacto)} title="Reactivar Prospecto" className={`p-2.5 text-white bg-slate-500 rounded-full hover:opacity-80`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
                    </button>
                ) : (
                    <div className="flex items-center space-x-2">
                        <button onClick={() => onOpenModal('convert-prospect', contacto)} className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Convertir</button>
                        <button onClick={() => onOpenModal('whatsapp', contacto)} title="Generar WhatsApp" className="p-2.5 text-white bg-green-500 rounded-full hover:opacity-80"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" /><path d="M12.93 11.07a1 1 0 01-1.41-1.41l3-3a1 1 0 011.41 1.41l-3 3z" /><path d="M7.07 12.93a1 1 0 01-1.41-1.41l3-3a1 1 0 011.41 1.41l-3 3z" /><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /></svg></button>
                        <button onClick={() => onOpenModal('tasks', contacto)} title="Añadir Tarea" className="p-2.5 text-white bg-blue-500 rounded-full hover:opacity-80"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg></button>
                        <button onClick={() => onOpenModal('history', contacto)} title="Ver Historial CRM" className="p-2.5 text-white bg-purple-500 rounded-full hover:opacity-80"><HistoryIcon className="h-4 w-4 mr-0" /></button>
                        <button onClick={() => onOpenModal('lost', contacto)} title="Marcar como Perdido" className="p-2.5 text-white bg-red-500 rounded-full hover:opacity-80"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></button>
                    </div>
                )}
            </td>
        </tr>
    );
};


// Table for patients (not-operated)
const ContactoTable = ({ contactos, onOpenModal, onReactivate, onSelectPatient, contactRowRefs, selectedPatientId, folders, tasks }: { contactos: ContactoCRM[], onOpenModal: (modal: any, contacto: ContactoCRM) => void, onReactivate: (contacto: ContactoCRM) => void, onSelectPatient: (p: any) => void, contactRowRefs: React.MutableRefObject<Record<string, HTMLTableRowElement | null>>, selectedPatientId?: string | null, folders: Folder[], tasks: Task[] }) => (
    <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
            <tr>
                {['Contacto', 'Etiqueta', 'Prioridad', 'Estado', 'Consultas', 'Acciones'].map(header => (
                    <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{header}</th>
                ))}
            </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
            {contactos.map(contacto => (
                <ContactoRow
                    key={contacto.id}
                    contacto={contacto}
                    onOpenModal={onOpenModal}
                    onReactivate={onReactivate}
                    onSelectPatient={onSelectPatient}
                    ref={el => { contactRowRefs.current[contacto.id] = el; }}
                    isSelected={selectedPatientId === contacto.id}
                    hasFolder={folders.some(f => f.patientId === contacto.id)}
                    hasPendingTasks={tasks.some(t => t.patientId === contacto.id && t.status === TaskStatus.PENDIENTE)}
                />
            ))}
        </tbody>
    </table>
);

// Table for operated patients
const OperatedContactoTable = ({ contactos, onOpenModal, onReactivate, onSelectPatient, contactRowRefs, selectedPatientId, folders, tasks }: { contactos: ContactoCRM[], onOpenModal: (modal: any, contacto: ContactoCRM) => void, onReactivate: (contacto: ContactoCRM) => void, onSelectPatient: (p: any) => void, contactRowRefs: React.MutableRefObject<Record<string, HTMLTableRowElement | null>>, selectedPatientId?: string | null, folders: Folder[], tasks: Task[] }) => (
    <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
            <tr>
                 {['Contacto', 'Etapa Post-Op', 'Prioridad', 'Fecha Cx', 'Consultas', 'Acciones'].map(header => (
                    <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{header}</th>
                ))}
            </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
             {contactos.map(contacto => (
                <ContactoRow
                    key={contacto.id}
                    contacto={contacto}
                    onOpenModal={onOpenModal}
                    onReactivate={onReactivate}
                    onSelectPatient={onSelectPatient}
                    isOperatedView={true}
                    ref={el => { contactRowRefs.current[contacto.id] = el; }}
                    isSelected={selectedPatientId === contacto.id}
                    hasFolder={folders.some(f => f.patientId === contacto.id)}
                    hasPendingTasks={tasks.some(t => t.patientId === contacto.id && t.status === TaskStatus.PENDIENTE)}
                />
            ))}
        </tbody>
    </table>
);

const ContactoRow = React.forwardRef<HTMLTableRowElement, { contacto: ContactoCRM, onOpenModal: (modal: any, contacto: ContactoCRM) => void, onReactivate: (contacto: ContactoCRM) => void, onSelectPatient: (p: any) => void, isOperatedView?: boolean, isSelected?: boolean, hasFolder: boolean, hasPendingTasks: boolean }>(
    ({ contacto, onOpenModal, onReactivate, onSelectPatient, isOperatedView, isSelected, hasFolder, hasPendingTasks }, ref) => {
        const handleSelect = () => {
            api.getPacienteCompleto(contacto.id, '').then(p => onSelectPatient(p.filiatorio));
        };
        return (
            <tr ref={ref} className={`transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                <td className="px-4 py-4 whitespace-nowrap">
                    <button onClick={handleSelect} className="text-left hover:underline">
                        <div className="text-sm font-medium text-slate-900">{contacto.lastName}, {contacto.firstName}</div>
                        <div className="text-sm text-slate-500">{contacto.socialInsurance}</div>
                    </button>
                </td>
                <td className="px-4 py-4 whitespace-nowrap"><TagBadge tag={isOperatedView ? getPostOpStage(contacto.surgeryDate) : contacto.tag!} /></td>
                <td className="px-4 py-4 whitespace-nowrap"><PrioritySelector priority={contacto.priority} /></td>
                <td className="px-4 py-4 whitespace-nowrap">{isOperatedView ? (contacto.surgeryDate || '-') : <StatusBadge status={getContactoCalculatedStatus(contacto)} />}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div>Última: {contacto.lastConsultationDate || '-'}</div>
                    <div>Próxima: {contacto.nextConsultation?.date || '-'}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <ContactoActions contacto={contacto} onOpenModal={onOpenModal} onReactivate={onReactivate} hasFolder={hasFolder} hasPendingTasks={hasPendingTasks} isOperatedView={isOperatedView} />
                </td>
            </tr>
        )
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

const TasksView = ({ tasks, onUpdateTask, onSelectPatient, contactos, onOpenModal }: { tasks: Task[], onUpdateTask: (id: string, updates: Partial<Task>) => void, onSelectPatient: (p: PacienteFiliatorio) => void, contactos: ContactoCRM[], onOpenModal: (modal: any, contacto: ContactoCRM) => void }) => {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-16 bg-slate-50 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-700">No hay tareas que coincidan con el filtro.</h3>
                <p className="text-slate-500 mt-2">¡Todo en orden!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4">
            {tasks.map(task => {
                const contacto = contactos.find(c => c.id === task.patientId);
                const isOverdue = task.status === TaskStatus.PENDIENTE && isBefore(new Date(task.dueDate), new Date());
                
                return (
                    <div key={task.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-center p-4 bg-white rounded-lg shadow-sm border">
                        <div className="col-span-12 md:col-span-5">
                            <p className="font-semibold text-slate-800">{task.description}</p>
                            <button 
                                onClick={() => contacto && api.getPacienteCompleto(contacto.id, '').then(p => onSelectPatient(p.filiatorio))} 
                                className="text-sm font-medium text-indigo-600 hover:underline"
                            >
                                {task.patientName}
                            </button>
                        </div>
                        <div className="col-span-6 md:col-span-2">
                            <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>{task.dueDate}</p>
                            <p className="text-xs text-slate-500">Vencimiento</p>
                        </div>
                        <div className="col-span-6 md:col-span-2">
                            <TaskStatusBadge status={task.status} />
                        </div>
                        <div className="col-span-12 md:col-span-3 flex items-center justify-start md:justify-end space-x-2">
                            {task.status !== TaskStatus.HECHO && (
                                <button onClick={() => onUpdateTask(task.id, { status: TaskStatus.HECHO, completedAt: new Date().toISOString() })} className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Completar</button>
                            )}
                            {task.status === TaskStatus.PENDIENTE && (
                                <button onClick={() => onUpdateTask(task.id, { status: TaskStatus.POSPUESTO })} className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 rounded-md hover:bg-amber-600">Posponer</button>
                            )}
                            {contacto && (
                                <>
                                    <button onClick={() => onOpenModal('history', contacto)} title="Historial" className="p-2 text-slate-500 bg-slate-100 rounded-md hover:bg-slate-200"><HistoryIcon className="h-4 w-4 mr-0"/></button>
                                    <button onClick={() => onOpenModal('whatsapp', contacto)} title="WhatsApp" className="p-2 text-slate-500 bg-slate-100 rounded-md hover:bg-slate-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" /><path d="M12.93 11.07a1 1 0 01-1.41-1.41l3-3a1 1 0 011.41 1.41l-3 3z" /><path d="M7.07 12.93a1 1 0 01-1.41-1.41l3-3a1 1 0 011.41 1.41l-3 3z" /><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /></svg></button>
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
    if (Object.values(PostOpStage).map(s => normalizeString(s)).includes(normalizedTag)) {
        color = 'bg-cyan-100 text-cyan-800';
    }

    return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${color}`}>{tag}</span>;
};
const PrioritySelector = ({ priority }: { priority: Priority }) => {
    const colors = { [Priority.ALTA]: 'bg-red-500', [Priority.MEDIA]: 'bg-yellow-500', [Priority.NORMAL]: 'bg-blue-500' };
    return <span className={`w-3 h-3 rounded-full inline-block ${colors[priority]}`} title={`Prioridad: ${priority}`}></span>;
};
const StatusBadge = ({ status }: { status: ContactoStatus }) => {
    const colorMap = {
        [ContactoStatus.ACTIVO]: 'text-green-800',
        [ContactoStatus.INACTIVO]: 'text-amber-800',
        [ContactoStatus.PERDIDO]: 'text-red-800',
    };
    const color = colorMap[status] || 'text-slate-800';
    return <span className={`text-xs font-medium ${color}`}>● {status}</span>
};

const ContactoActions = ({ contacto, onOpenModal, onReactivate, hasFolder, hasPendingTasks, isOperatedView }: { contacto: ContactoCRM, onOpenModal: (modal: any, contacto: ContactoCRM) => void, onReactivate: (contacto: ContactoCRM) => void, hasFolder: boolean, hasPendingTasks: boolean, isOperatedView?: boolean }) => {
    const allActionButtons = [
        { modal: 'whatsapp', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" /><path d="M12.93 11.07a1 1 0 01-1.41-1.41l3-3a1 1 0 011.41 1.41l-3 3z" /><path d="M7.07 12.93a1 1 0 01-1.41-1.41l3-3a1 1 0 011.41 1.41l-3 3z" /><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /></svg>, title: 'Generar WhatsApp con IA', color: 'bg-green-500', pulse: false },
        { modal: 'folder', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>, title: 'Gestionar Carpeta', color: 'bg-amber-500', pulse: hasFolder },
        { modal: 'tasks', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>, title: 'Ver/Añadir Tareas', color: 'bg-blue-500', pulse: hasPendingTasks },
        { modal: 'history', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, title: 'Ver Historial CRM', color: 'bg-purple-500', pulse: false },
        { modal: 'lost', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>, title: 'Marcar como Perdido', color: 'bg-red-500', pulse: false },
    ];
    
    const actionButtons = isOperatedView
        ? allActionButtons.filter(btn => btn.modal !== 'folder')
        : allActionButtons;

    if (contacto.lostReason) {
        return (
            <button onClick={() => onReactivate(contacto)} title="Reactivar Contacto" className={`p-2.5 text-white bg-slate-500 rounded-full hover:opacity-80 transition-all duration-200 transform hover:scale-110`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
            </button>
        )
    }

    return (
        <div className="flex items-center space-x-2">
           {actionButtons.map(btn => {
                const pulseClass = btn.pulse ? (btn.color === 'bg-amber-500' ? 'animate-pulse-amber' : 'animate-pulse-blue') : '';
                return (
                    <button key={btn.modal} onClick={() => onOpenModal(btn.modal, contacto)} title={btn.title} className={`p-2.5 text-white ${btn.color} rounded-full hover:opacity-80 transition-all duration-200 transform hover:scale-110 ${pulseClass}`}>
                        {btn.icon}
                    </button>
                )
           })}
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


// MAIN DASHBOARD COMPONENT (CLINICAL VIEW)
interface DashboardProps {
  onSelectPatient: (patient: PacienteFiliatorio) => void;
}

const LiquidacionDiariaModal = ({ onClose }: { onClose: () => void }) => {
    const [turnos, setTurnos] = useState<TurnoDiario[]>([]);
    const [fecha, setFecha] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [profesionales, setProfesionales] = useState<Profesional[]>([]);

    useEffect(() => {
        api.getProfesionalesAdmin().then(setProfesionales);
    }, []);

    useEffect(() => {
        setIsLoading(true);
        api.getTurnosDiariosTodosProfesionales(fecha)
            .then(setTurnos)
            .finally(() => setIsLoading(false));
    }, [fecha]);

    const getProfesionalNombre = (email: string) => {
        const prof = profesionales.find(p => p.email === email);
        return prof ? `${prof.nombres} ${prof.apellido}` : email;
    }

    const turnosAtendidos = turnos.filter(t => t.estado === EstadoTurnoDia.ATENDIDO);

    const summary = useMemo(() => {
        const totalRecaudado = turnosAtendidos.reduce((acc, t) => acc + (t.valorCobrado || 0), 0);
        
        // FIX: Add explicit type for the accumulator to resolve 'unknown' type error.
        const porProfesional = turnosAtendidos.reduce<Record<string, { count: number, total: number }>>((acc, t) => {
            if (!acc[t.profesionalEmail]) {
                acc[t.profesionalEmail] = { count: 0, total: 0 };
            }
            acc[t.profesionalEmail].count++;
            acc[t.profesionalEmail].total += (t.valorCobrado || 0);
            return acc;
        }, {});

        return { totalRecaudado, porProfesional };
    }, [turnosAtendidos]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b bg-slate-50 no-print">
                    <h2 className="text-xl font-bold text-slate-800">Cierre de Caja Diario (Liquidación)</h2>
                </div>
                <div className="p-6 flex-grow overflow-y-auto print-section">
                    <div className="flex justify-between items-center mb-4 no-print">
                        <div className="flex items-center gap-2">
                            <label htmlFor="fecha-liquidacion" className="text-sm font-medium">Fecha:</label>
                            <input
                                id="fecha-liquidacion"
                                type="date"
                                value={format(fecha, 'yyyy-MM-dd')}
                                onChange={e => setFecha(new Date(e.target.value.replace(/-/g, '/')))}
                                className="rounded-md border-slate-300"
                            />
                        </div>
                    </div>
                    <div className="border-b pb-4 mb-4">
                        <h3 className="text-2xl font-bold text-center">Liquidación del {format(fecha, 'dd/MM/yyyy')}</h3>
                    </div>
                    {isLoading ? <p>Cargando...</p> : (
                        <div>
                            <h4 className="text-lg font-semibold mb-2">Resumen General</h4>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">Pacientes Atendidos</p>
                                    <p className="text-2xl font-bold text-blue-900">{turnosAtendidos.length}</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <p className="text-sm text-green-800">Total Recaudado</p>
                                    <p className="text-2xl font-bold text-green-900">${summary.totalRecaudado.toLocaleString('es-AR')}</p>
                                </div>
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
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Hora</th>
                                        <th className="px-4 py-2 text-left">Paciente</th>
                                        <th className="px-4 py-2 text-left">Profesional</th>
                                        <th className="px-4 py-2 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {turnosAtendidos.filter(t => t.valorCobrado && t.valorCobrado > 0).map(t => (
                                        <tr key={t.idTurno}>
                                            <td className="px-4 py-2">{format(new Date(t.fechaTurno), 'HH:mm')}</td>
                                            <td className="px-4 py-2">{t.paciente.apellido}, {t.paciente.nombres}</td>
                                            <td className="px-4 py-2">{getProfesionalNombre(t.profesionalEmail)}</td>
                                            <td className="px-4 py-2 text-right">${(t.valorCobrado || 0).toLocaleString('es-AR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                 <div className="p-4 bg-slate-50 border-t flex justify-end space-x-3 no-print">
                    <button onClick={handlePrint} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border rounded-md">Imprimir</button>
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

function useDebouncedCallback<A extends any[]>(
  callback: (...args: A) => void,
  wait: number
) {
  const argsRef = useRef<A | undefined>(undefined);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function cleanup() {
    if(timeout.current) {
      clearTimeout(timeout.current);
    }
  }

  useEffect(() => {
    return cleanup;
  }, []);

  return useCallback((...args: A) => {
    argsRef.current = args;
    cleanup();
    timeout.current = setTimeout(() => {
      if(argsRef.current) {
        callback(...argsRef.current);
      }
    }, wait);
  }, [callback, wait]);
}

const TorreDeControl = ({ onSelectPatient }: { onSelectPatient: (patient: PacienteFiliatorio) => void }) => {
    const authContext = useContext(AuthContext);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [turnos, setTurnos] = useState<TurnoDiario[]>([]);
    const [profesionales, setProfesionales] = useState<Profesional[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showGestionProfs, setShowGestionProfs] = useState(false);

    const user = authContext!.user!;

    const fetchData = useCallback(() => {
        setIsLoading(true);
        Promise.all([
            api.getProfesionales(),
            api.getTurnosDiariosTodosProfesionales(currentDate)
        ]).then(([profs, dailyTurnos]) => {
            setProfesionales(profs);
            setTurnos(dailyTurnos);
            setIsLoading(false);
        }).catch(err => {
            console.error(err);
            setIsLoading(false);
        });
    }, [currentDate]);

    useEffect(() => {
       fetchData();
    }, [fetchData]);
    
    const handleUpdateTurno = useCallback(async (turnoId: string, updates: Partial<Turno>) => {
        try {
            const updatedTurno = await api.updateDetallesTurno(turnoId, updates, user);
            setTurnos(currentTurnos => currentTurnos.map(t => 
                t.idTurno === turnoId ? { ...t, ...updatedTurno } : t
            ));
        } catch (error) {
            console.error("Failed to update turno:", error);
            fetchData();
        }
    }, [user, fetchData]);

    const debouncedNotaUpdate = useDebouncedCallback((turnoId: string, nota: string) => {
        handleUpdateTurno(turnoId, { notaInterna: nota });
    }, 800);

    const debouncedValorUpdate = useDebouncedCallback((turnoId: string, valor: number) => {
        handleUpdateTurno(turnoId, { valorCobrado: valor });
    }, 800);

    const turnosPorProfesional = useMemo(() => {
        return profesionales.map(prof => ({
            ...prof,
            turnos: turnos.filter(t => t.profesionalEmail === prof.email)
                         .sort((a, b) => new Date(a.fechaTurno).getTime() - new Date(b.fechaTurno).getTime())
        }));
    }, [turnos, profesionales]);

    const changeDay = (offset: number) => {
        if (offset === 0) {
            setCurrentDate(startOfDay(new Date()));
        } else {
            setCurrentDate(d => addDays(d, offset));
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md flex flex-col" style={{ height: 'calc(100vh - 12rem)' }}>
            <div className="flex items-center justify-between p-4 border-b bg-slate-50">
                <h3 className="text-lg font-semibold text-slate-700 capitalize">
                    Torre de Control - {format(currentDate, 'eeee, dd MMMM yyyy', { locale: es })}
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowGestionProfs(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                        Gestionar Profesionales
                    </button>
                    <button onClick={() => changeDay(-1)} className="p-2 rounded-full hover:bg-slate-200 transition-colors"><ChevronLeftIcon/></button>
                    <button onClick={() => changeDay(0)} className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white rounded-md shadow-sm hover:bg-slate-50 border border-slate-300">
                        Hoy
                    </button>
                    <button onClick={() => changeDay(1)} className="p-2 rounded-full hover:bg-slate-200 transition-colors"><ChevronRightIcon/></button>
                </div>
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
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-800">{format(new Date(turno.fechaTurno), 'HH:mm')}</p>
                                                        <div className="flex items-center gap-1 mt-1">
                                                            {turno.esVideoconsulta && <span title="Videoconsulta"><VideoCameraIcon /></span>}
                                                            {turno.esSobreturno && <span title="Sobreturno"><PlusCircleIcon /></span>}
                                                            <button onClick={() => onSelectPatient(turno.paciente)} className="block text-left font-medium text-sm text-indigo-600 hover:underline truncate">
                                                                {turno.paciente.apellido}, {turno.paciente.nombres}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${estadoInfo.colorFondo}`}>{estadoInfo.texto}</span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        <label htmlFor={`nota-${turno.idTurno}`} className="sr-only">Nota</label>
                                                        <input type="text" id={`nota-${turno.idTurno}`} defaultValue={turno.notaInterna || ''} onChange={e => debouncedNotaUpdate(turno.idTurno, e.target.value)} placeholder="Nota..." className="w-full p-1 rounded border-slate-300"/>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <div className="relative flex-grow">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1.5"><span className="text-gray-500">$</span></div>
                                                            <input type="number" defaultValue={turno.valorCobrado || ''} onChange={e => debouncedValorUpdate(turno.idTurno, e.target.valueAsNumber)} placeholder="Valor" className="w-full p-1 pl-4 rounded border-slate-300"/>
                                                        </div>
                                                        <select value={turno.metodoPago || ''} onChange={e => handleUpdateTurno(turno.idTurno, { metodoPago: e.target.value as any })} className="p-1 rounded border-slate-300">
                                                            <option value="">...</option>
                                                            <option value="Efectivo">Efectivo</option>
                                                            <option value="Tarjeta">Tarjeta</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {(turno.estado === EstadoTurnoDia.AGENDADO || turno.estado === EstadoTurnoDia.CONFIRMADO) && (
                                                    <div className="pt-2 border-t border-slate-300/50">
                                                        <button onClick={() => handleUpdateTurno(turno.idTurno, { estado: EstadoTurnoDia.EN_ESPERA })} className="w-full flex items-center justify-center text-xs font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 px-2 py-1.5 rounded-md transition-colors">
                                                            <CheckCircleIcon/>Registrar Llegada
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    }) : (
                                        <div className="text-center text-xs text-slate-400 pt-6"><p>Sin turnos</p></div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showGestionProfs && (
                <GestionProfesionalesModal onClose={() => { setShowGestionProfs(false); fetchData(); }} />
            )}
        </div>
    );
};

const TareasPendientesWidget = ({ onSelectPatient, allPatients }: { onSelectPatient: (patient: PacienteFiliatorio) => void, allPatients: PacienteFiliatorio[] }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const authContext = useContext(AuthContext);
    const user = authContext!.user!;

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            api.getTasksForUser(user.email)
                .then(setTasks)
                .catch(err => console.error("Error fetching user tasks:", err))
                .finally(() => setIsLoading(false));
        }
    }, [user]);

    const handleSelectPatient = (patientId: string) => {
        const patient = allPatients.find(p => p.idPaciente === patientId);
        if (patient) {
            onSelectPatient(patient);
        } else {
            console.warn(`Patient with ID ${patientId} not found in allPatients list.`);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                <ClipboardCheckIcon />
                Mis Tareas Pendientes
            </h3>
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
                                        <button onClick={() => handleSelectPatient(task.patientId)} className="text-sm text-indigo-600 hover:underline">
                                            Paciente: {task.patientName}
                                        </button>
                                    </div>
                                    <button className="flex-shrink-0 ml-4 px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-full hover:bg-green-700">
                                        Marcar como Hecha
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

function MedicoDashboard({ onSelectPatient }: DashboardProps) {
    const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
    const [allPatients, setAllPatients] = useState<PacienteFiliatorio[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.getPacientes(UserRole.MEDICO)
            .then(setAllPatients)
            .finally(() => setIsLoading(false));
    }, []);

    const PatientSearchBar = () => {
        const [query, setQuery] = useState('');
        const [results, setResults] = useState<PacienteFiliatorio[]>([]);
        const [isOpen, setIsOpen] = useState(false);

        useEffect(() => {
            if (query.length < 2) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            const lowerQuery = normalizeString(query);
            const filtered = allPatients.filter(p => 
                normalizeString(`${p.apellido} ${p.nombres}`).includes(lowerQuery) ||
                p.dni.includes(lowerQuery)
            );
            setResults(filtered);
            setIsOpen(true);
        }, [query, allPatients]);

        const handleSelect = (patient: PacienteFiliatorio) => {
            setQuery('');
            setResults([]);
            setIsOpen(false);
            onSelectPatient(patient);
        };

        return (
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon />
                </div>
                <input
                    type="text"
                    placeholder="Buscar paciente por nombre, apellido o DNI..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    onFocus={() => query.length > 1 && setIsOpen(true)}
                    className="block w-full rounded-md border-slate-300 pl-10 shadow-sm text-base p-3"
                />
                {isOpen && results.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-y-auto border border-slate-200">
                        <ul>
                            {results.map(patient => (
                                <li 
                                    key={patient.idPaciente}
                                    onClick={() => handleSelect(patient)}
                                    className="p-3 hover:bg-slate-100 cursor-pointer border-b last:border-b-0"
                                >
                                    <p className="font-medium text-slate-800">{patient.apellido}, {patient.nombres}</p>
                                    <p className="text-sm text-slate-500">DNI: {patient.dni}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                 {isOpen && results.length === 0 && query.length > 1 && (
                     <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md p-4 border border-slate-200 text-sm text-slate-500">
                        No se encontraron pacientes.
                    </div>
                 )}
            </div>
        );
    };

    if (isLoading) {
        return <div className="text-center p-10 text-slate-500">Cargando...</div>
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Panel del Profesional</h2>
            
            <PatientSearchBar />

            <TareasPendientesWidget onSelectPatient={onSelectPatient} allPatients={allPatients} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" style={{minHeight: 'calc(100vh - 18rem)'}}>
                <div className="xl:col-span-1">
                    <AgendaProfesional onDateSelect={setSelectedDate} selectedDate={selectedDate} />
                </div>
                <div className="xl:col-span-2">
                    <VistaDiariaProfesional onSelectPatient={onSelectPatient} date={selectedDate} />
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({ onSelectPatient }: DashboardProps) {
  const authContext = useContext(AuthContext);
  const user = authContext!.user!;

  return (
    <div>
        {user.rol === UserRole.ADMINISTRATIVO
            ? <TorreDeControl onSelectPatient={onSelectPatient} />
            : <MedicoDashboard onSelectPatient={onSelectPatient} />
        }
    </div>
  );
}