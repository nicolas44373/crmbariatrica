// src/services/supabaseApi.ts
import { supabase } from './supabaseClient';
import { format, isToday } from 'date-fns';
import {
  PacienteFiliatorio,
  HistoriaClinicaEstatica,
  EvolucionClinica,
  Turno,
  UserRole,
  PacienteCompleto,
  CirugiaTipo,
  Profesional,
  ConfiguracionGeneral,
  TurnoConPaciente,
  EstadoTurnoDia,
  TurnoDiario,
  EstudioRealizado,
  TipoEstudio,
  CirugiaInfo,
  NutricionInfo,
  PsicologiaInfo,
  TipoCirugiaBariatrica,
  ContactoCRM,
  ContactoTag,
  Priority,
  CrmHistoryEntry,
  Task,
  Folder,
  CrmSimpleProfessionals,
  MessageTemplate,
  ProspectoCanalOrigen,
  ProspectoEstadoSeguimiento,
  InformeClinico,
  TaskStatus,
  FolderTrackingStatus,
  ChecklistItemStatus,
  LostReason,
} from '../types';
import { ETIQUETAS_FLUJO, TIPOS_ESTUDIO, normalizeString } from '../constants';

// ─── INTERCEPTOR DE SESIÓN ────────────────────────────────────────────────────

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
    window.location.href = '/';
  }
});

function handleSupabaseError(error: any): never {
  const msg = (error?.message ?? '').toLowerCase();
  const isAuthError =
    error?.status === 400 ||
    msg.includes('refresh token') ||
    msg.includes('jwt expired') ||
    msg.includes('invalid token') ||
    msg.includes('not found') && msg.includes('token');

  if (isAuthError) {
    supabase.auth.signOut();
    window.location.href = '/';
    throw new Error('Sesión expirada. Redirigiendo al login...');
  }

  throw error;
}

// ─── HELPERS DE MAPEO ─────────────────────────────────────────────────────────

function mapProfesional(row: any): Profesional {
  return {
    email: row.email,
    nombres: row.nombres,
    apellido: row.apellido,
    rol: row.rol as UserRole,
    activo: row.activo,
    especialidad: row.especialidad ?? '',
    matricula: row.matricula ?? '',
    telefono: row.telefono ?? '',
    modosAtencion: row.modos_atencion ?? undefined,
    config_turnos: row.config_turnos ?? null,
  };
}

function mapPaciente(row: any): PacienteFiliatorio {
  return {
    idPaciente: row.id_paciente,
    apellido: row.apellido,
    nombres: row.nombres,
    dni: row.dni,
    fechaNacimiento: row.fecha_nacimiento ?? '',
    direccion: row.direccion ?? '',
    obraSocial: row.obra_social ?? '',
    nroAfiliado: row.nro_afiliado ?? '',
    telefono: row.telefono ?? '',
    email: row.email ?? '',
    etiquetaPrincipalActiva: row.etiqueta_activa ?? 'NUEVO_INGRESO',
    cirujanoAsignado: row.cirujano_asignado_email ?? '',
    nutricionistaAsignado: row.nutricionista_asignado_email ?? '',
    psicologoAsignado: row.psicologo_asignado_email ?? '',
    fechaCirugia: row.fecha_cirugia ?? undefined,
    tipoCirugia: row.tipo_gestion_cirugia ?? undefined,
  };
}

function mapHistoria(row: any): HistoriaClinicaEstatica {
  return {
    idHistoria: row.id_historia,
    idPaciente: row.id_paciente,
    pesoInicial: row.peso_inicial ?? 0,
    talla: row.talla_cm ?? 0,
    imcInicial: row.imc_inicial ?? 0,
    comorbilidades: row.comorbilidades ?? [],
    antecedentesMedicos: row.antecedentes_medicos ?? '',
    medicacionCronica: row.medicacion_cronica ?? '',
    antecedentesQuirurgicos: row.antecedentes_quirurgicos ?? '',
    antecedentesNutricionales: row.antecedentes_nutricionales ?? '',
  };
}

function mapEvolucion(row: any): EvolucionClinica {
  return {
    idEvolucion: row.id_evolucion,
    idPaciente: row.id_paciente,
    fechaConsulta: row.fecha_consulta,
    emailProfesionalAutor: row.profesional_email,
    especialidad: row.especialidad ?? '',
    pesoActual: row.peso_actual ?? undefined,
    evolucionClinica: row.nota_clinica,
    notaConfidencial: row.nota_confidencial ?? '',
  };
}

function mapEstudio(row: any): EstudioRealizado {
  return {
    idEstudio: row.id_estudio,
    idPaciente: row.id_paciente,
    fecha: row.fecha_estudio,
    tipo: row.tipo_estudio as TipoEstudio,
    descripcion: row.descripcion ?? '',
    nombreArchivo: row.nombre_archivo_url ?? '',
    resultados: row.resultados ?? undefined,
    resultadoBiopsia: row.resultado_biopsia ?? undefined,
  };
}

function mapTurno(row: any): Turno {
  return {
    idTurno: row.id_turno,
    idPaciente: row.id_paciente,
    fechaTurno: row.fecha_turno,
    profesionalEmail: row.profesional_email,
    especialidad: row.especialidad ?? '',
    estado: row.estado as EstadoTurnoDia,
    creadoPorEmail: row.creado_por_email ?? '',
    valorCobrado: row.valor_cobrado ?? 0,
    metodoPago: row.metodo_pago ?? undefined,
    notaInterna: row.nota_interna ?? '',
    horaLlegada: row.hora_llegada ?? undefined,
    horaAtencion: row.hora_atencion ?? undefined,
    esVideoconsulta: row.es_videoconsulta ?? false,
    esSobreturno: row.es_sobreturno ?? false,
  };
}

function mapTurnoDiario(row: any): TurnoDiario {
  return {
    ...mapTurno(row),
    paciente: row.pacientes ? mapPaciente(row.pacientes) : ({} as PacienteFiliatorio),
  };
}

function mapCirugia(row: any): CirugiaInfo {
  return {
    idPaciente: row.id_paciente,
    tipoCirugia: row.tipo_cirugia as TipoCirugiaBariatrica ?? undefined,
    fechaProgramada: row.fecha_programada ?? undefined,
    fechaRealizada: row.fecha_realizada ?? undefined,
    notas: row.notas ?? '',
    nombreArchivoProtocolo: row.nombre_archivo_protocolo ?? '',
  };
}

function mapNutricion(row: any): NutricionInfo {
  return {
    idPaciente: row.id_paciente,
    perimetroCintura: row.perimetro_cintura ?? undefined,
    perimetroCuello: row.perimetro_cuello ?? undefined,
    composicionCorporal: row.composicion_corporal ?? '',
    habitosAlimentarios: row.habitos_alimentarios ?? '',
    habitosEjercicio: row.habitos_ejercicio ?? '',
  };
}

function mapPsicologia(row: any): PsicologiaInfo {
  return {
    idPaciente: row.id_paciente,
    psicologoEmailAutor: row.psicologo_email_autor,
    notasPrivadas: row.notas_privadas ?? '',
  };
}

function mapInforme(row: any): InformeClinico {
  return {
    idInforme: row.id_informe,
    idPaciente: row.id_paciente,
    fechaCreacion: row.fecha_creacion,
    fechaUltimaEdicion: row.fecha_ultima_edicion ?? row.fecha_creacion,
    emailProfesionalAutor: row.autor_email,
    tipoInforme: row.tipo_informe ?? 'Resumen Clínico',
    contenido: row.contenido,
  };
}

