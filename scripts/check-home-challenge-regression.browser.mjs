/** Ejecutar con browser_run_code_unsafe en el perfil aislado de Brave/Opera GX.
 * No instala dependencias. El contenido de la demo permanece en memoria.
 */
async function checkHomeChallengeRegression(page, { baseURL = 'http://127.0.0.1:4190', screenshotDir } = {}) {
  const details = [], errors = []
  const check = (value, message) => { if (!value) throw new Error(message); details.push(message) }
  const onError = (error) => errors.push(String(error))
  const onConsole = (message) => { if (message.type() === 'error') errors.push(message.text()) }
  const nav = () => page.getByRole('navigation', { name: 'Secciones de comunidad' })
  const home = () => page.locator('[aria-labelledby="home-challenge-title"]')
  const quiz = () => page.getByRole('region', { name: 'Reto del día compartido', exact: true })
  const score = async (points) => check((await page.getByRole('region', { name: 'Tu progreso en los retos' }).innerText()).includes(`${points} puntos demo`), `Puntuación única: ${points}`)
  const section = async (name) => { await nav().getByRole('button', { name, exact: true }).click() }
  const openDemo = async () => { if (!(await page.locator('#community-demo-controls').evaluate((el) => el.open))) await page.locator('#community-demo-controls > summary').click() }
  const day = async (id) => { await openDemo(); await page.getByLabel('Cambiar día · Solo demo', { exact: true }).selectOption(id); await page.locator('#community-demo-controls > summary').click() }
  const reset = async () => { await openDemo(); await page.getByRole('button', { name: 'Reiniciar demo', exact: true }).click() }
  const answer = async (index) => { await quiz().getByRole('radio').nth(index).check(); await quiz().getByRole('button', { name: '¡Comprobar!', exact: true }).click() }
  const complete = async (points) => {
    await section('Inicio')
    check(await home().getByText(`Reto completado · +${points} puntos ficticios`, { exact: true }).count() === 1, `Inicio refleja intento de ${points} puntos`)
    check(await home().getByRole('radio').count() === 0, 'Inicio conserva una vista previa sin segundo formulario')
    await home().getByRole('button', { name: 'Ver mi resultado', exact: true }).click()
    check(await quiz().getByRole('radio').first().isDisabled() && await quiz().getByRole('button', { name: '¡Comprobar!', exact: true }).count() === 0, 'No se puede repetir desde Inicio ni Retos')
  }
  page.on('pageerror', onError); page.on('console', onConsole)
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const width of [1440, 375, 320]) for (const theme of ['claro', 'oscuro']) {
      await page.setViewportSize({ width, height: 900 }); await page.goto(`${baseURL}/community`)
      await page.getByRole('button', { name: `Modo ${theme}`, exact: true }).click()
      await reset()
      const question = await home().locator('p').innerText()
      check((await home().innerText()).includes('Día 1 · Responde esta pregunta en Retos.'), 'Inicio identifica día y destino para responder')
      await home().getByRole('button', { name: 'Jugar reto de hoy', exact: true }).click()
      check(await quiz().locator('legend').innerText() === question, 'CTA pendiente abre la misma pregunta en Retos')
      await score(0)
      await quiz().getByRole('button', { name: '¡Comprobar!', exact: true }).click()
      check(await quiz().getByRole('alert').count() === 1, 'La validación compartida impide enviar sin respuesta')
      await score(0); await answer(0); await score(15); await complete(15); await score(15)
      await section('Logros')
      check(await page.getByRole('region', { name: 'Insignias conseguidas de Alex', exact: true }).getByRole('article').count() === 1, 'Primera respuesta concede insignia automática en Logros')
      await section('Retos'); await day('day-2')
      const second = await quiz().locator('legend').innerText()
      await section('Inicio')
      check(await home().locator('p').innerText() === second && (await home().innerText()).includes('Día 2 ·'), 'Cambiar día actualiza pregunta y día de Inicio')
      await home().getByRole('button', { name: 'Jugar reto de hoy', exact: true }).click(); await answer(0)
      await score(20); await complete(5); await score(20)
      await day('day-3'); await answer(0); await score(35)
      check((await page.getByRole('region', { name: 'Tu progreso en los retos' }).innerText()).includes('3 días seguidos'), 'Aciertos y errores conservan la racha de tres días')
      await section('Logros')
      check(await page.getByRole('region', { name: 'Insignias conseguidas de Alex', exact: true }).getByRole('article').count() === 2, 'Insignia automática de racha reflejada en Logros')
      await section('Inicio')
      await page.getByRole('link', { name: 'Sitio institucional ↗', exact: true }).last().click()
      check(new URL(page.url()).pathname === '/', 'Navegación SPA a Landing')
      if (width <= 1100) await page.getByRole('button', { name: 'Abrir menú', exact: true }).click()
      await page.getByRole('link', { name: 'Iniciar sesión / Registrarse', exact: true }).filter({ visible: true }).click()
      await page.getByRole('button', { name: /^Demo estudiante/ }).click()
      check((await home().innerText()).includes('Día 3 ·') && (await home().innerText()).includes('Reto completado · +15'), 'Landing → Login → Comunidad conserva día e intento')
      await home().getByRole('button', { name: 'Ver mi resultado', exact: true }).click(); await score(35)
      await day('day-1'); await complete(15); await score(35)
      for (const name of ['Inicio', 'Retos']) {
        await section(name)
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: sin desbordamiento a ${width} en ${theme}`)
        if (screenshotDir) await page.screenshot({ path: `${screenshotDir}/reto-${name}-${width}-${theme}.png`, fullPage: true, animations: 'disabled' })
      }
      await reset()
      check(await home().locator('p').innerText() === question && await home().getByRole('button', { name: 'Jugar reto de hoy', exact: true }).count() === 1, 'Reinicio restaura vista previa del día uno')
      await home().getByRole('button', { name: 'Jugar reto de hoy', exact: true }).click(); await score(0)
      check(await quiz().getByRole('radio', { checked: true }).count() === 0, 'Reinicio restaura Retos sin selección')
      await section('Logros')
      check(await page.getByRole('region', { name: 'Insignias conseguidas de Alex', exact: true }).getByRole('article').count() === 0, 'Reinicio limpia insignias automáticas')
    }
    check(errors.length === 0, `Sin errores de consola: ${JSON.stringify(errors)}`)
    return { status: 'correcto', checks: details.length, details, errors }
  } finally { page.off('pageerror', onError); page.off('console', onConsole) }
}
