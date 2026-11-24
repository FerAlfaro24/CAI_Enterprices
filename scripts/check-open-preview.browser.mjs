export async function checkOpenPreview(browser, access) {
  const base = access.origin, results = [], contexts = []
  const check = (ok, label) => { if (!ok) throw Error(label); results.push(label) }
  const create = async () => { const c = await browser.newContext({ locale: 'es-MX' }); contexts.push(c); return c }
  try {
    const anonymous = await create(), member = await create()
    for (const path of ['/', '/registro', '/login', '/admin']) {
      const response = await anonymous.request.get(base + path)
      check(response.status() === 200 && !response.headers()['www-authenticate'], 'Entrada libre sin Basic: ' + path)
    }
    for (const path of ['/student/me', '/student/gallery', '/requests']) {
      const response = await anonymous.request.get(base + '/api/local' + path)
      check(response.status() === 401 && !response.headers()['www-authenticate'], 'Datos privados requieren cuenta: ' + path)
    }
    const person = await anonymous.newPage()
    await person.goto(base + '/')
    await person.getByRole('heading', { name: 'Habla inglés con confianza y abre nuevas oportunidades', exact: true }).waitFor()
    check((await person.locator('main').innerText()).length > 100, 'La portada pública se renderiza sin pantalla en blanco')
    await person.goto(base + '/community')
    await person.getByLabel('Correo electrónico', { exact: true }).waitFor()
    check(new URL(person.url()).pathname === '/login', 'Comunidad pide la cuenta propia')
    const login = await member.request.post(base + '/api/local/student/login', { headers: { Origin: base }, data: access.student })
    check(login.ok(), 'La contraseña anterior del alumno sigue funcionando')
    const gallery = await (await member.request.get(base + '/api/local/student/gallery')).json()
    check(gallery.images.length === 6, 'Se conservan las seis fotos privadas')
    const p = await member.newPage(); await p.goto(base + '/community')
    await p.getByRole('heading', { name: 'Tu comunidad, al día.', exact: true }).waitFor()
    await p.getByRole('navigation', { name: 'Secciones de comunidad' }).getByRole('button', { name: 'Galería', exact: true }).click()
    const img = p.getByRole('button', { name: /^Ver foto / }).first().locator('img')
    await img.evaluate(e => e.decode())
    const imageUrl = new URL(await img.getAttribute('src'), base).href
    check((await member.request.get(imageUrl)).status() === 200 && (await anonymous.request.get(imageUrl)).status() === 401, 'La foto carga para el alumno y se rechaza para visitantes')
    for (const path of ['/.git/config', '/.local/cai.sqlite', '/server/app.ts']) check((await anonymous.request.get(base + path)).status() === 404, 'Archivo interno cerrado: ' + path)
    const noOrigin = await anonymous.request.post(base + '/api/local/student/login', { data: access.student })
    check(noOrigin.status() === 403, 'Se conserva la protección de origen en escrituras')
    return { checks: results.length, results }
  } finally { await Promise.allSettled(contexts.map(c => c.close())) }
}
