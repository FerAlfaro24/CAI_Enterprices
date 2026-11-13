/** Ejecutar solo con challenges-browser-server: cuentas y progreso ficticios. */
export async function checkConnectedChallenges(page,{admin,fixture,browserLabel='Prueba',baseURL='http://127.0.0.1:4180',screenshotDir}={}){
 const contexts=[],details=[],errors=[],releases=[]
 const check=(ok,label)=>{if(!ok)throw Error(label);details.push(label)}
 const secret='Frase ficticia de retos navegador 2026'
 const open=async()=>{const context=await page.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});contexts.push(context);const target=await context.newPage();target.setDefaultTimeout(10000);target.on('pageerror',error=>errors.push(String(error)));return target}
 const call=(target,path,method='GET',data,key)=>target.evaluate(async({path,method,data,key})=>{const r=await fetch('/api/local'+path,{method,headers:{...(data===undefined?{}:{'Content-Type':'application/json'}),...(key?{'Idempotency-Key':key}:{})},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,data:await r.json()}},{path,method,data,key})
 const login=async(target,account)=>{await target.bringToFront();await target.goto(baseURL+'/login');await target.locator('#login-email').fill(account.email);await target.locator('#login-password').fill(secret);await target.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await target.getByRole('button',{name:'Actualizar comunidad',exact:true}).waitFor()}
 const retos=async target=>{await target.bringToFront();await target.getByRole('navigation',{name:'Secciones de comunidad'}).getByRole('button',{name:'Retos',exact:true}).click();await target.getByRole('heading',{name:'Pequeños retos. Inglés que se queda.',exact:true}).waitFor()}
 const quiz=target=>target.getByRole('region',{name:'Reto del día compartido',exact:true})
 const refresh=async target=>{await target.bringToFront();const response=target.waitForResponse(r=>r.url().endsWith('/student/challenges')&&r.request().method()==='GET');await target.getByRole('button',{name:'Actualizar comunidad',exact:true}).click();await response;await target.getByRole('button',{name:'Actualizar comunidad',exact:true}).waitFor()}
 const shot=async(target,name)=>{if(screenshotDir){await target.evaluate(()=>document.fonts.ready);await target.screenshot({path:screenshotDir+'/'+browserLabel+'-'+name+'.png',fullPage:true})}}
 try{
  if(!fixture?.accounts?.author?.email?.endsWith('-challenges@example.test'))throw Error('Se requiere la fixture exclusiva de retos.')
  const author=await open(),peer=await open(),coordination=await open(),stale=await open()
  await login(author,fixture.accounts.author)
  const preview=author.getByRole('region',{name:'Un intento. Algo nuevo.',exact:true})
  check(await preview.getByRole('button',{name:'Practicar hoy',exact:true}).isVisible(),'Inicio ofrece practicar los tres retos reales')
  check((await call(author,'/student/challenges')).data.items.every(q=>q.attempt===null),'Hoy empieza sin respuestas propias')
  const data=(await call(author,'/student/challenges')).data
  check(!JSON.stringify(data.items).includes('correctIndex')&&!JSON.stringify(data.items).includes('explanation'),'No recibe soluciones antes de responder')
  check(data.items.length===3&&data.day===fixture.day,'Tres áreas diarias con fecha controlada por el servidor')
  await retos(author)
  check(await author.getByRole('navigation',{name:'Preguntas de hoy',exact:true}).getByRole('button').count()===3,'Navegación muestra las tres preguntas')
  check((await author.getByRole('region',{name:'Tu progreso en los retos',exact:true}).innerText()).includes('9 días seguidos'),'Progreso persistido de nueve días previos')
  await quiz(author).getByRole('button',{name:'¡Comprobar!',exact:true}).click();await quiz(author).getByRole('alert').waitFor()
  check(await quiz(author).getByRole('radio').first().evaluate(input=>document.activeElement===input),'Sin opción seleccionada devuelve el foco a la pregunta')
  const wrong=(fixture.correct[0]+1)%3
  await quiz(author).getByRole('radio').nth(wrong).check();await quiz(author).getByRole('button',{name:'¡Comprobar!',exact:true}).click()
  await quiz(author).getByRole('status').filter({hasText:'Respuesta incorrecta'}).waitFor()
  check((await quiz(author).innerText()).includes('Otro ejemplo:'),'Un error muestra explicación y ejemplo nuevo')
  check((await quiz(author).innerText()).includes('+5 puntos · 5 por participar'),'Se reconoce el intento sin penalizar errores')
  check(await quiz(author).getByRole('status').evaluate(node=>node===document.activeElement),'El resultado recibe el foco después de guardar')
  check(await quiz(author).getByRole('radio').first().isDisabled(),'No se puede responder dos veces desde la pantalla')
  const firstQuestion=data.items[0],after=(await call(author,'/student/challenges')).data
  check(after.progress.points===410&&after.progress.todayAnswered===1,'Primera respuesta suma una sola vez sobre el historial')
  await author.reload();await retos(author)
  await author.getByRole('navigation',{name:'Preguntas de hoy'}).getByRole('button',{name:/^Pregunta 1:/}).click()
  check((await quiz(author).innerText()).includes('Respuesta incorrecta'),'El resultado y explicación sobreviven a la recarga')
  await login(peer,fixture.accounts.peer);await retos(peer)
  check((await call(peer,'/student/challenges')).data.progress.points===0,'Otro alumno conserva su progreso independiente')
  check(!JSON.stringify((await call(peer,'/student/challenges')).data.items).includes('correctIndex'),'No comparte soluciones ajenas')
  await author.bringToFront();await author.getByRole('button',{name:'Siguiente pregunta',exact:true}).click()
  await quiz(author).getByRole('radio').nth(fixture.correct[1]).check();await quiz(author).getByRole('button',{name:'¡Comprobar!',exact:true}).click();await quiz(author).getByRole('status').filter({hasText:'¡Respuesta correcta!'}).waitFor()
  check((await quiz(author).innerText()).includes('+15 puntos'),'Un acierto reconoce participación y respuesta correcta')
  await author.getByRole('button',{name:'Siguiente pregunta',exact:true}).click();await quiz(author).getByRole('radio').nth(fixture.correct[2]).check();await quiz(author).getByRole('button',{name:'¡Comprobar!',exact:true}).click();await author.getByRole('heading',{name:'¡Por hoy, misión cumplida!',exact:true}).waitFor()
  const finished=(await call(author,'/student/challenges')).data
  check(finished.progress.points===440&&finished.progress.todayAnswered===3&&finished.progress.currentStreak===10,'Completar el día suma 35 puntos y prolonga constancia')
  check((await quiz(author).innerText()).includes('Tu respuesta está guardada'),'La explicación permanece visible al completar el día')
  await author.getByRole('button',{name:'Ver mis respuestas anteriores',exact:true}).click();await author.getByRole('region',{name:'Mi cuaderno de repaso'}).locator('details').first().waitFor()
  const history=author.getByRole('region',{name:'Mi cuaderno de repaso'})
  check(await history.locator('details').count()===20,'Cuaderno carga veinte preguntas por página')
  await history.getByRole('button',{name:'Ver más respuestas',exact:true}).click();await author.waitForFunction(()=>document.querySelectorAll('section[aria-label="Mi cuaderno de repaso"] details').length===30)
  check(await history.locator('details').count()===fixture.historyCount+3,'Carga el resto del historial sin duplicados')
  await history.locator('summary').last().click();check((await history.locator('details').last().innerText()).includes('Otro ejemplo:'),'Permite repasar explicación y ejemplo de días anteriores')
  await shot(author,'student-desktop')
  await coordination.bringToFront();await coordination.goto(baseURL+'/admin/retos');await coordination.locator('#login-email').fill(admin.email);await coordination.locator('#login-password').fill(secret);await coordination.getByRole('button',{name:'Entrar al panel',exact:true}).click();await coordination.getByRole('heading',{name:'Retos de inglés',exact:true}).waitFor()
  await coordination.getByLabel('Fecha del reto',{exact:true}).fill(fixture.day);await coordination.getByLabel('Grupo de los retos',{exact:true}).selectOption(String(fixture.groupId));await coordination.getByRole('article').filter({hasText:'Gramática'}).waitFor()
  check(await coordination.getByRole('article').count()===3,'Coordinación ve el calendario de tres preguntas por grupo')
  check(await coordination.getByRole('article').first().getByRole('combobox').isDisabled(),'Las preguntas con respuestas no permiten sustituir contenido')
  await coordination.getByRole('button',{name:'Pausar todos los retos',exact:true}).click();await coordination.getByRole('button',{name:'Activar los retos',exact:true}).waitFor();await refresh(peer)
  check(await quiz(peer).getByRole('button',{name:'¡Comprobar!',exact:true}).isDisabled(),'Pausa global desactiva nuevas respuestas')
  check((await peer.getByText('Coordinación pausó los retos.',{exact:false}).count())>0,'La pausa se explica al alumno')
  await author.bringToFront();await refresh(author);check((await call(author,'/student/challenges/history')).data.items.length===20,'Pausa conserva historial y repaso')
  await coordination.bringToFront();await coordination.getByRole('button',{name:'Activar los retos',exact:true}).click();await coordination.getByRole('button',{name:'Pausar todos los retos',exact:true}).waitFor()
  await coordination.getByRole('button',{name:'Banco de preguntas',exact:true}).click();await coordination.getByLabel('Buscar tema o pregunta',{exact:true}).waitFor()
  check(await coordination.getByRole('list',{name:'Preguntas del banco'}).getByRole('listitem').count()===12,'Banco paginado para revisar sin saturar el panel')
  await coordination.getByLabel('Buscar tema o pregunta',{exact:true}).fill('Borrow y lend')
  check(await coordination.getByRole('list',{name:'Preguntas del banco'}).getByRole('listitem').count()===4,'Buscar una confusión encuentra sus cuatro contextos')
  await coordination.getByLabel('Buscar tema o pregunta',{exact:true}).fill('');const grammarCount=(await call(coordination,'/challenges/bank')).data.items.filter(q=>q.lane==='grammar').length;await coordination.getByLabel('Filtrar por área',{exact:true}).selectOption('grammar')
  check((await coordination.getByText(grammarCount+' preguntas encontradas',{exact:true}).count())===1,'Filtro separa las sesenta preguntas de gramática')
  await coordination.getByRole('button',{name:'Crear pregunta',exact:true}).click();const editor=coordination.getByRole('region',{name:'Crear pregunta',exact:true});await editor.getByLabel('Tema',{exact:true}).waitFor()
  check(await editor.getByLabel('Tema',{exact:true}).evaluate(input=>input===document.activeElement),'Nueva pregunta lleva el foco a su formulario')
  const topic='Práctica ficticia '+browserLabel
  await editor.getByLabel('Tema',{exact:true}).fill(topic);await editor.getByLabel('Pregunta',{exact:true}).fill('She ___ at home every Friday.');await editor.getByLabel('Opción 1',{exact:true}).fill('studies');await editor.getByLabel('Opción 2',{exact:true}).fill('study');await editor.getByLabel('Opción 3',{exact:true}).fill('studying');await editor.getByLabel('Explicación en español',{exact:true}).fill('Con she usamos la terminación -s o -es en presente simple afirmativo.');await editor.getByLabel('Otro ejemplo con traducción',{exact:true}).fill('He studies at night. = Él estudia de noche.');await editor.getByText('Vista previa con solución',{exact:true}).click()
  check((await editor.locator('details').innerText()).includes('studies ✓ Correcta'),'Coordinación puede previsualizar solución y explicación')
  await editor.getByRole('button',{name:'Guardar pregunta',exact:true}).click();await editor.waitFor({state:'hidden'})
  let bank=(await call(coordination,'/challenges/bank')).data.items,newItem=bank.find(q=>q.topic===topic)
  check(newItem.status==='draft','Crear conserva inicialmente como borrador privado')
  await coordination.getByLabel('Buscar tema o pregunta',{exact:true}).fill(topic);await coordination.getByRole('button',{name:'Editar pregunta '+newItem.id,exact:true}).click();const editing=coordination.getByRole('region',{name:'Editar pregunta',exact:true})
  await editing.getByLabel('Disponibilidad',{exact:true}).selectOption('ready');await editing.getByRole('button',{name:'Guardar pregunta',exact:true}).click();await editing.waitFor({state:'hidden'});bank=(await call(coordination,'/challenges/bank')).data.items;newItem=bank.find(q=>q.id===newItem.id)
  check(newItem.status==='ready'&&newItem.revision===2,'Revisión permite dejar lista una pregunta')
  await coordination.getByRole('button',{name:'Calendario',exact:true}).click();const future=browserLabel==='Brave'?'2026-11-13':'2026-11-14'
  await coordination.getByLabel('Fecha del reto',{exact:true}).fill(future);await coordination.getByRole('article').first().getByRole('combobox').waitFor();let card=coordination.getByRole('article').first()
  await card.getByRole('combobox').selectOption(newItem.id);await card.getByRole('button',{name:'Usar esta pregunta',exact:true}).click();await coordination.getByText('Calendario guardado para este grupo.',{exact:true}).waitFor()
  check((await card.innerText()).includes(topic),'Calendario permite programar una pregunta para otro día')
  await coordination.reload();await coordination.getByLabel('Fecha del reto',{exact:true}).fill(future);await coordination.getByRole('article').first().getByRole('heading',{name:topic,exact:true}).waitFor();check(true,'La programación persiste al recargar')
  card=coordination.getByRole('article').first();await card.getByRole('button',{name:'Pausar pregunta',exact:true}).click();await card.getByRole('button',{name:'Reactivar pregunta',exact:true}).waitFor();check(true,'Permite pausar una pregunta para un grupo y día concretos')
  await card.getByRole('button',{name:'Reactivar pregunta',exact:true}).click();await card.getByRole('button',{name:'Pausar pregunta',exact:true}).waitFor()
  check(!(await (await call(peer,'/student/challenges')).data.items.some(q=>q.question==='She ___ at home every Friday.')),'El alumno no recibe preguntas programadas para el futuro')
  await shot(coordination,'admin-desktop')
  // Respuesta recibida por servidor, pero respuesta de red perdida: conservar clave al reintentar.
  await refresh(peer);await peer.bringToFront();await login(stale,fixture.accounts.peer);await retos(stale)
  let attempts=0;const route='**/api/local/student/challenges/*/answer'
  const lost=async interception=>{attempts++;if(attempts===1){await interception.fetch();await interception.abort('failed')}else await interception.continue()}
  await peer.route(route,lost);releases.push(()=>peer.unroute(route,lost))
  await quiz(peer).getByRole('radio').nth(fixture.correct[0]).check();await quiz(peer).getByRole('button',{name:'¡Comprobar!',exact:true}).click();await quiz(peer).getByRole('alert').waitFor()
  check(await quiz(peer).getByRole('radio').nth(fixture.correct[0]).isChecked(),'Error de red conserva la opción elegida')
  await quiz(peer).getByRole('button',{name:'¡Comprobar!',exact:true}).click();await quiz(peer).getByRole('status').filter({hasText:'¡Respuesta correcta!'}).waitFor()
  check((await call(peer,'/student/challenges')).data.progress.points===15&&attempts===2,'Reintento tras respuesta perdida no duplica puntos')
  await stale.bringToFront();await quiz(stale).getByRole('radio').nth((fixture.correct[0]+1)%3).check();await quiz(stale).getByRole('button',{name:'¡Comprobar!',exact:true}).click();await quiz(stale).getByRole('status').filter({hasText:'¡Respuesta correcta!'}).waitFor()
  check((await call(stale,'/student/challenges')).data.progress.points===15,'Otra ventana recibe el resultado vigente ante conflicto')
  check((await call(author,'/challenges/bank')).status===401,'Alumno no puede leer el banco administrativo')
  check((await call(author,'/student/challenges/'+firstQuestion.id+'/answer','POST',{revision:firstQuestion.revision,answerIndex:0},crypto.randomUUID())).status===409,'La respuesta completada tampoco se duplica por acceso directo')
  for(const width of [1440,768,375,320]){
   await author.bringToFront();await author.setViewportSize({width,height:1000});check(await author.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Retos y repaso sin desbordamiento a '+width+'px')
   await coordination.bringToFront();await coordination.setViewportSize({width,height:1000});check(await coordination.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Calendario administrativo sin desbordamiento a '+width+'px')
  }
  await shot(author,'student-mobile');await shot(coordination,'admin-mobile')
  await coordination.getByRole('button',{name:'Banco de preguntas',exact:true}).click();await coordination.getByRole('button',{name:'Crear pregunta',exact:true}).click();check(await coordination.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Editor y banco caben a 320px');await shot(coordination,'editor-mobile')
  const stored=await author.evaluate(()=>JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]));check(!stored.includes(secret)&&!stored.includes(fixture.accounts.author.email)&&!stored.includes(firstQuestion.question),'No guarda credenciales o respuestas en storage del navegador')
  check(errors.length===0,'Sin errores de ejecución JavaScript')
  return {browserLabel,checks:details.length,details,errors}
 }catch(error){const pages=await Promise.all(contexts.flatMap(context=>context.pages()).map(async target=>({path:new URL(target.url()).pathname,alerts:await target.getByRole('alert').allTextContents()})));throw Error(error.message+'\nCompletadas: '+details.length+'\n'+JSON.stringify(pages)+'\n'+details.join('\n'))}
 finally{for(const release of releases)await release();for(const context of contexts)await context.close()}
}
