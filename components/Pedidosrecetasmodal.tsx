import React, { useState, useRef } from 'react';
import { PacienteCompleto, Profesional } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type ModalTab = 'pedido' | 'receta';

interface PlantillaPedido {
    id: string;
    nombre: string;
    estudios: { descripcion: string; diagnostico: string }[];
    especialidad: string;
    diagnosticoDefecto: string;
}

interface ItemPedido {
    id: string;
    descripcion: string;
    diagnostico: string;
    urgente: boolean;
    indicaciones: string;
}

interface ItemReceta {
    id: string;
    medicamento: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
    indicaciones: string;
}

interface VademecumItem {
    id: string;
    medicamento: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
}

// ─── PLANTILLAS PREDEFINIDAS ──────────────────────────────────────────────────

const PLANTILLAS_PEDIDO: PlantillaPedido[] = [
    {
        id: 'pre-quirurgico',
        nombre: 'Pre-Quirúrgico Bariátrico',
        especialidad: 'Cirugía',
        diagnosticoDefecto: 'Obesidad mórbida — evaluación pre-quirúrgica bariátrica',
        estudios: [
            { descripcion: 'Hemograma completo con recuento de plaquetas', diagnostico: 'prequirúrgico' },
            { descripcion: 'Glucemia en ayunas', diagnostico: 'prequirúrgico' },
            { descripcion: 'Urea y Creatinina', diagnostico: 'prequirúrgico' },
            { descripcion: 'Hepatograma completo (TGO, TGP, Fosfatasa Alcalina, GGT, Bilirrubina)', diagnostico: 'prequirúrgico' },
            { descripcion: 'Colesterol total, HDL, LDL y Triglicéridos', diagnostico: 'prequirúrgico' },
            { descripcion: 'Coagulograma (KPTT, Quick, RIN)', diagnostico: 'prequirúrgico' },
            { descripcion: 'Ionograma (Na, K, Cl)', diagnostico: 'prequirúrgico' },
            { descripcion: 'Proteínas totales y albumina', diagnostico: 'prequirúrgico' },
            { descripcion: 'TSH', diagnostico: 'prequirúrgico' },
            { descripcion: 'Hemoglobina glicosilada (HbA1c)', diagnostico: 'prequirúrgico' },
            { descripcion: 'Orina completa', diagnostico: 'prequirúrgico' },
        ],
    },
    {
        id: 'control-anual',
        nombre: 'Control Anual Post-Bariátrico',
        especialidad: 'Cirugía',
        diagnosticoDefecto: 'Seguimiento post-bariátrico',
        estudios: [
            { descripcion: 'Hemograma completo', diagnostico: 'seguimiento post-bariátrico' },
            { descripcion: 'Glucemia', diagnostico: 'seguimiento post-bariátrico' },
            { descripcion: 'Hepatograma', diagnostico: 'seguimiento post-bariátrico' },
            { descripcion: 'Perfil lipídico', diagnostico: 'seguimiento post-bariátrico' },
            { descripcion: 'Coagulograma', diagnostico: 'seguimiento post-bariátrico' },
            { descripcion: 'Ionograma', diagnostico: 'seguimiento post-bariátrico' },
            { descripcion: 'Proteínas totales y albumina', diagnostico: 'seguimiento post-bariátrico' },
            { descripcion: 'Ferritina y saturación de transferrina', diagnostico: 'seguimiento post-bariátrico' },
            { descripcion: 'Vitamina B12', diagnostico: 'seguimiento post-bariátrico' },
            { descripcion: 'Ácido fólico', diagnostico: 'seguimiento post-bariátrico' },
            { descripcion: 'Vitamina D (25-OH)', diagnostico: 'seguimiento post-bariátrico' },
            { descripcion: 'PTH intacta', diagnostico: 'seguimiento post-bariátrico' },
            { descripcion: 'Calcio y fósforo', diagnostico: 'seguimiento post-bariátrico' },
            { descripcion: 'Zinc sérico', diagnostico: 'seguimiento post-bariátrico' },
            { descripcion: 'Tiamina (B1)', diagnostico: 'seguimiento post-bariátrico' },
        ],
    },
    {
        id: 'nutricional',
        nombre: 'Evaluación Nutricional',
        especialidad: 'Nutrición',
        diagnosticoDefecto: 'Evaluación nutricional',
        estudios: [
            { descripcion: 'Hemograma', diagnostico: 'evaluación nutricional' },
            { descripcion: 'Glucemia', diagnostico: 'evaluación nutricional' },
            { descripcion: 'Colesterol y triglicéridos', diagnostico: 'evaluación nutricional' },
            { descripcion: 'Albumina y proteínas totales', diagnostico: 'evaluación nutricional' },
            { descripcion: 'Ferritina', diagnostico: 'evaluación nutricional' },
            { descripcion: 'Vitamina B12', diagnostico: 'evaluación nutricional' },
            { descripcion: 'Vitamina D', diagnostico: 'evaluación nutricional' },
            { descripcion: 'Zinc', diagnostico: 'evaluación nutricional' },
        ],
    },
    {
        id: 'ecg-riesgo-quirurgico',
        nombre: 'ECG y Riesgo Quirúrgico',
        especialidad: 'Cardiología',
        diagnosticoDefecto: 'prequirúrgico',
        estudios: [
            { descripcion: 'Electrocardiograma (ECG) de reposo', diagnostico: 'prequirúrgico' },
            { descripcion: 'Evaluación de riesgo quirúrgico cardiovascular', diagnostico: 'prequirúrgico' },
        ],
    },
    {
        id: 'ecografia-abdominal',
        nombre: 'Ecografía Abdominal',
        especialidad: 'Ecografía',
        diagnosticoDefecto: 'esteatosis',
        estudios: [
            { descripcion: 'Ecografía abdominal completa', diagnostico: 'esteatosis' },
        ],
    },
    {
        id: 'veda',
        nombre: 'VEDA con Sedación',
        especialidad: 'Gastroenterología',
        diagnosticoDefecto: 'gastritis',
        estudios: [
            { descripcion: 'Videoendoscopía digestiva alta (VEDA) con sedación', diagnostico: 'gastritis' },
        ],
    },
    {
        id: 'rx-torax',
        nombre: 'RX de Tórax FyP',
        especialidad: 'Radiología',
        diagnosticoDefecto: 'control respiratorio',
        estudios: [
            { descripcion: 'Radiografía de Tórax frente y perfil (FyP)', diagnostico: 'control respiratorio' },
        ],
    },
    {
        id: 'segd',
        nombre: 'SEGD',
        especialidad: 'Radiología',
        diagnosticoDefecto: 'RGE',
        estudios: [
            { descripcion: 'Serie esófago-gástrica-duodenal (SEGD)', diagnostico: 'RGE' },
        ],
    },
    {
        id: 'vacio',
        nombre: 'Pedido libre (OTROS)',
        especialidad: '',
        diagnosticoDefecto: '',
        estudios: [],
    },
];

