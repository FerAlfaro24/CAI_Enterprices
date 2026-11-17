/** Ejecutar solo con reactions-browser-server y cuentas ficticias. */
export async function checkConnectedReactions(page,{admin,fixture,browserLabel='Prueba',baseURL='http://localhost:4180'}={}){
 const contexts=[],errors=[],details=[],releases=[]
 const check=(ok,label)=>{if(!ok)throw Error(label);details.push(label)}
 const secret='Frase ficticia de reacciones navegador 2026'
 const open=async()=>{const context=await page.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});contexts.push(context);const target=await context.newPage();target.setDefaultTimeout(10000);target.on('pageerror',e=>errors.push(String(e)));return target}
 const call=(target,path,method='GET',data)=>target.evaluate(async({path,method,data})=>{const r=await fetch('/api/local'+path,{method,headers:{...(data===undefined?{}:{'Content-Type':'application/json'}),...(method==='PATCH'?{'Idempotency-Key':crypto.randomUUID()}:{})},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,data:await r.json()}},{path,method,data})
 const bar=target=>target.getByRole('region',{name:'Celebraciones de '+fixture.title,exact:true})
 const login=async(target,account)=>{await target.bringToFront();await target.goto(baseURL+'/login');await target.locator('#login-email').fill(account.email);await target.locator('#login-password').fill(secret);await target.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await target.getByRole('button',{name:'Actualizar comunidad',exact:true}).waitFor()}
 const refresh=async target=>{await target.bringToFront();await target.getByRole('button',{name:'Actualizar comunidad',exact:true}).click();await target.getByRole('button',{name:'Actualizar comunidad',exact:true}).waitFor({state:'visible'});await target.waitForFunction(()=>!document.querySelector('button[disabled]')?.textContent?.includes('Actualizar comunidad'))}
 const selected=async(target,label,count)=>{await bar(target).getByRole('button',{name:label+': '+count,exact:true,pressed:true}).waitFor()}
 try{
  if(!fixture?.accounts?.author?.email?.endsWith('-reactions@example.test'))throw Error('Se requiere la fixture ficticia exclusiva.')
  const coordination=await open(),author=await open(),peer=await open(),outside=await open(),stale=await open()
  await coordination.goto(baseURL+'/admin/configuracion');await coordination.locator('#login-email').fill(admin.email);await coordination.locator('#login-password').fill(secret);await coordination.getByRole('button',{name:'Entrar al panel',exact:true}).click()
  const control=coordination.getByRole('switch',{name:'Permitir reacciones',exact:true})
  await control.waitFor();check(await control.getAttribute('aria-checked')==='false','Reacciones inicialmente pausadas en Configuración')
  await login(author,fixture.accounts.author);await bar(author).waitFor()
  check(await bar(author).getByRole('button',{name:'Me encanta: 0',exact:true}).isDisabled(),'La pausa real se explica y bloquea nuevas selecciones')
  await coordination.bringToFront();await control.click();await coordination.getByRole('switch',{name:'Permitir reacciones',exact:true,checked:true}).waitFor()
  await coordination.reload();await coordination.getByRole('switch',{name:'Permitir reacciones',exact:true,checked:true}).waitFor();check(true,'El ajuste administrativo persiste al recargar')
  await refresh(author);await login(stale,fixture.accounts.author)
  await author.bringToFront();await bar(author).getByRole('button',{name:'Me encanta: 0',exact:true}).click();await selected(author,'Me encanta',1)
  check(true,'Una reacción guardada muestra selección propia y contador real')
  await author.reload();await selected(author,'Me encanta',1);check(true,'La reacción propia persiste al recargar')
  await login(peer,fixture.accounts.peer);await bar(peer).getByRole('button',{name:'Me encanta: 1',exact:true}).waitFor()
  check(await bar(peer).getByRole('button',{name:'Me encanta: 1',exact:true}).getAttribute('aria-pressed')==='false','Otro alumno ve el total sin adoptar la elección ajena')
  await stale.bringToFront()
  // La otra ventana conserva explícitamente la revisión anterior, aun con refresco por foco.
  await stale.route('**/api/local/student/posts',async route=>{const r=await route.fetch();const json=await r.json();for(const post of json.posts){if(post.id===fixture.postId)post.engagement={counts:{love:0,wellDone:0,congrats:0,amazing:0,funny:0},myReaction:null,revision:0}}await route.fulfill({response:r,json})})
  await refresh(stale);await bar(stale).getByRole('button',{name:'Increíble: 0',exact:true}).click()
  await stale.getByRole('alert').filter({hasText:'Tu reacción cambió en otra ventana'}).waitFor();await stale.unroute('**/api/local/student/posts')
  await refresh(stale);await selected(stale,'Me encanta',1);check(true,'Una revisión antigua no sobrescribe la elección de otra ventana')
  await author.bringToFront();await author.getByRole('button',{name:fixture.title,exact:true}).click()
  const dialog=author.getByRole('dialog');await dialog.getByRole('button',{name:'Me encanta: 1',exact:true,pressed:true}).waitFor()
  await dialog.getByRole('button',{name:'Bien hecho: 0',exact:true}).focus();await author.keyboard.press('Enter');await dialog.getByRole('button',{name:'Bien hecho: 1',exact:true,pressed:true}).waitFor()
  check(true,'Detalle y teclado permiten cambiar la reacción sin duplicarla')
  await dialog.getByRole('button',{name:'Cerrar publicación',exact:true}).click();await selected(author,'Bien hecho',1)
  check(await bar(author).getByRole('button',{name:'Me encanta: 0',exact:true}).count()===1,'Listado y detalle comparten los mismos contadores')
  const pattern='**/api/local/student/posts/*/reaction',keys=[]
  const lose=async route=>{keys.push(route.request().headers()['idempotency-key']);await route.fetch();await route.abort('failed')}
  await author.route(pattern,lose);await bar(author).getByRole('button',{name:'Felicidades: 0',exact:true}).click()
  await bar(author).getByRole('status').filter({hasText:'No confirmamos el cambio'}).waitFor();await author.unroute(pattern,lose)
  const capture=request=>{if(request.method()==='PATCH'&&request.url().endsWith('/reaction'))keys.push(request.headers()['idempotency-key'])};author.on('request',capture)
  await bar(author).getByRole('button',{name:'Felicidades: 0',exact:true}).click();await selected(author,'Felicidades',1);author.off('request',capture)
  check(keys.length===2&&keys[0]===keys[1],'La respuesta perdida se reintenta con la misma clave y una sola reacción')
  let held=0,ready;const received=new Promise(resolve=>{ready=resolve}),gate=new Promise(resolve=>releases.push(resolve))
  const hold=async route=>{held++;const r=await route.fetch();ready();await gate;await route.fulfill({response:r})}
  await author.route(pattern,hold);await bar(author).getByRole('button',{name:'Me divierte: 0',exact:true}).click();await received
  check(await bar(author).getByRole('button',{name:'Me encanta: 0',exact:true}).isDisabled(),'Los controles se bloquean mientras se guarda')
  await bar(author).getByRole('button',{name:'Me divierte: 0',exact:true}).evaluate(button=>button.click());check(held===1,'Un segundo clic mientras guarda no envía otra petición')
  releases[0]();await selected(author,'Me divierte',1);await author.unroute(pattern,hold)
  await coordination.bringToFront();await control.click();await coordination.getByRole('switch',{name:'Permitir reacciones',exact:true,checked:false}).waitFor()
  await refresh(author);await bar(author).getByRole('button',{name:'Me divierte: 1',exact:true,disabled:true}).waitFor()
  check(await bar(author).getByRole('button',{name:'Quitar mi reacción',exact:true}).isEnabled(),'Pausar conserva la reacción y permite retirarla')
  await bar(author).getByRole('button',{name:'Quitar mi reacción',exact:true}).click();await bar(author).getByRole('button',{name:'Quitar mi reacción',exact:true}).waitFor({state:'hidden'})
  check(await bar(author).getByRole('button',{name:'Me divierte: 0',exact:true}).count()===1,'Retirada explícita actualiza el total aun estando pausado')
  await coordination.bringToFront();await control.click();await coordination.getByRole('switch',{name:'Permitir reacciones',exact:true,checked:true}).waitFor();await refresh(author)
  await login(outside,fixture.accounts.outside);check(await bar(outside).count()===0,'Otro grupo no ve la publicación ni sus controles')
  check((await call(outside,'/student/posts/'+fixture.postId+'/reaction','PATCH',{reaction:'love',revision:0})).status===404,'Otro grupo tampoco puede reaccionar por la API')
  for(const width of [1440,768,375,320]){
   await author.bringToFront();await author.setViewportSize({width,height:1000});await bar(author).getByRole('button',{name:'Me encanta: 0',exact:true}).scrollIntoViewIfNeeded()
   check(await author.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Reacciones sin desbordamiento a '+width+'px')
   check(await bar(author).getByRole('button',{name:'Me encanta: 0',exact:true}).evaluate(b=>b.getBoundingClientRect().height>=44),'Control táctil cómodo a '+width+'px')
  }
  const stored=await author.evaluate(()=>JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]))
  check(!stored.includes(secret)&&!stored.includes(fixture.accounts.author.email),'No guarda credenciales en almacenamiento del navegador')
  const current=(await call(coordination,'/posts')).data.posts.find(post=>post.id===fixture.postId)
  check((await call(coordination,'/posts/'+fixture.postId+'/undo','POST',{revision:current.revision})).status===200,'Coordinación puede devolver la historia a revisión')
  await refresh(author);await bar(author).waitFor({state:'hidden'});check(true,'Historia oculta ya no presenta reacciones al alumno')
  check(errors.length===0,'Sin errores de ejecución JavaScript')
  return {browserLabel,checks:details.length,details,errors}
 }catch(error){throw Error(error.message+'\nCompletadas: '+details.length+'\n'+details.join('\n'))}
 finally{for(const release of releases)release();for(const context of contexts)await context.close()}
}

