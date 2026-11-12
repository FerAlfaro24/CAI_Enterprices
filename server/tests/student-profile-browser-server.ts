/** Fixture ficticia independiente; nunca abre la base habitual. */
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { studentAccounts } from '../student-accounts.ts'
import { publications } from '../publications.ts'
import { validateSubmission } from '../validation.ts'

if (process.env.NODE_ENV === 'production') throw new Error('Solo pruebas locales ficticias.')
const port = Number(process.env.CAI_API_PORT ?? 3101)
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Puerto no válido.')
const root = resolve('.local/tests'); await mkdir(root, { recursive: true })
const directory = await mkdtemp(join(root, 'profile-browser-')), tag = randomUUID().slice(0, 8)
const app = createApplication(join(directory, 'fixture.sqlite')), hash = await hashPassword('Frase ficticia de perfil para navegador 2026')
const admin = Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('fixture@example.test','Prueba perfil',?,'admin')").run(hash).lastInsertRowid)
const repo = accessRepository(app.db), accounts = studentAccounts(app.db), posts = publications(app.db)
const fixtures: Record<string, Record<string, {email: string; displayName: string}>> = {}
for (const browser of ['brave', 'opera']) {
  fixtures[browser] = {}
  for (const kind of ['adult', 'minor', 'peer']) {
    const email = `${browser}-${kind}-profile@example.test`, displayName = kind === 'minor' ? 'Alumno F.' : `Prueba ${browser} ${kind} ${tag}`
    const receipt = repo.submit(validateSubmission({ firstName: 'Alumno', lastName: 'Ficticio', birthDate: kind === 'minor' ? `${new Date().getFullYear() - 15}-01-01` : '2000-01-01', email, filledBy: 'alumno', displayName, avatarColor: '#1f56d6', visibility: 'privado', program: 'Business English', group: 'Mar y jue · 19:30', message: '', guardianConsent: kind === 'minor', ...(kind === 'minor' ? {guardian:{name:'Tutor Ficticio',relationship:'Tutor',contact:'tutor@example.test'}} : {}), acceptRules: true, acceptPrivacy: true }), randomUUID())
    if (kind === 'minor') repo.decide(receipt.id, 1, 'consent', admin, 'Referencia ficticia de prueba')
    repo.decide(receipt.id, kind === 'minor' ? 2 : 1, 'approve', admin)
    app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)), hash, new Date().toISOString())
    if (kind === 'adult') {
      const user = await accounts.login(email, 'Frase ficticia de perfil para navegador 2026')
      const post = posts.create(user!, {title:`Historia ficticia ${browser}`,body:'Historia ficticia del perfil para comprobar alias y avatar.',category:'experience'}, randomUUID())
      posts.decide(post.id, post.revision, 'approve', admin, undefined, true)
    }
    fixtures[browser]![kind] = {email,displayName}
  }
}
await writeFile(join(directory, 'browser.json'), JSON.stringify({fixtures,port}, null, 2), {flag:'wx'})
app.server.listen(port, '127.0.0.1', () => console.log(`API aislada de perfiles lista en ${port}. Metadatos: ${join(directory,'browser.json')}`))
process.on('SIGINT', () => app.server.close(() => process.exit(0)))
