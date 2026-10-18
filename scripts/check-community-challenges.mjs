import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({
  configFile: false, appType: 'custom', logLevel: 'error',
  server: { middlewareMode: true, hmr: false, watch: null },
})

try {
  const { createInitialState, communityReducer } = await server.ssrLoadModule('/src/features/community/model.ts')
  const { selectChallengeProgress } = await server.ssrLoadModule('/src/features/community/challenges/progress.ts')
  const { challenges } = await server.ssrLoadModule('/src/features/community/data/fixtures.ts')
  let checks = 0
  const check = (value, message) => { assert.ok(value, message); checks += 1 }
  let state = createInitialState()
  const send = (action) => { state = communityReducer(state, action) }
  const progress = () => selectChallengeProgress(state)
  const day = (number) => send({ type: 'challengeDay', id: `day-${number}` })
  const answer = (number, correct = true) => {
    day(number)
    const quiz = challenges[number - 1]
    send({ type: 'answer', challengeId: quiz.id, answerIndex: correct ? quiz.correctIndex : (quiz.correctIndex + 1) % quiz.options.length })
  }

  check(progress().points === 0 && progress().answeredDays === 0 && progress().currentStreak === 0, 'Inicio sin respuestas ni puntos')
  check(progress().badges.every((badge) => !badge.earned), 'No se inventan insignias iniciales')
  day(3)
  check(state.challengeId === 'day-3' && progress().points === 0 && !Object.keys(state.attempts).length, 'Cambio de día no concede puntos ni crea intentos')
  const beforeInvalidDay = state
  send({ type: 'challengeDay', id: 'unknown' })
  check(state === beforeInvalidDay, 'Día no reconocido ignorado')
  answer(1)
  check(state.attempts['day-1'].correct && state.attempts['day-1'].points === 15, 'Acierto: cinco por participación más diez por acierto')
  check(state.notice === '¡Respuesta correcta! Sumaste 15 puntos ficticios.', 'Formulario compacto conserva su notificación global fuera de Retos')
  check(progress().points === 15 && progress().answeredDays === 1 && progress().currentStreak === 1, 'Primer día suma una sola vez en el selector')
  check(progress().badges.find((badge) => badge.id === 'first-answer').earned, 'Primera respuesta concede su insignia derivada')
  const oneAttempt = state
  send({ type: 'answer', challengeId: 'day-1', answerIndex: 1 })
  check(state === oneAttempt && progress().points === 15, 'Doble puntuación rechazada sin cambiar estado')
  send({ type: 'section', section: 'challenges' })
  const attempts = state.attempts
  send({ type: 'section', section: 'home' })
  check(state.attempts === attempts && progress().points === 15, 'Inicio conserva exactamente el registro compartido de Retos')
  send({ type: 'section', section: 'challenges' })
  check(state.attempts === attempts && state.attempts['day-1'].correct, 'Retos conserva el resultado al regresar desde Inicio')
  answer(2, false)
  check(!state.attempts['day-2'].correct && state.attempts['day-2'].points === 5 && progress().points === 20, 'Error da cinco puntos, sin penalización')
  check(state.notice === '', 'Retos delega el anuncio de error en la tarjeta de resultado')
  check(progress().currentStreak === 2, 'Responder incorrectamente también mantiene constancia')
  day(3)
  check(progress().currentStreak === 2 && progress().answeredDays === 2, 'Día seleccionado pendiente conserva la serie que termina ayer')
  answer(3)
  check(progress().currentStreak === 3 && progress().longestStreak === 3 && progress().points === 35, 'Tres días consecutivos y 35 puntos')
  check(state.notice === '', 'Retos delega el anuncio de acierto en la tarjeta de resultado')
  check(progress().badges.find((badge) => badge.id === 'three-consecutive').earned, 'Tres consecutivos conceden insignia de serie')
  day(1)
  check(progress().currentStreak === 1 && progress().longestStreak === 3, 'Volver a un día anterior cambia la serie al día, no la mejor serie')
  check(progress().badges.find((badge) => badge.id === 'three-consecutive').earned, 'La insignia derivada de mejor serie se conserva al cambiar día')
  day(5)
  check(progress().currentStreak === 0 && progress().longestStreak === 3, 'Un hueco en el día anterior corta la serie al día seleccionado')

  send({ type: 'reset' })
  for (const number of [1, 3, 5]) answer(number)
  check(progress().answeredDays === 3 && progress().currentStreak === 1 && progress().longestStreak === 1, 'Días 1, 3 y 5 son tres participaciones, no una racha de tres')
  check(!progress().badges.find((badge) => badge.id === 'three-consecutive').earned, 'Participación no consecutiva no concede la insignia de serie')
  send({ type: 'reset' })
  for (const number of [3, 1, 2]) answer(number)
  day(3)
  check(progress().currentStreak === 3 && progress().longestStreak === 3, 'Constancia depende del orden de días ficticios, no del orden de clics')
  answer(4, false)
  answer(5, false)
  check(progress().answeredDays === 5 && progress().currentStreak === 5 && progress().badges.every((badge) => badge.earned), 'Cinco días conceden comunidad, aunque haya errores')
  const stableAttempts = structuredClone(state.attempts)
  selectChallengeProgress(state)
  assert.deepEqual(state.attempts, stableAttempts)
  check(progress().points === 55, 'Tres aciertos y dos errores suman 55; selector sin mutación')
  send({ type: 'reset' })
  check(state.challengeId === 'day-1' && progress().answeredDays === 0 && progress().points === 0 && progress().longestStreak === 0 && progress().badges.every((badge) => !badge.earned), 'Reinicio borra respuestas, puntos, series e insignias derivadas')
  console.log(`Retos: ${checks} comprobaciones y una comparación de igualdad correctas.`)
} finally {
  await server.close()
}
