/** Recorrido oficial v1.0: no usa /gestion para completar solicitudes o cuentas. */
async function checkV1Connected(page,{email,password,browserLabel='Prueba',baseURL='http://127.0.0.1:5173'}={}) {
  const details=[],errors=[],matrix=[]
  const check=(ok,label)=>{if(!ok)throw new Error(label);details.push(label)}
  const onError=error=>errors.push(String(error));page.on('pageerror',onError)
  const unique=browserLabel+Date.now(),name=`Integración ${unique}`,address=`integracion-${unique.toLowerCase()}@example.test`
  const studentPassword='Frase ficticia de integración 2026'
  const nav=()=>page.getByRole('navigation',{name:'Secciones de administración',exact:true})
  const adminLogin=async()=>{
    await page.goto(baseURL+'/admin')
    await page.getByRole('heading',{level:1}).waitFor()
    if(await page.locator('#login-email').isVisible()){
      await page.locator('#login-email').fill(email);await page.locator('#login-password').fill(password)
      await page.getByRole('button',{name:'Entrar al panel',exact:true}).click()
    }
    await page.getByRole('heading',{name:'Hola, Coordinación',exact:true}).waitFor()
    await nav().waitFor()
  }
  try{
    await page.bringToFront();await page.setViewportSize({width:1440,height:1000})
    await page.goto(baseURL+'/registro')
    const form=page.getByRole('form')
    check(await form.locator('input[type=password]').count()===0,'Registro oficial no pide contraseña antes de aprobar')
    await form.locator('[name=filledBy][value=alumno]').check()
    await form.locator('[name=firstName]').fill('Integración');await form.locator('[name=lastName]').fill(unique)
    await form.locator('[name=birthDate]').fill('2000-01-01')
    await form.locator('[name=program]').selectOption({label:'Business English'});await form.locator('[name=group]').selectOption({label:'Mar y jue · 19:30'})
    await form.locator('[name=email]').fill(address)
    await form.getByRole('button',{name:'Continuar',exact:true}).click();await form.getByRole('button',{name:'Continuar',exact:true}).click()
    await form.locator('[name=acceptRules]').check();await form.locator('[name=acceptPrivacy]').check()
    await form.getByRole('button',{name:'Enviar solicitud',exact:true}).click()
    await page.getByRole('heading',{name:'¡Solicitud enviada!',exact:true}).waitFor()
    check(true,'Solicitud desde /registro guardada por el servidor')
    await page.goto(baseURL+'/login')
    await page.locator('#login-email').fill(address);await page.locator('#login-password').fill(studentPassword)
    await page.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click()
    await page.getByRole('alert').waitFor()
    check(true,'El pendiente no puede entrar usando el login oficial')
    await adminLogin()
    check(await page.getByRole('heading',{name:'Actividad de la comunidad',exact:true}).isVisible(),'Se conserva el dashboard y sus gráficas de v1.0')
    check(!(await page.locator('main').innerText()).includes('NaN'),'Dashboard sin valores inválidos')
    await nav().getByRole('link',{name:/Solicitudes de ingreso/}).click()
    await page.getByRole('button',{name:`Revisar solicitud de ${name}`,exact:true}).click()
    await page.getByRole('dialog').getByRole('button',{name:'Aprobar solicitud',exact:true}).click()
    await page.getByRole('dialog').waitFor({state:'hidden'})
    await page.reload()
    await nav().getByRole('link',{name:'Alumnos',exact:true}).click()
    const row=page.getByRole('row').filter({hasText:name})
    await row.getByRole('button',{name:`Ficha de ${name}`,exact:true}).click()
    await page.getByRole('dialog').getByRole('button',{name:'Preparar acceso',exact:true}).click()
    const link=await page.getByRole('dialog').getByLabel('Enlace de activación',{exact:true}).inputValue()
    check(link.includes('/activar#token='),'Ficha original prepara un enlace privado de activación')
    await page.goto(link)
    await page.getByLabel('Nueva contraseña',{exact:true}).fill(studentPassword);await page.getByLabel('Confirma tu contraseña',{exact:true}).fill(studentPassword)
    await page.getByRole('button',{name:'Activar mi cuenta',exact:true}).click()
    await page.getByRole('heading',{name:'Tu acceso está listo',exact:true}).waitFor()
    await page.getByRole('link',{name:'Entrar a mi espacio',exact:true}).click()
    await page.locator('#login-email').fill(address);await page.locator('#login-password').fill(studentPassword)
    await page.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click()
    await page.getByRole('heading',{name:/^Hola, Integración /}).waitFor()
    await page.reload();await page.getByRole('heading',{name:/^Hola, Integración /}).waitFor()
    check(true,'Cuenta activada entra por /login y conserva sesión al recargar')
    await page.evaluate(async()=>{await fetch('/api/local/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})})
    await page.goto(baseURL+'/admin')
    await page.getByRole('form',{name:'Acceso de administración',exact:true}).waitFor()
    check(await nav().count()===0,'Una sesión de alumno no abre el dashboard administrativo')
    await adminLogin()
    await nav().getByRole('link',{name:'Alumnos',exact:true}).click()
    await row.getByRole('button',{name:`Ficha de ${name}`,exact:true}).click()
    await page.getByRole('dialog').getByRole('button',{name:'Suspender acceso',exact:true}).click()
    await page.getByRole('dialog').waitFor({state:'hidden'})
    await page.goto(baseURL+'/alumnos')
    await page.getByRole('form',{name:'Acceso de alumnos',exact:true}).waitFor()
    check(true,'Suspender desde ficha original cancela el acceso del alumno')
    for(const width of [1440,768,375,320]){
      await page.setViewportSize({width,height:1000})
      for(const path of ['/login','/registro','/admin','/admin/solicitudes','/admin/alumnos']){
        await page.goto(baseURL+path);await page.getByRole('heading').first().waitFor()
        check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${path} a ${width}px sin desbordamiento`)
        matrix.push({path,width})
      }
    }
    check(errors.length===0,'Sin errores de ejecución de JavaScript')
    return {browserLabel,checks:details.length,details,matrix,errors}
  }finally{page.off('pageerror',onError)}
}
export default checkV1Connected
