/** Solo contra admin-security-browser-server: nunca cambiar la cuenta habitual. */
export async function checkAdminSecurity(page,{account,peer,baseURL='http://localhost:4180',browserLabel='Prueba'}={}){
  const details=[],errors=[],contexts=[],listeners=[],releases=[],matrix=[]
  const initial='Frase ficticia inicial de seguridad 2026',first='Frase ficticia nueva del administrador 2026 '+'x'.repeat(65),second='Segunda frase ficticia para pérdida de respuesta 2026',third='Tercera frase ficticia que no llegará al servidor 2026'
  const check=(ok,label)=>{if(!ok)throw new Error(label);details.push(label)}
  const open=async()=>{const context=await page.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});contexts.push(context);const target=await context.newPage();target.setDefaultTimeout(10000);const listener=error=>errors.push(String(error));target.on('pageerror',listener);listeners.push([target,listener]);return target}
  const call=(target,path)=>target.evaluate(async path=>{const r=await fetch('/api/local'+path);return {status:r.status,data:await r.json()}},path)
  const fillLogin=async(target,email,password)=>{await target.bringToFront();await target.getByRole('form',{name:'Acceso de administración',exact:true}).waitFor();await target.locator('#login-email').fill(email);await target.locator('#login-password').fill(password);await target.getByRole('button',{name:'Entrar al panel',exact:true}).click()}
  const login=async(target,who,password=initial)=>{await target.bringToFront();await target.goto(baseURL+'/admin');await fillLogin(target,who.email,password);await target.getByRole('heading',{name:`Hola, ${who.name}`,exact:true}).waitFor();const session=await call(target,'/auth/session');check(session.data.user?.name===who.name,'La sesión pertenece a la cuenta ficticia esperada')}
  const settings=async target=>{await target.bringToFront();await target.goto(baseURL+'/admin/configuracion');await target.getByRole('form',{name:'Cambiar mi contraseña administrativa',exact:true}).waitFor();return target.getByRole('form',{name:'Cambiar mi contraseña administrativa',exact:true})}
  const fill=async(form,current,password,confirm=password)=>{await form.getByLabel('Contraseña actual',{exact:true}).fill(current);await form.getByLabel('Nueva contraseña administrativa',{exact:true}).fill(password);await form.getByLabel('Confirma la nueva contraseña',{exact:true}).fill(confirm)}
  const submit=form=>form.getByRole('button',{name:'Guardar contraseña y cerrar mis sesiones',exact:true}).click()
  try{
    if(!account?.name?.startsWith('Prueba ')||!peer?.name?.startsWith('Prueba '))throw new Error('Solo se admiten las cuentas de la base aislada de prueba.')
    const owner=await open(),stale=await open(),other=await open(),student=await open()
    await login(owner,account);await login(stale,account);await login(other,peer)
    await student.goto(baseURL+'/login');await student.evaluate(async password=>{const r=await fetch('/api/local/student/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'student-security@example.test',password})});if(!r.ok)throw Error('No se pudo abrir la cuenta ficticia de alumno')},initial)
    let form=await settings(owner)
    check((await form.locator('input[type=password]').count())===3,'El formulario usa tres campos protegidos con etiquetas propias')
    await form.getByRole('checkbox',{name:'Mostrar contraseñas',exact:true}).check();check((await form.locator('input[type=text]').count())===3,'Mostrar contraseñas solo cambia la visibilidad local');await form.getByRole('checkbox',{name:'Mostrar contraseñas',exact:true}).uncheck()
    await fill(form,initial,first,'No coincide la confirmación');await submit(form);await form.getByRole('alert').filter({hasText:'Las contraseñas no coinciden.'}).waitFor()
    check(true,'La confirmación se comprueba antes de enviar')
    await fill(form,'Contraseña actual incorrecta de prueba',first);await submit(form);await form.getByRole('alert').filter({hasText:'La contraseña actual no es correcta.'}).waitFor()
    check((await form.getByLabel('Contraseña actual',{exact:true}).inputValue())===''&&(await call(owner,'/auth/session')).data.user?.name===account.name,'Una contraseña actual incorrecta se limpia sin cerrar la cuenta ni cambiarla')
    for(const width of [1440,768,375,320]){await owner.setViewportSize({width,height:1000});check(await owner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Configuración y formulario a ${width}px sin desbordamiento`);matrix.push({width,view:'admin-password'})}
    await fill(form,initial,first)
    const pattern='**/api/local/auth/password'
    let count=0,ready
    const saved=new Promise(resolve=>{ready=resolve}),gate=new Promise(resolve=>releases.push(resolve))
    const hold=async route=>{count++;const response=await route.fetch();ready();await gate;await route.fulfill({response})}
    await owner.route(pattern,hold);await submit(form);await saved
    check(await form.getByRole('button',{name:'Guardando…',exact:true}).isDisabled(),'El formulario se bloquea mientras el cambio está en curso')
    await form.evaluate(form=>form.requestSubmit());check(count===1,'Otro envío durante la espera no duplica el cambio')
    releases[0]();await owner.getByRole('form',{name:'Acceso de administración',exact:true}).waitFor();await owner.unroute(pattern,hold)
    await owner.getByRole('status').filter({hasText:'Contraseña actualizada.'}).waitFor()
    check(!(await owner.locator('[name=currentPassword],[name=confirm]').count()),'Guardar borra los campos sensibles y exige nuevo acceso')
    for(const width of [1440,768,375,320]){await owner.setViewportSize({width,height:1000});check(await owner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Acceso tras cambiar contraseña a ${width}px sin desbordamiento`)}
    await stale.bringToFront();await stale.goto(baseURL+'/admin/configuracion');await stale.getByRole('form',{name:'Acceso de administración',exact:true}).waitFor()
    check((await call(stale,'/requests')).status===401,'La otra sesión de la misma cuenta pierde su acceso privado')
    check((await call(other,'/requests')).status===200&&(await call(student,'/student/me')).status===200,'Otras cuentas administrativas y alumnos conservan sus sesiones')
    await fillLogin(owner,account.email,initial);await owner.getByRole('alert').waitFor();check(true,'La contraseña anterior ya no permite entrar')
    await fillLogin(owner,account.email,first);await owner.getByRole('heading',{name:'Configuración',exact:true,level:1}).waitFor()
    check(first.length>64,'La nueva contraseña de más de 64 caracteres sirve para el acceso')
    form=await settings(owner);await fill(form,first,second)
    let lost=0
    const lose=async route=>{lost++;await route.fetch();await route.abort('failed')}
    await owner.route(pattern,lose);await submit(form);await owner.getByRole('status').filter({hasText:'No pudimos confirmar el resultado.'}).waitFor();await owner.unroute(pattern,lose)
    check(lost===1&&!(await owner.locator('[name=currentPassword],[name=confirm]').count()),'Una respuesta perdida no afirma fracaso ni éxito y limpia los campos sin reintentar')
    check((await call(owner,'/requests')).status===401,'Aunque se pierda la respuesta, las sesiones revocadas no siguen leyendo')
    await fillLogin(owner,account.email,second);await owner.getByRole('heading',{name:'Configuración',exact:true,level:1}).waitFor();check(true,'Se puede entrar con la nueva contraseña tras perder su respuesta')
    form=await settings(owner);await fill(form,second,third)
    await owner.route(pattern,route=>route.abort('failed'));await submit(form);await owner.getByRole('status').filter({hasText:'No pudimos confirmar el resultado.'}).waitFor();await owner.unroute(pattern)
    await fillLogin(owner,account.email,third);await owner.getByRole('alert').waitFor();await fillLogin(owner,account.email,second);await owner.getByRole('heading',{name:'Configuración',exact:true,level:1}).waitFor()
    check(true,'Si el envío nunca llegó, sigue funcionando la contraseña anterior sin una falsa confirmación')
    form=await settings(owner);await fill(form,second,third)
    await owner.evaluate(async()=>{await fetch('/api/local/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})})
    await submit(form);await owner.getByRole('status').filter({hasText:'Tu sesión terminó.'}).waitFor()
    check(!(await owner.locator('[name=currentPassword],[name=confirm]').count()),'Una sesión terminada no cambia la contraseña y retira el formulario')
    const stored=await owner.evaluate(()=>JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]))
    check([initial,first,second,third].every(secret=>!stored.includes(secret)),'No se guardan contraseñas en el almacenamiento del navegador')
    check(errors.length===0,'Sin errores de ejecución JavaScript en el recorrido')
    return {browserLabel,checks:details.length,details,matrix,errors}
  }catch(error){
    const state=await Promise.all(contexts.flatMap(context=>context.pages()).map(async target=>({path:new URL(target.url()).pathname,headings:await target.getByRole('heading',{level:1}).allTextContents(),alerts:await target.getByRole('alert').allTextContents()})))
    throw new Error(`${error.message}\nComprobaciones completadas: ${details.length}\n${details.join('\n')}\n${JSON.stringify(state)}`)
  }
  finally{for(const release of releases)release();for(const[target,listener]of listeners)target.off('pageerror',listener);for(const context of contexts)await context.close()}
}
