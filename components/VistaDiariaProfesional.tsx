import React, { useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import { PacienteFiliatorio, TurnoDiario, EstadoTurnoDia, UserRole, Turno, Profesional } from '../types';
import { api } from '../services/mockApi';
import { AuthContext } from '../App';
import { ESTADO_TURNO_MAP, ETIQUETAS_FLUJO } from '../constants';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import AgendarTurnoModal from './Agendarturnomodal';

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
    const [allProfesionales, setAllProfesionales] = useState<Profesional[]>([]);
    const [turnoAReagendar, setTurnoAReagendar] = useState<TurnoDiario | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const user = authContext!.user!;

    useEffect(() => {
        api.getProfesionalesAdmin()
            .then(data => setAllProfesionales(data.filter(p => p.activo)))
            .catch(err => console.error("Error loading professionals:", err));
    }, []);

    const fetchData = useCallback(() => {
        setIsLoading(true);
        setError(null);
        const isPastDay = isBefore(startOfDay(date), startOfDay(new Date()));
        api.getTurnosDiariosTodosProfesionales(date)
            .then(async allTurnos => {
                let myTurnos = allTurnos.filter(t => t.profesionalEmail === user.email && t.estado !== EstadoTurnoDia.CANCELADO);

                // Auto-mark AUSENTE for past days with unresolved appointments
                if (isPastDay) {
                    const pendingIds = myTurnos
                        .filter(t =>
                            t.estado === EstadoTurnoDia.AGENDADO ||
                            t.estado === EstadoTurnoDia.CONFIRMADO ||
                            t.estado === EstadoTurnoDia.EN_ESPERA
                        )
                        .map(t => t.idTurno);

                    if (pendingIds.length > 0) {
                        await Promise.allSettled(
                            pendingIds.map(id =>
                                api.updateDetallesTurno(id, { estado: EstadoTurnoDia.AUSENTE }, user)
                            )
                        );
                        // Reload after auto-marking
                        const refreshed = await api.getTurnosDiariosTodosProfesionales(date);
                        myTurnos = refreshed.filter(t => t.profesionalEmail === user.email && t.estado !== EstadoTurnoDia.CANCELADO);
                    }
                }
                setTurnos(myTurnos);
            })
            .catch(() => setError(`No se pudieron cargar los turnos para el ${format(date, 'dd/MM/yyyy')}.`))
            .finally(() => setIsLoading(false));
    }, [user, date]);

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
                <div className="col-span-12 sm:col-span-1 text-center sm:text-left flex flex-row sm:flex-col justify-between items-center sm:items-start gap-1">
                    <p className="font-bold text-lg text-slate-800">{format(new Date(turno.fechaTurno), 'HH:mm')}</p>
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
                            onClick={async () => {
                                if (window.confirm("¿Está seguro de que desea cancelar este turno?")) {
                                    await handleUpdate(turno.idTurno, { estado: EstadoTurnoDia.CANCELADO });
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
                <div className="col-span-12 sm:col-span-1 flex flex-col items-center sm:items-start gap-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${estadoInfo.colorFondo} whitespace-nowrap`}>{estadoInfo.texto}</span>
                    {turno.estado === EstadoTurnoDia.EN_ESPERA && (
                        <button 
                            onClick={() => handleUpdate(turno.idTurno, { estado: EstadoTurnoDia.AGENDADO, horaLlegada: null })}
                            className="text-[9px] text-slate-500 hover:text-indigo-600 underline"
                            title="Revertir check-in de llegada"
                        >
                            (Deshacer)
                        </button>
                    )}
                </div>
 
                {/* 5. Nota */}
                <div className="col-span-12 sm:col-span-2">
                     <label htmlFor={`nota-${turno.idTurno}`} className="sr-only">Nota Interna</label>
                     <textarea
                        id={`nota-${turno.idTurno}`}
                        rows={1}
                        defaultValue={turno.notaInterna || ''}
                        onChange={(e) => debouncedNotaUpdate(turno.idTurno, e.target.value)}
                        onBlur={(e) => handleUpdate(turno.idTurno, { notaInterna: e.target.value })}
                        placeholder="Nota interna..."
                        className="block w-full text-sm p-2 compact-input rounded-md border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                     />
                </div>
                
                {/* 6. Cobro */}
                <div className="col-span-12 sm:col-span-1 space-y-1">
                     <label htmlFor={`valor-${turno.idTurno}`} className="sr-only">Valor Cobrado</label>
                     <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                           <span className="text-gray-500 text-xs">$</span>
                        </div>
                        <input
                            type="text"
                            inputMode="decimal"
                            id={`valor-${turno.idTurno}`}
                            defaultValue={turno.valorCobrado || ''}
                            onChange={(e) => debouncedValorUpdate(turno.idTurno, parseFloat(e.target.value) || 0)}
                            onBlur={(e) => handleUpdate(turno.idTurno, { valorCobrado: parseFloat(e.target.value) || 0 })}
                            placeholder="Valor"
                            className="block w-full text-xs p-1 pl-5 compact-input rounded border-slate-300 shadow-sm"
                         />
                     </div>
                     <select
                         value={turno.metodoPago || ''}
                         onChange={(e) => handleUpdate(turno.idTurno, { metodoPago: e.target.value as any })}
                         className="block w-full text-[10px] p-1 compact-input rounded border-slate-300 bg-white"
                     >
                         <option value="">...</option>
                         <option value="Efectivo">Efectivo</option>
                         <option value="Transferencia">Transferencia</option>
                         <option value="Tarjeta">Tarjeta</option>
                     </select>
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
                <div className="p-4 bg-slate-100 rounded-b-lg flex flex-col sm:flex-row justify-end items-end sm:items-center gap-2 sm:gap-6 mt-auto text-right border-t">
                    <div className="font-semibold text-sm sm:text-base">
                        <span className="text-slate-600">Pacientes Atendidos: </span>
                        <span className="text-slate-800">{summary.atendidos} de {summary.totalTurnos}</span>
                    </div>
                    <div className="font-semibold text-sm sm:text-base">
                        <span className="text-slate-600">Total Recaudado: </span>
                        <span className="text-green-700 text-base sm:text-lg">${summary.totalRecaudado.toLocaleString('es-AR')}</span>
                    </div>
                </div>
            )}
            {turnoAReagendar && (
                <AgendarTurnoModal
                    onClose={() => setTurnoAReagendar(null)}
                    onSuccess={async () => {
                        setTurnoAReagendar(null);
                        // Delete/cancel old appointment after rescheduling succeeds
                        if (turnoAReagendar.idTurno) {
                            await api.updateDetallesTurno(turnoAReagendar.idTurno, { estado: EstadoTurnoDia.CANCELADO }, user);
                        }
                        fetchData();
                    }}
                    pacientePreseleccionado={turnoAReagendar.paciente}
                    profesionalPreseleccionado={allProfesionales.find(p => p.email === turnoAReagendar.profesionalEmail)}
                    creadoPorEmail={user.email}
                />
            )}
        </div>
    );
}