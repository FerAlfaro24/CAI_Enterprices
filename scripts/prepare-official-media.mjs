import sharp from 'sharp'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Preparación determinista: recorta la interfaz de Instagram sin retocar personas.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = process.argv[2]
if (!source) throw Error('Indica la carpeta local con CAI-02.jpeg, CAI-08.jpeg, etc. Los originales no se publican.')
const originals = JSON.parse(await readFile(resolve(source, 'manifest.json'), 'utf8'))
const selections = [
  { id: 'CAI-17', name: 'materiales', audience: 'public', crop: [0, 148, 1080, 1080] },
  { id: 'CAI-09', name: 'aula', audience: 'public', crop: [0, 420, 1080, 720] },
  { id: 'CAI-08', name: 'practica-online', audience: 'public', crop: [0, 460, 972, 720] },
  { id: 'CAI-02', name: 'actividad-aula', audience: 'public', crop: [0, 142, 1080, 950] },
  { id: 'CAI-12', name: 'cumpleanos-en-grupo', audience: 'community', crop: [0, 0, 1080, 950] },
  { id: 'CAI-14', name: 'momento-de-celebracion', audience: 'community', crop: [0, 162, 738, 765] },
  { id: 'CAI-16', name: 'convivencia-pizza', audience: 'community', crop: [0, 400, 1080, 550] },
  { id: 'CAI-25', name: 'celebracion-compartida', audience: 'community', crop: [0, 280, 1080, 670] },
  { id: 'CAI-26', name: 'mesa-de-convivencia', audience: 'community', crop: [0, 0, 1080, 1073] },
  { id: 'CAI-27', name: 'recuerdo-de-cumpleanos', audience: 'community', crop: [0, 130, 1080, 1080] },
]
const manifest = []
for (const item of selections) {
  const original = await readFile(resolve(source, `${item.id}.jpeg`))
  const [left, top, width, height] = item.crop
  const extension = item.audience === 'public' ? 'webp' : 'jpg'
  const folder = item.audience === 'public' ? 'src/assets/official' : '.local/official-media'
  const path = `${folder}/${item.name}.${extension}`
  const pipeline = sharp(original).extract({ left, top, width, height })
  const { data, info } = await (extension === 'webp' ? pipeline.webp({ quality: 85 }) : pipeline.jpeg({ quality: 90, mozjpeg: true })).toBuffer({ resolveWithObject: true })
  await mkdir(resolve(root, folder), { recursive: true })
  await writeFile(resolve(root, path), data)
  const provenance = originals.find(entry => entry.id === item.id)
  manifest.push({ ...item, path, sourceFile: provenance.archivoOriginal, sourceArchive: provenance.zip, sourceSha256: createHash('sha256').update(original).digest('hex'), sha256: createHash('sha256').update(data).digest('hex'), width: info.width, height: info.height, bytes: info.size })
}
await writeFile(resolve(root, 'docs/official-media-manifest.json'), JSON.stringify({ source: 'Material oficial facilitado por CAI, lotes WhatsApp 2026-11-17', authorized: '2026-11-19: público y comunidad; comunidad para todos los alumnos aprobados', images: manifest }, null, 2) + '\n')
console.log(JSON.stringify(manifest.map(({ id, path, bytes }) => ({ id, path, bytes }))))
