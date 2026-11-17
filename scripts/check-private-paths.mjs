import assert from 'node:assert/strict'
import { resolve, relative } from 'node:path'
import { stat } from 'node:fs/promises'

const base = process.env.CAI_TEST_URL ?? 'http://127.0.0.1:5173'
let paths
if (process.env.CAI_TEST_FIXTURE_DIR) {
  const directory = resolve(process.env.CAI_TEST_FIXTURE_DIR)
  const local = relative(process.cwd(), directory).replaceAll('\\', '/')
  assert.ok(local.startsWith('.local/tests/') && !local.split('/').includes('..'), 'Usa una fixture nueva dentro de .local/tests.')
  // Las rutas ausentes pueden devolver el HTML de navegación. Verificar archivos
  // ficticios existentes, sin crear ni abrir la base o el acceso habituales.
  for (const name of ['fixture.sqlite', 'browser.json']) assert.ok((await stat(resolve(directory, name))).isFile(), `Falta ${name} en la fixture.`)
  const metadata = '/' + local + '/browser.json'
  paths = ['/' + local + '/fixture.sqlite', metadata, metadata.replace('/.local/', '/.LOCAL/'), metadata.replace('/.local/', '/%2elocal/'), metadata + '?raw', (await stat('.git')).isFile() ? '/.git' : '/.git/config', '/@fs/' + resolve(directory, 'fixture.sqlite').replaceAll('\\', '/')]
} else {
  paths = ['/.local/cai.sqlite','/.local/acceso-inicial.txt','/.LOCAL/acceso-inicial.txt','/%2elocal/acceso-inicial.txt','/.local/acceso-inicial.txt?raw','/.git/config', '/@fs/' + resolve('.local/cai.sqlite').replaceAll('\\','/')]
}
paths.push('/server/challenge-bank.ts','/server/challenge-bank.ts?raw','/SERVER/CHALLENGE-BANK.TS','/%73erver/challenge-bank.ts','/server/challenges.ts','/@fs/'+resolve('server/challenge-bank.ts').replaceAll('\\','/'))
for (const path of paths) {
  // HEAD y sin cookies: nunca descargar una base o credenciales para comprobar el bloqueo.
  const response = await fetch(new URL(path,base), { method:'HEAD',signal:AbortSignal.timeout(10_000) })
  assert.equal(response.status,403,`Archivo privado sin bloqueo: ${path}`)
}
console.log(`${paths.length} rutas privadas bloqueadas sin sesión.`)
