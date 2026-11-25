/** Solo pantallas de presentación identificadas; no introduce credenciales reales. */
export async function checkPresentationLogin(browser,{baseURL,filesDir,label='brave'}) {
  const context=await browser.newContext({locale:'es-MX',viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage()
  context.setDefaultTimeout(12000)
  const results=[],errors=[],requests=[],check=(condition,message)=>{if(!condition)throw Error(message);results.push(message)}
  page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
  await context.route('**/api/local/**',route=>{requests.push(route.request().url());return route.abort()})
  await context.route('https://accounts.google.com/**',route=>{requests.push(route.request().url());return route.abort()})
  try {
    await page.goto(baseURL+'/login');await page.getByRole('form',{name:'Acceso de alumnos'}).waitFor()
    const tools=page.getByRole('complementary',{name:'Controles de la presentación'})
    check(await tools.getByRole('link',{name:'Alumno',exact:true}).getAttribute('href')==='/community','Atajo de alumno conservado')
    check(await tools.getByRole('link',{name:'Coordinación',exact:true}).getAttribute('href')==='/admin','Atajo de coordinación conservado')
    check(await tools.getByRole('link',{name:'Página principal',exact:true}).getAttribute('href')==='/','Atajo a portada conservado')
    check(await tools.getByRole('button',{name:'Reiniciar',exact:true}).isVisible(),'Reinicio conservado')
    check(await page.getByLabel('Correo electrónico',{exact:true}).isVisible()&&await page.getByLabel('Contraseña',{exact:true}).isVisible(),'Formulario original de correo y contraseña recuperado')
    await page.getByLabel('Correo electrónico',{exact:true}).fill('alumno@example.test');await page.getByLabel('Contraseña',{exact:true}).fill('Incorrecta123')
    await page.getByRole('button',{name:'Mostrar contraseña',exact:true}).click();check(await page.getByLabel('Contraseña',{exact:true}).getAttribute('type')==='text','Mostrar contraseña funciona')
    await page.getByRole('button',{name:'Ocultar contraseña',exact:true}).click();await page.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await page.getByRole('alert').filter({hasText:'cuenta de muestra'}).waitFor();check(new URL(page.url()).pathname==='/login','Credenciales incorrectas no aparentan un acceso válido')
    await page.getByText('Cuenta de muestra para presentar',{exact:true}).click();await page.getByRole('button',{name:'Rellenar cuenta de muestra'}).click();await page.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await page.getByRole('heading',{name:'Tu comunidad, al día.',exact:true}).waitFor();check(true,'Cuenta ficticia de alumno entra a comunidad')
    check(await page.evaluate(()=>!localStorage.getItem('cai-presentation-v1').includes('CaiDemo2026')&&!localStorage.getItem('cai-presentation-v1').includes('Incorrecta123')),'Las claves introducidas no se guardan en localStorage')
    await page.goto(baseURL+'/login');await page.getByRole('link',{name:'Acceso de administración',exact:true}).click();await page.getByRole('form',{name:'Acceso de administración'}).waitFor();check(new URL(page.url()).searchParams.get('cuenta')==='admin','Acceso administrativo permite presentar su formulario')
    check(await page.getByRole('button',{name:'Continuar con Google',exact:true}).count()===0,'Google no se añade al acceso administrativo real')
    await page.getByText('Cuenta de muestra para presentar',{exact:true}).click();await page.getByRole('button',{name:'Rellenar cuenta de muestra'}).click();check(await page.getByLabel('Correo electrónico',{exact:true}).inputValue()==='admin@example.test','Cuenta administrativa ficticia diferenciada')
    await page.getByRole('button',{name:'Entrar al panel',exact:true}).click();await page.getByRole('heading',{name:/Hola, Coordinación/}).waitFor();check(new URL(page.url()).pathname==='/admin','Cuenta administrativa entra al panel')
    await page.goto(baseURL+'/login');await page.getByRole('button',{name:'Continuar con Google',exact:true}).click();const dialog=page.getByRole('dialog')
    await dialog.getByRole('heading',{name:'Así se continúa con Google',exact:true}).waitFor();check(await dialog.getByText(/Esta pantalla no pertenece a Google/).isVisible(),'Simulación de Google identificada explícitamente')
    check(await dialog.locator('input[type=password]').count()===0,'La vista de Google no solicita contraseñas ni cuentas reales')
    await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});check(await page.getByRole('button',{name:'Continuar con Google',exact:true}).evaluate(button=>button===document.activeElement),'Escape cierra la muestra y devuelve el foco')
    for(const width of [1440,768,375,320]){await page.setViewportSize({width,height:1000});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Login sin desbordamiento '+width);if(width===1440||width===375)await page.screenshot({path:filesDir+'/login-google-'+label+'-'+width+'.png',fullPage:false})}
    await page.getByRole('button',{name:'Continuar con Google',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:/Alumno de muestra/}).click();await page.getByRole('heading',{name:'Tu comunidad, al día.',exact:true}).waitFor();check(true,'Recorrido Google simulado termina en comunidad')
    check(requests.length===0,'Sin API local, SDK de Google, OAuth o permisos reales');check(errors.length===0,'Sin errores de JavaScript ni consola: '+errors.join('; '))
    return {checks:results.length,results,errors,requests}
  } catch(error){throw Error(error.message+' · Completadas: '+results.join('; '),{cause:error})}
  finally {await context.close()}
}
