/**
 * Browser regression using an existing Playwright page (Brave automation tool).
 * No Playwright package is added to the application. The host supplies `page`.
 * Run with browser_run_code_unsafe({ filename: absolutePathToThisFile }).
 * The file is a function expression input for that tool, not a Node CLI test.
 */
async function checkCommunityComposer(page, { baseURL = 'http://127.0.0.1:5173', screenshotDir } = {}) {
  let checks = 0
  const check = (condition, message) => { if (!condition) throw new Error(message); checks += 1 }
  await page.goto(`${baseURL}/community`)
  await page.getByRole('button', { name: 'Compartir algo', exact: true }).click()
  const dialog = page.getByRole('dialog')
  const title = dialog.getByRole('textbox', { name: 'Título', exact: true })
  const body = dialog.getByRole('textbox', { name: 'Tu historia de muestra', exact: true })
  const gallery = dialog.getByRole('group', { name: 'Imágenes ilustrativas', exact: true })
  const messageCount = () => dialog.getByText(/de al menos (4|10) caracteres\./).count()
  const capture = async (name) => {
    if (!screenshotDir) return
    await page.waitForTimeout(150)
    await dialog.screenshot({ path: `${screenshotDir}/${name}.png` })
  }
  check(await messageCount() === 0, 'No se muestran errores antes del primer envío')
  await dialog.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()
  check(await title.getAttribute('aria-invalid') === 'true' && await body.getAttribute('aria-invalid') === 'true', 'Envío vacío marca ambos campos')
  check(await title.evaluate((element) => document.activeElement === element), 'El foco va al primer campo inválido')
  await capture('02-formulario-invalido')
  const oldTitleError = await title.getAttribute('aria-describedby')
  await title.fill('abc')
  check(await title.getAttribute('aria-invalid') === 'true', 'Tres caracteres aún son inválidos')
  await title.fill('Paso')
  check(await title.getAttribute('aria-invalid') === 'false' && await body.getAttribute('aria-invalid') === 'true', 'Corrección parcial elimina solo el error del título')
  check(await title.evaluate((element, oldId) => !document.getElementById(oldId) && !element.hasAttribute('aria-describedby'), oldTitleError), 'Se eliminan mensaje y referencia obsoletos')
  await body.fill('123456789')
  check(await body.getAttribute('aria-invalid') === 'true', 'Nueve caracteres aún son inválidos')
  await body.fill('1234567890')
  check(await body.getAttribute('aria-invalid') === 'false', 'El mínimo exacto de historia elimina su error sin otro envío')
  await title.fill('abc')
  check(await title.getAttribute('aria-invalid') === 'true', 'Una nueva edición inválida recupera el error')
  await title.fill('Un pequeño paso para revisar Inicio')
  await body.fill('Publicación completamente ficticia para probar la aprobación después del rediseño.')
  check((await body.inputValue()).length === 82 && await messageCount() === 0, 'Regresión de captura 11: los valores corregidos de 35/82 caracteres no mantienen errores')
  check(await dialog.locator('input[aria-invalid="true"],textarea[aria-invalid="true"]').count() === 0, 'Ningún campo válido conserva el estado visual inválido')
  check(await title.getAttribute('maxlength') === '100' && await body.getAttribute('maxlength') === '1200', 'Límites HTML conservados')
  await dialog.getByLabel('Categoría', { exact: true }).selectOption('gallery')
  check(await gallery.getAttribute('aria-invalid') === 'true', 'Galería requiere imagen')
  await dialog.getByRole('checkbox', { name: 'Biblioteca', exact: true }).check()
  check(await gallery.getAttribute('aria-invalid') === 'false', 'Seleccionar imagen elimina su error')
  await dialog.getByRole('checkbox', { name: 'Biblioteca', exact: true }).uncheck()
  check(await gallery.getAttribute('aria-invalid') === 'true', 'Retirar última imagen vuelve a validar')
  await dialog.getByLabel('Categoría', { exact: true }).selectOption('experience')
  check(await gallery.getAttribute('aria-invalid') === 'false', 'Cambiar categoría elimina error de imágenes innecesario')
  await capture('03-formulario-corregido')
  await dialog.getByRole('button', { name: 'Enviar a revisión', exact: true }).click()
  check(await page.getByRole('dialog').count() === 0, 'Envío válido cierra el formulario')
  const submissions = page.getByRole('region', { name: 'Estado de tus publicaciones demo' })
  check((await submissions.innerText()).includes('Pendiente de revisión'), 'Publicación enviada a moderación simulada')
  check(await page.locator('[aria-label="Feed de publicaciones ficticias"]').getByText('Un pequeño paso para revisar Inicio', { exact: true }).count() === 0, 'Pendiente aún no aparece en el feed')
  return { checks, status: 'correcto', bodyLength: 82 }
}
