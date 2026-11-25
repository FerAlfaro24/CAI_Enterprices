import beatles from '../../assets/presentation/beatles.webp'
import matilda from '../../assets/presentation/matilda.webp'
import aula from '../../assets/official/aula.webp'
import online from '../../assets/official/practica-online.webp'
import materiales from '../../assets/official/materiales.webp'
import actividad from '../../assets/official/actividad-aula.webp'
import type { CommentPage, GalleryItem, GalleryReview, GroupMember, PublishedPost, PublicComment, ReviewPost } from '../../../server/contracts'
import type { PresentationStore } from './store'
import initial from './seed.json'

const editions = [
  { id: 'PUB-0012', title: 'Mi logro de hoy tiene soundtrack ☀️', category: 'achievement', body: 'Hoy practiqué listening con Here Comes the Sun, de The Beatles. Primero escuché sin leer y después repetí algunas partes. Ya reconozco winter (invierno) y sun (sol) sin traducir todo. ¡Esta sí se queda en mi playlist! 🎧 ¿Qué canción les ha ayudado a ustedes?', image: beatles, alt: 'Portada de Abbey Road: The Beatles cruzan el paso de peatones.', comments: ['¡La puse y pude reconocer winter! Escucharla dos veces sí cambia todo ☀️', 'Yo practico con Count on Me, de Bruno Mars. ¡Podemos armar una playlist entre todos!'] },
  { id: 'PUB-0011', title: 'Friends, pausa y… ¡ahora sí entendí! 📺', category: 'achievement', body: 'Me puse una meta pequeña: entender una escena de Friends sin subtítulos en español. Primero la vi con subtítulos en inglés y después repetí el diálogo en voz alta. Todavía pauso mucho, pero hoy entendí una broma sin traducirla. Se sintió increíble 😂', image: online, alt: 'Práctica de inglés en línea; imagen ilustrativa del aprendizaje desde casa.', comments: ['¡Entender una broma es otro nivel! 😂 Yo todavía regreso la escena tres veces.', 'Probaré con una escena cortita. Un episodio completo me abruma un poco.'] },
  { id: 'PUB-0010', title: 'Un capítulo de Matilda y dos palabras nuevas 📖', category: 'achievement', body: 'Empecé Matilda, de Roald Dahl, en inglés. Hoy terminé un capítulo sin buscar cada palabra: primero intenté entender qué estaba pasando. Anoté clever (inteligente) y kind (amable), e inventé un ejemplo con cada una. Voy despacio, ¡pero ya quiero seguir leyendo! ¿Quién más está leyendo algo?', image: matilda, alt: 'Portada del libro Matilda, de Roald Dahl, ilustrado por Quentin Blake.', comments: ['¡Yo también lo estoy leyendo! Los dibujos ayudan mucho a entender la historia 📚', 'Me gusta tu idea de inventar ejemplos. Voy a probarla con mis palabras nuevas.'] },
  { id: 'PUB-0002', title: 'Así se vive una clase en CAI 💙', category: 'experience', body: 'Una libreta, muchas preguntas y ganas de intentarlo otra vez. Nos quedamos con esos momentos en los que alguien se anima a hablar y todo el grupo le echa porras. Aprender también es sentirse acompañado. ¿Qué fue lo mejor de tu última clase?', image: aula, alt: 'Aula de CAI preparada para aprender en grupo.', comments: ['Cuando por fin me salió mi presentación sin leer 🙌 Gracias por la paciencia.', '¡Las actividades en pareja! Me da menos pena equivocarme y volver a intentar.'] },
  { id: 'PUB-0008', title: 'Much o many: mi café ya tiene explicación ☕', category: 'achievement', body: 'Hoy me llevé la práctica a la cocina: many cups, much coffee. Pensar en tazas que puedo contar y en el café que contienen me ayudó más que memorizar la regla. Después hice cinco ejemplos con cosas de casa. ¡Ahora sí me hizo clic! ¿Con qué lo practicarían?', image: materiales, alt: 'Taza y materiales de CAI para acompañar una sesión de estudio.', comments: ['Many songs, much music 🎧 ¡Creo que ya lo entendí!', 'Many books, much time reading. Hasta en los comentarios estamos practicando 😄'] },
  { id: 'PUB-DEMO-OWN', title: 'Hoy me animé a hablar sin mis apuntes 🙌', category: 'achievement', body: 'Esta semana practiqué mi presentación un ratito cada día. Hoy pude contar qué me gusta hacer sin leer mis notas. Me trabé, respiré y seguí. Mi siguiente paso es hacerle una pregunta a alguien y mantener la conversación. ¡Pequeña victoria desbloqueada! ✨', image: actividad, alt: 'Actividad de práctica en el aula de CAI.', comments: ['¡Eso cuenta muchísimo! Yo también estoy intentando hablar aunque me equivoque 💪', 'La próxima practicamos juntos. Podemos empezar hablando de nuestras canciones favoritas.'] },
] as const

