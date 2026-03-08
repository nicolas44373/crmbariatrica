import React, { useState, useEffect, useCallback } from 'react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, startOfWeek, endOfWeek, isSameDay,
  isToday, isSameMonth, getDay, isBefore, startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { PacienteFiliatorio, Profesional, UserRole } from '../types';
import { api } from '../services/supabaseApi';

// Definido localmente hasta que se exporte desde supabaseApi
interface SlotDisponible {
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const ChevronL = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>);
const ChevronR = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>);
const VideoIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" /></svg>);
const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);

interface AgendarTurnoModalProps {
  onClose: () => void;
  onSuccess: () => void;
  pacientePreseleccionado?: PacienteFiliatorio | null;
  profesionalPreseleccionado?: Profesional | null;
  fechaPreseleccionada?: Date | null;
  creadoPorEmail: string;
}

type Step = 'profesional' | 'fecha' | 'hora' | 'confirmar';

export default function AgendarTurnoModal({
  onClose,
  onSuccess,
  pacientePreseleccionado,
  profesionalPreseleccionado,
  fechaPreseleccionada,
  creadoPorEmail,
}: AgendarTurnoModalProps) {
  // ─── State ────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('profesional');
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState<Profesional | null>(
    profesionalPreseleccionado ?? null
  );
  const [mesActual, setMesActual] = useState(fechaPreseleccionada ?? new Date());
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(
    fechaPreseleccionada ?? null
  );
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotDisponible | null>(null);
  const [diasConSlots, setDiasConSlots] = useState<Set<string>>(new Set());

  const [pacienteBusqueda, setPacienteBusqueda] = useState('');
  const [pacientesResultados, setPacientesResultados] = useState<PacienteFiliatorio[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteFiliatorio | null>(
    pacientePreseleccionado ?? null
  );

  const [esVideoconsulta, setEsVideoconsulta] = useState(false);
  const [esSobreturno, setEsSobreturno] = useState(false);
  const [nota, setNota] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Cargar profesionales ─────────────────────────────────────────────────
  useEffect(() => {
    api.getProfesionales().then(profs => {
      const medicos = profs.filter(p => p.rol === UserRole.MEDICO);
      setProfesionales(medicos);
    });
  }, []);

  // ─── Cargar días disponibles cuando cambia prof o mes ─────────────────────
  useEffect(() => {
    if (!profesionalSeleccionado) return;
    (api as any).getDiasDisponiblesEnMes(
      profesionalSeleccionado.email,
      mesActual.getFullYear(),
      mesActual.getMonth()
    ).then(setDiasConSlots);
  }, [profesionalSeleccionado, mesActual]);

  // ─── Cargar slots cuando cambia fecha seleccionada ────────────────────────
  useEffect(() => {
    if (!profesionalSeleccionado || !fechaSeleccionada) return;
    setIsLoadingSlots(true);
    setSlotSeleccionado(null);
    (api as any).getSlotsDisponibles(profesionalSeleccionado.email, fechaSeleccionada)
      .then(setSlots)
      .finally(() => setIsLoadingSlots(false));
  }, [profesionalSeleccionado, fechaSeleccionada]);

  // ─── Búsqueda de pacientes ────────────────────────────────────────────────
  useEffect(() => {
    if (pacienteBusqueda.length < 2) {
      setPacientesResultados([]);
      return;
    }
    const query = pacienteBusqueda.toLowerCase();
    api.getPacientes(UserRole.ADMINISTRATIVO).then(pacientes => {
      setPacientesResultados(
        pacientes.filter(p =>
          `${p.apellido} ${p.nombres}`.toLowerCase().includes(query) ||
          p.dni.includes(pacienteBusqueda)
        ).slice(0, 8)
      );
    });
  }, [pacienteBusqueda]);

  // ─── Avanzar step automáticamente ────────────────────────────────────────
  useEffect(() => {
    if (profesionalSeleccionado && step === 'profesional') setStep('fecha');
  }, [profesionalSeleccionado]);

  useEffect(() => {
    if (fechaSeleccionada && step === 'fecha') setStep('hora');
  }, [fechaSeleccionada]);

  useEffect(() => {
    if (slotSeleccionado && step === 'hora') setStep('confirmar');
  }, [slotSeleccionado]);

  // ─── Calendario ──────────────────────────────────────────────────────────
  const renderCalendario = () => {
    const inicio = startOfWeek(startOfMonth(mesActual), { weekStartsOn: 1 });
    const fin = endOfWeek(endOfMonth(mesActual), { weekStartsOn: 1 });
    const dias = eachDayOfInterval({ start: inicio, end: fin });
    const hoy = startOfDay(new Date());

    return (
      <div>
        {/* Navegación mes */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setMesActual(m => subMonths(m, 1))} className="p-1.5 rounded-full hover:bg-slate-100">
            <ChevronL />
          </button>
          <h3 className="font-semibold text-slate-700 capitalize text-sm">
            {format(mesActual, 'MMMM yyyy', { locale: es })}
          </h3>
          <button onClick={() => setMesActual(m => addMonths(m, 1))} className="p-1.5 rounded-full hover:bg-slate-100">
            <ChevronR />
          </button>
        </div>

        {/* Encabezado días */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
          ))}
        </div>

        {/* Días */}
        <div className="grid grid-cols-7 gap-0.5">
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
                key={dStr}
                disabled={disabled}
                onClick={() => {
                  setFechaSeleccionada(dia);
                  setSlotSeleccionado(null);
                  setStep('hora');
                }}
                className={`
                  relative aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                  ${disabled ? 'text-slate-200 cursor-not-allowed' : 'cursor-pointer'}
                  ${!disabled && !esSeleccionado ? 'hover:bg-indigo-50 text-slate-700' : ''}
                  ${esSeleccionado ? 'bg-indigo-600 text-white shadow-md' : ''}
                  ${esDiaHoy && !esSeleccionado ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}
                  ${tieneSlots && !esPasado && esMismoMes && !esSeleccionado ? 'text-slate-800' : ''}
                `}
              >
                {format(dia, 'd')}
                {tieneSlots && !esPasado && esMismoMes && !esSeleccionado && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Slots ────────────────────────────────────────────────────────────────
  const renderSlots = () => {
    if (isLoadingSlots) {
      return <p className="text-sm text-slate-400 text-center py-6">Cargando horarios...</p>;
    }

    const disponibles = slots.filter(s => s.disponible);
    const ocupados = slots.filter(s => !s.disponible);

    if (slots.length === 0) {
      return (
        <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p className="text-sm text-slate-500">No hay horarios configurados para este día.</p>
          <button onClick={() => { setFechaSeleccionada(null); setStep('fecha'); }} className="text-xs text-indigo-600 mt-1 hover:underline">
            Elegir otra fecha
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {disponibles.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Disponibles ({disponibles.length})
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {disponibles.map(slot => {
                const isSelected = slotSeleccionado?.horaInicio === slot.horaInicio;
                return (
                  <button
                    key={slot.horaInicio}
                    onClick={() => { setSlotSeleccionado(slot); setStep('confirmar'); }}
                    className={`py-2 px-1 rounded-xl text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md scale-105'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                    }`}
                  >
                    {format(new Date(slot.horaInicio), 'HH:mm')}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {ocupados.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Ocupados ({ocupados.length})
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ocupados.map(slot => (
                <div
                  key={slot.horaInicio}
                  className="py-2 px-1 rounded-xl text-sm font-medium text-slate-400 bg-slate-100 text-center cursor-not-allowed border border-slate-200 line-through"
                >
                  {format(new Date(slot.horaInicio), 'HH:mm')}
                </div>
              ))}
            </div>
          </div>
        )}
        {disponibles.length === 0 && (
          <div className="text-center py-4 bg-red-50 rounded-xl border border-red-200">
            <p className="text-sm text-red-600 font-medium">Sin turnos disponibles este día.</p>
            <button onClick={() => { setFechaSeleccionada(null); setStep('fecha'); }} className="text-xs text-red-500 mt-1 hover:underline">
              Elegir otra fecha
            </button>
          </div>
        )}
      </div>
    );
  };

  // ─── Guardar turno ────────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!pacienteSeleccionado || !profesionalSeleccionado || !slotSeleccionado) {
      setError('Completá todos los datos antes de confirmar.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await api.createTurno({
        idPaciente: pacienteSeleccionado.idPaciente,
        profesionalEmail: profesionalSeleccionado.email,
        fechaTurno: slotSeleccionado.horaInicio,
        creadoPorEmail: creadoPorEmail,
        notaInterna: nota || null,
        esVideoconsulta,
        esSobreturno,
        especialidad: profesionalSeleccionado.especialidad ?? null,
      }, UserRole.ADMINISTRATIVO);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el turno.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Breadcrumb ───────────────────────────────────────────────────────────
  const steps: { key: Step; label: string }[] = [
    { key: 'profesional', label: 'Profesional' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'hora', label: 'Hora' },
    { key: 'confirmar', label: 'Confirmar' },
  ];
  const stepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl m-4 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-5 border-b bg-slate-50 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Agendar Turno</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
          </div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <React.Fragment key={s.key}>
                <button
                  disabled={i > stepIndex}
                  onClick={() => i < stepIndex && setStep(s.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    i === stepIndex ? 'bg-indigo-600 text-white' :
                    i < stepIndex ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 cursor-pointer' :
                    'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {i + 1}. {s.label}
                </button>
                {i < steps.length - 1 && (
                  <div className={`h-px flex-1 ${i < stepIndex ? 'bg-indigo-300' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-grow overflow-y-auto">

          {/* STEP: Profesional */}
          {step === 'profesional' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700">Seleccioná el profesional</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profesionales.map(prof => (
                  <button
                    key={prof.email}
                    onClick={() => setProfesionalSeleccionado(prof)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      profesionalSeleccionado?.email === prof.email
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {prof.nombres.charAt(0)}{prof.apellido.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{prof.nombres} {prof.apellido}</p>
                      <p className="text-xs text-slate-500">{prof.especialidad || 'Sin especialidad'}</p>
                    </div>
                  </button>
                ))}
              </div>
              {profesionales.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">
                  No hay profesionales activos. Creá uno en Configuración → Usuarios.
                </p>
              )}
            </div>
          )}

          {/* STEP: Fecha */}
          {step === 'fecha' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {profesionalSeleccionado?.nombres.charAt(0)}{profesionalSeleccionado?.apellido.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm">{profesionalSeleccionado?.nombres} {profesionalSeleccionado?.apellido}</p>
                  <p className="text-xs text-slate-500">{profesionalSeleccionado?.especialidad}</p>
                </div>
                <button onClick={() => { setProfesionalSeleccionado(null); setStep('profesional'); }} className="ml-auto text-xs text-slate-400 hover:text-slate-600">Cambiar</button>
              </div>

              {/* Sobreturno toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={`relative w-10 h-5 rounded-full transition-colors ${esSobreturno ? 'bg-orange-500' : 'bg-slate-200'}`} onClick={() => setEsSobreturno(!esSobreturno)}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${esSobreturno ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-slate-700 flex items-center gap-1">
                  <PlusIcon /> Sobreturno (ignorar horario configurado)
                </span>
              </label>

              {esSobreturno ? (
                <div className="space-y-2">
                  <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded-lg">
                    En sobreturno podés elegir cualquier fecha y hora manualmente.
                  </p>
                  <input
                    type="datetime-local"
                    onChange={e => {
                      const d = new Date(e.target.value);
                      setFechaSeleccionada(d);
                      setSlotSeleccionado({ horaInicio: d.toISOString(), horaFin: new Date(d.getTime() + 30 * 60000).toISOString(), disponible: true });
                      setStep('confirmar');
                    }}
                    className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
              ) : (
                renderCalendario()
              )}
            </div>
          )}

          {/* STEP: Hora */}
          {step === 'hora' && fechaSeleccionada && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-700">
                    {format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
                  </h3>
                  <p className="text-xs text-slate-500">{profesionalSeleccionado?.nombres} {profesionalSeleccionado?.apellido}</p>
                </div>
                <button onClick={() => { setFechaSeleccionada(null); setStep('fecha'); }} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100">
                  ← Cambiar fecha
                </button>
              </div>
              {renderSlots()}
            </div>
          )}

          {/* STEP: Confirmar */}
          {step === 'confirmar' && (
            <div className="space-y-5">
              {/* Resumen del turno */}
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2">
                <h3 className="font-semibold text-indigo-800 text-sm">Resumen del turno</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-slate-500">Profesional:</span>
                  <span className="font-medium">{profesionalSeleccionado?.nombres} {profesionalSeleccionado?.apellido}</span>
                  <span className="text-slate-500">Especialidad:</span>
                  <span className="font-medium">{profesionalSeleccionado?.especialidad || '—'}</span>
                  <span className="text-slate-500">Fecha:</span>
                  <span className="font-medium">
                    {fechaSeleccionada ? format(fechaSeleccionada, "dd/MM/yyyy", { locale: es }) : '—'}
                  </span>
                  <span className="text-slate-500">Hora:</span>
                  <span className="font-medium text-indigo-700 text-base">
                    {slotSeleccionado ? format(new Date(slotSeleccionado.horaInicio), 'HH:mm') : '—'}
                    {slotSeleccionado ? ` – ${format(new Date(slotSeleccionado.horaFin), 'HH:mm')}` : ''}
                  </span>
                </div>
              </div>

              {/* Paciente */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Paciente *</label>
                {pacienteSeleccionado ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-green-200 text-green-800 flex items-center justify-center font-bold text-sm">
                      {pacienteSeleccionado.nombres.charAt(0)}{pacienteSeleccionado.apellido.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 text-sm">{pacienteSeleccionado.apellido}, {pacienteSeleccionado.nombres}</p>
                      <p className="text-xs text-slate-500">DNI: {pacienteSeleccionado.dni}</p>
                    </div>
                    <button onClick={() => { setPacienteSeleccionado(null); setPacienteBusqueda(''); }} className="text-xs text-red-500 hover:text-red-700">Cambiar</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={pacienteBusqueda}
                      onChange={e => setPacienteBusqueda(e.target.value)}
                      placeholder="Buscar por apellido o DNI..."
                      className="block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 outline-none"
                    />
                    {pacientesResultados.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                        {pacientesResultados.map(p => (
                          <button
                            key={p.idPaciente}
                            onClick={() => { setPacienteSeleccionado(p); setPacienteBusqueda(''); setPacientesResultados([]); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 border-b last:border-b-0"
                          >
                            <div>
                              <p className="font-medium text-slate-800 text-sm">{p.apellido}, {p.nombres}</p>
                              <p className="text-xs text-slate-500">DNI: {p.dni}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Opciones */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={esVideoconsulta}
                    onChange={e => setEsVideoconsulta(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <VideoIcon />
                  <span className="text-sm text-slate-700">Videoconsulta</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={esSobreturno}
                    onChange={e => setEsSobreturno(e.target.checked)}
                    className="rounded text-orange-500"
                  />
                  <PlusIcon />
                  <span className="text-sm text-slate-700">Sobreturno</span>
                </label>
              </div>

              {/* Nota interna */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nota interna (opcional)</label>
                <textarea
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  rows={2}
                  placeholder="Ej: Paciente viene acompañada, traer estudios..."
                  className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 rounded-b-2xl flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">
            Cancelar
          </button>
          {step === 'confirmar' && (
            <button
              onClick={handleGuardar}
              disabled={isSaving || !pacienteSeleccionado}
              className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-xl shadow-sm"
            >
              {isSaving ? 'Guardando...' : '✓ Confirmar Turno'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}