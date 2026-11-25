# CAI — presentación independiente de la computadora

## Google real publicado en Vercel — 25-11-2026

Rama `feat/demo-real-google` / [PR#40](https://github.com/FerAlfaro24/CAI_Enterprices/pull/40), desde `9cc1583`; código funcional `5968483` y corrección de compilación NodeNext `3d1dc1e`. [Inicio de sesión público](https://cai-enterprices.vercel.app/login), [despliegue Ready](https://vercel.com/feralfaro24/cai-enterprices/5hSXkEPQnvfpv6pRAhzjX2iJhATY). Promovido sin fusionar ramas ni cambiar main/release/integrada; sin servicios de pago nuevos. El origen fue autorizado expresamente por el titular y guardado en el cliente institucional, conservando localhost. La verificación adicional solicitada por Vercel se completó; sus códigos no se guardan en archivos.

**Prueba real completada:** botón oficial de Google → selector oficial → cuenta institucional → retorno a `/community` → estado «Cuenta de Google verificada» obtenido del servidor. El estado volvió a aparecer al recargar; se comprobó el cierre mediante «Salir de Google». No se sustituyó el SDK ni el verificador en este recorrido. Al terminar quedó abierto el login público y la sesión de CAI usada para esta prueba quedó cerrada. No se cerró globalmente la cuenta Google del titular.

**Pruebas públicas nuevas,16 en Brave:** función/configuración JSON200, sesión anónima, respuestas sin caché, rechazo de origen ajeno, desafío real/cookie segura, rechazo de JWT falso por el verificador real, SDK oficial visible, tamaños1440/375/320, cuenta ficticia/contenido variado y ausencia de errores JavaScript. No se usó otra cuenta personal para probar OAuth. Las11 pruebas de servidor,48 UI con proveedor sustituido (24 Brave+24 Opera GX) y39 de regresión general son la tanda local anterior de esta misma entrega, separada de la autenticación real. Tipos/build/lint correctos; compilación conectada sin adaptador demo. Vista previa local4816 cerrada.

**Qué es real:** únicamente la identificación Google. `api/presentation-google.ts` usa la biblioteca oficial para firma/audiencia/emisor/caducidad, correo verificado y nonce del navegador. POST requiere origen exacto/JSON; cuerpo limitado y cookies duplicadas rechazadas. Desafío de5 minutos en cookie __Host/Secure/HttpOnly/SameSite=Strict. La sesión conserva el token firmado en cookie HttpOnly hasta su caducidad o30 minutos desde emisión; no usa nuevas claves privadas. API sin caché y sin devolver correo/nombre/token al contenido de muestra. Las previews rechazan OAuth: usar siempre el dominio canónico.

**Qué sigue siendo ficticio:** inscripción, aprobación, alumno mostrado, coordinación, publicaciones, comentarios y progreso permanecen independientes por navegador. Entrar con Google no concede permisos escolares ni crea una matrícula real. Los atajos y cuentas ficticias se conservan; la cuenta institucional no se copia a los perfiles ni al localStorage de la comunidad. Las contraseñas de muestra no salen del navegador. SMTP y la base escolar no están desplegados en esta presentación.

No volver a implementar el selector Google simulado ni pedir nuevamente autorización del origen. Pendiente para el sistema definitivo: alojamiento persistente del backend/base/archivos, dominio definitivo, correo y configuración institucional de producción, rotación privada prevista y aceptación de CAI. No fusionar el modo de presentación como backend de producción. Top pendiente del cliente.

Referencias: [verificación de Google](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [funciones Vercel](https://vercel.com/docs/functions/functions-api-reference). Solo se solicitan scopes básicos openid/email/profile: [Google documenta la excepción de usuarios de prueba para este acceso básico](https://support.google.com/cloud/answer/15549945?hl=en). No se cambió el estado público de la aplicación ni se añadieron permisos de Gmail; no se comprobó OAuth con otras cuentas o políticas de Workspace.

## Actualización del acceso, 25-11-2026

**Antecedente: este selector simulado quedó sustituido por Google real en la entrega superior.**

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
- `/login` ofrece el formulario original con credenciales ficticias y acceso real de Google a la presentación; los atajos inferiores permiten explorar alumno/coordinación directamente.
- Registro admite solo datos ficticios: las solicitudes se guardan en ese navegador y se revisan desde su propio panel.
- Reacciones, comentarios inmediatos y borrado propio; fotos y visor; notificaciones; perfiles; Logros privados con imágenes; Retos actuales con aciertos/errores, puntos, repaso e insignias.
- Coordinación puede revisar solicitudes/publicaciones y crear publicaciones normales o avisos que aparecen en el carrusel.

Los datos se guardan en localStorage bajo `cai-presentation-v1`. Borrar el almacenamiento del sitio o confirmar Reiniciar restaura la muestra. Un navegador nuevo empieza con el contenido inicial; no recibe lo que otra persona publique. No existe autenticación ni autorización real en este modo. Usar solo contenido ficticio.

## Material y datos

`seed.json` contiene90 respuestas de ejemplo, generadas a partir de una fixture nueva de `community-showcase-server --client-presentation`, más ejemplos ficticios de lectura, música y series. Hay once personajes de alumnos y solicitudes de muestra; el Inicio añade una publicación propia, reacciones/comentarios y ejemplos de notificaciones. Se reutilizan las pantallas actuales, no la demo histórica de octubre.

Las imágenes privadas de convivencias/cumpleaños y sus blobs no se exportan: se sustituyeron las referencias por las cuatro fotografías oficiales que ya estaban autorizadas para la página pública. No hay bases, cookies exportadas, contraseñas o credenciales privadas de Google/SMTP ni archivos de .local en el paquete. El ID público del cliente Google se configura expresamente en la función. Las imágenes añadidas por el visitante permanecen en su navegador y pueden alcanzar su cuota de almacenamiento; el guardado falla con explicación si no caben.

Google, envíos de correo, contraseñas/equipo reales y edición de expedientes no se simulan. Algunas acciones administrativas avanzadas muestran un mensaje indicando que no están incluidas; no afirman cambios inexistentes. Este adaptador no mide permisos, seguridad ni entrega de correos de producción. No implementar Top ni vídeos por esta presentación.

## Separación de la aplicación real

`import.meta.env.MODE === 'presentation'` activa el adaptador únicamente al compilar. Un parámetro de URL no puede habilitarlo. `npm run build` conserva la aplicación conectada y se comprobó que sus JS compilados excluyen los marcadores, datos y adaptador de esta presentación. La base y el backend escolar no cambian. Esta rama añade únicamente la función y sesión independiente de identificación Google descrita arriba, sin nuevas dependencias.

Los módulos de presentación se cargan por importación dinámica: `store.ts` conserva datos, fechas y renovación de Retos; `community.ts` simula la actividad del alumno; `admin.ts` las operaciones administrativas; `requests.ts` enlaza esos comportamientos con el contrato actual; `PresentationTools.tsx` aporta entradas/controles. Las llamadas desconocidas fallan de forma explícita; solo las operaciones de identificación Google y cierre usan la función independiente de Vercel.

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

Los servidores locales de exportación y de vista previa están cerrados; resultados y capturas se conservaron. Se puede compartir el enlace público con la computadora apagada. Cada navegador modifica su propia muestra. Este cierre inicial precede a Google real, añadido y comprobado en la entrega superior; correos, permisos escolares y servicios persistentes reales continúan fuera de este despliegue.

## Seis publicaciones ilustradas — 25-11-2026

`feat/demo-community-content`, desde `f4e1f90`, mejora solo el contenido de presentación: logros de música (Here Comes the Sun, The Beatles), lectura (Matilda), series, conversación/vocabulario y un álbum de clase. Todas las seis tarjetas iniciales tienen imágenes; dos comentarios específicos por publicación, y dos avisos prácticos sin fechas, precios ni horarios inventados. La canción y el libro enlazan a sus sitios oficiales en tarjeta y diálogo, sin copiar letras ni ofrecer audio descargado.

Portadas: Abbey Road (2019 Mix), obtenida de la ficha pública de Apple Music mediante iTunes Search, https://music.apple.com/us/album/abbey-road-2019-mix/1474815798; Matilda, https://images.penguinrandomhouse.com/cover/9780142410370. Referencias: https://www.thebeatles.com/here-comes-sun-2019-mix y https://www.penguinrandomhouse.com/books/319178/matilda-by-roald-dahl-illustrated-by-quentin-blake/9780142410370/. Obras y portadas pertenecen a sus titulares; uso de referencia en la muestra solicitada. Las otras fotos proceden de los materiales públicos previos de CAI, no de fotografías privadas nuevas.

`content.ts` y `PublicationReference.tsx` conservan esta selección separada del producto conectado. `contentRevision` actualiza los ejemplos por sus IDs en muestras ya guardadas, manteniendo las sesiones, nuevas publicaciones y comentarios del visitante. No exige reiniciar. No modifica Google, base escolar o permisos.

Validación breve solicitada: tipos/build y lint; Brave confirma las seis imágenes cargadas, comentarios contextuales, enlace oficial tanto en tarjeta como diálogo y tamaños1440/375 sin errores JS. Capturas revisadas. No se repiten suites de backend/OAuth/Opera. Publicación pendiente.
