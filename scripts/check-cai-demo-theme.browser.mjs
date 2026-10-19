/** Regresión de tema y navegación con el navegador aislado existente. */
async function checkCaiDemoTheme(page, { baseURL = 'http://127.0.0.1:4191', screenshotDir } = {}) {
  const details = [], matrix = [], errors = []
  const check = (value, label) => { if (!value) throw new Error(label); details.push(label) }
  const themeKey = 'cai.demo.theme.v1', legacyKey = 'cai.community.demo.theme.v1'
  const onError = (error) => errors.push(String(error))
  const onConsole = (message) => { if (message.type() === 'error') errors.push(message.text()) }
  const selected = async (theme) => check(await page.locator('html').getAttribute('data-theme') === theme, `Tema global: ${theme}`)
  const loginLink = () => page.getByRole('link', { name: 'Iniciar sesión / Registrarse', exact: true }).filter({ visible: true }).first()
  page.on('pageerror', onError); page.on('console', onConsole)
  try {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' })
    await page.goto(baseURL)
    await page.evaluate(({ themeKey, legacyKey }) => { localStorage.removeItem(themeKey); localStorage.removeItem(legacyKey) }, { themeKey, legacyKey })
    await page.reload(); await selected('dark')
    await page.getByRole('button', { name: 'Modo claro', exact: true }).click(); await selected('light')
    await page.reload(); await selected('light')
    check(await page.getByRole('button', { name: 'Modo claro', exact: true }).getAttribute('aria-pressed') === 'true', 'Preferencia explícita prevalece sobre sistema oscuro')
    await page.evaluate(({ themeKey, legacyKey }) => { localStorage.removeItem(themeKey); localStorage.setItem(legacyKey, 'dark') }, { themeKey, legacyKey })
    await page.reload(); await selected('dark')
    check(await page.evaluate(({ themeKey, legacyKey }) => localStorage.getItem(themeKey) === 'dark' && localStorage.getItem(legacyKey) === null, { themeKey, legacyKey }), 'Migra clave histórica a una sola clave')
    await page.setViewportSize({ width: 1440, height: 1000 })
    await loginLink().click(); await selected('dark')
    await page.getByRole('button', { name: 'Modo claro', exact: true }).click()
    await page.getByRole('button', { name: /^Demo estudiante/ }).click(); await selected('light')
    check(await page.getByRole('button', { name: 'Modo claro', exact: true }).getAttribute('aria-pressed') === 'true', 'Selector aprobado de Comunidad refleja cambio desde Login')
    await page.getByRole('button', { name: 'Modo oscuro', exact: true }).click()
    await page.getByRole('link', { name: 'Sitio institucional ↗', exact: true }).last().click(); await selected('dark')
    check(await page.getByRole('button', { name: 'Modo oscuro', exact: true }).getAttribute('aria-pressed') === 'true', 'Landing refleja cambio desde Comunidad')
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 900 })
      for (const theme of ['light', 'dark']) {
        await page.goto(baseURL)
        await page.getByRole('button', { name: theme === 'light' ? 'Modo claro' : 'Modo oscuro', exact: true }).click()
        for (const route of ['/', '/login', '/registro', '/community', '/admin', '/admin/solicitudes', '/admin/publicaciones', '/admin/alumnos', '/admin/configuracion']) {
          await page.goto(`${baseURL}${route}`); await page.evaluate(() => document.fonts.ready); await selected(theme)
          const row = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, main: document.querySelectorAll('main').length, h1: document.querySelectorAll('h1').length }))
          matrix.push({ width, theme, route, ...row }); check(!row.overflow && row.main === 1 && row.h1 === 1, `${route}: ${width}/${theme} sin desbordamiento, un main y H1`)
          if (route === '/') {
            check(await page.locator('header#top').evaluate((el) => el.getBoundingClientRect().top === 0), 'Landing comienza directamente en header')
            check(await page.getByText('Recorre las áreas del prototipo', { exact: true }).count() === 0 && await page.getByRole('complementary', { name: 'Aviso de prototipo', exact: true }).count() === 0, 'Sin las dos barras superiores')
            check(await page.locator('img').evaluateAll((images) => images.every((img) => getComputedStyle(img).filter === 'none')), 'Sin filtros sobre fotografías ni SVG')
            const programs = page.getByRole('button', { name: 'Programas', exact: true })
            if (width <= 1100) await page.getByRole('button', { name: 'Abrir menú', exact: true }).click()
            await programs.click(); check(await programs.getAttribute('aria-expanded') === 'true', 'Desplegable institucional funciona')
            await page.keyboard.press('Escape')
            if (width <= 1100) {
              await page.getByRole('button', { name: 'Abrir menú', exact: true }).click()
              check(await loginLink().isVisible(), 'Acceso completo disponible en menú móvil')
              await page.keyboard.press('Escape')
            } else check(await loginLink().isVisible(), 'Acceso completo visible en escritorio')
          }
          if (screenshotDir && [1440, 375].includes(width) && ['/', '/login', '/registro', '/admin'].includes(route)) await page.screenshot({ path: `${screenshotDir}/${route === '/' ? 'landing' : route.slice(1)}-${width}-${theme}.png`, fullPage: true, animations: 'disabled' })
        }
      }
    }
    check(!errors.length, `Sin errores de consola: ${JSON.stringify(errors)}`)
    return { status: 'correcto', checks: details.length, details, matrix, errors }
  } finally { page.off('pageerror', onError); page.off('console', onConsole) }
}
