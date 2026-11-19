/** Vista social sobre fixtures nuevas; no utilizar datos o accesos habituales. */
export async function checkCommunitySocial(browser, { baseURL, screenshotDir, browserLabel }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1040 }, locale: 'es-MX' })
  const admin = await browser.newContext(), page = await context.newPage(), results = [], errors = []
  const title = 'Much y many: por fin me hizo clic', password = 'Frase ficticia para fotos oficiales 2026'
  const check = (value, label) => { if (!value) throw Error(label); results.push(label) }
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('503')) errors.push(message.text()) })
  const call = async (client, path, method = 'GET', data, idempotent = false) => {
    const response = await client.request.fetch(baseURL + '/api/local' + path, { method, data, headers: { Origin: baseURL, ...(idempotent ? { 'Idempotency-Key': crypto.randomUUID() } : {}) } })
    if (!response.ok()) throw Error(`${path}: ${response.status()} ${await response.text()}`)
    return response.json()
  }
  const feed = () => page.locator('[aria-label="Publicaciones de mi grupo"]')
  const story = () => feed().getByRole('article', { name: title, exact: true })
  const dialog = () => page.getByRole('dialog')
  const bar = () => dialog().getByRole('region', { name: 'Celebraciones de ' + title, exact: true })
  const close = () => dialog().getByRole('button', { name: 'Cerrar publicación', exact: true }).press('Escape')
  const open = async () => { await story().getByRole('button', { name: title, exact: true }).click(); await dialog().getByRole('region', { name: 'Comentarios publicados' }).waitFor() }
  const refresh = async () => { await page.getByRole('button', { name: 'Actualizar comunidad', exact: true }).click(); await story().waitFor() }
  const pause = async reactionsOpen => { const configuration = await call(admin, '/configuration'); await call(admin, '/configuration', 'PATCH', { ...configuration.settings, reactionsOpen }) }
  const settle = () => page.evaluate(() => Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))))
  try {
    await page.goto(baseURL + '/login')
    await page.getByLabel('Correo electrónico', { exact: true }).fill('bob@example.test')
    await page.getByLabel('Contraseña', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Entrar a mi espacio', exact: true }).click()
    await story().waitFor()
    await call(admin, '/auth/login', 'POST', { email: 'admin@example.test', password })
    const post = (await call(context, '/student/posts')).posts.find(post => post.title === title)
    check(await feed().locator('[data-social-post="true"]').count() === 6, 'Feed reutiliza las seis publicaciones iniciales en una sola secuencia')
    const positions = await feed().getByRole('article').evaluateAll(items => items.map(item => { const box = item.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width } }))
    check(positions.every((item, index) => item.x === positions[0].x && item.width === positions[0].width && (!index || item.y > positions[index - 1].y)), 'Publicaciones anchas y cronológicas, sin columnas estrechas')
    const reactions = story().getByRole('region', { name: 'Celebraciones de ' + title, exact: true })
    check(await reactions.getByRole('button').count() === 5, 'Cada publicación ofrece cinco emojis')
    const visibleLabels = await reactions.getByRole('button').allTextContents()
    check(visibleLabels.every(text => !/Me encanta|Bien hecho|Felicidades|Increíble|Me divierte/.test(text)), 'Reacciones visibles contienen solo emoji y contador')
    check(await reactions.getByRole('button', { name: 'Me encanta: 1', exact: true }).count() === 1, 'Nombres accesibles conservados para lectores de pantalla')
    await open()
    check(await dialog().getByText('La historia completa', { exact: true }).count() === 0, 'Detalle elimina el encabezado de documento')
    check(await dialog().getByText('Celebra esta historia', { exact: true }).count() === 0, 'Detalle elimina instrucciones repetidas de reacciones')
    check(await dialog().getByRole('heading', { name: title, exact: true }).isVisible(), 'Autor y publicación mantienen su identidad al abrir')
    check(await dialog().locator('[class*="postBody"]').evaluate(node => parseFloat(getComputedStyle(node).fontSize) >= 15), 'Mensaje tiene tamaño legible de conversación')
    check(await dialog().getByRole('region', { name: 'Comentarios publicados' }).getByText('Luis P.', { exact: true }).isVisible(), 'Comentarios reales aparecen junto al contenido')
    await bar().getByRole('button', { name: 'Me encanta: 1', exact: true }).click()
    await bar().getByRole('button', { name: 'Me encanta: 2', pressed: true, exact: true }).waitFor()
    check(await bar().locator('[data-reaction-celebration]').count() === 1, 'Emoji anima solo después de confirmarse')
    await bar().getByRole('button', { name: 'Me encanta: 2', pressed: true, exact: true }).click()
    await bar().getByRole('button', { name: 'Me encanta: 1', pressed: false, exact: true }).waitFor()
    check((await call(context, '/student/posts')).posts.find(item => item.id === post.id).engagement.myReaction === null, 'Tocar de nuevo el emoji retira la reacción real')
    const failurePattern = '**/api/local/student/posts/*/reaction'
    await page.route(failurePattern, route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Fallo simulado de QA.' }) }))
    await bar().getByRole('button', { name: 'Me encanta: 1', exact: true }).click()
    await bar().getByRole('status').filter({ hasText: 'No confirmamos el cambio' }).waitFor()
    check(await bar().locator('[data-reaction-celebration]').count() === 0, 'Error de guardado visible y sin éxito animado')
    await page.unroute(failurePattern)
    let release, count = 0, arrived
    const held = new Promise(resolve => { release = resolve }), received = new Promise(resolve => { arrived = resolve })
    const hold = async route => { count++; const response = await route.fetch(); arrived(); await held; await route.fulfill({ response }) }
    await page.route(failurePattern, hold)
    await bar().getByRole('button', { name: 'Bien hecho: 2', exact: true }).click(); await received
    check(await bar().getByRole('button', { name: 'Me encanta: 1', exact: true }).isDisabled(), 'Controles se bloquean mientras se guarda')
    check(count === 1 && await bar().locator('[data-reaction-celebration]').count() === 0, 'Guardar pendiente no duplica ni anticipa una reacción')
    release(); await bar().getByRole('button', { name: 'Bien hecho: 3', pressed: true, exact: true }).waitFor(); await page.unroute(failurePattern, hold)
    await close(); await pause(false); await refresh(); await open()
    check(await bar().getByRole('button', { name: 'Me encanta: 1', exact: true }).isDisabled(), 'Pausa de coordinación bloquea nuevas reacciones')
    check(await bar().getByRole('button', { name: 'Bien hecho: 3', exact: true }).isEnabled(), 'Reacción propia sigue permitiendo retirada durante la pausa')
    await bar().getByRole('button', { name: 'Bien hecho: 3', exact: true }).click()
    await bar().getByRole('button', { name: 'Bien hecho: 2', pressed: false, exact: true }).waitFor()
    check(true, 'Retirada durante la pausa persiste sin botón de texto adicional')
    await close(); await pause(true); await refresh(); await open()
    const form = dialog().getByRole('form', { name: 'Comentar en ' + title, exact: true })
    check(await form.getByRole('textbox', { name: 'Comenta como Alumno P.', exact: true }).getAttribute('rows') === '2', 'Campo de comentario compacto y con etiqueta accesible')
    await form.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()
    await dialog().getByRole('alert').waitFor()
    check(await form.getByRole('textbox').evaluate(node => node === document.activeElement), 'Comentario vacío conserva validación y foco')
    const message = `Comentario ficticio de comprobación social ${browserLabel}.`
    await form.getByRole('textbox').fill(message)
    await form.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()
    await dialog().getByRole('status').filter({ hasText: 'Enviado a revisión' }).waitFor()
    check(await dialog().getByRole('region', { name: 'Mis comentarios enviados' }).getByText(message, { exact: true }).isVisible(), 'Enviar conserva la moderación y muestra el envío privado')
    check(!(await call(context, `/student/posts/${post.id}/comments`)).items.some(item => item.body === message), 'Comentario pendiente no se añade a los publicados')
    const mine = (await call(context, `/student/posts/${post.id}/comments/mine`)).items.find(item => item.body === message)
    const review = (await call(admin, '/comments/' + mine.id)).comment
    await call(admin, `/comments/${mine.id}/approve`, 'POST', { revision: review.revision, reason: 'Comentario ficticio aprobado para la comprobación.', confirmed: true })
    await close(); await refresh()
    await story().getByRole('button', { name: 'Ver conversación de ' + title, exact: true }).click()
    await dialog().getByRole('region', { name: 'Comentarios publicados' }).getByText(message, { exact: true }).waitFor()
    check(await dialog().getByRole('button', { name: 'Conversación (4)', exact: true }).isVisible(), 'Comentario aprobado aparece en la conversación compartida')
    await dialog().getByRole('button', { name: 'Mis comentarios', exact: true }).click()
    await dialog().getByRole('button', { name: 'Retirar mi comentario', exact: true }).click()
    await dialog().getByRole('button', { name: 'Confirmar retirada', exact: true }).click()
    await dialog().getByRole('status').filter({ hasText: 'Comentario retirado' }).waitFor()
    check(!(await call(context, `/student/posts/${post.id}/comments`)).items.some(item => item.body === message), 'Retirada conserva confirmación y elimina el comentario publicado')
    await close()
    const longTitle = 'Una historia larga para compartir', longText = 'Esta es una historia ficticia de práctica y convivencia en nuestra comunidad. '.repeat(7) + 'Final de la historia completa.'
    await call(admin, '/institutional-posts', 'POST', { title: longTitle, body: longText, kind: 'story', audience: 'community', program: '', group: '', imageIds: [], showInGallery: false, highlighted: false, expiresAt: null, confirmed: true }, true)
    await refresh()
    const longPost = feed().getByRole('article', { name: longTitle, exact: true })
    check((await longPost.innerText()).length < longText.length, 'Mensaje largo se resume en el feed')
    await longPost.getByRole('button', { name: 'Ver más de ' + longTitle, exact: true }).click()
    check((await dialog().innerText()).includes('Final de la historia completa.'), 'Ver más abre el texto íntegro sin duplicar la publicación')
    await close()
    await page.getByRole('button', { name: 'Galería', exact: true }).click()
    check(await page.locator('[aria-label="Fotografías de la comunidad"] button').count() === 6, 'La galería conserva las seis fotografías')
    await page.locator('[aria-label="Fotografías de la comunidad"] button').last().click()
    await page.getByRole('button', { name: 'Ver historia y conversación', exact: true }).click()
    check(await dialog().getByRole('button', { name: 'Conversación (3)', exact: true }).isVisible(), 'Álbum abre la misma conversación con el nuevo detalle')
    await close(); await page.getByRole('button', { name: 'Inicio', exact: true }).click()
    await page.getByRole('button', { name: 'Ver más historias' }).click()
    for (const theme of ['claro', 'oscuro']) {
      await page.getByRole('button', { name: 'Modo ' + theme, exact: true }).click()
      for (const width of [1440, 768, 375, 320]) {
        await page.setViewportSize({ width, height: 1040 })
        await story().scrollIntoViewIfNeeded()
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Feed ${theme} ${width}px sin desbordamiento`)
        const row = await story().getByRole('group', { name: 'Reacciones a ' + title }).getByRole('button').evaluateAll(buttons => buttons.map(button => { const box = button.getBoundingClientRect(); return { y: box.y, height: box.height } }))
        check(row.every(item => Math.abs(item.y - row[0].y) < 1 && item.height >= 44), `Cinco emojis en una fila táctil a ${width}px ${theme}`)
        if ([1440, 375].includes(width)) { await settle(); await page.screenshot({ path: `${screenshotDir}/${browserLabel}-feed-${theme}-${width}.png` }) }
        await open()
        check(await dialog().evaluate(node => { const box = node.getBoundingClientRect(); return box.left >= 0 && box.right <= innerWidth && node.scrollWidth <= node.clientWidth }), `Detalle ${theme} ${width}px cabe en pantalla`)
        await dialog().getByRole('button', { name: 'Cerrar publicación', exact: true }).focus(); await page.keyboard.press('Shift+Tab')
        check(await dialog().evaluate(node => node.contains(document.activeElement)), `Foco contenido en diálogo ${theme} ${width}px`)
        if ([1440, 375].includes(width)) { await settle(); await page.screenshot({ path: `${screenshotDir}/${browserLabel}-detail-${theme}-${width}.png` }) }
        await close()
      }
    }
    await open(); await page.emulateMedia({ reducedMotion: 'reduce' })
    await bar().getByRole('button', { name: 'Me encanta: 1', exact: true }).click()
    await bar().getByRole('button', { name: 'Me encanta: 2', pressed: true, exact: true }).waitFor()
    check(await bar().locator('[data-reaction-celebration]').count() === 0, 'Movimiento reducido conserva reacción sin partículas')
    await bar().getByRole('button', { name: 'Me encanta: 2', exact: true }).click()
    await bar().getByRole('button', { name: 'Me encanta: 1', pressed: false, exact: true }).waitFor()
    await close()
    check(errors.length === 0, 'Sin errores JavaScript ni consola inesperados')
    return { browser: browserLabel, checks: results.length, results, errors }
  } finally { await context.close(); await admin.close() }
}
