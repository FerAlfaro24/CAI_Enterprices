/** Solo student-record-browser-server, con expedientes y cuentas ficticios. */
export async function checkStudentRecord(page,{accounts,browserLabel='Prueba',baseURL='http://localhost:4180'}={}){
  const details=[],errors=[],contexts=[],releases=[]
  const password='Frase ficticia de expediente para navegador 2026'
  const check=(ok,label)=>{if(!ok)throw Error(label);details.push(label)}
  const open=async()=>{const context=await page.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});contexts.push(context);const target=await context.newPage();target.setDefaultTimeout(10000);target.on('pageerror',e=>errors.push(String(e)));return target}
  const call=(target,path,method='GET',data)=>target.evaluate(async({path,method,data})=>{const r=await fetch('/api/local'+path,{method,headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,data:await r.json()}},{path,method,data})
  const admin=async target=>{await target.bringToFront();await target.goto(baseURL+'/admin');await target.getByRole('form',{name:'Acceso de administración',exact:true}).waitFor();await target.locator('#login-email').fill(accounts.admin.email);await target.locator('#login-password').fill(password);await target.getByRole('button',{name:'Entrar al panel',exact:true}).click();await target.getByRole('heading',{name:`Hola, ${accounts.admin.name}`,exact:true}).waitFor();check((await call(target,'/auth/session')).data.user?.name===accounts.admin.name,'Sesión administrativa ficticia esperada')}
  const student=async(target,who,expected=who.displayName)=>{await target.bringToFront();await target.goto(baseURL+'/login');const form=target.getByRole('form',{name:'Acceso de alumnos',exact:true});await form.getByLabel('Correo electrónico',{exact:true}).fill(who.email);await form.getByLabel('Contraseña',{exact:true}).fill(password);await form.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await target.getByRole('button',{name:`Abrir mi perfil: ${expected}`,exact:true}).waitFor()}
  const dialog=target=>target.getByRole('dialog',{name:/./})
  const form=target=>target.getByRole('form',{name:'Corregir expediente del alumno',exact:true})
  const record=async(target,who)=>{await target.bringToFront();await target.goto(baseURL+'/admin/alumnos');await target.getByRole('searchbox',{name:'Buscar alumno',exact:true}).fill(who.id);await target.getByRole('button',{name:/^Ficha de /}).click();await dialog(target).getByRole('button',{name:'Corregir expediente',exact:true}).click();await form(target).getByLabel('Nombre del alumno',{exact:true}).waitFor();return form(target)}
  const confirm=async(target,reason='Corrección ficticia verificada en navegador',secret=password)=>{await form(target).getByLabel('Motivo de la corrección',{exact:true}).fill(reason);await form(target).getByLabel('Tu contraseña actual',{exact:true}).fill(secret);await form(target).getByRole('checkbox').check()}
  const save=target=>form(target).getByRole('button',{name:'Guardar corrección',exact:true}).click()
  const saved=target=>dialog(target).getByRole('status').filter({hasText:'Expediente corregido.'}).waitFor()
  const edit=async target=>{await dialog(target).getByRole('button',{name:'Corregir expediente',exact:true}).click();await form(target).getByLabel('Nombre del alumno',{exact:true}).waitFor()}
  const fits=async(target,label)=>{for(const width of [1440,768,375,320]){await target.setViewportSize({width,height:1000});check(await target.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&[...document.querySelectorAll('dialog[open]')].every(el=>el.scrollWidth<=el.clientWidth+1)),`${label} a ${width}px sin desbordamiento`)}}
  try{
    if(!accounts?.admin?.name?.startsWith('Prueba ')||!accounts?.adult?.displayName?.startsWith('Prueba '))throw Error('Se requiere una fixture aislada de expediente.')
    const owner=await open(),pupil=await open(),minor=await open(),peer=await open();await admin(owner);await student(pupil,accounts.adult);await student(minor,accounts.minor);await student(peer,accounts.peer)
    const initial=(await call(pupil,'/student/me')).data.user
    await record(owner,accounts.adult)
    check(await form(owner).getByLabel('Nombre del alumno',{exact:true}).inputValue()===accounts.adult.firstName,'La ficha original carga los datos privados del expediente')
    check(await form(owner).getByRole('textbox',{name:/Correo/}).count()===0&&await form(owner).getByRole('combobox').count()===0,'Correo, Google y grupo no se editan implícitamente')
    await form(owner).getByLabel('Nombre del alumno',{exact:true}).fill('Borrador cancelado');await form(owner).getByRole('button',{name:'Cancelar corrección',exact:true}).click();await edit(owner)
    check(await form(owner).getByLabel('Nombre del alumno',{exact:true}).inputValue()===accounts.adult.firstName,'Cancelar descarta el borrador sin cambiar el expediente')
    const correctedName='Nombre Corregido '+browserLabel
    await form(owner).getByLabel('Nombre del alumno',{exact:true}).fill(correctedName);await form(owner).getByLabel('Matrícula',{exact:true}).fill('CAI-2026');await confirm(owner,undefined,'Incorrecta ficticia')
    await save(owner);await form(owner).getByRole('alert').filter({hasText:'La contraseña actual no es correcta.'}).waitFor();check(await form(owner).getByLabel('Tu contraseña actual',{exact:true}).inputValue()==='','Contraseña incorrecta se limpia sin perder la corrección')
    await fits(owner,'Corrección de adulto');await confirm(owner)
    const pattern='**/api/local/students/*/record';let count=0,ready;const received=new Promise(resolve=>{ready=resolve}),gate=new Promise(resolve=>releases.push(resolve))
    const lose=async route=>{if(route.request().method()!=='PATCH')return route.continue();count++;await route.fetch();ready();await gate;await route.abort('failed')}
    await owner.route(pattern,lose);await save(owner);await received
    check(await form(owner).getByRole('button',{name:'Guardando…',exact:true}).isDisabled(),'Bloquea campos y guardado mientras corrige');await form(owner).evaluate(f=>f.requestSubmit());check(count===1,'Evita doble envío durante la espera')
    releases[0]();await form(owner).getByRole('alert').filter({hasText:'No pudimos confirmar si se guardó la corrección.'}).waitFor();await owner.unroute(pattern,lose)
    check(await form(owner).getByLabel('Nombre del alumno',{exact:true}).inputValue()===correctedName&&await form(owner).getByLabel('Tu contraseña actual',{exact:true}).inputValue()==='','Respuesta perdida conserva el borrador sin contraseña ni falsa confirmación')
    await confirm(owner);await save(owner);await saved(owner);await form(owner).waitFor({state:'hidden'})
    await dialog(owner).getByText('Historial de correcciones (1)',{exact:true}).click();check(await dialog(owner).getByText(`${accounts.adult.firstName} → ${correctedName}`,{exact:true}).count()===1,'Reintento conserva una sola corrección y muestra antes/después en historial privado')
    check((await call(pupil,'/student/me')).status===401&&(await call(peer,'/student/me')).status===200,'Cierra solo sesiones del alumno corregido')
    await student(pupil,accounts.adult);const current=(await call(pupil,'/student/me')).data.user
    check(current.publicId===initial.publicId&&current.displayName===initial.displayName&&current.program===initial.program&&current.name.startsWith(correctedName),'Conserva identidad pública, alias y asignación al corregir nombre legal adulto')
    check((await call(peer,`/students/${accounts.adult.id}/record`)).status===401,'Otro alumno no consulta expediente ni historial')
    await record(owner,accounts.minor);await form(owner).getByLabel('Nombre del alumno',{exact:true}).fill('Renovado Ficticio');await form(owner).getByLabel('Contacto del tutor',{exact:true}).fill('nuevo-tutor@example.test');await form(owner).getByLabel('Nueva referencia de autorización del tutor',{exact:true}).fill('Referencia inicial ficticia de navegador');await confirm(owner)
    await save(owner);await form(owner).getByRole('alert').filter({hasText:'nueva referencia de autorización'}).waitFor();check(true,'Cambio de identidad/tutor de menor exige autorización nueva y distinta')
    await fits(owner,'Corrección de menor');await form(owner).getByLabel('Nueva referencia de autorización del tutor',{exact:true}).fill('Nueva referencia ficticia de tutor '+browserLabel);await confirm(owner);await save(owner);await saved(owner);await form(owner).waitFor({state:'hidden'})
    const expectedMinor=`Renovado ${accounts.minor.lastName[0]}.`;await student(minor,accounts.minor,expectedMinor)
    const feed=(await call(peer,'/student/posts')).data.posts
    check(!feed.some(post=>post.id===accounts.minor.postId)&&(await call(minor,'/student/me')).data.user.displayName===expectedMinor,'Abrevia el nuevo nombre y retira de publicación las historias que necesitan revisión')
    await record(owner,accounts.adult);await form(owner).getByLabel('Fecha de nacimiento',{exact:true}).fill(accounts.minor.birthDate)
    await form(owner).getByLabel('Nombre del tutor',{exact:true}).fill('Tutor Ficticio Corregido');await form(owner).getByLabel('Parentesco',{exact:true}).fill('Tutor');await form(owner).getByLabel('Contacto del tutor',{exact:true}).fill('tutor-edad@example.test');await form(owner).getByLabel('Nueva referencia de autorización del tutor',{exact:true}).fill('Referencia ficticia por corrección de edad '+browserLabel);await confirm(owner)
    check(await form(owner).getByText(`Nombre ${accounts.adult.lastName[0]}.`,{exact:true}).count()===1,'Vista previa explica el nombre abreviado al corregir edad a menor')
    await save(owner);await saved(owner);await form(owner).waitFor({state:'hidden'})
    const recordAfter=(await call(owner,`/students/${accounts.adult.id}/record`)).data.record
    check(recordAfter.visibility==='privado'&&recordAfter.email===accounts.adult.email&&recordAfter.guardian.contact==='tutor-edad@example.test','Corregir adulto a menor fuerza privacidad y tutor sin cambiar correo de acceso')
    check(!(await call(peer,'/student/posts')).data.posts.some(post=>post.id===accounts.adult.postId),'Historia del alumno reclasificado también vuelve a revisión')
    await edit(owner);await form(owner).getByLabel('Matrícula',{exact:true}).fill('BORRADOR');await confirm(owner)
    const other=await open();await admin(other);await record(other,accounts.adult);await form(other).getByLabel('Matrícula',{exact:true}).fill('OTRA-2026');await confirm(other);await save(other);await saved(other)
    await owner.bringToFront();await save(owner);await form(owner).getByRole('alert').filter({hasText:'La ficha cambió'}).waitFor();check(await form(owner).getByLabel('Matrícula',{exact:true}).inputValue()==='BORRADOR'&&await form(owner).getByLabel('Tu contraseña actual',{exact:true}).inputValue()==='','Conflicto conserva borrador y no sobrescribe la corrección de otra ventana')
    await form(owner).getByRole('button',{name:'Cargar expediente y descartar borrador',exact:true}).click();await form(owner).getByLabel('Matrícula',{exact:true}).waitFor()
    check(await form(owner).getByLabel('Matrícula',{exact:true}).inputValue()==='OTRA-2026','Carga explícita recupera la revisión y los datos actuales')
    await form(owner).getByRole('button',{name:'Cancelar corrección',exact:true}).click();await dialog(owner).getByText(/^Historial de correcciones/).click();await fits(owner,'Historial privado')
    await dialog(owner).getByRole('button',{name:'Cerrar ficha',exact:true}).click();await record(owner,accounts.adult);await form(owner).getByLabel('Matrícula',{exact:true}).fill('SIN-SESION');await confirm(owner)
    await call(owner,'/auth/logout','POST',{});await save(owner);await owner.getByRole('form',{name:'Acceso de administración',exact:true}).waitFor();check(await owner.getByRole('dialog').count()===0,'Sesión administrativa terminada retira ficha, historial y formulario')
    const stored=await owner.evaluate(()=>JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]));check(!stored.includes(password)&&!stored.includes('nuevo-tutor@example.test')&&!stored.includes(accounts.adult.birthDate),'No conserva contraseña o expediente en storage')
    check(errors.length===0,'Sin errores de ejecución JavaScript')
    return {browserLabel,checks:details.length,details,errors}
  }catch(error){throw Error(`${error.message}\nCompletadas: ${details.length}\n${details.join('\n')}`)}
  finally{for(const release of releases)release();for(const context of contexts)await context.close()}
}