// ─── PRINT STYLES ─────────────────────────────────────────────────────────────

const PRINT_STYLES = `
@media print {
    body * { visibility: hidden !important; }
    #print-area, #print-area * { visibility: visible !important; }
    #print-area {
        position: fixed !important;
        left: 0; top: 0;
        width: 105mm;
        padding: 1.2cm 1.5cm;
        font-family: Arial, sans-serif;
        font-size: 10pt;
        color: #000;
    }
    .no-print { display: none !important; }
}
`;

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

interface PedidosRecetasModalProps {
    paciente: PacienteCompleto;
    user: Profesional;
    onClose: () => void;
}

export const PedidosRecetasModal: React.FC<PedidosRecetasModalProps> = ({
    paciente,
    user,
    onClose,
}) => {
    const [tab, setTab] = useState<ModalTab>('pedido');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <style>{PRINT_STYLES}</style>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl m-4 flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 rounded-t-xl no-print">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Pedidos y Recetas</h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {paciente.filiatorio.apellido}, {paciente.filiatorio.nombres}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                </div>

                {/* Tabs */}
                <div className="flex border-b bg-slate-50 px-6 gap-1 no-print">
                    <button
                        onClick={() => setTab('pedido')}
                        className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                            tab === 'pedido'
                                ? 'border-indigo-600 text-indigo-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        📋 Pedido de Estudios
                    </button>
                    <button
                        onClick={() => setTab('receta')}
                        className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                            tab === 'receta'
                                ? 'border-indigo-600 text-indigo-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        💊 Receta Médica
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto">
                    {tab === 'pedido' && (
                        <PedidoEstudiosPanel paciente={paciente} user={user} />
                    )}
                    {tab === 'receta' && (
                        <RecetaPanel paciente={paciente} user={user} />
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── PANEL PEDIDO DE ESTUDIOS ─────────────────────────────────────────────────

const PedidoEstudiosPanel: React.FC<{ paciente: PacienteCompleto; user: Profesional }> = ({
    paciente,
    user,
}) => {
    const [selectedPlantilla, setSelectedPlantilla] = useState<string>('pre-quirurgico');
    const [items, setItems] = useState<ItemPedido[]>(() => {
        const p = PLANTILLAS_PEDIDO.find(p => p.id === 'pre-quirurgico');
        return (p?.estudios || []).map((e, i) => ({
            id: `item-${i}`,
            descripcion: e.descripcion,
            diagnostico: e.diagnostico,
            urgente: false,
            indicaciones: '',
        }));
    });
    const [diagnostico, setDiagnostico] = useState('Obesidad mórbida — evaluación pre-quirúrgica bariátrica');
    const [showSignature, setShowSignature] = useState(false);
    const [firmaNombre] = useState(`Dr/a. ${user.apellido}, ${user.nombres}`);
    const [firmaMatricula, setFirmaMatricula] = useState('M.P. ');
    const printRef = useRef<HTMLDivElement>(null);

    const loadPlantilla = (id: string) => {
        setSelectedPlantilla(id);
        const p = PLANTILLAS_PEDIDO.find(p => p.id === id);
        setDiagnostico(p?.diagnosticoDefecto || '');
        setItems(
            (p?.estudios || []).map((e, i) => ({
                id: `item-${i}-${Date.now()}`,
                descripcion: e.descripcion,
                diagnostico: e.diagnostico,
                urgente: false,
                indicaciones: '',
            }))
        );
    };

    const addItem = () => {
        setItems(prev => [
            ...prev,
            { id: `item-${Date.now()}`, descripcion: '', diagnostico: '', urgente: false, indicaciones: '' },
        ]);
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const updateItem = (id: string, field: keyof ItemPedido, value: any) => {
        setItems(prev => prev.map(i => (i.id === id ? { ...i, [field]: value } : i)));
    };

    const handlePrint = () => window.print();

    const handleWhatsApp = () => {
        const { filiatorio } = paciente;
        const itemsText = items
            .filter(i => i.descripcion.trim())
            .map((item, idx) => `${idx + 1}. ${item.urgente ? '[URGENTE] ' : ''}${item.descripcion}${item.diagnostico ? ` — Dx: ${item.diagnostico}` : ''}`)
            .join('\n');
        const text = `*PEDIDO DE ESTUDIOS*\n\nPaciente: ${filiatorio.apellido}, ${filiatorio.nombres}\nDNI: ${filiatorio.dni}\n${diagnostico ? `Diagnóstico: ${diagnostico}\n` : ''}\n*Se solicita:*\n${itemsText}\n\n_${firmaNombre}${showSignature ? ` - ${firmaMatricula}` : ''}_`;
        const phone = filiatorio.telefono?.replace(/\D/g, '') || '';
        window.open(`https://wa.me/${phone ? '549' + phone : ''}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
    const { filiatorio } = paciente;

    return (
        <div className="flex flex-col lg:flex-row h-full">
            {/* LEFT — Editor */}
            <div className="w-full lg:w-1/2 p-5 border-r overflow-y-auto no-print space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Plantilla</label>
                    <div className="grid grid-cols-2 gap-2">
                        {PLANTILLAS_PEDIDO.map(p => (
                            <button
                                key={p.id}
                                onClick={() => loadPlantilla(p.id)}
                                className={`text-left p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                                    selectedPlantilla === p.id
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                {p.nombre}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Diagnóstico / Motivo general</label>
                    <input
                        type="text"
                        value={diagnostico}
                        onChange={e => setDiagnostico(e.target.value)}
                        className="w-full rounded-md border-slate-300 text-sm"
                        placeholder="Diagnóstico de presunción..."
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-slate-700">Estudios solicitados</label>
                        <button
                            onClick={addItem}
                            className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100"
                        >
                            + Agregar
                        </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {items.map((item, idx) => (
                            <div key={item.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg border">
                                <span className="text-xs text-slate-400 pt-2 w-5 flex-shrink-0">{idx + 1}.</span>
                                <div className="flex-grow space-y-1">
                                    <input
                                        type="text"
                                        value={item.descripcion}
                                        onChange={e => updateItem(item.id, 'descripcion', e.target.value)}
                                        className="w-full rounded border-slate-300 text-sm"
                                        placeholder="Nombre del estudio..."
                                    />
                                    <input
                                        type="text"
                                        value={item.diagnostico}
                                        onChange={e => updateItem(item.id, 'diagnostico', e.target.value)}
                                        className="w-full rounded border-slate-300 text-xs bg-amber-50"
                                        placeholder="Dx: diagnóstico..."
                                    />
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={item.urgente}
                                                onChange={e => updateItem(item.id, 'urgente', e.target.checked)}
                                                className="rounded text-red-500"
                                            />
                                            Urgente
                                        </label>
                                        <input
                                            type="text"
                                            value={item.indicaciones}
                                            onChange={e => updateItem(item.id, 'indicaciones', e.target.value)}
                                            className="flex-grow rounded border-slate-300 text-xs"
                                            placeholder="Indicaciones especiales (opcional)"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showSignature}
                            onChange={e => setShowSignature(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600"
                        />
                        Incluir firma y matrícula
                    </label>
                    {showSignature && (
                        <input
                            type="text"
                            value={firmaMatricula}
                            onChange={e => setFirmaMatricula(e.target.value)}
                            className="rounded border-slate-300 text-sm w-36"
                            placeholder="M.P. 12345"
                        />
                    )}
                </div>
            </div>

            {/* RIGHT — Preview + Actions */}
            <div className="w-full lg:w-1/2 p-5 bg-slate-50 flex flex-col overflow-y-auto">
                <div className="flex items-center justify-between mb-3 no-print gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-slate-600">Vista previa (½ A4)</h4>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                            🖨️ Imprimir / PDF
                        </button>
                        <button
                            onClick={handleWhatsApp}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                        >
                            📲 WhatsApp
                        </button>
                    </div>
                </div>

                {/* PRINT AREA */}
                <div
                    id="print-area"
                    ref={printRef}
                    className="bg-white border rounded-lg p-6 text-sm space-y-4 shadow-sm flex-grow"
                    style={{ maxWidth: '105mm' }}
                >
                    {/* Logo Plenus */}
                    <div className="border-b pb-3 mb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-base text-slate-900 uppercase tracking-wide">Plenus</p>
                                <p className="font-bold text-xs text-slate-700 mt-0.5">PEDIDO DE ESTUDIOS</p>
                                <p className="text-slate-500 text-xs mt-0.5">{user.especialidad || 'Medicina'}</p>
                            </div>
                            <p className="text-xs text-slate-500 text-right">{today}</p>
                        </div>
                    </div>

                    {/* Datos del paciente */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs bg-slate-50 rounded p-3 border">
                        <div><span className="text-slate-500">Paciente:</span> <strong>{filiatorio.apellido}, {filiatorio.nombres}</strong></div>
                        <div><span className="text-slate-500">DNI:</span> {filiatorio.dni}</div>
                        <div><span className="text-slate-500">Obra Social:</span> {filiatorio.obraSocial || '-'}</div>
                        <div><span className="text-slate-500">Nro Afiliado:</span> {filiatorio.nroAfiliado || '-'}</div>
                    </div>

                    {/* Diagnóstico general */}
                    {diagnostico && (
                        <div className="text-xs">
                            <span className="text-slate-500 font-medium">Diagnóstico: </span>
                            <span className="text-slate-800">{diagnostico}</span>
                        </div>
                    )}

                    {/* Lista de estudios */}
                    <div>
                        <p className="font-semibold text-slate-800 mb-2 text-xs uppercase tracking-wide">Se solicita:</p>
                        <ol className="space-y-2">
                            {items.filter(i => i.descripcion.trim()).map((item, idx) => (
                                <li key={item.id} className="text-xs border-l-2 border-slate-300 pl-2">
                                    <div className="flex items-start gap-1">
                                        <span className="text-slate-400 flex-shrink-0">{idx + 1}.</span>
                                        <div>
                                            {item.urgente && (
                                                <span className="bg-red-100 text-red-700 text-xs font-bold px-1 py-0.5 rounded mr-1">URGENTE</span>
                                            )}
                                            <strong>{item.descripcion}</strong>
                                            {item.indicaciones && (
                                                <span className="text-slate-500 ml-1">— {item.indicaciones}</span>
                                            )}
                                            {item.diagnostico && (
                                                <p className="text-slate-500 italic mt-0.5">Dx: {item.diagnostico}</p>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Firma */}
                    {showSignature && (
                        <div className="mt-8 pt-4 border-t text-right text-xs text-slate-700">
                            <div className="inline-block border-t border-slate-400 pt-2 min-w-[180px]">
                                <p className="font-semibold">{firmaNombre}</p>
                                <p className="text-slate-500">{firmaMatricula}</p>
                                <p className="text-slate-500">{user.especialidad}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── VADEMECUM STORAGE ────────────────────────────────────────────────────────

const VADEMECUM_KEY = 'plenus_vademecum';

function loadVademecum(): VademecumItem[] {
    try {
        return JSON.parse(localStorage.getItem(VADEMECUM_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveVademecum(items: VademecumItem[]) {
    localStorage.setItem(VADEMECUM_KEY, JSON.stringify(items));
}

// ─── PANEL RECETA MÉDICA ──────────────────────────────────────────────────────

const RecetaPanel: React.FC<{ paciente: PacienteCompleto; user: Profesional }> = ({
    paciente,
    user,
}) => {
    const [items, setItems] = useState<ItemReceta[]>([
        { id: '1', medicamento: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' },
    ]);
    const [diagnostico, setDiagnostico] = useState('');
    const [indicacionesGenerales, setIndicacionesGenerales] = useState('');
    const [showSignature, setShowSignature] = useState(true);
    const [firmaMatricula, setFirmaMatricula] = useState('M.P. ');
    const [showMRxInfo, setShowMRxInfo] = useState(false);
    const [vademecum, setVademecum] = useState<VademecumItem[]>(() => loadVademecum());
    const [showVademecum, setShowVademecum] = useState(false);

    const addItem = () => {
        setItems(prev => [
            ...prev,
            { id: `${Date.now()}`, medicamento: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' },
        ]);
    };

    const removeItem = (id: string) => {
        if (items.length === 1) return;
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const updateItem = (id: string, field: keyof ItemReceta, value: string) => {
        setItems(prev => prev.map(i => (i.id === id ? { ...i, [field]: value } : i)));
    };

    const handleSaveToVademecum = (item: ItemReceta) => {
        if (!item.medicamento.trim()) return;
        const newEntry: VademecumItem = {
            id: `vad-${Date.now()}`,
            medicamento: item.medicamento,
            dosis: item.dosis,
            frecuencia: item.frecuencia,
            duracion: item.duracion,
        };
        const updated = [newEntry, ...vademecum.filter(v => v.medicamento !== item.medicamento)].slice(0, 20);
        setVademecum(updated);
        saveVademecum(updated);
    };

    const handleLoadFromVademecum = (vItem: VademecumItem) => {
        const emptyItem = items.find(i => !i.medicamento.trim());
        if (emptyItem) {
            setItems(prev => prev.map(i => i.id === emptyItem.id ? { ...i, medicamento: vItem.medicamento, dosis: vItem.dosis, frecuencia: vItem.frecuencia, duracion: vItem.duracion } : i));
        } else {
            setItems(prev => [...prev, { id: `${Date.now()}`, medicamento: vItem.medicamento, dosis: vItem.dosis, frecuencia: vItem.frecuencia, duracion: vItem.duracion, indicaciones: '' }]);
        }
        setShowVademecum(false);
    };

    const handleRemoveFromVademecum = (id: string) => {
        const updated = vademecum.filter(v => v.id !== id);
        setVademecum(updated);
        saveVademecum(updated);
    };

    const handleWhatsApp = () => {
        const { filiatorio } = paciente;
        const itemsText = items
            .filter(i => i.medicamento.trim())
            .map((item, idx) => `${idx + 1}. ${item.medicamento}${item.dosis ? ` — ${item.dosis}` : ''}${item.frecuencia ? `, ${item.frecuencia}` : ''}${item.duracion ? ` por ${item.duracion}` : ''}${item.indicaciones ? `\n   _${item.indicaciones}_` : ''}`)
            .join('\n');
        const text = `*RECETA MÉDICA*\n\nPaciente: ${filiatorio.apellido}, ${filiatorio.nombres}\nDNI: ${filiatorio.dni}\n${diagnostico ? `Diagnóstico: ${diagnostico}\n` : ''}\n${itemsText}${indicacionesGenerales ? `\n\nIndicaciones: ${indicacionesGenerales}` : ''}\n\n_Dr/a. ${user.apellido}, ${user.nombres}${showSignature ? ` — ${firmaMatricula}` : ''}_`;
        const phone = filiatorio.telefono?.replace(/\D/g, '') || '';
        window.open(`https://wa.me/${phone ? '549' + phone : ''}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
    const { filiatorio } = paciente;

    return (
        <div className="flex flex-col lg:flex-row h-full">
            {/* LEFT — Editor */}
            <div className="w-full lg:w-1/2 p-5 border-r overflow-y-auto no-print space-y-4">

                {/* Banner MRx */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-blue-800">💊 Receta Digital con MRx</p>
                            <p className="text-xs text-blue-600 mt-0.5">
                                Para recetas oficiales con vademécum y obra social integrada.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowMRxInfo(!showMRxInfo)}
                            className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded hover:bg-blue-200"
                        >
                            {showMRxInfo ? 'Cerrar' : 'Ver info'}
                        </button>
                    </div>
                    {showMRxInfo && (
                        <div className="mt-3 space-y-2 text-xs text-blue-700 border-t border-blue-200 pt-2">
                            <p><strong>MRx Digital</strong> es una plataforma oficial con vademécum completo, validación de obra social y firma digital certificada.</p>
                            <a
                                href="https://www.mrx.com.ar"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold underline hover:text-blue-900"
                            >
                                Ir a MRx Digital →
                            </a>
                        </div>
                    )}
                </div>

                {/* Vademecum */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-amber-800">⭐ Vademécum personal</p>
                        <button
                            onClick={() => setShowVademecum(!showVademecum)}
                            className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded hover:bg-amber-200"
                        >
                            {showVademecum ? 'Cerrar' : `Ver (${vademecum.length})`}
                        </button>
                    </div>
                    {showVademecum && (
                        <div className="mt-3 border-t border-amber-200 pt-2">
                            {vademecum.length === 0 ? (
                                <p className="text-xs text-amber-700">No hay medicamentos guardados. Usá el botón ⭐ en cada ítem para guardar.</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {vademecum.map(v => (
                                        <div key={v.id} className="flex items-center justify-between bg-white rounded p-2 text-xs border border-amber-100">
                                            <div>
                                                <p className="font-semibold text-slate-800">{v.medicamento}</p>
                                                <p className="text-slate-500">{[v.dosis, v.frecuencia, v.duracion].filter(Boolean).join(' · ')}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleLoadFromVademecum(v)} className="px-2 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 font-medium">Usar</button>
                                                <button onClick={() => handleRemoveFromVademecum(v.id)} className="px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Diagnóstico</label>
                    <input
                        type="text"
                        value={diagnostico}
                        onChange={e => setDiagnostico(e.target.value)}
                        className="w-full rounded-md border-slate-300 text-sm"
                        placeholder="Diagnóstico..."
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-slate-700">Medicamentos</label>
                        <button
                            onClick={addItem}
                            className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100"
                        >
                            + Agregar
                        </button>
                    </div>
                    <div className="space-y-3">
                        {items.map((item, idx) => (
                            <div key={item.id} className="p-3 bg-slate-50 rounded-lg border space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-500">#{idx + 1}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSaveToVademecum(item)}
                                            title="Guardar en vademécum"
                                            className="text-xs text-amber-600 hover:text-amber-800"
                                        >
                                            ⭐ Guardar
                                        </button>
                                        {items.length > 1 && (
                                            <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 text-xs">✕ Quitar</button>
                                        )}
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={item.medicamento}
                                    onChange={e => updateItem(item.id, 'medicamento', e.target.value)}
                                    className="w-full rounded border-slate-300 text-sm font-medium"
                                    placeholder="Medicamento (nombre genérico o comercial)..."
                                />
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-xs text-slate-500">Dosis</label>
                                        <input
                                            type="text"
                                            value={item.dosis}
                                            onChange={e => updateItem(item.id, 'dosis', e.target.value)}
                                            className="w-full rounded border-slate-300 text-xs"
                                            placeholder="500mg"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500">Frecuencia</label>
                                        <input
                                            type="text"
                                            value={item.frecuencia}
                                            onChange={e => updateItem(item.id, 'frecuencia', e.target.value)}
                                            className="w-full rounded border-slate-300 text-xs"
                                            placeholder="Cada 8hs"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500">Duración</label>
                                        <input
                                            type="text"
                                            value={item.duracion}
                                            onChange={e => updateItem(item.id, 'duracion', e.target.value)}
                                            className="w-full rounded border-slate-300 text-xs"
                                            placeholder="30 días"
                                        />
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={item.indicaciones}
                                    onChange={e => updateItem(item.id, 'indicaciones', e.target.value)}
                                    className="w-full rounded border-slate-300 text-xs"
                                    placeholder="Indicaciones especiales (con alimentos, en ayunas...)"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Indicaciones generales</label>
                    <textarea
                        value={indicacionesGenerales}
                        onChange={e => setIndicacionesGenerales(e.target.value)}
                        rows={2}
                        className="w-full rounded-md border-slate-300 text-sm"
                        placeholder="Instrucciones adicionales para el paciente..."
                    />
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showSignature}
                            onChange={e => setShowSignature(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600"
                        />
                        Incluir firma y matrícula
                    </label>
                    {showSignature && (
                        <input
                            type="text"
                            value={firmaMatricula}
                            onChange={e => setFirmaMatricula(e.target.value)}
                            className="rounded border-slate-300 text-sm w-36"
                            placeholder="M.P. 12345"
                        />
                    )}
                </div>
            </div>

            {/* RIGHT — Preview */}
            <div className="w-full lg:w-1/2 p-5 bg-slate-50 flex flex-col overflow-y-auto">
                <div className="flex items-center justify-between mb-3 no-print gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-slate-600">Vista previa (½ A4)</h4>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                            🖨️ Imprimir / PDF
                        </button>
                        <button
                            onClick={handleWhatsApp}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                        >
                            📲 WhatsApp
                        </button>
                    </div>
                </div>

                <div
                    id="print-area"
                    className="bg-white border rounded-lg p-6 text-sm space-y-4 shadow-sm flex-grow"
                    style={{ maxWidth: '105mm' }}
                >
                    <div className="border-b pb-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-base text-slate-900 uppercase tracking-wide">Plenus</p>
                                <p className="font-bold text-xs text-slate-700 mt-0.5">RECETA MÉDICA</p>
                                <p className="text-slate-500 text-xs mt-0.5">{user.especialidad || 'Medicina'}</p>
                            </div>
                            <p className="text-xs text-slate-500 text-right">{today}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs bg-slate-50 rounded p-3 border">
                        <div><span className="text-slate-500">Paciente:</span> <strong>{filiatorio.apellido}, {filiatorio.nombres}</strong></div>
                        <div><span className="text-slate-500">DNI:</span> {filiatorio.dni}</div>
                        <div><span className="text-slate-500">Obra Social:</span> {filiatorio.obraSocial || '-'}</div>
                        <div><span className="text-slate-500">Nro Afiliado:</span> {filiatorio.nroAfiliado || '-'}</div>
                    </div>

                    {diagnostico && (
                        <div className="text-xs">
                            <span className="text-slate-500 font-medium">Diagnóstico: </span>
                            <span className="text-slate-800">{diagnostico}</span>
                        </div>
                    )}

                    <div className="space-y-3">
                        {items.filter(i => i.medicamento.trim()).map((item, idx) => (
                            <div key={item.id} className="border-l-2 border-indigo-300 pl-3 text-xs space-y-0.5">
                                <p className="font-bold text-slate-900">
                                    {idx + 1}. {item.medicamento}
                                    {item.dosis && <span className="font-normal text-slate-600"> — {item.dosis}</span>}
                                </p>
                                {item.frecuencia && <p className="text-slate-600">Tomar: {item.frecuencia}{item.duracion ? ` durante ${item.duracion}` : ''}</p>}
                                {item.indicaciones && <p className="text-slate-500 italic">{item.indicaciones}</p>}
                            </div>
                        ))}
                    </div>

                    {indicacionesGenerales && (
                        <div className="p-2 bg-slate-50 rounded border text-xs text-slate-700">
                            <p className="font-semibold text-slate-500 mb-0.5">Indicaciones:</p>
                            <p>{indicacionesGenerales}</p>
                        </div>
                    )}

                    {showSignature && (
                        <div className="mt-8 pt-4 border-t text-right text-xs text-slate-700">
                            <div className="inline-block border-t border-slate-400 pt-2 min-w-[180px]">
                                <p className="font-semibold">Dr/a. {user.apellido}, {user.nombres}</p>
                                <p className="text-slate-500">{firmaMatricula}</p>
                                <p className="text-slate-500">{user.especialidad}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PedidosRecetasModal;
