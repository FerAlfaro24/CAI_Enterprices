/** Formulario simple, permisos y revisión de Logros; solo fixture local ficticia. */
export async function checkLearningForm(page,{baseURL,email,password,filesDir,imagePath,browserLabel='brave'}) {
 if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(baseURL)||!email.endsWith('@example.test'))throw Error('Solo QA local ficticia.')
 const browser=page.context().browser(),student=await browser.newContext({viewport:{width:1440,height:1000},locale:'es-MX',reducedMotion:'reduce'}),peer=await browser.newContext(),admin=await browser.newContext(),p=await student.newPage(),results=[],errors=[]
 p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 const check=(ok,label)=>{if(!ok)throw Error(label);results.push(label)}
 const api=async(c,path,method='GET',data,key)=>{const r=await c.request.fetch(baseURL+'/api/local'+path,{method,data,headers:{Origin:baseURL,...(key?{'Idempotency-Key':crypto.randomUUID()}:{})}});if(!r.ok())throw Error(path+' HTTP '+r.status()+': '+await r.text());return r.json()}
 const dialog=()=>p.getByRole('dialog'),title='Lectura '+browserLabel+' '+Date.now(),longTitle=(browserLabel+' '+Date.now()).padEnd(300,'N'),card=()=>p.getByRole('article').filter({has:p.getByRole('heading',{name:title,exact:true})})
 const fresh=async()=>{await p.reload();await p.getByRole('navigation',{name:'Secciones de comunidad'}).getByRole('button',{name:'Logros',exact:true}).click();await p.getByRole('heading',{name:'¿Qué descubriste hoy?',exact:true}).waitFor()}
 try {
  await api(student,'/student/login','POST',{email:'alice@example.test',password:'abcdefgh'});await api(peer,'/student/login','POST',{email:'bob@example.test',password:'abcdefgh'});await api(admin,'/auth/login','POST',{email,password})
  await p.goto(baseURL+'/community');await p.getByRole('navigation',{name:'Secciones de comunidad'}).getByRole('button',{name:'Logros',exact:true}).click()
  await p.getByRole('button',{name:/Lectura.*Registrar logro/}).click();await dialog().waitFor()
  check(await dialog().getByRole('heading',{name:'Cuéntanos qué descubriste',exact:true}).isVisible(),'Un solo formulario visible al abrir')
  check(await dialog().getByRole('button',{name:'Continuar',exact:true}).count()===0,'Sin pasos redundantes')
  check(await dialog().getByLabel('Nombre del libro o lectura',{exact:true}).isVisible(),'Nombre de la obra separado del aprendizaje')
  check(await dialog().getByLabel('¿Qué aprendiste?',{exact:true}).isVisible(),'Aprendizaje visible desde el principio')
  check(await dialog().getByRole('textbox').count()===3,'Solo nombre, aprendizaje y palabras/frases')
  await dialog().getByRole('button',{name:'Cine y series',exact:true}).click();check(await dialog().getByLabel('Nombre de la película o serie',{exact:true}).isVisible(),'Elegir actividad adapta la etiqueta')
  await dialog().getByRole('button',{name:'Música',exact:true}).click();check(await dialog().getByLabel('Nombre de la canción',{exact:true}).isVisible(),'Música identifica el nombre de la canción')
  await dialog().getByRole('button',{name:'Lectura',exact:true}).click()
  const name=dialog().getByLabel('Nombre del libro o lectura',{exact:true}),practice=dialog().getByLabel('¿Qué aprendiste?',{exact:true}),words=dialog().getByRole('textbox',{name:/Palabras o frases/})
  check(await name.getAttribute('maxlength')==='300'&&await practice.getAttribute('maxlength')==='5000'&&await words.getAttribute('maxlength')==='1000','Límites del formulario coherentes con el servidor')
  check(!await words.getAttribute('required'),'Palabras y frases opcionales')
  await name.fill(title);await dialog().locator('input[type=file]').setInputFiles(imagePath);await dialog().getByRole('img',{name:'Imagen adjunta 1',exact:true}).waitFor()
  check(true,'Imagen opcional con vista previa')
  for(const theme of ['light','dark']){await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);for(const width of [1440,768,375,320]){await p.setViewportSize({width,height:1000});check(await dialog().evaluate(d=>d.scrollWidth<=d.clientWidth+1&&d.getBoundingClientRect().width<=innerWidth),'Formulario ajustado '+width+' '+theme)}if(filesDir)await p.screenshot({path:filesDir+'/'+browserLabel+'-learning-form-'+theme+'.png'})}
  await dialog().getByRole('button',{name:'Guardar borrador',exact:true}).click();await dialog().waitFor({state:'detached'})
  let item=(await api(student,'/student/achievements')).items.find(x=>x.title===title);check(item.state==='draft'&&item.practice===''&&item.images.length===1&&item.publication===null,'Borrador sin aprendizaje conserva imagen y privacidad')
  await p.setViewportSize({width:1440,height:1000});await card().getByRole('button',{name:'Editar logro',exact:true}).click()
  check(await dialog().getByLabel('Nombre del libro o lectura',{exact:true}).inputValue()===title,'Edición recupera el nombre')
  await dialog().getByLabel('¿Qué aprendiste?',{exact:true}).fill('A');await dialog().getByRole('button',{name:'Guardar logro en privado',exact:true}).click();await dialog().waitFor({state:'detached'})
  item=(await api(student,'/student/achievements')).items.find(x=>x.title===title);check(item.state==='completed'&&item.expression===''&&item.example==='','Completa con un carácter de aprendizaje y opcionales vacíos')
  check(!(await api(peer,'/student/posts')).posts.some(x=>x.learningId===item.id),'Guardar no publica a compañeros')
  check(await card().getByRole('button',{name:'Validar sin publicar',exact:true}).isVisible(),'Conserva validación privada voluntaria')
  await card().getByRole('button',{name:'Enviar para publicar',exact:true}).click();await card().getByText('Publicación en revisión',{exact:true}).waitFor()
  item=(await api(student,'/student/achievements')).items.find(x=>x.title===title);check(item.publication.status==='pendiente','Compartir sigue exigiendo aprobación de CAI')
  await api(admin,'/posts/'+item.publication.id+'/approve','POST',{revision:item.publication.revision,confirmed:true});await fresh()
  const post=(await api(peer,'/student/posts')).posts.find(x=>x.learningId===item.id);check(post.body==='A'&&post.photos.length===1,'Compañero ve texto simple e imagen solo después de aprobación')
  check(!post.body.includes('Mi ejemplo:')&&!post.body.includes('Palabras o frases:'),'No publica encabezados vacíos')
  await p.getByRole('button',{name:/Lectura.*Registrar logro/}).click();await dialog().getByLabel('Nombre del libro o lectura',{exact:true}).fill(longTitle);await dialog().getByLabel('¿Qué aprendiste?',{exact:true}).fill('L'.repeat(5000));await dialog().getByRole('textbox',{name:/Palabras o frases/}).fill('P'.repeat(1000))
  await dialog().getByRole('button',{name:'Guardar logro en privado',exact:true}).click();await dialog().waitFor({state:'detached'});item=(await api(student,'/student/achievements')).items.find(x=>x.title===longTitle);check(item.practice.length===5000&&item.expression.length===1000,'Máximos reales guardados sin truncar')
  const longCard=p.getByRole('article').filter({has:p.getByRole('heading',{name:item.title,exact:true})});await longCard.getByRole('button',{name:'Enviar para publicar',exact:true}).click();await longCard.getByText('Publicación en revisión',{exact:true}).waitFor();item=(await api(student,'/student/achievements')).items.find(x=>x.id===item.id);await api(admin,'/posts/'+item.publication.id+'/approve','POST',{revision:item.publication.revision,confirmed:true})
  const longPost=(await api(peer,'/student/posts')).posts.find(x=>x.learningId===item.id);check(longPost.title.length===300&&longPost.body.includes('P'.repeat(1000)),'La publicación derivada admite los límites completos')
  await fresh();for(const width of [375,320]){await p.setViewportSize({width,height:1000});check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Colección con textos largos sin desbordar '+width)}
  check(errors.length===0,'Sin errores inesperados de ejecución/consola: '+errors.join(' | '));return {count:results.length,results,errors}
 }finally{await student.close();await peer.close();await admin.close()}
}
