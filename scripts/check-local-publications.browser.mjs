/** Backend local real; perfiles ficticios. Credenciales de coordinación solo por argumento. */
async function checkLocalPublications(page, { baseURL = 'http://127.0.0.1:4180', email, password, browserLabel = 'Prueba' } = {}) {
  const checks = [], matrix = [], errors = []
  const check = (value, message) => { if (!value) throw new Error(message); checks.push(message) }
  const onError = (error) => errors.push(String(error))
  page.on('pageerror', onError)
  const unique = `${browserLabel}${Date.now()}`
  const first = `Avance ${unique}`, rejected = `Experiencia ${unique}`
  const studentEmail = `publicaciones-${unique.toLowerCase()}@example.test`
  const otherEmail = `otrogrupo-${unique.toLowerCase()}@example.test`
  const studentPassword = 'Frase ficticia para publicaciones 2026'
  const body = 'Historia ficticia: practicamos inglés y compartimos nuestros avances. <b>Este texto se muestra tal cual.</b>'
  const adminNav = () => page.getByRole('navigation', { name: 'Administración local', exact: true })
  const own = () => page.getByRole('region', { name: 'Mis publicaciones', exact: true })
  const feed = () => page.getByRole('region', { name: 'Publicaciones de mi grupo', exact: true })
  const reviewButton = (title) => page.getByRole('article', { name: title, exact: true }).getByRole('button', { name: /^Revisar publicación/ })
  const withdrawButton = (title) => own().getByRole('listitem').filter({ hasText: title }).getByRole('button', { name: /^Retirar publicación/ })
  const signInAdmin = async () => {
    await page.goto(`${baseURL}/gestion`)
    await page.getByRole('heading', { level: 1 }).waitFor()
    if (await page.locator('#local-email').isVisible()) {
      await page.locator('#local-email').fill(email)
      await page.locator('#local-password').fill(password)
      await page.getByRole('button', { name: 'Entrar al panel', exact: true }).click()
    }
    await page.getByRole('heading', { name: 'Tu trabajo pendiente', exact: true }).waitFor()
  }
  const signInStudent = async (address = studentEmail) => {
    await page.goto(`${baseURL}/alumnos`)
    await page.evaluate(async () => { await fetch('/api/local/student/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }) })
    await page.reload()
    await page.getByLabel('Correo electrónico', { exact: true }).fill(address)
    await page.getByLabel('Contraseña', { exact: true }).fill(studentPassword)
    await page.getByRole('button', { name: 'Entrar a mi espacio', exact: true }).click()
    await page.getByRole('heading', { name: /^Hola, Publicación / }).waitFor()
    await page.getByRole('navigation', { name: 'Espacio del alumno', exact: true }).getByRole('link', { name: 'Publicaciones', exact: true }).click()
    await page.getByRole('form', { name: 'Enviar publicación', exact: true }).waitFor()
  }
  const send = async (title, category) => {
    await page.getByLabel('Tipo de publicación', { exact: true }).selectOption(category)
    await page.getByLabel('Título', { exact: true }).fill(title)
    await page.getByLabel('Tu historia', { exact: true }).fill(body)
    await page.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()
    await own().getByText(title, { exact: true }).waitFor()
  }
  const openReview = async (title) => {
    await signInAdmin()
    await adminNav().getByRole('link', { name: 'Publicaciones', exact: true }).click()
    await reviewButton(title).click()
    await page.getByRole('dialog').waitFor()
  }
  const publish = async () => {
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('checkbox').check()
    await dialog.getByRole('button', { name: 'Publicar en su grupo', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
  }
  try {
    await page.bringToFront()
    await page.setViewportSize({ width: 1440, height: 1000 })
    await signInAdmin()
    const prepared = await page.evaluate(async ({ unique, studentEmail, otherEmail, studentPassword }) => {
      const api = async (path, method = 'GET', data, headers = {}) => {
        const response = await fetch(`/api/local${path}`, { method, headers: { ...headers, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: data === undefined ? undefined : JSON.stringify(data) })
        const result = await response.json()
        if (!response.ok) throw new Error(`${path}: ${response.status} ${result.error}`)
        return result
      }
      const ids = []
      for (const [address, group] of [[studentEmail, 'Mar y jue · 19:30'], [otherEmail, 'Viernes · 18:00']]) {
        const receipt = await api('/requests', 'POST', { firstName: 'Publicación', lastName: unique, birthDate: '2000-01-01', filledBy: 'alumno', email: address, program: 'Business English', group, displayName: `Publicación ${unique[0]}.`, avatarColor: '#1f56d6', visibility: 'privado', message: '', guardianConsent: false, acceptRules: true, acceptPrivacy: true }, { 'Idempotency-Key': crypto.randomUUID() })
        await api(`/requests/${receipt.id}/approve`, 'POST', { revision: 1 })
        const invitation = await api(`/students/${receipt.id}/invitation`, 'POST', { revision: 1 })
        const token = new URLSearchParams(invitation.path.split('#')[1]).get('token')
        await api('/activation', 'POST', { token, password: studentPassword, confirm: studentPassword })
        ids.push(receipt.id)
      }
      return ids
    }, { unique, studentEmail, otherEmail, studentPassword })
    check(prepared.length === 2, 'Se prepararon dos alumnos ficticios de distintos grupos')
    await signInStudent()
    await page.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()
    check(await page.getByRole('alert').filter({ hasText: 'al menos 4 caracteres' }).isVisible(), 'El formulario exige título y contenido antes de enviar')
    await send(first, 'achievement')
    check(await own().getByText('Pendiente de revisión', { exact: true }).isVisible(), 'El alumno recibe el estado pendiente')
    check(await feed().getByRole('article', { name: first, exact: true }).count() === 0, 'El grupo no ve una publicación pendiente')
    await page.reload()
    await own().getByText(first, { exact: true }).waitFor()
    check(true, 'El envío permanece después de recargar')
    await openReview(first)
    check(await page.getByRole('dialog').getByRole('button', { name: 'Publicar en su grupo', exact: true }).isDisabled(), 'Publicar exige confirmar la revisión del contenido')
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    check(await reviewButton(first).isVisible(), 'Cerrar la revisión conserva la publicación pendiente')
    await reviewButton(first).click()
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      check(await page.getByRole('dialog').evaluate((el) => el.scrollWidth <= el.clientWidth), `Revisión sin desbordamiento a ${width}px`)
      matrix.push({ page: 'revisión', width })
    }
    await publish()
    await page.goto(`${baseURL}/alumnos/publicaciones`)
    await feed().getByRole('article', { name: first, exact: true }).waitFor()
    check(await feed().getByRole('article', { name: first, exact: true }).getByText(body, { exact: true }).isVisible(), 'Publicar comparte el texto con el grupo y muestra las etiquetas HTML como texto')
    check(await feed().locator('b').count() === 0, 'El contenido del alumno no se interpreta como HTML')
    await send(rejected, 'experience')
    await openReview(rejected)
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Rechazar publicación', exact: true }).click()
    check(await dialog.getByRole('alert').filter({ hasText: 'Selecciona un motivo' }).isVisible(), 'El administrador debe explicar el rechazo')
    await dialog.getByLabel('Motivo si la rechazas', { exact: true }).selectOption({ label: 'No está relacionado con la comunidad de CAI' })
    await dialog.getByRole('button', { name: 'Rechazar publicación', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    await page.goto(`${baseURL}/alumnos/publicaciones`)
    await own().getByText(/Motivo del rechazo: No está relacionado/).waitFor()
    check(await feed().getByRole('article', { name: rejected, exact: true }).count() === 0, 'El rechazo explica el motivo al autor y no aparece en el grupo')
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Publicaciones del alumno sin desbordamiento a ${width}px`)
      matrix.push({ page: 'alumno', width })
    }
    await signInStudent(otherEmail)
    check(await feed().getByRole('article', { name: first, exact: true }).count() === 0, 'Otro grupo no puede ver la publicación aprobada')
    check(await own().getByText(first, { exact: true }).count() === 0, 'Otro alumno no ve el historial privado del autor')
    await signInStudent()
    await withdrawButton(first).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click()
    check(await feed().getByRole('article', { name: first, exact: true }).isVisible(), 'Cancelar un retiro conserva la publicación')
    await withdrawButton(first).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Sí, retirar publicación', exact: true }).click()
    await page.getByRole('dialog').waitFor({ state: 'hidden' })
    await feed().getByRole('article', { name: first, exact: true }).waitFor({ state: 'hidden' })
    check(await own().getByText('Retirada por el alumno', { exact: true }).isVisible(), 'Retirar oculta el contenido y conserva su historial')
    await signInAdmin()
    await adminNav().getByRole('link', { name: 'Publicaciones', exact: true }).click()
    await page.getByRole('button', { name: 'Retiradas', exact: true }).click()
    await reviewButton(first).click()
    check(await page.getByRole('dialog').getByRole('button', { name: 'Devolver a revisión', exact: true }).count() === 0, 'El administrador no puede volver a publicar un retiro del alumno')
    await page.keyboard.press('Escape')
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Bandeja administrativa sin desbordamiento a ${width}px`)
      matrix.push({ page: 'bandeja', width })
    }
    check(errors.length === 0, 'Sin errores de ejecución de JavaScript')
    return { browserLabel, checks: checks.length, details: checks, matrix, errors }
  } finally { page.off('pageerror', onError) }
}

export default checkLocalPublications
