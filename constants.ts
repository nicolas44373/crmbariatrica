import { EtiquetaFlujo, Profesional, UserRole, DiaSemana, EstadoTurnoDia, TipoEstudio, TipoCirugiaBariatrica, MessageTemplate, CrmSimpleProfessionals, ProspectoCanalOrigen, ProspectoEstadoSeguimiento } from './types';

export const normalizeString = (str: string): string => 
    str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/_/g, ' ')
        .toLowerCase();

export const ETIQUETAS_FLUJO: EtiquetaFlujo[] = [
  { nombreEtiquetaUnico: 'NUEVO_INGRESO', ordenSecuencia: 10, descripcionParaUsuario: 'Paciente recién ingresado o con primer turno agendado.', color: 'bg-blue-100 text-blue-800' },
  { nombreEtiquetaUnico: 'BARIATRICO_PRIMERA_VEZ', ordenSecuencia: 20, descripcionParaUsuario: 'Paciente que ya tuvo su primera consulta bariátrica.', color: 'bg-indigo-100 text-indigo-800' },
  { nombreEtiquetaUnico: 'PREBARIATRICO_INICIAL', ordenSecuencia: 30, descripcionParaUsuario: 'Paciente iniciando estudios y consultas prequirúrgicas.', color: 'bg-amber-100 text-amber-800' },
  { nombreEtiquetaUnico: 'PREBARIATRICO_AVANZADO', ordenSecuencia: 40, descripcionParaUsuario: 'Paciente con estudios y consultas avanzadas.', color: 'bg-yellow-100 text-yellow-800' },
  { nombreEtiquetaUnico: 'DEFINIR_CIRUGIA', ordenSecuencia: 50, descripcionParaUsuario: 'Paciente apto para cirugía, pendiente de definición de fecha y tipo.', color: 'bg-orange-100 text-orange-800' },
  { nombreEtiquetaUnico: 'CARPETA_ENTREGADA', ordenSecuencia: 55, descripcionParaUsuario: 'Paciente recibió la carpeta para presentar en su obra social.', color: 'bg-teal-100 text-teal-800' },
  { nombreEtiquetaUnico: 'PERIOPERATORIO', ordenSecuencia: 60, descripcionParaUsuario: 'Paciente con fecha de cirugía asignada.', color: 'bg-red-100 text-red-800' },
  { nombreEtiquetaUnico: 'POSBARIATRICO', ordenSecuencia: 70, descripcionParaUsuario: 'Paciente en seguimiento post-cirugía.', color: 'bg-green-100 text-green-800' },
];

export const PROFESIONALES: Profesional[] = [
    { email: 'admin@clinicabariatrica.com', nombres: 'Admin', apellido: 'General', rol: UserRole.ADMINISTRATIVO, activo: true },
    { 
        email: 'cirujano.jefe@clinicabariatrica.com', 
        nombres: 'Dr. Juan', 
        apellido: 'Pérez', 
        rol: UserRole.MEDICO, 
        especialidad: 'Cirugía Bariátrica', 
        activo: true, 
        matricula: 'MN 12345', 
        telefono: '11-1111-1111',
        modosAtencion: {
            obrasSociales: 'OSDE, Swiss Medical, Galeno',
            valorConsultaParticular: 15000,
            detallesAdicionales: 'Reintegros disponibles para otras prepagas.'
        }
    },
    { 
        email: 'nutricionista.ana@clinicabariatrica.com', 
        nombres: 'Lic. Ana', 
        apellido: 'Gómez', 
        rol: UserRole.MEDICO, 
        especialidad: 'Nutrición', 
        activo: true, 
        matricula: 'MN 12346', 
        telefono: '11-2222-2222',
        modosAtencion: {
            obrasSociales: 'OSDE, Swiss Medical',
            valorConsultaParticular: 8000,
            detallesAdicionales: ''
        }
    },
    { 
        email: 'psicologo.carlos@clinicabariatrica.com', 
        nombres: 'Lic. Carlos', 
        apellido: 'Ruiz', 
        rol: UserRole.MEDICO, 
        especialidad: 'Psicología', 
        activo: true,
        matricula: 'MN 12347', 
        telefono: '11-3333-3333',
        modosAtencion: {
            obrasSociales: 'Galeno',
            valorConsultaParticular: 9500,
            detallesAdicionales: 'Atención únicamente particular o por Galeno.'
        }
    },
];

