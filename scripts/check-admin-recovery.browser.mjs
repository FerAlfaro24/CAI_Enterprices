/** Exclusivamente admin-recovery-browser-server y su buzón ficticio autenticado. */
export async function checkAdminRecovery(page,{accounts,mailKey,mailPort=3102,baseURL='http://localhost:4180',browserLabel='Prueba'}={}){
  const details=[],errors=[],contexts=[],releases=[],urls=[]
  const initial='Frase ficticia inicial de recuperación navegador 2026',first='Nueva frase ficticia de recuperación 2026 '+'x'.repeat(65),second='Segunda frase ficticia de recuperación 2026',third='Tercera frase ficticia que nunca se guardará 2026'
  const check=(ok,label)=>{if(!ok)throw Error(label);details.push(label)}
  const open=async()=>{const context=await page.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});contexts.push(context);const target=await context.newPage();target.setDefaultTimeout(10000);target.on('pageerror',error=>errors.push(String(error)));target.on('request',request=>urls.push(request.url()));return target}
  const call=(target,path)=>target.evaluate(async path=>{const response=await fetch('/api/local'+path);return {status:response.status,data:await response.json()}},path)
  const fillLogin=async(target,account,password)=>{await target.bringToFront();await target.getByRole('form',{name:'Acceso de administración',exact:true}).waitFor();await target.locator('#login-email').fill(account.email);await target.locator('#login-password').fill(password);await target.getByRole('button',{name:'Entrar al panel',exact:true}).click()}
  const login=async(target,account)=>{await target.goto(baseURL+'/admin');await fillLogin(target,account,initial);await target.getByRole('heading',{name:`Hola, ${account.name}`,exact:true}).waitFor();check((await call(target,'/auth/session')).data.user?.name===account.name,'Cuenta ficticia administrativa esperada')}
  const request=async(target,email,fromLogin=false)=>{await target.bringToFront();await target.goto(baseURL+(fromLogin?'/admin':'/recuperar-acceso-administrativo'));if(fromLogin)await target.getByRole('link',{name:'Olvidé mi contraseña',exact:true}).click();const form=target.getByRole('form',{name:'Solicitar recuperación administrativa',exact:true});await form.getByLabel('Correo de tu cuenta',{exact:true}).fill(email);const response=target.waitForResponse(response=>response.url().endsWith('/api/local/admin-recovery/request'));await form.getByRole('button',{name:'Solicitar recuperación',exact:true}).click();const reply=await response;check(reply.status()===202&&!JSON.stringify(await reply.json()).includes('token='),'La solicitud pública no devuelve enlace ni token');return target.getByRole('status').innerText()}
  const mail=async(target,email)=>{for(let i=0;i<60;i++){const response=await target.request.get(`http://127.0.0.1:${mailPort}/mailbox`,{headers:{Authorization:`Bearer ${mailKey}`}});if(!response.ok())throw Error('No se pudo leer el buzón ficticio autorizado');const mails=(await response.json()).filter(mail=>mail.to===email);if(mails.length)return mails.at(-1);await new Promise(resolve=>setTimeout(resolve,50))}throw Error('La entrega ficticia no se completó')}
  const fill=async(target,password,confirm=password)=>{const form=target.getByRole('form',{name:'Recuperar contraseña administrativa',exact:true});await form.getByLabel('Nueva contraseña',{exact:true}).fill(password);await form.getByLabel('Confirma tu contraseña',{exact:true}).fill(confirm);return form}
  const submit=form=>form.getByRole('button',{name:'Guardar nueva contraseña',exact:true}).click()
  const sizes=async(target,label)=>{for(const width of [1440,768,375,320]){await target.setViewportSize({width,height:1000});check(await target.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${label} a ${width}px sin desbordamiento`)}}
  try{
    if(!accounts?.owner?.name?.startsWith('Prueba ')||!accounts?.peer?.name?.startsWith('Prueba ')||mailPort!==3102||!mailKey)throw Error('Se requiere fixture aislada con buzón privado de pruebas.')
    const owner=await open(),stale=await open(),peer=await open(),visitor=await open()
    await login(owner,accounts.owner);await login(stale,accounts.owner);await login(peer,accounts.peer)
    await visitor.goto(baseURL+'/admin');await visitor.getByRole('link',{name:'Olvidé mi contraseña',exact:true}).click();await visitor.getByRole('form',{name:'Solicitar recuperación administrativa',exact:true}).waitFor();await sizes(visitor,'Solicitud administrativa')
    const unknown=await request(visitor,`missing-${browserLabel.toLowerCase()}@example.test`,true),known=await request(visitor,accounts.owner.email)
    check(unknown===known,'Cuenta existente e inexistente reciben el mismo mensaje')
    const firstMail=await mail(visitor,accounts.owner.email);const again=await request(visitor,accounts.owner.email);check(again===known&&(await mail(visitor,accounts.owner.email)).path===firstMail.path,'Repetir solicitud dentro del plazo no reemplaza el enlace ni revela la cuenta')
    check((await call(owner,'/requests')).status===200,'Solicitar recuperación conserva el acceso mientras no se cambie contraseña')
    await visitor.goto(baseURL+firstMail.path);let form=await fill(visitor,first,'Otra frase ficticia distinta 2026');await submit(form);await visitor.getByRole('alert').filter({hasText:'Las contraseñas no coinciden.'}).waitFor();check(true,'Confirma la contraseña antes de enviar')
    check(new URL(visitor.url()).hash===''&&!(await visitor.evaluate(()=>location.search)).includes('token'),'El enlace privado se retira de la barra de direcciones')
    await sizes(visitor,'Nueva contraseña administrativa');form=await fill(visitor,first)
    let count=0,ready;const received=new Promise(resolve=>{ready=resolve}),gate=new Promise(resolve=>releases.push(resolve)),pattern='**/api/local/admin-recovery/reset'
    const hold=async route=>{count++;const response=await route.fetch();ready();await gate;await route.fulfill({response})}
    await visitor.route(pattern,hold);await submit(form);await received
    check(await form.getByRole('button',{name:'Guardando…',exact:true}).isDisabled()&&await form.getByLabel('Nueva contraseña',{exact:true}).isDisabled(),'Bloquea controles mientras guarda')
    await form.evaluate(form=>form.requestSubmit());check(count===1,'Un segundo envío no duplica la recuperación')
    releases[0]();await visitor.getByRole('heading',{name:'Contraseña actualizada',exact:true}).waitFor();await visitor.unroute(pattern,hold)
    check(await visitor.locator('input[type=password]').count()===0,'Confirmación retira los campos de contraseña');await sizes(visitor,'Confirmación administrativa')
    check((await call(visitor,'/auth/session')).data.user===null,'Restablecer no inicia sesión automáticamente')
    for(const target of [owner,stale])check((await call(target,'/requests')).status===401,'Sesión anterior de la misma cuenta revocada')
    check((await call(peer,'/requests')).status===200,'Otra cuenta administrativa conserva acceso')
    await visitor.getByRole('link',{name:'Entrar al panel',exact:true}).click();await fillLogin(visitor,accounts.owner,initial);await visitor.getByRole('alert').waitFor();check(true,'La contraseña anterior deja de funcionar')
    await fillLogin(visitor,accounts.owner,first);await visitor.getByRole('heading',{name:`Hola, ${accounts.owner.name}`,exact:true}).waitFor();check(first.length>64,'Permite acceso normal con contraseña nueva de más de 64 caracteres')
    await visitor.goto(baseURL+firstMail.path);form=await fill(visitor,first);await submit(form);await visitor.getByRole('alert').filter({hasText:'El enlace no es válido'}).waitFor();check(true,'Enlace ya utilizado no vuelve a cambiar la contraseña')
    await request(visitor,accounts.owner.email);const secondMail=await mail(visitor,accounts.owner.email);check(secondMail.path!==firstMail.path,'Otra recuperación emite un enlace diferente después de consumir el anterior')
    await visitor.goto(baseURL+secondMail.path);form=await fill(visitor,second)
    let lost=0;const lose=async route=>{lost++;await route.fetch();await route.abort('failed')}
    await visitor.route(pattern,lose);await submit(form);await visitor.getByRole('status').filter({hasText:'No pudimos confirmar el resultado.'}).waitFor();await visitor.unroute(pattern,lose)
    check(lost===1&&await visitor.locator('input[type=password]').count()===0,'Respuesta perdida limpia campos sin falsa confirmación ni reintento automático')
    await visitor.getByRole('link',{name:'Volver al acceso administrativo',exact:true}).click();await fillLogin(visitor,accounts.owner,second);await visitor.getByRole('heading',{name:`Hola, ${accounts.owner.name}`,exact:true}).waitFor();check(true,'Se recupera el acceso con la nueva contraseña aunque se pierda la respuesta')
    await request(visitor,accounts.owner.email);const thirdMail=await mail(visitor,accounts.owner.email);await visitor.goto(baseURL+thirdMail.path);form=await fill(visitor,third)
    await visitor.route(pattern,route=>route.abort('failed'));await submit(form);await visitor.getByRole('status').filter({hasText:'No pudimos confirmar el resultado.'}).waitFor();await visitor.unroute(pattern)
    check(await visitor.locator('input[type=password]').count()===0,'Fallo antes de enviar también retira los datos sensibles')
    await visitor.getByRole('link',{name:'Volver al acceso administrativo',exact:true}).click()
    // Conserva la sesión anterior si el cambio no llegó; cerrar de forma explícita para comprobar credenciales.
    await visitor.getByRole('button',{name:'Cerrar sesión',exact:true}).or(visitor.getByRole('form',{name:'Acceso de administración',exact:true})).waitFor()
    if(await visitor.getByRole('button',{name:'Cerrar sesión',exact:true}).count())await visitor.getByRole('button',{name:'Cerrar sesión',exact:true}).click()
    await fillLogin(visitor,accounts.owner,third);await visitor.getByRole('alert').waitFor();await fillLogin(visitor,accounts.owner,second);await visitor.getByRole('heading',{name:`Hola, ${accounts.owner.name}`,exact:true}).waitFor();check(true,'Si el cambio nunca llegó, sigue válida la contraseña anterior')
    await visitor.goto(baseURL+thirdMail.path);form=await fill(visitor,third)
    const broken=async route=>{await route.fetch();await route.fulfill({status:200,contentType:'application/json',body:'respuesta dañada'})}
    await visitor.route(pattern,broken);await submit(form);await visitor.getByRole('status').filter({hasText:'No pudimos confirmar el resultado.'}).waitFor();await visitor.unroute(pattern,broken)
    check(await visitor.locator('input[type=password]').count()===0,'Respuesta 200 ilegible también se trata como resultado incierto y limpia campos')
    await visitor.getByRole('link',{name:'Volver al acceso administrativo',exact:true}).click();await fillLogin(visitor,accounts.owner,third);await visitor.getByRole('heading',{name:`Hola, ${accounts.owner.name}`,exact:true}).waitFor();check(true,'Contraseña guardada funciona aunque la respuesta JSON llegue dañada')
    await visitor.goto(baseURL+'/recuperar-administracion');await visitor.getByRole('alert').filter({hasText:'Necesitas un enlace'}).waitFor();check(await visitor.getByRole('form').count()===0,'Sin enlace válido no permite escribir otra contraseña')
    const tokens=[firstMail,secondMail,thirdMail].map(mail=>mail.path.split('token=')[1]),stored=await visitor.evaluate(()=>JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]))
    check(tokens.every(token=>urls.every(url=>!url.includes(token))&&!stored.includes(token))&&[initial,first,second,third].every(value=>!stored.includes(value)),'No conserva tokens o contraseñas en storage ni envía el token en URLs HTTP')
    check(errors.length===0,'Sin errores de ejecución JavaScript')
    return {browserLabel,checks:details.length,details,errors}
  }catch(error){throw Error(`${error.message}\nCompletadas: ${details.length}\n${details.join('\n')}`)}
  finally{for(const release of releases)release();for(const context of contexts)await context.close()}
}
