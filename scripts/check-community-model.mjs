import assert from 'node:assert/strict'
import { createServer } from 'vite'

// Vite loads the existing TypeScript source without another test dependency.
// Middleware mode does not open an HTTP listener; watchers and HMR are disabled.
const server = await createServer({
  configFile: false,
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false, watch: null },
})

try {
  const { createInitialState, communityReducer, selectFeed, celebrationCount, DEMO_DATE } = await server.ssrLoadModule('/src/features/community/model.ts')
  const { seedPosts, pendingPosts, challenges } = await server.ssrLoadModule('/src/features/community/data/fixtures.ts')
  const { members } = await server.ssrLoadModule('/src/features/community/data/members.ts')
  const originalFixtures = structuredClone([...seedPosts, ...pendingPosts])
  let checks = 0
  const check = (condition, message) => { assert.ok(condition, message); checks += 1 }
  let state = createInitialState()
  const send = (action) => { state = communityReducer(state, action) }
  const find = (id) => state.posts.find((post) => post.id === id)
  const initialFeed = selectFeed(state)

  check(initialFeed.length === 15 && pendingPosts.length === 2, '15 publicaciones visibles y dos pendientes')
  assert.deepEqual(initialFeed.slice(0, 2).map((post) => post.id), ['welcome', 'weekly-note'])
  check(initialFeed.slice(2).every((post, index, posts) => !index || Date.parse(posts[index - 1].createdAt) >= Date.parse(post.createdAt)), 'Orden cronológico descendente')
  check(initialFeed.filter((post) => post.comments.length >= 3 && post.comments.length <= 6).length === 7, 'Siete conversaciones con 3–6 comentarios')
  check(state.posts.every((post) => members.some((member) => member.id === post.authorId) && post.comments.every((comment) => members.some((member) => member.id === comment.authorId))), 'Autores y comentarios con perfiles consistentes')
  check(initialFeed.every((post) => Date.parse(post.createdAt) <= Date.parse(DEMO_DATE) && post.comments.every((comment) => Date.parse(comment.createdAt) >= Date.parse(post.createdAt) && Date.parse(comment.createdAt) <= Date.parse(DEMO_DATE))), 'Comentarios posteriores a sus publicaciones y anteriores al cierre del escenario')

  send({ type: 'filter', filter: 'achievements' })
  check(selectFeed(state).length === 3 && selectFeed(state).every((post) => post.category === 'achievement'), 'Filtro de logros')
  send({ type: 'filter', filter: 'experiences' })
  check(selectFeed(state).length === 4 && selectFeed(state).every((post) => post.category === 'experience'), 'Filtro de experiencias')
  send({ type: 'section', section: 'gallery' })
  check(selectFeed(state).length === 6 && selectFeed(state).every((post) => post.photos.length > 0), 'Galería incluye las publicaciones con imágenes')
  send({ type: 'section', section: 'home' })

  const original = structuredClone(find('luna-conversation'))
  send({ type: 'react', postId: original.id, reaction: 'love' })
  check(find(original.id).reactions.love === original.reactions.love + 1, 'Añadir reacción')
  send({ type: 'react', postId: original.id, reaction: 'wellDone' })
  check(find(original.id).reactions.love === original.reactions.love && find(original.id).reactions.wellDone === original.reactions.wellDone + 1, 'Cambiar reacción retira la anterior')
  send({ type: 'react', postId: original.id, reaction: 'wellDone' })
  assert.deepEqual(find(original.id).reactions, original.reactions)
  check(communityReducer(state, { type: 'comment', postId: original.id, id: 'empty', body: '  ' }) === state, 'Rechazar comentario vacío')
  send({ type: 'comment', postId: original.id, id: 'comment-test', body: '  Una felicitación ficticia.  ' })
  check(find(original.id).comments.length === original.comments.length + 1 && find(original.id).comments.at(-1).body === 'Una felicitación ficticia.', 'Añadir comentario y limpiar espacios')

  const draft = { type: 'create', id: 'post-test', title: 'Un nuevo logro ficticio', body: 'Una experiencia ficticia que debe pasar por revisión.', category: 'achievement', photoIds: [] }
  check(communityReducer(state, { ...draft, title: ' ' }) === state, 'Rechazar título vacío')
  check(communityReducer(state, { ...draft, category: 'gallery' }) === state, 'Galería requiere imagen')
  send(draft)
  check(find(draft.id).status === 'pending' && !selectFeed(state).some((post) => post.id === draft.id), 'Pendiente fuera del feed')
  check(communityReducer(state, { type: 'moderate', postId: draft.id, decision: 'approved' }) === state, 'Controles de alumno no moderan en la simulación')
  send({ type: 'mode', mode: 'moderator' })
  send({ type: 'moderate', postId: draft.id, decision: 'approved' })
  check(selectFeed(state)[2].id === draft.id, 'Aprobada después de los fijados y antes de publicaciones más antiguas')
  send({ type: 'moderate', postId: 'pending-note', decision: 'rejected' })
  check(find('pending-note').status === 'rejected' && !selectFeed(state).some((post) => post.id === 'pending-note'), 'Rechazada fuera del feed')
  send({ type: 'pin', postId: original.id })
  check(find(original.id).pinOrder === null, 'Solo los avisos de CAI pueden fijarse')
  send({ type: 'pin', postId: 'cai-care' })
  send({ ...draft, id: 'fourth-notice', category: 'announcement' })
  send({ type: 'moderate', postId: 'fourth-notice', decision: 'approved' })
  send({ type: 'pin', postId: 'fourth-notice' })
  check(state.posts.filter((post) => post.pinOrder !== null).length === 3 && find('fourth-notice').pinOrder === null, 'Máximo tres avisos fijados')
  send({ type: 'pin', postId: 'welcome' })
  check(selectFeed(state).at(-1).id === 'welcome', 'Desfijar devuelve el aviso a su posición cronológica')
  send({ type: 'filter', filter: 'celebrated' })
  const celebrated = selectFeed(state).filter((post) => post.pinOrder === null)
  check(celebrated.every((post, index, posts) => !index || celebrationCount(posts[index - 1]) >= celebrationCount(post)), 'Más celebradas por total de reacciones')

  check(challenges.length === 5, 'Cinco días de muestra con un reto compartido por día')
  check(communityReducer(state, { type: 'answer', challengeId: 'day-1', answerIndex: 99 }) === state, 'Opción fuera de rango rechazada')
  send({ type: 'answer', challengeId: 'day-1', answerIndex: 0 })
  check(state.attempts['day-1'].correct && state.attempts['day-1'].points === 15, 'Acierto: 5 por participar y 10 por acertar')
  check(communityReducer(state, { type: 'answer', challengeId: 'day-1', answerIndex: 1 }) === state, 'Un único intento puntuado por día')
  send({ type: 'answer', challengeId: 'day-2', answerIndex: 0 })
  check(!state.attempts['day-2'].correct && state.attempts['day-2'].points === 5, 'Error: puntos de participación sin penalización')
  send({ type: 'answer', challengeId: 'day-3', answerIndex: 0 })
  check(Object.keys(state.attempts).length === 3 && Object.values(state.attempts).reduce((sum, attempt) => sum + attempt.points, 0) === 35, 'Tres participaciones y 35 puntos de muestra')
  send({ type: 'reset' })
  check(selectFeed(state).length === 15 && state.posts.filter((post) => post.status === 'pending').length === 2 && state.mode === 'student' && state.challengeId === 'day-1' && Object.keys(state.attempts).length === 0 && state.resetKey === 1, 'Reinicio completo de la demo')
  assert.deepEqual(state.posts, originalFixtures)
  assert.deepEqual([...seedPosts, ...pendingPosts], originalFixtures)
  console.log(`Comunidad: ${checks} comprobaciones y 4 comparaciones de igualdad correctas.`)
} finally {
  await server.close()
}
