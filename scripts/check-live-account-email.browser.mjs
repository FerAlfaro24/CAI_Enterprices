/** SMTP real solo a la cuenta institucional permitida por onboarding-browser-server --smtp.
 * Cada fase se ejecuta una vez y se intercala con la comprobación del mensaje en Gmail.
 * Accesos, destinatario y enlaces se suministran/guardan exclusivamente en ejecución privada.
 */
export async function checkLiveAccountEmail(browser,{fixture,recipient,phase}) {
 if(fixture.delivery!=='smtp'||fixture.realGoogle||fixture.baseURL!=='http://localhost:4684'||!fixture.email.endsWith('@example.test'))throw Error('Solo fixture SMTP aislada y autorizada.')
 const base=fixture.baseURL,contexts=[],results=[],errors=[]
 const check=(ok,text)=>{if(!ok)throw Error(text);results.push(text)}
 const create=async()=>{const context=await browser.newContext({locale:'es-MX',viewport:{width:1440,height:1000},reducedMotion:'reduce'});contexts.push(context);context.setDefaultTimeout(20000);return context}
 const api=async(c,path,data)=>{const r=await c.request.fetch(base+'/api/local'+path,{method:data?'POST':'GET',headers:{Origin:base},...(data?{data}:{})});if(!r.ok())throw Error(path+' HTTP '+r.status());return r.json()}
 const initial='PruebaCAI-Inicial-2026',next='PruebaCAI-Nueva-2026'
 try {
  const admin=await create(),visitor=await create(),panel=await admin.newPage(),p=await visitor.newPage()
  for(const page of [panel,p]){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})}
  await api(admin,'/auth/login',{email:fixture.email,password:fixture.password})
  const requests=(await api(admin,'/requests')).requests,existing=requests.find(r=>r.applicant.email===recipient)
  const received=async(kind)=>{for(let i=0;i<80;i++){const mail=(await api(admin,'/__qa/mailbox')).mailbox.find(m=>m.to===recipient&&m.kind===kind);if(mail)return mail;await new Promise(r=>setTimeout(r,250))}throw Error('El servicio no confirmó el envío '+kind)}
  if(phase==='register') {
   if(existing)throw Error('La solicitud ya existe: continuar con la fase siguiente, sin volver a enviar.')
   await p.goto(base+'/registro');await p.getByRole('heading',{name:'Datos del alumno',exact:true}).waitFor();const form=p.getByRole('form')
   await form.locator('[name=firstName]').fill('Prueba');await form.locator('[name=lastName]').fill('Correo Real');await form.locator('[name=birthDate]').fill('2000-01-01');await form.locator('[name=program]').selectOption({label:'Inglés'});await form.locator('[name=email]').fill(recipient)
   await form.getByRole('button',{name:'Continuar',exact:true}).click();await form.getByRole('button',{name:'Continuar',exact:true}).click();await form.locator('[name=acceptRules]').check();await form.locator('[name=acceptPrivacy]').check();await form.getByRole('button',{name:'Enviar solicitud',exact:true}).click();await p.getByRole('heading',{name:'¡Solicitud enviada!',exact:true}).waitFor();check(true,'Registro real de la aplicación con perfil ficticio y correo institucional autorizado')
   await panel.goto(base+'/admin/solicitudes');await panel.getByLabel('Buscar solicitud',{exact:true}).fill(recipient);await panel.getByRole('button',{name:'Revisar solicitud de Prueba Correo Real',exact:true}).click();const dialog=panel.getByRole('dialog').last();await dialog.getByRole('button',{name:'Aprobar solicitud',exact:true}).click();await dialog.waitFor({state:'hidden'});check(true,'Aprobación desde la interfaz administrativa')
   await received('activation');const request=(await api(admin,'/requests')).requests.find(r=>r.applicant.email===recipient),status=await api(admin,'/students/'+request.id+'/access-email')
   check(status.delivery.state==='accepted','Gmail acepta por SMTP el correo de activación; recepción todavía por comprobar')
   check(errors.length===0,'Registro y aprobación sin errores de navegador')
   return {phase,requestId:request.id,checks:results.length,results,mailPurpose:'activation',inboxVerified:false}
  }
  if(!existing||existing.status!=='aprobada')throw Error('Falta la solicitud ficticia aprobada de esta prueba.')
  if(phase==='activate') {
   const activation=await received('activation');await p.goto(base+activation.path);await p.getByRole('heading',{name:'Activa tu acceso',exact:true}).waitFor();await p.getByLabel('Nueva contraseña',{exact:true}).fill(initial);await p.getByLabel('Confirma tu contraseña',{exact:true}).fill(initial);await p.getByRole('button',{name:'Activar mi cuenta',exact:true}).click();await p.getByRole('heading',{name:'Tu acceso está listo',exact:true}).waitFor();check(new URL(p.url()).hash==='','El enlace emitido en el correo real activa la cuenta y se retira de la dirección')
   await p.getByRole('link',{name:'Entrar a mi espacio',exact:true}).click();await p.getByLabel('Correo electrónico',{exact:true}).fill(recipient);await p.getByLabel('Contraseña',{exact:true}).fill(initial);await p.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await p.getByRole('heading',{name:'Tu comunidad, al día.',exact:true}).waitFor();check(true,'Alumno activado entra a la comunidad con su contraseña CAI de prueba')
   await p.goto(base+'/recuperar-acceso');await p.getByLabel('Correo de tu cuenta',{exact:true}).fill(recipient);await p.getByRole('button',{name:'Solicitar recuperación',exact:true}).click();await p.getByRole('status').filter({hasText:/recibirás un enlace/}).waitFor();await received('recovery');check(true,'La recuperación solicitada desde la interfaz emite un segundo correo real por Gmail')
   check(errors.length===0,'Activación, login y solicitud de recuperación sin errores de navegador')
   return {phase,requestId:existing.id,checks:results.length,results,mailPurpose:'recovery',inboxVerified:false}
  }
  if(phase==='recover') {
   const recovery=await received('recovery');await p.goto(base+recovery.path);await p.getByLabel('Nueva contraseña',{exact:true}).fill(next);await p.getByLabel('Confirma tu contraseña',{exact:true}).fill(next);await p.getByRole('button',{name:'Guardar nueva contraseña',exact:true}).click();await p.getByRole('heading',{name:'Contraseña actualizada',exact:true}).waitFor();check(new URL(p.url()).hash==='','El enlace de recuperación emitido por Gmail guarda la contraseña y retira el token')
   check((await visitor.request.post(base+'/api/local/student/login',{headers:{Origin:base},data:{email:recipient,password:initial}})).status()===401,'La contraseña anterior queda invalidada')
   await p.getByRole('link',{name:'Entrar a mi espacio',exact:true}).click();await p.getByLabel('Correo electrónico',{exact:true}).fill(recipient);await p.getByLabel('Contraseña',{exact:true}).fill(next);await p.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await p.getByRole('heading',{name:'Tu comunidad, al día.',exact:true}).waitFor();check(true,'La cuenta entra con la contraseña recuperada')
   const token=new URLSearchParams(recovery.path.split('#')[1]).get('token');check((await visitor.request.post(base+'/api/local/recovery/reset',{headers:{Origin:base},data:{token,password:initial,confirm:initial}})).status()===400,'El enlace real de recuperación no se puede utilizar dos veces')
   check(errors.length===0,'Recuperación y acceso final sin errores de navegador')
   return {phase,requestId:existing.id,checks:results.length,results}
  }
  throw Error('Fase de comprobación inválida.')
 }finally{await Promise.allSettled(contexts.map(c=>c.close()))}
}
