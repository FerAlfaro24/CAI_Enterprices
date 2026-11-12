/**
 * Datos ficticios del panel de administración. Nombres, programas y cifras
 * son inventados para la demostración y no corresponden a alumnos reales.
 */

export type RequestStatus = 'pendiente' | 'aprobada' | 'rechazada'
export type AgeGroup = 'adulto' | 'menor'
export type GuardianConsent = 'recibida' | 'pendiente'

/** Datos capturados por el formulario de registro de la demo (nunca la contraseña). */
export type Applicant = {
  filledBy: 'alumno' | 'tutor'
  email: string
  age: number
  group: string
  studentCode?: string
  displayName: string
  avatarColor: string
  visibility: 'privado' | 'comunidad'
  guardian?: { name: string; relationship: string; contact: string }
}

export type AccessRequest = {
  id: string
  name: string
  program: string
  ageGroup: AgeGroup
  guardianConsent?: GuardianConsent
  source: 'Formulario web' | 'Recepción' | 'Referido'
  submittedAt: string
  message: string
  status: RequestStatus
  applicant?: Applicant
}

export const accessRequests: AccessRequest[] = [
  { id: 'CAI-0142', name: 'Valeria Ríos', program: 'Preparación TOEFL', ageGroup: 'adulto', source: 'Formulario web', submittedAt: '2026-10-16', message: 'Terminé el curso B2 y quiero compartir mi avance con la comunidad.', status: 'pendiente' },
  { id: 'CAI-0141', name: 'Mateo Salgado', program: 'Kids & Teens', ageGroup: 'menor', guardianConsent: 'pendiente', source: 'Recepción', submittedAt: '2026-10-16', message: 'Solicitud enviada por su madre desde recepción.', status: 'pendiente' },
  { id: 'CAI-0140', name: 'Daniela Fuentes', program: 'Business English', ageGroup: 'adulto', source: 'Referido', submittedAt: '2026-10-15', message: 'Me recomendó una compañera del grupo de los sábados.', status: 'pendiente' },
  { id: 'CAI-0139', name: 'Emilio Navarro', program: 'Cambridge B2 First', ageGroup: 'menor', guardianConsent: 'recibida', source: 'Formulario web', submittedAt: '2026-10-14', message: 'Quiero ver las experiencias de otros alumnos antes del examen.', status: 'pendiente' },
  { id: 'CAI-0138', name: 'Renata Ortega', program: 'Inglés general B1', ageGroup: 'adulto', source: 'Formulario web', submittedAt: '2026-10-13', message: 'Me interesa participar en los retos de conversación.', status: 'pendiente' },
  { id: 'CAI-0137', name: 'Sebastián Lara', program: 'Inglés general A2', ageGroup: 'adulto', source: 'Recepción', submittedAt: '2026-10-12', message: 'Alumno nuevo del grupo matutino.', status: 'aprobada' },
  { id: 'CAI-0136', name: 'Ximena Paredes', program: 'Kids & Teens', ageGroup: 'menor', guardianConsent: 'recibida', source: 'Recepción', submittedAt: '2026-10-11', message: 'Autorización firmada por su tutor en recepción.', status: 'aprobada' },
  { id: 'CAI-0135', name: 'Andrés Cabrera', program: 'Business English', ageGroup: 'adulto', source: 'Formulario web', submittedAt: '2026-10-10', message: 'No aparece inscrito en ningún grupo activo.', status: 'rechazada' },
  { id: 'CAI-0134', name: 'Lucía Montes', program: 'Preparación TOEFL', ageGroup: 'adulto', source: 'Referido', submittedAt: '2026-10-09', message: 'Exalumna; quiere compartir su resultado del examen.', status: 'aprobada' },
  { id: 'CAI-0133', name: 'Diego Ibarra', program: 'Inglés general B1', ageGroup: 'adulto', source: 'Formulario web', submittedAt: '2026-10-08', message: 'Grupo vespertino.', status: 'aprobada' },
]

/** Cifras base ficticias que se combinan con las decisiones tomadas en la demo. */
export const baseMetrics = {
  approvedThisMonth: 6,
}

export const sparklines = {
  pending: [3, 5, 4, 6, 5, 7, 4, 6, 8, 5, 7, 5],
  posts: [6, 4, 7, 5, 8, 6, 9, 7, 6, 8, 10, 9],
  students: [9, 10, 11, 12, 12, 13, 14, 15, 16, 17, 18, 19],
  approved: [2, 3, 1, 4, 3, 2, 5, 3, 4, 2, 3, 4],
}

export type Student = {
  id: string
  name: string
  program: string
  group: string
  ageGroup: AgeGroup
  guardianConsent?: GuardianConsent
  joinedAt: string
  posts: number
  visibility: 'privado' | 'comunidad'
}

