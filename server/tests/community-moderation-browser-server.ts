import {mkdir,mkdtemp,writeFile} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {randomUUID} from 'node:crypto'
import sharp from 'sharp'
import {createApplication} from '../app.ts'
import {hashPassword} from '../auth.ts'
import {accessRepository} from '../access-repository.ts'
import {studentAccounts} from '../student-accounts.ts'
import {validateSubmission} from '../validation.ts'
import {publications} from '../publications.ts'
import {commentsRepository} from '../comments.ts'
import {galleryRepository} from '../gallery.ts'
import {institutionalPosts} from '../institutional-posts.ts'

if(process.env.NODE_ENV==='production')throw Error('Solo fixture local de moderación.')
const port=Number(process.env.CAI_API_PORT??3276)
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Puerto inválido.')
const root=resolve('.local/tests');await mkdir(root,{recursive:true})
const directory=await mkdtemp(join(root,'moderation-browser-')),app=createApplication(join(directory,'fixture.sqlite'))
const password='Frase ficticia de moderación CAI 2026',email='moderation@example.test',studentPassword='abcdefgh'
const admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES (?,'Coordinación QA',?,'admin')").run(email,await hashPassword(password)).lastInsertRowid)
const repo=accessRepository(app.db),accounts=studentAccounts(app.db),posts=publications(app.db),conversation=commentsRepository(app.db),ids:Record<string,string>={}
for(const [index,name] of ['Alice','Bob'].entries()){
 const receipt=repo.submit(validateSubmission({className:index?'Francés':'Inglés',firstName:name,lastName:'Prueba',birthDate:'2000-01-01',email:name.toLowerCase()+'@example.test',displayName:name+' P.',avatarColor:'#1f56d6',visibility:'privado',message:'',acceptRules:true,acceptPrivacy:true}),randomUUID())
 repo.decide(receipt.id,1,'approve',admin);ids[name]=receipt.id;app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),await hashPassword(studentPassword),new Date().toISOString())
}
app.db.exec('UPDATE community_controls SET comments_open=1')
const alice=(await accounts.login('alice@example.test',studentPassword))!,bob=(await accounts.login('bob@example.test',studentPassword))!
let main=''
for(let n=1;n<=22;n++){const post=posts.create(bob,{title:n===22?'Conversación para moderar':'Práctica compartida '+n,body:'Hoy practicamos inglés y compartimos nuestros avances en CAI.',category:'experience'},randomUUID());posts.decide(post.id,post.revision,'approve',admin,undefined,true);main=post.id}
for(let n=1;n<=22;n++){const comment=conversation.create(alice,main,{body:'Comentario ficticio número '+n+' para comprobar convivencia.'},randomUUID());if(comment.status==='pendiente')conversation.decide(comment.id,'approve',{revision:comment.revision,confirmed:true},admin)}
const image=await sharp({create:{width:960,height:540,channels:3,background:'#1f56d6'}}).jpeg().toBuffer()
const photo=await galleryRepository(app.db).create({title:'Foto ficticia de actividad',description:'Material sintético para comprobar la ampliación de imágenes.',category:'activities',alt:'Rectángulo azul de prueba',audience:'community',program:'',group:'',authorizationReference:'Material sintético de QA sin personas',confirmed:true,imageBase64:image.toString('base64')},randomUUID(),()=>admin)
institutionalPosts(app.db).create({title:'Actividad visual de prueba',body:'Fotografía sintética de una actividad de CAI para revisar el visor.',kind:'story',audience:'community',program:'',group:'',imageIds:[photo.id],showInGallery:false,highlighted:false,expiresAt:null,confirmed:true},randomUUID(),admin)
await writeFile(join(directory,'browser.json'),JSON.stringify({email,password,port,ids,main,directory},null,2),{flag:'wx'})
app.server.listen(port,'127.0.0.1',()=>console.log(join(directory,'browser.json')))
process.on('SIGINT',()=>app.server.close(()=>process.exit(0)))