/** Actualiza solo ejemplos conocidos; conserva sesiones, actividad y publicaciones del visitante. */
export function improvePresentationContent(store: PresentationStore) {
  if ((store.contentRevision ?? 0) >= 2) return false
  const posts = (store.data['/posts'] as { posts: ReviewPost[] }).posts
  const original = (store.data['/student/posts'] as { posts: PublishedPost[] }).posts
  const members = (store.data['/student/group'] as { members: GroupMember[] }).members
  const gallery = (store.data['/gallery'] as { images: GalleryReview[] }).images
  const sources = initial as Record<string, unknown>
  const photo = (id: string, image: string, title: string, alt: string, createdAt: string): GalleryItem => ({ id, imagePath: image, title, alt, description: alt, category: 'activities', width: 800, height: 800, byteSize: 0, createdAt })
  for (const [index, edition] of editions.entries()) {
    const post = posts.find(item => item.id === edition.id)
    if (!post) continue
    const date = new Date(Date.now() - (5 + index * 9) * 60000).toISOString()
    Object.assign(post, { title: edition.title, body: edition.body, category: edition.category, audience: 'community', publishedAt: date })
    post.photos = [photo('DEMO-CONTENT-' + post.id, edition.image, edition.title, edition.alt, date)]
    if (post.id === 'PUB-0002') post.photos.push(photo('DEMO-CLASS-2', actividad, 'Practicamos juntos', 'Actividad en el aula de CAI.', date), photo('DEMO-CLASS-3', materiales, 'Cada intento cuenta', 'Taza y materiales de estudio de CAI.', date))
    const source = original.find(item => item.id === post.id)
    if (source) Object.assign(source, { title: post.title, body: post.body, category: post.category, photos: post.photos, publishedAt: date })
    for (const item of post.photos) {
      if (!gallery.some(existing => existing.id === item.id)) gallery.push({ ...item, linkedPostId: post.id, audience: 'community', program: '', group: '', authorizationReference: 'Imagen de referencia para presentación ficticia; fuentes en STATIC_PRESENTATION.', revision: 1, status: 'publicada' })
    }
    const path = '/student/posts/' + post.id + '/comments'
    const page = store.data[path] as CommentPage<PublicComment>
    const seeded = new Set(((sources[path] as CommentPage<PublicComment> | undefined)?.items ?? []).map(item => item.id))
    page.items = page.items.filter(item => !seeded.has(item.id) && !item.id.startsWith('DEMO-COM-'))
    page.items.unshift(...edition.comments.map((body, n) => ({ id: 'DEMO-CONTENT-COM-' + index + '-' + n, body, author: members.filter(member => member.id !== post.author.id)[(index + n) % (members.length - 1)]!, createdAt: new Date(Date.parse(date) + (n + 1) * 60000).toISOString() })))
  }
  const notices = [
    { id: 'PUB-0009', title: 'En tu próxima clase, trae algo que contar 💬', body: 'Piensa en una película, una canción o un libro que te guste. Prepara una presentación breve en inglés: qué elegiste y por qué lo recomiendas. Puedes apoyarte en una imagen o en tres palabras clave. No hace falta hablar perfecto: lo importante es animarte a participar.', image: aula, alt: 'Aula de CAI para practicar conversación en grupo.' },
    { id: 'PUB-0004', title: '¿Te atoraste? Llévate tu duda a clase ✏️', body: 'Anota una palabra, una pregunta de los retos o una frase que no hayas entendido y compártela con coordinación en tu próxima clase. Trae tu libreta y tus ganas de practicar: las dudas también nos ayudan a aprender juntos.', image: materiales, alt: 'Materiales de estudio y una taza de CAI.' },
  ]
  for (const [index, notice] of notices.entries()) {
    const post = posts.find(item => item.id === notice.id)
    if (!post) continue
    Object.assign(post, { title: notice.title, body: notice.body, publishedAt: new Date(Date.now() - (index + 1) * 60000).toISOString() })
    post.photos = [photo('DEMO-NOTICE-' + index, notice.image, notice.title, notice.alt, post.createdAt)]
    const source = original.find(item => item.id === post.id)
    if (source) Object.assign(source, { title: post.title, body: post.body, photos: post.photos, publishedAt: post.publishedAt })
  }
  // La colección institucional también se conserva coherente para administración.
  const institutional = (store.data['/institutional-posts'] as { posts: ReviewPost[] }).posts
  for (const post of institutional) { const updated = posts.find(item => item.id === post.id); if (updated) Object.assign(post, updated) }
  store.contentRevision = 2
  return true
}