function mapFolder(row: any): Folder {
  return {
    id: row.id_carpeta,
    patientId: row.id_paciente,
    trackingState: row.estado_tracking as FolderTrackingStatus,
    checklist: row.checklist ?? {
      consentimiento: ChecklistItemStatus.PENDIENTE,
      presupuesto: ChecklistItemStatus.PENDIENTE,
      informeCirujano: ChecklistItemStatus.PENDIENTE,
      informeNutricionista: ChecklistItemStatus.PENDIENTE,
      informePsicologo: ChecklistItemStatus.PENDIENTE,
    },
    requestDate: row.fecha_pedido ?? null,
    deliveredToPatientDate: row.fecha_entrega_paciente ?? null,
    submittedDate: row.fecha_presentacion_os ?? null,
    authorizedDate: row.fecha_autorizacion ?? null,
    driveLink: row.link_drive ?? '',
    notes: row.notas ?? '',
    surgeon: row.cirujano_nombre ?? '',
    nutritionist: row.nutricionista_nombre ?? '',
    psychologist: row.psicologo_nombre ?? '',
    scheduledSurgeryDate: row.fecha_cirugia_programada ?? null,
    scheduledSurgeryTime: row.hora_cirugia_programada ?? null,
  };
}

function mapTask(row: any): Task {
  return {
    id: row.id_tarea,
    patientId: row.id_paciente,
    patientName: row.pacientes
      ? `${row.pacientes.apellido}, ${row.pacientes.nombres}`
      : '',
    description: row.descripcion,
    dueDate: row.fecha_vencimiento,
    status: row.estado as TaskStatus,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? null,
    assigneeEmail: row.asignado_a_email ?? undefined,
    creatorEmail: row.creado_por_email ?? undefined,
  };
}

function mapContacto(row: any): ContactoCRM {
  return {
    id: row.id_contacto,
    dni: row.dni ?? '',
    lastName: row.apellido ?? '',
    firstName: row.nombres ?? '',
    phone: row.telefono ?? '',
    email: row.email ?? '',
    socialInsurance: row.obra_social ?? '',
    priority: (row.prioridad as Priority) ?? Priority.NORMAL,
    startDate: row.fecha_ingreso ?? '',
    isPatient: row.is_patient ?? false,
    canalOrigen: (row.canal_origen as ProspectoCanalOrigen) ?? undefined,
    estadoSeguimiento: (row.estado_seguimiento as ProspectoEstadoSeguimiento) ?? undefined,
    lostReason: (row.motivo_perdida as LostReason) ?? null,
    lostTimestamp: row.fecha_perdida ?? null,
    tag: undefined,
    surgeryDate: null,
    surgeryType: null,
    folderId: null,
    lastConsultationDate: null,
    nextConsultation: null,
  };
}

function mapEtiquetaToTag(etiqueta: string): ContactoTag {
  const normalized = normalizeString(etiqueta);
  return (
    Object.values(ContactoTag).find(t => normalizeString(t) === normalized) ??
    ContactoTag.NUEVO_INGRESO
  );
}

// ─── QUERY HELPER ─────────────────────────────────────────────────────────────

const TURNO_WITH_PACIENTE = `
  *,
  pacientes(
    id_paciente, apellido, nombres, dni, obra_social, etiqueta_activa,
    fecha_nacimiento, telefono, email,
    cirujano_asignado_email, nutricionista_asignado_email,
    psicologo_asignado_email, fecha_cirugia, tipo_gestion_cirugia,
    nro_afiliado, direccion
  )
`;

// ─── PROFESIONALES ────────────────────────────────────────────────────────────

async function getProfesional(email: string): Promise<Profesional> {
  const { data, error } = await supabase
    .from('profesionales')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) throw new Error('Profesional no encontrado');
  if (!data) throw new Error('Profesional no encontrado');
  return mapProfesional(data);
}

async function getProfesionales(): Promise<Profesional[]> {
  const { data, error } = await supabase
    .from('profesionales')
    .select('*')
    .eq('activo', true)
    .eq('rol', UserRole.MEDICO);
  if (error) handleSupabaseError(error);
  return (data ?? []).map(mapProfesional);
}

async function getProfesionalesAdmin(): Promise<Profesional[]> {
  const { data, error } = await supabase.from('profesionales').select('*');
  if (error) handleSupabaseError(error);
  return (data ?? []).map(mapProfesional);
}

async function updateProfesionalesAdmin(
  newProfesionales: Profesional[],
  userRole: UserRole
): Promise<Profesional[]> {
  if (userRole !== UserRole.ADMINISTRATIVO) throw new Error('Permiso denegado.');

  const upsertData = newProfesionales.map(p => ({
    email: p.email,
    nombres: p.nombres,
    apellido: p.apellido,
    rol: p.rol,
    activo: p.activo,
    especialidad: p.especialidad ?? null,
    matricula: p.matricula ?? null,
    telefono: p.telefono ?? null,
    modos_atencion: p.modosAtencion ?? null,
  }));

  const { data, error } = await supabase
    .from('profesionales')
    .upsert(upsertData, { onConflict: 'email' })
    .select();
  if (error) handleSupabaseError(error);
  return (data ?? []).map(mapProfesional);
}

// INSERT explícito — evita pisar registros existentes al crear uno nuevo
async function createProfesional(
  data: {
    email: string;
    nombres: string;
    apellido: string;
    rol: UserRole;
    especialidad: string;
    matricula: string;
    telefono: string;
    activo: boolean;
    config_turnos: object;
  },
  userRole: UserRole = UserRole.ADMINISTRATIVO
): Promise<Profesional> {
  if (userRole !== UserRole.ADMINISTRATIVO) throw new Error('Permiso denegado.');

  const { data: result, error } = await supabase
    .from('profesionales')
    .insert({
      email:         data.email.trim().toLowerCase(),
      nombres:       data.nombres,
      apellido:      data.apellido,
      rol:           data.rol,
      activo:        data.activo,
      especialidad:  data.especialidad  || null,
      matricula:     data.matricula     || null,
      telefono:      data.telefono      || null,
      config_turnos: data.config_turnos,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un profesional con ese email.');
    }
    throw new Error(error.message);
  }

  return mapProfesional(result);
}

