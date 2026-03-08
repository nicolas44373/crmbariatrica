import React, { useState, useEffect } from 'react';
import { PacienteFiliatorio, TurnoConPaciente, Profesional, EstadoTurnoDia } from '../types';
import { api } from '../services/mockApi';
import { ESTADO_TURNO_MAP } from '../constants';
// FIX: Consolidated date-fns imports to use named imports from the main package to fix callable expression errors.
import { format, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, startOfWeek } from 'date-fns';
// FIX: Changed 'es' import to a named import to fix locale type errors.
import { es } from 'date-fns/locale';

interface AdminAgendaViewProps {
  onSelectPatient: (patient: PacienteFiliatorio) => void;
}

const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
);
const UserCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 text-slate-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);
const VideoCameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
    </svg>
);
const PlusCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-orange-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


export default function AdminAgendaView({ onSelectPatient }: AdminAgendaViewProps) {
    const [selectedProfesionalEmail, setSelectedProfesionalEmail] = useState<string>('');
    const [profesionales, setProfesionales] = useState<Profesional[]>([]);
    const [allProfesionales, setAllProfesionales] = useState<Profesional[]>([]);
    const [turnos, setTurnos] = useState<TurnoConPaciente[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        Promise.all([
          api.getProfesionales(),
          api.getProfesionalesAdmin()
        ]).then(([profs, allProfs]) => {
            setProfesionales(profs);
            setAllProfesionales(allProfs);
            if (profs.length > 0) {
                setSelectedProfesionalEmail(profs[0].email);
            }
        })
        .catch(() => setError("No se pudieron cargar los profesionales."));
    }, []);

    useEffect(() => {
        if (!selectedProfesionalEmail) {
            setTurnos([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        api.getTurnosParaProfesional(selectedProfesionalEmail)
            .then(setTurnos)
            .catch(() => setError("No se pudieron cargar los turnos para este profesional."))
            .finally(() => setIsLoading(false));
    }, [selectedProfesionalEmail]);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const getCreadorNombre = (email: string) => {
        const profesional = allProfesionales.find(p => p.email === email);
        return profesional ? profesional.nombres : email.split('@')[0];
    }

    const turnosDelDia = (day: Date) => {
        return turnos
            .filter(turno => isSameDay(new Date(turno.fechaTurno), day))
            .sort((a,b) => new Date(a.fechaTurno).getTime() - new Date(b.fechaTurno).getTime());
    }
    
    const changeWeek = (direction: 'prev' | 'next') => {
        setCurrentDate(current => direction === 'prev' ? subWeeks(current, 1) : addWeeks(current, 1));
    }

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b bg-slate-50 gap-4">
                <div className="w-full sm:w-auto sm:flex-1">
                    <label htmlFor="profesional-selector" className="sr-only">Seleccionar Profesional</label>
                    <select
                        id="profesional-selector"
                        value={selectedProfesionalEmail || ''}
                        onChange={e => setSelectedProfesionalEmail(e.target.value)}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="" disabled>Seleccione un profesional...</option>
                        {profesionales.map(p => (
                            <option key={p.email} value={p.email}>{`${p.nombres} ${p.apellido}`} - {p.especialidad}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center justify-center gap-4">
                     <button onClick={() => changeWeek('prev')} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                        <ChevronLeftIcon/>
                    </button>
                    <h3 className="text-md sm:text-lg font-semibold text-slate-700 text-center flex-shrink-0" onClick={() => setCurrentDate(new Date())} style={{cursor: 'pointer'}} title="Volver a la semana actual">
                         {format(weekStart, 'd \'de\' LLLL', { locale: es })} - {format(weekEnd, 'd \'de\' LLLL \'de\' yyyy', { locale: es })}
                    </h3>
                    <button onClick={() => changeWeek('next')} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                        <ChevronRightIcon/>
                    </button>
                </div>
                <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white rounded-md shadow-sm hover:bg-slate-50 border border-slate-300">
                    Hoy
                </button>
            </div>
            
            {isLoading && <div className="text-center text-slate-500 py-10">Cargando agenda...</div>}
            {error && <div className="text-center text-red-500 py-10">{error}</div>}
            {!isLoading && !error && !selectedProfesionalEmail && <div className="text-center text-slate-500 py-10">Por favor, seleccione un profesional para ver su agenda.</div>}
            
            {!isLoading && !error && selectedProfesionalEmail && (
                 <div className="grid grid-cols-1 md:grid-cols-7 min-h-[60vh]">
                    {daysOfWeek.map((day, index) => (
                        <div key={day.toString()} className={`border-slate-200 ${index < 6 ? 'md:border-r' : ''} ${index > 0 ? 'border-t md:border-t-0' : ''}`}>
                            <div className="p-3 bg-slate-100 border-b border-slate-200 text-center">
                                <p className="font-semibold text-slate-600 capitalize">{format(day, 'eeee', { locale: es })}</p>
                                <p className="text-sm text-slate-500">{format(day, 'd')}</p>
                            </div>
                            <div className="p-2 space-y-2 h-full overflow-y-auto">
                                {turnosDelDia(day).length > 0 ? (
                                    turnosDelDia(day).map(turno => {
                                        const estadoInfo = ESTADO_TURNO_MAP[turno.estado] || { texto: turno.estado, color: 'border-slate-500', colorFondo: 'bg-gray-100' };
                                        return (
                                            <div key={turno.idTurno} className={`p-3 rounded-lg shadow-sm ${estadoInfo.colorFondo} border-l-4 ${estadoInfo.color}`}>
                                                <div className="flex justify-between items-center">
                                                    <p className="font-bold text-sm text-slate-800">{format(new Date(turno.fechaTurno), 'HH:mm')}</p>
                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${estadoInfo.colorFondo}`}>
                                                        {estadoInfo.texto}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 my-1">
                                                    {turno.esVideoconsulta && <span title="Videoconsulta"><VideoCameraIcon /></span>}
                                                    {turno.esSobreturno && <span title="Sobreturno"><PlusCircleIcon /></span>}
                                                    <button onClick={() => onSelectPatient(turno.paciente)} className="block text-left font-medium text-indigo-600 hover:underline">
                                                        {turno.paciente.apellido}, {turno.paciente.nombres}
                                                    </button>
                                                </div>
                                                <div className="flex items-center text-xs text-slate-500 mt-1">
                                                    <UserCircleIcon/>
                                                    <span title={turno.creadoPorEmail}>Agendado por: {getCreadorNombre(turno.creadoPorEmail)}</span>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center text-xs text-slate-400 pt-6">
                                        <p>Sin turnos</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}