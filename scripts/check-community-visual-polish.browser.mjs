/** Run with the existing Brave browser_run_code_unsafe tool. No extra test packages. */
async function checkCommunityVisualPolish(page, { baseURL = 'http://127.0.0.1:4173', screenshotDir } = {}) {
  let checks = 0
  const errors = []
  const warnings = []
  const onError = (error) => errors.push(String(error))
  const onConsole = (message) => { if (message.type() === 'error') errors.push(message.text()); if (message.type() === 'warning') warnings.push(message.text()) }
  page.on('pageerror', onError); page.on('console', onConsole)
  const check = (value, message) => { if (!value) throw new Error(message); checks += 1 }
  const nav = () => page.getByRole('navigation', { name: 'Secciones de comunidad' })
  const mine = () => nav().getByRole('button', { name: 'Logros', exact: true })
  const expand = async () => { const toggle = page.getByRole('button', { name: /^Ver catálogo completo/ }); if (await toggle.count()) await toggle.click() }
  const collection = () => page.getByRole('region', { name: 'Insignias conseguidas de Alex', exact: true })
  const transform = (locator) => locator.evaluate((element) => getComputedStyle(element).transform)
  const snap = async (name, locator, preservePointer = false) => {
    if (!screenshotDir) return
    await page.evaluate(() => document.fonts.ready)
    if (!preservePointer) await page.mouse.move(1, 1)
    await page.waitForTimeout(250)
    if (locator) {
      const componentCrop = /insignias|deshabilitado/.test(name)
      const viewport = page.viewportSize()
      // Fit the whole component in the capture viewport; avoid clipped sticky headers
      // and browser stitching offsets for elements taller than the mobile viewport.
      if (componentCrop) {
        const bounds = await locator.boundingBox()
        await page.setViewportSize({ width: viewport.width, height: Math.max(viewport.height, Math.ceil(bounds.height) + 200) })
      }
      try { await locator.screenshot({ path: `${screenshotDir}/${name}.png`, style: componentCrop ? 'header[class*="topbar"] { visibility: hidden !important; }' : undefined }) }
      finally { if (componentCrop) await page.setViewportSize(viewport) }
    } else { await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: `${screenshotDir}/${name}.png` }) }
  }
  try {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${baseURL}/community`)
    await mine().click(); await expand()
    check(await collection().getByRole('article').count() === 0, 'Los prototipos no conceden insignias')
    check(await page.locator('[data-illustrated] img').count() === 2, 'Solo dos ilustraciones originales en el catálogo')
    check(await page.locator('[data-illustrated] img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0 && image.alt === '')), 'SVG locales cargados, decorativos junto a texto accesible')
    check(await nav().getByRole('button').allTextContents().then((labels) => labels.join('|') === 'Inicio|Logros|Galería|Retos'), 'Cuatro secciones, sin alterar navegación')
    check(await page.locator('.lucide').count() > 0, 'Iconos Lucide importados correctamente en producción')
    const card = page.locator('#badge-catalog-grid [data-badge-id="first-answer"]')
    await page.waitForLoadState('networkidle')
    await card.hover()
    await page.waitForFunction(() => Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('#badge-catalog-grid [data-badge-id="first-answer"]')).transform).m42 + 3) < .01)
    check(await card.evaluate((el) => Math.abs(new DOMMatrix(getComputedStyle(el).transform).m42 + 3) < .01), 'Tarjeta se eleva tres píxeles al pasar el puntero')
    await snap('despues-catalogo-hover', card, true)
    await page.mouse.move(1, 1)
    await page.waitForFunction(() => Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('#badge-catalog-grid [data-badge-id="first-answer"]')).transform).m42) < .01)
    check(await card.evaluate((el) => Math.abs(new DOMMatrix(getComputedStyle(el).transform).m42) < .01), 'Tarjeta regresa a reposo')
    const themeButton = page.getByRole('button', { name: 'Modo claro', exact: true })
    await themeButton.hover(); await page.mouse.down()
    await page.waitForFunction(() => Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('[aria-label="Modo claro"]')).transform).m11 - .97) < .001)
    const pressed = await transform(themeButton)
    check(pressed !== 'none' && pressed.includes('0.97'), 'Botón tiene respuesta de presión')
    await snap('despues-boton-presionado', themeButton, true)
    await page.mouse.up(); await page.mouse.move(1, 1)
    await page.waitForFunction(() => Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('[aria-label="Modo claro"]')).transform).m11 - 1) < .001)
    check(await themeButton.evaluate((el) => Math.abs(new DOMMatrix(getComputedStyle(el).transform).m11 - 1) < .001), 'Botón vuelve al tamaño original')
    await themeButton.focus(); await page.keyboard.press('Tab')
    const darkButton = page.getByRole('button', { name: 'Modo oscuro', exact: true })
    check(await darkButton.evaluate((el) => el === document.activeElement && el.matches(':focus-visible') && getComputedStyle(el).outlineStyle !== 'none'), 'Tab muestra foco visible')
    await page.keyboard.press('Enter')
    check(await page.locator('[data-theme]').getAttribute('data-theme') === 'dark', 'Tema se activa por teclado')
    await snap('despues-foco-teclado', page.locator('header').first())
    await page.reload(); await mine().click()
    check(await page.locator('[data-theme]').getAttribute('data-theme') === 'dark', 'Preferencia de tema persiste al recargar')
    for (const width of [1440, 375, 320]) {
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 812 })
      for (const theme of ['claro', 'oscuro']) {
        await page.getByRole('button', { name: `Modo ${theme}`, exact: true }).click()
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Sin overflow: ${width}/${theme}`)
        await snap(`despues-${width}-${theme}-cabecera`)
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload(); await mine().click(); await expand()
    await page.setViewportSize({ width: 1440, height: 900 })
    await card.hover(); await page.waitForTimeout(250)
    check(await transform(card) === 'none', 'Movimiento reducido desactiva elevación')
    await themeButton.hover(); await page.mouse.down(); await page.waitForTimeout(250)
    check(await transform(themeButton) === 'none', 'Movimiento reducido desactiva presión')
    await page.mouse.up()
    check(await page.getByRole('complementary', { name: 'Insignia para solicitar', exact: true }).locator('[class*="previewState"]').evaluate((el) => getComputedStyle(el).opacity === '1'), 'Contenido contextual sigue visible con movimiento reducido')
    await snap('despues-movimiento-reducido', card)
    await page.getByRole('button', { name: 'Modo claro', exact: true }).click()
    await snap('despues-catalogo-claro', page.locator('#badge-catalog'))
    await nav().getByRole('button', { name: 'Retos', exact: true }).click()
    for (const [day, answer] of [['day-1', 'You’re welcome!'], ['day-2', 'go'], ['day-3', 'Give it a try']]) {
      const demo = page.locator('#community-demo-controls')
      if (await demo.getAttribute('open') === null) await demo.locator('summary').click()
      await page.getByLabel('Cambiar día · Solo demo', { exact: true }).selectOption(day)
      await demo.locator('summary').click()
      const quiz = page.getByRole('region', { name: 'Reto del día compartido', exact: true })
      await quiz.getByRole('radio', { name: answer, exact: true }).check()
      await quiz.getByRole('button', { name: '¡Comprobar!', exact: true }).click()
    }
    await mine().click()
    check(await collection().getByRole('article').count() === 2 && await collection().locator('[data-illustrated] img').count() === 2, 'Solo intentos reales muestran ambas insignias conseguidas, sin duplicados')
    check(await page.getByText('35 puntos de Retos', { exact: true }).count() === 1, 'Se conserva la puntuación original, también al fallar')
    for (const width of [1440, 375, 320]) {
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 812 })
      for (const theme of ['claro', 'oscuro']) {
        await page.getByRole('button', { name: `Modo ${theme}`, exact: true }).click()
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Colección sin overflow: ${width}/${theme}`)
        await snap(width === 1440 ? `despues-insignias-${theme}` : `despues-insignias-${width}-${theme}`, page.locator('#my-badge-collection'))
      }
    }
    const demo = page.locator('#community-demo-controls')
    await demo.locator('summary').click()
    await page.getByLabel('Vista demo', { exact: true }).selectOption('moderator'); await demo.locator('summary').click()
    const disabled = collection().getByRole('button', { name: /Compartir mi logro/ }).first()
    check(await disabled.isDisabled(), 'Estado disabled conserva protección de rol demo')
    await disabled.hover({ force: true }); await page.mouse.down(); await page.waitForTimeout(200)
    check(await transform(disabled) === 'none', 'Botón disabled no se anima ni activa')
    await page.mouse.up()
    await snap('despues-boton-deshabilitado', collection())
    check(errors.length === 0, `Sin errores de consola o importación: ${errors.join('; ')}`)
    return { checks, errors, warnings, status: 'correcto', baseURL }
  } finally { page.off('pageerror', onError); page.off('console', onConsole) }
}
