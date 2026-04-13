import React, { useState, useEffect, useContext, useMemo } from 'react';
import { PacienteFiliatorio, TurnoConPaciente, ConfiguracionGeneral, EstadoTurnoDia, Profesional } from '../types';
import { api } from '../services/mockApi';
import { AuthContext } from '../App';
import { PROFESIONALES, ESTADO_TURNO_MAP } from '../constants';
// FIX: Consolidated date-fns imports to use named imports from the main package to fix callable expression errors.
import { format, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, addMonths, endOfMonth, isToday, isSameMonth, getDay, isBefore, startOfWeek, subWeeks, subMonths, startOfMonth, startOfDay } from 'date-fns';
// FIX: Changed 'es' import to a named import to fix locale type errors.
import { es } from 'date-fns/locale';

interface AgendaProfesionalProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

type AvailabilityStatus = 'disponible' | 'completo' | 'bloqueado' | 'pasado' | 'no-laboral';

const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
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


export default function AgendaProfesional({ onDateSelect, selectedDate }: AgendaProfesionalProps) {
    const authContext = useContext(AuthContext);
    const [turnos, setTurnos] = useState<TurnoConPaciente[]>([]);
    const [config, setConfig] = useState<ConfiguracionGeneral | null>(null);
    const [calendarAvailability, setCalendarAvailability] = useState<Record<string, AvailabilityStatus>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

    const user = authContext!.user!;

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        Promise.all([
            api.getTurnosParaProfesional(user.email),
            api.getConfiguracionGeneral(user.rol),
        ]).then(([turnosData, configData]) => {
            setTurnos(turnosData);
            setConfig(configData);
        }).catch(() => {
            setError("No se pudieron cargar los datos de la agenda.");
        }).finally(() => {
            setIsLoading(false);
        });
    }, [user.email, user.rol]);
    
    const turnosByDay = useMemo(() => {
        return turnos.reduce((acc, turno) => {
            const dayKey = format(new Date(turno.fechaTurno), 'yyyy-MM-dd');
            if (!acc[dayKey]) {
                acc[dayKey] = 0;
            }
            acc[dayKey]++;
            return acc;
        }, {} as Record<string, number>);
    }, [turnos]);
    
    const changePeriod = (direction: 'prev' | 'next') => {
        const changer = direction === 'prev' 
            ? (viewMode === 'week' ? subWeeks : subMonths)
            : (viewMode === 'week' ? addWeeks : addMonths);
        setCurrentDate(current => changer(current, 1));
    }
    
    const { days, periodLabel } = useMemo(() => {
        if (viewMode === 'week') {
            const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
            return {
                days: eachDayOfInterval({ start: weekStart, end: weekEnd }),
                periodLabel: `Semana del ${format(weekStart, 'd \'de\' LLLL', { locale: es })} al ${format(weekEnd, 'd \'de\' LLLL \'de\' yyyy', { locale: es })}`
            };
        } else { // month view
            const monthStart = startOfMonth(currentDate);
            const monthEnd = endOfMonth(monthStart);
            return {
                days: eachDayOfInterval({ 
                    start: startOfWeek(monthStart, { weekStartsOn: 1 }), 
                    end: endOfWeek(monthEnd, { weekStartsOn: 1 })
                }),
                periodLabel: format(currentDate, 'LLLL yyyy', { locale: es })
            };
        }
    }, [currentDate, viewMode]);

    const professionalConfig = useMemo(() => {
        if (!config || !user) return null;
        return config.configuracionesProfesionales.find(c => c.profesionalEmail === user.email);
    }, [config, user]);

    useEffect(() => {
        if (!professionalConfig || !days.length) return;

        const newAvailability: Record<string, AvailabilityStatus> = {};
        const today = startOfDay(new Date());

        days.forEach(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayOfWeek = getDay(day);

            if (isBefore(day, today)) {
                newAvailability[dayKey] = 'pasado';
                return;
            }

            const specialBlocks = professionalConfig.horariosEspeciales?.filter(h => h.fecha === dayKey) || [];
            if (specialBlocks.length > 0) {
                 const turnosDelDia = turnos.filter(t => isSameDay(new Date(t.fechaTurno), day));
                 let totalSlots = 0;
                 specialBlocks.forEach(block => {
                    const startBlock = new Date(`${dayKey}T${block.horaInicio}:00`);
                    const endBlock = new Date(`${dayKey}T${block.horaFin}:00`);
                    const diffMinutes = (endBlock.getTime() - startBlock.getTime()) / 60000;
                    totalSlots += Math.floor(diffMinutes / professionalConfig.duracionTurnoMinutos);
                 });
                 newAvailability[dayKey] = turnosDelDia.length >= totalSlots ? 'completo' : 'disponible';
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

            const turnosDelDia = turnos.filter(t => isSameDay(new Date(t.fechaTurno), day));
            let totalSlots = 0;
            workingBlocks.forEach(block => {
                const startBlock = new Date(`${dayKey}T${block.horaInicio}:00`);
                const endBlock = new Date(`${dayKey}T${block.horaFin}:00`);
                const diffMinutes = (endBlock.getTime() - startBlock.getTime()) / 60000;
                totalSlots += Math.floor(diffMinutes / professionalConfig.duracionTurnoMinutos);
            });
            
            newAvailability[dayKey] = turnosDelDia.length >= totalSlots ? 'completo' : 'disponible';
        });
        
        setCalendarAvailability(newAvailability);

    }, [days, professionalConfig, turnos]);

    if (isLoading) {
        return <div className="text-center text-slate-500 py-10">Cargando agenda...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 py-10">{error}</div>;
    }
    
    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-slate-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white rounded-md shadow-sm hover:bg-slate-50 border border-slate-300">
                        Hoy
                    </button>
                    <div className="flex items-center">
                         <button onClick={() => changePeriod('prev')} className="p-1.5 rounded-full hover:bg-slate-200 transition-colors"><ChevronLeftIcon/></button>
                         <button onClick={() => changePeriod('next')} className="p-1.5 rounded-full hover:bg-slate-200 transition-colors"><ChevronRightIcon/></button>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 capitalize">
                       {periodLabel}
                    </h3>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-slate-200 p-1 text-sm">
                    <button onClick={() => setViewMode('week')} className={`px-3 py-1 rounded ${viewMode === 'week' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'}`}>Semana</button>
                    <button onClick={() => setViewMode('month')} className={`px-3 py-1 rounded ${viewMode === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'}`}>Mes</button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 border-l border-b border-slate-200 flex-grow">
                {viewMode === 'month' && ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                    <div key={d} className="text-center text-xs font-bold text-slate-500 py-2 border-t border-r border-slate-200 bg-slate-50">{d}</div>
                ))}
                {days.map((day) => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isSel = isSameDay(day, selectedDate);
                    const isTod = isToday(day);
                    const status = calendarAvailability[dayKey];
                    const hasAppointments = turnosByDay[dayKey] > 0;
                    
                    let cellClasses = 'relative p-1 flex flex-col justify-start items-center border-t border-r border-slate-200 transition-colors duration-150 h-full';
                    let dayNumberClasses = 'w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium';
                    let dotClasses = `absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full`;

                    if (viewMode === 'month' && !isCurrentMonth) {
                        cellClasses += ' bg-slate-50 cursor-not-allowed';
                        dayNumberClasses += ' text-slate-400';
                    } else {
                        switch (status) {
                            case 'disponible': cellClasses += ' bg-green-50 hover:bg-green-100 text-green-800 cursor-pointer'; dotClasses += ' bg-green-600'; break;
                            case 'completo': cellClasses += ' bg-red-50 hover:bg-red-100 text-red-800 cursor-pointer'; dotClasses += ' bg-red-600'; break;
                            case 'bloqueado': cellClasses += ' bg-slate-200 text-slate-500 line-through cursor-not-allowed'; break;
                            case 'pasado': cellClasses += ' bg-white text-slate-400 cursor-pointer hover:bg-slate-50'; dotClasses += ' bg-slate-400'; break;
                            default: cellClasses += ' bg-white hover:bg-slate-100 cursor-pointer'; dotClasses += ' bg-indigo-500'; break;
                        }
                    }

                    if (isSel) {
                        cellClasses += ' ring-2 ring-indigo-400 z-10';
                        dayNumberClasses += ' bg-indigo-600 text-white font-bold';
                        dotClasses += ' bg-white';
                    } else if (isTod) {
                        dayNumberClasses += ' ring-2 ring-indigo-300';
                    }
                    
                    return (
                        <div 
                            key={dayKey}
                            className={cellClasses}
                            onClick={() => (status !== 'bloqueado' && !(viewMode === 'month' && !isCurrentMonth)) && onDateSelect(day)}
                        >
                            {viewMode === 'week' ? (
                                <>
                                    <div className="text-xs text-slate-500 font-semibold uppercase">{format(day, 'eee', {locale: es})}</div>
                                    <div className={`${dayNumberClasses} mt-1`}>
                                        {format(day, 'd')}
                                    </div>
                                </>
                            ) : (
                                <div className={dayNumberClasses}>
                                    {format(day, 'd')}
                                </div>
                            )}
                            {hasAppointments && <div className={dotClasses}></div>}
                        </div>
                    )
                })}
            </div>
        </div>
    );
}