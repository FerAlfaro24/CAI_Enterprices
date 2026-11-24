# Presentación remota protegida de CAI

## Entrada pública temporal — 23 de noviembre de 2026

El usuario autorizó quitar la contraseña adicional. La portada, registro y pantallas de acceso son públicas; comunidad, expediente, administración y fotografías privadas siguen requiriendo su cuenta y permisos. El modo predeterminado del lanzador mantiene Basic; `--open-entry` lo desactiva explícitamente para esta prueba autorizada.

Se detuvo únicamente el proceso remoto anterior y se reanudó **la misma copia** con `npm.cmd run demo:remote -- --resume --open-entry`. El enlace cambió; cuentas, claves individuales, solicitudes, fotos y vencimiento original se conservaron. No se ejecutó la creación de otra base ni la renovación de contraseñas. Reanudar una ventana vencida se rechaza. Detener primero la instancia temporal que se vaya a reemplazar; nunca reiniciar servicios habituales. Antes de compartir, consultar los metadatos locales y probar el renderizado.

La ventana termina el **24-11-2026 a las 19:35, Ciudad de México**. La computadora debe permanecer encendida y conectada. URL e instrucciones actualizadas solo en metadatos y carpeta privada; no en Git. Vercel y producción definitiva siguen sin cambios.

Verificación nueva: **13 pruebas de entrada correctas**, incluidos modos protegido/abierto, origen, archivos internos, proxy y vencimiento; **33 comprobaciones HTTPS en Brave sin credenciales Basic**: 17 del registro completo y 16 de portada, cuenta anterior, seis fotos y rechazo de datos privados para visitantes. Tipos y ESLint correctos. La cuenta sintética CAI-0013 quedó suspendida al concluir. No se repitió la matriz general ni compatibilidad Opera: no se cambió la interfaz.

Comprobadores reutilizables: `scripts/check-open-preview.browser.mjs` y `scripts/check-remote-registration.browser.mjs`; reciben accesos únicamente en ejecución privada. El segundo omite Basic cuando los metadatos indican `entryMode: open`.


**19-11-2026 · rama `feat/v1-remote-demo`, desde `d7ef781` de PR #14.** Solicitud del usuario: mostrar desde otra ubicación la comunidad actual con fotos oficiales e interacciones ficticias, sin contratar aún el alojamiento definitivo.

## Prueba con amigos — 23 de noviembre de 2026

Nueva activación **autorizada expresamente** para un máximo de 24 horas, con Cloudflare, contraseña de entrada, las seis fotos oficiales y datos/cuentas ficticios. Código de administración actual `e255f91`, base documental `cbf9a41` de PR #23; registro en `test/v1-friends-remote-2026-11-23`. Los resultados del 19-11 de abajo son históricos y su URL ya venció.

Se creó una fixture nueva sin la bandera de QA administrativa y una copia remota independiente con esquema 20, frontend compilado, origen HTTPS productivo y cookies seguras. La instalación habitual y las muestras locales anteriores se conservaron. El ejecutable portátil existente se contrastó con su SHA-256 ya verificado; no se instaló un servicio ni se modificó configuración del sistema.

Nueve cuentas ficticias de alumnos, del mismo grupo, tienen contraseñas individuales renovadas **solo en la copia remota**. La cuenta del anfitrión y la administrativa se conservan separadas. Los accesos se reparten por persona: no enviar la lista completa al grupo ni compartir la contraseña administrativa. Hay dos accesos consecutivos: contraseña de entrada del navegador y cuenta de alumno dentro de la aplicación. Google/correo reales no son necesarios para este recorrido.

**Comprobado ahora:** build; **11 pruebas de la entrada/proxy**; **24 comprobaciones HTTPS reales en Brave**, con dos contextos de alumnos distintos y un contexto administrativo. Incluyen protección anónima, cookie segura, login de dos cuentas del mismo grupo, reacción guardada en una y recibida automáticamente en otra, retirada también sincronizada, fotos completas/galería de seis, doble autorización de imágenes, 1440/375/320 sin desbordamiento, recarga, archivos privados bloqueados, panel más reciente, retos sin responder y consola sin errores inesperados. La reacción de comprobación quedó retirada. No se repitieron hoy las matrices completas de administración/comunidad ni la prueba HTTPS histórica de Opera.

