import React, { useState, useEffect, useContext } from 'react';
import { Folder, FolderTrackingStatus, ChecklistItemStatus, CrmSimpleProfessionals, FolderNote } from '../types';
import { api } from '../services/mockApi';
import { AuthContext } from '../App';

interface FolderModalProps {
    patient: { id: string; firstName: string; lastName: string; };
    folder: Folder | null;
    professionals: CrmSimpleProfessionals;
    onSave: (folder: Folder) => Promise<void>;
    onClose: () => void;
}

export const FolderModal = ({ patient, folder, professionals, onSave, onClose }: FolderModalProps) => {
    const authContext = useContext(AuthContext);
    const currentUser = authContext?.user;
    const currentAuthor = currentUser ? `${currentUser.nombres} ${currentUser.apellido}` : 'Coordinación';

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Reactivation states
    const [showReactivateInput, setShowReactivateInput] = useState(false);
    const [reactivationDate, setReactivationDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Note input states
    const [newNoteText, setNewNoteText] = useState('');
    const [newNoteDate, setNewNoteDate] = useState(() => new Date().toISOString().split('T')[0]);

    const [currentFolder, setCurrentFolder] = useState<Folder>(() => {
        if (folder) return folder;
        return {
            id: `folder-${patient.id}`,
            patientId: patient.id,
            checklist: { 
                consentimiento: ChecklistItemStatus.PENDIENTE, 
                presupuesto: ChecklistItemStatus.PENDIENTE, 
                informeCirujano: ChecklistItemStatus.PENDIENTE, 
                informeNutricionista: ChecklistItemStatus.PENDIENTE, 
                informePsicologo: ChecklistItemStatus.PENDIENTE 
            },
            trackingState: FolderTrackingStatus.NO_PRESENTADA,
            requestDate: null, 
            deliveredToPatientDate: null, 
            submittedDate: null, 
            authorizedDate: null,
            driveLink: '', 
            notes: [],
            surgeon: professionals.surgeons[0] || '',
            nutritionist: professionals.nutritionists[0] || '',
            psychologist: professionals.psychologists[0] || '',
            scheduledSurgeryDate: null, 
            scheduledSurgeryTime: null,
        };
    });

    useEffect(() => {
        if (!folder) {
            api.getPacienteCompleto(patient.id, '').then(p => {
                if (p?.filiatorio) {
                    setCurrentFolder(prev => ({
                        ...prev,
                        surgeon: p.filiatorio.cirujanoAsignado || professionals.surgeons[0] || '',
                        nutritionist: p.filiatorio.nutricionistaAsignado || professionals.nutritionists[0] || '',
                        psychologist: p.filiatorio.psicologoAsignado || professionals.psychologists[0] || '',
                    }));
                }
            }).catch(e => console.error("Could not fetch patient details for folder", e as Error));
        }
    }, [patient.id, folder, professionals]);

    const handleChecklistChange = (item: keyof Folder['checklist'], value: string) => {
        setCurrentFolder(prev => ({ ...prev, checklist: { ...prev.checklist, [item]: value as ChecklistItemStatus } }));
    };

    // Helper to calculate automatic status
    const getAutoStatus = (
        req: string | null,
        del: string | null,
        sub: string | null,
        auth: string | null,
        curr: FolderTrackingStatus
    ): FolderTrackingStatus => {
        if (curr === FolderTrackingStatus.RECHAZADA || curr === FolderTrackingStatus.ANULADA) {
            return curr;
        }
        if (auth) return FolderTrackingStatus.AUTORIZADA;
        if (sub) return FolderTrackingStatus.PRESENTADA_EN_OS;
        if (del) return FolderTrackingStatus.ENTREGADA_AL_PACIENTE;
        if (req) return FolderTrackingStatus.PEDIDO_GENERADO;
        return FolderTrackingStatus.NO_PRESENTADA;
    };

    const handleDateChange = (field: 'requestDate' | 'deliveredToPatientDate' | 'submittedDate' | 'authorizedDate', value: string | null) => {
        setCurrentFolder(prev => {
            const nextVal = value || null;
            const req = field === 'requestDate' ? nextVal : prev.requestDate;
            const del = field === 'deliveredToPatientDate' ? nextVal : prev.deliveredToPatientDate;
            const sub = field === 'submittedDate' ? nextVal : prev.submittedDate;
            const auth = field === 'authorizedDate' ? nextVal : prev.authorizedDate;

            const newStatus = getAutoStatus(req, del, sub, auth, prev.trackingState);
            return {
                ...prev,
                [field]: nextVal,
                trackingState: newStatus
            };
        });
    };

    const handleFieldChange = (field: keyof Folder, value: any) => {
        setCurrentFolder(prev => ({ ...prev, [field]: value || null }));
    };

    const handleMarkAsRejected = () => {
        if (!newNoteText.trim()) {
            alert('Debe escribir el motivo del rechazo en el campo de "Nueva Nota".');
            return;
        }
        const newNote: FolderNote = {
            id: `note-${Date.now()}`,
            fecha: newNoteDate,
            autor: currentAuthor,
            texto: `[RECHAZADA] Motivo: ${newNoteText.trim()}`
        };
        setCurrentFolder(prev => ({
            ...prev,
            trackingState: FolderTrackingStatus.RECHAZADA,
            notes: [newNote, ...prev.notes]
        }));
        setNewNoteText('');
    };

    const handleAnnulFolder = () => {
        if (!newNoteText.trim()) {
            alert('Debe escribir el motivo de la anulación en el campo de "Nueva Nota".');
            return;
        }
        if (window.confirm('¿Está seguro de que desea anular esta gestión? La carpeta se archivará y desaparecerá del dashboard activo.')) {
            const newNote: FolderNote = {
                id: `note-${Date.now()}`,
                fecha: newNoteDate,
                autor: currentAuthor,
                texto: `[ANULADA] Motivo: ${newNoteText.trim()}`
            };
            setCurrentFolder(prev => ({
                ...prev,
                trackingState: FolderTrackingStatus.ANULADA,
                notes: [newNote, ...prev.notes]
            }));
            setNewNoteText('');
        }
    };

    const handleReactivateFolder = () => {
        if (!reactivationDate) {
            alert('Debe ingresar una Fecha de Presentación válida.');
            return;
        }
        const newNote: FolderNote = {
            id: `note-${Date.now()}`,
            fecha: new Date().toISOString().split('T')[0],
            autor: currentAuthor,
            texto: `Reactivación de carpeta. Nueva fecha de presentación ante obra social: ${reactivationDate}`
        };
        setCurrentFolder(prev => ({
            ...prev,
            trackingState: FolderTrackingStatus.PRESENTADA_EN_OS,
            submittedDate: reactivationDate,
            authorizedDate: null, // Clear authorized date upon reactivation
            notes: [newNote, ...prev.notes]
        }));
        setShowReactivateInput(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
            // Append any pending typed new note
            let folderToSave = currentFolder;
            if (newNoteText.trim()) {
                const newNote: FolderNote = {
                    id: `note-${Date.now()}`,
                    fecha: newNoteDate,
                    autor: currentAuthor,
                    texto: newNoteText.trim()
                };
                folderToSave = {
                    ...currentFolder,
                    notes: [newNote, ...currentFolder.notes]
                };
            }
            await onSave(folderToSave);
            onClose();
        } catch (e: any) {
            setSaveError(e?.message || 'No se pudo guardar la carpeta. Intente de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    const checklistItems = [
        { key: 'consentimiento', label: 'Consentimiento' },
        { key: 'presupuesto', label: 'Presupuesto' },
        { key: 'informeCirujano', label: 'Informe Cirujano' },
        { key: 'informeNutricionista', label: 'Informe Nutricionista' },
        { key: 'informePsicologo', label: 'Informe Psicólogo' },
    ];

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl m-4 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">
                        Gestionar Carpeta — {patient.lastName}, {patient.firstName}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Checklist Column */}
                    <div className="md:col-span-3 space-y-4 border-r pr-6">
                        <h3 className="font-semibold text-slate-700 border-b pb-2 flex items-center gap-2">
                            <span>📋</span> Checklist Documental
                        </h3>
                        {checklistItems.map(item => (
                            <div key={item.key} className="flex flex-col">
                                <label className="text-sm font-medium text-slate-600">{item.label}</label>
                                <select 
                                    value={currentFolder.checklist[item.key as keyof Folder['checklist']]} 
                                    onChange={e => handleChecklistChange(item.key as keyof Folder['checklist'], e.target.value)} 
                                    className="mt-1 block w-full rounded-md border-slate-300 text-sm shadow-sm"
                                >
                                    <option value={ChecklistItemStatus.PENDIENTE}>Pendiente</option>
                                    <option value={ChecklistItemStatus.RECIBIDO}>Recibido</option>
                                    <option value={ChecklistItemStatus.NO_APLICA}>No Aplica</option>
                                </select>
                            </div>
                        ))}
                    </div>

                    {/* Dates and Tracking Column */}
                    <div className="md:col-span-5 space-y-4 border-r pr-6">
                        <h3 className="font-semibold text-slate-700 border-b pb-2 flex items-center justify-between">
                            <span>📅 Seguimiento y Fechas</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${statusBadges[currentFolder.trackingState]}`}>
                                {currentFolder.trackingState}
                            </span>
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-slate-500">Fecha Pedido</label>
                                <input 
                                    type="date" 
                                    value={currentFolder.requestDate || ''} 
                                    onChange={e => handleDateChange('requestDate', e.target.value)} 
                                    className="mt-1 w-full rounded-md border-slate-300 text-sm" 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Fecha Entrega Paciente</label>
                                <input 
                                    type="date" 
                                    value={currentFolder.deliveredToPatientDate || ''} 
                                    onChange={e => handleDateChange('deliveredToPatientDate', e.target.value)} 
                                    className="mt-1 w-full rounded-md border-slate-300 text-sm" 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Fecha Presentada OS</label>
                                <input 
                                    type="date" 
                                    value={currentFolder.submittedDate || ''} 
                                    onChange={e => handleDateChange('submittedDate', e.target.value)} 
                                    className="mt-1 w-full rounded-md border-slate-300 text-sm" 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Fecha Autorizada</label>
                                <input 
                                    type="date" 
                                    value={currentFolder.authorizedDate || ''} 
                                    onChange={e => handleDateChange('authorizedDate', e.target.value)} 
                                    className="mt-1 w-full rounded-md border-slate-300 text-sm" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-2">
                            <div>
                                <label className="text-xs font-medium text-slate-500">Cirujano</label>
                                <select 
                                    value={currentFolder.surgeon} 
                                    onChange={e => handleFieldChange('surgeon', e.target.value)} 
                                    className="mt-1 w-full rounded-md border-slate-300 text-xs"
                                >
                                    {professionals.surgeons.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Nutricionista</label>
                                <select 
                                    value={currentFolder.nutritionist} 
                                    onChange={e => handleFieldChange('nutritionist', e.target.value)} 
                                    className="mt-1 w-full rounded-md border-slate-300 text-xs"
                                >
                                    {professionals.nutritionists.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500">Psicólogo</label>
                                <select 
                                    value={currentFolder.psychologist} 
                                    onChange={e => handleFieldChange('psychologist', e.target.value)} 
                                    className="mt-1 w-full rounded-md border-slate-300 text-xs"
                                >
                                    {professionals.psychologists.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-500">Link a Drive</label>
                            <input 
                                type="text" 
                                value={currentFolder.driveLink} 
                                onChange={e => handleFieldChange('driveLink', e.target.value)} 
                                placeholder="https://drive.google.com/..." 
                                className="mt-1 w-full rounded-md border-slate-300 text-sm" 
                            />
                        </div>

                        {/* Folder Management Actions */}
                        <div className="pt-4 border-t space-y-3">
                            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Acciones Especiales</span>
                            
                            {showReactivateInput ? (
                                <div className="p-3 bg-teal-50 border border-teal-200 rounded-md space-y-2">
                                    <label className="block text-xs font-medium text-teal-800">Nueva Fecha de Presentación (Obligatoria)</label>
                                    <input 
                                        type="date" 
                                        value={reactivationDate} 
                                        onChange={e => setReactivationDate(e.target.value)} 
                                        className="w-full rounded-md border-teal-300 text-sm text-slate-800"
                                    />
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button 
                                            type="button" 
                                            onClick={() => setShowReactivateInput(false)}
                                            className="px-2 py-1 text-xs text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleReactivateFolder}
                                            className="px-2 py-1 text-xs text-white bg-teal-600 rounded hover:bg-teal-700"
                                        >
                                            Confirmar Reactivación
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={handleMarkAsRejected}
                                        className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition shadow"
                                    >
                                        🔴 Rechazada
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={handleAnnulFolder}
                                        className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition shadow"
                                    >
                                        🚫 Anular Gestión
                                    </button>

                                    {currentFolder.trackingState === FolderTrackingStatus.RECHAZADA && (
                                        <button
                                            type="button"
                                            onClick={() => setShowReactivateInput(true)}
                                            className="w-full py-2 px-3 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md transition shadow"
                                        >
                                            🔄 Reactivar Carpeta
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes History Column */}
                    <div className="md:col-span-4 space-y-4 flex flex-col max-h-[60vh] md:max-h-none">
                        <h3 className="font-semibold text-slate-700 border-b pb-2 flex items-center gap-2">
                            <span>📝</span> Historial de Notas
                        </h3>

                        {/* Add New Note Section */}
                        <div className="bg-slate-50 p-3 rounded-lg border space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-600">Nueva Nota</span>
                                <span className="text-xs text-slate-500 font-medium">Por: {currentAuthor}</span>
                            </div>
                            <textarea
                                value={newNoteText}
                                onChange={e => setNewNoteText(e.target.value)}
                                placeholder="Escribe observaciones, motivos de rechazo, anulación, etc..."
                                className="w-full rounded-md border-slate-300 text-xs p-2"
                                rows={3}
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Fecha nota:</span>
                                <input
                                    type="date"
                                    value={newNoteDate}
                                    onChange={e => setNewNoteDate(e.target.value)}
                                    className="rounded border-slate-300 text-xs py-0.5 px-2 w-full"
                                />
                            </div>
                        </div>

                        {/* Scrollable list of notes */}
                        <div className="flex-grow overflow-y-auto space-y-3 pr-1">
                            {(!currentFolder.notes || currentFolder.notes.length === 0) ? (
                                <p className="text-xs text-slate-400 text-center py-8">No hay notas registradas.</p>
                            ) : (
                                currentFolder.notes.map((note) => (
                                    <div key={note.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm space-y-1">
                                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                                            <span>📅 {note.fecha}</span>
                                            <span>👤 {note.autor}</span>
                                        </div>
                                        <p className="text-xs text-slate-700 whitespace-pre-wrap font-medium">{note.texto}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t flex flex-col gap-2">
                    {saveError && <p className="text-sm text-red-600 text-center">{saveError}</p>}
                    <div className="flex justify-end space-x-3">
                        <button 
                            onClick={onClose} 
                            disabled={isSaving} 
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving} 
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                            {isSaving ? 'Guardando...' : 'Guardar Carpeta'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
