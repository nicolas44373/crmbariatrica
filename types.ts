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
    metodoPago?: 'Efectivo' | 'Tarjeta';
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
    creatorEmail?: string;
    assigneeEmail?: string;
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
    notes: string;
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
    // Prospect only fields
    canalOrigen?: ProspectoCanalOrigen;
    estadoSeguimiento?: ProspectoEstadoSeguimiento;
    ultimoContacto?: string; // YYYY-MM-DD
}