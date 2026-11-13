/** Solo comments-browser-server: cuentas y contenido ficticios. */
export async function checkConnectedComments(page,{admin,fixture,browserLabel='Prueba',baseURL='http://localhost:4180'}={}){
 const contexts=[],details=[],errors=[],releases=[]
 const check=(ok,label)=>{if(!ok)throw Error(label);details.push(label)}
 const secret='Frase ficticia de comentarios navegador 2026',body='Un comentario ficticio de ánimo '+browserLabel,rejectedBody='Comentario privado por corregir '+browserLabel,rejection='Revisa esta referencia ficticia antes de enviarla otra vez.'
 const open=async()=>{const context=await page.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});contexts.push(context);const target=await context.newPage();target.setDefaultTimeout(10000);target.on('pageerror',error=>errors.push(String(error)));return target}
 const call=(target,path,method='GET',data)=>target.evaluate(async({path,method,data})=>{const r=await fetch('/api/local'+path,{method,headers:{...(data===undefined?{}:{'Content-Type':'application/json'}),...(['PATCH','POST'].includes(method)?{'Idempotency-Key':crypto.randomUUID()}:{})},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,data:await r.json()}},{path,method,data})
 const login=async(target,account)=>{await target.bringToFront();await target.goto(baseURL+'/login');await target.locator('#login-email').fill(account.email);await target.locator('#login-password').fill(secret);await target.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await target.getByRole('button',{name:'Actualizar comunidad',exact:true}).waitFor()}
 const discussion=target=>target.getByRole('dialog').getByRole('region',{name:'Comentarios de '+fixture.title,exact:true})
 const form=target=>discussion(target).getByRole('form',{name:'Comentar en '+fixture.title,exact:true})
 const openStory=async(target,title=fixture.title)=>{await target.bringToFront();await target.getByRole('button',{name:'Actualizar comunidad',exact:true}).waitFor();if(await target.getByRole('dialog').count())await target.getByRole('button',{name:'Cerrar publicación',exact:true}).click();const entry=target.getByRole('button',{name:'Ver conversación de '+title,exact:true});if(await entry.count()===0&&await target.getByRole('button',{name:/^Ver más historias/}).count())await target.getByRole('button',{name:/^Ver más historias/}).click();await entry.click();await target.getByRole('dialog').getByRole('form',{name:'Comentar en '+title,exact:true}).waitFor()}
 const read=async target=>{await target.bringToFront();const response=target.waitForResponse(r=>r.url().includes('/student/posts/'+fixture.postId+'/comments?'));await discussion(target).getByRole('button',{name:'Actualizar conversación',exact:true}).click();await response;await discussion(target).getByRole('status').filter({hasText:'Actualizando comentarios…'}).waitFor({state:'hidden'})}
 const send=async(target,text)=>{await target.bringToFront();await form(target).getByRole('textbox').fill(text);await form(target).getByRole('button',{name:'Enviar a revisión',exact:true}).click();await discussion(target).getByRole('region',{name:'Mis comentarios enviados',exact:true}).getByText(text,{exact:true}).waitFor()}
 const ownId=async(target,text)=>{const r=await call(target,'/student/posts/'+fixture.postId+'/comments/mine');return r.data.items.find(item=>item.body===text).id}
 const adminList=async target=>{await target.bringToFront();await target.goto(baseURL+'/admin/publicaciones?bandeja=comentarios');await target.getByRole('heading',{name:'Comentarios del grupo',exact:true}).waitFor()}
 const review=async(target,id)=>{await target.bringToFront();await target.getByRole('button',{name:'Revisar comentario '+id,exact:true}).click();await target.getByRole('dialog').getByRole('combobox',{name:'Decisión',exact:true}).waitFor();return target.getByRole('dialog')}
 const decide=async(target,id,choice,reason='')=>{const dialog=await review(target,id);await dialog.getByRole('combobox',{name:'Decisión',exact:true}).selectOption(choice);if(reason)await dialog.getByLabel('Motivo para el autor',{exact:true}).fill(reason);await dialog.getByRole('checkbox').check();await dialog.getByRole('button',{name:'Confirmar decisión',exact:true}).click();await dialog.waitFor({state:'hidden'})}
 try{
  if(!fixture?.accounts?.author?.email?.endsWith('-comments@example.test'))throw Error('Se requiere la fixture ficticia exclusiva.')
  const coordination=await open(),author=await open(),peer=await open()
  await coordination.goto(baseURL+'/admin/configuracion');await coordination.locator('#login-email').fill(admin.email);await coordination.locator('#login-password').fill(secret);await coordination.getByRole('button',{name:'Entrar al panel',exact:true}).click()
  const control=coordination.getByRole('switch',{name:'Recibir nuevos comentarios',exact:true});await control.waitFor();check(await control.getAttribute('aria-checked')==='false','Comentarios inicialmente pausados en Configuración')
  await login(author,fixture.accounts.author);await openStory(author)
  check(await form(author).getByRole('textbox').isDisabled(),'La pausa se explica y bloquea nuevos comentarios')
  await coordination.bringToFront();await control.click();await coordination.getByRole('switch',{name:'Recibir nuevos comentarios',exact:true,checked:true}).waitFor()
  await coordination.reload();await coordination.getByRole('switch',{name:'Recibir nuevos comentarios',exact:true,checked:true}).waitFor();check(true,'El ajuste administrativo persiste al recargar')
  await author.reload();await openStory(author);await form(author).getByRole('button',{name:'Enviar a revisión',exact:true}).click()
  await discussion(author).getByRole('alert').filter({hasText:'Escribe un comentario'}).waitFor();check(await form(author).getByRole('textbox').evaluate(input=>document.activeElement===input),'Comentario vacío devuelve el foco al campo')
  await send(author,body);const firstId=await ownId(author,body)
  check((await form(author).getByRole('textbox').inputValue())==='','Confirmación de envío limpia el texto después de guardar')
  check((await discussion(author).getByRole('region',{name:'Mis comentarios enviados',exact:true}).innerText()).includes('En revisión'),'El autor distingue su comentario pendiente')
  await login(peer,fixture.accounts.peer);await openStory(peer)
  check(!(await discussion(peer).innerText()).includes(body),'Otro alumno no ve el comentario pendiente')
  await coordination.goto(baseURL+'/admin');await coordination.getByRole('link',{name:/^Revisar comentarios /}).click();await coordination.getByRole('heading',{name:'Comentarios del grupo',exact:true}).waitFor();check(true,'Resumen conduce a la bandeja de comentarios pendientes')
  let dialog=await review(coordination,firstId)
  await dialog.getByRole('button',{name:'Confirmar decisión',exact:true}).click();await dialog.getByRole('alert').waitFor();check(true,'Revisión exige decisión y confirmación')
  await dialog.getByRole('button',{name:'Cerrar revisión de comentario',exact:true}).click()
  check((await call(coordination,'/comments/'+firstId)).data.comment.status==='pendiente','Cerrar revisión sin decidir conserva el estado')
  await decide(coordination,firstId,'approve');await read(peer)
  await discussion(peer).getByRole('region',{name:'Comentarios publicados',exact:true}).getByText(body,{exact:true}).waitFor();check(true,'La aprobación publica el comentario al grupo')
  await peer.reload();await openStory(peer);await discussion(peer).getByText(body,{exact:true}).waitFor();check(true,'Comentario publicado persiste al recargar')
  await send(author,rejectedBody);const rejectedId=await ownId(author,rejectedBody)
  await adminList(coordination);await decide(coordination,rejectedId,'reject',rejection);await read(author)
  await discussion(author).getByRole('button',{name:'Mis comentarios',exact:true}).click();await discussion(author).getByText('Indicación de CAI: '+rejection,{exact:true}).waitFor()
  check(true,'El autor consulta el motivo privado de no aprobación')
  await read(peer);check(!(await discussion(peer).innerText()).includes(rejectedBody)&&!(await discussion(peer).innerText()).includes(rejection),'Otro alumno no recibe comentario ni motivo rechazados')
  const retryText='Reintento ficticio sin duplicados '+browserLabel,pattern='**/api/local/student/posts/*/comments',keys=[]
  const lose=async route=>{if(route.request().method()!=='POST')return route.continue();keys.push(route.request().headers()['idempotency-key']);await route.fetch();await route.abort('failed')}
  await author.bringToFront();await author.route(pattern,lose);await form(author).getByRole('textbox').fill(retryText);await form(author).getByRole('button',{name:'Enviar a revisión',exact:true}).click()
  await discussion(author).getByRole('alert').filter({hasText:'No pudimos confirmar el envío'}).waitFor();await author.unroute(pattern,lose)
  check((await form(author).getByRole('textbox').inputValue())===retryText,'Pérdida de respuesta conserva el borrador')
  const capture=request=>{if(request.method()==='POST'&&request.url().endsWith('/comments'))keys.push(request.headers()['idempotency-key'])};author.on('request',capture)
  await form(author).getByRole('button',{name:'Enviar a revisión',exact:true}).click();await discussion(author).getByRole('region',{name:'Mis comentarios enviados',exact:true}).getByText(retryText,{exact:true}).waitFor();author.off('request',capture)
  check(keys.length===2&&keys[0]===keys[1],'El reintento utiliza la misma clave')
  check((await call(coordination,'/comments')).data.items.filter(item=>item.body===retryText).length===1,'Solo existe un comentario tras perder la respuesta')
  const retryId=await ownId(author,retryText),heldText='Comentario con respuesta retenida '+browserLabel
  let held=0,ready;const received=new Promise(resolve=>{ready=resolve}),gate=new Promise(resolve=>releases.push(resolve))
  const hold=async route=>{if(route.request().method()!=='POST')return route.continue();held++;const response=await route.fetch();ready();await gate;await route.fulfill({response})}
  await author.route(pattern,hold);await form(author).getByRole('textbox').fill(heldText);await form(author).getByRole('button',{name:'Enviar a revisión',exact:true}).click();await received
  check(await form(author).getByRole('textbox').isDisabled(),'El campo se bloquea mientras guarda')
  await form(author).evaluate(form=>form.requestSubmit());check(held===1,'Doble envío no duplica la petición')
  releases[0]();await discussion(author).getByText(heldText,{exact:true}).waitFor();await author.unroute(pattern,hold);const heldId=await ownId(author,heldText)
  await adminList(coordination);dialog=await review(coordination,heldId)
  check((await call(coordination,'/comments/'+heldId+'/approve','POST',{revision:1,confirmed:true})).status===200,'Otra ventana puede revisar primero el comentario')
  await dialog.getByRole('combobox',{name:'Decisión',exact:true}).selectOption('reject');await dialog.getByLabel('Motivo para el autor',{exact:true}).fill('Borrador de decisión antigua');await dialog.getByRole('checkbox').check();await dialog.getByRole('button',{name:'Confirmar decisión',exact:true}).click()
  await dialog.getByRole('button',{name:'Cargar estado actual',exact:true}).waitFor()
  check((await dialog.getByLabel('Motivo para el autor',{exact:true}).inputValue())==='Borrador de decisión antigua','Conflicto conserva el motivo y exige cargar el estado actual')
  await dialog.getByRole('button',{name:'Cargar estado actual',exact:true}).click();await dialog.getByRole('combobox',{name:'Decisión',exact:true}).waitFor()
  await dialog.getByRole('combobox',{name:'Decisión',exact:true}).selectOption('withdraw');await dialog.getByLabel('Motivo para el autor',{exact:true}).fill('Retirada ficticia de coordinación');await dialog.getByRole('checkbox').check();await dialog.getByRole('button',{name:'Confirmar decisión',exact:true}).click();await dialog.waitFor({state:'hidden'})
  check((await call(coordination,'/comments/'+heldId)).data.comment.status==='retirado','Coordinación retira un comentario con motivo e historial')
  await coordination.getByRole('group',{name:'Filtrar comentarios por estado',exact:true}).getByRole('button',{name:/^Publicados /}).click();dialog=await review(coordination,firstId)
  const perPost=dialog.getByRole('switch',{name:'Recibir comentarios en esta historia',exact:true});await perPost.click();await dialog.getByRole('switch',{name:'Recibir comentarios en esta historia',exact:true,checked:false}).waitFor()
  await read(author);check(await form(author).getByRole('textbox').isDisabled(),'Cerrar la conversación detiene nuevos envíos sin borrar el historial')
  await discussion(author).getByRole('button',{name:'Mis comentarios',exact:true}).click();const firstOwn=discussion(author).getByRole('article',{name:firstId,exact:true})
  await firstOwn.getByRole('button',{name:'Retirar mi comentario',exact:true}).click();await firstOwn.getByRole('button',{name:'Cancelar',exact:true}).click();check((await call(author,'/student/posts/'+fixture.postId+'/comments/mine')).data.items.find(item=>item.id===firstId).status==='publicado','Cancelar retirada conserva el comentario')
  await firstOwn.getByRole('button',{name:'Retirar mi comentario',exact:true}).click();await firstOwn.getByRole('button',{name:'Confirmar retirada',exact:true}).click();await firstOwn.getByText('Retirado',{exact:true}).waitFor();check(true,'El alumno puede retirar su comentario aun estando pausado')
  await read(peer);check(!(await discussion(peer).innerText()).includes(body),'La retirada propia desaparece de la conversación del grupo')
  await coordination.bringToFront();await perPost.click();await dialog.getByRole('switch',{name:'Recibir comentarios en esta historia',exact:true,checked:true}).waitFor();await dialog.getByRole('button',{name:'Cerrar revisión de comentario',exact:true}).click()
  await coordination.goto(baseURL+'/admin/configuracion');await control.click();await coordination.getByRole('switch',{name:'Recibir nuevos comentarios',exact:true,checked:false}).waitFor()
  await read(author);check(await form(author).getByRole('textbox').isDisabled(),'Pausa general se aplica también a una historia reabierta')
  await coordination.bringToFront();await control.click();await coordination.getByRole('switch',{name:'Recibir nuevos comentarios',exact:true,checked:true}).waitFor()
  await author.reload();await openStory(author)
  const outside=await open();await login(outside,fixture.accounts.outside);check(await outside.getByRole('button',{name:'Ver conversación de '+fixture.title,exact:true}).count()===0,'Otro grupo no ve la historia')
  check((await call(outside,'/student/posts/'+fixture.postId+'/comments')).status===404,'Otro grupo tampoco lee comentarios por la API')
  const minor=await open();await login(minor,fixture.accounts.minor);await openStory(minor)
  check((await form(minor).innerText()).includes('Comenta como Alumno F.'),'El menor comenta con su alias abreviado')
  await send(minor,'Participación ficticia de menor '+browserLabel);const minorId=await ownId(minor,'Participación ficticia de menor '+browserLabel)
  await adminList(coordination);await decide(coordination,minorId,'approve');await read(peer);await discussion(peer).getByText('Participación ficticia de menor '+browserLabel,{exact:true}).waitFor()
  check((await discussion(peer).getByRole('region',{name:'Comentarios publicados',exact:true}).innerText()).includes('Alumno F.'),'El grupo recibe el alias autorizado del menor')
  await openStory(peer,fixture.paginationTitle);const history=peer.getByRole('dialog').getByRole('region',{name:'Comentarios publicados',exact:true})
  check(await history.getByText(/Comentario de historial ficticio/).count()===20,'Conversación carga una página de veinte comentarios')
  await peer.getByRole('dialog').getByRole('button',{name:'Ver comentarios anteriores',exact:true}).click();await history.getByText('Comentario de historial ficticio 0',{exact:true}).waitFor()
  check(await history.getByText(/Comentario de historial ficticio/).count()===23,'Carga anteriores sin duplicar comentarios')
  await peer.getByRole('dialog').getByRole('button',{name:'Mis comentarios',exact:true}).click();const ownHistory=peer.getByRole('region',{name:'Mis comentarios enviados',exact:true})
  check(await ownHistory.getByRole('article').count()===20,'Historial propio también está paginado')
  await peer.getByRole('dialog').getByRole('button',{name:'Ver envíos anteriores',exact:true}).click();await ownHistory.getByText('Comentario de historial ficticio 0',{exact:true}).waitFor();check(await ownHistory.getByRole('article').count()===23,'Historial propio permite consultar envíos anteriores')
  await adminList(coordination);dialog=await review(coordination,retryId)
  for(const width of [1440,768,375,320]){
   await author.bringToFront();await author.setViewportSize({width,height:1000});await form(author).getByRole('textbox').scrollIntoViewIfNeeded()
   check(await author.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)&&await author.getByRole('dialog').evaluate(d=>d.scrollWidth<=d.clientWidth),'Conversación y formulario sin desbordamiento a '+width+'px')
   await coordination.bringToFront();await coordination.setViewportSize({width,height:1000})
   check(await coordination.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)&&await dialog.evaluate(d=>d.scrollWidth<=d.clientWidth),'Revisión administrativa sin desbordamiento a '+width+'px')
  }
  await dialog.getByRole('button',{name:'Cerrar revisión de comentario',exact:true}).click()
  const stored=await author.evaluate(()=>JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]));check(!stored.includes(secret)&&!stored.includes(body)&&!stored.includes(fixture.accounts.author.email),'No conserva comentarios o credenciales en storage')
  const current=(await call(coordination,'/posts')).data.posts.find(item=>item.id===fixture.postId)
  check((await call(coordination,'/posts/'+fixture.postId+'/undo','POST',{revision:current.revision})).status===200,'Coordinación puede ocultar la historia completa')
  await author.getByRole('button',{name:'Cerrar publicación',exact:true}).click();await author.getByRole('button',{name:'Actualizar comunidad',exact:true}).click();await author.getByRole('button',{name:'Ver conversación de '+fixture.title,exact:true}).waitFor({state:'hidden'})
  check((await call(author,'/student/posts/'+fixture.postId+'/comments')).status===404,'Ocultar historia bloquea también su conversación directa')
  check(errors.length===0,'Sin errores de ejecución JavaScript')
  return {browserLabel,checks:details.length,details,errors}
 }catch(error){const pages=await Promise.all(contexts.flatMap(context=>context.pages()).map(async target=>({path:new URL(target.url()).pathname,alerts:await target.getByRole('alert').allTextContents()})));throw Error(error.message+'\nCompletadas: '+details.length+'\n'+JSON.stringify(pages)+'\n'+details.join('\n'))}
 finally{for(const release of releases)release();for(const context of contexts)await context.close()}
}

