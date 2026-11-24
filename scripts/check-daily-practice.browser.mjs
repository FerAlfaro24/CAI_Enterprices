/** F5: aprendizaje diario con cuentas ficticias y datos reales de una API aislada. */
export async function checkDailyPractice(page,{baseURL,email,password,fixture,filesDir,browserLabel='brave',rollover=false}) {
 if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(baseURL)||!fixture.author.endsWith('@example.test'))throw Error('Solo QA ficticia local.')
 const browser=page.context().browser(),author=await browser.newContext({viewport:{width:1440,height:1000},locale:'es-MX',timezoneId:'Asia/Tokyo',reducedMotion:'no-preference'}),peer=await browser.newContext({locale:'es-MX',reducedMotion:'reduce'}),admin=await browser.newContext(),p=await author.newPage(),results=[],errors=[]
 let expectedFailure=false,failedOnce=false
 await author.addInitScript(()=>{Date.now=()=>946684800000})
 p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!(expectedFailure&&m.text().includes('503')))errors.push(m.text())})
 const check=(ok,label)=>{if(!ok)throw Error(label);results.push(label)}
 const api=async(c,path,method='GET',data)=>{const r=await c.request.fetch(baseURL+'/api/local'+path,{method,data,headers:{Origin:baseURL}});if(!r.ok())throw Error(path+' HTTP '+r.status()+': '+await r.text());return r.json()}
 const open=async(target=p)=>{await target.goto(baseURL+'/community');await target.getByRole('navigation',{name:'Secciones de comunidad'}).getByRole('button',{name:'Retos',exact:true}).click();await target.getByRole('heading',{name:'Pequeños retos. Inglés que se queda.',exact:true}).waitFor()}
 const quiz=()=>p.getByRole('region',{name:'Reto del día compartido',exact:true}),mission=()=>p.getByRole('region',{name:'Tu progreso en los retos',exact:true}),nav=()=>p.getByRole('navigation',{name:'Preguntas de hoy',exact:true}),history=()=>p.getByRole('region',{name:'Mi cuaderno de repaso',exact:true})
 const choose=async(slot,index)=>{await nav().getByRole('button',{name:new RegExp('^Pregunta '+(slot+1)+':')}).click();await quiz().getByRole('radio').nth(index).check()}
 const submit=async(correct)=>{await quiz().getByRole('button',{name:'¡Comprobar!',exact:true}).click();await quiz().getByRole('status').filter({hasText:correct?'¡Respuesta correcta!':'Respuesta incorrecta.'}).waitFor()}
 try {
  await api(author,'/student/login','POST',{email:fixture.author,password});await api(peer,'/student/login','POST',{email:fixture.peer,password});await api(admin,'/auth/login','POST',{email,password})
  const before=await api(author,'/student/challenges');await open()
  check(await p.getByRole('region',{name:'Renovación de los retos',exact:true}).getByText(/hora de Ciudad de México/).isVisible(),'Explica medianoche CDMX aunque el dispositivo esté en Tokio')
  check(await p.getByText(/^Próximos retos: en /).isVisible(),'Renovación usa el servidor aunque Date.now del dispositivo sea incorrecto')
  check(await p.getByText('Ya cambió el día de práctica.',{exact:false}).count()===0,'El reloj local equivocado no bloquea la práctica')
  if(rollover){
   check(before.day==='2026-11-25'&&before.progress.todayAnswered===0,'Cambió el día CDMX y la misión empieza en cero')
   check(before.progress.points===fixture.previousPoints+35&&before.progress.completedDays===2,'Conserva puntos y días completados después de medianoche')
   check(await mission().getByText('0',{exact:true}).isVisible(),'El marcador diario muestra cero en el día nuevo')
   check(await nav().locator('[data-result=pending]').count()===3,'Las tres actividades nuevas están por responder')
   check(!JSON.stringify(before.items).includes('correctIndex'),'Las nuevas preguntas no revelan respuestas')
   await p.getByRole('button',{name:'Ver mis respuestas anteriores',exact:true}).click();await history().locator('details').first().waitFor();check(await history().locator('details').count()===6,'El cuaderno conserva las seis respuestas anteriores')
   await history().getByRole('button',{name:'Para repasar',exact:true}).click();check(await history().locator('details').count()===1,'El filtro sigue encontrando el error del día anterior')
   const old=await api(author,'/student/challenges/history'),q=old.items[0];const stale=await author.request.post(baseURL+'/api/local/student/challenges/'+q.id+'/answer',{data:{revision:q.revision,answerIndex:0},headers:{Origin:baseURL,'Idempotency-Key':crypto.randomUUID()}})
   check(stale.status()===409,'Una actividad de ayer no admite otro intento');check((await api(author,'/student/challenges')).progress.points===fixture.previousPoints+35,'Intento antiguo no duplica puntos')
  }else{
   check(before.items.length===3&&before.items.every(q=>!q.attempt),'Hay tres actividades reales sin responder')
   check(await mission().getByText('0',{exact:true}).isVisible()&&(await mission().innerText()).includes('Tu acumulado: '+fixture.previousPoints+' puntos'),'Separa cero puntos de hoy del acumulado previo')
   await p.getByText('¿Cómo funcionan las tres actividades?',{exact:true}).click();check(await p.getByText('Lee la explicación. Repasar no cambia tu respuesta ni vuelve a sumar puntos.',{exact:true}).isVisible(),'Explica intento único, puntos y repaso')
   await quiz().getByRole('button',{name:'¡Comprobar!',exact:true}).click();await quiz().getByRole('alert').waitFor();check(await quiz().getByRole('radio').first().evaluate(e=>e===document.activeElement),'Sin elección pide una opción y devuelve el foco')
   await quiz().getByRole('radio').first().focus();await p.keyboard.press('ArrowRight');check(await quiz().getByRole('radio').nth(1).isChecked(),'Opciones responden al teclado')
   await p.route('**/student/challenges/*/answer',async route=>{if(!failedOnce){failedOnce=true;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Fallo ficticio al guardar'})})}else await route.continue()})
   expectedFailure=true;await choose(0,fixture.correct[0]);await quiz().getByRole('button',{name:'¡Comprobar!',exact:true}).click();await quiz().getByRole('alert').waitFor()
   check((await api(author,'/student/challenges')).progress.todayAnswered===0,'Un fallo al guardar conserva cero respuestas')
   check(await p.locator('[data-celebration]').count()===0,'No celebra una respuesta que no se guardó')
   check(await quiz().getByRole('radio').nth(fixture.correct[0]).isChecked(),'Conserva la opción para reintentar sin perderla')
   expectedFailure=false;await submit(true);check((await api(author,'/student/challenges')).progress.points===fixture.previousPoints+15,'Un acierto suma15 una sola vez al reintentar')
   check(await quiz().getByRole('status').evaluate(e=>e===document.activeElement),'Resultado confirmado recibe el foco')
   check(await quiz().getByText('+15',{exact:true}).isVisible(),'Muestra el premio confirmado en grande')
   check(await quiz().locator('[data-celebration]').count()===1,'Acierto confirmado tiene celebración local')
   check(await quiz().getByRole('radio').first().isDisabled(),'Respuesta guardada bloquea otro intento')
   const wrong=(fixture.correct[1]+1)%before.items[1].options.length
   await p.getByRole('button',{name:'Siguiente actividad: Vocabulario',exact:true}).click();await p.waitForFunction(()=>document.getElementById('daily-question')===document.activeElement);check(await p.getByRole('region',{name:'Actividad seleccionada',exact:true}).evaluate(e=>e===document.activeElement),'Continuar lleva el foco a la actividad siguiente')
   await quiz().getByRole('radio').nth(wrong).check();await submit(false)
   check(await quiz().getByText('+5',{exact:true}).isVisible(),'Error suma5 y no se presenta como acierto')
   check(await quiz().locator('[data-result=incorrect]').count()>0&&await nav().locator('[data-result=incorrect]').count()===1,'Error marcado con estado rojo en resultado y recorrido')
   check(await quiz().locator('[data-celebration]').count()===0,'Un error no dispara confeti de acierto')
   check(await quiz().getByText(/La respuesta correcta es:/).isVisible()&&await quiz().getByText(/Otro ejemplo:/).isVisible(),'El error enseña solución y otro ejemplo')
   await p.getByRole('button',{name:'Siguiente actividad: Vida diaria',exact:true}).click();await quiz().getByRole('radio').nth(fixture.correct[2]).check();await submit(true)
   const finish=p.getByRole('region',{name:'Resultado de tu práctica de hoy',exact:true});await finish.waitFor()
   check((await api(author,'/student/challenges')).progress.points===fixture.previousPoints+35,'Día completo suma35 sobre el acumulado anterior')
   check((await finish.innerText()).includes('2 aciertos y 1 actividad para repasar'),'Resumen distingue completar de acertar')
   check(await finish.locator('[data-result=correct]').count()===2&&await finish.locator('[data-result=incorrect]').count()===1,'Resumen tiene dos aciertos y un error, no todo verde')
   check(await mission().getByRole('progressbar').getAttribute('aria-valuenow')==='3','Barra accesible refleja tres actividades completadas')
   await finish.getByRole('button',{name:/^Repasar lo que me costó/}).click();check(await quiz().getByRole('status').getAttribute('data-result')==='incorrect','Repasar abre directamente la explicación del error')
   check((await api(author,'/student/challenges')).progress.points===fixture.previousPoints+35,'Repasar no suma puntos ni cambia el resultado')
   const other=await api(peer,'/student/challenges');check(other.progress.points===0&&other.items.every(q=>!q.attempt),'Compañero conserva progreso privado independiente')
   check(JSON.stringify(other.items.map(q=>q.id))===JSON.stringify(before.items.map(q=>q.id)),'Las actividades son comunes entre clases')
   await p.getByRole('button',{name:'Ver mis respuestas anteriores',exact:true}).click();await history().locator('details').first().waitFor()
   check(await history().locator('details').count()===6,'Cuaderno muestra práctica anterior y actual')
   await history().getByRole('button',{name:'Para repasar',exact:true}).click();check(await history().locator('details').count()===1,'Filtro de repaso muestra solamente el error')
   await history().locator('summary').first().click();check(await history().getByText(/Respuesta correcta:/).isVisible(),'Repaso conserva solución y explicación privadas')
   await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>document.querySelectorAll('[data-celebration]').length===0);check(await p.locator('[data-celebration]').count()===0,'Movimiento reducido retira el confeti')
   for(const theme of ['light','dark']){await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);for(const width of [1440,768,375,320]){await p.setViewportSize({width,height:1000});check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Retos sin desbordamiento '+width+' '+theme);check(await nav().evaluate(e=>e.scrollWidth<=e.clientWidth+1),'Tres actividades legibles '+width+' '+theme)}if(filesDir)await p.screenshot({path:filesDir+'/'+browserLabel+'-practice-'+theme+'.png'})}
   await p.setViewportSize({width:1440,height:1000});if(filesDir)await p.screenshot({path:filesDir+'/'+browserLabel+'-practice-desktop.png'})
   await open();check(await p.locator('[data-celebration]').count()===0,'Recargar no vuelve a celebrar respuestas anteriores')
   check(await mission().getByText('35',{exact:true}).isVisible(),'Puntos diarios y resumen sobreviven a recarga')
   const controls=await api(admin,'/challenges/controls');await api(admin,'/challenges/controls','PATCH',{revision:controls.revision,enabled:false});await p.getByRole('button',{name:'Actualizar mis retos',exact:true}).click();await p.getByText('Coordinación pausó los retos. Puedes seguir repasando tus respuestas guardadas.',{exact:true}).waitFor();check(true,'Pausa explícita conserva posibilidad de repaso')
   const peerPage=await peer.newPage();await open(peerPage);check(await peerPage.getByRole('radio').first().isDisabled(),'Pausa impide nuevos intentos de otra cuenta')
   const current=await api(admin,'/challenges/controls');await api(admin,'/challenges/controls','PATCH',{revision:current.revision,enabled:true})
  }
  check(errors.length===0,'Sin errores inesperados de ejecución/consola: '+errors.join(' | '));return {count:results.length,results,errors}
 }finally{await author.close();await peer.close();await admin.close()}
}
