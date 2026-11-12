/** Compatibilidad de enlaces anteriores, permisos e inscripción preservada. */
export async function checkUnifiedNavigation(page, {email,password,browserLabel='Prueba',baseURL='http://127.0.0.1:5173'}={}) {
  const details=[],errors=[],contexts=[],listeners=[],matrix=[]
  const check=(ok,label)=>{if(!ok)throw new Error(label);details.push(label)}
  const watch=target=>{target.setDefaultTimeout(10_000);const listener=error=>errors.push(String(error));target.on('pageerror',listener);listeners.push([target,listener])}
  const call=(target,route,method='GET',data,key)=>target.evaluate(async({route,method,data,key})=>{
    const response=await fetch('/api/local'+route,{method,headers:{...(data===undefined?{}:{'Content-Type':'application/json'}),...(key?{'Idempotency-Key':key}:{})},body:data===undefined?undefined:JSON.stringify(data)})
    const body=await response.json();if(!response.ok)throw new Error(`${route}: ${response.status} ${body.error}`);return body
  },{route,method,data,key})
  const routes=[
    ['/gestion','/admin','Hola, Coordinación'],
    ['/gestion/solicitudes','/admin/solicitudes','Solicitudes de ingreso'],
    ['/gestion/alumnos','/admin/alumnos','Alumnos'],
    ['/gestion/publicaciones','/admin/publicaciones','Publicaciones'],
    ['/gestion/avisos','/admin/mensajes?bandeja=avisos','Mensajes y avisos'],
    ['/gestion/ruta-desconocida','/admin','Hola, Coordinación'],
  ]
  const at=(target,path)=>target.url()===baseURL+path
  const unique=browserLabel+Date.now(),account=`rutas-${unique.toLowerCase()}@example.test`,secret='Contraseña ficticia de navegación 2026'
  watch(page)
  try{
    await page.bringToFront();await page.setViewportSize({width:1440,height:1000});await page.goto(baseURL+'/admin')
    await page.getByRole('heading',{level:1}).waitFor()
    if(await page.locator('#login-email').isVisible()){
      await page.locator('#login-email').fill(email);await page.locator('#login-password').fill(password)
      await page.getByRole('button',{name:'Entrar al panel',exact:true}).click()
    }
    await page.getByRole('navigation',{name:'Secciones de administración',exact:true}).waitFor()
    const pages=[]
    for(let i=0;i<2;i++){
      const context=await page.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
      contexts.push(context);const target=await context.newPage();watch(target);pages.push(target)
    }
    const [visitor,student]=pages
    for(const [before,after]of routes){
      await visitor.goto(baseURL+before);await visitor.getByRole('form',{name:'Acceso de administración',exact:true}).waitFor()
      check(at(visitor,after)&&!(await visitor.getByRole('navigation',{name:'Secciones de administración',exact:true}).count()),`${before} conserva protección y destino ${after}`)
    }
    for(const path of ['/alumnos','/alumnos/publicaciones','/mi-inscripcion']){
      await visitor.goto(baseURL+path);await visitor.getByRole('form',{name:'Acceso de alumnos',exact:true}).waitFor()
      check(at(visitor,'/login'),`${path} exige cuenta de alumno`)
    }
    await visitor.goto(baseURL+'/registro-local?returnTo=https://example.test/#token=ficticio')
    await visitor.getByRole('form').waitFor()
    check(at(visitor,'/registro')&&!(await visitor.locator('input[type=password]').count()),'Registro antiguo abre el formulario oficial sin aceptar destino externo ni fragmento')
    for(const [before,after,heading]of routes){
      await page.bringToFront();await page.goto(baseURL+before);await page.getByRole('heading',{name:heading,exact:true,level:1}).waitFor()
      check(at(page,after),`${before} abre la sección oficial ${after}`)
    }
    await page.goto(baseURL+'/gestion/avisos');await page.getByRole('region',{name:'Avisos de acceso',exact:true}).waitFor()
    check(await page.getByRole('button',{name:'Avisos de acceso',exact:true}).getAttribute('aria-pressed')==='true','El enlace antiguo de avisos conserva su bandeja específica')
    await page.reload();await page.getByRole('region',{name:'Avisos de acceso',exact:true}).waitFor()
    check(true,'La bandeja de avisos sobrevive a una recarga')
    await page.getByRole('button',{name:'Consultas de contacto',exact:true}).click()
    check(at(page,'/admin/mensajes'),'Contacto tiene dirección propia sin la selección de avisos')
    await page.goBack();await page.getByRole('region',{name:'Avisos de acceso',exact:true}).waitFor()
    check(at(page,'/admin/mensajes?bandeja=avisos'),'Atrás restaura la bandeja anterior')
    await page.goto(baseURL+'/');await page.goto(baseURL+'/gestion/solicitudes?returnTo=https://example.test/#token=ficticio')
    await page.getByRole('heading',{name:'Solicitudes de ingreso',exact:true,level:1}).waitFor()
    check(at(page,'/admin/solicitudes'),'Los alias administrativos descartan parámetros ajenos y fragmentos')
    await page.goBack();await page.waitForURL(baseURL+'/')
    check(true,'La redirección reemplaza el alias sin crear un bucle al volver atrás')
    await page.goForward();await page.getByRole('heading',{name:'Solicitudes de ingreso',exact:true,level:1}).waitFor()
    check(at(page,'/admin/solicitudes'),'Adelante conserva el destino oficial')
    await student.goto(baseURL+'/login')
    const receipt=await call(page,'/requests','POST',{firstName:'Alumno',lastName:unique,birthDate:'2000-01-01',email:account,filledBy:'alumno',program:'Business English',group:'Mar y jue · 19:30',displayName:'Navegación'+'x'.repeat(35),avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true},crypto.randomUUID())
    await call(page,`/requests/${receipt.id}/approve`,'POST',{revision:1})
    let record=(await call(page,'/students')).students.find(item=>item.id===receipt.id)
    const invitation=await call(page,`/students/${record.id}/invitation`,'POST',{revision:record.revision})
    await student.bringToFront();await student.goto(baseURL+invitation.path)
    await student.getByLabel('Nueva contraseña',{exact:true}).fill(secret);await student.getByLabel('Confirma tu contraseña',{exact:true}).fill(secret)
    check(await student.evaluate(()=>location.hash===''),'La activación conserva el enlace privado fuera de la barra')
    await student.getByRole('button',{name:'Activar mi cuenta',exact:true}).click();await student.getByRole('link',{name:'Entrar a mi espacio',exact:true}).click()
    await student.locator('#login-email').fill(account);await student.locator('#login-password').fill(secret)
    await student.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await student.getByRole('button',{name:'Actualizar comunidad',exact:true}).waitFor()
    check(at(student,'/community'),'La cuenta activada entra al recorrido oficial de Community')
    await student.getByRole('link',{name:'Mi inscripción',exact:true}).click();await student.getByRole('heading',{name:'Mi inscripción',exact:true,level:1}).waitFor()
    check(at(student,'/mi-inscripcion'),'Mi inscripción tiene un único destino vigente')
    const profile=student.getByRole('region',{name:'Datos de mi inscripción',exact:true})
    check((await profile.innerText()).includes('Business English')&&(await profile.innerText()).includes('Mar y jue · 19:30'),'La ficha conserva nombre visible, programa y grupo del servidor')
    check(!(await student.locator('a[href="/alumnos"],a[href="/alumnos/publicaciones"]').count()),'La ficha no ofrece enlaces al feed provisional')
    await student.getByRole('button',{name:'Actualizar mi espacio',exact:true}).click();await student.reload();await profile.waitFor()
    check(true,'La ficha y sesión se conservan después de actualizar y recargar')
    await student.goto(baseURL+'/alumnos');await profile.waitFor()
    check(at(student,'/mi-inscripcion'),'El enlace anterior de alumno conserva su ficha, sin perder información')
    await student.goto(baseURL+'/alumnos/publicaciones');await student.getByRole('button',{name:'Actualizar comunidad',exact:true}).waitFor()
    check(at(student,'/community')&&!(await student.getByText('Comunidad de mi grupo',{exact:true}).count()),'El feed anterior lleva al feed avanzado conectado')
    await student.goto(baseURL+'/gestion/solicitudes');await student.getByRole('form',{name:'Acceso de administración',exact:true}).waitFor()
    check(at(student,'/admin/solicitudes')&&!(await student.getByRole('navigation',{name:'Secciones de administración',exact:true}).count()),'La redirección nunca convierte una cuenta de alumno en administrador')
    const denied=await student.evaluate(async()=>({requests:(await fetch('/api/local/requests')).status,gallery:(await fetch('/api/local/gallery')).status}))
    check(denied.requests===401&&denied.gallery===401,'El servidor mantiene los permisos detrás de los enlaces antiguos')
    await student.goto(baseURL+'/mi-inscripcion');await profile.waitFor()
    for(const width of [1440,768,375,320]){
      await student.bringToFront();await student.setViewportSize({width,height:1000})
      check(await student.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Ficha de inscripción a ${width}px sin desbordamiento`)
      await page.bringToFront();await page.setViewportSize({width,height:1000});await page.goto(baseURL+'/gestion/avisos');await page.getByRole('region',{name:'Avisos de acceso',exact:true}).waitFor()
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Bandeja de avisos a ${width}px sin desbordamiento`)
      matrix.push({width,views:['enrollment','admin-notices']})
    }
    await visitor.bringToFront();await visitor.goto(baseURL+'/una-ruta-que-no-existe');await visitor.getByRole('heading',{level:1}).waitFor()
    check(at(visitor,'/una-ruta-que-no-existe')&&(await visitor.locator('body').innerText()).includes('404'),'Las rutas desconocidas conservan la página 404')
    await visitor.goto(baseURL+'/solicitud-google');await visitor.getByRole('link',{name:'Entrar con contraseña',exact:true}).waitFor()
    check(await visitor.getByRole('link',{name:'Entrar con contraseña',exact:true}).getAttribute('href')==='/login','La alternativa a Google apunta al acceso oficial')
    await page.bringToFront();record=(await call(page,'/students')).students.find(item=>item.id===receipt.id)
    await call(page,`/students/${record.id}`,'PATCH',{revision:record.revision,status:'suspendido'})
    await student.bringToFront();await student.goto(baseURL+'/alumnos');await student.getByRole('form',{name:'Acceso de alumnos',exact:true}).waitFor()
    check(at(student,'/login'),'Suspender revoca el acceso también al entrar por una dirección anterior')
    check(errors.length===0,'Sin errores de ejecución JavaScript en el recorrido')
    await page.bringToFront();await page.setViewportSize({width:1440,height:1000});await page.goto(baseURL+'/admin')
    return {browserLabel,checks:details.length,details,matrix,errors}
  }catch(error){throw new Error(`${error.message}\nComprobaciones completadas: ${details.length}\n${details.join('\n')}`)}
  finally{for(const[target,listener]of listeners)target.off('pageerror',listener);for(const context of contexts)await context.close()}
}
