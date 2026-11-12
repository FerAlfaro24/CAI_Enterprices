/** Recorrido oficial de contacto, bandejas y recuperación, con datos ficticios. */
export async function checkInboxRecoveryContact(page,{email,password,browserLabel='Prueba',baseURL='http://127.0.0.1:5173'}={}){
  const details=[],errors=[],contexts=[],listeners=[],matrix=[]
  const check=(ok,label)=>{if(!ok)throw new Error(label);details.push(label)}
  const watch=target=>{target.setDefaultTimeout(10_000);const listener=error=>errors.push(String(error));target.on('pageerror',listener);listeners.push([target,listener])}
  const call=(target,route,method='GET',data,key)=>target.evaluate(async({route,method,data,key})=>{
    const response=await fetch('/api/local'+route,{method,headers:{...(data===undefined?{}:{'Content-Type':'application/json'}),...(key?{'Idempotency-Key':key}:{})},body:data===undefined?undefined:JSON.stringify(data)})
    const body=await response.json();if(!response.ok)throw new Error(`${route}: ${response.status} ${body.error}`);return body
  },{route,method,data,key})
  const unique=browserLabel+Date.now(),name='Consulta '+unique,address=`avisos-${unique.toLowerCase()}@example.test`,peerAddress=`otro-${unique.toLowerCase()}@example.test`
  const original='Contraseña ficticia inicial de avisos 2026',renewed='Contraseña ficticia renovada de avisos 2026 '+ 'x'.repeat(65)
  const inbox=async(tab='contacts')=>{await page.bringToFront();await page.goto(baseURL+'/admin/mensajes');await page.getByRole('heading',{name:'Mensajes y avisos',exact:true}).waitFor();if(tab==='notices')await page.getByRole('button',{name:'Avisos de acceso',exact:true}).click()}
  const login=async(target,account,secret)=>{await target.bringToFront();await target.goto(baseURL+'/login');await target.locator('#login-email').fill(account);await target.locator('#login-password').fill(secret);await target.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await target.getByRole('button',{name:'Actualizar comunidad',exact:true}).waitFor()}
  const profile=async target=>{await target.bringToFront();await target.getByRole('button',{name:/^Mis avisos \(/}).click();await target.getByRole('region',{name:'Mis avisos',exact:true}).waitFor();return target.getByRole('region',{name:'Mis avisos',exact:true})}
  watch(page)
  try{
    await page.setViewportSize({width:1440,height:1000});await page.goto(baseURL+'/admin')
    await page.getByRole('heading',{level:1}).waitFor()
    if(await page.locator('#login-email').isVisible()){await page.locator('#login-email').fill(email);await page.locator('#login-password').fill(password);await page.getByRole('button',{name:'Entrar al panel',exact:true}).click()}
    await page.getByRole('navigation',{name:'Secciones de administración',exact:true}).waitFor()
    const pages=[]
    for(let i=0;i<3;i++){const context=await page.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});contexts.push(context);const target=await context.newPage();watch(target);pages.push(target)}
    const [visitor,student,stale]=pages
    await visitor.bringToFront();await visitor.goto(baseURL+'/#contacto',{waitUntil:'domcontentloaded'})
    const form=visitor.getByRole('form',{name:'Formulario de contacto CAI',exact:true})
    await form.scrollIntoViewIfNeeded()
    const sendContact=async()=>{await visitor.bringToFront();await visitor.mouse.move(0,0);await form.getByRole('button',{name:'Enviar consulta',exact:true}).click()}
    await sendContact()
    check(await form.locator('[name=nombre]').evaluate(input=>document.activeElement===input),'Contacto inválido devuelve el foco al primer campo')
    await form.locator('[name=nombre]').fill(name);await form.locator('[name=contacto]').fill(`contacto-${unique.toLowerCase()}@example.test`)
    await form.locator('[name=programa]').selectOption({index:1})
    await sendContact()
    check(await form.locator('[name=consent]').getAttribute('aria-invalid')==='true','No guarda contacto sin confirmar el uso de datos')
    await form.locator('[name=consent]').check()
    const keys=[],pattern='**/api/local/contact'
    const loseResponse=async route=>{if(route.request().method()!=='POST')return route.continue();keys.push(route.request().headers()['idempotency-key']);if(keys.length===1){await route.fetch();await route.abort('failed')}else await route.continue()}
    await visitor.route(pattern,loseResponse)
    await sendContact();await form.getByRole('alert').waitFor()
    check(await form.locator('[name=nombre]').inputValue()===name,'Un fallo de respuesta conserva el formulario de contacto')
    await sendContact();await form.getByRole('status').filter({hasText:/Consulta CON-/}).waitFor();await visitor.unroute(pattern,loseResponse)
    check(keys.length===2&&keys[0]===keys[1],'El reintento de contacto conserva la clave y no duplica el envío')
    check((await form.getByRole('status').innerText()).includes('No se reservó una clase ni se envió correo'),'El recibo diferencia guardado, reserva y correo')
    await inbox();await page.getByRole('button',{name:'Actualizar consultas',exact:true}).click()
    const inquiries=(await call(page,'/contacts')).contacts.filter(item=>item.name===name)
    check(inquiries.length===1,'La consulta aparece una sola vez en el panel original')
    const contact=inquiries[0]
    await page.getByRole('button',{name:`Atender consulta ${contact.id}`,exact:true}).click()
    let dialog=page.getByRole('dialog')
    await dialog.getByLabel('Estado',{exact:true}).selectOption('seguimiento');await dialog.getByLabel('Nota interna',{exact:true}).fill('Consulta revisada con datos ficticios.\nPendiente de coordinación.')
    await dialog.getByRole('button',{name:'Guardar seguimiento',exact:true}).click();await dialog.waitFor({state:'hidden'})
    await page.reload();await page.getByRole('group',{name:'Filtrar consultas',exact:true}).getByRole('button',{name:/^En seguimiento/}).click()
    await page.getByRole('button',{name:`Atender consulta ${contact.id}`,exact:true}).click();dialog=page.getByRole('dialog')
    check((await dialog.getByLabel('Nota interna',{exact:true}).inputValue()).includes('Pendiente de coordinación'),'Seguimiento y nota interna persisten al recargar')
    await dialog.getByRole('button',{name:'Cerrar consulta',exact:true}).click()
    for(const [target,account,index] of [[student,address,0],[visitor,peerAddress,1]]){
      await target.goto(baseURL+'/login')
      const receipt=await call(page,'/requests','POST',{firstName:'Alumno',lastName:unique+index,birthDate:'2000-01-01',email:account,filledBy:'alumno',program:'Business English',group:'Mar y jue · 19:30',displayName:`Avisos ${index}`,avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true},crypto.randomUUID())
      await call(page,`/requests/${receipt.id}/approve`,'POST',{revision:1})
      const studentRecord=(await call(page,'/students')).students.find(item=>item.id===receipt.id)
      const invitation=await call(page,`/students/${receipt.id}/invitation`,'POST',{revision:studentRecord.revision})
      await call(target,'/activation','POST',{token:invitation.path.split('token=')[1],password:original,confirm:original});await login(target,account,original)
    }
    await login(stale,address,original)
    let own=await profile(student)
    const approval=own.getByRole('listitem').filter({hasText:'Revisión de tu solicitud'}),approvalId=Number(await approval.getAttribute('data-notice-id'))
    await approval.getByRole('button',{name:/^Marcar leído/}).click();await approval.getByText(/Leído/).waitFor()
    check(true,'El alumno consulta y marca leído un aviso propio')
    check(!(await call(visitor,'/student/notices')).notices.some(item=>item.id===approvalId),'Otro alumno no recibe los avisos de esta cuenta')
    check((await call(page,'/notices')).notices.find(item=>item.id===approvalId).acknowledged===0,'Leer por alumno no marca revisado para coordinación')
    await student.getByRole('button',{name:'Cerrar perfil',exact:true}).click()
    await student.goto(baseURL+'/login');await student.getByRole('link',{name:'Olvidé mi contraseña',exact:true}).click()
    await student.getByLabel('Correo de tu cuenta',{exact:true}).fill(address);await student.getByRole('button',{name:'Solicitar recuperación',exact:true}).click()
    await student.getByRole('status').waitFor()
    check((await student.getByRole('status').innerText()).includes('no se envían correos'),'Recuperación oficial no promete entrega de correo')
    await inbox('notices')
    const recovery=page.getByRole('listitem').filter({hasText:address}).filter({hasText:'Recuperación de acceso solicitada'})
    await recovery.getByRole('button',{name:/^Preparar enlace de prueba/}).click();dialog=page.getByRole('dialog')
    const link=await dialog.getByLabel('Enlace de recuperación',{exact:true}).inputValue()
    for(const width of [1440,768,375,320]){await page.setViewportSize({width,height:1000});check(await dialog.evaluate(d=>d.scrollWidth<=d.clientWidth),`Enlace privado a ${width}px sin desbordamiento`)}
    await dialog.getByRole('button',{name:'Cerrar enlace de recuperación',exact:true}).click()
    await student.goto(link);await student.getByRole('heading',{name:'Elige tu nueva contraseña',exact:true}).waitFor()
    check(await student.evaluate(()=>location.hash===''),'El enlace privado se retira de la barra y del historial actual')
    await student.getByLabel('Nueva contraseña',{exact:true}).fill(renewed);await student.getByLabel('Confirma tu contraseña',{exact:true}).fill(original)
    await student.getByRole('button',{name:'Guardar nueva contraseña',exact:true}).click();await student.getByRole('alert').filter({hasText:'Las contraseñas no coinciden.'}).waitFor();check(true,'Recuperación valida la confirmación antes de guardar')
    await student.getByLabel('Confirma tu contraseña',{exact:true}).fill(renewed);await student.getByRole('button',{name:'Guardar nueva contraseña',exact:true}).click()
    await student.getByRole('heading',{name:'Contraseña actualizada',exact:true}).waitFor()
    check((await call(student,'/student/session')).user===null,'Cambiar contraseña no inicia sesión automáticamente')
    await stale.goto(baseURL+'/community');await stale.getByRole('form',{name:'Acceso de alumnos',exact:true}).waitFor();check(true,'La recuperación revoca otra sesión independiente del mismo alumno')
    await stale.locator('#login-email').fill(address);await stale.locator('#login-password').fill(original);await stale.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await stale.getByRole('alert').waitFor();check(true,'La contraseña anterior deja de permitir acceso')
    await student.getByRole('link',{name:'Entrar a mi espacio',exact:true}).click();await student.locator('#login-email').fill(address);await student.locator('#login-password').fill(renewed);await student.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await student.getByRole('button',{name:'Actualizar comunidad',exact:true}).waitFor()
    check(renewed.length>64,'El login admite la contraseña recuperada de más de 64 caracteres')
    own=await profile(student);await own.getByText('Contraseña cambiada',{exact:true}).waitFor();check(true,'El cambio produce un aviso propio visible en Community');await student.getByRole('button',{name:'Cerrar perfil',exact:true}).click()
    await student.goto(link);await student.getByLabel('Nueva contraseña',{exact:true}).fill(original);await student.getByLabel('Confirma tu contraseña',{exact:true}).fill(original);await student.getByRole('button',{name:'Guardar nueva contraseña',exact:true}).click();await student.getByRole('alert').filter({hasText:/enlace no es válido/}).waitFor();check(true,'Un enlace usado no se puede reutilizar')
    await recovery.getByRole('button',{name:/^Marcar revisado/}).click()
    await page.getByRole('button',{name:/^Todos los avisos/}).click();await recovery.getByText('Revisado · Sin envío de correo',{exact:true}).waitFor();check(true,'Coordinación marca revisado sin simular un correo enviado')
    for(const width of [1440,768,375,320]){
      await page.setViewportSize({width,height:1000});await inbox();await page.getByRole('group',{name:'Filtrar consultas',exact:true}).getByRole('button',{name:/^En seguimiento/}).click();await page.getByRole('button',{name:`Atender consulta ${contact.id}`,exact:true}).click();dialog=page.getByRole('dialog')
      check(await dialog.evaluate(d=>d.scrollWidth<=d.clientWidth),`Seguimiento a ${width}px sin desbordamiento`);await dialog.getByRole('button',{name:'Cerrar consulta',exact:true}).click()
      await student.setViewportSize({width,height:1000});await student.goto(baseURL+'/recuperar-acceso');await student.getByRole('button',{name:'Solicitar recuperación',exact:true}).waitFor();check(await student.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Recuperación oficial a ${width}px sin desbordamiento`)
      await student.goto(baseURL+'/community');await student.getByRole('button',{name:/^Mis avisos \(/}).waitFor();await profile(student)
      check(await student.getByRole('dialog').evaluate(d=>d.scrollWidth<=d.clientWidth),`Avisos propios a ${width}px sin desbordamiento`);await student.getByRole('button',{name:'Cerrar perfil',exact:true}).click()
      matrix.push({width,views:['recovery-link','contact-followup','recovery','own-notices']})
    }
    check(errors.length===0,'Sin errores de ejecución JavaScript en los recorridos')
    await page.setViewportSize({width:1440,height:1000});await inbox()
    return {browserLabel,checks:details.length,details,matrix,errors}
  }finally{for(const[target,listener]of listeners)target.off('pageerror',listener);for(const context of contexts)await context.close()}
}
