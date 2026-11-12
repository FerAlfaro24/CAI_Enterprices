/** Ejecutar SOLO con server/tests/google-browser-server.ts. No comprueba el proveedor real. */
async function checkGoogleOnboarding(page, { baseURL = 'http://127.0.0.1:4180', browserLabel = 'Prueba' } = {}) {
  const checks = [], matrix = [], errors = []
  const check = (value, message) => { if (!value) throw new Error(message); checks.push(message) }
  const onError = (error) => errors.push(String(error))
  page.on('pageerror', onError)
  const unique = `${browserLabel}${Date.now()}`
  const studentEmail = `google-${unique.toLowerCase()}@example.test`
  const name = `Google ${unique}`
  const sdkURL = 'https://accounts.google.com/gsi/client'
  const mockSdk = async (route) => route.fulfill({ contentType: 'application/javascript', body: `
    (() => {
      let options;
      window.google = { accounts: { id: {
        initialize(value) { options = value; },
        renderButton(parent, appearance) {
          const button = document.createElement('button');
          button.type = 'button'; button.textContent = 'Continuar con Google (prueba)';
          button.style.width = appearance.width + 'px';
          button.onclick = () => options.callback({ credential: 'fixture:' + JSON.stringify({
            subject: ${JSON.stringify(unique)}, email: ${JSON.stringify(studentEmail)}, nonce: options.nonce
          }) });
          parent.append(button);
        }
      } } };
    })();` })
  await page.context().route(sdkURL, mockSdk)
  const nav = () => page.getByRole('navigation', { name: 'Administración local', exact: true })
  const signInAdmin = async () => {
    await page.goto(`${baseURL}/gestion`)
    await page.getByRole('heading', { level: 1 }).waitFor()
    if (await page.locator('#local-email').isVisible()) {
      await page.getByLabel('Correo electrónico', { exact: true }).fill('google-admin@example.test')
      await page.getByLabel('Contraseña', { exact: true }).fill('Frase ficticia de pruebas Google 2026')
      await page.getByRole('button', { name: 'Entrar al panel', exact: true }).click()
    }
    await page.getByRole('heading', { name: 'Tu trabajo pendiente', exact: true }).waitFor()
  }
  try {
    await page.bringToFront()
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(`${baseURL}/alumnos`)
    await page.evaluate(async () => { await fetch('/api/local/student/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }) })
    await page.reload()
    await page.goto(`${baseURL}/registro-local`)
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      const button = page.getByRole('button', { name: 'Continuar con Google (prueba)', exact: true })
      await button.waitFor()
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth)
      check(await button.isVisible(), `Botón Google visible sin desbordamiento a ${width}px`)
      matrix.push({ page: 'botón', width })
    }
    await page.goto(`${baseURL}/alumnos`)
    await page.getByRole('button', { name: 'Continuar con Google (prueba)', exact: true }).click()
    await page.getByRole('heading', { name: 'Datos del alumno', exact: true }).waitFor()
    const form = page.getByRole('form')
    check(await form.locator('[name="email"]').inputValue() === studentEmail, 'El formulario usa el correo confirmado por el proveedor')
    check(await form.locator('[name="email"]').getAttribute('readonly') !== null, 'El correo confirmado no se puede editar')
    check(await form.locator('input[type="password"]').count() === 0, 'Google no pide crear otra contraseña')
    await form.getByRole('button', { name: 'Continuar', exact: true }).click()
    check(await page.getByRole('alert').count() > 0, 'Google no permite omitir los datos obligatorios')
    await form.locator('[name="filledBy"][value="alumno"]').check()
    await form.locator('[name="firstName"]').fill('Google')
    await form.locator('[name="lastName"]').fill(unique)
    await form.locator('[name="birthDate"]').fill('2000-01-01')
    await form.locator('[name="program"]').selectOption({ label: 'Business English' })
    await form.locator('[name="group"]').selectOption({ label: 'Mar y jue · 19:30' })
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
      check(!overflow, `Formulario Google sin desbordamiento a ${width}px`)
      matrix.push({ page: 'formulario', width })
    }
    await form.getByRole('button', { name: 'Continuar', exact: true }).click()
    await form.getByRole('button', { name: 'Continuar', exact: true }).click()
    await form.locator('[name="acceptRules"]').check()
    await form.locator('[name="acceptPrivacy"]').check()
    await form.getByRole('button', { name: 'Enviar solicitud', exact: true }).click()
    await page.getByRole('heading', { name: 'Tu solicitud está en revisión', exact: true }).waitFor()
    await page.reload()
    await page.getByRole('heading', { name: 'Tu solicitud está en revisión', exact: true }).waitFor()
    check(await page.evaluate(async () => (await fetch('/api/local/student/me')).status) === 401, 'Una solicitud pendiente no da acceso al área del alumno')
    await page.setViewportSize({ width: 1440, height: 1000 })
    await signInAdmin()
    await nav().getByRole('link', { name: 'Solicitudes', exact: true }).click()
    await page.getByRole('button', { name: `Revisar solicitud de ${name}`, exact: true }).click()
    check(await page.getByRole('dialog').getByText('Google · Cuenta confirmada', { exact: true }).isVisible(), 'El administrador identifica la cuenta de Google dentro de la solicitud')
    await page.getByRole('dialog').getByRole('button', { name: 'Aprobar solicitud', exact: true }).click()
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    await nav().getByRole('link', { name: 'Alumnos', exact: true }).click()
    const row = page.getByRole('listitem').filter({ hasText: name })
    check(await row.getByRole('button', { name: `Preparar acceso de ${name}`, exact: true }).count() === 0, 'El administrador no necesita preparar una contraseña para Google')
    await page.goto(`${baseURL}/solicitud-google`)
    await page.getByRole('heading', { name: '¡CAI aprobó tu solicitud!', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Entrar a mi espacio', exact: true }).click()
    await page.getByRole('heading', { name: /^Hola, Google / }).waitFor()
    check(await page.evaluate(async () => (await fetch('/api/local/student/me')).status) === 200, 'Tras aprobar, el alumno entra sin activación por contraseña')
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
    await page.getByRole('heading', { name: 'Entra a tu espacio', exact: true }).waitFor()
    check(await page.evaluate(async () => (await (await fetch('/api/local/google/session')).json()).status) === 'anonymous', 'Salir borra también la comprobación temporal de Google')
    await page.getByRole('button', { name: 'Continuar con Google (prueba)', exact: true }).click()
    await page.getByRole('heading', { name: /^Hola, Google / }).waitFor()
    check(true, 'La cuenta aprobada vuelve a entrar directamente con Google')
    await signInAdmin()
    await nav().getByRole('link', { name: 'Alumnos', exact: true }).click()
    await row.getByRole('button', { name: `Suspender a ${name}`, exact: true }).click()
    await page.goto(`${baseURL}/solicitud-google`)
    await page.getByRole('heading', { name: 'Consulta con coordinación', exact: true }).waitFor()
    check(await page.evaluate(async () => (await fetch('/api/local/student/me')).status) === 401, 'La suspensión revoca también las sesiones iniciadas con Google')
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Estado Google sin desbordamiento a ${width}px`)
      matrix.push({ page: 'estado', width })
    }
    check(errors.length === 0, 'Sin errores de JavaScript en el recorrido')
    return { browserLabel, provider: 'ficticio, sin acceso a Google real', checks: checks.length, details: checks, matrix, errors }
  } finally {
    page.off('pageerror', onError)
    await page.context().unroute(sdkURL, mockSdk)
  }
}

export default checkGoogleOnboarding