/** Alumnos de muestra. Las solicitudes aprobadas se suman a este directorio. */
export const students: Student[] = [
  { id: 'AL-001', name: 'Camila Herrera', program: 'Preparación TOEFL', group: 'Lun y mié · 18:00', ageGroup: 'adulto', joinedAt: '2026-02-10', posts: 7, visibility: 'comunidad' },
  { id: 'AL-002', name: 'Joaquín Rivas', program: 'Business English', group: 'Mar y jue · 19:30', ageGroup: 'adulto', joinedAt: '2026-03-04', posts: 4, visibility: 'comunidad' },
  { id: 'AL-003', name: 'Sofía Méndez', program: 'Inglés general B1', group: 'Sábados · 9:00', ageGroup: 'adulto', joinedAt: '2026-01-22', posts: 9, visibility: 'comunidad' },
  { id: 'AL-004', name: 'Tomás Aguilar', program: 'Cambridge B2 First', group: 'Lun y mié · 17:00', ageGroup: 'menor', guardianConsent: 'recibida', joinedAt: '2026-02-18', posts: 5, visibility: 'privado' },
  { id: 'AL-005', name: 'Regina Castro', program: 'Inglés general B1', group: 'Sábados · 9:00', ageGroup: 'adulto', joinedAt: '2026-04-12', posts: 3, visibility: 'comunidad' },
  { id: 'AL-006', name: 'Iker Domínguez', program: 'Kids & Teens', group: 'Mar y jue · 16:00', ageGroup: 'menor', guardianConsent: 'recibida', joinedAt: '2026-05-06', posts: 2, visibility: 'privado' },
  { id: 'AL-007', name: 'Paula Vega', program: 'Business English', group: 'Mar y jue · 19:30', ageGroup: 'adulto', joinedAt: '2026-06-01', posts: 3, visibility: 'comunidad' },
  { id: 'AL-008', name: 'Santiago Peña', program: 'Inglés general A2', group: 'Lun y mié · 8:00', ageGroup: 'adulto', joinedAt: '2026-07-15', posts: 1, visibility: 'privado' },
  { id: 'AL-009', name: 'Natalia Cruz', program: 'Preparación TOEFL', group: 'Lun y mié · 18:00', ageGroup: 'adulto', joinedAt: '2026-03-27', posts: 6, visibility: 'comunidad' },
  { id: 'AL-010', name: 'Bruno Esquivel', program: 'Kids & Teens', group: 'Mar y jue · 16:00', ageGroup: 'menor', guardianConsent: 'recibida', joinedAt: '2026-05-20', posts: 1, visibility: 'privado' },
  { id: 'AL-011', name: 'Hugo Valdez', program: 'Inglés general A2', group: 'Lun y mié · 8:00', ageGroup: 'adulto', joinedAt: '2026-08-03', posts: 0, visibility: 'privado' },
  { id: 'AL-012', name: 'Mariana Solís', program: 'Cambridge B2 First', group: 'Sábados · 11:00', ageGroup: 'adulto', joinedAt: '2026-04-30', posts: 4, visibility: 'comunidad' },
  { id: 'AL-013', name: 'Fernanda Rojas', program: 'Kids & Teens', group: 'Sábados · 11:00', ageGroup: 'menor', guardianConsent: 'recibida', joinedAt: '2026-09-02', posts: 1, visibility: 'privado' },
  { id: 'AL-014', name: 'Alejandro Pineda', program: 'Business English', group: 'Viernes · 18:00', ageGroup: 'adulto', joinedAt: '2026-09-14', posts: 2, visibility: 'comunidad' },
  { id: 'AL-015', name: 'Isabela Duarte', program: 'Inglés general B1', group: 'Sábados · 9:00', ageGroup: 'menor', guardianConsent: 'recibida', joinedAt: '2026-09-21', posts: 0, visibility: 'privado' },
]

export const initiallySuspended = ['AL-011']

export type PostType = 'logro' | 'experiencia' | 'reseña' | 'evento'
export type PostStatus = 'pendiente' | 'publicada' | 'rechazada' | 'retirada'

export type Post = {
  id: string
  author: string
  authorIsMinor: boolean
  program: string
  type: PostType
  title: string
  body: string
  submittedAt: string
  status: PostStatus
  /** Imagen ilustrativa: el prototipo nunca muestra fotografías reales. */
  media?: { caption: string }
  /** Aspectos que el moderador debe comprobar antes de publicar. */
  checks?: string[]
  rejectReason?: string
}

