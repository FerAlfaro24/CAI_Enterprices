/** Integración v1.0 con cuentas ficticias en contextos de navegador separados. */
export async function checkCommunityConnected(page, { email, password, browserLabel = 'Prueba', baseURL = 'http://127.0.0.1:5173' } = {}) {
  const details = [], errors = [], matrix = [], contexts = [], listeners = []
  const check = (ok, label) => { if (!ok) throw new Error(label); details.push(label) }
  const watch = target => { target.setDefaultTimeout(10_000); const listener = error => errors.push(String(error)); target.on('pageerror', listener); listeners.push([target, listener]) }
  const call = async (target, route, method = 'GET', data, key) => target.evaluate(async ({ route, method, data, key }) => {
    const response = await fetch('/api/local' + route, { method, headers: { ...(data === undefined ? {} : { 'Content-Type': 'application/json' }), ...(key ? { 'Idempotency-Key': key } : {}) }, body: data === undefined ? undefined : JSON.stringify(data) })
    const body = await response.json()
    if (!response.ok) throw new Error(`${method} ${route}: ${response.status} ${body.error}`)
    return body
  }, { route, method, data, key })
  const unique = browserLabel + Date.now(), title = `Historia ${unique}`, rejectedTitle = `Borrador ${unique}`
  const studentPassword = 'Frase ficticia de comunidad 2026'
  const adminNav = () => page.getByRole('navigation', { name: 'Secciones de administración', exact: true })
  const login = async (target, address) => {
    await target.bringToFront()
    await target.goto(baseURL + '/login')
    await target.locator('#login-email').fill(address); await target.locator('#login-password').fill(studentPassword)
    await target.getByRole('button', { name: 'Entrar a mi espacio', exact: true }).click()
    await target.getByRole('button', { name: 'Actualizar comunidad', exact: true }).waitFor()
  }
  const refresh = async target => {
    await target.bringToFront()
    const response = target.waitForResponse(response => response.url().endsWith('/api/local/student/posts') && response.request().method() === 'GET')
    await target.getByRole('button', { name: 'Actualizar comunidad', exact: true }).click(); await response
    await target.getByRole('button', { name: 'Actualizar comunidad', exact: true }).waitFor()
    // Wait for React to commit the response, not just the network request.
    await target.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  }
  const compose = async (target, heading, retryTest = false) => {
    await target.bringToFront()
    await target.getByRole('button', { name: 'Compartir algo', exact: true }).first().click()
    const dialog = target.getByRole('dialog')
    await dialog.getByLabel('Título', { exact: true }).fill(heading)
    await dialog.getByLabel('Tu historia', { exact: true }).fill('Una historia ficticia para comprobar el avance de nuestro grupo.')
    await dialog.getByLabel('Categoría', { exact: true }).selectOption('achievement')
    const keys = []
    const pattern = '**/api/local/student/posts'
    const loseResponse = async route => {
      if (route.request().method() !== 'POST') return route.continue()
      keys.push(route.request().headers()['idempotency-key'])
      if (keys.length === 1) { await route.fetch(); await route.abort('failed') }
      else await route.continue()
    }
    if (retryTest) await target.route(pattern, loseResponse)
    await dialog.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()
    if (retryTest) {
      await dialog.getByRole('alert').waitFor()
      check(await dialog.getByLabel('Título', { exact: true }).inputValue() === heading, 'Una respuesta perdida conserva el borrador para reintentar')
      await dialog.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()
    }
    await dialog.waitFor({ state: 'hidden' })
    if (retryTest) {
      await target.unroute(pattern, loseResponse)
      check(keys.length === 2 && keys[0] === keys[1], 'Reintentar el mismo borrador conserva la clave contra duplicados')
      check((await call(target, '/student/posts')).mine.filter(post => post.title === heading).length === 1, 'La respuesta perdida y su reintento generan una sola publicación')
    }
  }
  const review = async heading => {
    await page.bringToFront()
    await page.goto(baseURL + '/admin/publicaciones')
    await page.getByRole('button', { name: `Revisar «${heading}»`, exact: true }).click()
    return page.getByRole('dialog')
  }
  watch(page)
  try {
    await page.bringToFront()
    await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(baseURL + '/admin')
    await page.getByRole('heading', { level: 1 }).waitFor()
    if (await page.locator('#login-email').isVisible()) {
      await page.locator('#login-email').fill(email); await page.locator('#login-password').fill(password)
      await page.getByRole('button', { name: 'Entrar al panel', exact: true }).click()
    }
    await adminNav().waitFor()
    const people = []
    for (const [index, group] of ['Mar y jue · 19:30', 'Mar y jue · 19:30', 'Viernes · 18:00'].entries()) {
      const context = await page.context().browser().newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }); contexts.push(context)
      const target = await context.newPage(); watch(target); await target.goto(baseURL + '/login')
      const address = `comunidad-${unique.toLowerCase()}-${index}@example.test`, alias = `Grupo ${unique} ${index}`
      const receipt = await call(page, '/requests', 'POST', { firstName: 'Prueba', lastName: `${unique} ${index}`, birthDate: '2000-01-01', email: address, filledBy: 'alumno', program: 'Business English', group, displayName: alias, avatarColor: '#1f56d6', visibility: 'privado', message: '', guardianConsent: false, acceptRules: true, acceptPrivacy: true }, crypto.randomUUID())
      await call(page, `/requests/${receipt.id}/approve`, 'POST', { revision: 1 })
      const student = (await call(page, '/students')).students.find(student => student.id === receipt.id)
      const invitation = await call(page, `/students/${receipt.id}/invitation`, 'POST', { revision: student.revision })
      const token = invitation.path.split('token=')[1]
      await call(target, '/activation', 'POST', { token, password: studentPassword, confirm: studentPassword })
      await login(target, address)
      people.push({ target, address, alias, id: receipt.id })
    }
    const [author, peer, outsider] = people
    check(contexts.length === 3, 'Autor, compañero y otro grupo usan sesiones aisladas de administración')
    check(!(await author.target.locator('body').innerText()).includes('Alex Demo'), 'Community muestra al alumno y no sustituye su identidad por Alex Demo')
    check(await author.target.getByRole('button', { name: `Abrir mi perfil: ${author.alias}`, exact: true }).isVisible(), 'Cabecera original utiliza el alias de la sesión')
    await compose(author.target, title, true)
    const own = author.target.getByRole('region', { name: 'Mis publicaciones', exact: true })
    await own.getByText(title, { exact: true }).first().waitFor()
    check((await own.innerText()).includes('Pendiente de revisión'), 'Editor original guarda el envío como pendiente')
    await refresh(peer.target)
    check(await peer.target.getByRole('heading', { name: title, exact: true }).count() === 0, 'Otro alumno no ve el borrador pendiente')
    let dialog = await review(title)
    check(await dialog.getByRole('button', { name: 'Publicar', exact: true }).isDisabled(), 'Revisión original exige confirmación expresa antes de publicar')
    await dialog.getByRole('checkbox').check(); await dialog.getByRole('button', { name: 'Publicar', exact: true }).click(); await dialog.waitFor({ state: 'hidden' })
    await refresh(peer.target); await peer.target.getByRole('heading', { name: title, exact: true }).waitFor()
    check(true, 'Publicar desde el panel original aparece en el feed avanzado del compañero')
    await peer.target.reload(); await peer.target.getByRole('heading', { name: title, exact: true }).waitFor()
    check(true, 'El feed conserva la publicación aprobada al recargar')
    await refresh(outsider.target)
    check(await outsider.target.getByRole('heading', { name: title, exact: true }).count() === 0, 'La publicación no cruza a otro grupo')
    const peerFeed = await call(peer.target, '/student/posts')
    const published = peerFeed.posts.find(post => post.title === title)
    check(published.author.displayName === author.alias && !JSON.stringify(published).includes(author.address) && !JSON.stringify(published).includes(author.id), 'Autor público coherente sin correo ni folio administrativo')
    await compose(author.target, rejectedTitle)
    dialog = await review(rejectedTitle)
    await dialog.getByRole('button', { name: 'Rechazar', exact: true }).click()
    await dialog.getByRole('alert').waitFor(); check(true, 'No permite rechazar sin seleccionar un motivo')
    const reason = await dialog.getByRole('radio').first().inputValue()
    await dialog.getByRole('radio').first().check(); await dialog.getByRole('button', { name: 'Rechazar', exact: true }).click(); await dialog.waitFor({ state: 'hidden' })
    await refresh(author.target)
    check((await own.innerText()).includes(reason), 'El autor consulta el rechazo y su motivo en Mis publicaciones')
    check(!JSON.stringify(await call(peer.target, '/student/posts')).includes(reason), 'El motivo privado no se entrega al compañero')
    await page.bringToFront(); await page.reload(); await page.getByRole('button', { name: /^Rechazadas/ }).click()
    await page.getByRole('button', { name: `Revisar «${rejectedTitle}»`, exact: true }).click()
    dialog = page.getByRole('dialog'); await dialog.getByRole('button', { name: 'Devolver a revisión', exact: true }).click(); await dialog.waitFor({ state: 'hidden' })
    dialog = await review(rejectedTitle); await dialog.getByRole('checkbox').check(); await dialog.getByRole('button', { name: 'Publicar', exact: true }).click(); await dialog.waitFor({ state: 'hidden' })
    await refresh(peer.target); await peer.target.getByRole('heading', { name: rejectedTitle, exact: true }).waitFor()
    check(true, 'Devolver a revisión y volver a publicar funcionan con persistencia')
    await refresh(author.target)
    await own.getByRole('button', { name: `Retirar ${title}`, exact: true }).click()
    await own.getByRole('button', { name: 'Confirmar retiro', exact: true }).click()
    await own.getByText('Retirada', { exact: true }).waitFor()
    await refresh(peer.target)
    check(await peer.target.getByRole('heading', { name: title, exact: true }).count() === 0, 'Retirar desde el historial oculta la publicación al compañero')
    await page.bringToFront(); await page.goto(baseURL + '/admin/publicaciones'); await page.getByRole('button', { name: /^Retiradas/ }).click()
    await page.getByRole('button', { name: `Revisar «${title}»`, exact: true }).click(); dialog = page.getByRole('dialog')
    check(await dialog.getByRole('button', { name: 'Devolver a revisión', exact: true }).count() === 0, 'La bandeja conserva los retiros y no permite republicarlos')
    await dialog.getByRole('button', { name: 'Cerrar revisión', exact: true }).click()
    await page.bringToFront(); await page.goto(baseURL + '/admin/alumnos')
    const row = page.getByRole('row').filter({ hasText: `Prueba ${unique} 0` })
    await row.getByRole('button', { name: /^Ficha de / }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Suspender acceso', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' })
    await refresh(peer.target)
    check(await peer.target.getByRole('heading', { name: rejectedTitle, exact: true }).count() === 0, 'Suspender al autor oculta sus historias al grupo')
    await author.target.reload(); await author.target.getByRole('form', { name: 'Acceso de alumnos', exact: true }).waitFor()
    check(true, 'La suspensión revoca la sesión de Community')
    await page.bringToFront(); await page.getByRole('button', { name: /^Suspendidos/ }).click()
    await row.getByRole('button', { name: /^Ficha de / }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Reactivar acceso', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' })
    await login(author.target, author.address)
    check(true, 'Reactivar requiere entrar de nuevo y recupera el historial autorizado')
    for (const width of [1440, 768, 375, 320]) {
      await author.target.bringToFront(); await author.target.setViewportSize({ width, height: 1000 }); await author.target.goto(baseURL + '/community')
      await author.target.getByRole('button', { name: 'Actualizar comunidad', exact: true }).waitFor()
      check(await author.target.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Community a ${width}px sin desbordamiento`)
      await compose(author.target, `Móvil ${width} ${unique}`)
      check(true, `Editor utilizable a ${width}px`)
      await page.bringToFront(); await page.setViewportSize({ width, height: 1000 }); await page.goto(baseURL + '/admin/publicaciones')
      await page.getByRole('button', { name: `Revisar «Móvil ${width} ${unique}»`, exact: true }).click()
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Moderación a ${width}px sin desbordamiento`)
      check(await page.getByRole('dialog').evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth), `Diálogo de revisión a ${width}px sin desbordamiento`)
      await page.getByRole('dialog').getByRole('button', { name: 'Cerrar revisión', exact: true }).click()
      matrix.push({ width, views: ['community', 'composer', 'moderation', 'review'] })
    }
    check(errors.length === 0, 'Sin errores de ejecución de JavaScript en las cuatro sesiones')
    // Leave the primary test page on Community for visual inspection; no personal sessions are used.
    await login(page, author.address); await page.setViewportSize({ width: 1440, height: 1000 })
    return { browserLabel, checks: details.length, details, matrix, errors }
  } catch (error) {
    const diagnostic = await Promise.all(contexts.flatMap(context => context.pages()).map(async target => ({path: new URL(target.url()).pathname, alerts: await target.getByRole('alert').allTextContents()})))
    throw new Error(`${error.message}\nComprobaciones completadas: ${details.length}\n${JSON.stringify(diagnostic)}`)
  } finally { for (const [target, listener] of listeners) target.off('pageerror', listener); for (const context of contexts) await context.close() }
}
