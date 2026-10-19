/** Run with the existing isolated Brave browser_run_code_unsafe tool.
 * No new browser dependency. The same test accepts Opera GX for compatibility.
 * Optional screenshotDir writes 13 final images; five baseline images are local.
 */
async function checkCommunityLearningPremium(page, { baseURL = 'http://127.0.0.1:4173', screenshotDir, before = [] } = {}) {
  const details = [], matrix = [], contrasts = [], errors = [], warnings = []
  const check = (value, label) => { if (!value) throw new Error(label); details.push(label) }
  const onError = (error) => errors.push(String(error))
  const onConsole = (message) => { if (message.type() === 'error') errors.push(message.text()); if (message.type() === 'warning') warnings.push(message.text()) }
  const nav = () => page.getByRole('navigation', { name: 'Secciones de comunidad' })
  const quiz = () => page.getByRole('region', { name: 'Reto del día compartido', exact: true })
  const collection = () => page.getByRole('region', { name: 'Insignias conseguidas de Alex', exact: true })
  const notice = () => page.getByRole('complementary', { name: 'Insignia recién desbloqueada', exact: true })
  const ownPublic = () => page.getByRole('region', { name: 'Reconocimientos públicos', exact: true }).locator('[data-member-id="alex"]')
  const go = async (view) => {
    await nav().getByRole('button', { name: view === 'retos' ? 'Retos' : 'Logros', exact: true }).click()
    if (view !== 'retos') await page.getByRole('tab', { name: view === 'mis-logros' ? 'Mis logros' : 'La comunidad', exact: true }).click()
    // Let the shell finish its scheduled heading focus before measuring/capturing.
    await page.waitForTimeout(60)
    await page.evaluate(() => { document.activeElement?.blur(); scrollTo({ top: 0, behavior: 'instant' }) })
  }
  const snap = async (name, target) => {
    if (!screenshotDir) return
    await page.mouse.move(1, 1)
    await page.evaluate(() => document.fonts.ready)
    if (target) await target.screenshot({ path: `${screenshotDir}/${name}.png`, animations: 'disabled' })
    else { await page.evaluate(() => { document.activeElement?.blur(); scrollTo({ top: 0, behavior: 'instant' }) }); await page.screenshot({ path: `${screenshotDir}/${name}.png`, fullPage: true, animations: 'disabled', style: 'html{scrollbar-gutter:stable!important}' }) }
  }
  const demo = async (open) => {
    const el = page.locator('#community-demo-controls')
    if ((await el.getAttribute('open') !== null) !== open) await el.locator('summary').click()
  }
  const role = async (mode) => { await demo(true); await page.getByLabel('Vista demo', { exact: true }).selectOption(mode); await demo(false) }
  const answer = async (name) => { await quiz().getByRole('radio', { name, exact: true }).check(); await quiz().getByRole('button', { name: '¡Comprobar!', exact: true }).click() }
  // Resolve the actual rendered foreground/background, including parent backgrounds.
  const contrast = async (locator, label) => {
    const values = await locator.evaluate((el) => {
      const parse = (text) => text.match(/[\d.]+/g)?.slice(0, 4).map(Number)
      const front = parse(getComputedStyle(el).color)
      let back, node = el
      while (node) { const value = parse(getComputedStyle(node).backgroundColor); if (value && (value.length < 4 || value[3] === 1)) { back = value; break } node = node.parentElement }
      if (!front || !back) return null
      const lum = (rgb) => rgb.slice(0, 3).map((v) => { const c = v / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4 }).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0)
      const a = lum(front), b = lum(back)
      return { ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05), foreground: front.slice(0, 3), background: back.slice(0, 3) }
    })
    check(values && values.ratio >= 4.5, `Contraste AA de texto: ${label} (${values?.ratio.toFixed(2)})`)
    contrasts.push({ label, ...values })
  }
  page.on('pageerror', onError); page.on('console', onConsole)
  try {
    await page.bringToFront()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`${baseURL}/community`)
    await page.evaluate(() => document.fonts.ready)
    for (const width of [1440, 1024, 768, 375, 320]) {
      await page.setViewportSize({ width, height: width > 768 ? 1000 : 812 })
      for (const theme of ['claro', 'oscuro']) {
        await page.getByRole('button', { name: `Modo ${theme}`, exact: true }).click()
        for (const view of ['retos', 'mis-logros', 'comunidad']) {
          await go(view)
          const row = await page.evaluate(({ view, theme }) => {
            const rect = (selector) => { const el = document.querySelector(selector); return el ? el.getBoundingClientRect().top + scrollY : null }
            return { view, theme, width: innerWidth, height: document.documentElement.scrollHeight, overflow: document.documentElement.scrollWidth > innerWidth, questionTop: rect('[aria-label="Reto del día compartido"]'), catalogTop: rect('#badge-catalog'), collectionTop: rect('#my-badge-collection') }
          }, { view, theme })
          matrix.push(row)
          check(!row.overflow, `${view} ${width} ${theme}: sin desbordamiento horizontal de página`)
          const root = view === 'retos' ? quiz() : view === 'mis-logros' ? page.locator('#achievement-panel-mine') : page.locator('#achievement-panel-community')
          check(await root.locator('img').evaluateAll((images) => images.every((img) => img.complete && img.naturalWidth > 0)), `${view} ${width} ${theme}: SVG cargados`)
          if (view === 'retos') {
            check(await quiz().getByRole('radio').count() === 3, `Tres radios nativos en ${width} ${theme}`)
            check(await quiz().locator('label').evaluateAll((els) => els.every((el) => el.getBoundingClientRect().height >= 44)), `Respuestas táctiles >=44px en ${width} ${theme}`)
            check(await page.getByRole('group', { name: 'Recorrido de cinco días ficticios' }).getByRole('button').count() === 5, `Cinco días explícitamente ficticios en ${width} ${theme}`)
          } else if (view === 'mis-logros') {
            check(await collection().getByRole('article').count() === 0, `Vacío real sin concesiones inventadas en ${width} ${theme}`)
            check(await page.locator('#badge-catalog-grid > article').count() === 4, `Cuatro opciones iniciales conservadas en ${width} ${theme}`)
          } else {
            check(await ownPublic().count() === 0, `Comunidad no inventa reconocimientos propios en ${width} ${theme}`)
          }
          const old = before.find((item) => item.view === view && item.width === width && item.theme === theme)
          if (old && width <= 375 && view === 'mis-logros') check(row.height < old.height && row.catalogTop < old.catalogTop, `Móvil ${width} ${theme}: colección y catálogo más accesibles sin ocultar datos`)
          if (old && width <= 375 && view === 'retos') check(row.questionTop < old.questionTop, `Móvil ${width} ${theme}: pregunta accesible antes`)
          if ([1440, 375].includes(width) && (theme === 'claro' || view === 'retos')) await snap(`despues-${view}-${width}-${theme}`)
          if (width === 375) {
            if (view === 'retos') { await contrast(quiz().locator('legend'), `pregunta ${theme}`); await contrast(quiz().locator('[class*="questionIntro"]'), `instrucción ${theme}`); await contrast(quiz().locator('label').first().locator('[class*="optionText"]'), `opción ${theme}`); await contrast(quiz().getByRole('button', { name: '¡Comprobar!', exact: true }), `comprobar ${theme}`) }
            if (view === 'mis-logros') { await contrast(page.locator('#badge-catalog-grid h3').first(), `catálogo ${theme}`); await contrast(page.locator('#badge-catalog-grid article p').first(), `descripción de insignia ${theme}`); await contrast(page.getByRole('complementary', { name: 'Insignia para solicitar', exact: true }).locator('p'), `cartela privada ${theme}`) }
            if (view === 'comunidad') await contrast(page.locator('[aria-labelledby="recognition-hero-title"] p').first(), `reconocimiento ${theme}`)
          }
        }
      }
    }
    await page.setViewportSize({ width: 375, height: 812 }); await page.getByRole('button', { name: 'Modo claro', exact: true }).click(); await go('retos')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    const first = quiz().getByRole('radio').first()
    await first.focus(); await page.keyboard.press('Space')
    const selected = await quiz().locator('label').first().boundingBox()
    await page.keyboard.press('ArrowDown')
    const changed = await quiz().locator('label').first().boundingBox()
    check(Math.abs(selected.y - changed.y) < .1 && Math.abs(selected.height - changed.height) < .1, 'Cambiar selección por teclado no desplaza opciones ni CTA')
    check(await quiz().getByRole('radio').nth(1).isChecked(), 'Flecha nativa selecciona y enfoca la segunda respuesta')
    await page.waitForTimeout(200)
    await contrast(quiz().locator('label').nth(1).locator('[class*="optionText"]'), 'selección visible sin depender solo del color')
    await first.check(); await quiz().getByRole('button', { name: '¡Comprobar!', exact: true }).click()
    check((await quiz().getByRole('status').innerText()).includes('15 puntos') && await quiz().getByRole('status').evaluate((el) => document.activeElement === el), 'Acierto +15, resultado enfocado; celebración no roba foco')
    check(await notice().count() === 1 && (await notice().innerText()).includes('Sigue siendo privada'), 'Una celebración derivada del premio real informa su privacidad')
    check(await notice().getByRole('button').evaluate((el) => el.getBoundingClientRect().width >= 44), 'Celebración tiene cierre táctil accesible')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    check(await notice().evaluate((el) => getComputedStyle(el).transform === 'none'), 'Reducir movimiento en vivo anula la traslación de la celebración')
    await contrast(quiz().locator('label').first().locator('[class*="optionText"]'), 'respuesta correcta')
    await snap('estado-acierto-e-insignia')
    await notice().getByRole('button', { name: 'Cerrar celebración de insignia', exact: true }).click()
    await go('mis-logros')
    check(await collection().locator('[data-badge-id="first-answer"]').count() === 1 && await notice().count() === 0, 'Ir a Mis Logros sincroniza una insignia sin repetir celebración')
    check(await collection().getByText('PRÁCTICA EN RETOS', { exact: true }).count() === 1, 'Certificado automático identificado por texto, no solo color')
    await go('retos')
    check(await notice().count() === 0 && await quiz().getByRole('button', { name: '¡Comprobar!', exact: true }).count() === 0, 'Reabrir Retos no repite premio ni comprobación')
    await page.getByRole('group', { name: 'Recorrido de cinco días ficticios' }).getByRole('button', { name: 'Ir al Día 2 · Demo', exact: true }).click()
    check(await quiz().getByRole('radio', { checked: true }).count() === 0, 'Nuevo control de día conserva limpieza de selección')
    await answer('go')
    check((await quiz().getByRole('status').innerText()).includes('Respuesta incorrecta') && (await page.getByRole('region', { name: 'Tu progreso en los retos', exact: true }).innerText()).includes('20 puntos demo'), 'Error suma solo +5; total 20 con el nuevo recorrido')
    await contrast(quiz().locator('label:has(input:checked)').locator('[class*="optionText"]'), 'respuesta incorrecta')
    await snap('estado-respuesta-incorrecta', quiz())
    await go('mis-logros'); await page.setViewportSize({ width: 1024, height: 900 })
    const privateText = 'PRIVADO FASE 6.3: vi una película ficticia en inglés y comprendí las escenas; no autorizo publicar esta justificación.'
    const form = page.getByRole('form', { name: 'Solicitud de insignia', exact: true })
    await form.getByLabel('Cuéntanos tu aventura', { exact: true }).fill(privateText)
    await form.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()
    check(await page.getByRole('article', { name: 'Solicitud de Explorador de películas: Pendiente', exact: true }).count() === 1 && await collection().getByRole('article').count() === 1, 'Solicitud pendiente no genera premio falso')
    await snap('estado-solicitud-pendiente')
    await go('comunidad')
    check(await ownPublic().count() === 0 && !(await page.locator('body').innerText()).includes(privateText), 'Pendiente y justificación permanecen privadas')
    await go('mis-logros'); await role('moderator')
    await page.getByRole('article', { name: 'Revisar solicitud: Explorador de películas', exact: true }).getByRole('button', { name: 'Aprobar solicitud', exact: true }).click()
    check(await collection().locator('[data-source="cai"]').count() === 1 && await collection().getByText('RECONOCIDA POR CAI', { exact: true }).count() === 1, 'CAI concede un certificado claramente distinto de los automáticos')
    check(await page.getByRole('article', { name: 'Solicitud de Explorador de películas: Aprobada', exact: true }).count() === 1, 'Historial conserva estado aprobado')
    await snap('estado-solicitud-aprobada')
    await go('comunidad')
    check(await ownPublic().count() === 0 && !(await page.locator('body').innerText()).includes(privateText), 'Aprobar no publica ni filtra declaración')
    await go('mis-logros'); await role('student')
    await collection().locator('[data-badge-id="movie-explorer"]').getByRole('button', { name: 'Compartir mi logro', exact: true }).click()
    const composer = page.getByRole('dialog', { name: 'Comparte un pequeño paso', exact: true })
    check(!(await composer.innerText()).includes(privateText) && !(await composer.getByLabel('Tu historia de muestra', { exact: true }).inputValue()).includes(privateText), 'Compartir explícitamente propone texto público sin copiar lo privado')
    await snap('estado-compartir-voluntariamente', composer)
    await page.keyboard.press('Escape')
    for (const theme of ['claro', 'oscuro']) {
      await page.setViewportSize({ width: 320, height: 812 })
      await page.getByRole('button', { name: `Modo ${theme}`, exact: true }).click()
      await page.locator('#badge-catalog-grid [data-badge-id="music-catcher"]').getByRole('button', { name: 'Solicitar →', exact: true }).click()
      const request = page.getByRole('dialog', { name: 'Solicitar una insignia', exact: true })
      check(await request.evaluate((el) => el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().right <= innerWidth), `Diálogo de solicitud a 320 ${theme} completo sin desbordamiento`)
      await request.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()
      check(await request.getByRole('alert').count() === 1 && await request.getByRole('textbox').evaluate((el) => document.activeElement === el), `Error de formulario a 320 ${theme} explicado y enfocado`)
      await page.keyboard.press('Escape')
      check(await request.count() === 0 && await page.locator('#badge-catalog-grid [data-badge-id="music-catcher"]').getByRole('button').evaluate((el) => document.activeElement === el), `Escape a 320 ${theme} devuelve foco a Solicitar`)
    }
    await demo(true); await page.getByRole('button', { name: 'Reiniciar demo', exact: true }).click(); await demo(false); await go('mis-logros')
    check(await collection().getByRole('article').count() === 0 && await notice().count() === 0 && await page.getByRole('article', { name: /^Solicitud de / }).count() === 0, 'Reiniciar retira premios, solicitudes y celebración sin falsos eventos')
    await go('comunidad'); check(await ownPublic().count() === 0, 'Reinicio no deja publicaciones propias residuales')
    check(errors.length === 0, `Sin errores inesperados de consola o ejecución: ${errors.join('; ')}`)
    return { status: 'correcto', checks: details.length, details, matrix, contrasts, errors, warnings, baseURL }
  } finally { page.off('pageerror', onError); page.off('console', onConsole) }
}
