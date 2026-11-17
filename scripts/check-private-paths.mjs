import assert from 'node:assert/strict'
import { resolve } from 'node:path'

const base = process.env.CAI_TEST_URL ?? 'http://127.0.0.1:5173'
const paths = ['/.local/cai.sqlite','/.local/acceso-inicial.txt','/.LOCAL/acceso-inicial.txt','/%2elocal/acceso-inicial.txt','/.local/acceso-inicial.txt?raw','/.git/config', '/@fs/' + resolve('.local/cai.sqlite').replaceAll('\\','/')]
paths.push('/server/challenge-bank.ts','/server/challenge-bank.ts?raw','/SERVER/CHALLENGE-BANK.TS','/%73erver/challenge-bank.ts','/server/challenges.ts','/@fs/'+resolve('server/challenge-bank.ts').replaceAll('\\','/'))
for (const path of paths) {
  // HEAD y sin cookies: nunca descargar una base o credenciales para comprobar el bloqueo.
  const response = await fetch(new URL(path,base), { method:'HEAD',signal:AbortSignal.timeout(10_000) })
  assert.equal(response.status,403,`Archivo privado sin bloqueo: ${path}`)
}
console.log(`${paths.length} rutas privadas bloqueadas sin sesión.`)
