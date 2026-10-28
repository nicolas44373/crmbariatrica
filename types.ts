// --- CLINICAL APP TYPES ---

export enum UserRole {
  ADMINISTRATIVO = 'Administrativo',
  MEDICO = 'Médico',
  SUPERADMIN = 'SuperAdmin',
}

export enum PreQuirurgicoStatus {
  PENDIENTE = 'Pendiente',
  RECIBIDO = 'Recibido',
  REVISADO = 'Revisado',
}

export enum CirugiaTipo {
  OBRA_SOCIAL = 'Obra Social',
  PARTICULAR = 'Particular',
}

export enum DiaSemana {
    DOMINGO = 0,
    LUNES = 1,
    MARTES = 2,
    MIERCOLES = 3,
    JUEVES = 4,
    VIERNES = 5,
    SABADO = 6,
}

export enum EstadoTurnoDia {
    AGENDADO = 'AGENDADO',
    CONFIRMADO = 'CONFIRMADO',
    EN_ESPERA = 'EN_ESPERA',
    EN_CONSULTA = 'EN_CONSULTA',
    ATENDIDO = 'ATENDIDO',
    CANCELADO = 'CANCELADO',
    AUSENTE = 'AUSENTE',
    PRE_RESERVA = 'PRE_RESERVA',
}

export enum TipoCirugiaBariatrica {
    MANGA_GASTRICA = 'Manga Gástrica',
    BYPASS_GASTRICO = 'Bypass Gástrico',
    SADI_S = 'SADI-S',
    BALON_INTRAGASTRICO = 'Balón Intragástrico',
    OTRA = 'Otra',
}

// Corresponds to: Tabla 1: PACIENTES_FILIATORIOS
export interface PacienteFiliatorio {
  idPaciente: string;
  etiquetaPrincipalActiva: string;
  apellido: string;
  nombres: string;
  dni: string;
  fechaNacimiento: string; // YYYY-MM-DD
  direccion?: string;
  obraSocial: string;
  nroAfiliado: string;
  telefono: string;
  email: string;
  cirujanoAsignado: string;
  nutricionistaAsignado: string;
  psicologoAsignado: string;
  fechaCirugia?: string; // YYYY-MM-DD
  tipoCirugia?: CirugiaTipo;
  fotoPerfil?: string;
  nroHc?: number;
  sexo?: string;
  ocupacion?: string;
  localidad?: string;
  cp?: string;
  telefono2?: string;
  modalidadCobertura?: string;
  cgOperado?: boolean;
  tiProfesionalEmail?: string;
}

// Corresponds to: Tabla 2: HISTORIA_CLINICA_ESTATICA
export interface HistoriaClinicaEstatica {
  idHistoria: string;
  idPaciente: string;
  pesoInicial: number;
  talla: number; // in cm
  imcInicial: number;
  comorbilidades: string[];
  antecedentesMedicos?: string;
  medicacionCronica: string;
  antecedentesQuirurgicos: string;
  antecedentesNutricionales: string;
}

// Corresponds to: Tabla 3: EVOLUCIONES_CLINICAS
export interface EvolucionClinica {
  idEvolucion: string;
  idPaciente: string;
  fechaConsulta: string; // ISO string
  emailProfesionalAutor: string;
  especialidad: string;
  pesoActual?: number;
  evolucionClinica: string;
  notaConfidencial: string;
}

export enum TipoEstudio {
  LABORATORIO = 'Laboratorio',
  ENDOSCOPIA = 'Endoscopia Digestiva Alta',
  ECOGRAFIA = 'Ecografía Abdominal',
  EVAL_CARDIOLOGICA = 'Evaluación Cardiológica',
  OTROS = 'Otros Estudios',
}

export interface ResultadoLaboratorio {
  parametro: string;
  valor: string;
  unidad: string;
}

export interface EstudioRealizado {
  idEstudio: string;
  idPaciente: string;
  fecha: string; // YYYY-MM-DD
  tipo: TipoEstudio;
  descripcion?: string;
  nombreArchivo?: string;
  resultados?: ResultadoLaboratorio[];
  resultadoBiopsia?: string;
}

export interface InformeClinico {
  idInforme: string;
  idPaciente: string;
  fechaCreacion: string; // ISO string
  fechaUltimaEdicion: string; // ISO string
  emailProfesionalAutor: string;
  tipoInforme: string;
  contenido: string;
}

// Corresponds to: Tabla de Configuración 1: Config_Etiquetas_Flujo
export interface EtiquetaFlujo {
  nombreEtiquetaUnico: string;
  ordenSecuencia: number;
  descripcionParaUsuario: string;
  color: string;
}

export interface ModosAtencion {
    obrasSociales: string;
    valorConsultaParticular?: number;
    detallesAdicionales: string;
}

