/** Prueba de interfaz con proveedor/servidor sustituidos. No acredita acceso real a Google. */
export async function checkPresentationLogin(browser,{baseURL,filesDir,label='brave'}) {
  const context=await browser.newContext({locale:'es-MX',viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage()
  context.setDefaultTimeout(12000)
  const results=[],errors=[],requests=[],check=(condition,message)=>{if(!condition)throw Error(message);results.push(message)}
  let verified=false,rejectLogin=true,signins=0
  page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
  await context.route('**/api/local/**',route=>{requests.push(route.request().url());return route.abort()})
  await context.route('**/api/presentation-google?*',async route=>{
    const action=new URL(route.request().url()).searchParams.get('action')
    let data={}
    if(action==='config')data={enabled:true,clientId:'fixture.apps.googleusercontent.com'}
    if(action==='challenge')data={clientId:'fixture.apps.googleusercontent.com',nonce:'a'.repeat(64)}
    if(action==='session')data={verified,expiresAt:Date.now()+60000}
    if(action==='logout')verified=false
    if(action==='signin'){
      signins++;const body=route.request().postDataJSON()
      check(body.credential==='fixture.signed.credential'&&body.nonce==='a'.repeat(64),'SDK entrega credencial y desafío al verificador')
      if(rejectLogin)return route.fulfill({status:200,json:{error:'La fixture rechaza esta cuenta.'}}).then(()=>{})
      verified=true;data={destination:'/community',verified:true}
    }
    return route.fulfill({json:data})
  })
  // Solo este ensayo sustituye el SDK; la aplicación desplegada carga el oficial.
  await context.route('https://accounts.google.com/gsi/client',route=>route.fulfill({contentType:'text/javascript',body:`window.google={accounts:{id:{initialize(options){window.fixtureGoogle=options},renderButton(parent){const button=document.createElement('button');button.textContent='Continuar con Google';button.onclick=()=>window.fixtureGoogle.callback({credential:'fixture.signed.credential'});parent.append(button)}}}}`}))
  try {
    await page.goto(baseURL+'/login');await page.getByRole('form',{name:'Acceso de alumnos'}).waitFor();await page.getByRole('button',{name:'Continuar con Google',exact:true}).waitFor()
    const tools=page.getByRole('complementary',{name:'Controles de la presentación'})
    for(const name of ['Página principal','Alumno','Coordinación'])check(await tools.getByRole('link',{name,exact:true}).isVisible(),'Atajo conservado: '+name)
    check(await tools.getByRole('button',{name:'Reiniciar',exact:true}).isVisible(),'Reinicio conservado')
    check(await page.getByLabel('Correo electrónico',{exact:true}).isVisible()&&await page.getByLabel('Contraseña',{exact:true}).isVisible(),'Formulario habitual conservado')
    check(await page.getByText(/Google verifica tu cuenta de verdad/).isVisible(),'Acceso real distingue identidad de contenido ficticio')
    await page.getByLabel('Correo electrónico',{exact:true}).fill('alumno@example.test');await page.getByLabel('Contraseña',{exact:true}).fill('Incorrecta123')
    await page.getByRole('button',{name:'Mostrar contraseña',exact:true}).click();check(await page.getByLabel('Contraseña',{exact:true}).getAttribute('type')==='text','Mostrar contraseña funciona')
    await page.getByRole('button',{name:'Ocultar contraseña',exact:true}).click();await page.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await page.getByRole('alert').filter({hasText:'cuenta de muestra'}).waitFor();check(new URL(page.url()).pathname==='/login','Credenciales incorrectas se rechazan')
    await page.getByText('Cuenta de muestra para presentar',{exact:true}).click();await page.getByRole('button',{name:'Rellenar cuenta de muestra'}).click();await page.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await page.getByRole('heading',{name:'Tu comunidad, al día.',exact:true}).waitFor();check(true,'Cuenta ficticia de alumno entra a comunidad')
    await page.goto(baseURL+'/login');await page.getByRole('link',{name:'Acceso de administración',exact:true}).click();await page.getByRole('form',{name:'Acceso de administración'}).waitFor()
    check(await page.getByRole('button',{name:'Continuar con Google',exact:true}).count()===0,'Google no concede acceso administrativo')
    await page.getByText('Cuenta de muestra para presentar',{exact:true}).click();await page.getByRole('button',{name:'Rellenar cuenta de muestra'}).click();await page.getByRole('button',{name:'Entrar al panel',exact:true}).click();await page.getByRole('heading',{name:/Hola, Coordinación/}).waitFor();check(true,'Cuenta administrativa ficticia conservada')
    await page.goto(baseURL+'/login');await page.getByRole('button',{name:'Continuar con Google',exact:true}).waitFor()
    for(const width of [1440,768,375,320]){await page.setViewportSize({width,height:1000});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Login sin desbordamiento '+width);if(width===1440||width===375)await page.screenshot({path:filesDir+'/real-google-'+label+'-'+width+'.png',fullPage:false})}
    // Error 200 sin destino también debe fallar de forma cerrada.
    await page.getByRole('button',{name:'Continuar con Google',exact:true}).click();await page.getByRole('alert').filter({hasText:'fixture rechaza'}).waitFor();check(new URL(page.url()).pathname==='/login','Error de verificación no da acceso')
    rejectLogin=false;await page.getByRole('button',{name:'Volver a cargar Google'}).click();await page.getByRole('button',{name:'Continuar con Google',exact:true}).click();await page.getByRole('heading',{name:'Tu comunidad, al día.',exact:true}).waitFor();await tools.getByText('✓ Cuenta de Google verificada').waitFor();check(signins===2,'Reintento y estado verificado desde servidor')
    await page.reload();await tools.getByText('✓ Cuenta de Google verificada').waitFor();check(true,'Estado se consulta nuevamente al recargar')
    check(await page.evaluate(()=>{const data=localStorage.getItem('cai-presentation-v1')??'';return !/fixture.signed.credential|CaiDemo2026|Incorrecta123/.test(data)}),'Tokens y contraseñas fuera de localStorage')
    await tools.getByRole('button',{name:'Salir de Google'}).click();await tools.getByText('✓ Cuenta de Google verificada').waitFor({state:'hidden'});check(!verified,'Cerrar Google elimina el estado verificado')
    check(requests.length===0,'Sin solicitudes al backend escolar');check(errors.length===0,'Sin errores de JavaScript ni consola: '+errors.join('; '))
    return {checks:results.length,results,errors,requests,provider:'fixture, no Google real'}
  } catch(error){throw Error(error.message+' · Completadas: '+results.join('; '),{cause:error})}
  finally {await context.close()}
}
