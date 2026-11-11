import { spawn } from 'node:child_process'

const api = spawn(process.execPath, ['server/index.ts'], { stdio: 'inherit', windowsHide: true })
const web = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], { stdio: 'inherit', windowsHide: true })
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  api.kill()
  web.kill()
  process.exitCode = code
}
for (const child of [api, web]) {
  child.on('error', () => { console.error('No se pudo iniciar el entorno local.'); stop(1) })
  child.on('exit', (code) => stop(code ?? 1))
}
process.once('SIGINT', () => stop())
process.once('SIGTERM', () => stop())
