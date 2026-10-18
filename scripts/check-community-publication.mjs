import assert from 'node:assert/strict'
import { createServer } from 'vite'

// Uses the project's existing TS loader. No HTTP listener, HMR or new dependencies.
const server = await createServer({
  configFile: false, appType: 'custom', logLevel: 'error',
  server: { middlewareMode: true, hmr: false, watch: null },
})

try {
  const { validatePublication, publicationLimits } = await server.ssrLoadModule('/src/features/community/publicationValidation.ts')
  const { createInitialState, communityReducer, selectFeed } = await server.ssrLoadModule('/src/features/community/model.ts')
  let checks = 0
  const check = (condition, message) => { assert.ok(condition, message); checks += 1 }
  const valid = { title: 'Paso', body: 'Un intento', category: 'experience', photoIds: [] }
  const errors = (changes) => validatePublication({ ...valid, ...changes })

  check(!Object.keys(errors({})).length, 'Mínimos exactos: título de 4 e historia de 10')
  check(Boolean(errors({ title: 'abc' }).title), 'Título de 3 rechazado')
  check(Boolean(errors({ body: '123456789' }).body), 'Historia de 9 rechazada')
  check(Boolean(errors({ title: '    ', body: '          ' }).title) && Boolean(errors({ body: '          ' }).body), 'Espacios no cuentan para los mínimos')
  check(!Object.keys(errors({ title: ' Paso ', body: ' Un intento ' })).length, 'Espacios exteriores se ignoran al validar')
  check(!Object.keys(errors({ title: 't'.repeat(100), body: 'h'.repeat(1200) })).length, 'Máximos exactos aceptados')
  check(Boolean(errors({ title: 't'.repeat(101) }).title), 'Título superior al máximo rechazado')
  check(Boolean(errors({ body: 'h'.repeat(1201) }).body), 'Historia superior al máximo rechazada')

  const draft = { ...valid, title: '', body: '' }
  check(Boolean(validatePublication(draft).title) && Boolean(validatePublication(draft).body), 'Primer envío vacío: ambos errores')
  draft.title = 'Un pequeño paso para revisar Inicio'
  check(!validatePublication(draft).title && Boolean(validatePublication(draft).body), 'Corregir título elimina solo su error')
  draft.body = 'Publicación completamente ficticia para probar la aprobación después del rediseño.'
  check(draft.body.length === 82 && !Object.keys(validatePublication(draft)).length, 'Regresión: 35/82 caracteres no conservan errores obsoletos')
  draft.title = 'abc'
  check(Boolean(validatePublication(draft).title) && !validatePublication(draft).body, 'Volver a un título inválido recupera su error')
  draft.title = valid.title
  draft.category = 'gallery'
  check(Boolean(validatePublication(draft).photos), 'Galería sin imágenes muestra error')
  draft.photoIds = ['books']
  check(!validatePublication(draft).photos, 'Seleccionar imagen elimina el error')
  draft.photoIds = []
  check(Boolean(validatePublication(draft).photos), 'Retirar última imagen recupera error')
  draft.category = 'experience'
  check(!validatePublication(draft).photos, 'Cambiar a categoría sin imágenes obligatorias elimina error')

  const initial = createInitialState()
  for (const changes of [{ title: 'abc' }, { body: '123456789' }, { title: 't'.repeat(101) }, { body: 'h'.repeat(1201) }, { category: 'gallery' }]) {
    const input = { ...valid, ...changes }
    check(Object.keys(validatePublication(input)).length > 0 && communityReducer(initial, { type: 'create', id: 'validation-test', ...input }) === initial, 'Formulario y reducer rechazan los mismos valores fuera de límites')
  }
  const sent = communityReducer(initial, { type: 'create', id: 'validation-test', ...valid })
  check(sent.posts[0].status === 'pending' && !selectFeed(sent).some((post) => post.id === 'validation-test'), 'Envío válido pendiente y fuera del feed')
  check(publicationLimits.titleMax === 100 && publicationLimits.bodyMax === 1200, 'Límites existentes conservados')
  console.log(`Publicaciones: ${checks} comprobaciones correctas.`)
} finally {
  await server.close()
}
