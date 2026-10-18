/** Function input for the isolated Brave browser_run_code_unsafe tool.
 * Build + preview on 4173. Optional screenshotDir stores local review evidence.
 * before accepts the recorded pre-change metrics; no local evidence is required.
 */
async function checkCommunityGalleryPremium(page, { baseURL = 'http://127.0.0.1:4173', screenshotDir, before = [] } = {}) {
  const details = [], errors = [], warnings = [], metrics = []
  const check = (value, label) => { if (!value) throw new Error(label); details.push(label) }
  const onError = (error) => errors.push(String(error))
  const onConsole = (message) => {
    if (message.type() === 'error') errors.push(message.text())
    if (message.type() === 'warning') warnings.push(message.text())
  }
  const nav = () => page.getByRole('navigation', { name: 'Secciones de comunidad' })
  const mosaic = () => page.locator('[aria-label="Álbumes de la comunidad"]')
  const filters = () => page.getByRole('group', { name: 'Filtrar álbumes', exact: true })
  const title = 'Tres rincones, una semana de pequeñas prácticas'
  const trigger = () => mosaic().getByRole('button', { name: `Explorar álbum: ${title}`, exact: true })
  const dialog = () => page.getByRole('dialog', { name: title, exact: true })
  const stage = () => dialog().getByRole('group', { name: 'Fotografías del álbum', exact: true })
  const settleImages = async (root) => {
    for (const image of await root.locator('img').all()) {
      await image.scrollIntoViewIfNeeded()
      await image.evaluate((img) => img.decode())
    }
  }
  const snap = async (name, target, testPage = page) => {
    if (!screenshotDir) return
    await testPage.mouse.move(1, 1)
    const viewport = testPage.viewportSize()
    if (target) await target.screenshot({ path: `${screenshotDir}/${name}.png` })
    else {
      await testPage.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
      await testPage.screenshot({ path: `${screenshotDir}/${name}.png`, fullPage: true, style: 'html { scrollbar-gutter: stable !important; }' })
    }
    await testPage.setViewportSize({ width: viewport.width + 1, height: viewport.height })
    await testPage.setViewportSize(viewport)
  }
  const sameStage = async (previous, label) => {
    const next = await stage().boundingBox()
    check(['x', 'y', 'width', 'height'].every((key) => Math.abs(previous[key] - next[key]) < 1), label)
  }
  const openGallery = async (target) => {
    await target.goto(`${baseURL}/community`)
    await target.getByRole('navigation', { name: 'Secciones de comunidad' }).getByRole('button', { name: 'Galería', exact: true }).click()
    await target.evaluate(() => document.fonts.ready)
  }
  page.on('pageerror', onError)
  page.on('console', onConsole)
  try {
    await page.bringToFront()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1440, height: 1000 })
    await openGallery(page)
    const originalOrder = await mosaic().getByRole('article').evaluateAll((cards) => cards.map((card) => card.getAttribute('aria-label')))
    check(originalOrder.length === 6 && originalOrder[0].includes('café de conversación'), 'Seis álbumes reales en el orden editorial original')
    for (const width of [1440, 1024, 768, 375, 320]) {
      await page.setViewportSize({ width, height: width > 768 ? 1000 : 812 })
      for (const theme of ['claro', 'oscuro']) {
        await page.getByRole('button', { name: `Modo ${theme}`, exact: true }).click()
        await settleImages(mosaic())
        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
        const result = await page.evaluate(() => {
          const grid = document.querySelector('[aria-label="Álbumes de la comunidad"]')
          const cards = [...grid.querySelectorAll('article')]
          const inside = (child, parent) => {
            const a = child.getBoundingClientRect(), b = parent.getBoundingClientRect()
            return a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1
          }
          const featured = document.querySelector('[class*="featuredCopy"]').parentElement
          return {
            width: innerWidth, theme: document.querySelector('[data-theme]').dataset.theme,
            height: document.documentElement.scrollHeight, albumsTop: grid.getBoundingClientRect().top + scrollY,
            featuredHeight: featured.getBoundingClientRect().height,
            overflow: document.documentElement.scrollWidth > innerWidth,
            titlesFit: cards.every((card) => [...card.querySelector('[class*="albumBody"]').children].every((child) => inside(child, card.querySelector('button')))),
            flagsFit: [...grid.querySelectorAll('[class*="coverFlag"]')].every((flag) => flag.scrollHeight <= flag.clientHeight && flag.scrollWidth <= flag.clientWidth),
            artworkComplete: [...grid.querySelectorAll('[data-cover-kind="artwork"] > img')].every((img) => img.naturalWidth === 600 && getComputedStyle(img).objectFit === 'contain'),
            photoCovers: [...grid.querySelectorAll('[data-cover-kind="photo"] img')].map((img) => img.src),
            artworkCount: grid.querySelectorAll('[data-cover-kind="artwork"]').length,
            layouts: new Set(cards.map((card) => Math.round(card.getBoundingClientRect().height))).size,
            targets: [...featured.querySelectorAll('button'), ...document.querySelector('[aria-label="Filtrar álbumes"]').querySelectorAll('button')].every((button) => button.getBoundingClientRect().height >= 44),
          }
        })
        metrics.push(result)
        check(!result.overflow, `${width}/${theme}: sin overflow horizontal`)
        check(result.titlesFit && result.flagsFit, `${width}/${theme}: títulos, metadatos y créditos completos`)
        check(result.artworkComplete && result.artworkCount === 4, `${width}/${theme}: cuatro portadas SVG originales íntegras`)
        check(result.photoCovers.length === 2 && new Set(result.photoCovers).size === 2, `${width}/${theme}: dos portadas fotográficas distintas, sin copias para llenar el mosaico`)
        check(result.layouts >= 3 && result.targets, `${width}/${theme}: ritmo de proporciones y controles táctiles`)
        check(JSON.stringify(await mosaic().getByRole('article').evaluateAll((cards) => cards.map((card) => card.getAttribute('aria-label')))) === JSON.stringify(originalOrder), `${width}/${theme}: orden y datos conservados`)
        const previous = before.find((item) => item.width === width && item.theme === result.theme)
        if (previous && width <= 375) check(result.height < previous.height && result.albumsTop < previous.albumsTop && result.featuredHeight < previous.featuredHeight, `${width}/${theme}: álbumes más próximos y recorrido móvil menor`)
        await snap(`despues-${width}-${theme}`)
        if (width === 1440 && theme === 'claro') {
          await snap('destacado', page.getByRole('region', { name: 'El día que nadie se quedó callado.', exact: true }))
          await snap('portadas-originales', mosaic())
        }
        await trigger().click()
        await settleImages(dialog())
        await dialog().evaluate((element) => { element.scrollTop = 0 })
        const bounds = await stage().boundingBox()
        await stage().press('ArrowRight')
        check(await dialog().getByRole('status').innerText() === 'Foto 2 de 3', `${width}/${theme}: flechas de teclado y posición anunciada`)
        await stage().locator('img').evaluate((img) => img.decode())
        await sameStage(bounds, `${width}/${theme}: imagen sin saltos al navegar`)
        check(await dialog().evaluate((element) => element.scrollWidth <= element.clientWidth), `${width}/${theme}: visor sin desbordamiento horizontal`)
        check(await stage().locator('img').evaluate((img) => getComputedStyle(img).objectFit === 'contain'), `${width}/${theme}: fotografía completa en el visor`)
        await dialog().getByRole('button', { name: /^Ver foto 3:/ }).click()
        check(await dialog().getByRole('status').innerText() === 'Foto 3 de 3', `${width}/${theme}: miniatura selecciona la tercera foto`)
        await dialog().evaluate((element) => { element.scrollTop = 0 })
        if (width === 1440 || width === 375 || width === 320) await snap(`visor-${width}-${theme}`, dialog())
        if (width === 1440 && theme === 'claro') {
          await dialog().getByRole('button', { name: 'Vale Vocab', exact: true }).click()
          check(await page.getByRole('dialog', { name: 'Vale Vocab', exact: true }).count() === 1 && await page.locator('dialog[open]').count() === 2, 'Perfil relacionado abre sobre el álbum')
          await page.keyboard.press('Escape')
          check(await dialog().getByRole('button', { name: 'Vale Vocab', exact: true }).evaluate((element) => element === document.activeElement), 'Cerrar perfil restaura foco y conserva álbum abierto')
        }
        await page.keyboard.press('Escape')
        check(await trigger().evaluate((element) => element === document.activeElement), `${width}/${theme}: Escape devuelve el foco al álbum`)
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.getByRole('button', { name: 'Modo claro', exact: true }).click()
    for (const category of ['Actividades', 'Eventos', 'Logros', 'Detrás de cámaras']) {
      await filters().getByRole('button', { name: category, exact: true }).click()
      check(await filters().getByRole('button', { name: category, exact: true }).getAttribute('aria-pressed') === 'true', `${category}: filtro anuncia selección`)
      if (category === 'Logros' || category === 'Detrás de cámaras') check(await page.getByRole('heading', { name: 'Aquí todavía hay momentos por guardar.', exact: true }).isVisible(), `${category}: vacío honesto`)
      else await settleImages(mosaic())
      await snap(`filtro-${category === 'Detrás de cámaras' ? 'backstage' : category.toLowerCase()}`)
    }
    await page.getByRole('button', { name: 'Ver todas las fotos', exact: true }).click()
    await page.getByRole('button', { name: 'Compartir foto', exact: true }).click()
    const composer = page.getByRole('dialog', { name: 'Comparte un pequeño paso', exact: true })
    await composer.getByLabel('Título', { exact: true }).fill('Un nuevo recuerdo de muestra')
    await composer.getByLabel('Tu historia de muestra', { exact: true }).fill('Dos fotografías ilustrativas para verificar el flujo original de publicación y su álbum derivado.')
    await composer.getByRole('checkbox').nth(0).check()
    await composer.getByRole('checkbox').nth(1).check()
    await composer.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()
    check(await mosaic().getByRole('article').count() === 6, 'Álbum pendiente permanece fuera de la colección pública')
    await snap('envio-pendiente')
    const demo = page.locator('#community-demo-controls')
    await demo.locator('summary').click()
    await page.getByLabel('Vista demo', { exact: true }).selectOption('moderator')
    await demo.locator('summary').click()
    await page.getByRole('article', { name: 'Revisar Un nuevo recuerdo de muestra', exact: true }).getByRole('button', { name: 'Aprobar', exact: true }).click()
    await page.getByLabel('Orden de álbumes', { exact: true }).selectOption('recent')
    const newCard = mosaic().getByRole('article', { name: 'Un nuevo recuerdo de muestra', exact: true })
    check(await mosaic().getByRole('article').count() === 7 && await newCard.locator('[data-cover-kind="photo"]').count() === 1, 'Nuevo álbum aprobado deriva su propia portada de la publicación')
    await settleImages(mosaic())
    await snap('album-nuevo-aprobado')
    await newCard.getByRole('button').click()
    const newDialog = page.getByRole('dialog', { name: 'Un nuevo recuerdo de muestra', exact: true })
    check(await newDialog.getByRole('status').innerText() === 'Foto 1 de 2' && await newDialog.getByRole('button', { name: 'Alex Demo', exact: true }).count() === 1, 'Nuevo álbum mantiene dos fotos y autor Alex')
    await settleImages(newDialog)
    await snap('visor-album-nuevo', newDialog)
    await page.keyboard.press('Escape')
    await demo.locator('summary').click()
    await page.getByRole('button', { name: 'Reiniciar demo', exact: true }).click()
    await demo.locator('summary').click()
    await nav().getByRole('button', { name: 'Galería', exact: true }).click()
    check(await mosaic().getByRole('article').count() === 6, 'Reinicio restaura la colección inicial')

    await page.emulateMedia({ reducedMotion: 'no-preference' })
    const card = mosaic().getByRole('article').first()
    await card.hover()
    await page.waitForFunction(() => Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('[aria-label="Álbumes de la comunidad"] article')).transform).m42 + 3) < .1)
    check(await card.evaluate((element) => Math.abs(new DOMMatrix(getComputedStyle(element).transform).m42 + 3) < .1), 'Elevación deliberada de 3 px con movimiento normal')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    check(await card.evaluate((element) => getComputedStyle(element).transform === 'none'), 'Movimiento reducido en vivo elimina la elevación')
    await card.getByRole('button').focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    check(await card.getByRole('button').evaluate((element) => element === document.activeElement && element.matches(':focus-visible') && parseFloat(getComputedStyle(element).outlineWidth) >= 3), 'Portada conserva foco visible al navegar con teclado')

    // Isolated network fixtures exercise genuine loading/error states; no source
    // files, reducer rules or production entry points are changed for these cases.
    const loadingPage = await page.context().newPage()
    let release
    const gate = new Promise((resolve) => { release = resolve })
    try {
      await loadingPage.bringToFront()
      await loadingPage.setViewportSize({ width: 375, height: 812 })
      await loadingPage.emulateMedia({ reducedMotion: 'reduce' })
      await loadingPage.route('**/photo-1516321318423-f06f85e504b3*', async (route) => { await gate; await route.continue() })
      await openGallery(loadingPage)
      await loadingPage.getByRole('button', { name: `Explorar álbum: ${title}`, exact: true }).click()
      const loadingDialog = loadingPage.getByRole('dialog', { name: title, exact: true })
      const loadingStage = loadingDialog.getByRole('group', { name: 'Fotografías del álbum', exact: true })
      check(await loadingStage.locator('[data-image-state="loading"]').count() === 1, 'Petición retenida muestra estado de carga real')
      const oldBounds = await loadingStage.boundingBox()
      await snap('visor-cargando', loadingDialog, loadingPage)
      release()
      await loadingStage.locator('[data-image-state="ready"]').waitFor()
      const readyBounds = await loadingStage.boundingBox()
      check(oldBounds.height === readyBounds.height && oldBounds.width === readyBounds.width, 'Completar la carga no cambia el tamaño de imagen')
    } finally { release(); await loadingPage.close(); await page.bringToFront() }

    const failedPage = await page.context().newPage()
    const fixtureErrors = []
    failedPage.on('pageerror', (error) => fixtureErrors.push(String(error)))
    failedPage.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('net::ERR_FAILED')) fixtureErrors.push(message.text()) })
    try {
      await failedPage.bringToFront()
      await failedPage.setViewportSize({ width: 320, height: 812 })
      await failedPage.emulateMedia({ reducedMotion: 'reduce' })
      await failedPage.route('https://images.unsplash.com/**', (route) => route.abort())
      await failedPage.route('**/assets/speaking-day-*.svg', (route) => route.abort())
      await openGallery(failedPage)
      check(await failedPage.getByText('Ilustración no disponible', { exact: true }).count() === 2, 'Póster fallido conserva portada legible y destacado')
      await snap('poster-no-disponible', undefined, failedPage)
      await failedPage.getByRole('button', { name: `Explorar álbum: ${title}`, exact: true }).click()
      const failedDialog = failedPage.getByRole('dialog', { name: title, exact: true })
      const failedStage = failedDialog.getByRole('group', { name: 'Fotografías del álbum', exact: true })
      await failedStage.locator('[data-image-state="error"]').waitFor()
      check(await failedStage.getByText('Fotografía ilustrativa no disponible', { exact: true }).count() === 1, 'Foto fallida conserva descripción y mensaje de error')
      const oldBounds = await failedStage.boundingBox()
      await snap('visor-error', failedDialog, failedPage)
      await failedDialog.getByRole('button', { name: 'Foto siguiente del álbum', exact: true }).click()
      await failedStage.locator('[data-image-state="error"]').waitFor()
      check((await failedStage.boundingBox()).height === oldBounds.height && await failedDialog.getByRole('status').innerText() === 'Foto 2 de 3', 'Error no bloquea navegación ni altera el marco')
      check(await failedDialog.evaluate((element) => element.scrollWidth <= element.clientWidth) && fixtureErrors.length === 0, 'Visor de error sin overflow ni errores de ejecución')
    } finally { await failedPage.close(); await page.bringToFront() }
    await page.getByRole('button', { name: 'Modo oscuro', exact: true }).click()
    await page.reload()
    check(await page.locator('[data-theme]').getAttribute('data-theme') === 'dark', 'Tema persistente conservado tras recargar')
    check(errors.length === 0 && warnings.length === 0, `Sin errores ni advertencias inesperados: ${errors.join('; ')} ${warnings.join('; ')}`)
    return { status: 'correcto', checks: details.length, details, metrics, errors, warnings }
  } finally {
    page.off('pageerror', onError)
    page.off('console', onConsole)
  }
}
