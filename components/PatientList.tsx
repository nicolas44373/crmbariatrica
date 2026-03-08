import React from 'react';
import { PacienteFiliatorio } from '../types';
import { ETIQUETAS_FLUJO } from '../constants';

interface PatientListProps {
  pacientes: PacienteFiliatorio[];
  onSelectPatient: (patient: PacienteFiliatorio) => void;
  onAddNewPatient?: () => void;
}

const TagBadge = ({ tagName }: { tagName: string }) => {
    const etiquetaInfo = ETIQUETAS_FLUJO.find(e => e.nombreEtiquetaUnico === tagName);
    const color = etiquetaInfo ? etiquetaInfo.color : 'bg-gray-200 text-gray-800';
    const text = tagName.replace(/_/g, ' ');
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
            {text}
        </span>
    );
};

const UserPlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
    </svg>
);


export default function PatientList({ pacientes, onSelectPatient, onAddNewPatient }: PatientListProps) {
  if (pacientes.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center border-2 border-dashed border-slate-200">
        <h3 className="text-lg font-semibold text-slate-700">No se encontraron pacientes</h3>
        <p className="text-slate-500 mt-2 mb-4">No hay pacientes que coincidan con los filtros seleccionados.</p>
        {onAddNewPatient && (
             <button
                onClick={onAddNewPatient}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 transition-colors"
            >
                <UserPlusIcon />
                Ingresar Nuevo Paciente
            </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Paciente</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contacto</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Etiqueta Principal</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cirujano Asignado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {pacientes.map((paciente) => (
              <tr key={paciente.idPaciente} onClick={() => onSelectPatient(paciente)} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">{paciente.apellido}, {paciente.nombres}</div>
                  <div className="text-sm text-slate-500">DNI: {paciente.dni}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">{paciente.email}</div>
                  <div className="text-sm text-slate-500">{paciente.telefono}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <TagBadge tagName={paciente.etiquetaPrincipalActiva} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {paciente.cirujanoAsignado}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}