// Mantener upsertProfesional por compatibilidad con código existente
async function upsertProfesional(
  data: {
    email: string;
    nombres: string;
    apellido: string;
    rol: UserRole;
    especialidad: string;
    matricula: string;
    telefono: string;
    activo: boolean;
    config_turnos: object;
  },
  userRole: UserRole = UserRole.ADMINISTRATIVO
): Promise<Profesional> {
  if (userRole !== UserRole.ADMINISTRATIVO) throw new Error('Permiso denegado.');

  const { data: result, error } = await supabase
    .from('profesionales')
    .upsert({
      email:         data.email,
      nombres:       data.nombres,
      apellido:      data.apellido,
      rol:           data.rol,
      activo:        data.activo,
      especialidad:  data.especialidad || null,
      matricula:     data.matricula    || null,
      telefono:      data.telefono     || null,
      config_turnos: data.config_turnos,
    }, { onConflict: 'email' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapProfesional(result);
}

async function updateProfesionalConfig(
  email: string,
  data: {
    nombres?: string;
    apellido?: string;
    rol?: UserRole;
    especialidad?: string;
    matricula?: string;
    telefono?: string;
    activo?: boolean;
    config_turnos?: object;
  },
  userRole: UserRole = UserRole.ADMINISTRATIVO
): Promise<Profesional> {
  if (userRole !== UserRole.ADMINISTRATIVO) throw new Error('Permiso denegado.');

  const dbUpdates: any = {};
  if (data.nombres       !== undefined) dbUpdates.nombres       = data.nombres;
  if (data.apellido      !== undefined) dbUpdates.apellido      = data.apellido;
  if (data.rol           !== undefined) dbUpdates.rol           = data.rol;
  if (data.especialidad  !== undefined) dbUpdates.especialidad  = data.especialidad  || null;
  if (data.matricula     !== undefined) dbUpdates.matricula     = data.matricula     || null;
  if (data.telefono      !== undefined) dbUpdates.telefono      = data.telefono      || null;
  if (data.activo        !== undefined) dbUpdates.activo        = data.activo;
  if (data.config_turnos !== undefined) dbUpdates.config_turnos = data.config_turnos;

  const { data: result, error } = await supabase
    .from('profesionales')
    .update(dbUpdates)
    .eq('email', email)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapProfesional(result);
}

// Elimina un profesional. Lanza error descriptivo si tiene turnos futuros.
async function deleteProfesional(
  email: string,
  userRole: UserRole = UserRole.ADMINISTRATIVO
): Promise<void> {
  if (userRole !== UserRole.ADMINISTRATIVO) throw new Error('Permiso denegado.');

  // Verificar turnos futuros antes de borrar
  const ahora = new Date().toISOString();
  const { data: turnosFuturos } = await supabase
    .from('turnos')
    .select('id_turno')
    .eq('profesional_email', email)
    .gte('fecha_turno', ahora)
    .limit(1);

  if (turnosFuturos && turnosFuturos.length > 0) {
    throw new Error(
      'No se puede eliminar: el profesional tiene turnos futuros asignados. ' +
      'Reasignelos o marcalo como Inactivo.'
    );
  }

  const { error } = await supabase
    .from('profesionales')
    .delete()
    .eq('email', email);

  if (error) throw new Error(error.message);
}

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────

function getEtiquetasFlujo() {
  return Promise.resolve(ETIQUETAS_FLUJO);
}

async function getConfiguracionGeneral(_userRole: UserRole): Promise<ConfiguracionGeneral> {
  const [{ data: config }, { data: profs }] = await Promise.all([
    supabase.from('configuracion_sistema').select('*').eq('id', 1).single(),
    supabase.from('profesionales').select('*').eq('activo', true),
  ]);

  const configuracionesProfesionales = (profs ?? []).map((p: any) => ({
    profesionalEmail: p.email,
    duracionTurnoMinutos: p.config_turnos?.duracionTurnoMinutos ?? 20,
    horarios: p.config_turnos?.horarios ?? [],
    diasBloqueados: p.config_turnos?.diasBloqueados ?? [],
    horariosEspeciales: p.config_turnos?.horariosEspeciales ?? [],
  }));

  return {
    configuracionesProfesionales,
    plantillaLaboratorio: config?.plantilla_laboratorio ?? [],
  };
}

async function updateConfiguracionGeneral(
  newConfig: ConfiguracionGeneral,
  userRole: UserRole
): Promise<ConfiguracionGeneral> {
  if (userRole !== UserRole.ADMINISTRATIVO) throw new Error('Permiso denegado.');

  await Promise.all(
    newConfig.configuracionesProfesionales.map(cp =>
      supabase.from('profesionales').update({
        config_turnos: {
          duracionTurnoMinutos: cp.duracionTurnoMinutos,
          horarios: cp.horarios,
          diasBloqueados: cp.diasBloqueados ?? [],
          horariosEspeciales: cp.horariosEspeciales ?? [],
        },
      }).eq('email', cp.profesionalEmail)
    )
  );

  await supabase.from('configuracion_sistema').upsert(
    { id: 1, plantilla_laboratorio: newConfig.plantillaLaboratorio },
    { onConflict: 'id' }
  );

  return newConfig;
}

// ─── PACIENTES ────────────────────────────────────────────────────────────────

async function getPacientes(role: UserRole, profesionalEmail?: string): Promise<PacienteFiliatorio[]> {
  let query = supabase.from('pacientes').select('*').order('apellido');
  if (role === UserRole.MEDICO && profesionalEmail) {
    query = query.or(
      `cirujano_asignado_email.eq.${profesionalEmail},nutricionista_asignado_email.eq.${profesionalEmail},psicologo_asignado_email.eq.${profesionalEmail}`
    );
  }
  const { data, error } = await query;
  if (error) handleSupabaseError(error);
  return (data ?? []).map(mapPaciente);
}

async function getPacienteCompleto(
  idPaciente: string,
  currentUserEmail: string
): Promise<PacienteCompleto> {
  const user = await getProfesional(currentUserEmail).catch(() => null);

  const [
    { data: pacRow, error: errPac },
    { data: historiaRows },
    { data: evolucionRows },
    { data: turnoRows },
    { data: estudioRows },
    { data: informeRows },
    { data: cirugiaRow },
    { data: nutricionRow },
    { data: psicologiaRow },
  ] = await Promise.all([
    supabase.from('pacientes').select('*').eq('id_paciente', idPaciente).single(),
    supabase.from('historias_clinicas').select('*').eq('id_paciente', idPaciente).limit(1),
    supabase.from('evoluciones').select('*').eq('id_paciente', idPaciente).eq('is_deleted', false),
    supabase.from('turnos').select('*').eq('id_paciente', idPaciente),
    supabase.from('estudios').select('*').eq('id_paciente', idPaciente),
    supabase.from('informes').select('*').eq('id_paciente', idPaciente),
    supabase.from('cirugias').select('*').eq('id_paciente', idPaciente).maybeSingle(),
    supabase.from('nutricion_info').select('*').eq('id_paciente', idPaciente).maybeSingle(),
    supabase.from('psicologia_info').select('*').eq('id_paciente', idPaciente).maybeSingle(),
  ]);

  if (errPac || !pacRow) throw new Error('Paciente no encontrado');

  const filiatorio = mapPaciente(pacRow);

  let historiaClinica: HistoriaClinicaEstatica =
    historiaRows && historiaRows.length > 0
      ? mapHistoria(historiaRows[0])
      : {
          idHistoria: `HC-NEW-${idPaciente}`,
          idPaciente,
          pesoInicial: 0,
          talla: 0,
          imcInicial: 0,
          comorbilidades: [],
          antecedentesMedicos: '',
          medicacionCronica: '',
          antecedentesQuirurgicos: '',
          antecedentesNutricionales: '',
        };

  let evoluciones = (evolucionRows ?? []).map(mapEvolucion);
  const turnos = (turnoRows ?? []).map(mapTurno);
  const estudios = (estudioRows ?? []).map(mapEstudio);
  const informes = (informeRows ?? []).map(mapInforme);
  const cirugia = cirugiaRow ? mapCirugia(cirugiaRow) : undefined;
  const nutricion = nutricionRow ? mapNutricion(nutricionRow) : undefined;
  let psicologia = psicologiaRow ? mapPsicologia(psicologiaRow) : undefined;

  // Control de acceso
  if (!user || user.rol === UserRole.MEDICO) {
    evoluciones = evoluciones.map(e => ({
      ...e,
      notaConfidencial:
        user && e.emailProfesionalAutor === currentUserEmail
          ? e.notaConfidencial
          : '*** NOTA CONFIDENCIAL RESTRINGIDA ***',
    }));
    if (psicologia && user && psicologia.psicologoEmailAutor !== currentUserEmail) {
      psicologia = { ...psicologia, notasPrivadas: '*** DATOS CONFIDENCIALES RESTRINGIDOS ***' };
    }
  } else if (user.rol === UserRole.ADMINISTRATIVO) {
    evoluciones = evoluciones.map(e => ({
      ...e,
      pesoActual: undefined,
      evolucionClinica: '*** DATOS CLÍNICOS RESTRINGIDOS ***',
      notaConfidencial: '*** DATOS CLÍNICOS RESTRINGIDOS ***',
    }));
    if (psicologia) {
      psicologia = { ...psicologia, notasPrivadas: '*** DATOS CONFIDENCIALES RESTRINGIDOS ***' };
    }
  }

  evoluciones.sort((a, b) => new Date(b.fechaConsulta).getTime() - new Date(a.fechaConsulta).getTime());
  turnos.sort((a, b) => new Date(b.fechaTurno).getTime() - new Date(a.fechaTurno).getTime());
  estudios.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  informes.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());

  return { filiatorio, historiaClinica, evoluciones, turnos, estudios, informes, cirugia, nutricion, psicologia };
}

async function createPaciente(
  pacienteData: Omit<PacienteFiliatorio, 'idPaciente' | 'etiquetaPrincipalActiva' | 'cirujanoAsignado' | 'nutricionistaAsignado' | 'psicologoAsignado' | 'fechaCirugia' | 'tipoCirugia'>,
  userRole: UserRole,
  prospectoId?: string
): Promise<PacienteFiliatorio> {
  if (userRole !== UserRole.ADMINISTRATIVO) throw new Error('Permiso denegado para crear pacientes.');

  const { data: profs } = await supabase.from('profesionales').select('*').eq('activo', true);
  const cirujano = (profs ?? []).find((p: any) => (p.especialidad ?? '').toLowerCase().includes('cirug'));
  const nutricionista = (profs ?? []).find((p: any) => (p.especialidad ?? '').toLowerCase().includes('nutri'));
  const psicologo = (profs ?? []).find((p: any) => (p.especialidad ?? '').toLowerCase().includes('psic'));

  const { data, error } = await supabase.from('pacientes').insert({
    apellido: pacienteData.apellido,
    nombres: pacienteData.nombres,
    dni: pacienteData.dni,
    fecha_nacimiento: pacienteData.fechaNacimiento || null,
    obra_social: pacienteData.obraSocial ?? null,
    nro_afiliado: pacienteData.nroAfiliado ?? null,
    telefono: pacienteData.telefono ?? null,
    email: pacienteData.email ?? null,
    direccion: pacienteData.direccion ?? null,
    etiqueta_activa: 'NUEVO_INGRESO',
    cirujano_asignado_email: cirujano?.email ?? null,
    nutricionista_asignado_email: nutricionista?.email ?? null,
    psicologo_asignado_email: psicologo?.email ?? null,
  }).select().single();

  if (error) handleSupabaseError(error);

if (prospectoId) {
    const { data: oldProspect } = await supabase
      .from('crm_contactos')
      .select('canal_origen, prioridad, fecha_ingreso')
      .eq('id_contacto', prospectoId)
      .maybeSingle();

    await supabase
      .from('crm_contactos')
      .delete()
      .eq('id_contacto', prospectoId);

    await supabase.from('crm_contactos').insert({
      id_contacto:   data.id_paciente,
      is_patient:    true,
      canal_origen:  oldProspect?.canal_origen  ?? null,
      prioridad:     oldProspect?.prioridad     ?? Priority.NORMAL,
      fecha_ingreso: oldProspect?.fecha_ingreso ?? new Date().toISOString().split('T')[0],
    });
  }

  return mapPaciente(data);
}

async function updatePacienteFiliatorio(
  idPaciente: string,
  updates: Partial<PacienteFiliatorio>,
  userRole: UserRole
): Promise<PacienteFiliatorio> {
  if (userRole !== UserRole.ADMINISTRATIVO && userRole !== UserRole.MEDICO)
    throw new Error('Permiso denegado para editar pacientes.');

  const dbUpdates: any = {};
  if (updates.apellido          !== undefined) dbUpdates.apellido                    = updates.apellido;
  if (updates.nombres           !== undefined) dbUpdates.nombres                     = updates.nombres;
  if (updates.dni               !== undefined) dbUpdates.dni                         = updates.dni;
  if (updates.fechaNacimiento   !== undefined) dbUpdates.fecha_nacimiento             = updates.fechaNacimiento || null;
  if (updates.direccion         !== undefined) dbUpdates.direccion                   = updates.direccion;
  if (updates.obraSocial        !== undefined) dbUpdates.obra_social                 = updates.obraSocial;
  if (updates.nroAfiliado       !== undefined) dbUpdates.nro_afiliado                = updates.nroAfiliado;
  if (updates.telefono          !== undefined) dbUpdates.telefono                    = updates.telefono;
  if (updates.email             !== undefined) dbUpdates.email                       = updates.email;
  // DESPUÉS — string vacío se convierte a NULL, que sí acepta la FK
if (updates.cirujanoAsignado      !== undefined) dbUpdates.cirujano_asignado_email      = updates.cirujanoAsignado      || null;
if (updates.nutricionistaAsignado !== undefined) dbUpdates.nutricionista_asignado_email = updates.nutricionistaAsignado || null;
if (updates.psicologoAsignado     !== undefined) dbUpdates.psicologo_asignado_email     = updates.psicologoAsignado     || null;

  const { data, error } = await supabase
    .from('pacientes').update(dbUpdates).eq('id_paciente', idPaciente).select().single();
  if (error) handleSupabaseError(error);
  return mapPaciente(data);
}

async function updatePacienteTag(
  idPaciente: string,
  newTag: string,
  userRole: UserRole
): Promise<PacienteFiliatorio> {
  if (userRole !== UserRole.ADMINISTRATIVO && userRole !== UserRole.MEDICO)
    throw new Error('Permiso denegado para cambiar etiqueta.');

  const { data, error } = await supabase
    .from('pacientes').update({ etiqueta_activa: newTag }).eq('id_paciente', idPaciente).select().single();
  if (error) handleSupabaseError(error);
  return mapPaciente(data);
}

async function definirCirugia(
  idPaciente: string,
  tipo: CirugiaTipo,
  fecha: string,
  userRole: UserRole
): Promise<PacienteFiliatorio> {
  if (userRole !== UserRole.ADMINISTRATIVO && userRole !== UserRole.MEDICO)
    throw new Error('Permiso denegado.');

  const { data, error } = await supabase.from('pacientes').update({
    tipo_gestion_cirugia: tipo,
    fecha_cirugia: fecha,
    etiqueta_activa: 'PERIOPERATORIO',
  }).eq('id_paciente', idPaciente).select().single();
  if (error) handleSupabaseError(error);
  return mapPaciente(data);
}

// ─── TURNOS ───────────────────────────────────────────────────────────────────

async function getTurnosPorFechaYProfesional(
  fecha: string,
  profesionalEmail: string
): Promise<Turno[]> {
  const inicio = new Date(fecha.replace(/-/g, '/')); inicio.setHours(0, 0, 0, 0);
  const fin    = new Date(fecha.replace(/-/g, '/')); fin.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('turnos')
    .select('*')
    .eq('profesional_email', profesionalEmail)
    .gte('fecha_turno', inicio.toISOString())
    .lte('fecha_turno', fin.toISOString());
  if (error) handleSupabaseError(error);
  return (data ?? []).map(mapTurno);
}

async function getTurnosParaProfesional(profesionalEmail: string): Promise<TurnoConPaciente[]> {
  const { data, error } = await supabase
    .from('turnos')
    .select(TURNO_WITH_PACIENTE)
    .eq('profesional_email', profesionalEmail)
    .order('fecha_turno');
  if (error) handleSupabaseError(error);
  return (data ?? [])
    .filter((r: any) => r.pacientes)
    .map((r: any) => ({ ...mapTurno(r), paciente: mapPaciente(r.pacientes) }));
}

async function getTurnosDiariosParaProfesional(profesionalEmail: string): Promise<TurnoDiario[]> {
  const inicio = new Date(); inicio.setHours(0, 0, 0, 0);
  const fin    = new Date(); fin.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('turnos')
    .select(TURNO_WITH_PACIENTE)
    .eq('profesional_email', profesionalEmail)
    .gte('fecha_turno', inicio.toISOString())
    .lte('fecha_turno', fin.toISOString());
  if (error) handleSupabaseError(error);
  return (data ?? []).filter((r: any) => r.pacientes).map(mapTurnoDiario)
    .sort((a, b) => new Date(a.fechaTurno).getTime() - new Date(b.fechaTurno).getTime());
}

async function getTurnosDiariosTodosProfesionales(fecha: Date): Promise<TurnoDiario[]> {
  const inicio = new Date(fecha); inicio.setHours(0, 0, 0, 0);
  const fin    = new Date(fecha); fin.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('turnos')
    .select(TURNO_WITH_PACIENTE)
    .gte('fecha_turno', inicio.toISOString())
    .lte('fecha_turno', fin.toISOString())
    .order('fecha_turno');
  if (error) handleSupabaseError(error);
  return (data ?? []).filter((r: any) => r.pacientes).map(mapTurnoDiario);
}

async function createTurno(
  turnoData: Omit<Turno, 'idTurno' | 'estado'>,
  userRole: UserRole
): Promise<Turno> {
  if (userRole !== UserRole.ADMINISTRATIVO && userRole !== UserRole.MEDICO)
    throw new Error('Permiso denegado para crear turnos.');

  if (!turnoData.esSobreturno) {
    const { data: existing } = await supabase
      .from('turnos')
      .select('id_turno')
      .eq('profesional_email', turnoData.profesionalEmail)
      .eq('fecha_turno', turnoData.fechaTurno)
      .eq('es_sobreturno', false)
      .limit(1);
    if (existing && existing.length > 0)
      throw new Error('El horario seleccionado ya no está disponible. Por favor, elija otro o marque como sobreturno.');
  }

  const { data, error } = await supabase.from('turnos').insert({
    id_paciente:        turnoData.idPaciente,
    fecha_turno:        turnoData.fechaTurno,
    profesional_email:  turnoData.profesionalEmail,
    especialidad:       turnoData.especialidad ?? null,
    estado:             EstadoTurnoDia.AGENDADO,
    creado_por_email:   turnoData.creadoPorEmail,
    nota_interna:       turnoData.notaInterna ?? null,
    es_videoconsulta:   turnoData.esVideoconsulta ?? false,
    es_sobreturno:      turnoData.esSobreturno ?? false,
  }).select().single();

  if (error) handleSupabaseError(error);
  return mapTurno(data);
}

async function updateDetallesTurno(
  turnoId: string,
  updates: Partial<Turno>,
  user: Profesional
): Promise<Turno> {
  const { data: current } = await supabase
    .from('turnos').select('estado, hora_llegada, hora_atencion').eq('id_turno', turnoId).single();

  const dbUpdates: any = {};
  if (updates.estado       !== undefined) dbUpdates.estado        = updates.estado;
  if (updates.valorCobrado !== undefined) dbUpdates.valor_cobrado = updates.valorCobrado;
  if (updates.metodoPago   !== undefined) dbUpdates.metodo_pago   = updates.metodoPago;
  if (updates.notaInterna  !== undefined) dbUpdates.nota_interna  = updates.notaInterna;
  if (updates.horaLlegada  !== undefined) dbUpdates.hora_llegada  = updates.horaLlegada;
  if (updates.horaAtencion !== undefined) dbUpdates.hora_atencion = updates.horaAtencion;

  if (updates.estado && current) {
    if (updates.estado === EstadoTurnoDia.EN_ESPERA && !current.hora_llegada)
      dbUpdates.hora_llegada = new Date().toISOString();
    if (updates.estado === EstadoTurnoDia.ATENDIDO && !current.hora_atencion)
      dbUpdates.hora_atencion = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('turnos').update(dbUpdates).eq('id_turno', turnoId).select().single();
  if (error) handleSupabaseError(error);
  return mapTurno(data);
}

async function simulateDailyTrigger(): Promise<{ message: string; changes: number }> {
  const today = new Date().toISOString().split('T')[0];
  const { data: pacientes } = await supabase
    .from('pacientes').select('id_paciente')
    .eq('etiqueta_activa', 'PERIOPERATORIO').lt('fecha_cirugia', today);

  if (!pacientes || pacientes.length === 0)
    return { message: 'Proceso diario completado. 0 pacientes actualizados.', changes: 0 };

  const ids = pacientes.map((p: any) => p.id_paciente);
  await supabase.from('pacientes').update({ etiqueta_activa: 'POSBARIATRICO' }).in('id_paciente', ids);

  return {
    message: `Proceso diario completado. ${ids.length} pacientes fueron actualizados a POSBARIATRICO.`,
    changes: ids.length,
  };
}

// ─── EVOLUCIONES ──────────────────────────────────────────────────────────────

async function createEvolucion(
  evolucionData: Omit<EvolucionClinica, 'idEvolucion'>,
  userRole: UserRole
): Promise<EvolucionClinica> {
  if (userRole !== UserRole.MEDICO) throw new Error('Permiso denegado para crear evoluciones.');

  const { data, error } = await supabase.from('evoluciones').insert({
    id_paciente:        evolucionData.idPaciente,
    profesional_email:  evolucionData.emailProfesionalAutor,
    especialidad:       evolucionData.especialidad ?? null,
    peso_actual:        evolucionData.pesoActual ?? null,
    nota_clinica:       evolucionData.evolucionClinica,
    nota_confidencial:  evolucionData.notaConfidencial ?? null,
    fecha_consulta:     evolucionData.fechaConsulta,
  }).select().single();

  if (error) handleSupabaseError(error);
  return mapEvolucion(data);
}

async function updateEvolucion(
  idEvolucion: string,
  updates: Partial<Pick<EvolucionClinica, 'pesoActual' | 'evolucionClinica' | 'notaConfidencial'>>,
  user: Profesional
): Promise<EvolucionClinica> {
  if (user.rol !== UserRole.MEDICO) throw new Error('Permiso denegado para editar evoluciones.');

  const { data: original, error: errGet } = await supabase
    .from('evoluciones').select('*').eq('id_evolucion', idEvolucion).single();
  if (errGet || !original) throw new Error('Evolución no encontrada.');
  if (original.profesional_email !== user.email)
    throw new Error('No puede editar una evolución de otro profesional.');
  if (!isToday(new Date(original.fecha_consulta)))
    throw new Error('Solo puede editar evoluciones creadas el día de hoy.');

  const dbUpdates: any = {};
  if (updates.pesoActual        !== undefined) dbUpdates.peso_actual       = updates.pesoActual;
  if (updates.evolucionClinica  !== undefined) dbUpdates.nota_clinica      = updates.evolucionClinica;
  if (updates.notaConfidencial  !== undefined) dbUpdates.nota_confidencial = updates.notaConfidencial;

  const { data, error } = await supabase
    .from('evoluciones').update(dbUpdates).eq('id_evolucion', idEvolucion).select().single();
  if (error) handleSupabaseError(error);
  return mapEvolucion(data);
}

// ─── HISTORIA CLÍNICA ─────────────────────────────────────────────────────────

async function updateHistoriaClinica(
  idPaciente: string,
  updates: Partial<Omit<HistoriaClinicaEstatica, 'idHistoria' | 'idPaciente' | 'imcInicial'>>,
  userRole: UserRole
): Promise<HistoriaClinicaEstatica> {
  if (userRole !== UserRole.MEDICO) throw new Error('Permiso denegado para actualizar la historia clínica.');

  const { data: existing } = await supabase
    .from('historias_clinicas').select('*').eq('id_paciente', idPaciente).maybeSingle();

  const pesoBase = updates.pesoInicial ?? existing?.peso_inicial ?? 0;
  const tallaBase = updates.talla ?? existing?.talla_cm ?? 0;
  const tallaM = tallaBase / 100;
  const imc = tallaM > 0 ? parseFloat((pesoBase / (tallaM * tallaM)).toFixed(1)) : 0;

  const dbData: any = { id_paciente: idPaciente, imc_inicial: imc };
  if (updates.pesoInicial              !== undefined) dbData.peso_inicial             = updates.pesoInicial;
  if (updates.talla                    !== undefined) dbData.talla_cm                 = updates.talla;
  if (updates.comorbilidades           !== undefined) dbData.comorbilidades            = updates.comorbilidades;
  if (updates.antecedentesMedicos      !== undefined) dbData.antecedentes_medicos      = updates.antecedentesMedicos;
  if (updates.medicacionCronica        !== undefined) dbData.medicacion_cronica        = updates.medicacionCronica;
  if (updates.antecedentesQuirurgicos  !== undefined) dbData.antecedentes_quirurgicos  = updates.antecedentesQuirurgicos;
  if (updates.antecedentesNutricionales !== undefined) dbData.antecedentes_nutricionales = updates.antecedentesNutricionales;

  const { data, error } = await supabase
    .from('historias_clinicas')
    .upsert(dbData, { onConflict: 'id_paciente' })
    .select().single();
  if (error) handleSupabaseError(error);
  return mapHistoria(data);
}

// ─── ESTUDIOS ─────────────────────────────────────────────────────────────────

async function createEstudio(
  estudioData: Omit<EstudioRealizado, 'idEstudio'>,
  user: Profesional
): Promise<EstudioRealizado> {
  if (user.rol !== UserRole.MEDICO) throw new Error('Permiso denegado para crear estudios.');

  const { data, error } = await supabase.from('estudios').insert({
    id_paciente:         estudioData.idPaciente,
    fecha_estudio:       estudioData.fecha,
    tipo_estudio:        estudioData.tipo,
    descripcion:         estudioData.descripcion ?? null,
    nombre_archivo_url:  estudioData.nombreArchivo ?? null,
    resultados:          estudioData.resultados ?? null,
    resultado_biopsia:   estudioData.resultadoBiopsia ?? null,
  }).select().single();
  if (error) handleSupabaseError(error);

  // Evolución automática
  const tipoLabel = TIPOS_ESTUDIO.find((t: any) => t.value === estudioData.tipo)?.label || estudioData.tipo;
  const hoy = new Date();
  const inicioDia = new Date(hoy); inicioDia.setHours(0, 0, 0, 0);
  const finDia    = new Date(hoy); finDia.setHours(23, 59, 59, 999);

  const { data: existingEvo } = await supabase
    .from('evoluciones')
    .select('id_evolucion, nota_clinica')
    .eq('id_paciente', estudioData.idPaciente)
    .eq('profesional_email', user.email)
    .gte('fecha_consulta', inicioDia.toISOString())
    .lte('fecha_consulta', finDia.toISOString())
    .maybeSingle();

  if (existingEvo) {
    await supabase.from('evoluciones').update({
      nota_clinica: existingEvo.nota_clinica + `\n- Se registra resultado de: ${tipoLabel}.`,
    }).eq('id_evolucion', existingEvo.id_evolucion);
  } else {
    await supabase.from('evoluciones').insert({
      id_paciente:       estudioData.idPaciente,
      profesional_email: user.email,
      especialidad:      user.especialidad ?? 'Médico',
      nota_clinica:      `Se registra resultado de: ${tipoLabel}.`,
      nota_confidencial: null,
    });
  }

  return mapEstudio(data);
}

async function updateEstudio(
  idEstudio: string,
  updates: Partial<EstudioRealizado>,
  userRole: UserRole
): Promise<EstudioRealizado> {
  if (userRole !== UserRole.MEDICO) throw new Error('Permiso denegado para actualizar estudios.');

  const dbUpdates: any = {};
  if (updates.fecha            !== undefined) dbUpdates.fecha_estudio       = updates.fecha;
  if (updates.tipo             !== undefined) dbUpdates.tipo_estudio         = updates.tipo;
  if (updates.descripcion      !== undefined) dbUpdates.descripcion          = updates.descripcion;
  if (updates.nombreArchivo    !== undefined) dbUpdates.nombre_archivo_url   = updates.nombreArchivo;
  if (updates.resultados       !== undefined) dbUpdates.resultados           = updates.resultados;
  if (updates.resultadoBiopsia !== undefined) dbUpdates.resultado_biopsia    = updates.resultadoBiopsia;

  const { data, error } = await supabase
    .from('estudios').update(dbUpdates).eq('id_estudio', idEstudio).select().single();
  if (error) handleSupabaseError(error);
  return mapEstudio(data);
}

// ─── CIRUGÍA, NUTRICIÓN, PSICOLOGÍA ──────────────────────────────────────────

async function updateCirugiaInfo(
  idPaciente: string,
  updates: Partial<CirugiaInfo>,
  user: Profesional
): Promise<CirugiaInfo> {
  if (user.rol !== UserRole.MEDICO) throw new Error('Permiso denegado.');

  const dbData: any = { id_paciente: idPaciente };
  if (updates.tipoCirugia            !== undefined) dbData.tipo_cirugia              = updates.tipoCirugia;
  if (updates.fechaProgramada        !== undefined) dbData.fecha_programada          = updates.fechaProgramada;
  if (updates.fechaRealizada         !== undefined) dbData.fecha_realizada           = updates.fechaRealizada;
  if (updates.notas                  !== undefined) dbData.notas                     = updates.notas;
  if (updates.nombreArchivoProtocolo !== undefined) dbData.nombre_archivo_protocolo  = updates.nombreArchivoProtocolo;

  const { data, error } = await supabase
    .from('cirugias').upsert(dbData, { onConflict: 'id_paciente' }).select().single();
  if (error) handleSupabaseError(error);

  if (updates.fechaProgramada) {
    await supabase.from('pacientes').update({
      fecha_cirugia: updates.fechaProgramada, etiqueta_activa: 'PERIOPERATORIO',
    }).eq('id_paciente', idPaciente);
  }
  if (updates.fechaRealizada) {
    await supabase.from('pacientes').update({ etiqueta_activa: 'POSBARIATRICO' }).eq('id_paciente', idPaciente);
  }

  return mapCirugia(data);
}

async function updateNutricionInfo(
  idPaciente: string,
  updates: Partial<NutricionInfo>,
  user: Profesional
): Promise<NutricionInfo> {
  if (user.rol !== UserRole.MEDICO) throw new Error('Permiso denegado.');

  const dbData: any = { id_paciente: idPaciente };
  if (updates.perimetroCintura    !== undefined) dbData.perimetro_cintura    = updates.perimetroCintura;
  if (updates.perimetroCuello     !== undefined) dbData.perimetro_cuello     = updates.perimetroCuello;
  if (updates.composicionCorporal !== undefined) dbData.composicion_corporal = updates.composicionCorporal;
  if (updates.habitosAlimentarios !== undefined) dbData.habitos_alimentarios = updates.habitosAlimentarios;
  if (updates.habitosEjercicio    !== undefined) dbData.habitos_ejercicio    = updates.habitosEjercicio;

  const { data, error } = await supabase
    .from('nutricion_info').upsert(dbData, { onConflict: 'id_paciente' }).select().single();
  if (error) handleSupabaseError(error);
  return mapNutricion(data);
}

async function updatePsicologiaInfo(
  idPaciente: string,
  updates: Partial<PsicologiaInfo>,
  user: Profesional
): Promise<PsicologiaInfo> {
// DESPUÉS — case-insensitive
if (!user.especialidad?.toLowerCase().includes('psic')) {
    throw new Error('Solo un psicólogo puede editar estas notas.');
}

  const { data: existing } = await supabase
    .from('psicologia_info').select('psicologo_email_autor').eq('id_paciente', idPaciente).maybeSingle();
  if (existing && existing.psicologo_email_autor !== user.email)
    throw new Error('No puede editar las notas de otro psicólogo.');

  const { data, error } = await supabase.from('psicologia_info').upsert({
    id_paciente:          idPaciente,
    psicologo_email_autor: user.email,
    notas_privadas:       updates.notasPrivadas ?? '',
  }, { onConflict: 'id_paciente' }).select().single();
  if (error) handleSupabaseError(error);
  return mapPsicologia(data);
}

// ─── INFORMES ─────────────────────────────────────────────────────────────────

async function guardarInforme(
  informeData: Omit<InformeClinico, 'idInforme' | 'fechaCreacion' | 'fechaUltimaEdicion'> & { idInforme?: string }
): Promise<InformeClinico> {
  if (informeData.idInforme) {
    const { data, error } = await supabase.from('informes').update({
      contenido:            informeData.contenido,
      tipo_informe:         informeData.tipoInforme,
      fecha_ultima_edicion: new Date().toISOString(),
    }).eq('id_informe', informeData.idInforme).select().single();
    if (error) handleSupabaseError(error);
    return mapInforme(data);
  }

  const { data, error } = await supabase.from('informes').insert({
    id_paciente:          informeData.idPaciente,
    autor_email:          informeData.emailProfesionalAutor,
    tipo_informe:         informeData.tipoInforme ?? 'Resumen Clínico',
    contenido:            informeData.contenido,
    fecha_ultima_edicion: new Date().toISOString(),
  }).select().single();
  if (error) handleSupabaseError(error);
  return mapInforme(data);
}

// ─── CRM ──────────────────────────────────────────────────────────────────────

async function getContactosCRM(): Promise<ContactoCRM[]> {
  const [
    { data: contactos },
    { data: pacientes },
    { data: evoluciones },
    { data: turnos },
    { data: cirugias },
    { data: carpetas },
    { data: profs },
  ] = await Promise.all([
    supabase.from('crm_contactos').select('*'),
    supabase.from('pacientes').select('*'),
    supabase.from('evoluciones').select('id_paciente, fecha_consulta').eq('is_deleted', false),
    supabase.from('turnos').select('id_paciente, fecha_turno, profesional_email').gt('fecha_turno', new Date().toISOString()),
    supabase.from('cirugias').select('id_paciente, fecha_realizada, fecha_programada, tipo_cirugia'),
    supabase.from('carpetas_quirurgicas').select('id_paciente, id_carpeta'),
    supabase.from('profesionales').select('email, nombres, apellido'),
  ]);

  const profMap: Record<string, string> = {};
  (profs ?? []).forEach((p: any) => { profMap[p.email] = `${p.nombres} ${p.apellido}`; });

  const pacMap: Record<string, any> = {};
  (pacientes ?? []).forEach((p: any) => { pacMap[p.id_paciente] = p; });

  const crmMap: Record<string, any> = {};
  (contactos ?? []).forEach((c: any) => { crmMap[c.id_contacto] = c; });

  const carpetaMap: Record<string, string> = {};
  (carpetas ?? []).forEach((c: any) => { carpetaMap[c.id_paciente] = c.id_carpeta; });

  const result: ContactoCRM[] = [];

  for (const pac of (pacientes ?? [])) {
    const crm = crmMap[pac.id_paciente] ?? {};
    const lastEvo = (evoluciones ?? [])
      .filter((e: any) => e.id_paciente === pac.id_paciente)
      .sort((a: any, b: any) => new Date(b.fecha_consulta).getTime() - new Date(a.fecha_consulta).getTime())[0];
    const nextTurno = (turnos ?? [])
      .filter((t: any) => t.id_paciente === pac.id_paciente)
      .sort((a: any, b: any) => new Date(a.fecha_turno).getTime() - new Date(b.fecha_turno).getTime())[0];
    const cirugia = (cirugias ?? []).find((c: any) => c.id_paciente === pac.id_paciente);

    let priority: Priority = (crm.prioridad as Priority) ?? Priority.NORMAL;
    if (priority === Priority.NORMAL) {
      if (['DEFINIR_CIRUGIA', 'PERIOPERATORIO'].includes(pac.etiqueta_activa)) priority = Priority.ALTA;
      else if (pac.etiqueta_activa === 'PREBARIATRICO_AVANZADO') priority = Priority.MEDIA;
    }

    result.push({
      id: pac.id_paciente,
      dni: pac.dni ?? '',
      lastName: pac.apellido ?? '',
      firstName: pac.nombres ?? '',
      phone: pac.telefono ?? '',
      email: pac.email ?? '',
      socialInsurance: pac.obra_social ?? '',
      tag: mapEtiquetaToTag(pac.etiqueta_activa),
      priority,
      startDate: crm.fecha_ingreso ?? pac.created_at?.split('T')[0] ?? '',
      isPatient: true,
      canalOrigen: crm.canal_origen ?? undefined,
      estadoSeguimiento: crm.estado_seguimiento ?? undefined,
      lostReason: crm.motivo_perdida ?? null,
      lostTimestamp: crm.fecha_perdida ?? null,
      surgeryDate: pac.fecha_cirugia ?? cirugia?.fecha_realizada ?? cirugia?.fecha_programada ?? null,
      surgeryType: cirugia?.tipo_cirugia ?? null,
      folderId: carpetaMap[pac.id_paciente] ?? null,
      lastConsultationDate: lastEvo ? lastEvo.fecha_consulta.split('T')[0] : null,
      nextConsultation: nextTurno ? {
        date: nextTurno.fecha_turno.split('T')[0],
        time: format(new Date(nextTurno.fecha_turno), 'HH:mm'),
        professional: profMap[nextTurno.profesional_email] ?? nextTurno.profesional_email,
      } : null,
    });
  }

  for (const c of (contactos ?? [])) {
    if (c.is_patient || pacMap[c.id_contacto]) continue;
    result.push(mapContacto(c));
  }

  return result.sort((a, b) => (a.lastName > b.lastName ? 1 : -1));
}

async function updateContactoCRM(id: string, updates: Partial<ContactoCRM>): Promise<Partial<ContactoCRM>> {
  const dbUpdates: any = {};
  if (updates.priority          !== undefined) dbUpdates.prioridad         = updates.priority;
  if (updates.estadoSeguimiento !== undefined) dbUpdates.estado_seguimiento = updates.estadoSeguimiento;
  if (updates.lostReason        !== undefined) dbUpdates.motivo_perdida    = updates.lostReason;
  if (updates.lostTimestamp     !== undefined) dbUpdates.fecha_perdida     = updates.lostTimestamp;

  await supabase.from('crm_contactos').upsert(
    { id_contacto: id, ...dbUpdates }, { onConflict: 'id_contacto' }
  );
  return updates;
}

async function createProspecto(
  prospectoData: Pick<ContactoCRM, 'firstName' | 'lastName' | 'phone' | 'email' | 'canalOrigen'>
): Promise<Partial<ContactoCRM>> {
  const newId = `PR-${Date.now()}`;
  const { error } = await supabase.from('crm_contactos').insert({
    id_contacto:       newId,
    nombres:           prospectoData.firstName,
    apellido:          prospectoData.lastName,
    telefono:          prospectoData.phone,
    email:             prospectoData.email,
    canal_origen:      prospectoData.canalOrigen ?? null,
    is_patient:        false,
    estado_seguimiento: ProspectoEstadoSeguimiento.NUEVO,
    prioridad:         Priority.NORMAL,
  });
  if (error) handleSupabaseError(error);
  return { id: newId, ...prospectoData, isPatient: false };
}

async function getCrmHistory(): Promise<CrmHistoryEntry[]> {
  const { data, error } = await supabase
    .from('crm_contactos')
    .select('id_contacto, apellido, nombres')
    .order('id_contacto', { ascending: false })
    .limit(100);
  if (error) handleSupabaseError(error);

  return (data ?? []).map((row: any, i: number): CrmHistoryEntry => ({
    id: `hist-${i}`,
    patientId: row.id_contacto,
    patientName: `${row.apellido ?? ''}, ${row.nombres ?? ''}`,
    actionType: 'Registro',
    note: '',
    date: new Date().toISOString(),
    author: '',
  }));
}

// ─── TAREAS ───────────────────────────────────────────────────────────────────

async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tareas').select('*, pacientes(apellido, nombres)').order('fecha_vencimiento');
  if (error) handleSupabaseError(error);
  return (data ?? []).map(mapTask);
}

async function getTasksForUser(email: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tareas').select('*, pacientes(apellido, nombres)')
    .eq('asignado_a_email', email).eq('estado', TaskStatus.PENDIENTE).order('fecha_vencimiento');
  if (error) handleSupabaseError(error);
  return (data ?? []).map(mapTask);
}

async function addTask(task: Task): Promise<Task> {
  const { data, error } = await supabase.from('tareas').insert({
    id_paciente:       task.patientId,
    descripcion:       task.description,
    fecha_vencimiento: task.dueDate,
    estado:            task.status,
    asignado_a_email:  task.assigneeEmail ?? null,
    creado_por_email:  task.creatorEmail  ?? null,
  }).select('*, pacientes(apellido, nombres)').single();
  if (error) handleSupabaseError(error);
  return mapTask(data);
}

async function createTask(
  taskData: Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'status'>
): Promise<Task> {
  const { data, error } = await supabase.from('tareas').insert({
    id_paciente:       taskData.patientId,
    descripcion:       taskData.description,
    fecha_vencimiento: taskData.dueDate,
    estado:            TaskStatus.PENDIENTE,
    asignado_a_email:  taskData.assigneeEmail ?? null,
    creado_por_email:  taskData.creatorEmail  ?? null,
  }).select('*, pacientes(apellido, nombres)').single();
  if (error) handleSupabaseError(error);
  return mapTask(data);
}

async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const dbUpdates: any = {};
  if (updates.status      !== undefined) dbUpdates.estado            = updates.status;
  if (updates.completedAt !== undefined) dbUpdates.completed_at      = updates.completedAt;
  if (updates.description !== undefined) dbUpdates.descripcion       = updates.description;
  if (updates.dueDate     !== undefined) dbUpdates.fecha_vencimiento = updates.dueDate;

  const { data, error } = await supabase
    .from('tareas').update(dbUpdates).eq('id_tarea', id)
    .select('*, pacientes(apellido, nombres)').single();
  if (error) handleSupabaseError(error);
  return mapTask(data);
}