export const postTypes: Record<PostType, { label: string; color: string; background: string }> = {
  logro: { label: 'Logro', color: '#1a44a8', background: '#e4ecff' },
  experiencia: { label: 'Experiencia', color: '#0b6d48', background: '#e6f6ee' },
  reseña: { label: 'Reseña', color: '#8a5a00', background: '#fff4d6' },
  evento: { label: 'Evento', color: '#5b3aa8', background: '#f1ebff' },
}

export const rejectReasons = [
  'Incluye datos personales (teléfono, dirección, escuela…)',
  'Aparecen personas sin autorización',
  'No está relacionado con la comunidad de CAI',
  'Lenguaje inapropiado',
]

export const posts: Post[] = [
  { id: 'PUB-031', author: 'Camila Herrera', authorIsMinor: false, program: 'Preparación TOEFL', type: 'logro', title: '¡Aprobé el TOEFL con 102 puntos!', body: 'Después de cuatro meses de práctica por fin lo logré. Gracias a mi grupo de los lunes por los simulacros de speaking.', submittedAt: '2026-10-16', status: 'pendiente', media: { caption: 'Captura del resultado (ilustrativa)' } },
  { id: 'PUB-030', author: 'Iker Domínguez', authorIsMinor: true, program: 'Kids & Teens', type: 'evento', title: 'Nuestra obra de teatro en inglés', body: 'Presentamos «The Lost Map» frente a nuestras familias. ¡Me tocó ser el capitán!', submittedAt: '2026-10-16', status: 'pendiente', media: { caption: 'Foto grupal del escenario (ilustrativa)' }, checks: ['Aparecen otros alumnos: verifica que todos tengan autorización de su tutor.'] },
  { id: 'PUB-029', author: 'Paula Vega', authorIsMinor: false, program: 'Business English', type: 'reseña', title: 'Lo que más me sirvió de Business English', body: 'Las simulaciones de juntas me dieron mucha seguridad. Ya dirijo mis llamadas semanales en inglés.', submittedAt: '2026-10-15', status: 'pendiente' },
  { id: 'PUB-028', author: 'Joaquín Rivas', authorIsMinor: false, program: 'Business English', type: 'experiencia', title: 'Mi primera presentación en inglés en el trabajo', body: 'Estaba nervioso, pero usé la estructura que practicamos en clase. Dejo el enlace a la plantilla que usé.', submittedAt: '2026-10-14', status: 'pendiente', checks: ['Incluye un enlace externo: revisa que sea seguro.'] },
  { id: 'PUB-027', author: 'Regina Castro', authorIsMinor: false, program: 'Inglés general B1', type: 'logro', title: 'Terminé el nivel B1', body: 'Un año entero de sábados por la mañana. Siguiente meta: B2.', submittedAt: '2026-10-13', status: 'pendiente', media: { caption: 'Constancia de nivel (ilustrativa)' } },
  { id: 'PUB-026', author: 'Sofía Méndez', authorIsMinor: false, program: 'Inglés general B1', type: 'experiencia', title: 'El club de conversación de los jueves', body: 'Hablamos de películas, viajes y comida. Es la hora más divertida de la semana.', submittedAt: '2026-10-10', status: 'publicada' },
  { id: 'PUB-025', author: 'Tomás Aguilar', authorIsMinor: true, program: 'Cambridge B2 First', type: 'logro', title: 'Cambridge B2 First: ¡aprobado!', body: 'Gracias a mis maestras por todos los ejercicios de writing.', submittedAt: '2026-10-08', status: 'publicada' },
  { id: 'PUB-024', author: 'Bruno Esquivel', authorIsMinor: true, program: 'Kids & Teens', type: 'reseña', title: 'Mi clase favorita', body: 'Me gustan los juegos de vocabulario. [Contenido retirado por incluir datos personales].', submittedAt: '2026-10-07', status: 'rechazada', rejectReason: 'Incluye datos personales (teléfono, dirección, escuela…)' },
  { id: 'PUB-023', author: 'Natalia Cruz', authorIsMinor: false, program: 'Preparación TOEFL', type: 'evento', title: 'Simulacro TOEFL del sábado', body: 'Más de 20 compañeros participamos. Los resultados salen el lunes.', submittedAt: '2026-10-05', status: 'publicada' },
]

export const adminTeam = [
  { name: 'Coordinación', role: 'Administración general', scope: 'Solicitudes, publicaciones y alumnos' },
  { name: 'Recepción', role: 'Solicitudes de ingreso', scope: 'Registrar autorizaciones de tutores' },
]

export const weeklyActivity = {
  labels: ['24 ago', '31 ago', '7 sep', '14 sep', '21 sep', '28 sep', '5 oct', '12 oct'],
  submitted: [12, 15, 11, 18, 22, 19, 25, 28],
  approved: [10, 12, 9, 15, 19, 16, 21, 23],
}
