/** Compilación real: descarga diferida, recuperación de errores y permisos. */
export async function checkStabilization(page,{email,password,browserLabel='Prueba',baseURL='http://127.0.0.1:4180',assets}={}){
  const details=[],errors=[],contexts=[],listeners=[],matrix=[]
  let expectedModuleFailure=false,releaseLoading
  const check=(ok,label)=>{if(!ok)throw new Error(label);details.push(label)}
  const watch=target=>{target.setDefaultTimeout(10_000);const listener=error=>{if(!expectedModuleFailure)errors.push(String(error))};target.on('pageerror',listener);listeners.push([target,listener])}
  const call=(target,route,method='GET',data,key)=>target.evaluate(async({route,method,data,key})=>{
    const response=await fetch('/api/local'+route,{method,headers:{...(data===undefined?{}:{'Content-Type':'application/json'}),...(key?{'Idempotency-Key':key}:{})},body:data===undefined?undefined:JSON.stringify(data)})
    const result=await response.json();if(!response.ok)throw new Error(`${route}: ${response.status} ${result.error}`);return result
  },{route,method,data,key})
  const open=async()=>{const context=await page.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});contexts.push(context);const target=await context.newPage();watch(target);return target}
  try{
    const admin=await open(),student=await open(),loading=await open()
    await admin.bringToFront();await admin.goto(baseURL+'/');await admin.getByRole('link',{name:'Iniciar sesión / Registrarse',exact:true}).waitFor()
    const landingResources=await admin.evaluate(()=>performance.getEntriesByType('resource').map(item=>new URL(item.name).pathname).filter(path=>path.endsWith('.js')))
    check(!landingResources.includes('/'+assets.admin)&&!landingResources.includes('/'+assets.community),'La portada no descarga las pantallas de administración ni Community')
    check(!landingResources.includes('/'+assets.signup),'La portada tampoco descarga el formulario completo de inscripción')
    await admin.locator('body').evaluate(body=>body.dataset.stabilization='same-document')
    await admin.getByRole('link',{name:'Iniciar sesión / Registrarse',exact:true}).click();await admin.getByRole('form',{name:'Acceso de alumnos',exact:true}).waitFor()
    check(await admin.locator('body').getAttribute('data-stabilization')==='same-document','El acceso diferido abre sin recargar todo el documento')
    await admin.getByRole('link',{name:'Acceso de administración',exact:true}).click()
    await admin.getByRole('form',{name:'Acceso de administración',exact:true}).waitFor()
    await admin.locator('#login-email').fill(email);await admin.locator('#login-password').fill(password)
    await admin.getByRole('button',{name:'Entrar al panel',exact:true}).click();await admin.getByRole('heading',{name:'Hola, Coordinación',exact:true}).waitFor()
    check(true,'El panel diferido conserva el acceso y los datos del servidor')
    let requestReads=0
    const count= request=>{if(request.url().endsWith('/api/local/requests')&&request.method()==='GET')requestReads++}
    admin.on('request',count)
    const nav=admin.getByRole('navigation',{name:'Secciones de administración',exact:true})
    for(const [link,heading]of [['Solicitudes de ingreso','Solicitudes de ingreso'],['Alumnos','Alumnos'],['Publicaciones','Publicaciones'],['Mensajes y avisos','Mensajes y avisos']]){
      await nav.getByRole('link',{name:new RegExp('^'+link)}).click();await admin.getByRole('heading',{name:heading,exact:true,level:1}).waitFor()
    }
    admin.off('request',count)
    check(requestReads===0,'Cargar nuevas secciones conserva el panel montado y su instantánea')
    const broken='**/'+assets.settings
    await admin.route(broken,route=>route.abort('failed'));expectedModuleFailure=true
    await nav.getByRole('link',{name:'Configuración',exact:true}).click();await admin.getByRole('heading',{name:'No pudimos abrir esta página',exact:true}).waitFor()
    check(!(await admin.locator('body').innerText()).includes('stack'),'Un módulo inaccesible muestra una recuperación comprensible sin traza técnica')
    for(const width of [1440,768,375,320]){await admin.setViewportSize({width,height:1000});check(await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Recuperación de pantalla a ${width}px sin desbordamiento`);matrix.push({width,view:'route-error'})}
    await admin.unroute(broken);expectedModuleFailure=false
    await admin.getByRole('button',{name:'Volver a cargar',exact:true}).click();await admin.getByRole('heading',{name:'Configuración',exact:true,level:1}).waitFor()
    check(new URL(admin.url()).pathname==='/admin/configuracion','Recargar recupera el módulo y conserva destino y sesión')
    const recovery='**/'+assets.recovery
    const gate=new Promise(resolve=>{releaseLoading=resolve})
    await loading.route(recovery,async route=>{await gate;await route.continue()})
    await loading.bringToFront();await loading.goto(baseURL+'/recuperar-acceso',{waitUntil:'domcontentloaded'})
    await loading.getByRole('status').filter({hasText:'Cargando página…'}).waitFor();check(true,'La espera de un módulo muestra un estado de carga accesible')
    releaseLoading();await loading.getByRole('heading',{name:'Recupera tu acceso',exact:true}).waitFor();await loading.unroute(recovery)
    check(true,'La pantalla termina de cargar al recuperar la conexión')
    const unavailable='**/api/local/auth/session'
    await admin.bringToFront();await admin.route(unavailable,route=>route.abort('failed'));await admin.goto(baseURL+'/admin')
    await admin.getByRole('heading',{name:'No pudimos comprobar tu acceso',exact:true}).waitFor()
    check(!(await admin.getByRole('form',{name:'Acceso de administración',exact:true}).count()),'Un fallo de servicio al comprobar sesión no se presenta como credenciales incorrectas')
    const readable=await admin.getByRole('button',{name:'Volver a intentar',exact:true}).evaluate(button=>{
      const css=getComputedStyle(button),color=css.color.match(/[\d.]+/g).map(Number),background=css.backgroundColor.match(/[\d.]+/g).map(Number)
      const luminance=rgb=>rgb.slice(0,3).map(value=>{const c=value/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0)
      const a=luminance(color),b=luminance(background)
      return (background[3]??1)===1&&(Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5
    })
    check(readable,'El botón de reintento tiene fondo visible y contraste de texto suficiente')
    await admin.unroute(unavailable);await admin.getByRole('button',{name:'Volver a intentar',exact:true}).click();await admin.getByRole('heading',{name:'Hola, Coordinación',exact:true}).waitFor()
    check(true,'Reintentar la comprobación recupera la sesión sin pedir otra contraseña')
    const privateRead='**/api/local/requests'
    await admin.route(privateRead,route=>route.abort('failed'));await admin.reload();await admin.getByRole('alert').waitFor()
    check(!(await admin.getByRole('heading',{name:'Hola, Coordinación',exact:true}).count()),'Si no llegan los datos privados no muestra un dashboard con cifras de muestra')
    await admin.unroute(privateRead);await admin.getByRole('button',{name:'Volver a cargar',exact:true}).click();await admin.getByRole('heading',{name:'Hola, Coordinación',exact:true}).waitFor()
    check(true,'El reintento de datos conserva el panel y recupera sus cifras')
    const unique=browserLabel+Date.now(),account=`estable-${unique.toLowerCase()}@example.test`,secret='Contraseña ficticia estabilidad 2026'
    await student.goto(baseURL+'/login')
    const receipt=await call(admin,'/requests','POST',{firstName:'Alumno',lastName:unique,birthDate:'2000-01-01',email:account,filledBy:'alumno',program:'Business English',group:'Mar y jue · 19:30',displayName:'Estabilidad '+browserLabel,avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true},crypto.randomUUID())
    await call(admin,`/requests/${receipt.id}/approve`,'POST',{revision:1})
    let record=(await call(admin,'/students')).students.find(item=>item.id===receipt.id)
    const invitation=await call(admin,`/students/${record.id}/invitation`,'POST',{revision:record.revision})
    await call(student,'/activation','POST',{token:invitation.path.split('token=')[1],password:secret,confirm:secret})
    const own='**/api/local/student/me'
    await student.bringToFront();await student.route(own,route=>route.abort('failed'))
    await student.locator('#login-email').fill(account);await student.locator('#login-password').fill(secret);await student.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click()
    await student.getByRole('heading',{name:'No pudimos actualizar tu comunidad',exact:true}).waitFor()
    check(!(await student.getByRole('button',{name:/Abrir perfil ficticio/}).count()),'Community no sustituye por una identidad de muestra cuando falla el servicio')
    await student.unroute(own);await student.getByRole('button',{name:'Volver a intentar',exact:true}).click();await student.getByRole('button',{name:'Actualizar comunidad',exact:true}).waitFor()
    check(true,'Community recupera la cuenta y su grupo mediante reintento')
    const denied=await student.evaluate(async()=>(await fetch('/api/local/requests')).status)
    check(denied===401,'La carga separada de código no cambia los permisos de alumno')
    await student.getByRole('button',{name:'Compartir algo',exact:true}).first().click();const dialog=student.getByRole('dialog')
    await dialog.getByLabel('Título',{exact:true}).fill('Borrador '+unique);await dialog.getByLabel('Tu historia',{exact:true}).fill('Texto ficticio conservado cuando falla el envío de una publicación.')
    const postRoute='**/api/local/student/posts'
    const abortPost=route=>route.request().method()==='POST'?route.abort('failed'):route.continue()
    await student.route(postRoute,abortPost);await dialog.getByRole('button',{name:'Enviar a revisión',exact:true}).click();await dialog.getByRole('alert').waitFor()
    check((await dialog.getByLabel('Título',{exact:true}).inputValue())==='Borrador '+unique,'Un fallo de envío conserva el borrador editable')
    await student.unroute(postRoute,abortPost);await dialog.getByRole('button',{name:'Enviar a revisión',exact:true}).click();await dialog.waitFor({state:'hidden'})
    check((await call(student,'/student/posts')).mine.filter(post=>post.title==='Borrador '+unique).length===1,'Reintentar el borrador genera una sola publicación pendiente')
    record=(await call(admin,'/students')).students.find(item=>item.id===receipt.id)
    await call(admin,`/students/${record.id}`,'PATCH',{revision:record.revision,status:'suspendido'})
    await student.getByRole('button',{name:'Actualizar comunidad',exact:true}).click();await student.getByRole('form',{name:'Acceso de alumnos',exact:true}).waitFor()
    check(true,'La revocación de sesión sigue cerrando la comunidad conectada')
    check(errors.length===0,'Sin errores inesperados de ejecución JavaScript')
    return {browserLabel,checks:details.length,details,matrix,landingScripts:landingResources.length,errors}
  }catch(error){throw new Error(`${error.message}\nComprobaciones completadas: ${details.length}\n${details.join('\n')}`)}
  finally{releaseLoading?.();for(const[target,listener]of listeners)target.off('pageerror',listener);for(const context of contexts)await context.close()}
}
