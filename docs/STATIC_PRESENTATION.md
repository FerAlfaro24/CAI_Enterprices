# CAI — presentación independiente de la computadora

## Google real para la presentación — preparación del 25-11-2026

Rama `feat/demo-real-google`, desde `9cc1583` de `fix/demo-login-google`. Sustituye el selector simulado por el botón oficial de Google y una función independiente en Vercel. Las secciones anteriores sobre Google simulado describen la entrega previa y quedan superadas para esta rama.

- `api/presentation-google.ts` / `server/presentation-google.ts`: configuración pública, desafío aleatorio, verificación oficial de ID token, consulta de sesión y cierre. Solo acepta el origen HTTPS canónico `https://cai-enterprices.vercel.app`; las previews no admiten OAuth.
- Se comprueban firma, audiencia, emisor, caducidad, correo verificado y nonce ligado al navegador. Escrituras con origen exacto y JSON, desafío en cookie HttpOnly/Secure/__Host/SameSite=Strict, cuerpo limitado, cookies duplicadas rechazadas y respuestas sin caché ni datos personales.
- La sesión usa el propio token firmado por Google en cookie HttpOnly, hasta el menor de su caducidad o30 minutos desde su emisión. No hay nueva clave privada ni una base de identidades. No se escribe el correo/nombre/token en localStorage, contenido de muestra, URL o registros de aplicación.
- La barra consulta la sesión verificada en el servidor, permite cerrar Google y mantiene Página principal/Alumno/Coordinación/Reiniciar. Las cuentas ficticias siguen disponibles. Identificarse con Google NO crea una inscripción, aprobación de alumno o permiso administrativo real.
- Solo las llamadas de identificación usan la nueva función; registro, publicaciones y panel siguen siendo muestras independientes por navegador. SMTP y base escolar permanecen fuera de este despliegue. Las contraseñas de muestra no viajan al servidor.

Pruebas realizadas antes de publicar:11 pruebas nuevas de servidor,48 comprobaciones de interfaz (24 Brave+24 Opera GX) y39 de regresión general Brave; tipos/build/lint correctos. Interfaz ensayada con SDK/verificador sustituidos, explícitamente NO como evidencia de Google real. Se comprobaron1440/768/375/320 y capturas móvil/escritorio. La compilación conectada separada no incluye el adaptador, endpoint o credenciales ficticias. No se abrió ninguna base escolar.

Pendiente de esta entrega: autorizar el origen en el cliente Google institucional, desplegar/promover la rama y ejecutar una prueba real de Google en el dominio público. No afirmar que ya está operativo por pasar las fixtures.

