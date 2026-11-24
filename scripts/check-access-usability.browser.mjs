/** Solo fixtures sintéticas de revisión; no emplear cuentas o bases habituales. */
export async function checkAccessUsability(page, { baseURL, email, password, filesDir, browserLabel = 'brave' }) {
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(baseURL) || !email.endsWith('@example.test')) throw Error('Se requiere una fixture local ficticia.')
  const browser = page.context().browser(), contexts = [], results = [], errors = [], requests = []
  const check = (ok, label) => { if (!ok) throw Error(label); results.push(label) }
  const create = async () => { const c = await browser.newContext({ locale: 'es-MX', viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }); contexts.push(c); return c }
  const api = async (c, path, method = 'GET', data, headers = {}) => {
    const r = await c.request.fetch(baseURL + '/api/local' + path, { method, data, headers: { Origin: baseURL, ...headers } })
    if (!r.ok()) throw Error(path + ' HTTP ' + r.status())
    return r.json()
  }
  try {
    const admin = await create(), student = await create(), other = await create()
    await api(admin, '/auth/login', 'POST', { email, password })
    check((await api(admin, '/auth/session')).user.role === 'admin', 'La contraseña administrativa anterior sigue funcionando')
    const group = (await api(student, '/catalog')).groups.find(g => g.name !== 'Por asignar')
    const tag = Date.now() + '-' + browserLabel, studentEmail = 'acceso-' + tag + '@example.test'
    const payload = { firstName: 'Alumna', lastName: 'Prueba', birthDate: '2000-01-01', filledBy: 'alumno', email: studentEmail, program: group.program, group: group.name, displayName: 'Alumna P.', avatarColor: '#1f56d6', visibility: 'privado', message: '', guardianConsent: false, acceptRules: true, acceptPrivacy: true }
    const setup = await student.newPage(); await setup.goto(baseURL + '/login')
    const key = await setup.evaluate(() => crypto.randomUUID()); await setup.close()
    const receipt = await api(student, '/requests', 'POST', payload, { 'Idempotency-Key': key })
    await api(admin, '/requests/' + receipt.id + '/approve', 'POST', { revision: 1 })
    const record = (await api(admin, '/students')).students.find(s => s.id === receipt.id)
    const invitation = await api(admin, '/students/' + receipt.id + '/invitation', 'POST', { revision: record.revision })
    const target = await student.newPage(); target.setDefaultTimeout(15000)
    target.on('pageerror', e => errors.push(e.message)); target.on('console', m => { if (m.type() === 'error') errors.push(m.text()) }); target.on('request', r => { if (r.method() === 'POST') requests.push(new URL(r.url()).pathname) })
    await target.goto(baseURL + invitation.path)
    let form = target.getByRole('form', { name: 'Activar cuenta de alumno', exact: true }); await form.waitFor()
    const first = () => target.getByLabel('Nueva contraseña', { exact: true }), confirm = () => target.getByLabel('Confirma tu contraseña', { exact: true }), status = () => target.locator('#activation-password-match')
    check(new URL(target.url()).hash === '', 'El enlace privado se retira de la dirección')
    check((await first().getAttribute('minlength')) === '8' && (await first().getAttribute('maxlength')) === '128', 'El formulario aplica el rango 8–128')
    check(await form.getByText('Usa de 8 a 128 caracteres. No necesitas números ni símbolos.', { exact: true }).isVisible(), 'La regla explica que no exige números ni símbolos')
    check((await status().innerText()) === '', 'La confirmación no muestra errores antes de escribir')
    await first().fill('abcdefgh')
    await target.getByRole('button', { name: 'Mostrar nueva contraseña', exact: true }).click()
    check(await first().getAttribute('type') === 'text' && await confirm().getAttribute('type') === 'password', 'Mostrar la primera contraseña no descubre la confirmación')
    check(await target.getByRole('button', { name: 'Ocultar nueva contraseña', exact: true }).getAttribute('aria-pressed') === 'true', 'El control informa su estado accesible')
    await target.getByRole('button', { name: 'Ocultar nueva contraseña', exact: true }).click()
    await first().focus(); await target.keyboard.press('Tab')
    check(await target.getByRole('button', { name: 'Mostrar nueva contraseña', exact: true }).evaluate(e => e === document.activeElement), 'El control es accesible con teclado')
    await target.keyboard.press('Space'); check(await first().getAttribute('type') === 'text', 'El teclado permite mostrar la contraseña')
    await target.getByRole('button', { name: 'Ocultar nueva contraseña', exact: true }).click()
    await confirm().fill('ponmlkji')
    check((await status().innerText()).includes('todavía no coinciden') && await confirm().getAttribute('aria-invalid') === 'true', 'El desacuerdo se anuncia al escribir y marca el campo')
    await form.getByRole('button', { name: 'Activar mi cuenta', exact: true }).click()
    check(await form.getByRole('alert').innerText() === 'Las contraseñas no coinciden.' && requests.length === 0, 'Confirmación distinta no envía la contraseña al servidor')
    await confirm().fill('abcdefgh')
    check(await status().innerText() === 'Las contraseñas coinciden.' && await form.getByRole('alert').count() === 0, 'Corregir confirmación actualiza el aviso y retira el error anterior')
    await first().fill('abcdEfgh'); check((await status().innerText()).includes('todavía no coinciden'), 'Editar la primera contraseña también revalida la coincidencia')
    await first().fill('abcdefg'); await confirm().fill('abcdefg')
    check(!await first().evaluate(e => e.checkValidity()), 'Siete caracteres se rechazan antes del envío')
    await first().fill('        '); await confirm().fill('        ')
    await form.getByRole('button', { name: 'Activar mi cuenta', exact: true }).click()
    check((await form.getByRole('alert').innerText()).includes('8 a 128') && requests.length === 0, 'Solo espacios no activa ni consume el enlace')
    await confirm().fill(''); check(await status().innerText() === '', 'Vaciar confirmación retira el aviso de coincidencia')
    await first().fill('abcdefgh'); await confirm().fill('abcdefgh')
    await target.getByRole('button', { name: 'Mostrar confirmación', exact: true }).click()
    check(await confirm().getAttribute('type') === 'text' && await first().getAttribute('type') === 'password', 'La confirmación tiene su propio control de visibilidad')
    await target.getByRole('button', { name: 'Ocultar confirmación', exact: true }).click()
    for (const theme of ['Modo claro', 'Modo oscuro']) {
      await target.getByRole('button', { name: theme, exact: true }).click()
      for (const width of [1440, 768, 375, 320]) {
        await target.setViewportSize({ width, height: 1000 })
        check(await target.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Activación sin desbordamiento: ' + theme + ', ' + width)
      }
      await target.setViewportSize({ width: theme === 'Modo claro' ? 1440 : 375, height: 1000 })
      if (filesDir) await target.screenshot({ path: filesDir + '/' + browserLabel + '-activation-' + (theme === 'Modo claro' ? 'desktop' : 'mobile') + '.png', fullPage: true, mask: [first(), confirm()] })
    }
    const guard = await other.newPage()
    for (const route of ['/activar-administracion', '/recuperar-administracion']) {
      await guard.goto(baseURL + route + '#token=' + 'a'.repeat(64))
      const field = guard.getByLabel('Nueva contraseña', { exact: true }); await field.waitFor()
      check(await field.getAttribute('minlength') === '15', 'Administración conserva mínimo15 en ' + route)
      await field.fill('abcdefgh'); await guard.getByLabel('Confirma tu contraseña', { exact: true }).fill('abcdefgh')
      check(!await field.evaluate(e => e.checkValidity()), 'Administración rechaza ocho caracteres en ' + route)
      await guard.getByRole('button', { name: 'Mostrar nueva contraseña', exact: true }).click()
      check(await field.getAttribute('type') === 'text', 'El control visual también funciona en ' + route)
    }
    let release, entered
    const held = new Promise(resolve => { release = resolve }), observed = new Promise(resolve => { entered = resolve })
    await target.route('**/api/local/activation', async route => { entered(); await held; await route.continue() })
    await form.getByRole('button', { name: 'Activar mi cuenta', exact: true }).click(); await observed
    try {
      check(await first().isDisabled() && await confirm().isDisabled(), 'Durante el guardado se bloquean ambos campos')
      check(await target.getByRole('button', { name: 'Mostrar nueva contraseña', exact: true }).isDisabled() && await target.getByRole('button', { name: 'Mostrar confirmación', exact: true }).isDisabled(), 'Los controles de visibilidad se bloquean durante el envío')
    } finally { release() }
    await target.getByRole('heading', { name: 'Tu acceso está listo', exact: true }).waitFor(); await target.unroute('**/api/local/activation')
    check(requests.filter(p => p.endsWith('/activation')).length === 1, 'La activación real envía una sola solicitud')
    check(await target.locator('input[type=password],input[name=password],input[name=confirm]').count() === 0, 'El formulario y las contraseñas se retiran al terminar')
    await api(student, '/student/login', 'POST', { email: studentEmail, password: 'abcdefgh' })
    check((await api(student, '/student/me')).user.id === receipt.id, 'La cuenta entra con ocho letras sin números')
    await api(student, '/recovery/request', 'POST', { email: studentEmail })
    const notice = (await api(admin, '/notices')).notices.find(n => n.recipient === studentEmail && n.kind === 'recovery')
    const recovery = await api(admin, '/notices/' + notice.id + '/preview', 'POST', {})
    await target.goto(baseURL + recovery.path)
    form = target.getByRole('form', { name: 'Cambiar contraseña de alumno', exact: true }); await form.waitFor()
    check(await first().getAttribute('minlength') === '8' && new URL(target.url()).hash === '', 'Recuperación usa mínimo8 y retira su token de la dirección')
    await first().fill('ijklmnop'); await confirm().fill('ijklmnop')
    check(await status().innerText() === 'Las contraseñas coinciden.', 'Recuperación confirma coincidencia sin enviar')
    for (const width of [1440, 375, 320]) { await target.setViewportSize({ width, height: 1000 }); check(await target.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Recuperación sin desbordamiento a ' + width) }
    await form.getByRole('button', { name: 'Guardar nueva contraseña', exact: true }).click()
    await target.getByRole('heading', { name: 'Contraseña actualizada', exact: true }).waitFor()
    check((await student.request.get(baseURL + '/api/local/student/me')).status() === 401, 'Recuperar revoca la sesión anterior')
    check((await student.request.post(baseURL + '/api/local/student/login', { headers: { Origin: baseURL }, data: { email: studentEmail, password: 'abcdefgh' } })).status() === 401, 'La contraseña sustituida ya no permite entrar')
    await api(student, '/student/login', 'POST', { email: studentEmail, password: 'ijklmnop' })
    check((await api(student, '/student/me')).user.id === receipt.id, 'La contraseña nueva de ocho letras permite entrar')
    await guard.goto(baseURL + '/activar'); await guard.getByRole('alert').waitFor()
    check(await guard.getByRole('form').count() === 0, 'Sin enlace válido no se muestran campos para activar')
    check((await api(admin, '/auth/session')).user.role === 'admin', 'Los cambios de alumno no alteran la sesión administrativa')
    check(errors.length === 0, 'Recorridos sin errores de consola o JavaScript: ' + errors.join('; '))
    return { checks: results.length, results, errors }
  } finally { await Promise.allSettled(contexts.map(c => c.close())) }
}
