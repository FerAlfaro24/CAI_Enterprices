/** Function input for the existing isolated Brave Playwright tool; no new packages.
 * Build + preview on 4173 first. Optional screenshotDir is an absolute local directory.
 */
async function checkCommunityHomePremium(page, { baseURL = 'http://127.0.0.1:4173', emptyFixtureURL = 'http://127.0.0.1:5173', screenshotDir, captureMatrix = true } = {}) {
  const checks = []
  const errors = []
  const warnings = []
  const check = (value, message) => { if (!value) throw new Error(message); checks.push(message) }
  const onError = (error) => errors.push(String(error))
  const onConsole = (message) => {
    if (message.type() === 'error') errors.push(message.text())
    if (message.type() === 'warning') warnings.push(message.text())
  }
  page.on('pageerror', onError)
  page.on('console', onConsole)
  const nav = () => page.getByRole('navigation', { name: 'Secciones de comunidad' })
  const hero = () => page.getByRole('region', { name: 'Lo que nos conecta', exact: true })
  const carousel = () => page.locator('[aria-roledescription="carrusel"]')
  const feed = () => page.locator('[aria-label="Feed de publicaciones ficticias"]')
  const first = () => page.locator('#editorial-luna-conversation')
  const firstTitle = 'Hoy hablé cinco minutos sin traducir todo en mi cabeza'
  const demo = () => page.locator('#community-demo-controls')
  const setMode = async (mode) => {
    if (await demo().getAttribute('open') === null) await demo().locator('summary').click()
    await page.getByLabel('Vista demo', { exact: true }).selectOption(mode)
    await demo().locator('summary').click()
  }
  const snap = async (name, target) => {
    if (!screenshotDir) return
    const viewport = page.viewportSize()
    await page.mouse.move(1, 1)
    await page.evaluate(() => document.fonts.ready)
    if (target) await target.screenshot({ path: `${screenshotDir}/${name}.png` })
    else {
      // A real scroll activates off-screen lazy media before a full-document
      // capture; captureBeyondViewport alone does not load those photos.
      for (const image of await feed().getByRole('img').all()) {
        await image.scrollIntoViewIfNeeded()
        await image.evaluate((img) => img.decode())
      }
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
      // Preserve the native gutter while Chromium paints the full document, so
      // a capture never widens the layout and crops its right margin afterward.
      await page.screenshot({ path: `${screenshotDir}/${name}.png`, fullPage: true, style: 'html { scrollbar-gutter: stable !important; }' })
    }
    // Chromium on Windows can retain a scrollbar-free layout after a full-page
    // capture until the next resize/re-render. Restore the real test viewport;
    // otherwise the next slide's height is compared at a different content width.
    await page.setViewportSize({ width: viewport.width + 1, height: viewport.height })
    await page.setViewportSize(viewport)
  }
  try {
    await page.bringToFront()
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`${baseURL}/community`)
    await page.evaluate(() => document.fonts.ready)
    check((await nav().getByRole('button').allTextContents()).join('|') === 'Inicio|Logros|Galería|Retos', 'Cuatro enlaces principales intactos')
    check(await page.locator('.lucide').count() > 0, 'Lucide sigue activo')
    const matrix = []
    for (const width of [1440, 1024, 768, 375, 320]) {
      await page.setViewportSize({ width, height: width > 768 ? 1000 : 812 })
      for (const theme of ['claro', 'oscuro']) {
        await page.getByRole('button', { name: `Modo ${theme}`, exact: true }).click()
        const heights = []
        for (let index = 1; index <= 3; index += 1) {
          await page.getByRole('button', { name: new RegExp(`^Diapositiva ${index}:`) }).click()
          const img = hero().getByRole('img')
          await img.evaluate((image) => image.decode())
          await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
          check(await img.evaluate((image) => image.naturalWidth > 0 && image.alt.length > 10), `${width}/${theme}/${index}: ilustración local cargada con alt`)
          check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}/${theme}/${index}: sin desbordamiento horizontal`)
          const bounds = await hero().boundingBox()
          heights.push(bounds.height)
          const geometry = await page.locator('[class*="slideCaption"]').evaluate((caption) => {
            const box = caption.getBoundingClientRect()
            return [...caption.children].every((child) => child.getBoundingClientRect().bottom <= box.bottom + 1)
          })
          check(geometry, `${width}/${theme}/${index}: texto dentro de su cartela`)
        }
        check(Math.max(...heights) - Math.min(...heights) < 1, `${width}/${theme}: carrusel sin cambios de altura (${heights.join(', ')})`)
        await page.getByRole('button', { name: /^Diapositiva 1:/ }).click()
        if (captureMatrix) await snap(`despues-${width}-${theme}`)
        matrix.push({ width, theme, heroHeight: heights[0], overflow: false })
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.getByRole('button', { name: 'Modo claro', exact: true }).click()
    check(await page.getByRole('button', { name: 'Activar avance automático', exact: true }).isDisabled(), 'Movimiento reducido desactiva el autoavance')
    await page.getByRole('button', { name: 'Diapositiva anterior', exact: true }).click()
    check(await carousel().getAttribute('data-slide') === 'celebrate', 'Anterior navega circularmente')
    await snap('despues-hero-celebrar', hero())
    await page.getByRole('button', { name: /^Diapositiva 2:/ }).click()
    await snap('despues-hero-practicar', hero())

    await page.getByRole('button', { name: 'Explorar el feed', exact: true }).click()
    check(await page.locator('#home-feed-title').evaluate((el) => document.activeElement === el), 'CTA del hero desplaza y enfoca el feed')
    const filters = page.getByRole('group', { name: 'Filtrar publicaciones', exact: true })
    await filters.getByRole('button', { name: 'Fotos', exact: true }).click()
    check(await filters.getByRole('button', { name: 'Fotos', exact: true }).getAttribute('aria-pressed') === 'true', 'Filtro Fotos anuncia selección')
    check(await feed().getByRole('article').evaluateAll((cards) => cards.every((card) => card.querySelector('img'))), 'Fotos muestra historias con imágenes')
    await filters.getByRole('button', { name: 'Logros', exact: true }).click()
    check(await feed().getByRole('article').evaluateAll((cards) => cards.every((card) => card.dataset.category === 'achievement')), 'Filtro Logros conserva categorías originales')
    await filters.locator('summary').click()
    await filters.locator('summary').press('Escape')
    check(await filters.locator('summary').evaluate((el) => document.activeElement === el && !el.parentElement.open), 'Escape cierra Más y conserva foco')
    await filters.locator('summary').click()
    await filters.getByRole('button', { name: 'Más celebradas', exact: true }).click()
    check(await first().count() === 1, 'Más celebradas mantiene el orden por reacciones')
    await filters.getByRole('button', { name: 'Recientes', exact: true }).click()
    check(await feed().getByRole('article').count() === 3, 'Tres historias iniciales')
    await page.getByRole('button', { name: /^Ver más historias/ }).click()
    check(await feed().getByRole('article').count() === 7, 'Revelado progresivo añade cuatro historias')
    await page.waitForFunction(() => document.activeElement === document.querySelector('#editorial-sam-introduction h3 button'))
    check(await page.locator('#editorial-sam-introduction h3 button').evaluate((el) => document.activeElement === el), 'La primera historia revelada recibe el foco')
    await page.getByRole('button', { name: /^Ver más historias/ }).click()
    await page.getByRole('button', { name: /^Ver más historias/ }).click()
    check(await feed().getByRole('article').count() === 13, 'Trece historias originales accesibles')
    check(await feed().locator('[data-institution]').count() === 2, 'Tratamiento institucional vinculado al autor original')

    const total = () => first().locator('[class*="celebrationCount"]').innerText()
    const react = async (label) => {
      await first().locator('[class*="reactButton"]').click()
      const options = first().getByRole('group', { name: `Reacciones a ${firstTitle}`, exact: true })
      check(await options.getByRole('button').count() === 5, 'Cinco reacciones originales disponibles')
      await options.getByRole('button', { name: new RegExp(`^${label}:`) }).click()
    }
    check((await total()).includes('86'), 'Total inicial de Luna: 86')
    await react('Me encanta')
    check((await total()).includes('87'), 'Añadir reacción actualiza total a 87')
    await react('Bien hecho')
    check((await total()).includes('87'), 'Cambiar reacción conserva total 87')
    await react('Bien hecho')
    check((await total()).includes('86'), 'Retirar reacción restaura total 86')
    await first().getByRole('button', { name: `Ver 4 comentarios de ${firstTitle}`, exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'La historia completa', exact: true })
    await dialog.getByRole('textbox', { name: 'Comenta como Alex Demo', exact: true }).fill('Un comentario ficticio para acompañar este avance.')
    await dialog.getByRole('button', { name: 'Comentar', exact: true }).click()
    check(await dialog.getByText('Un comentario ficticio para acompañar este avance.', { exact: true }).count() === 1, 'Comentario añadido con identidad demo')
    await snap('despues-conversacion', dialog)
    await dialog.getByRole('button', { name: 'Cerrar publicación', exact: true }).focus()
    await page.keyboard.press('Shift+Tab')
    check(await dialog.evaluate((el) => el.contains(document.activeElement)), 'Tab inverso permanece dentro del diálogo')
    await dialog.getByRole('button', { name: 'Ver perfil de Luna Azul', exact: true }).first().click()
    await page.waitForFunction(() => document.querySelectorAll('dialog[open]').length === 2)
    check(await page.locator('dialog[open]').count() === 2, 'Perfil abre sobre la historia')
    await page.keyboard.press('Escape')
    check(await page.locator('dialog[open]').count() === 1, 'Escape cierra solo el perfil superior')
    await page.keyboard.press('Escape')
    check(await first().getByRole('button', { name: `Ver 5 comentarios de ${firstTitle}`, exact: true }).evaluate((el) => document.activeElement === el), 'Cierre actualiza contador a 5 y devuelve foco')
    const notice = page.getByRole('region', { name: 'Avisos fijados por CAI', exact: true })
    const previousNotice = await notice.locator('h2').innerText()
    await notice.getByRole('button', { name: 'Siguiente aviso fijado', exact: true }).click()
    check(await notice.locator('h2').innerText() !== previousNotice, 'Siguiente aviso conserva rotación manual')

    await page.getByRole('button', { name: 'Compartir algo', exact: true }).click()
    const composer = page.getByRole('dialog')
    await composer.getByRole('textbox', { name: 'Título', exact: true }).fill('Una foto ficticia para validar Inicio')
    await composer.getByRole('textbox', { name: 'Tu historia de muestra', exact: true }).fill('Una experiencia de prueba con una imagen ilustrativa de la biblioteca existente.')
    await composer.getByLabel('Categoría', { exact: true }).selectOption('gallery')
    await composer.getByRole('checkbox', { name: 'Biblioteca', exact: true }).check()
    await composer.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()
    check(await feed().getByText('Una foto ficticia para validar Inicio', { exact: true }).count() === 0, 'Pendiente no aparece públicamente')
    await setMode('moderator')
    const review = page.getByRole('article', { name: 'Revisar Una foto ficticia para validar Inicio', exact: true })
    await review.getByRole('button', { name: 'Aprobar', exact: true }).click()
    check(await feed().getByRole('heading', { name: 'Una foto ficticia para validar Inicio', exact: true }).count() === 1, 'Aprobación publica en el feed original')
    const published = feed().getByRole('article').filter({ has: page.getByRole('heading', { name: 'Una foto ficticia para validar Inicio', exact: true }) })
    check(await published.getByRole('button', { name: 'Alex Demo', exact: true }).count() === 1, 'Moderación conserva autor Alex Demo')
    await setMode('student')
    await snap('despues-publicacion-aprobada', published)
    await nav().getByRole('button', { name: 'Galería', exact: true }).click()
    check(await page.locator('[aria-label="Álbumes de la comunidad"] article').count() === 7, 'La publicación aprobada deriva el séptimo álbum')
    await nav().getByRole('button', { name: 'Inicio', exact: true }).click()
    await demo().locator('summary').click()
    await page.getByRole('button', { name: 'Reiniciar demo', exact: true }).click()
    await demo().locator('summary').click()
    check(await feed().getByRole('article').count() === 3 && (await total()).includes('86'), 'Reinicio restaura historias y reacciones')

    // Every shipped filter has fixture content. An isolated test page intercepts only
    // the dev fixture module to supply empty arrays before the provider initializes.
    // No source, permissions, reducer or production bundle is changed for this scenario.
    const emptyPage = await page.context().newPage()
    try {
      await emptyPage.emulateMedia({ reducedMotion: 'reduce' })
      await emptyPage.setViewportSize({ width: 375, height: 812 })
      await emptyPage.route('**/src/features/community/data/fixtures.ts*', async (route) => {
        const response = await route.fetch()
        await route.fulfill({ response, body: `${await response.text()}\nseedPosts.length = 0; pendingPosts.length = 0;\n` })
      })
      await emptyPage.goto(`${emptyFixtureURL}/community`)
      const emptyHeading = emptyPage.getByRole('heading', { name: 'Una nueva historia empieza contigo.', exact: true })
      await emptyHeading.waitFor()
      check(await emptyPage.locator('[aria-label="Feed de publicaciones ficticias"] article').count() === 0, 'Fixture de prueba vacío muestra invitación sin historias inventadas')
      if (screenshotDir) await emptyHeading.locator('..').screenshot({ path: `${screenshotDir}/despues-estado-vacio.png` })
      await emptyHeading.locator('..').getByRole('button', { name: 'Compartir algo', exact: true }).click()
      check(await emptyPage.getByRole('dialog').count() === 1, 'El estado vacío permite abrir el compositor')
    } finally { await emptyPage.close(); await page.bringToFront() }

    // A failed hero asset must keep its slot, controls and readable text.
    const errorsBeforeFallback = errors.length
    await page.route('**/assets/together-*.svg', (route) => route.abort())
    await page.reload()
    await page.getByRole('button', { name: /^Diapositiva 1:/ }).click()
    check(await hero().getByText('Ilustración no disponible', { exact: true }).count() === 1, 'Recurso fallido muestra fallback sin quitar el carrusel')
    await snap('despues-fallback-hero', hero())
    await page.unroute('**/assets/together-*.svg')
    // The intentional aborted request may log a browser network error; isolate it from product errors.
    const fallbackErrors = errors.splice(errorsBeforeFallback)
    errors.push(...fallbackErrors.filter((error) => !error.includes('net::ERR_FAILED')))
    await page.reload()
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.getByRole('button', { name: /^Diapositiva 1:/ }).click()
    await page.getByRole('button', { name: 'Activar avance automático', exact: true }).click()
    await page.locator('h1').focus()
    await page.mouse.move(1, 1)
    await page.waitForTimeout(8200)
    check(await carousel().getAttribute('data-slide') === 'moments', 'Foco dentro del hero pausa autoavance')
    await nav().getByRole('button', { name: 'Inicio', exact: true }).focus()
    await page.waitForFunction(() => document.querySelector('[aria-roledescription="carrusel"]').dataset.slide !== 'moments', null, { timeout: 10000 })
    check(await carousel().getAttribute('data-slide') === 'practice', 'Sin foco ni hover avanza después de ocho segundos')
    await page.getByRole('button', { name: 'Pausar avance automático', exact: true }).click()
    await nav().getByRole('button', { name: 'Inicio', exact: true }).focus()
    await page.mouse.move(1, 1)
    await page.waitForTimeout(8200)
    check(await carousel().getAttribute('data-slide') === 'practice', 'Pausa explícita evita nuevos avances')
    await page.getByRole('button', { name: 'Modo oscuro', exact: true }).click()
    await page.reload()
    check(await page.locator('[data-theme]').getAttribute('data-theme') === 'dark', 'Tema oscuro persiste tras recarga')
    check(errors.length === 0, `Sin errores inesperados de consola o ejecución: ${errors.join('; ')}`)
    return { status: 'correcto', checks: checks.length, details: checks, matrix, errors, warnings, baseURL }
  } finally {
    await page.unroute('**/assets/together-*.svg')
    page.off('pageerror', onError)
    page.off('console', onConsole)
  }
}