El refresco compartido existente consulta aproximadamente cada 15 segundos; no se implementaron WebSockets ni se quitó la moderación. Publicaciones y comentarios nuevos necesitan aprobación. No se han probado todavía los teléfonos y redes reales de los amigos; esa es la siguiente validación humana.

URL, vencimiento exacto, PID y carpeta privados están en `.local/tests/remote-demo-latest.json`; los archivos `acceso-privado.json`, `ACCESOS-PARA-AMIGOS.txt` y `SOLO-PARA-TI-ADMIN.txt` viven en la carpeta privada indicada, fuera de Git. El archivo de amigos contiene datos para repartir individualmente; el segundo archivo es solo del anfitrión. No copiar esos contenidos a documentación pública.

Verificador reproducible: `scripts/check-friends-preview.browser.mjs`, recibe `access` desde la ficha privada y `filesDir` de un directorio ignorado. La función requiere la copia ficticia y la cuenta Camila del seeder existente. La URL y las contraseñas nunca forman parte del verificador versionado. La computadora debe permanecer encendida/conectada; detener el proceso o perder el túnel corta el acceso y el máximo de 24 horas se aplica automáticamente. No reiniciar implícitamente ni extender esta autorización. Los datos de la copia se conservan al detenerla.

## Registro propio de amigos — 23 de noviembre de 2026

El usuario eligió que sus amigos creen sus propias cuentas para comprobar el alta completa. El punto de entrada es `/registro`, con la misma protección y ventana temporal autorizadas. No se reinició el túnel, cambió su origen o renovó el vencimiento. Las cuentas preasignadas anteriores no son necesarias para este recorrido; sus datos se conservaron.

Recorrido vigente: cada persona envía una solicitud; coordinación la revisa/aprueba en Solicitudes; desde Alumnos → Ficha → Resumen y acceso prepara el enlace privado; el destinatario abre `/activar#token=…`, elige su propia contraseña y entra con el correo de la solicitud. No se envían correos automáticos ni se usa Google real. Para verse como compañeros de prueba, elegir el mismo programa/grupo. Los menores mantienen el requisito de autorización del tutor.

Se corrigieron textos de `SignupPage`, `SignupForm` y `LocalInvitationDialog`: el formulario conectado explica aprobación/activación y los enlaces ya no afirman funcionar solo en el equipo anfitrión. Sin cambios de permisos, validación, contraseña mínima, esquema o API. El frontend compilado de la copia vigente se actualizó agregando recursos con hash y sustituyendo el índice al final; conserva los recursos anteriores para sesiones abiertas, además de la base y credenciales existentes. La copia del índice anterior queda fuera del directorio servido. No se publica Vite ni se actualizan las bases habituales.

**Pruebas realmente ejecutadas:** 24 API dirigidas de cuentas/alineación Google simulada; lint/tipos/build; **17 comprobaciones HTTPS reales en Brave**, con alta de una persona ficticia nueva, llegada de solicitud al panel, estado pendiente, aprobación, enlace del dominio compartido, texto correcto, contraseña elegida por el visitante, token retirado de la dirección, login, identidad/grupo y sesión tras recargar; 375/320 sin desbordamiento y sin errores JS/consola inesperados. La cuenta sintética de verificación se suspendió al terminar. No confundir esos datos de QA con solicitudes de los amigos. No se ha comprobado Google/correo real ni los dispositivos físicos de amigos.

