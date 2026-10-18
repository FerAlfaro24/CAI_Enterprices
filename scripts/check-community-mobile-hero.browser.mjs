/** Run with the isolated Brave browser_run_code_unsafe tool after build + preview.
 * before is the parsed mobile-hero-adjustment/antes.json, when comparing desktop.
 * The existing home-premium regression covers the unchanged social workflows/timers.
 */
async function checkCommunityMobileHero(page, { baseURL = 'http://127.0.0.1:4173', before = [], screenshotDir } = {}) {
  const checks = []
  const errors = []
  const warnings = []
  const metrics = []
  const onError = (error) => errors.push(String(error))
  const onConsole = (message) => {
    if (message.type() === 'error') errors.push(message.text())
    if (message.type() === 'warning') warnings.push(message.text())
  }
  const check = (value, label) => { if (!value) throw new Error(label); checks.push(label) }
  const hero = () => page.getByRole('region', { name: 'Lo que nos conecta', exact: true })
  page.on('pageerror', onError)
  page.on('console', onConsole)
  try {
    await page.bringToFront()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`${baseURL}/community`)
    await page.evaluate(() => document.fonts.ready)
    for (const width of [1440, 1024, 768, 375, 320]) {
      await page.setViewportSize({ width, height: width > 768 ? 1000 : 812 })
      for (const theme of ['claro', 'oscuro']) {
        await page.getByRole('button', { name: `Modo ${theme}`, exact: true }).click()
        const heights = []
        for (let slide = 1; slide <= (width <= 375 ? 3 : 1); slide += 1) {
          await page.getByRole('button', { name: new RegExp(`^Diapositiva ${slide}:`) }).click()
          await hero().getByRole('img').evaluate((image) => image.decode())
          const result = await hero().evaluate((root) => {
            const box = (element) => {
              const rect = element.getBoundingClientRect()
              return { x: rect.x, y: rect.y + scrollY, width: rect.width, height: rect.height, bottom: rect.bottom + scrollY }
            }
            const inside = (child, parent) => {
              const c = child.getBoundingClientRect(), p = parent.getBoundingClientRect()
              return c.left >= p.left - 1 && c.right <= p.right + 1 && c.top >= p.top - 1 && c.bottom <= p.bottom + 1
            }
            const get = (name) => root.querySelector(`[class*="${name}"]`)
            const caption = get('slideCaption')
            const copy = get('heroCopy')
            const controls = [...get('carousel').querySelectorAll('button')]
            const overlap = controls.some((a, index) => controls.slice(index + 1).some((b) => {
              const x = a.getBoundingClientRect(), y = b.getBoundingClientRect()
              return Math.min(x.right, y.right) - Math.max(x.left, y.left) > 1 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 1
            }))
            const ctas = [...get('heroActions').querySelectorAll('button')]
            const textInsideButtons = ctas.every((button) => {
              const range = document.createRange()
              range.selectNode(button.firstChild)
              const rect = button.getBoundingClientRect()
              return [...range.getClientRects()].every((text) => text.left >= rect.left && text.right <= rect.right + 1 && text.top >= rect.top && text.bottom <= rect.bottom + 1)
            })
            return {
              width: innerWidth, theme: document.querySelector('[data-theme]').dataset.theme,
              hero: box(root), h1Font: getComputedStyle(root.querySelector('h1')).fontSize,
              elements: Object.fromEntries(['heroCopy', 'heroEyebrow', 'heroActions', 'heroNote', 'carouselTop', 'slide', 'artwork', 'slideCaption'].map((name) => [name, box(get(name))])),
              feedTop: document.querySelector('#home-feed-title').getBoundingClientRect().top + scrollY,
              cardTop: document.querySelector('#editorial-luna-conversation').getBoundingClientRect().top + scrollY,
              overflow: document.documentElement.scrollWidth > innerWidth,
              captionFits: [...caption.children].every((child) => inside(child, caption)),
              copyFits: [...copy.children].every((child) => inside(child, copy)),
              controlsFit: controls.every((control) => inside(control, root)), overlap, textInsideButtons,
              ctaHeights: ctas.map((button) => button.getBoundingClientRect().height),
              controlHeights: controls.map((control) => control.getBoundingClientRect().height),
              completeImage: get('heroImage').naturalWidth > 0,
              imageFit: getComputedStyle(get('heroImage')).objectFit,
            }
          })
          heights.push(result.hero.height)
          check(!result.overflow, `${width}/${theme}/${slide}: sin overflow horizontal`)
          check(result.captionFits && result.copyFits, `${width}/${theme}/${slide}: textos completos dentro de sus bloques`)
          check(result.controlsFit && !result.overlap && result.textInsideButtons, `${width}/${theme}/${slide}: controles y etiquetas sin superposiciones`)
          check(result.completeImage, `${width}/${theme}/${slide}: ilustración original cargada`)
          const previous = before.find((item) => item.width === width && item.theme === result.theme)
          if (width <= 375) {
            check(result.imageFit === 'contain', `${width}/${theme}/${slide}: SVG íntegro, sin recorte`)
            check(result.ctaHeights.every((height) => height >= 48) && result.controlHeights.every((height) => height >= 44), `${width}/${theme}/${slide}: alturas táctiles conservadas`)
            if (previous) {
              check(result.h1Font === previous.h1Font, `${width}/${theme}/${slide}: tipografía principal del mismo tamaño`)
              check(result.hero.height < previous.hero.height && result.feedTop < previous.feedTop && result.cardTop < previous.cardTop, `${width}/${theme}/${slide}: hero y acceso al contenido social más tempranos`)
            }
          } else if (previous) {
            check(JSON.stringify(result.hero) === JSON.stringify(previous.hero) && result.h1Font === previous.h1Font, `${width}/${theme}: composición general de escritorio/tablet intacta`)
            check(JSON.stringify(result.elements) === JSON.stringify(previous.elements) && result.feedTop === previous.feedTop && result.cardTop === previous.cardTop, `${width}/${theme}: controles y feed de escritorio/tablet intactos`)
          }
          if (slide === 1) metrics.push(result)
        }
        check(Math.max(...heights) - Math.min(...heights) < 1, `${width}/${theme}: altura estable entre escenas`)
        if (width <= 375 && screenshotDir) {
          await page.getByRole('button', { name: /^Diapositiva 1:/ }).click()
          for (const image of await page.locator('[aria-label="Feed de publicaciones ficticias"] img').all()) {
            await image.scrollIntoViewIfNeeded()
            await image.evaluate((img) => img.decode())
          }
          await page.mouse.move(1, 1)
          await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
          await page.screenshot({ path: `${screenshotDir}/despues-${width}-${theme}.png`, fullPage: true, style: 'html { scrollbar-gutter: stable !important; }' })
          await page.setViewportSize({ width: width + 1, height: 812 })
          await page.setViewportSize({ width, height: 812 })
        }
      }
    }
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 })
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.reload()
      await page.getByRole('button', { name: /^Diapositiva 1:/ }).click()
      const play = hero().locator('[class*="playButton"]')
      await play.focus()
      await page.keyboard.press('Enter')
      check(await play.getAttribute('aria-pressed') === 'true', `${width}: reproducción activada por teclado`)
      for (let index = 1; index <= 3; index += 1) {
        await page.keyboard.press('Tab')
        const dot = hero().getByRole('button', { name: new RegExp(`^Diapositiva ${index}:`) })
        check(await dot.evaluate((element) => element === document.activeElement && element.matches(':focus-visible')), `${width}/${index}: foco visible y orden de indicadores`)
        await page.keyboard.press('Enter')
        check(await dot.getAttribute('aria-current') === 'true', `${width}/${index}: indicador activado por teclado`)
      }
      await page.keyboard.press('Tab')
      check(await hero().getByRole('button', { name: 'Diapositiva anterior', exact: true }).evaluate((element) => element === document.activeElement), `${width}: anterior sigue a los indicadores`)
      await page.keyboard.press('Enter')
      check(await page.locator('[aria-roledescription="carrusel"]').getAttribute('data-slide') === 'practice', `${width}: anterior por teclado`)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      check(await page.locator('[aria-roledescription="carrusel"]').getAttribute('data-slide') === 'celebrate', `${width}: siguiente por teclado`)
      check(await play.getAttribute('aria-pressed') === 'false', `${width}: navegación manual mantiene la pausa`)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.waitForFunction(() => document.querySelector('[class*="playButton"]').disabled)
      check(await play.isDisabled(), `${width}: reducción de movimiento desactiva autoavance`)
      await hero().getByRole('button', { name: 'Explorar el feed', exact: true }).click()
      check(await page.locator('#home-feed-title').evaluate((element) => element === document.activeElement), `${width}: CTA desplaza y enfoca el feed`)
      await hero().getByRole('button', { name: 'Jugar reto de hoy', exact: true }).click()
      check(await page.getByRole('region', { name: 'Reto del día compartido', exact: true }).count() === 1, `${width}: CTA de Retos sigue funcionando`)
      await page.getByRole('navigation', { name: 'Secciones de comunidad' }).getByRole('button', { name: 'Inicio', exact: true }).click()
    }
    check(errors.length === 0, `Sin errores de consola o ejecución: ${errors.join('; ')}`)
    return { checks: checks.length, details: checks, metrics, errors, warnings, status: 'correcto', baseURL }
  } finally {
    page.off('pageerror', onError)
    page.off('console', onConsole)
  }
}
