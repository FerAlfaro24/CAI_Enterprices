/** Galería oficial con archivos ficticios y sesiones aisladas. No borra registros. */
export async function checkPrivateGallery(page, {
  email, password, browserLabel = 'Prueba', baseURL = 'http://127.0.0.1:5173', fixturePath,
} = {}) {
  const details = [], errors = [], contexts = [], listeners = [], matrix = []
  const check = (ok, label) => { if (!ok) throw new Error(label); details.push(label) }
  const watch = target => {
    target.setDefaultTimeout(10_000)
    const listener = error => errors.push(String(error))
    target.on('pageerror', listener); listeners.push([target, listener])
  }
  const call = (target, route, method = 'GET', data, key) => target.evaluate(async ({route, method, data, key}) => {
    const response = await fetch('/api/local' + route, {method, headers: {
      ...(data === undefined ? {} : {'Content-Type': 'application/json'}), ...(key ? {'Idempotency-Key': key} : {}),
    }, body: data === undefined ? undefined : JSON.stringify(data)})
    const body = await response.json()
    if (!response.ok) throw new Error(`${route}: ${response.status} ${body.error}`)
    return body
  }, {route, method, data, key})
  const status = (target, path) => target.evaluate(async path => (await fetch(path)).status, path)
  const login = async (target, account, secret) => {
    await target.bringToFront(); await target.goto(baseURL + '/login')
    await target.locator('#login-email').fill(account); await target.locator('#login-password').fill(secret)
    await target.getByRole('button', {name: 'Entrar a mi espacio', exact: true}).click()
    await target.getByRole('button', {name: 'Actualizar comunidad', exact: true}).waitFor()
  }
  const gallery = async target => {
    await target.bringToFront()
    await target.getByRole('button', {name: 'Galería', exact: true}).click()
    await target.getByRole('heading', {name: 'Así se vive CAI', exact: true}).waitFor()
  }
  const unique = browserLabel + Date.now(), title = 'Recuerdo ficticio ' + unique
  const reference = 'Permiso ficticio interno ' + unique, secret = 'Contraseña ficticia galería 2026'
  watch(page)
  try {
    await page.bringToFront(); await page.setViewportSize({width: 1440, height: 1000}); await page.goto(baseURL + '/admin')
    await page.getByRole('heading', {level: 1}).waitFor()
    if (await page.locator('#login-email').isVisible()) {
      await page.locator('#login-email').fill(email); await page.locator('#login-password').fill(password)
      await page.getByRole('button', {name: 'Entrar al panel', exact: true}).click()
    }
    await page.getByRole('navigation', {name: 'Secciones de administración', exact: true}).waitFor()
    const groups = (await call(page, '/configuration')).groups.filter(group => group.active && group.program === 'Business English' && group.name !== 'Por asignar')
    check(groups.length > 1, 'Hay dos grupos activos para verificar el aislamiento')
    const pages = []
    for (let i = 0; i < 3; i++) {
      const context = await page.context().browser().newContext({viewport: {width: 1440, height: 1000}, reducedMotion: 'reduce'})
      contexts.push(context); const target = await context.newPage(); watch(target); pages.push(target)
    }
    const [student, outsider, visitor] = pages
    await visitor.goto(baseURL + '/login')
    for (const [target, group, index] of [[student, groups[0], 0], [outsider, groups[1], 1]]) {
      await target.goto(baseURL + '/login')
      const account = `galeria-${unique.toLowerCase()}-${index}@example.test`
      const receipt = await call(page, '/requests', 'POST', {
        firstName: 'Alumno', lastName: unique + index, birthDate: '2000-01-01', email: account,
        filledBy: 'alumno', program: group.program, group: group.name, displayName: `Galería ${index}`,
        avatarColor: '#1f56d6', visibility: 'privado', message: '', guardianConsent: false, acceptRules: true, acceptPrivacy: true,
      }, crypto.randomUUID())
      await call(page, `/requests/${receipt.id}/approve`, 'POST', {revision: 1})
      const record = (await call(page, '/students')).students.find(item => item.id === receipt.id)
      const invitation = await call(page, `/students/${record.id}/invitation`, 'POST', {revision: record.revision})
      await call(target, '/activation', 'POST', {token: invitation.path.split('token=')[1], password: secret, confirm: secret})
      await login(target, account, secret)
    }
    await page.bringToFront(); await page.goto(baseURL + '/admin/galeria')
    await page.getByRole('heading', {name: 'Galería privada', exact: true}).waitFor()
    const form = page.getByRole('form', {name: 'Publicar imagen privada', exact: true})
    check(await form.getByRole('button', {name: 'Publicar imagen', exact: true}).isDisabled(), 'Publicar exige revisión explícita')
    await form.getByLabel('Imagen JPEG o PNG', {exact: true}).setInputFiles({name: 'no-es-imagen.png', mimeType: 'image/png', buffer: Buffer.from('Archivo ficticio sin imagen')})
    await form.getByLabel('Título', {exact: true}).fill(title)
    await form.getByLabel('Descripción', {exact: true}).fill('Imagen ficticia de prueba sin personas ni datos reales.')
    await form.getByLabel('Texto alternativo', {exact: true}).fill('Rectángulo azul ficticio de prueba')
    await form.getByLabel('Programa destinatario', {exact: true}).selectOption(groups[0].program)
    await form.getByLabel('Grupo destinatario', {exact: true}).selectOption(groups[0].name)
    await form.getByLabel('Referencia de autorización', {exact: true}).fill(reference)
    const confirmation = form.getByRole('checkbox')
    await confirmation.check(); await form.getByLabel('Categoría', {exact: true}).selectOption('events')
    check(!(await confirmation.isChecked()), 'Modificar destinatarios o metadatos exige revisar otra vez')
    await confirmation.check(); await form.getByRole('button', {name: 'Publicar imagen', exact: true}).click()
    await form.getByRole('alert').waitFor()
    check((await form.getByLabel('Título', {exact: true}).inputValue()) === title, 'Una imagen falsa es rechazada sin perder el formulario')
    await form.getByLabel('Imagen JPEG o PNG', {exact: true}).setInputFiles(fixturePath)
    await confirmation.check()
    const keys = [], pattern = '**/api/local/gallery'
    const loseResponse = async route => {
      if (route.request().method() !== 'POST') return route.continue()
      keys.push(route.request().headers()['idempotency-key'])
      if (keys.length === 1) { await route.fetch(); await route.abort('failed') } else await route.continue()
    }
    await page.route(pattern, loseResponse)
    await form.getByRole('button', {name: 'Publicar imagen', exact: true}).click(); await form.getByRole('alert').waitFor()
    check((await form.getByLabel('Título', {exact: true}).inputValue()) === title && (await form.locator('input[type=file]').evaluate(input => input.files.length)) === 1, 'Perder la respuesta conserva datos y archivo')
    await form.getByRole('button', {name: 'Publicar imagen', exact: true}).click(); await form.getByRole('status').waitFor()
    await page.unroute(pattern, loseResponse)
    check(keys.length === 2 && keys[0] === keys[1], 'Reintentar conserva la clave y evita imágenes duplicadas')
    const images = (await call(page, '/gallery')).images.filter(image => image.title === title)
    check(images.length === 1 && images[0].status === 'publicada', 'La imagen se guarda una sola vez con revisión administrativa')
    const image = images[0], row = page.locator(`[data-image-id="${image.id}"]`)
    await row.waitFor(); await page.reload(); await page.locator(`[data-image-id="${image.id}"]`).waitFor()
    check(true, 'Imagen y referencia privada persisten al recargar administración')
    check(await status(visitor, image.imagePath) === 401, 'No se puede descargar la imagen sin sesión')
    check(await status(outsider, image.imagePath) === 404, 'Otro grupo no puede descargar por URL directa')
    check((await call(outsider, '/student/gallery')).images.every(item => item.id !== image.id), 'Otro grupo no recibe el registro en su galería')
    const own = (await call(student, '/student/gallery')).images.find(item => item.id === image.id)
    check(own && !JSON.stringify(own).includes(reference) && !('authorizationReference' in own), 'El alumno recibe solo metadatos públicos sin referencia interna')
    await student.bringToFront(); await student.getByRole('button', {name: 'Actualizar comunidad', exact: true}).click(); await gallery(student)
    const card = student.getByRole('button', {name: `Explorar álbum: ${title}`, exact: true})
    await card.waitFor()
    check((await student.locator('img[src^="/api/local/gallery/"]').count()) >= 1, 'La galería original muestra imágenes privadas y sus tarjetas')
    check(!(await student.getByRole('button', {name: 'Compartir foto', exact: true}).count()), 'La sesión conectada no ofrece subidas simuladas de alumnos')
    check(!(await student.locator('img[src*="unsplash"]').count()), 'No se mezcla el grupo real con fotografías de la demostración')
    await student.getByRole('group', {name: 'Filtrar álbumes', exact: true}).getByRole('button', {name: 'Logros', exact: true}).click()
    check(!(await card.count()), 'El filtro de categoría usa los registros conectados')
    await student.getByRole('group', {name: 'Filtrar álbumes', exact: true}).getByRole('button', {name: 'Todas las fotos', exact: true}).click()
    await student.getByLabel('Orden de álbumes', {exact: true}).selectOption('oldest')
    await card.click(); let dialog = student.getByRole('dialog'); await dialog.waitFor()
    check(await dialog.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), 'El visor original carga la imagen privada procesada')
    check((await dialog.innerText()).includes('Equipo CAI') && !(await dialog.innerText()).includes('Escenario ficticio'), 'El visor usa editor y fecha del registro, sin atribuirlo a un alumno ficticio')
    check(!(await dialog.getByRole('button', {name: 'Ver publicación y conversación', exact: true}).count()), 'No se muestran conversaciones que aún no están conectadas')
    await student.keyboard.press('Escape'); await dialog.waitFor({state: 'hidden'})
    check(await card.evaluate(button => document.activeElement === button), 'Cerrar con Escape devuelve el foco a la tarjeta')
    for (const width of [1440, 768, 375, 320]) {
      await page.bringToFront(); await page.setViewportSize({width, height: 1000})
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Administración de imágenes a ${width}px sin desbordamiento`)
      await student.bringToFront(); await student.setViewportSize({width, height: 1000})
      check(await student.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Galería original a ${width}px sin desbordamiento`)
      await card.click(); dialog = student.getByRole('dialog'); await dialog.waitFor()
      check(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth), `Visor de imagen a ${width}px sin desbordamiento`)
      await student.getByRole('button', {name: 'Cerrar álbum', exact: true}).click()
      matrix.push({width, views: ['admin-gallery', 'student-gallery', 'album-dialog']})
    }
    await student.setViewportSize({width: 1440, height: 1000}); await card.click(); await student.getByRole('dialog').waitFor()
    await page.bringToFront(); await page.setViewportSize({width: 1440, height: 1000})
    await row.getByRole('button', {name: `Retirar imagen ${title}`, exact: true}).click()
    await row.getByRole('button', {name: 'Cancelar', exact: true}).click()
    check((await call(page, '/gallery')).images.find(item => item.id === image.id).status === 'publicada', 'Cancelar la retirada conserva la publicación')
    await row.getByRole('button', {name: `Retirar imagen ${title}`, exact: true}).click()
    await row.getByRole('button', {name: 'Confirmar retirada', exact: true}).click(); await row.waitFor({state: 'hidden'})
    check(await status(student, image.imagePath) === 404 && await status(page, image.imagePath) === 404, 'Retirar revoca los bytes para alumnos y administración')
    await student.bringToFront(); await student.evaluate(() => window.dispatchEvent(new Event('focus')))
    await student.getByRole('dialog').waitFor({state: 'hidden'}); await card.waitFor({state: 'hidden'})
    check(true, 'Actualizar la comunidad retira también el visor que estaba abierto')
    await page.bringToFront(); await page.getByRole('button', {name: /^Retiradas/}).click(); await row.waitFor()
    check(!(await row.locator('img').count()) && !(await row.getByRole('button', {name: /Retirar imagen/}).count()), 'La imagen retirada conserva historial sin volver a descargarla ni republicarla')
    check(errors.length === 0, 'Sin errores de ejecución JavaScript en el recorrido')
    return {browserLabel, checks: details.length, details, matrix, errors}
  } catch (error) {
    throw new Error(`${error.message}\nComprobaciones completadas: ${details.length}\n${details.join('\n')}`)
  } finally {
    for (const [target, listener] of listeners) target.off('pageerror', listener)
    for (const context of contexts) await context.close()
  }
}
