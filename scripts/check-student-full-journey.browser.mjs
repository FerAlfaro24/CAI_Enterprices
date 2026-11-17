/** Recorrido transversal con un menor nuevo: final-review-browser-server, nunca datos reales. */
export async function checkStudentFullJourney(page, {
  email, password, browserLabel = 'Prueba', baseURL = 'http://127.0.0.1:4180', screenshotDir,
} = {}) {
  if (!email?.startsWith('revision-') || !email.endsWith('@example.test') || password !== 'Frase ficticia de revisión final CAI 2026') {
    throw Error('Este recorrido requiere la fixture aislada final-review-browser-server.')
  }
  const contexts = [], details = [], errors = []
  const check = (ok, label) => { if (!ok) throw Error(label); details.push(label) }
  const open = async width => {
    const context = await page.context().browser().newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
    contexts.push(context)
    const target = await context.newPage()
    target.setDefaultTimeout(10000)
    target.on('pageerror', error => errors.push(String(error)))
    return target
  }
  const call = (target, path) => target.evaluate(async path => {
    const response = await fetch('/api/local' + path)
    return { status: response.status, data: await response.json() }
  }, path)
  const communityNav = target => target.getByRole('navigation', { name: 'Secciones de comunidad', exact: true })
  const adminNav = target => target.getByRole('navigation', { name: 'Secciones de administración', exact: true })
  const shot = async (target, name) => {
    if (screenshotDir) await target.screenshot({ path: screenshotDir + '/' + browserLabel + '-journey-' + name + '.png' })
  }
  const studentPassword = 'Frase ficticia de recorrido integral CAI 2026'
  const lastName = browserLabel + ' ' + Date.now(), fullName = 'Menor Ficticio ' + lastName
  const address = 'journey-' + browserLabel.toLowerCase() + '-' + Date.now() + '@example.test'
  try {
    const student = await open(375), admin = await open(1440)
    await student.goto(baseURL + '/registro')
    let form = student.getByRole('form')
    check(await form.locator('input[type=password]').count() === 0, 'El ingreso del menor no pide contraseña antes de la aprobación')
    await form.locator('[name=filledBy][value=alumno]').check()
    await form.locator('[name=firstName]').fill('Menor Ficticio')
    await form.locator('[name=lastName]').fill(lastName)
    await form.locator('[name=birthDate]').fill((new Date().getFullYear() - 11) + '-01-01')
    await form.locator('[name=program]').selectOption({ label: 'Business English' })
    await form.locator('[name=group]').selectOption({ label: 'Mar y jue · 19:30' })
    await form.locator('[name=email]').fill(address)
    await form.getByRole('button', { name: 'Continuar', exact: true }).click()
    await form.getByText('Para menores de 13 años, la solicitud la llena su madre, padre o tutor.', { exact: true }).waitFor()
    check(await form.locator('[name=guardianName]').count() === 0, 'Un menor de trece años no avanza declarando que llena su propia solicitud')
    await form.locator('[name=filledBy][value=tutor]').check()
    await form.getByRole('button', { name: 'Continuar', exact: true }).click()
    await form.locator('[name=guardianName]').fill('Tutor Ficticio del recorrido')
    await form.locator('[name=relationship]').selectOption('Madre')
    await form.locator('[name=guardianContact]').fill('tutor-recorrido@example.test')
    await form.getByRole('button', { name: 'Continuar', exact: true }).click()
    await form.locator('[name=guardianConsent][aria-invalid=true]').waitFor()
    check(await form.locator('[name=guardianName]').isVisible(), 'Sin autorización declarada conserva los datos y explica el requisito')
    await form.locator('[name=guardianConsent]').check()
    await form.getByRole('button', { name: 'Continuar', exact: true }).click()
    check(await form.locator('[name=nameStyle][value=full]').isDisabled(), 'El menor no puede publicar su nombre completo en el perfil')
    check(await form.locator('[name=visibility][value=comunidad]').isDisabled(), 'El perfil del menor queda limitado a su grupo')
    await form.getByRole('button', { name: 'Continuar', exact: true }).click()
    await form.locator('[name=acceptRules]').check()
    await form.locator('[name=acceptPrivacy]').check()
    await form.getByRole('button', { name: 'Enviar solicitud', exact: true }).click()
    await student.getByRole('heading', { name: '¡Solicitud enviada!', exact: true }).waitFor()
    check(true, 'El tutor puede enviar la solicitud completa desde móvil')

    await admin.goto(baseURL + '/admin/solicitudes')
    await admin.locator('#login-email').fill(email)
    await admin.locator('#login-password').fill(password)
    await admin.getByRole('button', { name: 'Entrar al panel', exact: true }).click()
    await admin.getByRole('button', { name: 'Revisar solicitud de ' + fullName, exact: true }).click()
    let dialog = admin.getByRole('dialog')
    check(await dialog.getByRole('button', { name: 'Aprobar solicitud', exact: true }).isDisabled(), 'Coordinación no puede aprobar sin confirmar la autorización del tutor')
    await dialog.getByLabel('Referencia de la autorización recibida', { exact: true }).fill('Autorización ficticia comprobada para el recorrido integral')
    check(await dialog.getByRole('button', { name: 'Registrar autorización', exact: true }).isDisabled(), 'Escribir una referencia no sustituye confirmar al tutor')
    await dialog.getByRole('checkbox', { name: 'Confirmé la autorización con el tutor.', exact: true }).check()
    await dialog.getByRole('button', { name: 'Registrar autorización', exact: true }).click()
    await admin.getByText('Autorización del tutor registrada.', { exact: true }).waitFor()
    check(await admin.getByRole('dialog').getByRole('button', { name: 'Aprobar solicitud', exact: true }).isEnabled(), 'Registrar la autorización habilita la aprobación sin perder la solicitud')
    await admin.setViewportSize({ width: 320, height: 1000 })
    check(await admin.getByRole('dialog').evaluate(el => el.scrollWidth <= el.clientWidth), 'La ficha con tutor y correo se puede leer a 320 px')
    await shot(admin, 'consent-mobile')
    await admin.getByRole('dialog').getByRole('button', { name: 'Aprobar solicitud', exact: true }).click()
    await admin.getByRole('dialog').waitFor({ state: 'hidden' })
    await admin.setViewportSize({ width: 1440, height: 1000 })
    await adminNav(admin).getByRole('link', { name: 'Alumnos', exact: true }).click()
    const row = admin.getByRole('row').filter({ hasText: fullName })
    await row.getByRole('button', { name: 'Ficha de ' + fullName, exact: true }).click()
    await admin.getByRole('dialog').getByRole('button', { name: 'Preparar acceso', exact: true }).click()
    const invitation = await admin.getByRole('dialog').getByLabel('Enlace de activación', { exact: true }).inputValue()
    check(invitation.includes('/activar#token='), 'El alumno aprobado recibe un enlace de activación privado')
    await student.goto(invitation)
    await student.getByLabel('Nueva contraseña', { exact: true }).fill(studentPassword)
    await student.getByLabel('Confirma tu contraseña', { exact: true }).fill(studentPassword)
    await student.getByRole('button', { name: 'Activar mi cuenta', exact: true }).click()
    await student.getByRole('heading', { name: 'Tu acceso está listo', exact: true }).waitFor()
    await student.getByRole('link', { name: 'Entrar a mi espacio', exact: true }).click()
    await student.locator('#login-email').fill(address)
    await student.locator('#login-password').fill(studentPassword)
    await student.getByRole('button', { name: 'Entrar a mi espacio', exact: true }).click()
    await student.getByRole('button', { name: 'Actualizar comunidad', exact: true }).waitFor()
    const identity = (await call(student, '/student/me')).data.user
    check(identity.displayName === 'Menor ' + lastName[0].toUpperCase() + '.', 'La comunidad utiliza el nombre abreviado declarado para el menor')
    check((await call(student, '/student/challenges')).data.progress.todayAnswered === 0, 'La cuenta nueva comienza sin respuestas ni progreso heredado')
    await communityNav(student).getByRole('button', { name: 'Retos', exact: true }).click()
    const quiz = student.getByRole('region', { name: 'Reto del día compartido', exact: true })
    const questions = student.getByRole('navigation', { name: 'Preguntas de hoy', exact: true })
    await quiz.waitFor()
    check(await questions.getByRole('button').count() === 3, 'El alumno recién activado recibe las tres preguntas diarias reales')
    for (let index = 0; index < 3; index++) {
      await questions.getByRole('button').nth(index).click()
      await quiz.getByRole('radio').first().check()
      await quiz.getByRole('button', { name: '¡Comprobar!', exact: true }).click()
      await quiz.getByRole('status').filter({ hasText: /Respuesta (correcta|incorrecta)/ }).waitFor()
      check(await quiz.getByRole('radio').first().isDisabled(), 'Respuesta ' + (index + 1) + ' guardada y protegida contra repetición')
    }
    const progress = (await call(student, '/student/challenges')).data.progress
    check(progress.todayAnswered === 3 && progress.points >= 15 && progress.points <= 45, 'Completar el día registra las tres respuestas y puntos sin exigir acertarlas')
    await communityNav(student).getByRole('button', { name: 'Logros', exact: true }).click()
    const collection = student.getByRole('region', { name: 'Mis insignias conseguidas', exact: true })
    await collection.locator('[data-badge-id="first-answer"]').waitFor()
    check(await collection.getByRole('article').count() === 1, 'La primera respuesta genera una sola insignia sin concesión manual')
    await student.reload()
    await communityNav(student).getByRole('button', { name: 'Logros', exact: true }).click()
    await collection.locator('[data-badge-id="first-answer"]').waitFor()
    check((await call(student, '/student/challenges')).data.progress.todayAnswered === 3, 'Recargar mantiene sesión, respuestas e insignia del alumno nuevo')
    await shot(student, 'first-badge-mobile')
    check((await call(student, '/student/posts')).data.mine.length === 0, 'Conseguir una insignia no publica información del menor automáticamente')
    await collection.getByRole('button', { name: /Compartir mi logro/ }).click()
    dialog = student.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    const story = (await call(student, '/student/posts')).data.mine[0]
    check(story.status === 'pendiente', 'Compartir la primera insignia exige revisión de coordinación')

    await admin.goto(baseURL + '/admin/alumnos')
    await row.getByRole('button', { name: 'Ficha de ' + fullName, exact: true }).click()
    await admin.getByRole('dialog').getByRole('button', { name: 'Suspender acceso', exact: true }).click()
    await admin.getByRole('dialog').waitFor({ state: 'hidden' })
    check((await call(student, '/student/challenges')).status === 401, 'Suspender al alumno cancela el acceso a retos con la sesión anterior')
    await student.reload()
    await student.getByRole('form', { name: 'Acceso de alumnos', exact: true }).waitFor()
    check(true, 'La pantalla vuelve al acceso después de revocar la cuenta')
    check(errors.length === 0, 'Sin errores JavaScript durante el recorrido transversal')
    return { browserLabel, checks: details.length, details, errors }
  } catch (error) {
    throw Error(error.message + '\nCompletadas: ' + details.length + '\n' + details.join('\n'))
  } finally {
    for (const context of contexts) await context.close()
  }
}
