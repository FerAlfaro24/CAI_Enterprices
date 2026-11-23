import { seedAdminUsability } from './admin-usability-fixture.ts'
import { seedCommunityFeedback } from './community-feedback-fixture.ts'
import { publicProfileId } from '../public-profiles.ts'
/** Presentación al cliente: siempre crea una base nueva e independiente. Nunca inicia producción. */
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { createServer } from 'vite'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { validateSubmission } from '../validation.ts'
import { galleryRepository } from '../gallery.ts'
import { importOfficialMedia } from '../official-media.ts'
import { institutionalPosts } from '../institutional-posts.ts'
import { publications } from '../publications.ts'
import { commentsRepository } from '../comments.ts'
import type { StudentUser, InstitutionalDraft } from '../contracts.ts'

if(process.env.NODE_ENV==='production')throw Error('La presentación con ejemplos solo funciona en local.')
const port=Number(process.argv[2]??4187),apiPort=Number(process.argv[3]??3197)
if(![port,apiPort].every(p=>Number.isInteger(p)&&p>=1024&&p<=65535)||port===apiPort)throw Error('Puertos locales de presentación inválidos.')
const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'community-showcase-'))
const app=createApplication(join(directory,'fixture.sqlite'),{},{demonstration:true})
const password='Frase ficticia para fotos oficiales 2026',encoded=await hashPassword(password)
const admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación de demostración',?,'admin')").run(encoded).lastInsertRowid)
const profile={firstName:'Alumno',lastName:'Demostración',birthDate:'2000-01-01',filledBy:'alumno',program:'Business English',group:'Viernes · 18:00',displayName:'Alumno P.',avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}
const accounts: [string,string,string][]=[['bob','Alumno','Alumno P.'],['camila','Camila','Camila R.'],['diego','Diego','Diego M.'],['ana','Ana','Ana L.'],['valeria','Valeria','Valeria S.'],['mateo','Mateo','Mateo G.'],['sofia','Sofía','Sofía T.'],['luis','Luis','Luis P.'],['fernanda','Fernanda','Fernanda V.'],['alex','Alex','Alex C.'],['alice','Alicia','Alicia P.']]
const students:StudentUser[]=[]
for(const [name,firstName,displayName]of accounts){
  const group=name==='alice'?'Mar y jue · 19:30':profile.group
  const receipt=accessRepository(app.db).submit(validateSubmission({...profile,firstName,displayName,email:`${name}@example.test`,group}),randomUUID())
  accessRepository(app.db).decide(receipt.id,1,'approve',admin)
  app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),encoded,new Date().toISOString())
  const publicId=publicProfileId(app.db,Number(receipt.id.slice(4)))
  students.push({id:receipt.id,publicId:String(publicId),email:`${name}@example.test`,displayName,program:profile.program,group,avatarColor:profile.avatarColor,role:'student',name:`${firstName} Demostración`} as StudentUser)
}
app.db.exec('UPDATE community_controls SET reactions_open=1,comments_open=1')
const gallery=galleryRepository(app.db),official=institutionalPosts(app.db),posts=publications(app.db),comments=commentsRepository(app.db)
await importOfficialMedia(gallery,{confirmed:true},()=>admin,resolve('.local/official-media'))
const images=gallery.list()
const select=(...titles:string[])=>titles.map(title=>{const image=images.find(i=>i.title===title);if(!image)throw Error('Falta el material privado de la presentación.');return image.id})
const makeOfficial=(data:Partial<InstitutionalDraft>)=>{
  const value:InstitutionalDraft={title:'Una historia de CAI',body:'Un momento para compartir con nuestra comunidad.',kind:'story',audience:'community',program:'',group:'',imageIds:[],showInGallery:false,highlighted:false,expiresAt:null,confirmed:true,...data}
  const id=official.create(value,randomUUID(),admin)
  return `PUB-${String(id).padStart(4,'0')}`
}
const shared=[
  makeOfficial({title:'Aprender también es compartir',body:'Las conversaciones alrededor de una mesa también forman parte de nuestra comunidad. Reunimos algunos recuerdos de convivencias de CAI para volver a verlos juntos.',kind:'album',imageIds:select('Cumpleaños en grupo','Convivencia con pizza','La mesa de convivencia'),showInGallery:true,highlighted:true}),
  makeOfficial({title:'Celebramos en comunidad',body:'Un álbum de recuerdos de distintas celebraciones en CAI. Además del inglés, nos llevamos momentos para recordar. ¿Qué es lo que más disfrutas de compartir con tu grupo?',kind:'album',imageIds:select('Una celebración compartida','Un momento para celebrar','Un recuerdo de cumpleaños'),showInGallery:true,highlighted:true}),
  makeOfficial({title:'Una pequeña diferencia: say y tell',body:'Usamos say para expresar lo que alguien dice: “She said hello”. Con tell normalmente indicamos a quién: “She told me a story”. Prueba escribir tu propio ejemplo en los comentarios.'}),
  makeOfficial({title:'Bienvenidos a nuestro espacio CAI',body:'Aquí compartimos avances, preguntamos, practicamos y celebramos el camino. Las historias y los comentarios pasan por revisión para cuidar a nuestra comunidad. ¡Anímate a participar!',kind:'notice',highlighted:true,expiresAt:new Date(Date.now()+7*86400_000).toISOString()}),
]
const examples=[
  {author:1,title:'Hoy pude presentarme sin leer mis notas',body:'Practiqué mi presentación en voz alta durante unos minutos cada día. Hoy pude decir quién soy y qué me gusta hacer sin mirar mis apuntes. Todavía me pongo nerviosa, pero cada intento ayuda.',category:'achievement' as const},
  {author:2,title:'Mi truco para recordar do y does',body:'Me ayudó separar los sujetos: I, you, we y they van con do; he, she e it van con does. Estoy practicando preguntas cortas: “Do you like music?” y “Does she work here?”. ¿Qué truco usan ustedes?',category:'experience' as const},
  {author:3,title:'Una canción para practicar listening',body:'Esta semana escuché una canción primero sin letra y después leyendo. Anoté tres expresiones nuevas y volví a escucharla. Entendí un poco más la segunda vez. Mi siguiente meta es reconocerlas sin leer.',category:'experience' as const},
  {author:4,title:'Much y many: por fin me hizo clic',body:'Hoy repasé la diferencia: many para cosas que puedo contar, como books; much para cantidades que no cuento por unidades, como water. Me sirvió inventar ejemplos con lo que tenía en mi escritorio.',category:'achievement' as const},
]
for(const example of examples){const post=posts.create(students[example.author]!,{title:example.title,body:example.body,category:example.category},randomUUID());posts.decide(post.id,1,'approve',admin,undefined,true);shared.push(post.id)}
const replies=[
  ['¡Qué buenos recuerdos! Me gusta que tengamos un espacio para compartirlos.','La convivencia también ayuda a animarnos a conversar.','¡Que se sigan sumando momentos así!'],
  ['¡Muchas felicidades a quienes celebraron!','Me encanta que también compartamos estos momentos.','Un bonito recuerdo para la comunidad.'],
  ['Mi ejemplo: “He told me the answer”.','Yo practiqué: “They said goodbye”.','Me ayuda recordar que tell suele llevar a la persona.'],
  ['¡Hola a todos! Listos para seguir practicando.','Me gusta poder ver las historias del grupo.','¡Un paso pequeño cada día!'],
  ['¡Muy bien! Practicar en voz alta también me ayuda.','Yo empecé con tres frases y poco a poco fui agregando más.','¡A seguir! Cada intento cuenta.'],
  ['También sirve recordar que después de does el verbo vuelve a su forma base.','“Does he play football?” es uno de mis ejemplos.','Gracias por compartir el truco.'],
  ['Yo pruebo escuchar una frase y repetirla.','Volver a escuchar la misma parte me ayuda mucho.','¡Buena idea anotar solo unas expresiones por vez!'],
  ['“How many books?” y “How much water?” me ayudan a compararlos.','Escribir ejemplos con cosas de casa funciona muy bien.','¡Vamos reforzando esas pequeñas diferencias!'],
]
for(const [index,id]of shared.entries()){
  const officialPost=index<4
  for(const [n,student]of students.entries()){
    if(student.id===students[0]!.id||(!officialPost&&student.group!==profile.group))continue
    posts.react(student,id,{reaction:['love','wellDone','congrats','amazing','funny'][n%5],revision:0},randomUUID())
  }
  for(const [n,body]of replies[index]!.entries()){
    const student=students[n+5]!,comment=comments.create(student,id,{body},randomUUID())
    comments.decide(comment.id,'approve',{revision:comment.revision,confirmed:true},admin)
  }
}
// Cronología ilustrativa de publicaciones de la demo; no atribuye fechas a las fotografías.
const ages=[60,20,120,240,90,150,180,40]
for(const [index,id]of shared.entries())app.db.prepare('UPDATE publications SET published_at=? WHERE id=?').run(new Date(Date.now()-ages[index]!*60_000).toISOString(),Number(id.slice(4)))
if(process.argv.includes('--admin-qa'))await writeFile(join(directory,'admin-qa.json'),JSON.stringify({baseURL:`http://127.0.0.1:${port}`,filesDir:directory,...await seedAdminUsability(app.db,students[0]!,admin,directory)},null,2),{flag:'wx'})
if(process.argv.includes('--feedback-qa'))await writeFile(join(directory,'feedback-qa.json'),JSON.stringify({baseURL:`http://127.0.0.1:${port}`,filesDir:directory,...seedCommunityFeedback(app.db,students[0]!)},null,2),{flag:'wx'})
app.server.listen(apiPort,'127.0.0.1');await once(app.server,'listening')
const vite=await createServer({cacheDir:`node_modules/.vite-cai-web-${apiPort}`,server:{port,strictPort:true,host:'127.0.0.1',proxy:{'/api/local':{target:`http://127.0.0.1:${apiPort}`}}}})
await vite.listen()
const metadata={url:`http://127.0.0.1:${port}`,admin:'admin@example.test',student:'bob@example.test',password,directory,posts:shared.length,comments:replies.flat().length,demonstration:true}
await writeFile(join(directory,'presentation.json'),JSON.stringify(metadata,null,2),{flag:'wx'})
if(!process.argv.includes('--no-latest'))await writeFile(join(root,'community-showcase-latest.json'),JSON.stringify(metadata,null,2))
console.log(`Presentación CAI lista: ${metadata.url} — ${directory}`)
process.on('SIGINT',()=>{void vite.close().then(()=>app.server.close(()=>process.exit(0)))})
