/** Focused acceptance tests; each browser receives a fresh synthetic showcase. */
export async function checkCommunityFeedback(browser,{baseURL,ordinary,history,answers,filesDir,browserLabel}) {
 const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'es-MX',reducedMotion:'reduce'}),page=await context.newPage(),results=[],errors=[]
 context.setDefaultTimeout(12000)
 let expectedFailure=false
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!expectedFailure)errors.push(m.text())})
 const check=(v,label)=>{if(!v)throw Error(label);results.push(label)}
 const call=async(path,method='GET',data)=>{const r=await context.request.fetch(baseURL+'/api/local'+path,{method,data,headers:{Origin:baseURL}});if(!r.ok())throw Error(path+': '+r.status());return r.json()}
 const inbox=async()=> (await call('/student/notices')).notices
 const open=async()=>{await page.getByRole('button',{name:/^Mis notificaciones/}).click();const d=page.getByRole('dialog',{name:'Mis notificaciones',exact:true});await d.waitFor();return d}
 const settled=async()=>{await page.waitForFunction(()=>!document.querySelector('dialog [aria-label="Cerrar notificaciones"]:disabled'))}
 const shot=async(name)=>{await page.screenshot({path:filesDir+'/'+browserLabel+'-feedback-'+name+'.png'})}
 try {
  await call('/student/login','POST',{email:'bob@example.test',password:'Frase ficticia para fotos oficiales 2026'});await page.goto(baseURL+'/community');await page.getByRole('heading',{name:'Tu comunidad, al día.',exact:true}).waitFor()
  // The post stays open underneath a native, focus-contained image viewer.
  await page.getByRole('button',{name:'Celebramos en comunidad',exact:true}).click()
  const post=page.getByRole('dialog',{name:'Publicación: Celebramos en comunidad',exact:true});await post.waitFor()
  check(await post.locator('figure img').first().evaluate(e=>getComputedStyle(e).objectFit==='contain'),'La vista de publicación muestra la foto completa')
  const thumb=post.getByRole('button',{name:/^Ampliar imagen/});await thumb.click()
  let viewer=page.getByRole('dialog',{name:'Imagen 1 de 3',exact:true});await viewer.waitFor()
  check(await viewer.locator('img').evaluate(async e=>{await e.decode();return e.naturalWidth>0&&getComputedStyle(e).objectFit==='contain'}),'El visor carga la imagen autorizada completa, sin recorte')
  await page.keyboard.press('ArrowRight');viewer=page.getByRole('dialog',{name:'Imagen 2 de 3',exact:true});await viewer.waitFor();check(true,'Flecha derecha cambia de fotografía')
  await viewer.getByRole('button',{name:'Siguiente',exact:true}).click();viewer=page.getByRole('dialog',{name:'Imagen 3 de 3',exact:true});await viewer.waitFor();await viewer.getByRole('button',{name:'Siguiente',exact:true}).click();await page.getByRole('dialog',{name:'Imagen 1 de 3',exact:true}).waitFor();check(true,'Controles recorren las tres imágenes y vuelven a la primera')
  await page.keyboard.press('ArrowLeft');await page.getByRole('dialog',{name:'Imagen 3 de 3',exact:true}).waitFor();await page.keyboard.press('Escape')
  check(await post.isVisible()&&await thumb.evaluate(e=>e===document.activeElement),'Escape cierra solo la imagen y devuelve el foco a la publicación')
  check((await thumb.getAttribute('aria-label')).includes('3 de 3'),'Al cerrar se conserva la foto seleccionada')
  await page.keyboard.press('Escape')
  // Unread snapshots remain unread throughout the open dialog.
  let dialog=await open();check(await dialog.getByRole('button',{name:/^Sin leer/}).getAttribute('aria-pressed')==='true','La bandeja abre en Sin leer')
  const item=dialog.locator(`[data-notice-id="${ordinary}"]`)
  check(await item.isVisible()&&await item.getByRole('button',{name:/Marcar leído/}).count()===0,'La notificación ordinaria no tiene un botón de lectura')
  check((await inbox()).find(n=>n.id===ordinary).read===false,'Abrir la bandeja no archiva automáticamente')
  check(await dialog.locator('[data-important=true][data-unread=true]').getByRole('button',{name:/Marcar leído/}).count()>=2,'Los avisos de CAI y de cuenta sí requieren confirmación')
  await dialog.getByRole('button',{name:/^Historial/}).click();check(await dialog.locator('[data-notice-id]').count()===history.length,'Historial contiene solo las ya leídas');check((await inbox()).find(n=>n.id===ordinary).read===false,'Cambiar de pestaña tampoco archiva antes de cerrar')
  // A failed close keeps the dialog and all unread records available for retry.
  await page.route('**/api/local/student/notices/archive-viewed',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Fallo controlado de prueba'})}));expectedFailure=true
  await dialog.getByRole('button',{name:'Cerrar notificaciones',exact:true}).click();await dialog.getByRole('alert').waitFor();await settled()
  check(await dialog.isVisible()&&!(await inbox()).find(n=>n.id===ordinary).read,'Un fallo al cerrar mantiene la bandeja y la notificación sin leer')
  await page.unroute('**/api/local/student/notices/archive-viewed');await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});expectedFailure=false
  check((await inbox()).find(n=>n.id===ordinary).read,'Cerrar con éxito pasa las ordinarias vistas a Historial')
  check((await inbox()).filter(n=>n.important).every(n=>!n.read),'Cerrar conserva sin leer todos los avisos importantes')
  dialog=await open();check(await dialog.getByRole('button',{name:/^Sin leer/}).getAttribute('aria-pressed')==='true','Cada apertura vuelve a Sin leer')
  await dialog.getByRole('button',{name:/^Historial/}).click();await dialog.getByRole('button',{name:'Eliminar del historial: Historial de prueba 1',exact:true}).click();await page.waitForFunction(id=>!document.querySelector(`[data-notice-id="${id}"]`),history[0]);check(!(await inbox()).some(n=>n.id===history[0]),'La tachita elimina una notificación del historial')
  await dialog.getByRole('button',{name:'Vaciar historial',exact:true}).click();let confirmation=page.getByRole('dialog',{name:'¿Vaciar el historial?',exact:true});await confirmation.waitFor();check(await confirmation.getByText(/No podrás recuperarlas/).isVisible(),'Vaciar muestra una advertencia y pide confirmación')
  await confirmation.getByRole('button',{name:'Cancelar',exact:true}).click();check((await inbox()).some(n=>n.id===history[1]),'Cancelar conserva el historial')
  await dialog.getByRole('button',{name:'Vaciar historial',exact:true}).click();await page.keyboard.press('Escape');check(await dialog.isVisible()&&await page.getByRole('dialog',{name:'¿Vaciar el historial?',exact:true}).count()===0,'Escape en la confirmación no cierra las notificaciones')
  await dialog.getByRole('button',{name:'Vaciar historial',exact:true}).click();confirmation=page.getByRole('dialog',{name:'¿Vaciar el historial?',exact:true});await confirmation.getByRole('button',{name:'Sí, vaciar historial',exact:true}).click();await confirmation.waitFor({state:'hidden'});check((await inbox()).every(n=>!n.read),'Confirmar vacía solo el historial y conserva lo pendiente')
  await dialog.getByRole('button',{name:/^Sin leer/}).click();const importantItem=dialog.locator('[data-important=true][data-unread=true]').first();const importantId=Number(await importantItem.getAttribute('data-notice-id'));await importantItem.getByRole('button',{name:/Marcar leído/}).click();await page.waitForFunction(id=>!document.querySelector(`[data-notice-id="${id}"]`),importantId);check((await inbox()).find(n=>n.id===importantId).read,'Marcar leído mueve el aviso importante al historial')
  await dialog.getByRole('button',{name:'Cerrar notificaciones',exact:true}).click();await dialog.waitFor({state:'hidden'})
  // Real persisted answers: correct / incorrect / correct.
  await page.getByRole('navigation',{name:'Secciones de comunidad'}).getByRole('button',{name:'Retos',exact:true}).click()
  const mission=page.getByRole('navigation',{name:'Preguntas de hoy',exact:true})
  check(await mission.locator('[data-result=pending]').count()===3,'Los retos sin responder siguen numerados')
  for(let i=0;i<3;i++){
   await mission.getByRole('button').nth(i).click();const form=page.getByRole('form',{name:/^Reto /});const index=i===1?(answers[i]+1)%await form.getByRole('radio').count():answers[i];await form.getByRole('radio').nth(index).check();await form.getByRole('button',{name:/¡Comprobar!/}).click();await form.getByRole('status').waitFor();if(await page.getByRole('dialog').count())await page.keyboard.press('Escape');check(await mission.getByRole('button').nth(i).getAttribute('data-result')===(i===1?'incorrect':'correct'),'Resultado real persistido en el paso '+(i+1))
  }
  check(await mission.locator('[data-result=incorrect]').count()===1&&await mission.locator('[data-result=correct]').count()===2,'La misión distingue un error y dos aciertos')
  check(await mission.getByRole('button').nth(1).getAttribute('aria-label').then(v=>v.includes('Respuesta incorrecta')),'El error también se anuncia al lector de pantalla')
  check(await page.getByRole('progressbar',{name:'Preguntas completadas hoy'}).getAttribute('aria-valuenow')==='3','La misión conserva 3 de 3 intentadas')
  const data=await call('/student/challenges');check(data.progress.points===35,'La puntuación real sigue siendo 35: dos aciertos y una participación')
  await page.reload();await page.getByRole('navigation',{name:'Secciones de comunidad'}).getByRole('button',{name:'Retos',exact:true}).click();await mission.waitFor();check(await mission.getByRole('button').nth(1).getAttribute('data-result')==='incorrect','La tachita persiste al recargar')
  // Responsive, light/dark, focus and touch sizes on all affected views.
  for(const theme of ['Modo claro','Modo oscuro']){
   await page.getByRole('button',{name:theme,exact:true}).click()
   for(const width of [1440,768,375,320]){
    await page.setViewportSize({width,height:950});check(await mission.getByRole('button').nth(1).locator('span').first().evaluate(e=>getComputedStyle(e).backgroundColor==='rgb(170, 57, 62)'),'Error rojo '+theme+' '+width)
    await page.getByRole('navigation',{name:'Secciones de comunidad'}).getByRole('button',{name:'Inicio',exact:true}).click();await page.getByRole('button',{name:'Celebramos en comunidad',exact:true}).click();await post.getByRole('button',{name:/^Ampliar foto de/}).click();viewer=page.getByRole('dialog',{name:'Imagen 1 de 3',exact:true});await viewer.waitFor()
    check(await viewer.evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.getBoundingClientRect().width<=innerWidth),'Visor sin desbordamiento '+theme+' '+width)
    check(await viewer.getByRole('button').evaluateAll(nodes=>nodes.every(n=>n.getBoundingClientRect().height>=44)),'Controles de foto táctiles '+theme+' '+width)
    const controls=viewer.getByRole('button');await controls.last().focus();await page.keyboard.press('Tab');check(await controls.first().evaluate(e=>e===document.activeElement),'Foco contenido en el visor '+theme+' '+width)
    if(width===375)await shot(theme==='Modo claro'?'photo-light':'photo-dark')
    await page.keyboard.press('Escape');await page.keyboard.press('Escape');dialog=await open();await dialog.getByRole('button',{name:/^Historial/}).click()
    check(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.getBoundingClientRect().width<=innerWidth),'Notificaciones sin desbordamiento '+theme+' '+width)
    if(width===375)await shot(theme==='Modo claro'?'history-light':'history-dark')
    await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});await page.getByRole('navigation',{name:'Secciones de comunidad'}).getByRole('button',{name:'Retos',exact:true}).click();await mission.waitFor()
    if(width===375)await shot(theme==='Modo claro'?'mission-light':'mission-dark')
   }
  }
  check(errors.length===0,'Sin errores de JavaScript ni consola inesperados'+(errors.length?': '+errors.join('; '):''))
  return {browser:browserLabel,checks:results.length,results,errors}
 } catch(error){await shot('failure');throw Error('Tras '+results.at(-1)+'; '+error.message+'; consola: '+errors.join('; '))} finally {await context.close()}
}