export interface Profesional {
    email: string;
    nombres: string;
    apellido: string;
    rol: UserRole;
    activo: boolean;
    especialidad?: string;
    matricula?: string;
    telefono?: string;
    modosAtencion?: ModosAtencion;
    config_turnos?: any; 
    iniciales?: string;
}

export interface Turno {
    idTurno: string;
    idPaciente: string;
    fechaTurno: string; // ISO string
    profesionalEmail: string;
    especialidad: string;
    estado: EstadoTurnoDia;
    creadoPorEmail: string;
    valorCobrado?: number;
    notaInterna?: string;
    horaLlegada?: string; // ISO string
    horaAtencion?: string; // ISO string
    esVideoconsulta?: boolean;
    esSobreturno?: boolean;
    metodoPago?: 'Efectivo' | 'Transferencia' | 'Tarjeta';
    tipoCobro?: 'Consulta Particular' | 'Copago Obra Social';
}

export interface TurnoConPaciente extends Turno {
    paciente: PacienteFiliatorio;
}

export interface TurnoDiario extends Turno {
    paciente: PacienteFiliatorio;
}

export interface CirugiaInfo {
    idPaciente: string;
    fechaProgramada?: string; // YYYY-MM-DD
    fechaRealizada?: string; // YYYY-MM-DD
    tipoCirugia?: TipoCirugiaBariatrica;
    notas?: string;
    nombreArchivoProtocolo?: string;
    complicaciones?: string;
}

export interface NutricionInfo {
    idPaciente: string;
    perimetroCintura?: number;
    perimetroCuello?: number;
    composicionCorporal?: string;
    habitosAlimentarios?: string;
    habitosEjercicio?: string;
    tratamientosPrevios?: string;
    nombreArchivoNutricion?: string;
}

export interface PsicologiaInfo {
    idPaciente: string;
    psicologoEmailAutor: string;
    notasPrivadas: string;
}

export interface PacienteCompleto {
    filiatorio: PacienteFiliatorio;
    historiaClinica: HistoriaClinicaEstatica;
    evoluciones?: EvolucionClinica[];
    turnos?: Turno[];
    estudios?: EstudioRealizado[];
    informes?: InformeClinico[];
    cirugia?: CirugiaInfo;
    nutricion?: NutricionInfo;
    psicologia?: PsicologiaInfo;
    carpeta?: Folder;
}

export interface BloqueHorario {
    id: string;
    dia: DiaSemana;
    horaInicio: string; // HH:mm
    horaFin: string; // HH:mm
}

export interface HorarioEspecial {
    id: string;
    fecha: string; // YYYY-MM-DD
    horaInicio: string; // HH:mm
    horaFin: string; // HH:mm
}

export interface ConfiguracionProfesional {
    profesionalEmail: string;
    duracionTurnoMinutos: number;
    horarios: BloqueHorario[];
    diasBloqueados?: string[]; // YYYY-MM-DD
    horariosEspeciales?: HorarioEspecial[];
}

export interface PlantillaLaboratorioParametro {
    id: string;
    parametro: string;
    unidad: string;
}

export interface ConfiguracionGeneral {
    configuracionesProfesionales: ConfiguracionProfesional[];
    plantillaLaboratorio: PlantillaLaboratorioParametro[];
}

// --- CRM TYPES ---

export enum ProspectoCanalOrigen {
    INSTAGRAM = 'Instagram',
    FACEBOOK = 'Facebook',
    WHATSAPP_1 = 'WhatsApp (Línea 1)',
    WHATSAPP_2 = 'WhatsApp (Línea 2)',
    WEB = 'Página Web',
    RECOMENDACION = 'Recomendación',
    OTRO = 'Otro',
}

export enum ProspectoEstadoSeguimiento {
    NUEVO = 'Nuevo',
    CONTACTADO = 'Contactado',
    INTERESADO = 'Interesado',
    AGENDANDO_CITA = 'Agendando Cita',
    DESCARTADO = 'Descartado',
}

export interface CrmSimpleProfessionals {
    surgeons: string[];
    nutritionists: string[];
    psychologists: string[];
    todos: { nombre: string; email: string }[];
}

export interface MessageTemplate {
    id: string;
    name: string;
    text: string;
    category?: 'prospectos' | 'no-operados' | 'operados' | 'todos';
}

export enum Priority {
    ALTA = 'Alta',
    MEDIA = 'Media',
    NORMAL = 'Normal',
}

