/** Registro real y convivencia entre clases; solo fixture local y cuentas ficticias. */
export async function checkSharedCommunity(page,{baseURL,email,password,filesDir,browserLabel='brave'}) {
 if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(baseURL)||!email.endsWith('@example.test'))throw Error('Usa una fixture local aislada.')
 const browser=page.context().browser(),contexts=[],results=[],errors=[],expectedAnonymous=new Set()
 const check=(ok,label)=>{if(!ok)throw Error(label);results.push(label)}
 const create=async()=>{const c=await browser.newContext({locale:'es-MX',viewport:{width:1440,height:1000},reducedMotion:'reduce'});contexts.push(c);return c}
 const open=async c=>{const p=await c.newPage();p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!(expectedAnonymous.has(p)&&m.text().includes('401 (Unauthorized)')))errors.push(m.text())});return p}
 const api=async(c,path,method='GET',data)=>{const r=await c.request.fetch(baseURL+'/api/local'+path,{method,data,headers:{Origin:baseURL}});if(!r.ok())throw Error(path+' HTTP '+r.status());return r.json()}
 try {
  const admin=await create(),a=await create(),b=await create(),p=await open(a),q=await open(b),panel=await open(admin)
  await api(admin,'/auth/login','POST',{email,password})
  const tag=Date.now()+'-'+browserLabel,people=[{c:a,p,first:'Marina'+browserLabel,last:'Prueba',birth:'2016-01-01',className:'Francés',email:'minor-'+tag+'@example.test'},{c:b,p:q,first:'Daniel'+browserLabel,last:'Prueba',birth:'2000-01-01',className:'Inglés',email:'adult-'+tag+'@example.test'}]
  const ids=[]
  for(const [index,person] of people.entries()){
   const t=person.p;await t.goto(baseURL+'/registro');await t.getByRole('heading',{name:'Datos del alumno',exact:true}).waitFor()
   const f=t.getByRole('form');check(await f.getByRole('list',{name:'Pasos de la solicitud'}).locator('li').count()===3,'Registro tiene tres pasos: '+person.className)
   check(await f.locator('[name=filledBy],[name=studentCode],[name=group],[name=guardianName],[name=password]').count()===0,'No pide tutor, matrícula, grupo ni contraseña en registro: '+person.className)
   check(JSON.stringify(await f.getByLabel('Clase',{exact:true}).locator('option').allTextContents())===JSON.stringify(['Selecciona tu clase','Inglés','Francés','Español']),'Las tres clases se muestran claramente')
   await f.locator('[name=firstName]').fill(person.first);await f.locator('[name=lastName]').fill(person.last);await f.locator('[name=birthDate]').fill(person.birth);await f.locator('[name=email]').fill(person.email)
   await f.getByRole('button',{name:'Continuar',exact:true}).click();check(await f.getByText('Selecciona Inglés, Francés o Español.',{exact:true}).isVisible(),'No permite continuar sin clase')
   await f.getByLabel('Clase',{exact:true}).selectOption(person.className)
   for(const width of [1440,768,375,320]){await t.setViewportSize({width,height:1000});check(await t.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Registro sin desbordamiento '+width+' / '+person.className)}
   if(index===0&&filesDir)await t.screenshot({path:filesDir+'/'+browserLabel+'-registration-mobile.png',fullPage:true})
   await f.getByRole('button',{name:'Continuar',exact:true}).click();await t.getByRole('heading',{name:'Perfil y privacidad',exact:true}).waitFor();check(await f.getByText(/Autorización del tutor/).count()===0,'Menor y adulto avanzan directamente al perfil')
   await f.getByRole('button',{name:'Continuar',exact:true}).click();await t.getByRole('heading',{name:'Revisar y enviar',exact:true}).waitFor()
   check(await f.getByText('Se genera al enviar tu solicitud.',{exact:true}).isVisible(),'La revisión explica la matrícula automática')
   await f.locator('[name=acceptRules]').check();await f.locator('[name=acceptPrivacy]').check();await f.getByRole('button',{name:'Enviar solicitud',exact:true}).click();await t.getByRole('heading',{name:'¡Solicitud enviada!',exact:true}).waitFor()
   check(await t.getByText('Autorización del tutor',{exact:true}).count()===0,'La confirmación no añade autorización pendiente')
   const row=(await api(admin,'/requests')).requests.find(r=>r.applicant.email===person.email);ids.push(row.id)
   check(row.program===person.className&&row.applicant.group===''&&row.applicant.studentCode===row.id&&row.guardianConsent===undefined,'Solicitud con clase, folio automático y sin consentimiento inventado')
   expectedAnonymous.add(t);await t.goto(baseURL+'/community');await t.getByRole('form',{name:'Acceso de alumnos',exact:true}).waitFor();expectedAnonymous.delete(t);check(new URL(t.url()).pathname==='/login','Una solicitud pendiente todavía no entra a comunidad')
   await panel.goto(baseURL+'/admin/solicitudes');await panel.getByLabel('Buscar solicitud',{exact:true}).fill(person.email);await panel.getByRole('button',{name:new RegExp('^Revisar solicitud de '+person.first)}).click();let dialog=panel.getByRole('dialog').last();await dialog.waitFor()
   check(await dialog.getByRole('button',{name:'Aprobar solicitud',exact:true}).isEnabled(),'Administrador puede aprobar al menor sin autorización adicional')
   await dialog.getByRole('button',{name:'Aprobar solicitud',exact:true}).click();await dialog.waitFor({state:'hidden'})
   await panel.getByRole('navigation',{name:'Secciones de administración'}).getByRole('link',{name:'Alumnos',exact:true}).click();await panel.getByLabel('Buscar alumno',{exact:true}).fill(row.id);await panel.locator('tbody tr').filter({hasText:row.id}).getByRole('button',{name:/^Ficha de/}).click();dialog=panel.getByRole('dialog').last();await dialog.getByRole('button',{name:'Preparar acceso',exact:true}).click();const linkField=panel.getByLabel('Enlace de activación',{exact:true});await linkField.waitFor();const link=await linkField.inputValue()
   await t.goto(link);await t.getByRole('form',{name:'Activar cuenta de alumno',exact:true}).waitFor();await t.getByLabel('Nueva contraseña',{exact:true}).fill('abcdefgh');await t.getByLabel('Confirma tu contraseña',{exact:true}).fill('abcdefgh');await t.getByRole('button',{name:'Activar mi cuenta',exact:true}).click();await t.getByRole('heading',{name:'Tu acceso está listo',exact:true}).waitFor()
   await t.getByRole('link',{name:'Entrar a mi espacio',exact:true}).click();await t.getByLabel('Correo electrónico',{exact:true}).fill(person.email);await t.getByLabel('Contraseña',{exact:true}).fill('abcdefgh');await t.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await t.getByRole('heading',{name:'Tu comunidad, al día.',exact:true}).waitFor()
   check((await api(person.c,'/student/me')).user.group==='','La cuenta activa entra sin grupo: '+person.className)
  }
  check(ids[0]!==ids[1],'Cada persona conserva una matrícula única')
  await p.reload();await p.getByRole('heading',{name:'Tu comunidad, al día.',exact:true}).waitFor()
  const first=(await api(a,'/student/me')).user,second=(await api(b,'/student/me')).user
  const ma=(await api(a,'/student/group')).members,mb=(await api(b,'/student/group')).members
  check(ma.some(m=>m.id===second.publicId)&&mb.some(m=>m.id===first.publicId),'Alumnos de Francés e Inglés se ven entre compañeros')
  check(ma.every(m=>m.joinedAt&&!('email' in m)&&!('birthDate' in m)),'Compañeros tienen fecha de ingreso y datos privados ocultos')
  check(await p.getByRole('button',{name:second.displayName,exact:true}).first().isVisible(),'El recién integrado aparece en Inicio')
  await p.getByRole('button',{name:second.displayName,exact:true}).first().click();const profile=p.getByRole('dialog').last();await profile.waitFor();check(await profile.getByText(second.displayName,{exact:true}).count()>0,'Se puede abrir el perfil de otra clase');await p.keyboard.press('Escape')
  await p.getByRole('button',{name:'Compartir algo',exact:true}).first().click();let composer=p.getByRole('dialog').last();await composer.waitFor();const title='Una comunidad compartida '+tag
  await composer.getByLabel('Título',{exact:true}).fill(title);await composer.getByLabel('Tu historia',{exact:true}).fill('Probamos juntos cómo practicar un idioma y compartir nuestros avances con alumnos de otras clases.');await composer.getByRole('button',{name:'Enviar a revisión',exact:true}).click();await composer.waitFor({state:'hidden'})
  const post=(await api(a,'/student/posts')).mine.find(post=>post.title===title);check(post.status==='pendiente'&&!(await api(b,'/student/posts')).posts.some(p=>p.id===post.id),'Las publicaciones siguen privadas hasta aprobación')
  await api(admin,'/posts/'+post.id+'/approve','POST',{revision:post.revision,confirmed:true});await q.reload();await q.getByRole('heading',{name:'Tu comunidad, al día.',exact:true}).waitFor();await q.getByRole('button',{name:title,exact:true}).waitFor();check(true,'La publicación aprobada aparece para otra clase en pantalla')
  const ca=await api(a,'/student/challenges'),cb=await api(b,'/student/challenges');check(ca.items.length===3&&JSON.stringify(ca.items)===JSON.stringify(cb.items)&&!ca.needsGroup&&!cb.needsGroup,'Tres retos comunes y mismos identificadores para ambas clases')
  await q.getByRole('navigation',{name:'Secciones de comunidad'}).getByRole('button',{name:'Retos',exact:true}).click();check(await q.getByText(/asignarte un grupo/).count()===0,'Retos se abre sin exigir asignación')
  for(const theme of ['Modo claro','Modo oscuro']){
   const themeButton=q.getByRole('button',{name:theme,exact:true});if(await themeButton.count())await themeButton.click()
   for(const width of [1440,375,320]){await q.setViewportSize({width,height:1000});check(await q.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Comunidad sin desbordamiento '+theme+' / '+width)}
  }
  if(filesDir)await q.screenshot({path:filesDir+'/'+browserLabel+'-shared-challenges.png',fullPage:true})
  const before=(await api(b,'/student/challenges')).progress
  const row=(await api(admin,'/students')).students.find(s=>s.id===ids[1]);await api(admin,'/students/'+row.id+'/assignment','PATCH',{revision:row.revision,program:'Español',group:'',confirmed:true})
  check((await b.request.get(baseURL+'/api/local/student/me')).status()===401,'Cambiar clase requiere volver a entrar')
  await api(b,'/student/login','POST',{email:people[1].email,password:'abcdefgh'});check((await api(b,'/student/me')).user.program==='Español','Coordinación puede cambiar clase sin inventar grupo')
  check((await api(b,'/student/posts')).posts.some(p=>p.id===post.id)&&JSON.stringify((await api(b,'/student/challenges')).progress)===JSON.stringify(before),'Cambiar de clase conserva comunidad y progreso')
  check(errors.length===0,'Sin errores de consola ni JavaScript: '+errors.join('; '))
  return {checks:results.length,results,errors}
 }finally{await Promise.allSettled(contexts.map(c=>c.close()))}
}
