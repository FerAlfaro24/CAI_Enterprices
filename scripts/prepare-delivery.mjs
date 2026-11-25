import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstat, mkdir, mkdtemp, readFile, readdir, writeFile, copyFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const forbidden = /(^|\/)(?:\.git|\.local|node_modules|reference|tests|__tests__)(?:\/|$)|\.(?:sqlite(?:-wal|-shm)?|db|log|pem|key|pfx|p12)$/i
const files = []
const tracked = new Set(git('ls-files', '-z').split('\0').filter(Boolean))

async function list(path) {
  const absolute = join(root, path), metadata = await lstat(absolute)
  if (metadata.isSymbolicLink()) throw Error('El paquete no admite enlaces simbólicos.')
  if (forbidden.test(path) || /(^|\/)\.env(?:$|\.)/.test(path) && path !== '.env.example') return
  if (metadata.isDirectory()) {
    for (const name of (await readdir(absolute)).sort()) await list(path + '/' + name)
  } else if (metadata.isFile() && (path.startsWith('dist/') || tracked.has(path))) files.push(path)
}

async function main() {
  const [major, minor] = process.versions.node.split('.').map(Number)
  if (major !== 24 || minor < 12) throw Error('Usa Node 24 >=24.12.0 para preparar la entrega.')
  if (git('status', '--porcelain', '--untracked-files=normal')) throw Error('Guarda los cambios de la rama antes de preparar una entrega reproducible.')
  const sourceCommit = git('rev-parse', 'HEAD'), branch = git('branch', '--show-current')
  // Lista positiva: nunca recorrer la carpeta privada de datos ni copiar node_modules.
  for (const path of ['package.json', 'package-lock.json', '.env.example', 'dist', 'server', 'shared', 'src', 'deploy']) await list(path)
  if (files.some(path => /(^|\/)presentation(\/|$)|presentation-google/.test(path))) throw Error('La candidata no debe contener el modo de presentación.')
  const publicFiles = files.filter(path => path.startsWith('dist/'))
  if (!publicFiles.includes('dist/index.html')) throw Error('Primero genera el frontend conectado con npm run build.')
  for (const path of publicFiles.filter(path => /\.(?:html|js|json)$/.test(path))) {
    const text = await readFile(join(root, path), 'utf8')
    if (/cai-presentation-v1|data-cai-presentation|presentation-only|CaiDemo2026/.test(text)) throw Error('La compilación contiene datos de presentación; se canceló el empaquetado.')
  }
  const parent = join(root, '.local', 'delivery')
  await mkdir(parent, { recursive: true })
  // Destino nuevo y exclusivo: nunca reemplazar paquetes previos.
  const output = await mkdtemp(join(parent, sourceCommit.slice(0, 8) + '-'))
  const entries = []
  for (const path of files.sort()) {
    const source = join(root, path), destination = join(output, path)
    await mkdir(dirname(destination), { recursive: true })
    await copyFile(source, destination)
    const bytes = await readFile(destination)
    entries.push({ path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') })
  }
  const install = await readFile(join(root, 'docs', 'RELEASE_CANDIDATE.md'))
  await writeFile(join(output, 'INSTALL.md'), install)
  entries.push({ path: 'INSTALL.md', bytes: install.length, sha256: createHash('sha256').update(install).digest('hex') })
  const manifest = {
    format: 1, kind: 'connected-release-candidate', createdAt: new Date().toISOString(),
    sourceCommit, branch, node: process.versions.node, schema: 23,
    publicRoot: 'dist', privateRuntime: ['server', 'shared', 'src', 'node_modules'],
    dependencies: 'Ejecutar npm ci --omit=dev en el servidor y su arquitectura; no copiar node_modules de Windows.',
    containsDatabase: false, containsCredentials: false, deployed: false, files: entries,
  }
  await writeFile(join(output, 'DELIVERY_MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.info(JSON.stringify({ package: relative(root, output).replaceAll('\\', '/'), sourceCommit, files: entries.length, schema: 23, deployed: false }))
}

try { await main() } catch (error) { console.error(error instanceof Error ? error.message : 'No se pudo preparar el paquete.'); process.exitCode = 1 }