Verificador `scripts/check-remote-registration.browser.mjs`: recibe accesos privados por argumento, usa solo una cuenta nueva `@example.test` y conserva el historial. Instrucciones actualizadas en los archivos privados `REGISTRO-PARA-AMIGOS.txt`, `ACCESOS-PARA-AMIGOS.txt` y `SOLO-PARA-TI-ADMIN.txt`; la lista de cuentas anteriores queda archivada localmente. No incluir URL, claves o enlaces de activación en Git. No reenviar cuentas preasignadas como instrucciones del alta propia.

## Estado comprobado

- Implementados `server/preview-gateway.ts` y `scripts/remote-demo.mjs`; comando `npm.cmd run demo:remote`.
- **11 resultados correctos** del nuevo verificador `node --test server/tests/preview-gateway.test.ts`: diez subcasos y su contenedor. Entrada cerrada antes de configurar, contraseña en todas las rutas/recursos/API, origen/protocolo/IP, rutas profundas, bloqueo de fuentes/mapas/datos, cabeceras y cookies conservadas, escritura de otro origen, límites y vencimiento.
- Tipos, ESLint, build, sintaxis del lanzador y diff check correctos. No son una repetición de las 233 pruebas API ni de las matrices de Inicio y Galería anteriores.
- Ejecutable portátil oficial de Cloudflare descargado en `.local/tools/cloudflared.exe`, versión 2026.11.1; SHA-256 contrastado con el digest de la publicación oficial. No se instaló servicio ni se cambió configuración del sistema.
- **Activación autorizada expresamente por el usuario:** Cloudflare/trycloudflare.com, máximo 24 horas, contraseña nueva, seis fotografías oficiales y copia de cuentas/conversaciones ficticias. La revisión automática rechazó inicialmente el destino no confirmado; se pidió y recibió la autorización específica antes de activar. Vercel no se modificó. El estado concreto de la última URL y vencimiento vive en `.local/tests/remote-demo-latest.json`, fuera de Git.

## Recorrido real comprobado tras activar

**54 comprobaciones HTTPS: 27 Brave y 27 Opera GX**, en perfiles aislados, sobre el enlace real de la copia vigente. Acceso anónimo rechazado; acceso de alumno y de coordinación; cookies reales Secure/HttpOnly/SameSite Strict/__Host; foto del carrusel; conversación con tres comentarios; guardar/quitar reacción; seis fotos cargadas; doble autorización de imágenes; tamaños 1440/768/375/320; recarga de ruta profunda; API del mismo origen; fuentes/datos bloqueados y consola sin errores. Capturas de escritorio/móvil revisadas; resultados y pruebas con fotos privadas se conservan en `.local/tests/remote-demo-*`, fuera de Git. No se modificaron los datos originales.

Al repetir la preparación se detectó que el desafío normal de Basic sin cabecera Authorization consumía el límite de contraseñas fallidas. Se corrigió para contar solo contraseñas enviadas e incorrectas, se añadió la regresión (35 desafíos normales seguidos y acceso correcto) y pasaron de nuevo los 11 resultados. Se cerró exclusivamente la primera copia remota, se conservaron sus datos y se creó una URL nueva con claves nuevas. Las 54 comprobaciones anteriores corresponden a esa segunda copia y al código corregido. No entregar la primera URL.

La autorización permite un máximo de 24 horas: la copia vigente al cierre vence el **20-11-2026 a las 13:55, hora de Ciudad de México**, o antes si el proceso/conexión termina. La URL y los accesos no se registran en Git. Cada nuevo inicio requiere comprobar el contexto/autorización y entregar de nuevo el enlace y las claves. La aceptación del cliente, dispositivo/red reales del usuario y despliegue definitivo siguen pendientes.

## Separación y protección

La página pública antigua `https://cai-enterprices.vercel.app/` sigue separada. En la inspección del 19-11 mostraba el prototipo anterior; navegación interna hacia la demo histórica funcionaba, pero las aperturas directas de `/community`, `/login` y API devolvían 404. La vista previa automática de PR #14 existía, pero redirigía al acceso de Vercel. Ninguna equivale a la presentación completa local.

