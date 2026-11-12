async function checkRecovery(page, { email, password, browserLabel = 'Prueba' }) {
  const base = 'http://127.0.0.1:5173', details = [], errors = []
  const check = (value, text) => { if (!value) throw new Error(text); details.push(text) }
  const onError = (error) => errors.push(String(error)); page.on('pageerror',onError)
  const address = `recuperar-${browserLabel.toLowerCase()}-${Date.now()}@example.test`
  const original = 'Clave ficticia original de pruebas 2026', renewed = 'Clave ficticia renovada de pruebas 2026'
  try {
    await page.bringToFront(); await page.setViewportSize({width:1440,height:1000})
    await page.goto(`${base}/gestion`)
    await page.getByRole('heading',{level:1}).waitFor()
    if (await page.locator('#local-email').isVisible()) {
      await page.locator('#local-email').fill(email); await page.locator('#local-password').fill(password)
      await page.getByRole('button',{name:'Entrar al panel',exact:true}).click()
    }
    await page.getByRole('heading',{name:'Tu trabajo pendiente',exact:true}).waitFor()
    await page.evaluate(async ({address,original}) => {
      const call = async (path,data,headers={}) => {
        const r = await fetch('/api/local'+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)})
        const result=await r.json(); if(!r.ok) throw new Error(result.error); return result
      }
      const r=await call('/requests',{firstName:'Alumno',lastName:'Recuperación',birthDate:'2000-01-01',filledBy:'alumno',email:address,program:'Business English',group:'Mar y jue · 19:30',displayName:'Alumno R.',avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true},{'Idempotency-Key':crypto.randomUUID()})
      await call(`/requests/${r.id}/approve`,{revision:1})
      const invitation=await call(`/students/${r.id}/invitation`,{revision:1})
      await call('/activation',{token:new URLSearchParams(invitation.path.split('#')[1]).get('token'),password:original,confirm:original})
    },{address,original})
    await page.goto(`${base}/recuperar-acceso`)
    await page.getByLabel('Correo de tu cuenta',{exact:true}).fill(address)
    await page.getByRole('button',{name:'Solicitar recuperación',exact:true}).click()
    await page.getByRole('status').waitFor()
    check((await page.getByRole('status').innerText()).includes('no se envían correos'),'El alumno recibe un aviso claro sin prometer correo enviado')
    await page.goto(`${base}/gestion/avisos`)
    const item=page.getByRole('listitem').filter({hasText:address}).filter({hasText:'Recuperación de acceso solicitada'})
    await item.getByRole('button',{name:/Preparar enlace de prueba/}).click()
    const dialog=page.getByRole('dialog')
    const link=await dialog.getByLabel('Enlace de recuperación',{exact:true}).inputValue()
    for(const width of [1440,768,375,320]) {
      await page.setViewportSize({width,height:1000})
      check(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth),`Diálogo de recuperación a ${width}px sin desbordamiento`)
    }
    await dialog.getByRole('link',{name:'Probar recuperación',exact:true}).click()
    await page.getByRole('heading',{name:'Elige tu nueva contraseña',exact:true}).waitFor()
    check(await page.evaluate(()=>location.hash===''),'El enlace privado se retira de la barra')
    await page.getByLabel('Nueva contraseña',{exact:true}).fill(renewed)
    await page.getByLabel('Confirma tu contraseña',{exact:true}).fill(renewed)
    await page.getByRole('button',{name:'Guardar nueva contraseña',exact:true}).click()
    await page.getByRole('heading',{name:'Contraseña actualizada',exact:true}).waitFor()
    check(true,'El alumno cambia la contraseña sin iniciar sesión automáticamente')
    await page.getByRole('link',{name:'Entrar a mi espacio',exact:true}).click()
    await page.getByLabel('Correo electrónico',{exact:true}).fill(address)
    await page.getByLabel('Contraseña',{exact:true}).fill(renewed)
    await page.getByRole('button',{name:'Entrar a mi espacio',exact:true}).click()
    await page.getByRole('heading',{name:'Hola, Alumno R.',exact:true}).waitFor()
    check(true,'La contraseña nueva permite entrar')
    await page.goto(link)
    await page.getByLabel('Nueva contraseña',{exact:true}).fill(original)
    await page.getByLabel('Confirma tu contraseña',{exact:true}).fill(original)
    await page.getByRole('button',{name:'Guardar nueva contraseña',exact:true}).click()
    await page.getByRole('alert').filter({hasText:/enlace no es válido/}).waitFor()
    check(true,'El enlace usado no puede reutilizarse')
    for(const width of [1440,768,375,320]) {
      await page.setViewportSize({width,height:1000})
      check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Formulario de recuperación a ${width}px sin desbordamiento`)
    }
    check(errors.length===0,'Sin errores de ejecución de JavaScript')
    return {browserLabel,checks:details.length,details,errors}
  } finally {page.off('pageerror',onError)}
}
export default checkRecovery