export enum ContactoTag {
    NUEVO_INGRESO = 'NUEVO_INGRESO',
    BARIATRICO_PRIMERA_VEZ = 'BARIATRICO_PRIMERA_VEZ',
    PREBARIATRICO_INICIAL = 'PREBARIATRICO_INICIAL',
    PREBARIATRICO_AVANZADO = 'PREBARIATRICO_AVANZADO',
    DEFINIR_CIRUGIA = 'DEFINIR_CIRUGIA',
    CARPETA_ENTREGADA = 'CARPETA_ENTREGADA',
    PERIOPERATORIO = 'PERIOPERATORIO',
    POSBARIATRICO = 'POSBARIATRICO',
    CIRUGIA_GENERAL = 'CIRUGIA_GENERAL',
    TRATAMIENTO_INDIVIDUAL = 'TRATAMIENTO_INDIVIDUAL',
}

export enum ContactoStatus {
    ACTIVO = 'Activo',
    INACTIVO = 'Inactivo',
    PERDIDO = 'Perdido',
}

export enum TaskStatus {
    PENDIENTE = 'Pendiente',
    HECHO = 'Hecho',
    POSPUESTO = 'Pospuesto',
}

export interface TaskHistoryEntry {
    id: string;
    date: string; // ISO string
    action: 'creada' | 'pospuesta' | 'realizada' | 'reabierta' | 'modificada';
    note?: string;
    author?: string;
}

export enum PostOpStage {
    INMEDIATO = 'Inmediato (0-1m)',
    RECIENTE = 'Reciente (1-6m)',
    MEDIATO = 'Mediato (6-12m)',
    ALEJADO = 'Alejado (+12m)',
}

export enum FolderTrackingStatus {
    NO_PRESENTADA = 'No Presentada',
    PEDIDO_GENERADO = 'Pedido Generado',
    ENTREGADA_AL_PACIENTE = 'Entregada al Paciente',
    PRESENTADA_EN_OS = 'Presentada en OS',
    EN_AUDITORIA = 'En Auditoría',
    AUTORIZADA = 'Autorizada',
    RECHAZADA = 'Rechazada',
    ANULADA = 'Anulada',
}

export interface FolderNote {
    id: string;
    fecha: string; // YYYY-MM-DD
    autor: string;
    texto: string;
}

export enum ChecklistItemStatus {
    PENDIENTE = 'Pendiente',
    RECIBIDO = 'Recibido',
    NO_APLICA = 'No Aplica',
}

export enum LostReason {
    NO_RESPONDE = 'No Responde',
    NO_INTERESADO = 'No Interesado',
    COSTO = 'Costo',
    OTRA_OPCION = 'Eligió otra opción',
    NO_CUMPLE_REQUISITOS = 'No cumple requisitos',
    OTRO = 'Otro',
}

export interface CrmHistoryEntry {
    id: string;
    date: string; // ISO string
    patientId: string;
    patientName: string;
    actionType: string;
    note: string;
    author: string;
}

export interface Task {
    id: string;
    patientId: string;
    patientName: string;
    description: string;
    dueDate: string; // YYYY-MM-DD
    status: TaskStatus;
    createdAt: string; // ISO string
    completedAt: string | null; // ISO string
    postponedAt?: string | null; // ISO string
    creatorEmail?: string;
    assigneeEmail?: string;
    history?: TaskHistoryEntry[];
}

export interface Folder {
    id: string;
    patientId: string;
    checklist: {
        consentimiento: ChecklistItemStatus;
        presupuesto: ChecklistItemStatus;
        informeCirujano: ChecklistItemStatus;
        informeNutricionista: ChecklistItemStatus;
        informePsicologo: ChecklistItemStatus;
    };
    trackingState: FolderTrackingStatus;
    requestDate: string | null; // YYYY-MM-DD
    deliveredToPatientDate: string | null; // YYYY-MM-DD
    submittedDate: string | null; // YYYY-MM-DD
    authorizedDate: string | null; // YYYY-MM-DD
    driveLink: string;
    notes: FolderNote[];
    surgeon: string;
    nutritionist: string;
    psychologist: string;
    scheduledSurgeryDate: string | null; // YYYY-MM-DD
    scheduledSurgeryTime: string | null; // HH:mm
}

export interface ContactoCRM {
    id: string;
    dni: string;
    lastName: string;
    firstName: string;
    phone: string;
    email: string;
    socialInsurance: string;
    tag?: ContactoTag;
    priority: Priority;
    startDate: string; // YYYY-MM-DD
    lastConsultationDate: string | null; // YYYY-MM-DD
    nextConsultation: {
        date: string; // YYYY-MM-DD
        time: string; // HH:mm
        professional: string;
    } | null;
    lostReason: LostReason | string | null;
    lostTimestamp: string | null; // ISO string
    surgeryDate: string | null; // YYYY-MM-DD
    surgeryType: TipoCirugiaBariatrica | null;
    folderId: string | null;
    isPatient: boolean;
    nroHc?: number;
    // Prospect only fields
    canalOrigen?: ProspectoCanalOrigen;
    estadoSeguimiento?: ProspectoEstadoSeguimiento;
    ultimoContacto?: string; // YYYY-MM-DD
    modalidadCobertura?: string;
    cgOperado?: boolean;
    tiProfesionalEmail?: string;
}