El lanzador solo acepta la fixture identificada como presentación en `.local/tests/community-showcase-latest.json`, dentro de `community-showcase-*`, con cuentas `@example.test` y sin identidades Google. Abre esa fuente en solo lectura y utiliza backup consistente de SQLite. Nunca abre ni cambia `.local/cai.sqlite` ni detiene los servicios habituales o la presentación local de 4187.

Crea otra copia y frontend compilado bajo `.cai-demo-privada/presentacion-*`, carpeta hermana del repositorio dentro del espacio de trabajo autorizado y fuera de Git. Renueva contraseñas, elimina sesiones/invitaciones/tokens **solo en la copia nueva** y exige el preflight productivo existente con esquema 18. Las imágenes se conservan en SQLite y requieren la autorización de alumno/administrador, además de la contraseña de entrada. No hay fotos privadas en `dist`, `public` o GitHub.

La entrada temporal publica únicamente el frontend compilado y `/api/local/*`, detrás de autenticación HTTP Basic sobre HTTPS. No publica Vite, fuentes, mapas, SQLite o directorios del proyecto. El backend escucha solo en loopback, conserva política productiva de origen y cookies Secure/HttpOnly/__Host; el intermediario fija Host/protocolo/IP y no reenvía su contraseña a la API. Las respuestas no se almacenan en caché y piden no indexación. El HTML indica que las cuentas y conversaciones son ficticias y que no se introduzcan datos reales.

Cloudflare actúa como intermediario del tráfico HTTPS, incluidas las fotos cuando se visualizan. Es una presentación temporal protegida, no un despliegue aprobado para alumnos reales. Solo compartir URL y claves con las personas autorizadas para la presentación.

## Iniciar, abrir y detener

1. Obtener autorización específica del usuario para el intermediario y el material. No reintentar una activación rechazada sin esa respuesta.
2. Tener el paquete privado oficial, dependencias y la fixture de [presentación local](COMMUNITY_HOME_STORIES.md). El ejecutable portátil se obtiene de las [descargas oficiales de Cloudflare](https://developers.cloudflare.com/tunnel/downloads/), verificando el digest del release. Mantenerlo en `.local/tools`, fuera de Git.
3. Comprobar Git y ejecutar `npm.cmd run build`. Después, `npm.cmd run demo:remote`. No cambia la instalación ni Vercel; cada ejecución genera copia, claves y URL distintas.
4. El proceso informa URL y ubicación de `acceso-privado.json`; las contraseñas no se imprimen en logs ni se guardan en documentación. Metadatos sin contraseñas en `.local/tests/remote-demo-latest.json`. La configuración vacía y entorno limitado de cloudflared evitan adoptar la cuenta/configuración personal.
5. Abrir la URL HTTPS desde otro navegador/dispositivo. Primero introducir usuario/clave de entrada; después usar el acceso de alumno de la copia. `/admin` utiliza su propia clave administrativa de la misma ficha privada. Comprobar portada, ingreso, Inicio, seis fotos, comentarios/reacciones, rutas directas/recarga, móvil/escritorio y consola; confirmar también rechazo sin clave.
6. Mantener equipo encendido y conectado. La URL caduca al cerrar el proceso, al perder el túnel o a las 24 horas como máximo. Ctrl+C detiene túnel, entrada y API de esa copia; los datos se conservan. No borrar nada implícitamente. El navegador puede recordar el acceso Basic durante esa sesión; detener el proceso invalida todo acceso remoto.

La [documentación oficial de Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/) indica que las URLs son temporales, cambian al recrear el túnel y no tienen garantía de disponibilidad. El dominio definitivo, alojamiento persistente, correo/Google y aceptación de CAI siguen pendientes para la entrega final.

Contrato de cabeceras contrastado con [Cloudflare HTTP headers](https://developers.cloudflare.com/fundamentals/reference/http-headers/): la IP del cliente procede de CF-Connecting-IP, se valida su formato y se sobrescribe X-Forwarded-For hacia Node; no se adopta la lista enviada por el visitante.
