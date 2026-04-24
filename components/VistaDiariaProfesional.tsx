import React, { useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import { PacienteFiliatorio, TurnoDiario, EstadoTurnoDia, UserRole, Turno, Profesional } from '../types';
import { api } from '../services/mockApi';
import { AuthContext } from '../App';
import { ESTADO_TURNO_MAP, ETIQUETAS_FLUJO } from '../constants';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

interface VistaDiariaProfesionalProps {
  onSelectPatient: (patient: PacienteFiliatorio) => void;
  date: Date;
}

// --- Helper Hook ---
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

// --- Icons ---
const CheckCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
const PhoneArrowUpRightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="m15 15-6 6m0 0-6-6m6 6V9a6 6 0 0 1 12 0v3" /></svg>);
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


export default function VistaDiariaProfesional({ onSelectPatient, date }: VistaDiariaProfesionalProps) {
    const authContext = useContext(AuthContext);
    const [turnos, setTurnos] = useState<TurnoDiario[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const user = authContext!.user!;

    const fetchData = useCallback(() => {
        setIsLoading(true);
        setError(null);
        api.getTurnosDiariosTodosProfesionales(date)
            .then(allTurnos => {
                const myTurnos = allTurnos.filter(t => t.profesionalEmail === user.email);
                setTurnos(myTurnos);
            })
            .catch(() => setError(`No se pudieron cargar los turnos para el ${format(date, 'dd/MM/yyyy')}.`))
            .finally(() => setIsLoading(false));
    }, [user.email, date]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdate = useCallback(async (turnoId: string, updates: Partial<Turno>) => {
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
        handleUpdate(turnoId, { notaInterna: nota });
    }, 800);

    const debouncedValorUpdate = useDebouncedCallback((turnoId: string, valor: number) => {
        handleUpdate(turnoId, { valorCobrado: valor });
    }, 800);

    const renderTurnoRow = (turno: TurnoDiario) => {
        const estadoInfo = ESTADO_TURNO_MAP[turno.estado];
        
        const getActionButtons = () => {
            switch (turno.estado) {
                case EstadoTurnoDia.AGENDADO:
                case EstadoTurnoDia.CONFIRMADO:
                     return <button onClick={() => handleUpdate(turno.idTurno, { estado: EstadoTurnoDia.EN_ESPERA })} className="flex items-center text-sm font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded-md transition-colors whitespace-nowrap"><CheckCircleIcon/>Registrar Llegada</button>
                case EstadoTurnoDia.EN_ESPERA:
                     return <button onClick={() => { handleUpdate(turno.idTurno, { estado: EstadoTurnoDia.ATENDIDO }); onSelectPatient(turno.paciente); }} className="flex items-center text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-md transition-colors whitespace-nowrap"><PhoneArrowUpRightIcon/>Llamar a Consulta</button>
                default:
                    return null;
            }
        }

        return (
            <div key={turno.idTurno} className={`p-4 rounded-lg shadow-sm bg-white border-l-4 ${estadoInfo.color} grid grid-cols-12 gap-x-4 gap-y-2 items-center`}>
                {/* 1. Hora Turno */}
                <div className="col-span-12 sm:col-span-1 text-center sm:text-left">
                    <p className="font-bold text-lg text-slate-800">{format(new Date(turno.fechaTurno), 'HH:mm')}</p>
                </div>
                
                {/* 2. Paciente */}
                <div className="col-span-12 sm:col-span-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => onSelectPatient(turno.paciente)} className="block text-left font-semibold text-indigo-700 hover:underline">
                            {turno.paciente.apellido}, {turno.paciente.nombres}
                        </button>
                        {turno.esVideoconsulta && <span title="Videoconsulta"><VideoCameraIcon /></span>}
                        {turno.esSobreturno && <span title="Sobreturno"><PlusCircleIcon /></span>}
                    </div>
                    <p className="text-sm text-slate-500">DNI: {turno.paciente.dni}</p>
                    {turno.paciente.etiquetaPrincipalActiva && (() => {
                        const etiqueta = ETIQUETAS_FLUJO.find(e => e.nombreEtiquetaUnico === turno.paciente.etiquetaPrincipalActiva);
                        if (!etiqueta) return null;
                        return (
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${etiqueta.color}`}>
                                {etiqueta.nombreEtiquetaUnico.replace(/_/g, ' ')}
                            </span>
                        );
                    })()}
                </div>
                
                {/* 3. Tiempos (Llegada/Atención) */}
                <div className="col-span-12 sm:col-span-2 text-xs text-slate-600 space-y-1">
                    <p title={turno.horaLlegada ? `Hora de llegada: ${format(new Date(turno.horaLlegada), 'HH:mm:ss')}` : 'Paciente no ha llegado'}>
                        <span className="font-semibold text-slate-500">Llegada:</span> {turno.horaLlegada ? format(new Date(turno.horaLlegada), 'HH:mm') : ' -'}
                    </p>
                    <p title={turno.horaAtencion ? `Hora de atención: ${format(new Date(turno.horaAtencion), 'HH:mm:ss')}` : 'Paciente no atendido'}>
                        <span className="font-semibold text-slate-500">Atendido:</span> {turno.horaAtencion ? format(new Date(turno.horaAtencion), 'HH:mm') : ' -'}
                    </p>
                </div>

                {/* 4. Estado */}
                <div className="col-span-12 sm:col-span-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${estadoInfo.colorFondo} whitespace-nowrap`}>{estadoInfo.texto}</span>
                </div>

                {/* 5. Nota */}
                <div className="col-span-12 sm:col-span-2">
                     <label htmlFor={`nota-${turno.idTurno}`} className="sr-only">Nota Interna</label>
                     <textarea
                        id={`nota-${turno.idTurno}`}
                        rows={1}
                        defaultValue={turno.notaInterna || ''}
                        onChange={(e) => debouncedNotaUpdate(turno.idTurno, e.target.value)}
                        placeholder="Nota interna..."
                        className="block w-full text-sm p-2 rounded-md border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                     />
                </div>
                
                {/* 6. Cobro */}
                <div className="col-span-12 sm:col-span-1">
                     <label htmlFor={`valor-${turno.idTurno}`} className="sr-only">Valor Cobrado</label>
                     <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                           <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                            type="text"
                            inputMode="decimal"
                            id={`valor-${turno.idTurno}`}
                            defaultValue={turno.valorCobrado || ''}
                            onChange={(e) => debouncedValorUpdate(turno.idTurno, parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="block w-full text-sm p-2 pl-7 rounded-md border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                         />
                     </div>
                </div>

                {/* 7. Acciones */}
                <div className="col-span-12 sm:col-span-2 flex justify-start sm:justify-end">
                    {getActionButtons()}
                </div>
            </div>
        )
    };
    
    const summary = useMemo(() => {
        const atendidos = turnos.filter(t => t.estado === EstadoTurnoDia.ATENDIDO).length;
        const totalRecaudado = turnos.reduce((acc, t) => acc + (t.valorCobrado || 0), 0);
        return { atendidos, totalRecaudado, totalTurnos: turnos.length };
    }, [turnos]);


    const title = isToday(date) 
        ? "Agenda de Hoy" 
        : `Agenda del ${format(date, "eeee d 'de' MMMM", { locale: es })}`;

    if (isLoading) return <div className="text-center text-slate-500 py-10 bg-white rounded-lg shadow-lg h-full flex items-center justify-center">Cargando agenda...</div>;
    if (error) return <div className="text-center text-red-500 py-10 bg-white rounded-lg shadow-lg h-full flex items-center justify-center">{error}</div>;

    return (
        <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
            <h3 className="text-lg font-semibold text-slate-800 capitalize p-4 border-b">{title}</h3>
            <div className="space-y-4 p-4 flex-grow overflow-y-auto">
                {turnos.length > 0 ? (
                    <>
                        <div className="space-y-3">
                        {turnos.map(renderTurnoRow)}
                        </div>
                        
                    </>
                ) : (
                    <div className="text-center py-16">
                        <h3 className="text-lg font-semibold text-slate-700">No hay turnos programados para este día.</h3>
                    </div>
                )}
            </div>
            {turnos.length > 0 && (
                <div className="p-4 bg-slate-100 rounded-b-lg flex justify-end items-center gap-6 mt-auto text-right border-t">
                    <div className="font-semibold">
                        <span className="text-slate-600">Pacientes Atendidos: </span>
                        <span className="text-slate-800">{summary.atendidos} de {summary.totalTurnos}</span>
                    </div>
                        <div className="font-semibold">
                        <span className="text-slate-600">Total Recaudado: </span>
                        <span className="text-green-700 text-lg">${summary.totalRecaudado.toLocaleString('es-AR')}</span>
                    </div>
                </div>
            )}
        </div>
    );
}