/** Solo fixture student-profile-browser-server; usa exclusivamente alumnos ficticios. */
export async function checkStudentProfile(page, {fixtures, browserLabel='Prueba', baseURL='http://localhost:4180'}={}) {
  const details=[],errors=[],contexts=[],releases=[],matrix=[]
  const check=(ok,label)=>{if(!ok)throw new Error(label);details.push(label)}
  const password='Frase ficticia de perfil para navegador 2026'
  const call=(target,path,method='GET',data)=>target.evaluate(async({path,method,data})=>{const response=await fetch('/api/local'+path,{method,headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});return {status:response.status,data:await response.json()}},{path,method,data})
  const open=async who=>{const context=await page.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});contexts.push(context);const target=await context.newPage();target.setDefaultTimeout(10000);target.on('pageerror',error=>errors.push(String(error)));await target.goto(baseURL+'/login');const response=await call(target,'/student/login','POST',{email:who.email,password});check(response.status===200&&response.data.user?.displayName===who.displayName,'Sesión ficticia de alumno esperada');await target.goto(baseURL+'/community');await target.getByRole('button',{name:`Abrir mi perfil: ${who.displayName}`,exact:true}).waitFor();return target}
  const own=async target=>{await target.bringToFront();await target.getByRole('button',{name:/^Abrir mi perfil:/}).click();return target.getByRole('dialog')}
  const edit=async dialog=>{await dialog.getByRole('button',{name:'Editar mi perfil',exact:true}).click();return dialog.getByRole('form',{name:'Editar mi perfil visible',exact:true})}
  const save=form=>form.getByRole('button',{name:'Guardar mi perfil',exact:true}).click()
  try {
    if(!fixtures?.adult?.displayName?.startsWith('Prueba ')||!fixtures?.peer?.displayName?.startsWith('Prueba '))throw new Error('Se requiere una fixture aislada de perfiles.')
    const owner=await open(fixtures.adult),peer=await open(fixtures.peer),minor=await open(fixtures.minor)
    const original=(await call(owner,'/student/me')).data.user
    let dialog=await own(owner),form=await edit(dialog)
    check(await form.getByLabel('Nombre visible',{exact:true}).count()===1&&await form.getByLabel('Color del avatar',{exact:true}).count()===1,'La edición está en el perfil original con controles etiquetados')
    check(await form.locator('input,select').count()===2,'No ofrece editar correo, expediente, nacimiento, tutor o grupo')
    await form.getByLabel('Nombre visible',{exact:true}).fill('   ');await save(form);await form.getByRole('alert').filter({hasText:'Escribe un nombre visible'}).waitFor();check(true,'Validación de nombre vacío sin perder el formulario')
    const alias=`Alias ${browserLabel} `+'x'.repeat(90)
    await form.getByLabel('Nombre visible',{exact:true}).fill(alias);await form.getByLabel('Color del avatar',{exact:true}).selectOption('#5b3aa8')
    for(const width of [1440,768,375,320]){await owner.setViewportSize({width,height:1000});check(await owner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&[...document.querySelectorAll('dialog[open]')].every(el=>el.scrollWidth<=el.clientWidth+1)),`Edición con alias largo a ${width}px sin desbordamiento`);matrix.push({width,view:'profile-edit'})}
    await form.getByRole('button',{name:'Cancelar',exact:true}).click();check((await call(owner,'/student/me')).data.user.displayName===original.displayName,'Cancelar conserva los datos guardados')
    form=await edit(dialog);check(await form.getByLabel('Nombre visible',{exact:true}).inputValue()===original.displayName,'Reabrir descarta el borrador cancelado')
    await form.getByLabel('Nombre visible',{exact:true}).fill(alias);await form.getByLabel('Color del avatar',{exact:true}).selectOption('#5b3aa8')
    let requests=0,ready
    const received=new Promise(resolve=>{ready=resolve}),gate=new Promise(resolve=>releases.push(resolve)),pattern='**/api/local/student/profile'
    const hold=async route=>{if(route.request().method()!=='PATCH')return route.continue();requests++;const response=await route.fetch();ready();await gate;await route.fulfill({response})}
    await owner.route(pattern,hold);await save(form);await received
    check(await form.getByRole('button',{name:'Guardando…',exact:true}).isDisabled(),'Bloquea campos y botón mientras guarda')
    await form.evaluate(form=>form.requestSubmit());check(requests===1,'Evita duplicar el envío mientras está pendiente')
    releases[0]();await dialog.getByRole('button',{name:'Editar mi perfil',exact:true}).waitFor();await owner.unroute(pattern,hold)
    await dialog.getByRole('status').filter({hasText:'Perfil actualizado.'}).waitFor();check(await dialog.getByRole('heading',{name:alias,exact:true}).count()===1,'Confirma el guardado dentro del diálogo y muestra el alias actual')
    await dialog.getByRole('button',{name:'Cerrar perfil',exact:true}).click();check(await owner.getByRole('button',{name:`Abrir mi perfil: ${alias}`,exact:true}).evaluate(el=>el===document.activeElement),'Cerrar devuelve el foco al botón del perfil actualizado')
    await owner.reload();await owner.getByRole('button',{name:`Abrir mi perfil: ${alias}`,exact:true}).waitFor();check(true,'Alias y avatar se conservan al recargar')
    const current=(await call(owner,'/student/me')).data.user
    check(current.publicId===original.publicId&&current.name===original.name&&current.program===original.program&&current.avatarColor==='#5b3aa8','Conserva UUID, nombre legal y asignación; cambia el avatar')
    const feed=(await call(peer,'/student/posts')).data.posts,group=(await call(peer,'/student/group')).data.members
    check(feed.some(post=>post.author.id===current.publicId&&post.author.displayName===alias)&&group.some(member=>member.id===current.publicId&&member.avatarColor==='#5b3aa8'),'Otra sesión recibe el alias en publicaciones anteriores y directorio')
    await peer.bringToFront();await peer.reload();await peer.getByRole('button',{name:'Actualizar comunidad',exact:true}).waitFor()
    await peer.getByRole('button',{name:alias,exact:true}).first().click();const foreign=peer.getByRole('dialog')
    check(await foreign.getByRole('heading',{name:alias,exact:true}).count()===1&&await foreign.getByRole('button',{name:'Editar mi perfil',exact:true}).count()===0&&await foreign.getByRole('region',{name:'Mis avisos'}).count()===0,'Perfil ajeno conserva vista mínima sin edición ni avisos propios')
    await foreign.getByRole('button',{name:'Cerrar perfil',exact:true}).click()
    dialog=await own(owner);form=await edit(dialog);await form.getByLabel('Nombre visible',{exact:true}).fill('Borrador que se conserva')
    const stale=(await call(owner,'/student/profile')).data.profile
    const concurrent={revision:stale.revision,displayName:'Cambio de otra ventana ficticia',avatarColor:stale.avatarColor}
    check((await call(owner,'/student/profile','PATCH',concurrent)).status===200,'Otra ventana puede guardar con su revisión vigente')
    await save(form);await form.getByRole('alert').filter({hasText:'Tu perfil cambió'}).waitFor()
    check(await form.getByLabel('Nombre visible',{exact:true}).inputValue()==='Borrador que se conserva'&&(await call(owner,'/student/profile')).data.profile.displayName===concurrent.displayName,'Conflicto conserva borrador y no sobrescribe el otro cambio')
    await form.getByRole('button',{name:'Cargar perfil actual y descartar borrador',exact:true}).click();form=await edit(dialog)
    check(await form.getByLabel('Nombre visible',{exact:true}).inputValue()===concurrent.displayName,'Carga explícita recupera el perfil actual')
    const lostAlias='Cambio con respuesta perdida ficticia';await form.getByLabel('Nombre visible',{exact:true}).fill(lostAlias)
    let lost=0
    const lose=async route=>{if(route.request().method()!=='PATCH')return route.continue();lost++;await route.fetch();await route.abort('failed')}
    await owner.route(pattern,lose);await save(form);await form.getByRole('alert').filter({hasText:'No pudimos confirmar si se guardó'}).waitFor();await owner.unroute(pattern,lose)
    check(lost===1&&await form.getByLabel('Nombre visible',{exact:true}).inputValue()===lostAlias,'Respuesta perdida conserva el borrador sin afirmar éxito ni reintentar sola')
    await save(form);await dialog.getByRole('button',{name:'Editar mi perfil',exact:true}).waitFor();check((await call(owner,'/student/profile')).data.profile.displayName===lostAlias,'Reintento idéntico confirma el guardado sin conflicto')
    form=await edit(dialog);await form.getByLabel('Nombre visible',{exact:true}).fill('No llegará al servidor')
    const abort=route=>route.request().method()==='PATCH'?route.abort('failed'):route.continue()
    await owner.route(pattern,abort);await save(form);await form.getByRole('alert').waitFor();await owner.unroute(pattern,abort)
    check((await call(owner,'/student/profile')).data.profile.displayName===lostAlias,'Fallo antes de enviar conserva el perfil guardado')
    await form.getByRole('button',{name:'Cargar perfil actual y descartar borrador',exact:true}).click();await dialog.getByRole('button',{name:'Cerrar perfil',exact:true}).click()
    const minorDialog=await own(minor),minorForm=await edit(minorDialog)
    check(await minorForm.getByLabel('Nombre visible',{exact:true}).evaluate(el=>el.tagName)==='SELECT'&&await minorForm.getByLabel('Nombre visible',{exact:true}).locator('option').count()===2,'Menores eligen solo las dos abreviaturas existentes')
    await minorForm.getByLabel('Nombre visible',{exact:true}).selectOption('A. F.');await minorForm.getByLabel('Color del avatar',{exact:true}).selectOption('#0b6d48');await save(minorForm);await minorDialog.getByRole('heading',{name:'A. F.',exact:true}).waitFor()
    check((await call(minor,'/student/profile')).data.profile.displayName==='A. F.','Nombre abreviado y avatar del menor se guardan')
    for(const width of [1440,768,375,320]){await minor.setViewportSize({width,height:1000});check(await minor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Perfil del menor a ${width}px sin desbordamiento`)}
    await minorDialog.getByRole('button',{name:'Cerrar perfil',exact:true}).click();await minor.getByRole('button',{name:'Modo oscuro',exact:true}).click();await own(minor);await edit(minor.getByRole('dialog'))
    check(await minor.getByRole('dialog').isVisible(),'El editor conserva el tema oscuro existente')
    await minor.keyboard.press('Escape');check(await minor.getByRole('dialog').count()===0,'Escape cierra el perfil al terminar y devuelve la navegación')
    dialog=await own(owner);form=await edit(dialog);await form.getByLabel('Nombre visible',{exact:true}).fill('Sesión terminada no guarda')
    await call(owner,'/student/logout','POST',{});await save(form);await owner.getByRole('form',{name:'Acceso de alumnos',exact:true}).waitFor()
    check(new URL(owner.url()).pathname==='/login'&&await owner.getByRole('dialog').count()===0,'Sesión terminada retira el perfil y exige nuevo acceso')
    check(errors.length===0,'Sin errores de ejecución JavaScript')
    return {browserLabel,checks:details.length,details,matrix,errors}
  } catch(error) {throw new Error(`${error.message}\nCompletadas: ${details.length}\n${details.join('\n')}`)}
  finally {for(const release of releases)release();for(const context of contexts)await context.close()}
}
