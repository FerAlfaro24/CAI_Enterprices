export async function checkRemoteRegistration(browser,{access,filesDir}) {
 const base=access.origin,results=[],errors=[],contexts=[]
 const create=async()=>{const c=await browser.newContext({...(access.entryMode==='open'?{}:{httpCredentials:access.gate}),viewport:{width:1440,height:1000},locale:'es-MX',reducedMotion:'reduce'});c.setDefaultTimeout(20000);contexts.push(c);return c}
 const check=(value,label)=>{if(!value)throw Error(label);results.push(label)}
 const api=async(c,path,method='GET',data)=>{const r=await c.request.fetch(base+'/api/local'+path,{method,data,headers:{Origin:base}});if(!r.ok())throw Error(path+' HTTP '+r.status());return r.json()}
 let admin,id
 try {
  const visitor=await create();admin=await create();const person=await visitor.newPage(),panel=await admin.newPage()
  for(const p of [person,panel]){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())})}
  const tag=String(Date.now()),email='alta-'+tag+'@example.test',password='FraseDePruebaPersonal-'+tag
  await person.goto(base+'/registro');await person.getByRole('heading',{name:'Datos del alumno',exact:true}).waitFor();check(!await person.title().then(t=>t.includes('Prototipo')),'Registro directo carga la versión conectada actual')
  const form=person.getByRole('form');check(await form.locator('input[name=password]').count()===0,'La solicitud explica que la contraseña se elige al activar')
  await form.locator('[name=firstName]').fill('Visitante');await form.locator('[name=lastName]').fill('Prueba'+tag);await form.locator('[name=birthDate]').fill('2000-01-01');await form.locator('[name=program]').selectOption({label:'Inglés'});await form.locator('[name=email]').fill(email)
  await form.getByRole('button',{name:'Continuar',exact:true}).click();await person.getByRole('heading',{name:'Perfil y privacidad',exact:true}).waitFor();await form.getByRole('button',{name:'Continuar',exact:true}).click();await form.locator('[name=acceptRules]').check();await form.locator('[name=acceptPrivacy]').check();await form.getByRole('button',{name:'Enviar solicitud',exact:true}).click();await person.getByRole('heading',{name:'¡Solicitud enviada!',exact:true}).waitFor();check(true,'Una persona sin cuenta envía su propia solicitud por HTTPS')
  check(await person.getByText(/CAI ya puede revisar tu solicitud/).isVisible(),'La confirmación explica aprobación y activación sin afirmar solo este equipo')
  await api(admin,'/auth/login','POST',access.admin);await panel.goto(base+'/admin/solicitudes');await panel.getByLabel('Buscar solicitud',{exact:true}).fill(email);await panel.getByRole('button',{name:/^Revisar solicitud de Visitante/}).click();let d=panel.getByRole('dialog').last();await d.waitFor();check(await d.getByText(email,{exact:true}).isVisible(),'Coordinación recibe y consulta la solicitud del visitante')
  let row=(await api(admin,'/requests')).requests.find(r=>r.applicant.email===email);id=row.id;check(row.status==='pendiente','La solicitud nueva queda pendiente, sin aprobación automática')
  await d.getByRole('button',{name:'Aprobar solicitud',exact:true}).click();await d.waitFor({state:'hidden'});check((await api(admin,'/requests')).requests.find(r=>r.id===id).status==='aprobada','Aprobar guarda la decisión en la misma copia compartida')
  await panel.getByRole('navigation',{name:'Secciones de administración'}).getByRole('link',{name:'Alumnos',exact:true}).click();await panel.getByLabel('Buscar alumno',{exact:true}).fill(id);await panel.locator('tbody tr').filter({hasText:id}).getByRole('button',{name:/^Ficha de/}).click();d=panel.getByRole('dialog').last();await d.getByRole('button',{name:'Preparar acceso',exact:true}).click();const linkField=panel.getByLabel('Enlace de activación',{exact:true});await linkField.waitFor();const activation=await linkField.inputValue();check(activation.startsWith(base+'/activar#token='),'El enlace de activación utiliza el dominio compartido y no localhost')
  check(await panel.getByText('funciona únicamente en este equipo',{exact:false}).count()===0,'La invitación no muestra la limitación local incorrecta')
  for(const width of [375,320]){await person.setViewportSize({width,height:950});check(await person.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Confirmación de registro sin desbordamiento '+width)}
  await person.goto(activation);await person.getByRole('heading',{name:'Activa tu acceso',exact:true}).waitFor();await person.getByLabel('Nueva contraseña',{exact:true}).fill(password);await person.getByLabel('Confirma tu contraseña',{exact:true}).fill(password);await person.getByRole('button',{name:'Activar mi cuenta',exact:true}).click();await person.getByRole('heading',{name:'Tu acceso está listo',exact:true}).waitFor();check(true,'El visitante elige y confirma su propia contraseña')
  check(new URL(person.url()).hash==='','El token de activación se retira de la dirección')
  await person.getByRole('link',{name:'Entrar a mi espacio',exact:true}).click();await person.getByLabel('Correo electrónico',{exact:true}).fill(email);await person.getByLabel('Contraseña',{exact:true}).fill(password);await person.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await person.getByRole('heading',{name:'Tu comunidad, al día.',exact:true}).waitFor();check(true,'La cuenta recién creada entra con su propia contraseña')
  const user=(await api(visitor,'/student/me')).user;check(user.id===id&&user.group===''&&user.program==='Inglés','La sesión corresponde al nuevo alumno y su clase, sin grupo')
  await person.reload();await person.getByRole('heading',{name:'Tu comunidad, al día.',exact:true}).waitFor();check(true,'La cuenta nueva conserva la sesión al recargar')
  await person.screenshot({path:filesDir+'/self-registration-community.png'})
  check(errors.length===0,'Recorrido sin errores JavaScript ni consola inesperados'+(errors.length?': '+errors.join('; '):''))
  return {checks:results.length,results,errors,syntheticRequest:id}
 } finally {
  if(admin&&id){try{const student=(await api(admin,'/students')).students.find(s=>s.id===id);if(student?.status==='activo')await api(admin,'/students/'+id,'PATCH',{revision:student.revision,status:'suspendido'})}catch{}}
  await Promise.allSettled(contexts.map(c=>c.close()))
 }
}
