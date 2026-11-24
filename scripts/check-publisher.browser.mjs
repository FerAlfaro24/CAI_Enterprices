/** Publicador y carrusel reales, con borrado propio/contextual; solo fixture nueva de QA. */
export async function checkPublisher(page,{baseURL,email,password,filesDir,imagePath,browserLabel='brave'}) {
 if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(baseURL)||!email.endsWith('@example.test'))throw Error('Solo QA local ficticia.')
 const browser=page.context().browser(),admin=await browser.newContext({viewport:{width:1440,height:1000},locale:'es-MX',reducedMotion:'reduce'}),student=await browser.newContext({viewport:{width:1440,height:1000},locale:'es-MX',reducedMotion:'reduce'}),peer=await browser.newContext(),p=await admin.newPage(),q=await student.newPage(),results=[],errors=[],tag=browserLabel+' '+Date.now()
 for(const t of [p,q]){t.setDefaultTimeout(20000);t.on('pageerror',e=>errors.push(e.message));t.on('console',m=>{if(m.type()==='error')errors.push(m.text())})}
 const check=(ok,label)=>{if(!ok)throw Error(label);results.push(label)}
 const api=async(c,path,method='GET',data,key)=>{const r=await c.request.fetch(baseURL+'/api/local'+path,{method,data,headers:{Origin:baseURL,...(key?{'Idempotency-Key':crypto.randomUUID()}:{})}});if(!r.ok())throw Error(path+' HTTP '+r.status()+': '+await r.text());return r.json()}
 const composer=()=>p.getByRole('form',{name:'Nueva publicación de coordinación',exact:true}),carousel=()=>q.getByRole('region',{name:'Avisos de CAI',exact:true}),dialog=()=>p.getByRole('dialog').last()
 const reloadStudent=async()=>{await q.goto(baseURL+'/community');await q.getByRole('heading',{name:'Tu comunidad, al día.',exact:true}).waitFor()}
 const createUI=async(kind,title,photo=false)=>{
  await p.goto(baseURL+'/admin/crear-publicacion');await composer().waitFor()
  await composer().getByRole('button',{name:kind==='notice'?/^Aviso de CAI/:/^Publicación normal/}).click()
  await composer().getByLabel(kind==='notice'?'Título del aviso':'Título de la publicación',{exact:true}).fill(title)
  await composer().getByLabel(kind==='notice'?'¿Qué necesita saber la comunidad?':'Cuéntale a la comunidad',{exact:true}).fill('Contenido ficticio para comprobar la nueva publicación y su audiencia compartida.')
  if(photo){await composer().locator('input[type=file]').setInputFiles(imagePath);await composer().getByLabel('Describe la imagen 1',{exact:true}).fill('Rectángulo azul de prueba');await composer().getByLabel('Permiso o referencia interna para usar las imágenes',{exact:true}).fill('Material sintético ficticio para QA')}
  check(await composer().getByRole('button',{name:kind==='notice'?'Publicar aviso de CAI':'Publicar en la comunidad',exact:true}).isDisabled(),'Publicador exige confirmación '+kind)
  await composer().getByRole('checkbox',{name:/^Revisé el contenido/}).check()
  const response=p.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/institutional-posts'))
  await composer().getByRole('button',{name:kind==='notice'?'Publicar aviso de CAI':'Publicar en la comunidad',exact:true}).click();check((await response).ok(),'Publicación guardada '+kind)
  await p.getByRole('status').filter({hasText:kind==='notice'?'Aviso publicado.':'Publicación guardada en la comunidad.'}).waitFor()
  return (await api(admin,'/institutional-posts')).posts.find(x=>x.title===title)
 }
 const removeUI=async(item)=>{
  await p.goto(baseURL+'/admin/publicaciones');await p.getByRole('button',{name:/^Publicadas/}).click();await p.getByLabel('Buscar publicación',{exact:true}).fill(item.title)
  const card=p.getByRole('article').filter({has:p.getByRole('heading',{name:item.title,exact:true})});await card.getByRole('button',{name:/^Eliminar/}).click();await dialog().waitFor()
  check(await dialog().getByRole('button',{name:'Eliminar de la comunidad',exact:true}).isDisabled(),'Eliminar requiere confirmación '+item.title)
  await q.setViewportSize({width:320,height:1000});await p.setViewportSize({width:320,height:1000});check(await dialog().evaluate(d=>d.scrollWidth<=d.clientWidth+1),'Confirmación de eliminación cabe en móvil')
  await p.keyboard.press('Escape');check(await p.getByRole('dialog').count()===0,'Cancelar eliminación no borra contenido')
  await p.setViewportSize({width:1440,height:1000});await card.getByRole('button',{name:/^Eliminar/}).click();await dialog().getByLabel('Motivo privado de eliminación',{exact:true}).fill('Eliminación ficticia comprobada por coordinación');await dialog().getByRole('checkbox').check()
  const response=p.waitForResponse(r=>r.url().includes(item.id)&&['POST','PATCH'].includes(r.request().method()))
  await dialog().getByRole('button',{name:'Eliminar de la comunidad',exact:true}).click();check((await response).ok(),'Eliminar confirma el guardado '+item.title);await dialog().waitFor({state:'hidden'})
  await p.getByRole('button',{name:/^Eliminadas de la comunidad/}).click();check(await p.getByRole('heading',{name:item.title,exact:true}).isVisible(),'El registro eliminado se conserva '+item.title)
 }
 try {
  await api(admin,'/auth/login','POST',{email,password});await api(student,'/student/login','POST',{email:'alice@example.test',password:'abcdefgh'});await api(peer,'/student/login','POST',{email:'bob@example.test',password:'abcdefgh'})
  await p.goto(baseURL+'/admin');await p.getByRole('navigation',{name:'Secciones de administración'}).getByRole('link',{name:'Crear publicación',exact:true}).click();await composer().waitFor()
  check(new URL(p.url()).pathname==='/admin/crear-publicacion','Crear publicación tiene sección principal propia')
  check(await composer().getByRole('button',{name:/^Publicación normal/}).isVisible()&&await composer().getByRole('button',{name:/^Aviso de CAI/}).isVisible(),'Dos opciones claras: publicación normal y aviso')
  check(await composer().getByText('Destacar en Inicio',{exact:true}).count()===0,'Sin control ambiguo de destacado')
  check(await composer().getByLabel('Programa',{exact:true}).count()===0&&await composer().getByLabel('Grupo',{exact:true}).count()===0,'La nueva publicación se dirige a la comunidad completa')
  for(const theme of ['light','dark']){await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);for(const width of [1440,768,375,320]){await p.setViewportSize({width,height:1000});check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Publicador adaptable '+width+' '+theme)}if(filesDir)await p.screenshot({path:filesDir+'/'+browserLabel+'-publisher-'+theme+'.png'})}
  await p.setViewportSize({width:1440,height:1000});await reloadStudent();check(await carousel().count()===0,'Sin avisos se oculta el carrusel; no muestra álbumes')
  const normal=await createUI('story','Actividad '+tag,true);check(normal.showInGallery&&normal.photos.length===1,'Publicación normal con foto entra a Galería')
  const gallery=(await api(student,'/student/gallery')).images;check(gallery.filter(x=>x.id===normal.photos[0].id).length===1,'Una sola imagen compartida entre feed y Galería')
  await reloadStudent();check(await carousel().count()===0,'Una publicación con foto no se vuelve aviso')
  const one=await createUI('notice','Aviso con imagen '+tag,true);await reloadStudent();await carousel().getByRole('heading',{name:one.title,exact:true}).waitFor()
  check(await carousel().locator('img').count()===2,'Aviso usa su imagen real y fondo accesible');check(await carousel().getByRole('button',{name:'Siguiente aviso',exact:true}).count()===0,'Un solo aviso no tiene rotación inútil')
  const two=await createUI('notice','Aviso reciente '+tag);await reloadStudent();await carousel().getByRole('heading',{name:two.title,exact:true}).waitFor();check(true,'Carrusel empieza por el aviso más reciente')
  check(await carousel().getByRole('button',{name:'Activar avance automático',exact:true}).isDisabled(),'Respeta movimiento reducido')
  await carousel().getByRole('button',{name:'Siguiente aviso',exact:true}).click();await carousel().getByRole('heading',{name:one.title,exact:true}).waitFor();check(true,'Navegación manual conserva el orden de avisos')
  await student.setExtraHTTPHeaders({});await q.emulateMedia({reducedMotion:'no-preference'});await reloadStudent();await q.mouse.move(0,0);await carousel().getByRole('heading',{name:two.title,exact:true}).waitFor()
  await q.waitForTimeout(5300);check(await carousel().getByRole('heading',{name:one.title,exact:true}).isVisible(),'Avanza automáticamente a los cinco segundos')
  await carousel().getByRole('button',{name:'Pausar avance automático',exact:true}).click();await q.mouse.move(0,0);await p.bringToFront();await q.bringToFront();await q.waitForTimeout(5300);check(await carousel().getByRole('heading',{name:one.title,exact:true}).isVisible(),'Pausa explícita conserva el aviso visible')
  await q.emulateMedia({reducedMotion:'reduce'});await reloadStudent()
  const receipt=await api(student,'/student/posts','POST',{title:'Historia de alumno '+tag,body:'Historia ficticia para comprobar comentarios inmediatos y moderación.',category:'experience'},true);await api(admin,'/posts/'+receipt.post.id+'/approve','POST',{revision:receipt.post.revision,confirmed:true});await reloadStudent()
  await q.getByRole('button',{name:'Ver conversación de '+receipt.post.title,exact:true}).click();const comments=q.getByRole('region',{name:'Comentarios publicados',exact:true});await comments.waitFor()
  check(await q.getByRole('button',{name:'Enviar a revisión',exact:true}).count()===0,'Los comentarios ya no piden revisión')
  const text='Un comentario inmediato '+tag;await q.getByRole('textbox',{name:/^Comenta como/}).fill(text);await q.getByRole('button',{name:'Publicar comentario',exact:true}).click();await comments.getByText(text,{exact:true}).waitFor();check(true,'El comentario aparece en la conversación al enviar')
  let publicPage=await api(peer,'/student/posts/'+receipt.post.id+'/comments');check(publicPage.items.some(x=>x.body===text),'Otro alumno lo ve sin aprobación')
  check(await comments.getByRole('button',{name:'Eliminar mi comentario',exact:true}).isVisible(),'Borrado propio junto al comentario público')
  await comments.getByRole('button',{name:'Eliminar mi comentario',exact:true}).click();await comments.getByRole('button',{name:'Confirmar eliminación',exact:true}).click();await comments.getByText(text,{exact:true}).waitFor({state:'hidden'});publicPage=await api(peer,'/student/posts/'+receipt.post.id+'/comments');check(!publicPage.items.some(x=>x.body===text),'El borrado propio se refleja en la otra cuenta')
  await q.keyboard.press('Escape');await p.goto(baseURL+'/admin/publicaciones');check(await p.getByRole('button',{name:/^Comentarios \(/}).count()===0,'Publicaciones no contiene cola de comentarios')
  await removeUI(receipt.post);check(!(await api(peer,'/student/posts')).posts.some(x=>x.id===receipt.post.id),'El administrador puede eliminar una publicación de alumno')
  await removeUI(normal);check(!(await api(peer,'/student/gallery')).images.some(x=>x.id===normal.photos[0].id),'Eliminar publicación normal también oculta su foto en Galería')
  await removeUI(two);await reloadStudent();check(await carousel().getByRole('heading',{name:one.title,exact:true}).isVisible(),'Al eliminar un aviso queda el siguiente disponible')
  await removeUI(one);await reloadStudent();check(await carousel().count()===0,'Sin avisos vigentes desaparece el carrusel')
  await p.goto(baseURL+'/admin/publicaciones?bandeja=cai');await p.waitForURL(baseURL+'/admin/crear-publicacion');check(true,'El enlace anterior conduce al nuevo publicador')
  check(errors.length===0,'Sin errores de ejecución o consola: '+errors.join(' | '));return {count:results.length,results,errors}
 }finally{
  try{for(const item of (await api(admin,'/institutional-posts')).posts.filter(x=>x.status==='publicada'&&x.title.includes(tag)))await api(admin,'/institutional-posts/'+item.id,'PATCH',{revision:item.revision,confirmed:true,withdraw:true,highlighted:false,expiresAt:item.expiresAt??null,reason:'Cierre de datos ficticios de QA'})}catch{}
  await admin.close();await student.close();await peer.close()
 }
}
