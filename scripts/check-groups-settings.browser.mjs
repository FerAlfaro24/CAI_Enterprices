/** Catálogo y asignaciones en las pantallas originales; datos ficticios y sesiones separadas. */
export async function checkGroupsSettings(page, { email, password, browserLabel = 'Prueba', baseURL = 'http://127.0.0.1:5173' } = {}) {
  const details = [], errors = [], contexts = [], listeners = [], matrix = []
  const check = (ok, label) => { if (!ok) throw new Error(label); details.push(label) }
  const watch = target => { target.setDefaultTimeout(10_000); const listener = error => errors.push(String(error)); target.on('pageerror', listener); listeners.push([target, listener]) }
  const call = (target, route, method = 'GET', data, key) => target.evaluate(async ({ route, method, data, key }) => {
    const response = await fetch('/api/local' + route, { method, headers: { ...(data === undefined ? {} : { 'Content-Type': 'application/json' }), ...(key ? { 'Idempotency-Key': key } : {}) }, body: data === undefined ? undefined : JSON.stringify(data) })
    const body = await response.json(); if (!response.ok) throw new Error(`${route}: ${response.status} ${body.error}`); return body
  }, { route, method, data, key })
  const unique = browserLabel + Date.now(), program = 'Pruebas ' + unique, groupA = 'Sábados · 10:00', groupB = 'Viernes · 18:00', title = 'Historia ' + unique
  const studentPassword = 'Frase ficticia de grupos en navegador 2026'
  let originalSettings
  watch(page)
  const configuration = async () => {
    await page.goto(baseURL + '/admin/configuracion'); await page.getByRole('form', { name: 'Crear grupo', exact: true }).waitFor()
  }
  const login = async (target, address) => {
    await target.goto(baseURL + '/login'); await target.locator('#login-email').fill(address); await target.locator('#login-password').fill(studentPassword)
    await target.getByRole('button', { name: 'Entrar a mi espacio', exact: true }).click(); await target.getByRole('button', { name: 'Actualizar comunidad', exact: true }).waitFor()
  }
  const refreshStudent = async target => {
    const response = target.waitForResponse(response => response.url().endsWith('/api/local/catalog'))
    await target.getByRole('button', { name: 'Actualizar comunidad', exact: true }).click(); await response
    await target.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  }
  const setControl = async (name, checked) => {
    const control = page.getByRole('switch', { name, exact: true })
    if ((await control.getAttribute('aria-checked')) !== String(checked)) {
      const response = page.waitForResponse(response => response.url().endsWith('/api/local/configuration') && response.request().method() === 'PATCH')
      await control.click(); await response
      await page.getByText('Configuración guardada.', { exact: true }).waitFor()
      await page.waitForFunction(({ name, checked }) => [...document.querySelectorAll('[role=switch]')].some(control => control.getAttribute('aria-label') === name && control.getAttribute('aria-checked') === String(checked)), { name, checked })
    }
  }
  const assign = async (student, group) => {
    await page.goto(baseURL + '/admin/alumnos')
    await page.getByLabel('Buscar alumno', { exact: true }).fill(student.id)
    await page.getByRole('row').filter({ hasText: student.id }).getByRole('button', { name: /^Ficha de / }).click()
    const form = page.getByRole('form', { name: 'Asignar programa y grupo', exact: true })
    await form.getByLabel('Grupo u horario', { exact: true }).selectOption(group)
    check(await form.getByRole('button', { name: 'Guardar asignación', exact: true }).isDisabled(), 'La ficha exige confirmar los efectos de la reasignación')
    await form.getByRole('checkbox').check(); await form.getByRole('button', { name: 'Guardar asignación', exact: true }).click()
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
  }
  try {
    await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(baseURL + '/admin')
    await page.getByRole('heading', { level: 1 }).waitFor()
    if (await page.locator('#login-email').isVisible()) { await page.locator('#login-email').fill(email); await page.locator('#login-password').fill(password); await page.getByRole('button', { name: 'Entrar al panel', exact: true }).click() }
    await page.getByRole('navigation', { name: 'Secciones de administración', exact: true }).waitFor()
    originalSettings = (await call(page, '/configuration')).settings
    await configuration()
    check(await page.getByRole('switch', { name: 'Exigir autorización del tutor', exact: true }).getAttribute('aria-disabled') === 'true', 'Las reglas de privacidad protegidas no se pueden desactivar')
    check(await page.getByRole('switch', { name: 'Permitir fotografías', exact: true }).getAttribute('aria-checked') === 'false', 'Fotografías pendientes no se presentan como habilitadas')
    for (const group of [groupA, groupB]) {
      const form = page.getByRole('form', { name: 'Crear grupo', exact: true })
      await form.getByLabel('Programa', { exact: true }).fill(program); await form.getByLabel('Grupo u horario', { exact: true }).fill(group)
      await form.getByRole('button', { name: 'Crear grupo', exact: true }).click()
      await page.getByRole('button', { name: `Archivar grupo ${program}, ${group}`, exact: true }).waitFor()
    }
    const groups = (await call(page, '/configuration')).groups.filter(group => group.program === program)
    check(groups.length === 2, 'Crear grupos desde Configuración guarda el catálogo')
    const people = []
    for (const [index, group] of [groupA, groupA, groupB].entries()) {
      const context = await page.context().browser().newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }); contexts.push(context)
      const target = await context.newPage(); watch(target); await target.goto(baseURL + '/registro')
      const address = `grupos-${unique.toLowerCase()}-${index}@example.test`
      let receipt
      if (index === 0) {
        const form = target.getByRole('form')
        await form.locator('[name=filledBy][value=alumno]').check(); await form.locator('[name=firstName]').fill('Asignación'); await form.locator('[name=lastName]').fill(unique)
        await form.locator('[name=birthDate]').fill('2000-01-01'); await form.locator('[name=email]').fill(address)
        await form.locator('[name=program]').selectOption(program); await form.locator('[name=group]').selectOption(group)
        check(true, 'Registro original consulta el programa y grupo creados en el servidor')
        await form.getByRole('button', { name: 'Continuar', exact: true }).click(); await form.getByRole('button', { name: 'Continuar', exact: true }).click()
        await form.locator('[name=acceptRules]').check(); await form.locator('[name=acceptPrivacy]').check(); await form.getByRole('button', { name: 'Enviar solicitud', exact: true }).click()
        await target.getByRole('heading', { name: '¡Solicitud enviada!', exact: true }).waitFor()
        receipt = (await call(page, '/requests')).requests.find(request => request.applicant.email === address)
      } else receipt = await call(page, '/requests', 'POST', { firstName: 'Compañero', lastName: unique + index, birthDate: '2000-01-01', email: address, filledBy: 'alumno', program, group, displayName: `Compañero ${index}`, avatarColor: '#1f56d6', visibility: 'privado', message: '', guardianConsent: false, acceptRules: true, acceptPrivacy: true }, crypto.randomUUID())
      await call(page, `/requests/${receipt.id}/approve`, 'POST', { revision: receipt.revision ?? 1 })
      const student = (await call(page, '/students')).students.find(student => student.id === receipt.id)
      const invitation = await call(page, `/students/${receipt.id}/invitation`, 'POST', { revision: student.revision })
      await call(target, '/activation', 'POST', { token: invitation.path.split('token=')[1], password: studentPassword, confirm: studentPassword })
      await login(target, address); people.push({ target, address, id: student.id })
    }
    const [author, peer, nextPeer] = people
    await author.target.getByRole('button', { name: 'Compartir algo', exact: true }).first().click()
    let dialog = author.target.getByRole('dialog')
    await dialog.getByLabel('Título', { exact: true }).fill(title); await dialog.getByLabel('Tu historia', { exact: true }).fill('Historia ficticia que debe conservar su grupo original después de la asignación.')
    await dialog.getByRole('button', { name: 'Enviar a revisión', exact: true }).click(); await dialog.waitFor({ state: 'hidden' })
    await page.goto(baseURL + '/admin/publicaciones'); await page.getByRole('button', { name: `Revisar «${title}»`, exact: true }).click()
    dialog = page.getByRole('dialog'); await dialog.getByRole('checkbox').check(); await dialog.getByRole('button', { name: 'Publicar', exact: true }).click(); await dialog.waitFor({ state: 'hidden' })
    await refreshStudent(peer.target); await peer.target.getByRole('heading', { name: title, exact: true }).waitFor()
    await configuration(); await setControl('Recibir nuevas solicitudes', false)
    await nextPeer.target.goto(baseURL + '/registro'); await nextPeer.target.getByRole('heading', { name: 'Solicitudes en pausa', exact: true }).waitFor()
    check(true, 'Pausar solicitudes desde Configuración bloquea el registro original')
    await setControl('Recibir nuevas solicitudes', true)
    await nextPeer.target.reload(); await nextPeer.target.getByRole('form').waitFor(); check(true, 'Reabrir solicitudes recupera el registro y el catálogo')
    await setControl('Recibir nuevas publicaciones', false); await refreshStudent(author.target)
    check(await author.target.getByRole('button', { name: 'Compartir algo', exact: true }).first().isDisabled(), 'Pausar publicaciones deshabilita el editor y conserva la lectura')
    await setControl('Recibir nuevas publicaciones', true); await refreshStudent(author.target)
    check(await author.target.getByRole('button', { name: 'Compartir algo', exact: true }).first().isEnabled(), 'Reabrir publicaciones habilita el editor')
    await page.getByRole('button', { name: `Archivar grupo ${program}, ${groupB}`, exact: true }).click()
    await page.getByRole('button', { name: `Reactivar grupo ${program}, ${groupB}`, exact: true }).waitFor()
    const catalog = await call(nextPeer.target, '/catalog')
    check(!catalog.groups.some(group => group.program === program && group.name === groupB), 'Archivar retira el grupo de nuevas selecciones sin borrarlo')
    await login(nextPeer.target, nextPeer.address); check(true, 'Un miembro de un grupo archivado conserva su acceso')
    await page.getByRole('button', { name: `Reactivar grupo ${program}, ${groupB}`, exact: true }).click(); await page.getByRole('button', { name: `Archivar grupo ${program}, ${groupB}`, exact: true }).waitFor()
    await assign(author, groupB)
    await author.target.reload(); await author.target.getByRole('form', { name: 'Acceso de alumnos', exact: true }).waitFor(); check(true, 'Reasignar desde la ficha revoca la sesión anterior')
    await login(author.target, author.address)
    check((await call(author.target, '/student/me')).user.group === groupB, 'La misma cuenta entra con su grupo actualizado')
    await refreshStudent(peer.target); check(await peer.target.getByRole('heading', { name: title, exact: true }).count() === 0, 'El grupo anterior deja de ver la historia del alumno reasignado')
    await refreshStudent(nextPeer.target); check(await nextPeer.target.getByRole('heading', { name: title, exact: true }).count() === 0, 'La historia antigua no migra al grupo nuevo')
    check((await author.target.getByRole('region', { name: 'Mis publicaciones', exact: true }).innerText()).includes('Pendiente de revisión'), 'El autor conserva el historial con la publicación pendiente')
    await assign(author, groupA); await login(author.target, author.address)
    check(await author.target.getByRole('heading', { name: title, exact: true }).count() === 0, 'Volver al grupo anterior no republica la historia automáticamente')
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 1000 }); await configuration()
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Configuración a ${width}px sin desbordamiento`)
      await page.goto(baseURL + '/admin/alumnos'); await page.getByLabel('Buscar alumno', { exact: true }).fill(author.id)
      await page.getByRole('row').filter({ hasText: author.id }).getByRole('button', { name: /^Ficha de / }).click(); dialog = page.getByRole('dialog')
      check(await dialog.evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth), `Ficha con asignación a ${width}px sin desbordamiento`)
      await dialog.getByRole('button', { name: 'Cerrar ficha', exact: true }).click(); matrix.push({ width, views: ['configuration', 'assignment'] })
    }
    check(errors.length === 0, 'Sin errores de ejecución JavaScript en los recorridos de grupos y ajustes')
    await configuration(); await page.setViewportSize({ width: 1440, height: 1000 })
    return { browserLabel, checks: details.length, details, matrix, errors }
  } finally {
    // Restaurar controles globales incluso si falla una aserción; no eliminar datos.
    if (originalSettings) {
      const current = (await call(page, '/configuration')).settings
      if (current.registrationOpen !== originalSettings.registrationOpen || current.submissionsOpen !== originalSettings.submissionsOpen) await call(page, '/configuration', 'PATCH', { ...originalSettings, revision: current.revision })
    }
    for (const [target, listener] of listeners) target.off('pageerror', listener)
    for (const context of contexts) await context.close()
  }
}
