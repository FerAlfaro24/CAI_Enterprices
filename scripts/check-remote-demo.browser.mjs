/** Recorrido por HTTPS real; recibe accesos privados fuera del repositorio. */
export async function checkRemoteDemo(browser, { access, screenshotDir, browserLabel }) {
  const results = [], errors = [], check = (value, label) => { if (!value) throw Error(label); results.push(label) }
  const base = access.origin
  const anonymous = await browser.newContext()
  let student, admin
  try {
    for (const path of ['/', '/community', '/api/local/health']) {
      check((await anonymous.request.get(base + path)).status() === 401, `Sin clave se bloquea ${path}`)
    }
    student = await browser.newContext({ httpCredentials: access.gate, locale: 'es-MX' })
    const page = await student.newPage()
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    const response = await page.goto(base + '/login')
    check(response.status() === 200, 'Acceso directo por HTTPS responde correctamente')
    await page.getByLabel('Correo electrónico', { exact: true }).fill(access.student.email)
    await page.getByLabel('Contraseña', { exact: true }).fill(access.student.password)
    await page.getByRole('button', { name: 'Entrar a mi espacio', exact: true }).click()
    await page.getByRole('heading', { name: 'Tu comunidad, en imágenes.', exact: true }).waitFor()
    check(page.url() === base + '/community', 'Alumno entra a la comunidad conectada')
    check((await page.getByRole('note').allTextContents()).some(text => text.includes('ficticias')), 'Aviso de presentación ficticia visible')
    const cookies = await student.cookies(base)
    check(cookies.some(cookie => cookie.name.startsWith('__Host-') && cookie.secure && cookie.httpOnly && cookie.sameSite === 'Strict'), 'Sesión real usa cookie segura de producción')
    const hero = page.getByRole('region', { name: 'Destacados de la comunidad', exact: true })
    await hero.locator('img').last().waitFor()
    await page.waitForFunction(() => Array.from(document.querySelectorAll('[aria-label="Destacados de la comunidad"] img')).some(i => i.complete && i.naturalWidth > 0))
    check(true, 'Foto oficial de Inicio cargada a través del túnel')
    await page.getByRole('button', { name: 'Pausar avance automático', exact: true }).click()
    await page.getByRole('button', { name: 'Ver historia y fotos', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Conversación (3)', exact: true }).waitFor()
    check(true, 'Historia conserva tres comentarios publicados')
    await dialog.getByRole('button', { name: /^Me encanta:/ }).click()
    await dialog.locator('[data-reaction-id="love"][aria-pressed="true"]').waitFor()
    check((await dialog.innerText()).includes('Tu reacción: Me encanta'), 'Reacción se guarda mediante HTTPS y origen válido')
    await dialog.locator('[data-reaction-id="love"][aria-pressed="true"]').click()
    await page.waitForFunction(() => !document.querySelector('dialog button[aria-label^="Me encanta:"][aria-pressed="true"]'))
    check(true, 'Se retira la reacción de comprobación')
    await dialog.getByRole('button', { name: 'Cerrar publicación', exact: true }).press('Escape')
    await page.getByRole('button', { name: 'Galería', exact: true }).click()
    const tiles = page.locator('[aria-label="Fotografías de la comunidad"] button')
    check(await tiles.count() === 6, 'Galería remota muestra las seis fotos oficiales')
    for (const tile of await tiles.all()) await tile.scrollIntoViewIfNeeded()
    await page.waitForFunction(() => Array.from(document.querySelectorAll('[aria-label="Fotografías de la comunidad"] img')).every(i => i.complete && i.naturalWidth > 0))
    check(true, 'Las seis fotos privadas cargan correctamente')
    const privatePhoto = await tiles.first().locator('img').getAttribute('src')
    check((await anonymous.request.get(new URL(privatePhoto, base).href)).status() === 401, 'Foto privada bloqueada sin la clave de entrada')
    const gateOnly = await browser.newContext({ httpCredentials: access.gate })
    try { check((await gateOnly.request.get(new URL(privatePhoto, base).href)).status() === 401, 'La clave de entrada sola no sustituye la sesión de alumno') } finally { await gateOnly.close() }
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 900 })
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Galería remota ${width}px sin desbordamiento`)
      await page.screenshot({ path: `${screenshotDir}/${browserLabel}-remote-gallery-${width}.png`, fullPage: true })
    }
    await page.reload()
    await page.getByRole('heading', { name: 'Tu comunidad, en imágenes.', exact: true }).waitFor()
    check(true, 'Recargar /community mantiene la sesión y resuelve la ruta')
    check((await student.request.get(base + '/api/local/health')).status() === 200, 'API protegida disponible en el mismo origen')
    for (const path of ['/.git/config', '/src/app.tsx', '/.local/cai.sqlite']) check((await student.request.get(base + path)).status() === 404, `Fuentes y datos no publicados: ${path}`)
    admin = await browser.newContext({ httpCredentials: access.gate, locale: 'es-MX' })
    const panel = await admin.newPage()
    panel.on('pageerror', error => errors.push(error.message))
    panel.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    await panel.goto(base + '/admin')
    await panel.getByLabel('Correo electrónico', { exact: true }).fill(access.admin.email)
    await panel.getByLabel('Contraseña', { exact: true }).fill(access.admin.password)
    await panel.getByRole('button', { name: 'Entrar al panel', exact: true }).click()
    await panel.getByRole('link', { name: 'Publicaciones', exact: true }).waitFor()
    check(true, 'Coordinación entra al panel real con su clave nueva')
    await panel.getByRole('link', { name: 'Publicaciones', exact: true }).click()
    await panel.getByText('Crear publicación de CAI', { exact: true }).waitFor()
    check(true, 'Gestión de publicaciones disponible')
    await panel.screenshot({ path: `${screenshotDir}/${browserLabel}-remote-admin.png`, fullPage: true })
    // Los GET deliberados de rechazo anteriores usan request, no contaminan consola del navegador.
    check(errors.length === 0, 'Sin errores JavaScript ni errores de consola inesperados')
    return { browser: browserLabel, checks: results.length, results, errors }
  } finally {
    if (student) await student.close()
    if (admin) await admin.close()
    await anonymous.close()
  }
}
