/** Credenciales del administrador solo por argumento. Todos los alumnos creados son ficticios. */
async function checkStudentAccounts(page, { baseURL = 'http://127.0.0.1:5173', email, password, browserLabel = 'Prueba' } = {}) {
  const details = [], matrix = [], errors = []
  const check = (value, message) => { if (!value) throw new Error(message); details.push(message) }
  const onError = (error) => errors.push(String(error))
  page.on('pageerror', onError)
  const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`
  const lastName = `${browserLabel}${unique}`
  const name = `Cuenta ${lastName}`
  const studentEmail = `cuenta-${browserLabel.toLowerCase()}-${unique}@example.test`
  const studentPassword = 'Una frase ficticia de pruebas 2026'
  const nav = () => page.getByRole('navigation', { name: 'Administración local', exact: true })
  const studentRow = () => page.getByRole('listitem').filter({ hasText: name })
  const signInAdmin = async () => {
    await page.goto(`${baseURL}/gestion`)
    await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' })
    if (await page.locator('#local-email').isVisible()) {
      await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
      await page.getByLabel('Contraseña', { exact: true }).fill(password)
      await page.getByRole('button', { name: 'Entrar al panel', exact: true }).click()
    }
    await page.getByRole('heading', { name: 'Tu trabajo pendiente', exact: true }).waitFor({ state: 'visible' })
  }
  const signInStudent = async () => {
    await page.goto(`${baseURL}/alumnos`)
    await page.getByRole('heading', { name: 'Entra a tu espacio', exact: true }).waitFor({ state: 'visible' })
    await page.getByLabel('Correo electrónico', { exact: true }).fill(studentEmail)
    await page.getByLabel('Contraseña', { exact: true }).fill(studentPassword)
    await page.getByRole('button', { name: 'Entrar a mi espacio', exact: true }).click()
    await page.getByRole('heading', { name: /^Hola, Cuenta / }).waitFor({ state: 'visible' })
  }
  const activate = async (link, success) => {
    await page.goto(link)
    await page.getByRole('heading', { name: 'Activa tu acceso', exact: true }).waitFor({ state: 'visible' })
    await page.waitForFunction(() => location.hash === '')
    await page.getByLabel('Nueva contraseña', { exact: true }).fill(studentPassword)
    await page.getByLabel('Confirma tu contraseña', { exact: true }).fill(studentPassword)
    await page.getByRole('button', { name: 'Activar mi cuenta', exact: true }).click()
    if (success) await page.getByRole('heading', { name: 'Tu acceso está listo', exact: true }).waitFor({ state: 'visible' })
    else await page.getByRole('alert').filter({ hasText: /ya se utilizó o caducó/ }).waitFor({ state: 'visible' })
  }
  try {
    await page.bringToFront()
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(`${baseURL}/registro-local`)
    await page.evaluate(async () => { await fetch('/api/local/student/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }) })
    const form = page.getByRole('form')
    await form.locator('[name="filledBy"][value="alumno"]').check()
    await form.locator('[name="firstName"]').fill('Cuenta')
    await form.locator('[name="lastName"]').fill(lastName)
    await form.locator('[name="birthDate"]').fill('2000-01-01')
    await form.locator('[name="program"]').selectOption({ label: 'Business English' })
    await form.locator('[name="group"]').selectOption({ label: 'Mar y jue · 19:30' })
    await form.locator('[name="email"]').fill(studentEmail)
    await form.getByRole('button', { name: 'Continuar', exact: true }).click()
    await form.getByRole('button', { name: 'Continuar', exact: true }).click()
    await form.locator('[name="acceptRules"]').check()
    await form.locator('[name="acceptPrivacy"]').check()
    await form.getByRole('button', { name: 'Enviar solicitud', exact: true }).click()
    await page.getByRole('heading', { name: '¡Solicitud enviada!', exact: true }).waitFor({ state: 'visible' })
    await signInAdmin()
    await nav().getByRole('link', { name: 'Solicitudes', exact: true }).click()
    await page.getByRole('button', { name: `Revisar solicitud de ${name}`, exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Aprobar solicitud', exact: true }).click()
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    await nav().getByRole('link', { name: 'Alumnos', exact: true }).click()
    await studentRow().getByRole('button', { name: `Preparar acceso de ${name}`, exact: true }).click()
    let dialog = page.getByRole('dialog')
    const firstLink = await dialog.getByRole('textbox', { name: 'Enlace de activación', exact: true }).inputValue()
    check(firstLink.includes('/activar#token='), 'Coordinación prepara un enlace sin incluirlo en la ruta HTTP')
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    await studentRow().getByRole('button', { name: `Preparar acceso de ${name}`, exact: true }).click()
    dialog = page.getByRole('dialog')
    const finalLink = await dialog.getByRole('textbox', { name: 'Enlace de activación', exact: true }).inputValue()
    check(finalLink !== firstLink, 'Renovar prepara un enlace distinto')
    await page.setViewportSize({ width: 320, height: 812 })
    check(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth), 'Enlace y controles caben en un diálogo móvil')
    await page.keyboard.press('Escape')
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
    await activate(firstLink, false)
    check(true, 'El enlace reemplazado no activa la cuenta')
    await activate(finalLink, true)
    check(new URL(page.url()).hash === '', 'El token se retira de la barra tras abrir la activación')
    await signInStudent()
    check(await page.getByRole('heading', { name: 'Mi inscripción', exact: true }).isVisible(), 'El alumno entra a su espacio protegido')
    await page.reload()
    await page.getByRole('heading', { name: /^Hola, Cuenta / }).waitFor({ state: 'visible' })
    check(true, 'La sesión de alumno sobrevive a la recarga')
    await activate(finalLink, false)
    check(true, 'El enlace usado no se puede reutilizar')
    await signInAdmin()
    await nav().getByRole('link', { name: 'Alumnos', exact: true }).click()
    await studentRow().getByRole('button', { name: `Suspender a ${name}`, exact: true }).click()
    await studentRow().getByText('Suspendido', { exact: true }).waitFor({ state: 'visible' })
    await page.goto(`${baseURL}/alumnos`)
    await page.getByRole('heading', { name: 'Entra a tu espacio', exact: true }).waitFor({ state: 'visible' })
    check(true, 'La suspensión corta el acceso del alumno')
    await signInAdmin()
    await nav().getByRole('link', { name: 'Alumnos', exact: true }).click()
    await studentRow().getByRole('button', { name: `Reactivar a ${name}`, exact: true }).click()
    await studentRow().getByText('Activo', { exact: true }).waitFor({ state: 'visible' })
    await signInStudent()
    check(true, 'Reactivar permite iniciar una nueva sesión')
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 812 })
      for (const path of ['/alumnos', '/activar', '/gestion/alumnos']) {
        await page.goto(`${baseURL}${path}`)
        await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' })
        if (path.startsWith('/gestion')) await page.getByText('Cargando solicitudes y alumnos…', { exact: true }).waitFor({ state: 'hidden' })
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
        check(!overflow, `${path} a ${width}px sin desbordamiento`)
        matrix.push({ path, width, overflow })
      }
    }
    check(errors.length === 0, `Sin errores de ejecución: ${errors.join(', ')}`)
    return { status: 'correcto', checks: details.length, details, matrix, errors }
  } finally { page.off('pageerror', onError) }
}
