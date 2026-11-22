/** Visual closeout on isolated fixtures; no habitual data or accounts. */
export async function checkInterfacePolish(browser,{baseURL,filesDir,browserLabel}) {
 const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'es-MX',reducedMotion:'reduce'}),admin=await browser.newContext({viewport:{width:1440,height:1000},locale:'es-MX',reducedMotion:'reduce'})
 const page=await context.newPage(),panel=await admin.newPage(),results=[],errors=[]
 for(const p of [page,panel]){p.on('pageerror',error=>errors.push(error.message));p.on('console',message=>{if(message.type()==='error')errors.push(message.text())})}
 const password='Frase ficticia para fotos oficiales 2026'
 const check=(value,label)=>{if(!value)throw Error(label);results.push(label)}
 const call=async(ctx,path,method='GET',data)=>{const response=await ctx.request.fetch(baseURL+'/api/local'+path,{method,data,headers:{Origin:baseURL}});if(!response.ok())throw Error(path+': '+response.status());return response.json()}
 const nav=()=>page.getByRole('navigation',{name:'Secciones de comunidad'})
 const go=async(section)=>{await nav().getByRole('button',{name:section,exact:true}).click();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}))}
 const shot=async(p,name)=>{await p.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));await p.screenshot({path:filesDir+'/'+browserLabel+'-'+name+'.png'})}
 const fit=async(p)=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)
 const visibleHeading=async(p)=>p.getByRole('heading',{level:1}).waitFor()
 try {
  await call(context,'/student/login','POST',{email:'bob@example.test',password});await page.goto(baseURL+'/community');await page.getByRole('heading',{name:'Tu comunidad, al día.',exact:true}).waitFor()
  for(const theme of ['Modo claro','Modo oscuro']){
   await page.getByRole('button',{name:theme,exact:true}).click()
   for(const width of [1440,768,375,320]){
    await page.setViewportSize({width,height:950})
    for(const section of ['Inicio','Galería','Retos','Logros']){
     await go(section)
     check(await fit(page),'Sin desbordamiento: '+section+' '+theme+' '+width)
     check(await nav().getByRole('button').evaluateAll(nodes=>nodes.every(node=>{const box=node.getBoundingClientRect();return box.height>=44&&parseFloat(getComputedStyle(node).fontSize)>=14})),'Navegación legible y táctil: '+section+' '+theme+' '+width)
     check(await page.evaluate(()=>{const brand=document.querySelector('[aria-label="CAI Community, inicio"]'),theme=document.querySelector('[aria-label="Tema de la comunidad"]');return brand.getBoundingClientRect().right<=theme.getBoundingClientRect().left+1}),'Marca y controles separados: '+section+' '+theme+' '+width)
    }
    if(width===375){await go('Galería');await shot(page,theme==='Modo claro'?'gallery-mobile-light':'gallery-mobile-dark');await go('Retos');await shot(page,theme==='Modo claro'?'challenges-mobile-light':'challenges-mobile-dark')}
   }
  }
  await page.setViewportSize({width:375,height:950});await go('Galería')
  check(await page.getByRole('button',{name:/^Ver foto /}).count()===6,'Las seis fotos siguen visibles por defecto')
  const firstPhoto=page.getByRole('button',{name:/^Ver foto 1:/});check((await firstPhoto.boundingBox()).y<900,'En móvil la primera foto aparece sin una pantalla entera de introducciones')
  const help=page.locator('details').filter({has:page.getByText('¿Quién puede ver estas fotos?',{exact:true})});await help.locator('summary').click();check(await help.getByText(/Coordinación revisa y publica/).isVisible(),'Detalle de privacidad accesible sin ocupar la portada');await help.locator('summary').click()
  await firstPhoto.click();await page.getByRole('dialog').waitFor();check(await page.getByRole('button',{name:'Cerrar álbum',exact:true}).isVisible(),'Fotos abren su visor existente');await page.keyboard.press('Escape')
  await page.getByRole('button',{name:'Álbumes',exact:true}).click();check(await page.getByLabel('Álbumes de la comunidad',{exact:true}).isVisible(),'Vista de álbumes conservada');await page.getByRole('button',{name:'Fotos',exact:true}).click();await page.getByRole('group',{name:'Filtrar galería'}).getByRole('button',{name:'Logros',exact:true}).click();check(await page.getByRole('heading',{name:'Aquí todavía hay momentos por guardar.',exact:true}).isVisible(),'Filtro vacío explica el estado sin perder fotografías');await page.getByRole('button',{name:/Quitar filtro/}).click();check(await page.getByRole('button',{name:/^Ver foto /}).count()===6,'Quitar filtro recupera las seis fotos')
  await go('Retos');const goals=page.getByRole('region',{name:'Mis insignias de Retos'}); // section has an accessible name.
  check(await goals.locator('li').count()===3,'Retos muestra tres metas, sin volcar el catálogo completo')
  check(await goals.locator('progress').count()===3,'Las metas muestran su avance real')
  await goals.getByRole('button',{name:'Ver todas mis insignias',exact:true}).click();check(await page.getByRole('tab',{name:'Insignias',exact:true}).getAttribute('aria-selected')==='true','Desde Retos se abre la pestaña correcta de insignias')
  await go('Inicio');await page.getByRole('button',{name:/^Abrir mi perfil:/}).click();let dialog=page.getByRole('dialog')
  check(await dialog.getByRole('button',{name:'Mi actividad',exact:true}).getAttribute('aria-pressed')==='true','Perfil abre con su actividad')
  check(await dialog.getByRole('button',{name:'Actualizar comunidad',exact:true}).count()===0,'Acciones de cuenta separadas de la actividad')
  await dialog.getByRole('button',{name:'Mi cuenta',exact:true}).click();check(await dialog.getByRole('region',{name:'Opciones de mi cuenta'}).isVisible(),'Mi cuenta reúne inscripción, avisos, actualización y salida')
  await dialog.getByRole('button',{name:'Editar mi perfil',exact:true}).click();check(await dialog.getByRole('form',{name:'Editar mi perfil visible',exact:true}).isVisible(),'Edición existente accesible desde Mi cuenta');await dialog.getByRole('button',{name:'Cancelar',exact:true}).click()
  await dialog.getByRole('button',{name:'Mi actividad',exact:true}).click();await shot(page,'profile-mobile');await page.keyboard.press('Escape');check(await page.getByRole('button',{name:/^Abrir mi perfil:/}).evaluate(node=>node===document.activeElement),'Cerrar perfil devuelve el foco al avatar')
  await page.getByRole('button',{name:/^Mis notificaciones/}).click();dialog=page.getByRole('dialog');check(await dialog.getByRole('group',{name:'Filtrar mis notificaciones'}).isVisible(),'Bandeja independiente conserva filtros')
  await dialog.evaluate(node=>node.scrollTop=node.scrollHeight);check(await dialog.getByRole('button',{name:'Cerrar notificaciones',exact:true}).evaluate(node=>{const r=node.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}),'Cerrar notificaciones permanece visible al desplazarse')
  await dialog.getByRole('button',{name:/Sin leer/}).click();check(await dialog.getByRole('button',{name:/Sin leer/}).getAttribute('aria-pressed')==='true','Filtro de no leídas operativo');await shot(page,'notifications-mobile');await page.keyboard.press('Escape')
  // The editor retains keyboard navigation and its actions at narrow widths.
  await go('Logros');await page.getByRole('button',{name:/Lectura.*Registrar logro/}).click();dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Continuar',exact:true}).click();await dialog.getByLabel('¿Qué libro, película, episodio o canción elegiste?').fill('Vista previa de diseño, sin guardar');await dialog.getByRole('button',{name:'Continuar',exact:true}).click();check(await dialog.getByLabel('¿Qué leíste y qué entendiste?').isVisible(),'Registro guiado conserva las preguntas existentes');await dialog.getByRole('button',{name:'Continuar',exact:true}).click();await dialog.getByRole('button',{name:'Guardar mi logro',exact:true}).scrollIntoViewIfNeeded();check(await dialog.getByRole('button',{name:'Guardar mi logro',exact:true}).isVisible(),'Acción final del editor visible en móvil');await page.keyboard.press('Escape')
  // Institutional page: actual controls, photos and content markers are preserved.
  await page.goto(baseURL+'/');await visibleHeading(page)
  for(const theme of ['light','dark'])for(const width of [1440,768,375,320]){
   await page.setViewportSize({width,height:950});await page.evaluate(value=>document.documentElement.dataset.theme=value,theme)
   check(await fit(page),'Página pública sin desbordamiento '+theme+' '+width)
   check(await page.getByRole('form',{name:'Formulario de contacto CAI'}).locator('input:not([type=checkbox]),select').evaluateAll(nodes=>nodes.every(node=>parseFloat(getComputedStyle(node).fontSize)>=16)),'Formulario público legible sin zoom automático '+theme+' '+width)
  }
  await page.setViewportSize({width:375,height:950});await page.evaluate(()=>document.documentElement.dataset.theme='dark');
  check(await page.locator('button[aria-controls="landing-navigation"] span').first().evaluate(node=>{const rgb=getComputedStyle(node).backgroundColor.match(/\d+/g).map(Number);return rgb[0]+rgb[1]+rgb[2]>600}),'Menú institucional oscuro tiene trazos claros visibles');
  check(await page.locator('a[aria-label="CAI · Centro de Asesorías Integrales, inicio"] img').evaluate(node=>getComputedStyle(node).backgroundColor==='rgb(255, 255, 255)'),'Logo oficial conserva contraste sobre la cabecera oscura');
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.getByRole('button',{name:'Abrir menú',exact:true}).click();check(await page.getByRole('navigation',{name:'Secciones institucionales'}).isVisible(),'Menú institucional móvil accesible');await page.keyboard.press('Escape');check(await page.getByRole('button',{name:'Abrir menú',exact:true}).getAttribute('aria-expanded')==='false','Escape cierra menú institucional')
  const faq=page.locator('#faq details').nth(1);await faq.locator('summary').click();check(await faq.evaluate(node=>node.open),'Preguntas frecuentes mantienen su interacción')
  const hero=page.locator('#hero-title');await hero.scrollIntoViewIfNeeded();await shot(page,'public-mobile')
  for(const path of ['/login','/registro']){await page.goto(baseURL+path);await visibleHeading(page);for(const width of [1440,768,375,320]){await page.setViewportSize({width,height:950});check(await fit(page),'Acceso/registro sin desbordamiento '+path+' '+width)}}
  // Admin closeout: menu closure, keyboard confinement and responsive pages.
  await call(admin,'/auth/login','POST',{email:'admin@example.test',password});await panel.goto(baseURL+'/admin');await visibleHeading(panel)
  for(const theme of ['light','dark'])for(const width of [1440,768,375,320]){
   await panel.setViewportSize({width,height:950});await panel.evaluate(value=>document.documentElement.dataset.theme=value,theme)
   for(const [path,label] of [['/admin','Resumen'],['/admin/solicitudes','Solicitudes de ingreso'],['/admin/alumnos','Alumnos'],['/admin/publicaciones','Publicaciones'],['/admin/galeria','Galería privada'],['/admin/retos','Retos de inglés'],['/admin/insignias','Logros e insignias'],['/admin/mensajes','Mensajes y avisos'],['/admin/configuracion','Configuración']]){if(await panel.getByRole('button',{name:'Abrir menú',exact:true}).isVisible())await panel.getByRole('button',{name:'Abrir menú',exact:true}).click();await panel.getByRole('navigation',{name:'Secciones de administración'}).getByRole('link',{name:label,exact:true}).click();await panel.waitForURL(baseURL+path);await visibleHeading(panel);await panel.evaluate(value=>document.documentElement.dataset.theme=value,theme);check(await fit(panel),'Panel sin desbordamiento '+path+' '+theme+' '+width)}
  }
  await panel.setViewportSize({width:375,height:950});await panel.goto(baseURL+'/admin');await visibleHeading(panel);await panel.getByRole('button',{name:'Abrir menú',exact:true}).click();const menu=panel.getByRole('dialog',{name:'Menú del panel',exact:true});await menu.waitFor();check(await menu.getByRole('button',{name:'Cerrar menú del panel'}).evaluate(node=>node===document.activeElement),'Menú de administración enfoca su cierre')
  check(await panel.locator('main').evaluate(node=>Boolean(node.closest('[inert]'))),'Panel de fondo inactivo mientras el menú está abierto')
  const controls=menu.locator('a,button');await controls.last().focus();await panel.keyboard.press('Tab');check(await controls.first().evaluate(node=>node===document.activeElement),'Tab permanece dentro del menú');await panel.keyboard.press('Shift+Tab');check(await controls.last().evaluate(node=>node===document.activeElement),'Shift+Tab permanece dentro del menú')
  await panel.keyboard.press('Escape');check(await panel.getByRole('button',{name:'Abrir menú'}).evaluate(node=>node===document.activeElement),'Escape restaura foco del menú administrativo');check(await panel.locator('main').evaluate(node=>!node.closest('[inert]')),'Cerrar menú devuelve interacción al panel')
  await panel.getByRole('button',{name:'Abrir menú'}).click();await panel.getByRole('dialog',{name:'Menú del panel'}).getByRole('link',{name:'Alumnos',exact:true}).click();await panel.waitForURL('**/admin/alumnos');check(await panel.getByRole('button',{name:'Abrir menú'}).getAttribute('aria-expanded')==='false','Elegir una sección cierra el menú')
  await panel.getByRole('button',{name:'Abrir menú'}).click();await panel.setViewportSize({width:1440,height:1000});await panel.waitForFunction(()=>!document.querySelector('main').closest('[inert]'));check(true,'Pasar a escritorio libera el fondo del panel')
  await panel.setViewportSize({width:375,height:950});await shot(panel,'admin-mobile')
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(baseURL+'/community');await page.getByRole('heading',{name:'Tu comunidad, al día.',exact:true}).waitFor();await go('Galería');check(await page.getByRole('heading',{name:'Así se vive CAI',exact:true}).isVisible(),'Navegación funciona con movimiento normal')
  check(errors.length===0,'Sin errores JavaScript ni consola inesperados'+(errors.length?': '+errors.join('; '):''))
  return {browser:browserLabel,checks:results.length,results,errors}
 } catch(error){await Promise.allSettled([shot(page,'failed-community'),shot(panel,'failed-admin')]);throw Error('Después de '+results.at(-1)+'; URL panel '+panel.url()+'; consola '+errors.join('; ')+'; '+error.message)} finally {await context.close();await admin.close()}
}
