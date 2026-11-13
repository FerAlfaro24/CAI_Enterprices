/** Solo fixture de retos y contextos aislados. */
export async function checkConnectedChallengesVisual(page,{email,browserLabel,screenshotDir}={}){
 const context=await page.context().browser().newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const target=await context.newPage(),details=[],errors=[];target.on('pageerror',error=>errors.push(String(error)));target.setDefaultTimeout(10000);
 const check=(ok,label)=>{if(!ok)throw Error(label);details.push(label)};
 try{
 await target.goto('http://127.0.0.1:4180/login');await target.locator('#login-email').fill(email);await target.locator('#login-password').fill('Frase ficticia de retos navegador 2026');await target.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click();await target.getByRole('button',{name:'Actualizar comunidad',exact:true}).waitFor();await target.getByRole('navigation',{name:'Secciones de comunidad'}).getByRole('button',{name:'Retos',exact:true}).click();
 await target.getByRole('heading',{name:'Pequeños retos. Inglés que se queda.',exact:true}).waitFor();
 for(const theme of ['claro','oscuro']){
 await target.getByRole('button',{name:'Modo '+theme,exact:true}).click();
 for(const width of [1440,768,375,320]){
 await target.setViewportSize({width,height:1000});
 const nav=target.getByRole('navigation',{name:'Preguntas de hoy'}),quiz=target.getByRole('region',{name:'Reto del día compartido'});
 const top=await nav.boundingBox(),question=await quiz.boundingBox();
 check(top.y+top.height<=question.y+1,'Selector antes de responder: '+theme+' '+width+'px');
 check(await nav.evaluate(el=>el.scrollWidth<=el.clientWidth)&&await quiz.evaluate(el=>el.scrollWidth<=el.clientWidth),'Controles completos y sin recortes: '+theme+' '+width+'px');
 if(width===320){await nav.screenshot({path:screenshotDir+'/'+browserLabel+'-selector-'+theme+'.png'});await quiz.screenshot({path:screenshotDir+'/'+browserLabel+'-question-'+theme+'.png'});}
 }
 }
 const nav=target.getByRole('navigation',{name:'Preguntas de hoy'});await nav.getByRole('button',{name:/^Pregunta 2:/}).focus();await target.keyboard.press('Enter');const radios=target.getByRole('region',{name:'Reto del día compartido'}).getByRole('radio');await radios.first().focus();await target.keyboard.press('ArrowRight');check(await radios.nth(1).isChecked(),'Opciones accesibles con teclado');check(errors.length===0,'Sin errores JavaScript durante revisión visual');return {checks:details.length,details,errors};
 }finally{await context.close()}
}