// ─── WHATSAPP INBOX ──────────────────────────────────────────────────────────

export interface WhatsAppConversacion {
    telefono: string;
    idPaciente: string | null;
    nombreContacto: string | null;
    ultimoMensaje: string | null;
    ultimoMensajeFecha: string | null; // ISO string
    modo: 'bot' | 'humano';
    estado: 'abierta' | 'atendida';
    atendidoPorEmail: string | null;
    derivado: boolean;
    derivadoMotivo: string | null;
    ultimaLectura: string | null; // ISO string — última vez que alguien del equipo abrió esta conversación
    asignadoAEmail: string | null; // a quién se le asignó el seguimiento (independiente de quién la "tomó")
    canal: 'whatsapp' | 'instagram';
    tipoContacto: 'paciente' | 'prospecto' | 'desconocido';
    idContacto: string | null; // crm_contactos.id_contacto cuando es prospecto
    intentosVerificacion: number; // verificaciones por DNI fallidas (a las 2 el bot deja de intentar por 24 h)
    intentosAgenda: number; // horarios rechazados seguidos (a los 2 el bot deja de ofrecer y deriva)
    ultimoMensajeSistemaAt: string | null; // última plantilla automática (recordatorio, confirmación, rescate…)
}

// Vínculo del número con un paciente verificado por DNI (whatsapp_vinculos)
export interface VinculoWhatsApp {
    idPaciente: string;
    contactoNombre: string | null;
    contactoVinculo: string | null;
    expiraAt: string | null; // con fecha = gestiona un tercero (vínculo temporal)
}

// Prospecto tal como lo carga el bot en crm_contactos
export interface ProspectoBot {
    idContacto: string;
    nombres: string | null;
    apellido: string | null;
    dni: string | null;
    fechaNacimiento: string | null; // YYYY-MM-DD
    obraSocial: string | null;
    nroAfiliado: string | null;
    estado: string | null; // Nuevo | Contactado | Interesado | Tibio | Frio | Hibernado | Descartado | Pre-reserva | Paciente
    motivo: string | null;
    contactoNombre: string | null;
    contactoVinculo: string | null;
    telefono: string | null;
    idTurnoPrereserva: string | null;
    ultimoMensajeAt: string | null;
    noContactar: boolean; // pidió BAJA
    estadoPrevio: string | null; // estado al que vuelve si responde durante el rescate
    estadoCambiadoAt: string | null;
    rescateTibioAt: string | null;
    rescateFrioAt: string | null;
    rescateHibernadoAt: string | null;
}

export interface PreReserva {
    idTurno: string;
    fechaTurno: string; // ISO
    profesionalEmail: string;
    idContacto: string | null;
    prospecto: ProspectoBot | null;
    avisoEnviado: boolean;
    virtual: boolean;
}

// Turno del próximo día de atención que el paciente todavía no confirmó (WhatsApp → Sin confirmar).
export interface TurnoSinConfirmar {
    idTurno: string;
    fechaTurno: string; // ISO
    profesionalEmail: string;
    idPaciente: string;
    paciente: string;
    telefono: string | null;
    virtual: boolean;
    recordatorioEnviado: boolean;
}

export interface ResumenPacienteWhatsApp {
    idPaciente: string;
    nombres: string;
    apellido: string;
    dni: string;
    obraSocial: string;
    etiqueta: string;
    proximosTurnos: { idTurno: string; fechaTurno: string; profesionalEmail: string; estado: string; virtual: boolean; recordatorioEnviado: boolean }[];
}

export interface BloqueoCentro {
    fecha: string; // YYYY-MM-DD
    motivo: string | null;
    origen: string | null; // 'api' (feriado automático), 'anulado' (feriado en que se atiende igual) o manual
}

export type WhatsAppTipoMensaje = 'texto' | 'imagen' | 'audio' | 'video' | 'documento' | 'sticker';

export interface WhatsAppMensaje {
    idMensaje: string;
    telefono: string;
    remitente: string; // 'paciente' | 'bot' | 'sistema' (plantilla automática) | email de la secretaria
    texto: string;
    fecha: string; // ISO string
    tipo: WhatsAppTipoMensaje;
    mediaPath: string | null; // ruta dentro del bucket privado 'whatsapp-media'
    mediaUrl: string | null; // URL firmada, resuelta al cargar
    mediaMime: string | null;
    mediaNombre: string | null;
}