import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { galleryRepository } from './gallery.ts'
import type { GalleryUpload } from './contracts.ts'
import { HttpError, record } from './validation.ts'

const catalog = [
  ['cumpleanos-en-grupo', 'Cumpleaños en grupo', 'Un recuerdo compartido alrededor de la mesa.', 'Grupo de personas junto a un pastel y cajas de pizza en el aula.', 'events'],
  ['momento-de-celebracion', 'Un momento para celebrar', 'Una celebración de cumpleaños en el espacio de CAI.', 'Persona sentada frente a un pastel azul con una vela encendida.', 'events'],
  ['convivencia-pizza', 'Convivencia con pizza', 'Un momento de convivencia alrededor de la mesa del aula.', 'Personas alrededor de una mesa con pizza y pastel.', 'activities'],
  ['celebracion-compartida', 'Una celebración compartida', 'Una fotografía de grupo para recordar una celebración.', 'Grupo de personas reunidas alrededor de un pastel en el aula.', 'events'],
  ['mesa-de-convivencia', 'La mesa de convivencia', 'Un encuentro con pizza, materiales y las tazas de CAI.', 'Mesa con dos pizzas y tazas de CAI, con una persona al fondo.', 'backstage'],
  ['recuerdo-de-cumpleanos', 'Un recuerdo de cumpleaños', 'Un cumpleaños compartido con la comunidad de CAI.', 'Dos personas junto a una mesa con pastel, botanas y vasos.', 'events'],
] as const
export const officialMediaFiles = catalog.map(([name]) => `${name}.jpg`)

/** Solo rutas fijas del catálogo; nunca aceptar nombres de archivo del cliente. */
export async function importOfficialMedia(gallery: ReturnType<typeof galleryRepository>, value: unknown, actor: () => number | null, directory: string | undefined) {
  const data = record(value)
  if (Object.keys(data).some(key => key !== 'confirmed') || data.confirmed !== true) throw new HttpError(400, 'Confirma la carga para todos los alumnos aprobados.')
  if (!actor()) throw new HttpError(401, 'Vuelve a entrar a administración.')
  if (!directory) throw new HttpError(503, 'El material oficial privado todavía no está instalado. Consulta la guía de entrega de CAI.')
  const before = new Set(gallery.list().map(item => item.id))
  let added = 0, retained = 0
  for (const [name, title, description, alt, category] of catalog) {
    const bytes = await readFile(join(directory, `${name}.jpg`)).catch(() => { throw new HttpError(503, 'No pudimos leer el material oficial privado. Consulta la guía de entrega y vuelve a intentar; no se duplicarán fotos.') })
    const draft: GalleryUpload = { title, description, alt, category, audience: 'community', program: '', group: '', authorizationReference: 'Material oficial y alcance autorizados por responsable de CAI el 19-11-2026.', confirmed: true, imageBase64: bytes.toString('base64') }
    const item = await gallery.create(draft, `cai-official-media-v1-${name}`, actor)
    if (before.has(item.id)) retained++
    else added++
  }
  return { added, retained }
}