Referencias: [verificación oficial de Google](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [funciones de Vercel](https://vercel.com/docs/functions/functions-api-reference). No se añaden dependencias, facturación ni servicios de correo.



## Actualización del acceso, 25-11-2026

El usuario pidió conservar los atajos inferiores y recuperar el inicio de sesión original para presentar también Google. Rama `fix/demo-login-google`, desde `39816de` de la muestra pública anterior.

- `/login` vuelve a mostrar correo, contraseña, mostrar/ocultar clave y enlaces habituales.
- `/login?cuenta=admin` permite mostrar el formulario administrativo aunque la muestra tenga una sesión ficticia abierta.
- Los atajos Página principal, Alumno, Coordinación y Reiniciar se mantienen.
- Cuentas **públicas y exclusivamente ficticias**: alumno `alumno@example.test`, coordinación `admin@example.test`; ambas usan `CaiDemo2026`. La ayuda permite rellenarlas. No son accesos del sistema real ni secretos.
- El botón Continuar con Google abre una **simulación identificada de CAI**, sin SDK, cuentas, tokens o permisos reales de Google. Elegir Alumno de muestra lleva a comunidad. No presentarlo como prueba de autenticación real en Vercel; la conexión real sigue comprobada solo en la fixture local documentada en GOOGLE_EMAIL.
- El adaptador comprueba las credenciales ficticias, rechaza valores incorrectos y descarta el texto de contraseña sin guardarlo. No acepta JWT reales en el recorrido simulado.

Pruebas nuevas:23 checks Brave y23 Opera GX,46 en total, sobre la muestra compilada local. Formularios de ambos roles, rechazo de clave incorrecta, mostrar clave, entrada con cuentas ficticias, atajos, simulación Google/cancelación/foco, tamaños1440/768/375/320 y ausencia de errores o solicitudes a API/Google. Tipos/build/lint correctos; compilación real separada sin adaptador, clave ficticia o selector simulado. Capturas escritorio/móvil revisadas. Guion: `scripts/check-presentation-login.browser.mjs`. Las cifras del cierre público inicial más abajo conservan su corte anterior.

Icono original descargado de [Google](https://developers.google.com/static/identity/images/g-logo.png), siguiendo su [referencia visual](https://developers.google.com/identity/branding-guidelines); no se modificó el logo ni el componente de Google real.

Se repitió además el recorrido general actualizado en Brave:39 checks correctos sobre registro/revisión, publicaciones/carrusel, comentarios, fotos, Retos, Logros y reinicio. No se repitió el backend ni la autenticación real de Google.

**Publicado y verificado el25-11:** código `2515bf7`, [PR#39](https://github.com/FerAlfaro24/CAI_Enterprices/pull/39). La sesión de Vercel disponible permitió promover la vista previa y observar **Ready** en [el despliegue público actualizado](https://vercel.com/feralfaro24/cai-enterprices/DkyQ8r71eXSy14mgC4jG996xRpLU), sin fusionar ramas ni cambiar main. Se dejó abierto [el login público](https://cai-enterprices.vercel.app/login) con formulario, Google de muestra y atajos.

**23 comprobaciones públicas nuevas en Brave**, todas correctas, sobre ese origen HTTPS sin cuenta de Vercel: cuentas ficticias de ambos roles, credenciales incorrectas, mostrar clave, no persistir contraseñas, simulación Google/cancelación/foco, conservación de atajos y tamaños1440/768/375/320. Cero errores JS/consola y cero solicitudes a API/SDK/OAuth de Google. Esto acredita la simulación publicada; no es autenticación real de Google en Vercel.

## Versión y propósito

Rama `demo/v1-vercel-presentation`, desde `c1bf677` de `fix/v1-vercel-navigation`, que conserva la integrada `04bb0df` y F1–F6. Presentación ficticia autorizada por el usuario el25-11: variada, sin servidor local y con cambios independientes por navegador. La versión conectada continúa en `integration/cai-v1-completa-2026-11-25`; no fusionar este modo en ella o main como si fuera producción.

Vercel usa `npm run build:presentation` en esta rama y sirve únicamente dist. Los enlaces directos se resuelven con la configuración de navegación de PR#37. El acceso compartido debe crearse para esta rama; el enlace compartido anterior de la integrada no concede acceso automáticamente a una rama distinta.

## Cómo explorarla

- Portada en `/`; comunidad directamente en `/community`; coordinación en `/admin`.
- La barra inferior identifica la presentación y permite cambiar de área o reiniciar con confirmación.
- `/login` ofrece el formulario original con credenciales ficticias y un recorrido Google simulado; los atajos inferiores permiten explorar alumno/coordinación directamente.
- Registro admite solo datos ficticios: las solicitudes se guardan en ese navegador y se revisan desde su propio panel.
- Reacciones, comentarios inmediatos y borrado propio; fotos y visor; notificaciones; perfiles; Logros privados con imágenes; Retos actuales con aciertos/errores, puntos, repaso e insignias.
- Coordinación puede revisar solicitudes/publicaciones y crear publicaciones normales o avisos que aparecen en el carrusel.

Los datos se guardan en localStorage bajo `cai-presentation-v1`. Borrar el almacenamiento del sitio o confirmar Reiniciar restaura la muestra. Un navegador nuevo empieza con el contenido inicial; no recibe lo que otra persona publique. No existe autenticación ni autorización real en este modo. Usar solo contenido ficticio.

## Material y datos

`seed.json` contiene90 respuestas de ejemplo, generadas a partir de una fixture nueva de `community-showcase-server --client-presentation`, más ejemplos ficticios de lectura, música y series. Hay once personajes de alumnos y solicitudes de muestra; el Inicio añade una publicación propia, reacciones/comentarios y ejemplos de notificaciones. Se reutilizan las pantallas actuales, no la demo histórica de octubre.

Las imágenes privadas de convivencias/cumpleaños y sus blobs no se exportan: se sustituyeron las referencias por las cuatro fotografías oficiales que ya estaban autorizadas para la página pública. No hay bases, cookies, contraseñas, credenciales de Google/SMTP ni archivos de .local en el paquete. Las imágenes añadidas por el visitante permanecen en su navegador y pueden alcanzar su cuota de almacenamiento; el guardado falla con explicación si no caben.

Google, envíos de correo, contraseñas/equipo reales y edición de expedientes no se simulan. Algunas acciones administrativas avanzadas muestran un mensaje indicando que no están incluidas; no afirman cambios inexistentes. Este adaptador no mide permisos, seguridad ni entrega de correos de producción. No implementar Top ni vídeos por esta presentación.

## Separación de la aplicación real

`import.meta.env.MODE === 'presentation'` activa el adaptador únicamente al compilar. Un parámetro de URL no puede habilitarlo. `npm run build` conserva la aplicación conectada y se comprobó que sus JS compilados excluyen los marcadores, datos y adaptador de esta presentación. Ningún cambio de servidor, base, sesiones reales o dependencias.

Los módulos de presentación se cargan por importación dinámica: `store.ts` conserva datos, fechas y renovación de Retos; `community.ts` simula la actividad del alumno; `admin.ts` las operaciones administrativas; `requests.ts` enlaza esos comportamientos con el contrato actual; `PresentationTools.tsx` aporta entradas/controles. Las llamadas desconocidas fallan de forma explícita y nunca recurren a fetch.

## Comprobaciones realizadas

- `npm.cmd run build:presentation`: tipos y compilación correctos.
- `npm.cmd run lint`: correcto.
- Compilación conectada separada, sin marcadores de datos/adaptador ficticios; no se ejecutó su backend habitual.
- **39 comprobaciones finales en Brave y39 en Opera GX:78**, con contextos aislados; sin errores de JavaScript/consola y cero solicitudes a API local.
- Inicio/avisos; reacción y persistencia al recargar; comentario y eliminación propia; independencia entre navegadores; notificación normal archivada al cerrar; foto cargada y ampliada; resultado erróneo distinguible; tres respuestas con35 puntos para dos aciertos; insignia nueva y ausencia de repetición al recargar.
- Logro privado con imagen y palabras opcionales; registro/aprobación en el mismo navegador; publicación de un aviso y aparición en carrusel; once pantallas administrativas navegables; acceso sin contraseña; reinicio con confirmación.
- Sin desbordamientos en1440/768/375/320. Capturas de escritorio/móvil revisadas. Guion reproducible: `scripts/check-static-presentation.browser.mjs`; resultados/capturas locales en .local/tests.

Durante las pruebas se corrigió el formato de fecha de las solicitudes ficticias para ajustarlo al contrato del panel. Los primeros intentos del guion también ajustaron esperas de render y selección del visor; los78 anteriores corresponden a las tandas finales completas, no a los intentos fallidos. No repetir la suite histórica de servidor para sumar cifras: el backend no cambió.

## Despliegue público verificado

Código `22e8a88`, [PR#38 en borrador](https://github.com/FerAlfaro24/CAI_Enterprices/pull/38). Vercel terminó de compilar y su bot informó **Ready** el25-11 para [este despliegue](https://vercel.com/feralfaro24/cai-enterprices/7WQBt8cEdgbZDoyhQREZf8E5j74C). El servidor ficticio utilizado para generar los datos ya fue detenido; su fixture se conserva.

**Cierre público del25-11-2026:** tras la activación del titular, [la portada](https://cai-enterprices.vercel.app/), [comunidad](https://cai-enterprices.vercel.app/community), [coordinación](https://cai-enterprices.vercel.app/admin) y login se abrieron directamente con HTTP200 desde un contexto Brave nuevo, sin cuenta ni enlace privado de Vercel. Se observó la barra de presentación y el contenido actual. El prototipo antiguo del enlace habitual fue sustituido por la muestra ficticia; no se fusionaron main o la integrada.

Se ejecutó además el guion completo contra ese origen HTTPS: **39 comprobaciones públicas nuevas en Brave**, todas correctas, sin errores de JavaScript/consola y cero solicitudes a API local. Incluye registro/revisión, publicación de aviso/carrusel, reacciones, comentarios/borrado, imagen ampliada, Logros con imagen, Retos/resultados/insignia, independencia entre navegadores, recarga, reinicio y tamaños1440/768/375/320. Las78 comprobaciones Brave/Opera anteriores siguen siendo locales; no afirmar que Opera se repitió sobre el despliegue público.

Los servidores locales de exportación y de vista previa están cerrados; resultados y capturas se conservaron. Se puede compartir el enlace público con la computadora apagada. Cada navegador modifica su propia muestra; Google/correos/seguridad de producción y servicios persistentes reales siguen fuera de este despliegue.