// ─── CARPETAS ─────────────────────────────────────────────────────────────────

async function getFolders(): Promise<Folder[]> {
  const { data, error } = await supabase.from('carpetas_quirurgicas').select('*');
  if (error) handleSupabaseError(error);
  return (data ?? []).map(mapFolder);
}

// Helper: check if a string is a valid UUID
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function updateFolder(folder: Folder): Promise<Folder> {
  // Build the payload — only include id_carpeta if it's already a real UUID.
  // When creating a new folder the frontend sets a temporary string like
  // "folder-P-007"; omitting it lets Supabase generate a proper UUID.
  const payload: Record<string, any> = {
    id_paciente:              folder.patientId,
    estado_tracking:          folder.trackingState,
    checklist:                folder.checklist,
    fecha_pedido:             folder.requestDate,
    fecha_entrega_paciente:   folder.deliveredToPatientDate,
    fecha_presentacion_os:    folder.submittedDate,
    fecha_autorizacion:       folder.authorizedDate,
    link_drive:               folder.driveLink,
    notas:                    folder.notes,
    cirujano_nombre:          folder.surgeon,
    nutricionista_nombre:     folder.nutritionist,
    psicologo_nombre:         folder.psychologist,
    fecha_cirugia_programada: folder.scheduledSurgeryDate,
    hora_cirugia_programada:  folder.scheduledSurgeryTime,
  };

  if (folder.id && isValidUUID(folder.id)) {
    payload.id_carpeta = folder.id;
  }

  const { data, error } = await supabase
    .from('carpetas_quirurgicas')
    .upsert(payload, { onConflict: 'id_paciente' })
    .select()
    .single();
  if (error) handleSupabaseError(error);
  return mapFolder(data);
}

