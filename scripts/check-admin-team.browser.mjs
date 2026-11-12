/** Solo admin-team-browser-server, con responsables y contraseñas ficticios. */
export async function checkAdminTeam(page,{accounts,browserLabel='Prueba',baseURL='http://localhost:4180'}={}){
  const details=[],errors=[],contexts=[],releases=[]
  const initial='Frase ficticia de equipo para navegador 2026',chosen='Frase ficticia elegida por nuevo responsable 2026 '+'x'.repeat(65)
  const check=(ok,label)=>{if(!ok)throw Error(label);details.push(label)}
  const open=async()=>{const context=await page.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});contexts.push(context);const target=await context.newPage();target.setDefaultTimeout(10000);target.on('pageerror',e=>errors.push(String(e)));return target}
  const call=(target,path)=>target.evaluate(async path=>{const response=await fetch('/api/local'+path);return {status:response.status,data:await response.json()}},path)
  const login=async(target,who,password=initial)=>{await target.bringToFront();await target.goto(baseURL+'/admin');await target.getByRole('form',{name:'Acceso de administración',exact:true}).waitFor();await target.locator('#login-email').fill(who.email);await target.locator('#login-password').fill(password);await target.getByRole('button',{name:'Entrar al panel',exact:true}).click();await target.getByRole('heading',{name:`Hola, ${who.name}`,exact:true}).waitFor();check((await call(target,'/auth/session')).data.user?.name===who.name,'Cuenta administrativa ficticia esperada')}
  const team=target=>target.getByRole('region',{name:'Equipo administrador',exact:true})
  const form=target=>team(target).getByRole('form',{name:'Confirmar gestión del equipo',exact:true})
  const row=(target,name)=>team(target).getByRole('listitem').filter({has:target.locator('strong').filter({hasText:name})})
  const confirm=async(target,password=initial)=>{await form(target).getByLabel('Tu contraseña actual',{exact:true}).fill(password);await form(target).getByRole('checkbox').check()}
  const status=async(target,who,active)=>{await target.bringToFront();await row(target,who.name).getByRole('button',{name:`${active?'Reactivar':'Desactivar'} a ${who.name}`,exact:true}).click();await confirm(target);await form(target).getByRole('button',{name:active?'Confirmar reactivación':'Confirmar desactivación',exact:true}).click();await form(target).waitFor({state:'hidden'});await row(target,who.name).getByText(active?'Activa':'Desactivada',{exact:true}).waitFor()}
  const invite=async target=>{await confirm(target);await form(target).getByRole('button',{name:'Preparar enlace de activación',exact:true}).click()}
  try{
    if(!accounts?.owner?.name?.startsWith('Prueba ')||!accounts?.peer?.name?.startsWith('Prueba '))throw Error('Usar solo la fixture aislada de equipo.')
    const owner=await open(),peer=await open(),recipient=await open();await login(owner,accounts.owner);await login(peer,accounts.peer)
    await owner.goto(baseURL+'/admin/configuracion');await team(owner).getByRole('button',{name:'Agregar administrador',exact:true}).waitFor();await row(owner,accounts.owner.name).getByText('Activa',{exact:true}).waitFor()
    check(await row(owner,accounts.owner.name).getByText('Activa',{exact:true}).count()===1,'Equipo original muestra cuentas reales de la base ficticia')
    check(await row(owner,accounts.owner.name).getByRole('button',{name:/Desactivar/}).count()===0,'La propia cuenta no ofrece desactivación')
    await team(owner).getByRole('button',{name:'Agregar administrador',exact:true}).click()
    const who={name:`Nuevo responsable ficticio ${browserLabel} `+'x'.repeat(45),email:`new-${browserLabel.toLowerCase()}-team@example.test`}
    await form(owner).getByLabel('Nombre del administrador',{exact:true}).fill(who.name);await form(owner).getByLabel('Correo del administrador',{exact:true}).fill(who.email);await confirm(owner,'Incorrecta de prueba')
    await form(owner).getByRole('button',{name:'Crear cuenta pendiente',exact:true}).click();await form(owner).getByRole('alert').filter({hasText:'La contraseña actual no es correcta.'}).waitFor()
    check(await form(owner).getByLabel('Tu contraseña actual',{exact:true}).inputValue()==='','Reautenticación incorrecta limpia la contraseña y conserva el alta')
    for(const width of [1440,768,375,320]){await owner.setViewportSize({width,height:1000});check(await owner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Equipo y alta a ${width}px sin desbordamiento`)}
    await confirm(owner)
    let count=0,ready;const saved=new Promise(resolve=>{ready=resolve}),gate=new Promise(resolve=>releases.push(resolve)),createPattern='**/api/local/admin-team'
    const loseCreate=async route=>{if(route.request().method()!=='POST')return route.continue();count++;await route.fetch();ready();await gate;await route.abort('failed')}
    await owner.route(createPattern,loseCreate);await form(owner).getByRole('button',{name:'Crear cuenta pendiente',exact:true}).click();await saved
    check(await form(owner).getByRole('button',{name:'Guardando…',exact:true}).isDisabled(),'Bloquea el formulario mientras crea la cuenta');await form(owner).evaluate(f=>f.requestSubmit());check(count===1,'Otro envío no duplica el alta durante la espera')
    releases[0]();await form(owner).getByRole('alert').filter({hasText:'No pudimos confirmar el resultado.'}).waitFor();await owner.unroute(createPattern,loseCreate)
    check(await form(owner).getByLabel('Nombre del administrador',{exact:true}).inputValue()===who.name&&await form(owner).getByLabel('Tu contraseña actual',{exact:true}).inputValue()==='','Respuesta perdida conserva datos del alta, limpia contraseña y no afirma fracaso')
    await confirm(owner);await form(owner).getByRole('button',{name:'Crear cuenta pendiente',exact:true}).click();await form(owner).waitFor({state:'hidden'})
    check(await row(owner,who.name).count()===1&&await row(owner,who.name).getByText('Pendiente de activación',{exact:true}).count()===1,'Reintento idempotente crea una sola cuenta pendiente')
    await row(owner,who.name).getByRole('button',{name:`Preparar invitación para ${who.name}`,exact:true}).click()
    let lostLink
    const invitationPattern='**/api/local/admin-team/*/invitation',loseInvite=async route=>{const response=await route.fetch();lostLink=(await response.json()).path;await route.abort('failed')}
    await owner.route(invitationPattern,loseInvite);await invite(owner);await form(owner).getByRole('alert').filter({hasText:'No pudimos confirmar el resultado.'}).waitFor();await owner.unroute(invitationPattern,loseInvite)
    check(await owner.getByRole('dialog').count()===0,'Invitación con respuesta perdida no muestra un enlace inventado')
    await team(owner).getByRole('button',{name:'Actualizar equipo',exact:true}).click();await row(owner,who.name).getByRole('button',{name:`Preparar invitación para ${who.name}`,exact:true}).click();await invite(owner)
    let dialog=owner.getByRole('dialog');await dialog.getByRole('textbox',{name:'Enlace de activación',exact:true}).waitFor()
    const link=await dialog.getByRole('textbox',{name:'Enlace de activación',exact:true}).inputValue()
    check(link.endsWith('/activar-administracion'+new URL(link).hash)&&new URL(link).pathname==='/activar-administracion','Prepara un enlace administrativo privado de un uso')
    for(const width of [1440,768,375,320]){await owner.setViewportSize({width,height:1000});check(await owner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&[...document.querySelectorAll('dialog[open]')].every(el=>el.scrollWidth<=el.clientWidth+1)),`Invitación privada a ${width}px sin desbordamiento`)}
    await owner.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});check(await team(owner).getByRole('heading',{name:'Equipo administrador',exact:true}).evaluate(el=>el===document.activeElement),'Escape devuelve el foco a la sección del equipo')
    await recipient.goto(baseURL+lostLink);let activation=recipient.getByRole('form',{name:'Activar cuenta administrativa',exact:true})
    await activation.getByLabel('Nueva contraseña',{exact:true}).fill(chosen);await activation.getByLabel('Confirma tu contraseña',{exact:true}).fill(chosen);await activation.getByRole('button',{name:'Activar mi cuenta',exact:true}).click();await recipient.getByRole('alert').filter({hasText:'El enlace no es válido'}).waitFor();check(true,'Renovar la invitación invalida el enlace de respuesta perdida')
    await recipient.goto(link);activation=recipient.getByRole('form',{name:'Activar cuenta administrativa',exact:true});await activation.getByLabel('Nueva contraseña',{exact:true}).fill(chosen);await activation.getByLabel('Confirma tu contraseña',{exact:true}).fill(chosen)
    for(const width of [1440,768,375,320]){await recipient.setViewportSize({width,height:1000});check(await recipient.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Activación administrativa a ${width}px sin desbordamiento`)}
    await activation.getByRole('button',{name:'Activar mi cuenta',exact:true}).click();await recipient.getByRole('heading',{name:'Tu acceso está listo',exact:true}).waitFor()
    check((await call(recipient,'/auth/session')).data.user===null&&await recipient.locator('input[type=password]').count()===0,'La persona elige contraseña; activar no inicia sesión y retira los campos')
    await login(recipient,who,chosen);await recipient.goto(baseURL+'/admin/configuracion');await team(recipient).getByRole('button',{name:'Agregar administrador',exact:true}).waitFor();check(true,'La cuenta activada accede al panel y tiene el alcance completo anunciado')
    await owner.bringToFront();await team(owner).getByRole('button',{name:'Actualizar equipo',exact:true}).click();await row(owner,who.name).getByText('Activa',{exact:true}).waitFor()
    await row(owner,accounts.peer.name).getByRole('button',{name:`Desactivar a ${accounts.peer.name}`,exact:true}).click();await form(owner).getByRole('button',{name:'Cancelar',exact:true}).click();check((await call(peer,'/requests')).status===200,'Cancelar una desactivación conserva el acceso')
    await status(owner,accounts.peer,false);check((await call(peer,'/requests')).status===401&&(await call(owner,'/requests')).status===200,'Desactivar revoca la sesión elegida y conserva la del administrador que decide')
    await status(owner,accounts.peer,true);check((await call(peer,'/requests')).status===401,'Reactivar no revive una sesión antigua');await login(peer,accounts.peer)
    await owner.reload();await team(owner).getByRole('button',{name:'Agregar administrador',exact:true}).waitFor();check(await row(owner,who.name).getByText('Activa',{exact:true}).count()===1,'Recargar conserva el alta activada y los estados guardados')
    // Dos ventanas: preparar una decisión, cambiar el mismo registro y comprobar revisión antigua.
    const before=(await call(owner,'/admin-team')).data.accounts.find(account=>account.email===accounts.peer.email)
    await row(owner,accounts.peer.name).getByRole('button',{name:`Desactivar a ${accounts.peer.name}`,exact:true}).click();await confirm(owner)
    const other=await owner.context().browser().newContext();contexts.push(other);const otherPage=await other.newPage();await login(otherPage,accounts.owner);await otherPage.goto(baseURL+'/admin/configuracion');await status(otherPage,accounts.peer,false);await status(otherPage,accounts.peer,true);await owner.bringToFront();await form(owner).getByRole('button',{name:'Confirmar desactivación',exact:true}).click();await form(owner).getByRole('alert').filter({hasText:'La cuenta cambió'}).waitFor()
    check(before.active&&await form(owner).getByLabel('Tu contraseña actual',{exact:true}).inputValue()==='','Una revisión antigua no repite cambios y limpia la contraseña')
    await team(owner).getByRole('button',{name:'Actualizar equipo',exact:true}).click();await row(owner,accounts.peer.name).getByText('Activa',{exact:true}).waitFor()
    const data=await owner.evaluate(()=>JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)])),token=new URL(link).hash.split('token=')[1]
    check(!data.includes(initial)&&!data.includes(chosen)&&!data.includes(token),'No guarda contraseñas ni enlaces privados en storage')
    check(errors.length===0,'Sin errores de ejecución JavaScript')
    return {browserLabel,checks:details.length,details,errors}
  }catch(error){throw Error(`${error.message}\nCompletadas: ${details.length}\n${details.join('\n')}`)}
  finally{for(const release of releases)release();for(const context of contexts)await context.close()}
}
