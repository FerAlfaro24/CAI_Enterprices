async function refreshCommunity(page) {
  await page.getByRole('button', { name: /^Abrir mi perfil:/ }).click()
  const profile = page.getByRole('dialog')
  await profile.getByRole('button', { name: 'Actualizar comunidad', exact: true }).click()
  await profile.getByRole('button', { name: 'Actualizar comunidad', exact: true }).waitFor()
  await profile.getByRole('button', { name: 'Cerrar perfil', exact: true }).click()
}

/** Pruebas sobre una fixture nueva por navegador. Nunca usar cuentas habituales. */
export async function checkCommunityPlayful(browser, { baseURL, correct, screenshotDir, browserLabel }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'es-MX' })
  const page = await context.newPage(), results = [], errors = []
  const password = 'Frase ficticia para fotos oficiales 2026'
  const check = (value, label) => { if (!value) throw Error(label); results.push(label) }
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('503')) errors.push(message.text()) })
  const request = async (path, data) => {
    const response = await context.request[data ? 'post' : 'get'](baseURL + '/api/local' + path, data ? { data, headers: { Origin: baseURL } } : undefined)
    if (!response.ok()) throw Error(`${path}: ${response.status()} ${await response.text()}`)
    return response.json()
  }
  const shot = async (name, fullPage = false) => {
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
    await page.screenshot({ path: `${screenshotDir}/${browserLabel}-${name}.png`, fullPage })
  }
  try {
    await page.goto(baseURL + '/login')
    await page.getByLabel('Correo electrónico', { exact: true }).fill('bob@example.test')
    await page.getByLabel('Contraseña', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Entrar a mi espacio', exact: true }).click()
    await page.getByRole('heading', { name: 'Tu comunidad, al día.', exact: true }).waitFor()
    const me = (await request('/student/me')).user
    check(await page.getByRole('region', { name: 'Mis pequeños grandes pasos' }).isVisible(), 'Inicio muestra progreso real y accesos a Retos/Logros')
    check(await page.locator('[class*="community_"]').first().evaluate(node => { const style = getComputedStyle(node, '::before'); return style.maskImage !== 'none' && style.pointerEvents === 'none' }), 'Patrón original cargado como decoración sin interacción')
    await shot('home-light')
    await page.getByRole('button', { name: /^Abrir mi perfil:/ }).click()
    const profile = page.getByRole('dialog')
    check(await profile.getByRole('region', { name: 'Mi progreso privado' }).isVisible(), 'Mi perfil muestra puntos, insignias y serie privados')
    check(await profile.getByRole('button', { name: 'Editar mi perfil', exact: true }).isVisible(), 'Editor existente sigue accesible')
    await shot('profile')
    await profile.getByRole('button', { name: 'Cerrar perfil', exact: true }).press('Escape')
    await page.getByRole('button', { name: /^Mis notificaciones/ }).click()
    const notices = page.getByRole('dialog')
    check(await notices.getByRole('heading', { name: 'Mis notificaciones', exact: true }).isVisible(), 'Notificaciones abre una bandeja propia')
    await notices.getByRole('button', { name: /^Sin leer/ }).click()
    check(await notices.locator('[data-unread="true"]').count() > 0, 'Filtro sin leer muestra avisos reales')
    await notices.getByRole('button', { name: /^Marcar leído/ }).first().click()
    await notices.getByRole('heading', { name: '¡Estás al día!', exact: true }).waitFor()
    check(true, 'Marcar leído persiste y deja un vacío claro')
    await notices.getByRole('button', { name: /^Todas/ }).click()
    check(await notices.locator('[data-unread="false"]').count() > 0, 'Todas conserva los mensajes leídos')
    await shot('notices')
    await notices.getByRole('button', { name: 'Cerrar notificaciones', exact: true }).press('Escape')
    await page.getByRole('group', { name: 'Contenido destacado' }).getByRole('button', { name: /^Momentos/ }).click()
    await page.getByRole('button', { name: 'Ver historia y fotos', exact: true }).click()
    let dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: /^Me encanta:/ }).click()
    await dialog.locator('[data-reaction-id="love"][aria-pressed="true"]').waitFor()
    check(await dialog.locator('[data-reaction-celebration]').count() === 1, 'Reacción confirmada anima el emoji')
    await dialog.locator('[data-reaction-id="love"][aria-pressed="true"]').click()
    await dialog.getByText('Quitaste tu reacción.', { exact: true }).waitFor()
    const failing = '**/api/local/student/posts/*/reaction'
    await page.route(failing, route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Fallo simulado de QA.' }) }))
    await dialog.getByRole('button', { name: /^Me encanta:/ }).click()
    await dialog.getByText(/No confirmamos el cambio/).waitFor()
    check(await dialog.locator('[data-reaction-celebration]').count() === 0, 'Fallo de guardado no anuncia ni anima una reacción')
    await page.unroute(failing)
    await dialog.getByRole('button', { name: 'Cerrar publicación', exact: true }).press('Escape')
    await refreshCommunity(page)
    await page.getByRole('button', { name: 'Retos', exact: true }).click()
    const mission = page.getByRole('region', { name: 'Tu progreso en los retos', exact: true })
    check(await mission.getByRole('progressbar').getAttribute('aria-valuenow') === '0', 'Misión empieza con cero respuestas reales')
    const quiz = page.getByRole('region', { name: 'Reto del día compartido', exact: true })
    await quiz.getByRole('button', { name: '¡Comprobar!', exact: true }).click()
    await quiz.getByRole('alert').waitFor()
    check(await quiz.getByRole('radio').first().evaluate(node => node === document.activeElement), 'Elegir respuesta sigue siendo obligatorio y devuelve foco')
    await shot('retos-light', true)
    await quiz.getByRole('radio').nth((correct[0] + 1) % 3).check()
    await quiz.getByRole('button', { name: '¡Comprobar!', exact: true }).click()
    dialog = page.getByRole('dialog', { name: 'Primera respuesta', exact: true })
    await dialog.waitFor()
    check((await dialog.innerText()).includes('Es tuya y es privada'), 'Nueva insignia abre celebración grande y privada')
    check(await dialog.locator('[data-celebration="confetti"]').count() === 1, 'Insignia confirmada incluye confeti decorativo')
    await shot('badge-celebration')
    await dialog.getByRole('button', { name: 'Cerrar celebración de insignia' }).focus()
    await page.keyboard.press('Shift+Tab')
    check(await dialog.evaluate(node => node.contains(document.activeElement)), 'Teclado permanece dentro de la celebración')
    await page.keyboard.press('Escape')
    check((await quiz.innerText()).includes('+5 puntos'), 'Equivocarse conserva cinco puntos y explicación')
    check(await quiz.locator('[data-celebration="confetti"]').count() === 0, 'Respuesta incorrecta no dispara confeti de acierto')
    check(await mission.getByRole('progressbar').getAttribute('aria-valuenow') === '1', 'Misión avanza tras guardar')
    await page.getByRole('button', { name: 'Siguiente pregunta', exact: true }).click()
    await quiz.getByRole('radio').nth(correct[1]).check()
    await quiz.getByRole('button', { name: '¡Comprobar!', exact: true }).click()
    await quiz.getByRole('status').filter({ hasText: '¡Respuesta correcta!' }).waitFor()
    check(await quiz.locator('[data-celebration="confetti"]').count() === 1, 'Acierto confirmado celebra y muestra explicación')
    check((await quiz.innerText()).includes('+15 puntos'), 'Acierto conserva quince puntos reales')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForFunction(() => !document.querySelector('[data-celebration="confetti"]'))
    check(await page.locator('[data-celebration="confetti"]').count() === 0, 'Movimiento reducido elimina partículas')
    await page.getByRole('button', { name: 'Siguiente pregunta', exact: true }).click()
    await quiz.getByRole('radio').nth(correct[2]).check()
    await quiz.getByRole('button', { name: '¡Comprobar!', exact: true }).click()
    await page.getByRole('heading', { name: '¡Por hoy, misión cumplida!', exact: true }).waitFor()
    check((await mission.innerText()).includes('35'), 'Puntuación final suma solo resultados guardados')
    check(await mission.getByRole('progressbar').getAttribute('aria-valuenow') === '3', 'Tres preguntas completan el recorrido')
    check(await page.locator('[data-celebration="confetti"]').count() === 0, 'Completar con movimiento reducido conserva celebración sin confeti')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.waitForFunction(() => Boolean(document.querySelector('[data-celebration="confetti"]')))
    check(await page.locator('[data-celebration="confetti"]').count() > 0, 'Celebración del día tiene versión con confeti')
    await shot('retos-complete', true)
    await page.reload()
    await page.getByRole('button', { name: 'Retos', exact: true }).click()
    await page.getByRole('heading', { name: '¡Por hoy, misión cumplida!' }).waitFor()
    check(await page.getByRole('dialog').count() === 0, 'Recargar no repite una insignia antigua')
    check(await page.locator('[data-celebration="confetti"]').count() === 0, 'Recargar no repite confeti de respuestas o día terminado')
    check((await request('/student/challenges')).progress.points === 35, 'Recarga no vuelve a sumar puntos')
    const admin = await browser.newContext()
    try {
      const login = await admin.request.post(baseURL + '/api/local/auth/login', { data: { email: 'admin@example.test', password }, headers: { Origin: baseURL } })
      check(login.ok(), 'Coordinación de fixture inicia sesión para probar concesiones')
      for (const badgeId of ['good-companion', 'speaking-confidence']) {
        const response = await admin.request.post(baseURL + '/api/local/badge-grants', { data: { studentId: me.id, badgeId, reason: 'Reconocimiento ficticio exclusivo para verificar presentación.', confirmed: true }, headers: { Origin: baseURL, 'Idempotency-Key': crypto.randomUUID() } })
        if (!response.ok()) throw Error(await response.text())
      }
    } finally { await admin.close() }
    await refreshCommunity(page)
    dialog = page.getByRole('dialog'); await dialog.waitFor()
    check(await dialog.getByRole('button', { name: 'Siguiente insignia (1)', exact: true }).isVisible(), 'Dos concesiones nuevas se presentan en cola')
    const first = await dialog.getByRole('heading').innerText()
    await dialog.getByRole('button', { name: 'Siguiente insignia (1)', exact: true }).click()
    check((await page.getByRole('dialog').getByRole('heading').innerText()) !== first, 'Segunda insignia conserva su propio reconocimiento')
    await page.getByRole('dialog').getByRole('button', { name: 'Ver mis insignias', exact: true }).click()
    check(await page.getByRole('dialog').count() === 0, 'Ver colección cierra la celebración')
    await page.getByRole('button', { name: /^Abrir mi perfil:/ }).click()
    check((await page.getByRole('region', { name: 'Mi progreso privado' }).innerText()).includes('35'), 'Mi espacio refleja el progreso actualizado')
    await shot('profile-earned')
    await page.getByRole('button', { name: 'Cerrar perfil' }).press('Escape')
    for (const theme of ['claro', 'oscuro']) {
      await page.getByRole('button', { name: `Modo ${theme}`, exact: true }).click()
      for (const section of ['Inicio', 'Retos']) {
        await page.getByRole('button', { name: section, exact: true }).click()
        for (const width of [1440, 768, 375, 320]) {
          await page.setViewportSize({ width, height: 900 })
          check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${section} ${theme} ${width}px sin desbordamiento`)
          await shot(`${section}-${theme}-${width}`)
        }
      }
    }
    check(errors.length === 0, 'Sin errores de consola o JavaScript inesperados')
    return { browser: browserLabel, checks: results.length, results, errors }
  } finally { await context.close() }
}

/** Revisión posterior de modales en móvil, contraste, privacidad y galería. */
export async function checkPlayfulDialogs(browser, { baseURL, screenshotDir, browserLabel }) {
  const context = await browser.newContext({ viewport: { width: 375, height: 900 }, locale: 'es-MX' })
  const page = await context.newPage(), results = [], check = (value, label) => { if (!value) throw Error(label); results.push(label) }
  const password = 'Frase ficticia para fotos oficiales 2026'
  const fits = async () => page.getByRole('dialog').evaluate(node => { const box = node.getBoundingClientRect(); return box.left >= 0 && box.right <= innerWidth && node.scrollWidth <= node.clientWidth })
  const shot = async name => page.screenshot({ path: `${screenshotDir}/${browserLabel}-${name}.png`, fullPage: false })
  try {
    await page.goto(baseURL + '/login')
    await page.getByLabel('Correo electrónico', { exact: true }).fill('bob@example.test')
    await page.getByLabel('Contraseña', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Entrar a mi espacio', exact: true }).click()
    await page.getByRole('button', { name: 'Retos', exact: true }).click()
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Barra compacta cabe a 375px')
    await shot('mobile-retos-final')
    await page.getByRole('button', { name: /^Abrir mi perfil:/ }).click()
    check(await fits(), 'Perfil y sus estadísticas caben en móvil')
    await page.getByRole('button', { name: 'Editar mi perfil', exact: true }).click()
    check(await page.getByRole('form', { name: 'Editar mi perfil visible' }).isVisible(), 'Editar alias/avatar sigue disponible desde el perfil nuevo')
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await shot('mobile-profile-final')
    await page.getByRole('button', { name: 'Cerrar perfil', exact: true }).press('Escape')
    for (const theme of ['claro', 'oscuro']) {
      await page.getByRole('button', { name: `Modo ${theme}`, exact: true }).click()
      await page.getByRole('button', { name: /^Mis notificaciones/ }).click()
      check(await fits(), `Notificaciones ${theme} caben en móvil`)
      for (const label of ['Sin leer', 'Todas']) {
        await page.getByRole('dialog').getByRole('button', { name: new RegExp('^' + label) }).click()
        const contrast = await page.locator('[aria-label="Filtrar mis notificaciones"] button[aria-pressed="true"]').evaluate(node => {
          const luminance = color => {
            const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => { const v = value / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 })
            return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
          }
          const style = getComputedStyle(node), values = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => b - a)
          return (values[0] + .05) / (values[1] + .05)
        })
        check(contrast >= 4.5, `Filtro ${label} ${theme} conserva contraste de texto`)
      }
      await shot(`mobile-notices-${theme}-final`)
      await page.getByRole('button', { name: 'Cerrar notificaciones', exact: true }).press('Escape')
    }
    await page.getByRole('button', { name: 'Inicio', exact: true }).click()
    await page.getByRole('button', { name: 'Camila R.', exact: true }).first().click()
    check(await page.getByRole('region', { name: 'Mi progreso privado' }).count() === 0, 'Otro perfil no muestra progreso privado')
    check(await page.getByRole('button', { name: 'Editar mi perfil', exact: true }).count() === 0, 'Otro perfil no ofrece edición de cuenta')
    await page.getByRole('button', { name: 'Cerrar perfil', exact: true }).press('Escape')
    await page.getByRole('button', { name: 'Galería', exact: true }).click()
    check(await page.locator('[aria-label="Fotografías de la comunidad"] button').count() === 6, 'Las seis fotos siguen visibles bajo el nuevo estilo')
    const me = await (await context.request.get(baseURL + '/api/local/student/me')).json()
    const admin = await browser.newContext()
    try {
      await admin.request.post(baseURL + '/api/local/auth/login', { data: { email: 'admin@example.test', password }, headers: { Origin: baseURL } })
      const response = await admin.request.post(baseURL + '/api/local/badge-grants', { data: { studentId: me.user.id, badgeId: 'cai-consistency', reason: 'Reconocimiento ficticio para comprobar el diálogo en móvil.', confirmed: true }, headers: { Origin: baseURL, 'Idempotency-Key': crypto.randomUUID() } })
      if (!response.ok()) throw Error(await response.text())
    } finally { await admin.close() }
    await refreshCommunity(page)
    await page.getByRole('dialog', { name: 'Constancia', exact: true }).waitFor()
    check(await fits(), 'Celebración de insignia cabe en móvil y permite desplazamiento vertical')
    await shot('mobile-badge-final')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForFunction(() => !document.querySelector('[data-celebration="confetti"]'))
    check(true, 'Celebración abierta responde al cambio a movimiento reducido')
    await page.keyboard.press('Escape')
    check(await page.getByRole('dialog').count() === 0, 'Escape cierra la celebración en móvil')
    return { browser: browserLabel, checks: results.length, results }
  } finally { await context.close() }
}
