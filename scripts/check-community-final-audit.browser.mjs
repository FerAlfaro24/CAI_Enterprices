/** Integral audit against build + preview. Supply this function to the existing
 * isolated Brave/Opera GX browser_run_code_unsafe tool; no new dependencies.
 * Optional screenshotDir writes four targeted screenshots, not a full matrix.
 */
async function checkCommunityFinalAudit(page, { baseURL = 'http://127.0.0.1:4173', screenshotDir } = {}) {
  const details = [], matrix = [], contrasts = [], keyboard = [], errors = [], warnings = [], requests = []
  const check = (condition, label) => { if (!condition) throw new Error(label); details.push(label) }
  const onError = (error) => errors.push(String(error))
  const onConsole = (message) => { if (message.type() === 'error') errors.push(message.text()); if (message.type() === 'warning') warnings.push(message.text()) }
  const onRequest = (request) => requests.push({ method: request.method(), url: request.url() })
  const nav = () => page.getByRole('navigation', { name: 'Secciones de comunidad' })
  const quiz = () => page.getByRole('region', { name: 'Reto del día compartido', exact: true })
  const collection = () => page.getByRole('region', { name: 'Insignias conseguidas de Alex', exact: true })
  const publicOwn = () => page.getByRole('region', { name: 'Reconocimientos públicos', exact: true }).locator('[data-member-id="alex"]')
  const feed = () => page.locator('[aria-label="Feed de publicaciones ficticias"]')
  const albums = () => page.locator('[aria-label="Álbumes de la comunidad"]')
  const go = async (view) => {
    const name = { inicio: 'Inicio', galeria: 'Galería', retos: 'Retos', 'mis-logros': 'Logros', comunidad: 'Logros' }[view]
    const button = nav().getByRole('button', { name, exact: true })
    await button.focus(); await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.activeElement?.id === 'community-title')
    if (view === 'mis-logros' || view === 'comunidad') await page.getByRole('tab', { name: view === 'mis-logros' ? 'Mis logros' : 'La comunidad', exact: true }).click()
    await page.evaluate(() => { document.activeElement?.blur(); scrollTo({ top: 0, behavior: 'instant' }) })
  }
  const demo = async (open) => {
    const el = page.locator('#community-demo-controls')
    if ((await el.getAttribute('open') !== null) !== open) await el.locator('summary').click()
  }
  const mode = async (value) => { await demo(true); await page.getByLabel('Vista demo', { exact: true }).selectOption(value); await demo(false) }
  const snap = async (name, target) => {
    if (!screenshotDir) return
    await page.mouse.move(1, 1)
    if (target) {
      // Capture a real viewport. Stitching an element taller than the viewport
      // can paint a sticky header over it or hide a dialog's close control.
      await target.evaluate((el) => {
        if (el.tagName === 'DIALOG') el.scrollTop = 0
        else { const header = document.querySelector('header[class*="topbar"]'); scrollTo({ top: el.getBoundingClientRect().top + scrollY - (header?.getBoundingClientRect().height ?? 0) - 20, behavior: 'instant' }) }
      })
      await page.screenshot({ path: `${screenshotDir}/${name}.png`, animations: 'disabled' })
    }
    else { await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await page.screenshot({ path: `${screenshotDir}/${name}.png`, animations: 'disabled' }) }
  }
  const auditDialog = async (dialog, label) => {
    const result = await dialog.evaluate((el) => {
      const r = el.getBoundingClientRect(), focus = document.activeElement
      return { fits: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight + 1 && el.scrollWidth <= el.clientWidth + 1, focus: el.contains(focus), locked: document.body.style.overflow === 'hidden', name: Boolean(el.getAttribute('aria-labelledby') || el.getAttribute('aria-label')) }
    })
    check(result.fits && result.focus && result.locked && result.name, `${label}: diálogo delimitado, nombrado, enfocado y fondo bloqueado`)
    const controls = dialog.locator('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]').filter({ visible: true })
    await controls.last().focus(); await page.keyboard.press('Tab')
    check(await controls.first().evaluate((el) => el === document.activeElement), `${label}: Tab vuelve al primer control`)
    await page.keyboard.press('Shift+Tab')
    check(await controls.last().evaluate((el) => el === document.activeElement), `${label}: Shift+Tab vuelve al último control`)
  }
  const measureContrast = async (view, theme) => {
    const rows = await page.locator('main').evaluate((root) => {
      const parse = (s) => { const v = s.match(/[\d.]+/g)?.map(Number); return v && s.startsWith('rgb') ? [v[0], v[1], v[2], v[3] ?? 1] : null }
      const mix = (a, b) => a.slice(0, 3).map((v, i) => v * a[3] + b[i] * (1 - a[3]))
      const lum = (rgb) => rgb.map((v) => { const c = v / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4 }).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0)
      const ratio = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05)
      const result = []
      for (const el of root.querySelectorAll('h1,h2,h3,p,small,label,button,span')) {
        const text = [...el.childNodes].filter((node) => node.nodeType === 3).map((node) => node.textContent.trim()).join(' ').trim()
        const css = getComputedStyle(el)
        if (!text || !el.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true }) || el.closest('[aria-hidden="true"],:disabled') || css.clipPath !== 'none' || el.getBoundingClientRect().width <= 1) continue
        let node = el, skip = false
        const layers = []
        while (node) {
          const style = getComputedStyle(node)
          if (Number(style.opacity) < 1 || style.backgroundImage !== 'none') { skip = true; break }
          const bg = parse(style.backgroundColor)
          if (bg && bg[3] > 0) layers.push(bg)
          if (bg?.[3] === 1) break
          node = node.parentElement
        }
        const foreground = parse(css.color)
        if (skip || !layers.length || !foreground) continue
        const background = layers.reduceRight((under, over) => mix(over, under), [255, 255, 255])
        let measured = ratio(mix(foreground, background), background)
        // Text over photographic/SVG siblings: require the dark translucent
        // backplate to pass even over white and black, not a guessed image pixel.
        if (layers[0][3] < 1) measured = Math.min(...[[0, 0, 0], [255, 255, 255]].map((under) => { const bg = mix(layers[0], under); return ratio(mix(foreground, bg), bg) }))
        const large = parseFloat(css.fontSize) >= 24 || parseFloat(css.fontSize) >= 18.66 && Number(css.fontWeight) >= 700
        result.push({ text: text.slice(0, 100), ratio: measured, required: large ? 3 : 4.5, translucent: layers[0][3] < 1 })
      }
      return result
    })
    check(rows.length > 10 && rows.every((row) => row.ratio >= row.required), `${view} ${theme}: textos muestreados con contraste AA, incluidas cartelas translúcidas`)
    contrasts.push(...rows.map((row) => ({ view, theme, ...row })))
  }
  const walkKeyboard = async (view, width, theme) => {
    await page.evaluate(() => { window.__caiAuditVisited = new Set(); window.__caiAuditFocusErrors = [] })
    const skip = page.getByRole('link', { name: 'Saltar al contenido de comunidad', exact: true })
    await skip.focus()
    let cycled = false, steps = 0
    for (; steps < 180; steps++) {
      await page.keyboard.press('Tab')
      const back = await page.evaluate(() => {
        const el = document.activeElement
        window.__caiAuditVisited.add(el)
        if (el?.matches('button,a[href],input,textarea,select,summary')) {
          const s = getComputedStyle(el)
          if (s.outlineStyle === 'none' || parseFloat(s.outlineWidth) === 0) window.__caiAuditFocusErrors.push(el.outerHTML.slice(0, 150))
        }
        return el?.matches('a[href="#community-content"]')
      })
      if (back) { cycled = true; break }
    }
    const result = await page.locator('main').evaluate((root) => {
      // A closed <details> can retain layout rectangles for its hidden content.
      // checkVisibility includes the UA content-visibility boundary; rects alone do not.
      const expected = [...root.querySelectorAll('button,a[href],input,select,textarea,summary')].filter((el) => !el.disabled && el.tabIndex >= 0 && el.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true }))
      const missed = expected.filter((el) => !window.__caiAuditVisited.has(el) && !(el.matches('input[type="radio"]') && expected.some((other) => other.matches('input[type="radio"]') && other.name === el.name && window.__caiAuditVisited.has(other))))
      return { expected: expected.length, missed: missed.map((el) => el.outerHTML.slice(0, 200)), focusErrors: window.__caiAuditFocusErrors }
    })
    keyboard.push({ view, width, theme, steps: cycled ? steps + 1 : steps, cycled, ...result })
    check(cycled && !result.missed.length, `${view} ${width} ${theme}: recorrido completo por Tab alcanza todos los controles, con radios como grupo nativo${cycled ? '' : ' (no volvió al enlace de salto)'}${result.missed.length ? `; inaccesibles: ${JSON.stringify(result.missed)}` : ''}`)
    check(!result.focusErrors.length, `${view} ${width} ${theme}: foco visible durante todo el recorrido`)
    // Continue past the focused skip link before subsequent pointer actions.
    // Its deliberately visible focus surface can cover the mobile theme switch.
    await page.keyboard.press('Tab')
    if (view === 'inicio') {
      const more = page.getByRole('group', { name: 'Filtrar publicaciones', exact: true }).locator('details')
      await more.locator('summary').focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Tab')
      check(await more.getByRole('button', { name: 'Experiencias', exact: true }).evaluate((el) => el === document.activeElement), `Más filtros ${width} ${theme}: Enter y Tab alcanzan las opciones`)
      await page.keyboard.press('Tab'); await page.keyboard.press('Escape')
      check(await more.getAttribute('open') === null && await more.locator('summary').evaluate((el) => el === document.activeElement), `Más filtros ${width} ${theme}: Escape cierra y restaura el foco`)
    }
  }
  page.on('pageerror', onError); page.on('console', onConsole); page.on('request', onRequest)
  try {
    await page.bringToFront(); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto(`${baseURL}/community`)
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(() => { window.__caiAuditShifts = []; window.__caiAuditObserver = new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__caiAuditShifts.push({ value: entry.value, time: entry.startTime, viewport: innerWidth, visibility: document.visibilityState }) }); window.__caiAuditObserver.observe({ type: 'layout-shift', buffered: true }) })
    await page.waitForTimeout(1000)
    const quietShiftSum = await page.evaluate(() => window.__caiAuditShifts.reduce((sum, entry) => sum + entry.value, 0))
    check((await page.getByRole('complementary', { name: 'Aviso de prototipo', exact: true }).innerText()).includes('Sin autenticación ni envíos reales'), 'Entrada identifica explícitamente la simulación')
    await page.getByRole('link', { name: 'Saltar al contenido de comunidad', exact: true }).focus(); await page.keyboard.press('Enter')
    check(await page.locator('main').evaluate((el) => el === document.activeElement), 'El enlace de salto lleva el foco al contenido')
    const initialFeedCount = await feed().getByRole('article').count()
    for (const width of [1440, 1024, 768, 375, 320]) {
      await page.setViewportSize({ width, height: width > 768 ? 1000 : 812 })
      for (const theme of ['claro', 'oscuro']) {
        await page.getByRole('button', { name: `Modo ${theme}`, exact: true }).click()
        for (const view of ['inicio', 'galeria', 'retos', 'mis-logros', 'comunidad']) {
          await go(view)
          const row = await page.locator('main').evaluate((root) => {
            const visible = (el) => el.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })
            const controls = [...root.querySelectorAll('input,textarea,select')].filter(visible)
            const buttons = [...root.querySelectorAll('button')].filter(visible)
            const ids = [...document.querySelectorAll('[id]')].map((el) => el.id)
            const primary = buttons.filter((el) => /Comprobar|Compartir foto|Solicitar →|Enviar a revisión|Explorar álbum|Ver todas las fotos/.test(el.textContent))
            return { height: document.documentElement.scrollHeight, overflow: document.documentElement.scrollWidth > innerWidth, headings: root.querySelectorAll('h1').length, duplicateIds: ids.filter((id, i) => ids.indexOf(id) !== i), unnamedFields: controls.filter((el) => !el.labels?.length && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')).map((el) => el.outerHTML), unnamedButtons: buttons.filter((el) => !el.textContent.trim() && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.getAttribute('title')).map((el) => el.outerHTML), primaryTargets: primary.map((el) => { const r = el.getBoundingClientRect(); return { name: el.textContent.trim(), width: r.width, height: r.height, layoutWidth: el.offsetWidth, layoutHeight: el.offsetHeight, minHeight: getComputedStyle(el).minHeight } }) }
          })
          matrix.push({ width, theme, view, ...row })
          check(!row.overflow && row.headings === 1 && !row.duplicateIds.length, `${view} ${width} ${theme}: estructura y ancho correctos`)
          check(!row.unnamedFields.length && !row.unnamedButtons.length, `${view} ${width} ${theme}: controles nombrados`)
          // Use native layout dimensions for target size. Renderer zoom can
          // quantize a declared 44px box to 43.993px in client rectangles.
          // Keep the unrounded rectangles above so this remains auditable.
          check(row.primaryTargets.every((r) => r.layoutHeight >= 44 && r.layoutWidth >= 44), `${view} ${width} ${theme}: acciones principales de al menos 44 px de layout`)
          if (width === 375) await measureContrast(view, theme)
          if (width === 1440 || width === 320) await walkKeyboard(view, width, theme)
          if (width === 1440 && theme === 'claro' && view === 'inicio') await snap('01-inicio-1440-claro')
        }
      }
    }
    for (const theme of ['claro', 'oscuro']) {
      await page.setViewportSize({ width: 320, height: 812 }); await page.getByRole('button', { name: `Modo ${theme}`, exact: true }).click()
      const profileButton = page.getByRole('button', { name: 'Abrir perfil ficticio de Alex Demo', exact: true })
      await profileButton.focus(); await page.keyboard.press('Enter')
      await auditDialog(page.getByRole('dialog', { name: 'Alex Demo', exact: true }), `Perfil 320 ${theme}`)
      await page.keyboard.press('Escape')
      check(await profileButton.evaluate((el) => el === document.activeElement), `Perfil 320 ${theme}: Escape devuelve foco`)
      await go('galeria')
      const trigger = albums().getByRole('button', { name: 'Explorar álbum: Tres rincones, una semana de pequeñas prácticas', exact: true })
      await trigger.focus(); await page.keyboard.press('Enter')
      const album = page.getByRole('dialog', { name: 'Tres rincones, una semana de pequeñas prácticas', exact: true })
      await auditDialog(album, `Álbum 320 ${theme}`)
      await album.getByRole('group', { name: 'Fotografías del álbum', exact: true }).press('ArrowRight')
      check(await album.getByRole('status').innerText() === 'Foto 2 de 3', `Álbum 320 ${theme}: flecha nativa navega`)
      if (theme === 'oscuro') await snap('02-visor-320-oscuro', album)
      await album.getByRole('button', { name: 'Ver publicación y conversación', exact: true }).click()
      const story = page.getByRole('dialog', { name: 'La historia completa', exact: true })
      await auditDialog(story, `Historia sobre álbum 320 ${theme}`)
      const author = story.getByRole('button', { name: 'Ver perfil de Vale Vocab', exact: true }).first()
      await author.click()
      await auditDialog(page.getByRole('dialog', { name: 'Vale Vocab', exact: true }), `Perfil sobre historia y álbum 320 ${theme}`)
      await page.keyboard.press('Escape'); check(await author.evaluate((el) => el === document.activeElement), `Perfil anidado ${theme}: restaura foco en historia`)
      await page.keyboard.press('Escape'); check(await album.getByRole('button', { name: 'Ver publicación y conversación', exact: true }).evaluate((el) => el === document.activeElement), `Historia anidada ${theme}: restaura foco en álbum`)
      await page.keyboard.press('Escape'); check(await trigger.evaluate((el) => el === document.activeElement) && await page.evaluate(() => document.body.style.overflow !== 'hidden'), `Tres cierres ${theme}: foco y scroll restaurados`)
    }
    await page.setViewportSize({ width: 375, height: 812 }); await page.getByRole('button', { name: 'Modo claro', exact: true }).click(); await go('inicio')
    const homeQuestion = await page.locator('[aria-labelledby="home-challenge-title"] > p').innerText()
    await page.getByRole('button', { name: 'Jugar reto de hoy', exact: true }).first().click()
    // The shortcut, like the main navigation, schedules heading focus in rAF.
    // Complete that transition before testing the independent answer focus.
    await page.waitForFunction(() => document.activeElement?.id === 'community-title')
    check(await quiz().locator('legend').innerText() === homeQuestion, 'Recorrido: misma pregunta en Inicio y Retos')
    await quiz().getByRole('radio').first().focus(); await page.keyboard.press('Space'); await quiz().getByRole('button', { name: '¡Comprobar!', exact: true }).press('Enter')
    check((await quiz().getByRole('status').innerText()).includes('+15 puntos ficticios'), 'Recorrido: acierto concede 5 + 10')
    const unlock = page.getByRole('complementary', { name: 'Insignia recién desbloqueada', exact: true })
    check(await unlock.count() === 1, 'Premio real produce una celebración breve')
    await unlock.waitFor({ state: 'hidden', timeout: 6000 })
    check(await quiz().getByRole('status').evaluate((el) => el === document.activeElement), 'La celebración termina sola sin mover el foco del resultado')
    for (const [day, answer] of [['Día 2', 'go'], ['Día 3', 'Give it a try']]) {
      await page.getByRole('button', { name: `Ir al ${day} · Demo`, exact: true }).click(); await quiz().getByRole('radio', { name: answer, exact: true }).check(); await quiz().getByRole('button', { name: '¡Comprobar!', exact: true }).click()
    }
    check((await page.getByRole('region', { name: 'Tu progreso en los retos', exact: true }).innerText()).includes('35 puntos demo'), 'Recorrido: acierto, error, acierto suman 35')
    await go('inicio'); check(await page.getByText('Reto completado · +15 puntos ficticios', { exact: true }).count() === 1, 'Inicio refleja el día y resultado actuales')
    await go('mis-logros'); check(await collection().getByRole('article').count() === 2 && await page.getByText('35 puntos de Retos', { exact: true }).count() === 1, 'Colección y puntos sincronizados sin doble concesión')
    check(await page.getByRole('complementary', { name: 'Insignia recién desbloqueada', exact: true }).count() === 0, 'Navegar no repite celebraciones anteriores')
    await snap('03-coleccion-sincronizada-375', page.locator('#my-badge-collection'))
    const privateText = 'PRIVADO AUDITORÍA 6.4: una película ficticia me permitió practicar nuevas expresiones. Esta declaración no es una historia pública.'
    const submitRequest = async () => { const form = page.getByRole('form', { name: 'Solicitud de insignia', exact: true }); await form.getByLabel('Cuéntanos tu aventura', { exact: true }).fill(privateText); await form.getByRole('button', { name: 'Enviar a revisión', exact: true }).click() }
    await submitRequest(); await mode('moderator')
    await page.getByRole('article', { name: 'Revisar solicitud: Explorador de películas', exact: true }).getByRole('button', { name: 'Rechazar solicitud', exact: true }).click()
    await mode('student'); await submitRequest(); await mode('moderator')
    await page.getByRole('article', { name: 'Revisar solicitud: Explorador de películas', exact: true }).getByRole('button', { name: 'Aprobar solicitud', exact: true }).click()
    check(await collection().getByRole('article').count() === 3 && await page.getByRole('article', { name: 'Solicitud de Explorador de películas: Rechazada', exact: true }).count() === 1 && await page.getByRole('article', { name: 'Solicitud de Explorador de películas: Aprobada', exact: true }).count() === 1, 'Rechazo y reintento conservan historial y conceden una vez')
    await go('comunidad'); check(await publicOwn().count() === 0 && !(await page.locator('body').innerText()).includes(privateText), 'Aprobación conserva declaración privada y no publica')
    await mode('student'); await go('mis-logros'); await collection().locator('[data-badge-id="movie-explorer"]').getByRole('button', { name: 'Compartir mi logro', exact: true }).click()
    const composer = page.getByRole('dialog', { name: 'Comparte un pequeño paso', exact: true })
    await auditDialog(composer, 'Compositor voluntario 375')
    check(!(await composer.getByLabel('Tu historia de muestra', { exact: true }).inputValue()).includes(privateText), 'Compositor explícito no copia la justificación')
    const title = 'Mi avance compartido en la auditoría ficticia 6.4'
    await composer.getByLabel('Título', { exact: true }).fill(title)
    await composer.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()
    await go('comunidad'); check(await publicOwn().count() === 0, 'Historia pendiente aún no es reconocimiento público')
    await mode('moderator'); await page.getByRole('article', { name: `Revisar ${title}`, exact: true }).getByRole('button', { name: 'Aprobar', exact: true }).click(); await mode('student')
    check(await publicOwn().count() === 1 && !(await page.locator('body').innerText()).includes(privateText), 'Solo compartir y moderar publican un reconocimiento sin texto privado')
    await page.setViewportSize({ width: 1440, height: 1000 }); await snap('04-reconocimiento-publico', page.getByRole('region', { name: 'Reconocimientos públicos', exact: true }))
    await go('galeria'); await page.getByRole('button', { name: 'Compartir foto', exact: true }).click()
    await composer.getByLabel('Título', { exact: true }).fill('Fotografías ficticias de la auditoría 6.4')
    await composer.getByLabel('Tu historia de muestra', { exact: true }).fill('Dos imágenes ilustrativas de stock; no son fotografías de alumnos ni instalaciones de CAI.')
    await composer.getByRole('checkbox').nth(0).check(); await composer.getByRole('checkbox').nth(1).check(); await composer.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()
    check(await albums().getByRole('article').count() === 6, 'Fotos pendientes no crean álbum público')
    await mode('moderator'); await page.getByRole('article', { name: 'Revisar Fotografías ficticias de la auditoría 6.4', exact: true }).getByRole('button', { name: 'Aprobar', exact: true }).click()
    check(await albums().getByRole('article').count() === 7, 'Aprobar fotos añade solo su álbum derivado')
    await page.getByRole('button', { name: 'Modo oscuro', exact: true }).click()
    await demo(true); await page.getByRole('button', { name: 'Reiniciar demo', exact: true }).click(); await demo(false)
    await go('mis-logros'); check(await collection().getByRole('article').count() === 0 && await page.getByRole('article', { name: /^Solicitud de / }).count() === 0, 'Reinicio borra concesiones y ambas decisiones de historial')
    await go('comunidad'); check(await publicOwn().count() === 0, 'Reinicio elimina reconocimiento publicado')
    await go('galeria'); check(await albums().getByRole('article').count() === 6, 'Reinicio restaura exactamente seis álbumes')
    await go('retos'); check((await page.getByRole('region', { name: 'Tu progreso en los retos', exact: true }).innerText()).includes('0 puntos demo') && await quiz().getByRole('radio', { checked: true }).count() === 0, 'Reinicio limpia puntos, días y selección')
    await go('inicio'); check(await feed().getByRole('article').count() === initialFeedCount && await page.getByRole('region', { name: 'Estado de tus publicaciones demo', exact: true }).count() === 0, 'Reinicio restaura feed sin envíos propios residuales')
    // The sum across 50 resizes, captures and focus tours is a diagnostic, not
    // a Core Web Vitals CLS score. Report the separate initial quiet sample.
    const performance = await page.evaluate((quiet) => { window.__caiAuditObserver.disconnect(); const nav = window.performance.getEntriesByType('navigation')[0]; return { initialQuietLayoutShiftSum: quiet, testSequenceLayoutShiftSum: window.__caiAuditShifts.reduce((sum, entry) => sum + entry.value, 0), layoutShiftEntries: window.__caiAuditShifts, domContentLoadedMs: nav.domContentLoadedEventEnd, resources: window.performance.getEntriesByType('resource').map((r) => ({ url: r.name, type: r.initiatorType, bytes: r.encodedBodySize, durationMs: r.duration })) } }, quietShiftSum)
    await go('retos'); await quiz().getByRole('radio').first().check(); await quiz().getByRole('button', { name: '¡Comprobar!', exact: true }).click()
    await mode('moderator'); await page.reload()
    check(await page.locator('[data-theme]').getAttribute('data-theme') === 'dark' && await feed().getByRole('article').count() === initialFeedCount, 'Recarga conserva el tema y restaura el feed')
    await demo(true); check(await page.getByLabel('Vista demo', { exact: true }).inputValue() === 'student', 'Recarga descarta también el rol de moderador simulado'); await demo(false)
    await go('retos'); check((await page.getByRole('region', { name: 'Tu progreso en los retos', exact: true }).innerText()).includes('0 puntos demo'), 'Recarga descarta intentos y puntos que existían antes de recargar')
    await go('mis-logros'); check(await collection().getByRole('article').count() === 0, 'Recarga descarta la concesión de la visita anterior')
    check(!requests.some((r) => !['GET', 'HEAD'].includes(r.method)), 'El recorrido demo no envía escrituras de red')
    check(!errors.length, `Sin errores inesperados de página o consola: ${errors.join('; ')}`)
    return { status: 'correcto', checks: details.length, details, matrix, contrasts, keyboard, performance, errors, warnings, requestMethods: [...new Set(requests.map((r) => r.method))], baseURL }
  } finally { page.off('pageerror', onError); page.off('console', onConsole); page.off('request', onRequest) }
}