// ─── CONFIGURACIÓN CRM ────────────────────────────────────────────────────────

async function getCrmSimpleProfessionals(): Promise<CrmSimpleProfessionals> {
  const { data, error } = await supabase
    .from('profesionales').select('email, nombres, apellido, especialidad').eq('activo', true);
  if (error) handleSupabaseError(error);

  const surgeons: string[]     = [];
  const nutritionists: string[] = [];
  const psychologists: string[] = [];

  (data ?? []).forEach((p: any) => {
    const name = `${p.nombres} ${p.apellido}`;
    const esp  = (p.especialidad ?? '').toLowerCase();
    if (esp.includes('cirug'))      surgeons.push(name);
    else if (esp.includes('nutri')) nutritionists.push(name);
    else if (esp.includes('psic'))  psychologists.push(name);
  });

  return { surgeons, nutritionists, psychologists };
}

async function updateCrmSimpleProfessionals(p: CrmSimpleProfessionals): Promise<CrmSimpleProfessionals> {
  return p;
}

async function getMessageTemplates(): Promise<MessageTemplate[]> {
  const { data } = await supabase
    .from('configuracion_sistema').select('plantillas_mensajes').eq('id', 1).maybeSingle();
  return (data as any)?.plantillas_mensajes ?? [];
}

