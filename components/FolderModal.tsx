import React, { useState, useEffect } from 'react';
import { Folder, FolderTrackingStatus, ChecklistItemStatus, CrmSimpleProfessionals } from '../types';
import { api } from '../services/mockApi';

interface FolderModalProps {
    patient: { id: string; firstName: string; lastName: string; };
    folder: Folder | null;
    professionals: CrmSimpleProfessionals;
    onSave: (folder: Folder) => Promise<void>;
    onClose: () => void;
}

export const FolderModal = ({ patient, folder, professionals, onSave, onClose }: FolderModalProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
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
            notes: '',
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

    const handleFieldChange = (field: keyof Folder, value: string) => {
        setCurrentFolder(prev => {
            const updated = { ...prev, [field]: value || null };

            // Solo auto-avanzar si el nuevo estado sería "mayor" al actual
            const autoEstado = (() => {
                if (field === 'authorizedDate' && value) return FolderTrackingStatus.AUTORIZADA;
                if (field === 'submittedDate' && value) return FolderTrackingStatus.PRESENTADA_EN_OS;
                if (field === 'deliveredToPatientDate' && value) return FolderTrackingStatus.ENTREGADA_AL_PACIENTE;
                if (field === 'requestDate' && value) return FolderTrackingStatus.PEDIDO_GENERADO;
                return null;
            })();

            const orden: FolderTrackingStatus[] = [
                FolderTrackingStatus.NO_PRESENTADA,
                FolderTrackingStatus.PEDIDO_GENERADO,
                FolderTrackingStatus.ENTREGADA_AL_PACIENTE,
                FolderTrackingStatus.PRESENTADA_EN_OS,
                FolderTrackingStatus.EN_AUDITORIA,
                FolderTrackingStatus.AUTORIZADA,
                FolderTrackingStatus.RECHAZADA,
            ];

            if (autoEstado) {
                const idxActual = orden.indexOf(prev.trackingState);
                const idxNuevo = orden.indexOf(autoEstado);
                if (idxNuevo > idxActual) {
                    updated.trackingState = autoEstado;
                }
            }

            return updated;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
            await onSave(currentFolder);
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">
                        Gestionar Carpeta para {patient.firstName} {patient.lastName}
                    </h2>
                </div>
                <div className="p-6 flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="font-semibold text-slate-700">Seguimiento y Fechas Clave</h3>
                        <div>
                            <label className="text-sm font-medium text-slate-600">Estado General</label>
                            <select 
                                value={currentFolder.trackingState} 
                                onChange={e => handleFieldChange('trackingState', e.target.value)} 
                                className="mt-1 block w-full rounded-md border-slate-300"
                            >
                                {Object.values(FolderTrackingStatus).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm">Fecha Pedido</label>
                                <input 
                                    type="date" 
                                    value={currentFolder.requestDate || ''} 
                                    onChange={e => handleFieldChange('requestDate', e.target.value)} 
                                    className="mt-1 w-full rounded-md border-slate-300 text-sm" 
                                />
                            </div>
                            <div>
                                <label className="text-sm">Fecha Entrega Paciente</label>
                                <input 
                                    type="date" 
                                    value={currentFolder.deliveredToPatientDate || ''} 
                                    onChange={e => handleFieldChange('deliveredToPatientDate', e.target.value)} 
                                    className="mt-1 w-full rounded-md border-slate-300 text-sm" 
                                />
                            </div>
                            <div>
                                <label className="text-sm">Fecha Presentada</label>
                                <input 
                                    type="date" 
                                    value={currentFolder.submittedDate || ''} 
                                    onChange={e => handleFieldChange('submittedDate', e.target.value)} 
                                    className="mt-1 w-full rounded-md border-slate-300 text-sm" 
                                />
                            </div>
                            <div>
                                <label className="text-sm">Fecha Autorizada</label>
                                <input 
                                    type="date" 
                                    value={currentFolder.authorizedDate || ''} 
                                    onChange={e => handleFieldChange('authorizedDate', e.target.value)} 
                                    className="mt-1 w-full rounded-md border-slate-300 text-sm" 
                                />
                            </div>
                        </div>
                        <h3 className="font-semibold text-slate-700 pt-4">Equipo y Notas</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm">Cirujano</label>
                                <select 
                                    value={currentFolder.surgeon} 
                                    onChange={e => handleFieldChange('surgeon', e.target.value)} 
                                    className="mt-1 w-full rounded-md border-slate-300 text-sm"
                                >
                                    {professionals.surgeons.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm">Nutricionista</label>
                                <select 
                                    value={currentFolder.nutritionist} 
                                    onChange={e => handleFieldChange('nutritionist', e.target.value)} 
                                    className="mt-1 w-full rounded-md border-slate-300 text-sm"
                                >
                                    {professionals.nutritionists.map(n => <option key={n}>{n}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm">Psicólogo</label>
                                <select 
                                    value={currentFolder.psychologist} 
                                    onChange={e => handleFieldChange('psychologist', e.target.value)} 
                                    className="mt-1 w-full rounded-md border-slate-300 text-sm"
                                >
                                    {professionals.psychologists.map(p => <option key={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm">Link a Drive</label>
                            <input 
                                type="text" 
                                value={currentFolder.driveLink} 
                                onChange={e => handleFieldChange('driveLink', e.target.value)} 
                                placeholder="https://..." 
                                className="mt-1 w-full rounded-md border-slate-300 text-sm" 
                            />
                        </div>
                        <div>
                            <label className="text-sm">Notas</label>
                            <textarea 
                                value={currentFolder.notes} 
                                onChange={e => handleFieldChange('notes', e.target.value)} 
                                rows={3} 
                                className="mt-1 w-full rounded-md border-slate-300 text-sm"
                            ></textarea>
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
