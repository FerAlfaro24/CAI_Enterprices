/** Contenido de la propuesta original. Ningún dato comercial está validado. */
export const commercialNotice =
  'Contenido comercial de muestra. Programas, resultados y condiciones pendientes de validación con CAI.'

const photo = (id: string, width: number, height?: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}${height ? `&h=${height}` : ''}&q=80`

/** Fotografías ilustrativas de stock, sin relación con alumnos de CAI. */
export const photos = {
  hero: photo('photo-1543269865-cbf427effbad', 1920),
  meeting: photo('photo-1531545514256-b1400bc00f31', 1000),
  business: photo('photo-1531545514256-b1400bc00f31', 800, 960),
  online: photo('photo-1516321318423-f06f85e504b3', 1000),
  books: photo('photo-1481627834876-b7833e8f5570', 700, 840),
}

export const portraits = [
  'photo-1494790108377-be9c29b29330',
  'photo-1507003211169-0a1dd7228f2d',
  'photo-1438761681033-6461ffad8d80',
].map((id) => ({ thumbnail: photo(id, 80, 80), image: photo(id, 600, 420) }))

export const certifications = ['TOEFL', 'Cambridge English', 'IELTS', 'MCER A1–C1', 'Business English']

export const statistics = [
  { value: 15, suffix: '+', label: 'años de trayectoria' },
  { value: 5000, suffix: '+', label: 'alumnos formados' },
  { value: 40, suffix: '+', label: 'empresas atendidas' },
  { value: 95, suffix: '%', label: 'aprobación en certificaciones' },
]

export const milestones = [
  { year: '2010', text: 'Primeras asesorías de inglés.' },
  { year: '2015', text: 'Programas para niños y adolescentes.' },
  { year: '2019', text: 'Capacitación de equipos de empresas.' },
  { year: '2026', text: 'Propuesta de una plataforma de cursos en línea.' },
]

export const services = [
  { icon: 'chat', title: 'Cursos regulares por niveles', text: 'De A1 a C1 con el Marco Común Europeo. Grupos reducidos y enfoque en conversación.' },
  { icon: 'award', title: 'Preparación de certificaciones', text: 'TOEFL, Cambridge e IELTS con simulacros y retroalimentación.' },
  { icon: 'briefcase', title: 'Inglés para empresas', text: 'Capacitación in-company con diagnóstico de nivel y reportes de avance.' },
  { icon: 'pencil', title: 'Asesorías personalizadas', text: 'Clases 1 a 1 y regularización escolar para reforzar justo lo que necesitas.' },
] as const

export const testimonials = [
  { name: 'Mariana G.', detail: 'Nivel B1 · Personaje ficticio', quote: 'Entré sin saber casi nada y en un año ya podía mantener conversaciones completas. Los maestros te hacen sentir en confianza desde el primer día.', portrait: portraits[0]!.image },
  { name: 'Carlos R.', detail: 'Preparación TOEFL · Personaje ficticio', quote: 'Gracias a la preparación de CAI aprobé el TOEFL con el puntaje que necesitaba para mi maestría. Los simulacros fueron clave.', portrait: portraits[1]!.image },
  { name: 'Sofía L.', detail: 'Programa empresarial · Personaje ficticio', quote: 'Mi equipo tomó el programa empresarial y ahora atendemos a clientes internacionales sin problema. Muy recomendable.', portrait: portraits[2]!.image },
]

export const programs = [
  { id: 'kids', title: 'English for Kids', audience: '6–12 años · Propuesta', image: photos.books, alt: 'Biblioteca con estanterías de libros; imagen ilustrativa sin alumnos' },
  { id: 'general', title: 'General English A1–C1', audience: 'Adolescentes y adultos · Propuesta', image: photos.meeting, alt: 'Reunión de trabajo entre adultos; fotografía ilustrativa' },
  { id: 'business', title: 'Business English', audience: 'Empresas · Propuesta', image: photos.business, alt: 'Equipo adulto en una reunión; fotografía ilustrativa' },
]

export const contactPrograms = [
  ...programs.map(({ id, title }) => ({ id, title })),
  { id: 'certifications', title: 'Certificaciones (TOEFL / Cambridge / IELTS)' },
  { id: 'tutoring', title: 'Asesoría personalizada' },
]

export const navigation = [
  { href: '#trayectoria', label: 'Trayectoria' },
  { href: '#alumnos', label: 'Alumnos' },
  { href: '#plataforma', label: 'Plataforma' },
]

export const faqs = [
  { question: '¿Necesito saber inglés para inscribirme?', answer: 'La propuesta contempla recibir alumnos desde cero y realizar un examen de ubicación para encontrar el nivel adecuado. El proceso definitivo debe confirmarse con CAI.' },
  { question: '¿Cómo funcionaría la clase muestra?', answer: 'Se propone conocer una clase y realizar un examen de ubicación antes de elegir un programa. La gratuidad, disponibilidad y condiciones están pendientes de confirmación. Este prototipo no reserva citas.' },
  { question: '¿Cuánto duraría cada nivel?', answer: 'La referencia propone entre 4 y 6 meses por nivel del Marco Común Europeo, dependiendo de la modalidad y frecuencia. Es una duración de muestra, no una oferta confirmada.' },
  { question: '¿Cuánto costarían los cursos?', answer: 'Las tarifas no están definidas para esta demostración. Se propone diferenciarlas por programa y modalidad, grupal o individual. CAI debe validar los precios y condiciones antes de publicarlos.' },
  { question: '¿Habría inscripción o materiales adicionales?', answer: 'La referencia contempla una inscripción y el libro de cada nivel por separado. Estos conceptos son provisionales y no representan un cobro ni una condición vigente.' },
  { question: '¿Qué formas de pago se contemplan?', answer: 'La propuesta incluye efectivo, tarjeta, transferencia y depósito, así como facturación para empresas. Su disponibilidad está por confirmar. No se reciben pagos en el prototipo.' },
  { question: '¿Habría descuentos o promociones?', answer: 'Se plantean descuentos por pago anticipado, familiares y grupos empresariales. No hay promociones confirmadas ni descuentos aplicables desde esta demostración.' },
  { question: '¿Cuántos alumnos habría por grupo?', answer: 'Se propone trabajar con grupos de hasta 10 alumnos y ofrecer asesorías individuales. El tamaño de los grupos y las modalidades requieren validación con CAI.' },
  { question: '¿Qué horarios se contemplan?', answer: 'La referencia plantea grupos entre semana y sabatinos. No se publican horarios como definitivos porque la disponibilidad debe confirmarse con el cliente.' },
  { question: '¿La comunidad es una plataforma de cursos?', answer: 'Son experiencias distintas. La comunidad demo muestra el espacio previsto para logros y publicaciones de alumnos. Los cursos con vídeos, ejercicios y clases en vivo son una propuesta futura; no están implementados ni comprometidos.' },
  { question: '¿Se entregaría una constancia?', answer: 'La propuesta contempla constancias de CAI al concluir un nivel y preparación para certificaciones internacionales. Su alcance y condiciones deben validarse; esta página no acredita afiliaciones con entidades certificadoras.' },
  { question: '¿Se ofrecería capacitación para empresas?', answer: 'Se plantea Business English con diagnóstico inicial y reportes de avance. Las sedes, modalidades, precios y disponibilidad están pendientes de confirmación.' },
]

export const footerGroups = [
  { title: 'Sobre CAI', links: [{ label: 'Nuestra historia', href: '#trayectoria' }, { label: 'Metodología', href: '#servicios' }, { label: 'Contacto', href: '#contacto' }] },
  { title: 'Programas', links: programs.map(({ title }) => ({ label: title, href: '#programas' })) },
  { title: 'Alumnos', links: [{ label: 'Testimonios de muestra', href: '#alumnos' }, { label: 'Comunidad demo', href: '/community' }, { label: 'Cursos: propuesta futura', href: '#plataforma' }] },
  { title: 'Recursos', links: [{ label: 'Preguntas frecuentes', href: '#faq' }, { label: 'Revisar el prototipo', href: '#contacto' }] },
]
