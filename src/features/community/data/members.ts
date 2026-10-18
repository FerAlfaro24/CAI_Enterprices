import type { Member } from '../types'

/** Aliases y perfiles inventados. No representan a alumnos ni personal real. */
export const members: Member[] = [
  { id: 'cai', alias: 'Equipo CAI', initials: 'CAI', color: 'blue', institution: true, joinedAt: '2026-09-21', badge: 'Equipo de la comunidad', bio: 'Acompañamos tus pequeños y grandes pasos. Perfil institucional de demostración.' },
  { id: 'alex', alias: 'Alex Demo', initials: 'AD', color: 'blue', joinedAt: '2026-10-12', badge: 'Explorador curioso', bio: 'Aprendiendo a contar mis historias en otro idioma. Este es tu perfil ficticio para probar la comunidad.' },
  { id: 'luna', alias: 'Luna Azul', initials: 'LA', color: 'purple', joinedAt: '2026-09-22', badge: 'Se animó a conversar', bio: 'De las canciones a las conversaciones, una palabra a la vez.' },
  { id: 'nico', alias: 'Nico Norte', initials: 'NN', color: 'green', joinedAt: '2026-09-23', badge: 'Buen compañero', bio: 'Me gustan los mapas, el café y preguntar sin miedo.' },
  { id: 'vale', alias: 'Vale Vocab', initials: 'VV', color: 'rose', joinedAt: '2026-09-25', badge: 'Coleccionista de palabras', bio: 'Una libreta, un montón de post-its y nuevas palabras cada semana.' },
  { id: 'teo', alias: 'Teo Talks', initials: 'TT', color: 'amber', joinedAt: '2026-09-26', badge: 'Una semana participando', bio: 'Ensayando conversaciones para mi próximo viaje imaginario.' },
  { id: 'rio', alias: 'Río Curioso', initials: 'RC', color: 'green', joinedAt: '2026-09-28', badge: 'Pregunta que inspira', bio: 'Los errores también son una buena historia para compartir.' },
  { id: 'mara', alias: 'Mara Maple', initials: 'MM', color: 'purple', joinedAt: '2026-10-01', badge: 'Primer reto completado', bio: 'Mis favoritas son las palabras que suenan como lo que significan.' },
  { id: 'leo', alias: 'Leo Lingo', initials: 'LL', color: 'blue', joinedAt: '2026-10-04', badge: 'Pequeños pasos constantes', bio: 'Practicando un poquito cada día, incluso cuando cuesta.' },
  { id: 'sam', alias: 'Sam Stories', initials: 'SS', color: 'rose', joinedAt: '2026-10-14', badge: 'Nueva voz', bio: 'Quiero aprender a recomendar mis libros favoritos en inglés.' },
  { id: 'dani', alias: 'Dani Notes', initials: 'DN', color: 'amber', joinedAt: '2026-10-16', badge: 'Primera conversación', bio: 'Mi playlist también es mi cuaderno de práctica.' },
  { id: 'iris', alias: 'Iris Ideas', initials: 'II', color: 'purple', joinedAt: '2026-10-17', badge: '¡Bienvenida!', bio: 'Aquí para aprender, compartir y celebrar el intento.' },
]

export const demoMember = members.find((member) => member.id === 'alex')!

export function getMember(id: string): Member {
  return members.find((member) => member.id === id) ?? demoMember
}
