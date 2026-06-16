import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, startOfWeek, endOfWeek, isSameDay,
  isToday, isSameMonth, getDay, isBefore, startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { PacienteFiliatorio, Profesional, UserRole, Turno } from '../types';
import { api } from '../services/supabaseApi';

// ─── ICONS ────────────────────────────────────────────────────────────────────
const ChevronL = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>);
const ChevronR = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>);
const VideoIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" /></svg>);
const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
const SearchIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>);

interface SlotDisponible {
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
}

interface AgendarTurnoModalProps {
  onClose: () => void;
  onSuccess: () => void;
  pacientePreseleccionado?: PacienteFiliatorio | null;
  profesionalPreseleccionado?: Profesional | null;
  fechaPreseleccionada?: Date | null;
  creadoPorEmail: string;
  turnoAEditar?: Turno | null;
}

export default function AgendarTurnoModal({
  onClose,
  onSuccess,
  pacientePreseleccionado,
  profesionalPreseleccionado,
  fechaPreseleccionada,
  creadoPorEmail,
  turnoAEditar,
}: AgendarTurnoModalProps) {
  // ─── State ────────────────────────────────────────────────────────────────
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [profesionalEmail, setProfesionalEmail] = useState('');
  
  const [mesActual, setMesActual] = useState(() => {
    if (turnoAEditar?.fechaTurno) return new Date(turnoAEditar.fechaTurno);
    return fechaPreseleccionada ?? new Date();
  });
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(() => {
    if (turnoAEditar?.fechaTurno) return new Date(turnoAEditar.fechaTurno);
    return fechaPreseleccionada ?? null;
  });
  
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotDisponible | null>(null);
  const [diasConSlots, setDiasConSlots] = useState<Set<string>>(new Set());

  const [pacienteBusqueda, setPacienteBusqueda] = useState('');
  const [pacientesResultados, setPacientesResultados] = useState<PacienteFiliatorio[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteFiliatorio | null>(
    pacientePreseleccionado ?? null
  );

  const [esVideoconsulta, setEsVideoconsulta] = useState(turnoAEditar?.esVideoconsulta ?? false);
  const [esSobreturno, setEsSobreturno] = useState(turnoAEditar?.esSobreturno ?? false);
  const [nota, setNota] = useState(turnoAEditar?.notaInterna ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProfesional = useMemo(() => {
    return profesionales.find(p => p.email === profesionalEmail) || null;
  }, [profesionales, profesionalEmail]);

  // ─── Cargar profesionales ─────────────────────────────────────────────────
  useEffect(() => {
    api.getProfesionales().then(profs => {
      const medicos = profs.filter(p => p.rol === UserRole.MEDICO && p.activo);
      setProfesionales(medicos);
      if (turnoAEditar?.profesionalEmail) {
        setProfesionalEmail(turnoAEditar.profesionalEmail);
      } else if (profesionalPreseleccionado?.email) {
        setProfesionalEmail(profesionalPreseleccionado.email);
      } else if (medicos.length > 0) {
        setProfesionalEmail(medicos[0].email);
      }
    });
  }, [turnoAEditar, profesionalPreseleccionado]);

  // ─── Cargar días disponibles cuando cambia prof o mes ─────────────────────
  useEffect(() => {
    if (!profesionalEmail) return;
    (api as any).getDiasDisponiblesEnMes(
      profesionalEmail,
      mesActual.getFullYear(),
      mesActual.getMonth()
    ).then(setDiasConSlots);
  }, [profesionalEmail, mesActual]);

  // ─── Cargar slots cuando cambia fecha seleccionada ────────────────────────
  useEffect(() => {
    if (!profesionalEmail || !fechaSeleccionada) {
      setSlots([]);
      return;
    }
    setIsLoadingSlots(true);
    setSlotSeleccionado(null);
    (api as any).getSlotsDisponibles(profesionalEmail, fechaSeleccionada)
      .then((res: SlotDisponible[]) => {
        setSlots(res);
        // Si estamos editando el turno actual y es la fecha actual del turno, pre-seleccionar
        if (turnoAEditar?.fechaTurno) {
          const tDate = new Date(turnoAEditar.fechaTurno);
          if (isSameDay(fechaSeleccionada, tDate)) {
            const hh = String(tDate.getHours()).padStart(2, '0');
            const mm = String(tDate.getMinutes()).padStart(2, '0');
            const hhmm = `${hh}:${mm}`;
            const matchingSlot = res.find(s => s.horaInicio === hhmm);
            if (matchingSlot) {
              setSlotSeleccionado(matchingSlot);
            } else {
              // Si no está disponible pero es el del turno, forzarlo como seleccionado
              const duration = selectedProfesional?.config_turnos?.duracionTurnoMinutos || 30;
              const next = new Date(tDate.getTime() + duration * 60000);
              const ehh = String(next.getHours()).padStart(2, '0');
              const emm = String(next.getMinutes()).padStart(2, '0');
              setSlotSeleccionado({
                horaInicio: hhmm,
                horaFin: `${ehh}:${emm}`,
                disponible: true
              });
            }
          }
        }
      })
      .finally(() => setIsLoadingSlots(false));
  }, [profesionalEmail, fechaSeleccionada, turnoAEditar, selectedProfesional]);

  // ─── Búsqueda de pacientes ────────────────────────────────────────────────
  useEffect(() => {
    const query = pacienteBusqueda.trim().toLowerCase();
    if (query.length < 2) {
      setPacientesResultados([]);
      return;
    }
    api.getPacientes(UserRole.MEDICO).then(pList => {
      const filtered = pList.filter(p => 
        (p.apellido || '').toLowerCase().includes(query) ||
        (p.nombres || '').toLowerCase().includes(query) ||
        (p.dni || '').includes(query) ||
        (p.idPaciente || '').toLowerCase().includes(query) ||
        (p.nroHc && String(p.nroHc).includes(query))
      );
      setPacientesResultados(filtered.slice(0, 8));
    });
  }, [pacienteBusqueda]);

  // ─── Cargar paciente del turno a editar ─────────────────────────────────────
  useEffect(() => {
    if (turnoAEditar?.idPaciente && !pacienteSeleccionado) {
      api.getPacienteCompleto(turnoAEditar.idPaciente, '').then(p => {
        if (p?.filiatorio) setPacienteSeleccionado(p.filiatorio);
      }).catch(e => console.error("Error loading patient for turn edit", e));
    }
  }, [turnoAEditar, pacienteSeleccionado]);

  // ─── Guardar / Reagendar turno ──────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!fechaSeleccionada || !slotSeleccionado) {
      setError('Por favor, seleccioná una fecha y horario.');
      return;
    }
    if (!pacienteSeleccionado) {
      setError('Por favor, seleccioná un paciente.');
      return;
    }
    if (!selectedProfesional) {
      setError('Por favor, seleccioná un profesional.');
      return;
    }

    setIsSaving(true);
    setError(null);

    // Combinar fecha y hora para el timestamp
    const dateStr = format(fechaSeleccionada, 'yyyy-MM-dd');
    const isoFechaTurno = new Date(`${dateStr}T${slotSeleccionado.horaInicio}:00.000`).toISOString();

    try {
      if (turnoAEditar) {
        await api.updateDetallesTurno(turnoAEditar.idTurno, {
          fechaTurno: isoFechaTurno,
          profesionalEmail: profesionalEmail,
          especialidad: selectedProfesional.especialidad ?? 'Consulta',
          notaInterna: nota || undefined,
          esVideoconsulta,
          esSobreturno,
        });
        onSuccess();
      } else {
        await api.createTurno({
          idPaciente: pacienteSeleccionado.idPaciente,
          profesionalEmail: profesionalEmail,
          fechaTurno: isoFechaTurno,
          creadoPorEmail: creadoPorEmail,
          notaInterna: nota || null,
          esVideoconsulta,
          esSobreturno,
          especialidad: selectedProfesional.especialidad ?? 'Consulta',
        }, UserRole.ADMINISTRATIVO);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar el turno.');
      setIsSaving(false);
    }
  };

  // ─── Calendario Render ──────────────────────────────────────────────────────
  const renderCalendario = () => {
    const inicio = startOfWeek(startOfMonth(mesActual), { weekStartsOn: 1 });
    const fin = endOfWeek(endOfMonth(mesActual), { weekStartsOn: 1 });
    const dias = eachDayOfInterval({ start: inicio, end: fin });
    const hoy = startOfDay(new Date());

    return (
      <div className="bg-slate-50 p-4 rounded-xl border">
        {/* Navegación mes */}
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={() => setMesActual(m => subMonths(m, 1))} className="p-1.5 rounded-full hover:bg-slate-200">
            <ChevronL />
          </button>
          <h3 className="font-semibold text-slate-700 capitalize text-sm">
            {format(mesActual, 'MMMM yyyy', { locale: es })}
          </h3>
          <button type="button" onClick={() => setMesActual(m => addMonths(m, 1))} className="p-1.5 rounded-full hover:bg-slate-200">
            <ChevronR />
          </button>
        </div>

        {/* Encabezado días */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
          ))}
        </div>

        {/* Días */}
        <div className="grid grid-cols-7 gap-1">
          {dias.map(dia => {
            const dStr = format(dia, 'yyyy-MM-dd');
            const esMismoMes = isSameMonth(dia, mesActual);
            const esPasado = isBefore(dia, hoy);
            const tieneSlots = diasConSlots.has(dStr);
            const esSeleccionado = fechaSeleccionada && isSameDay(dia, fechaSeleccionada);
            const esDiaHoy = isToday(dia);

            const disabled = !esMismoMes || esPasado || !tieneSlots;

            return (
              <button
                type="button"
                key={dStr}
                disabled={disabled}
                onClick={() => {
                  setFechaSeleccionada(dia);
                  setSlotSeleccionado(null);
                }}
                className={`
                  relative aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all
                  ${disabled ? 'text-slate-300 cursor-not-allowed' : 'cursor-pointer'}
                  ${!disabled && !esSeleccionado ? 'bg-green-50 text-green-800 hover:bg-green-100 font-semibold' : ''}
                  ${esSeleccionado ? 'bg-indigo-600 text-white shadow-md font-bold' : ''}
                  ${esDiaHoy && !esSeleccionado ? 'ring-2 ring-indigo-400' : ''}
                `}
              >
                {format(dia, 'd')}
                {tieneSlots && !esPasado && esMismoMes && !esSeleccionado && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Slots Render ───────────────────────────────────────────────────────────
  const renderSlots = () => {
    if (!fechaSeleccionada) {
      return <p className="text-sm text-slate-400 text-center py-10 bg-slate-50 rounded-xl border border-dashed">Seleccioná un día en el calendario.</p>;
    }
    if (isLoadingSlots) {
      return <p className="text-sm text-slate-400 text-center py-10">Buscando horarios...</p>;
    }

    if (slots.length === 0) {
      return (
        <div className="text-center py-8 bg-orange-50/50 rounded-xl border border-dashed border-orange-200">
          <p className="text-sm text-orange-700">Sin turnos disponibles este día.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Horarios Disponibles
        </p>
        <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
          {slots.map(slot => {
            const isSelected = slotSeleccionado?.horaInicio === slot.horaInicio;
            const isBooked = !slot.disponible;
            
            return (
              <button
                type="button"
                key={slot.horaInicio}
                disabled={isBooked && !esSobreturno}
                onClick={() => {
                  if (isBooked) {
                    if (window.confirm("Este horario ya está ocupado. ¿Querés agendar un sobreturno?")) {
                      setSlotSeleccionado(slot);
                      setEsSobreturno(true);
                    }
                  } else {
                    setSlotSeleccionado(slot);
                  }
                }}
                className={`py-2 px-1 rounded-lg text-sm font-semibold transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow'
                    : isBooked
                    ? 'bg-red-50 border-red-200 text-red-400 line-through cursor-pointer hover:bg-red-100'
                    : 'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-100'
                }`}
              >
                {slot.horaInicio}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl m-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b bg-slate-50 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {turnoAEditar ? 'Reagendar Turno' : 'Agendar Nuevo Turno'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Completá los detalles para agendar la cita.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
        </div>

        {/* Content */}
        <div className="p-6 flex-grow overflow-y-auto space-y-6">
          {error && <p className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">{error}</p>}

          {/* Paciente Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Paciente *</label>
            {pacienteSeleccionado ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-sm">
                  {(pacienteSeleccionado.nombres || '').charAt(0)}{(pacienteSeleccionado.apellido || '').charAt(0)}
                </div>
                <div className="flex-grow">
                  <p className="font-semibold text-slate-800 text-sm">{pacienteSeleccionado.apellido}, {pacienteSeleccionado.nombres}</p>
                  <p className="text-xs text-slate-500">DNI: {pacienteSeleccionado.dni} {pacienteSeleccionado.nroHc ? `· HC: ${pacienteSeleccionado.nroHc}` : ''} · ID: {pacienteSeleccionado.idPaciente}</p>
                </div>
                {!turnoAEditar && (
                  <button onClick={() => { setPacienteSeleccionado(null); setPacienteBusqueda(''); }} className="text-xs text-red-600 hover:underline font-semibold">Cambiar</button>
                )}
              </div>
            ) : (
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></div>
                <input
                  type="text"
                  value={pacienteBusqueda}
                  onChange={e => setPacienteBusqueda(e.target.value)}
                  placeholder="Buscar paciente por apellido, DNI, HC o ID..."
                  className="block w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:border-indigo-500 outline-none"
                />
                {pacientesResultados.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                    {pacientesResultados.map(p => (
                      <button
                        key={p.idPaciente}
                        onClick={() => { setPacienteSeleccionado(p); setPacienteBusqueda(''); setPacientesResultados([]); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 border-b last:border-b-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold">
                          {(p.nombres || '').charAt(0)}{(p.apellido || '').charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{p.apellido}, {p.nombres}</p>
                          <p className="text-xs text-slate-500">DNI: {p.dni} {p.nroHc ? `· HC: ${p.nroHc}` : ''} · ID: {p.idPaciente}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Profesional y Agenda */}
            <div className="space-y-4">
              <div>
                <label htmlFor="profesional-select" className="block text-sm font-semibold text-slate-700 mb-2">Profesional *</label>
                <select
                  id="profesional-select"
                  value={profesionalEmail}
                  onChange={e => {
                    setProfesionalEmail(e.target.value);
                    setFechaSeleccionada(null);
                    setSlotSeleccionado(null);
                  }}
                  className="block w-full rounded-xl border border-slate-300 text-sm p-2.5 outline-none focus:border-indigo-500"
                >
                  <option value="">Seleccionar profesional...</option>
                  {profesionales.map(p => (
                    <option key={p.email} value={p.email}>
                      {`${p.nombres} ${p.apellido} — ${p.especialidad || 'Sin especialidad'}`}
                    </option>
                  ))}
                </select>
              </div>

              {renderCalendario()}
            </div>

            {/* Slots y Opciones */}
            <div className="space-y-6">
              {renderSlots()}

              {/* Opciones Adicionales */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Opciones del turno</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={esVideoconsulta}
                      onChange={e => setEsVideoconsulta(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <VideoIcon />
                    <span className="text-sm text-slate-700 font-medium">Videoconsulta</span>
                  </label>
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={esSobreturno}
                      onChange={e => setEsSobreturno(e.target.checked)}
                      className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4"
                    />
                    <PlusIcon />
                    <span className="text-sm text-slate-700 font-medium">Sobreturno</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nota interna (opcional)</label>
                  <textarea
                    value={nota}
                    onChange={e => setNota(e.target.value)}
                    rows={2}
                    placeholder="Ej: Traer ecografía, viene acompañado..."
                    className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 rounded-b-2xl flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={isSaving || !pacienteSeleccionado || !slotSeleccionado || !profesionalEmail}
            className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-xl shadow-sm"
          >
            {isSaving ? 'Guardando...' : turnoAEditar ? '✓ Confirmar Reagendar' : '✓ Confirmar Turno'}
          </button>
        </div>
      </div>
    </div>
  );
}