export const CURRENT_USER_EMAIL_ADMIN = 'admin@clinicabariatrica.com';
export const CURRENT_USER_EMAIL_MEDICO = 'cirujano.jefe@clinicabariatrica.com';
export const CURRENT_USER_EMAIL_PSICOLOGO = 'psicologo.carlos@clinicabariatrica.com'; // Added for testing privacy


export const DIAS_SEMANA_MAP: { [key in DiaSemana]: string } = {
    [DiaSemana.LUNES]: 'Lunes',
    [DiaSemana.MARTES]: 'Martes',
    [DiaSemana.MIERCOLES]: 'Miércoles',
    [DiaSemana.JUEVES]: 'Jueves',
    [DiaSemana.VIERNES]: 'Viernes',
    [DiaSemana.SABADO]: 'Sábado',
    [DiaSemana.DOMINGO]: 'Domingo',
};

export const ESTADO_TURNO_MAP: Record<EstadoTurnoDia, { texto: string; color: string, colorFondo: string, colorTexto?: string }> = {
    [EstadoTurnoDia.AGENDADO]: { texto: 'Agendado', color: 'border-blue-500', colorFondo: 'bg-blue-50' },
    [EstadoTurnoDia.CONFIRMADO]: { texto: 'Confirmado', color: 'border-cyan-500', colorFondo: 'bg-cyan-50' },
    [EstadoTurnoDia.EN_ESPERA]: { texto: 'En espera', color: 'border-yellow-500', colorFondo: 'bg-yellow-50' },
    [EstadoTurnoDia.EN_CONSULTA]: { texto: 'En Consulta', color: 'border-orange-500', colorFondo: 'bg-orange-50' },
    [EstadoTurnoDia.ATENDIDO]: { texto: 'Atendido', color: 'border-green-500', colorFondo: 'bg-green-50', colorTexto: 'text-green-800' },
    [EstadoTurnoDia.CANCELADO]: { texto: 'Cancelado', color: 'border-red-500', colorFondo: 'bg-red-50', colorTexto: 'text-red-800' },
};

export const COMORBILIDADES_PREDEFINIDAS: string[] = [
    "Hipertensión Arterial",
    "Diabetes Mellitus Tipo 2",
    "Dislipidemia",
    "Apnea Obstructiva del Sueño",
    "Hígado Graso no Alcohólico",
    "Enfermedad por Reflujo Gastroesofágico",
    "Artrosis",
    "Infertilidad",
    "Síndrome de Ovario Poliquístico",
];

export const TIPOS_ESTUDIO = [
    { value: TipoEstudio.LABORATORIO,  label: 'Laboratorio' },
    { value: TipoEstudio.ENDOSCOPIA,   label: 'Endoscopia' },
    { value: TipoEstudio.ECOGRAFIA,    label: 'Ecografía' },
    { value: TipoEstudio.EVAL_CARDIOLOGICA,  label: 'Cardiología' },
    { value: TipoEstudio.OTROS,        label: 'Otros' },
];

export const TIPOS_CIRUGIA_BARIATRICA: { value: TipoCirugiaBariatrica; label: string }[] = [
    { value: TipoCirugiaBariatrica.MANGA_GASTRICA, label: "Manga Gástrica" },
    { value: TipoCirugiaBariatrica.BYPASS_GASTRICO, label: "Bypass Gástrico" },
    { value: TipoCirugiaBariatrica.SADI_S, label: "SADI-S" },
    { value: TipoCirugiaBariatrica.BALON_INTRAGASTRICO, label: "Balón Intragástrico" },
    { value: TipoCirugiaBariatrica.OTRA, label: "Otra" },
];