async function updateMessageTemplates(t: MessageTemplate[]): Promise<MessageTemplate[]> {
  await supabase.from('configuracion_sistema')
    .upsert({ id: 1, plantillas_mensajes: t } as any, { onConflict: 'id' });
  return t;
}

// ─── IA ───────────────────────────────────────────────────────────────────────

async function generateWhatsAppMessage(patient: ContactoCRM, goal: string): Promise<string> {
  try {
    return `Hola ${patient.firstName}, te escribimos para: ${goal}. Quedamos a tu disposición. Saludos, el equipo de Plenus.`;
  } catch (error) {
    return `Hola ${patient.firstName}, te escribimos para: ${goal}. Quedamos a tu disposición.`;
  }
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

async function signIn(email: string, password: string): Promise<Profesional> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Email o contraseña incorrectos.');

  const { data: prof, error: profError } = await supabase
    .from('profesionales')
    .select('*')
    .eq('email', data.user.email)
    .single();

  if (profError || !prof) throw new Error('Usuario no encontrado en el sistema. Contacte al administrador.');
  if (!prof.activo) throw new Error('Tu cuenta está inactiva. Contacte al administrador.');

  return mapProfesional(prof);
}

async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

async function getCurrentUser(): Promise<Profesional | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email) return null;

  const { data: prof } = await supabase
    .from('profesionales')
    .select('*')
    .eq('email', session.user.email)
    .single();

  return prof ? mapProfesional(prof) : null;
}

