
import React, { useState, useEffect } from 'react';
import { PacienteFiliatorio, EtiquetaFlujo } from '../types';
import { api } from '../services/mockApi';

interface WorkflowPanelProps {
  pacientes: PacienteFiliatorio[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

const TagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
);


export default function WorkflowPanel({ pacientes, activeTag, onSelectTag }: WorkflowPanelProps) {
  const [etiquetas, setEtiquetas] = useState<EtiquetaFlujo[]>([]);

  useEffect(() => {
    api.getEtiquetasFlujo().then(setEtiquetas);
  }, []);

  const getCountForTag = (tagName: string) => {
    return pacientes.filter(p => p.etiquetaPrincipalActiva === tagName).length;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-slate-700 mb-3">Filtrar por Etapa del Flujo</h3>
      <div className="flex flex-wrap gap-2">
        <button
            onClick={() => onSelectTag(null)}
            className={`px-3 py-2 text-sm font-medium rounded-full flex items-center transition-all duration-200 ${
                activeTag === null
                ? 'bg-slate-700 text-white shadow'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            >
            Todos los Pacientes ({pacientes.length})
        </button>
        {etiquetas.sort((a,b) => a.ordenSecuencia - b.ordenSecuencia).map(etiqueta => {
          const count = getCountForTag(etiqueta.nombreEtiquetaUnico);
          const isActive = activeTag === etiqueta.nombreEtiquetaUnico;
          return (
            <button
              key={etiqueta.nombreEtiquetaUnico}
              onClick={() => onSelectTag(etiqueta.nombreEtiquetaUnico)}
              className={`px-3 py-2 text-sm font-medium rounded-full flex items-center transition-all duration-200 ${
                isActive
                ? `${etiqueta.color} ring-2 ring-offset-1 ring-slate-500 shadow-md`
                : `${etiqueta.color} hover:opacity-80`
              }`}
            >
              <TagIcon />
              {etiqueta.nombreEtiquetaUnico.replace(/_/g, ' ')} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