// --- CRM CONSTANTS ---

export const CANALES_ORIGEN_LIST = Object.values(ProspectoCanalOrigen);
export const ESTADOS_SEGUIMIENTO_LIST = [
    { value: ProspectoEstadoSeguimiento.NUEVO, color: 'bg-sky-100 text-sky-800' },
    { value: ProspectoEstadoSeguimiento.CONTACTADO, color: 'bg-blue-100 text-blue-800' },
    { value: ProspectoEstadoSeguimiento.INTERESADO, color: 'bg-indigo-100 text-indigo-800' },
    { value: ProspectoEstadoSeguimiento.AGENDANDO_CITA, color: 'bg-amber-100 text-amber-800' },
    { value: ProspectoEstadoSeguimiento.DESCARTADO, color: 'bg-slate-100 text-slate-800' },
];

export const INITIAL_CRM_PROFESSIONALS: CrmSimpleProfessionals = {
    surgeons: ["Dr. Juan Pérez", "Dra. Bianchi", "Dr. Moreno"],
    nutritionists: ["Lic. Ana Gómez", "Lic. Vega", "Lic. Giménez"],
    psychologists: ["Lic. Carlos Ruiz", "Lic. Acosta", "Lic. Flores"],
};

export const INITIAL_MESSAGE_TEMPLATES: MessageTemplate[] = [
  { 
    id: 'recordatorioCita', 
    name: 'Recordatorio Cita', 
    text: "Hola [Nombre], te recordamos tu consulta el [Proxima Cita] a las [Hora Cita] con [Profesional]. ¡Te esperamos!" 
  },
  { 
    id: 'seguimientoPostOp', 
    name: 'Seguimiento Post-Op', 
    text: "Hola [Nombre], ¿cómo has seguido después de tu cirugía? Estamos aquí para cualquier consulta que tengas." 
  },
  { 
    id: 'consultaResultados', 
    name: 'Consulta Resultados', 
    text: "Hola [Nombre], ya tenemos los resultados de tus últimos estudios. Por favor, contáctanos para agendar una consulta." 
  },
  { 
    id: 'saludoGeneral', 
    name: 'Saludo General', 
    text: "Hola [Nombre], te saludamos del programa de cirugía bariátrica. ¿Cómo estás? Queremos saber de ti." 
  }
];

export const EMAIL_TEMPLATES: { [key: string]: { subject: string, body: string } } = {
  dietaPreQuirurgica: {
    subject: "Plan de alimentación pre-quirúrgico",
    body: `Hola [Nombre],\n\nAdjunto a este correo encontrarás el plan de alimentación que debes seguir como preparación para tu cirugía.\n\nEs muy importante que lo sigas al pie de la letra para asegurar que todo salga perfecto.\n\nSi tienes alguna duda, no dudes en contactarnos.\n\nSaludos cordiales,\nEl equipo del Programa Bariátrico.`
  },
  recomendacionesPostOp: {
    subject: "Recomendaciones post-operatorias importantes",
    body: `Hola [Nombre],\n\n¡Esperamos que te estés recuperando muy bien!\n\nTe enviamos las recomendaciones generales para esta primera etapa post-operatoria. Recuerda que tu próxima consulta es el [Proxima Cita] a las [Hora Cita] con [Profesional].\n\nEs fundamental que sigas estas indicaciones para una correcta recuperación.\n\nCualquier consulta, estamos a tu disposición.\n\nUn saludo,\nEl equipo del Programa Bariátrico.`
  },
  pedidoEstudios: {
    subject: "Solicitud de estudios pre-quirúrgicos",
    body: `Hola [Nombre],\n\nPara continuar con tu proceso, es necesario que te realices los siguientes estudios pre-quirúrgicos:\n\n- Análisis de sangre completo\n- Electrocardiograma\n- Ecografía abdominal\n\nPor favor, solicita un turno para realizarlos y tráenos los resultados en tu próxima consulta.\n\nGracias,\nEl equipo del Programa Bariátrico.`
  },
};