async function inviteUsuario(
  profesionalData: Omit<Profesional, 'activo'>,
  userRole: UserRole
): Promise<void> {
  if (userRole !== UserRole.ADMINISTRATIVO) throw new Error('Permiso denegado.');

  const { error: insertError } = await supabase.from('profesionales').insert({
    email:        profesionalData.email,
    nombres:      profesionalData.nombres,
    apellido:     profesionalData.apellido,
    rol:          profesionalData.rol,
    activo:       true,
    especialidad: profesionalData.especialidad ?? null,
    matricula:    profesionalData.matricula    ?? null,
    telefono:     profesionalData.telefono     ?? null,
  });
  if (insertError) throw new Error('Error al crear el perfil: ' + insertError.message);
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────

export const api = {
  // Auth
  signIn,
  signOut,
  getCurrentUser,
  inviteUsuario,
  // Profesionales
  getProfesional,
  getProfesionales,
  getProfesionalesAdmin,
  updateProfesionalesAdmin,
  createProfesional,
  upsertProfesional,
  updateProfesionalConfig,
  deleteProfesional,
  // Configuración
  getEtiquetasFlujo,
  getConfiguracionGeneral,
  updateConfiguracionGeneral,
  // Pacientes
  getPacientes,
  getPacienteCompleto,
  createPaciente,
  updatePacienteFiliatorio,
  updatePacienteTag,
  definirCirugia,
  simulateDailyTrigger,
  // Turnos
  getTurnosPorFechaYProfesional,
  getTurnosParaProfesional,
  getTurnosDiariosParaProfesional,
  getTurnosDiariosTodosProfesionales,
  createTurno,
  updateDetallesTurno,
  // Evoluciones
  createEvolucion,
  updateEvolucion,
  // Historia clínica
  updateHistoriaClinica,
  // Estudios
  createEstudio,
  updateEstudio,
  // Módulos clínicos
  updateCirugiaInfo,
  updateNutricionInfo,
  updatePsicologiaInfo,
  // Informes
  guardarInforme,
  // CRM
  getContactosCRM,
  updateContactoCRM,
  createProspecto,
  getCrmHistory,
  // Tareas
  getTasks,
  getTasksForUser,
  addTask,
  createTask,
  updateTask,
  // Carpetas
  getFolders,
  updateFolder,
  // Configuración CRM
  getCrmSimpleProfessionals,
  updateCrmSimpleProfessionals,
  getMessageTemplates,
  updateMessageTemplates,
  // IA
  generateWhatsAppMessage,
};