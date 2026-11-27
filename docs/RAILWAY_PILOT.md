# CAI — piloto gratuito en Railway

**Validación nueva — 27-11:** [Informe de pruebas](PILOT_VALIDATION_2026-11-27.md): 361 servidor y196 comprobaciones UI en recorridos completos; publicador con59 comprobaciones previas a límites/intermitencia del guion, detalle y límites registrados. En Railway: contraseña administrativa inicial rechazada, CAI-0003 ficticia registrada/aprobada y correo de activación recibido en el mismo buzón institucional. Formulario abierto; falta que el titular elija contraseña para continuar el recorrido remoto. Corregidos textos antiguos de registro/correo. No repetir permisos, bootstrap o configuración; no aprobar CAI-0001. Mínimo administrativo8 sigue pospuesto. Aviso de privacidad final pendiente de CAI.

**Estado vigente — 26-11:** Google y Gmail reales activos. Registro Google → aprobación → correo recibido → comunidad comprobados con fixture institucional CAI-0002. Recuperación administrativa completada manualmente por el titular y nueva entrada al panel comprobada. Configuración de correo aplicada en despliegue `4a5bc403-66f6-442d-a112-a2eeba98ee89`; los estados anteriores de abajo son antecedentes. Vercel/datos habituales conservados.

## Cierre de Google, Gmail y administración — 26-11

### Permisos y archivos

El titular autorizó explícitamente descargar/usar ambos archivos, conceder gmail.send, guardar la autorización privada e instalarla en cai-piloto, enviar pruebas solo a caiadministrador@gmail.com y leer únicamente los mensajes de prueba de hoy en ese buzón. No repetir esas confirmaciones; no extenderlas a otros destinatarios o mensajes. La aplicación CAI no recibió scope de lectura de Gmail.

La descarga Blob no devolvió archivo recuperable. Se guardaron copias equivalentes mediante controles de UI y un formulario local protegido en loopback, sin imprimir su contenido: `.local/railway-private-2026-11-26/desktop-client.json`, `initial-admin-password.txt` y autorización `gmail.json`. JSON validado para el cliente de escritorio existente y remitente/origen exactos. ACL propietario/SYSTEM; los tres archivos están ignorados por Git. No crear otro cliente ni volver a pedir la contraseña compartida de SMTP.

Asistente OAuth existente ejecutado realmente: PKCE/state, cuenta y scopes comprobados; autorización guardada y transporte.verify correcto sin correo. Se instaló CAI_GMAIL_CONFIG_JSON mediante el panel de Railway con permiso explícito. Servicio activo y API de correo enabled:true/adminEnabled:true. Archivo `/data/railway-gmail.json` comprobado con modo600 y propietario UID1000. Auxiliares temporales locales detenidos; verificación de seis puertos utilizados confirmó cero listeners.

### Pruebas nuevas en el alojamiento

- Acceso administrativo real en IAB y Brave aislado; bandeja y sesión conservadas al recargar. Datos de CAI-0002 creados en IAB aparecieron también en Brave: backend compartido, sin afirmar dos dispositivos físicos.
- Fixture CAI-0002 «Prueba Institucional», datos ficticios identificados como prueba, clase Inglés y cuenta institucional real con Google. Pendiente antes de aprobación; aprobada exclusivamente esa fixture; acceso a comunidad mediante Google comprobado y ficha con Cuenta activada. CAI-0001/example.test sigue pendiente: no enviar correo a esa dirección.
- Aviso «Tu solicitud de CAI fue aprobada» aceptado en ficha y recibido en Recibidos de Gmail institucional. Botón Entrar con Google apunta al origen canónico /login y abre la página de acceso. Registro/aprobación/correo/entrada Google completos.
- Recuperación administrativa solicitada una vez para la misma cuenta. «Recupera tu acceso a CAI» recibido también en Recibidos; enlace privado al origen canónico /recuperar-administracion con token válido en formato. Abre Elige tu nueva contraseña. No se cambió contraseña, ni se probó todavía su sustitución, clave anterior inválida o uso único completo. El enlace vence15 minutos después de emitirse; si venció, solicitar otro cuando el titular esté listo.
- API /ready200; archivos /data/railway-gmail.json, /railway-gmail.json, /initial-admin-password.txt y /.local/railway-private-2026-11-26/gmail.json404; alumnos401 sin sesión. No se mostraron secretos en esos endpoints.
- Respaldo actualizado y verificado en Linux como UID1000: esquema23,2 solicitudes,1 alumno,0 cuentas de contraseña,0 publicaciones y0 imágenes. Cero cuentas de contraseña es coherente con el acceso Google ya activado. La copia incluye SQLite, no archivos de credenciales Gmail. Copia externa y restauración hospedada siguen pendientes.
- Se corrige el aviso textual de solicitud Google que decía Prueba local con datos ficticios: ahora describe cuenta confirmada e inscripción revisada por CAI; no se modifica la lógica ni el diseño.

No se repiten las suites históricas como pruebas nuevas. La primera prueba automatizada de Brave no pudo importar módulos del sistema en su VM; se usó transferencia local autorizada y se completó el acceso. Una búsqueda inicial de correo aún no mostraba recuperación; una búsqueda limitada posterior la confirmó en Recibidos, no Spam. No se reenvió ni se diagnosticó erróneamente fallo del proveedor.

### Recuperación completada por el titular — 26-11

El primer enlace caducó antes de completarse. Se solicitó otro únicamente para la misma cuenta institucional: recibido a las17:46 CDMX, con vencimiento18:01. Se abrió privadamente y se cedió el formulario al titular. El titular eligió y guardó su contraseña, inició sesión y confirmó la entrada. Observación posterior en navegador: /admin muestra Resumen, Hola Coordinación y Cerrar sesión. No se registró la contraseña en archivos ni Git. No se han comprobado aún el rechazo de la clave anterior ni un nuevo intento con el enlace consumido. El mínimo administrativo de15 sigue vigente; el titular pidió bajarlo a8, sin exigir números, y pospuso expresamente esa implementación.

### Pendientes concretos

1. Recuperación administrativa y nueva entrada completadas por el titular. Quedan comprobaciones de rechazo de clave anterior y enlace consumido; no solicitar ni repetir una contraseña nueva.
2. Registro/aprobación/activación con contraseña de alumno hospedados; el camino de Google ya pasó. Recuperación de alumno con contraseña después de activar esa cuenta.
3. Dos dispositivos físicos y2–3 participantes, material oficial privado, copia externa/restauración de respaldo y aceptación final. No afirmar entrega al100%.
4. Comprobar crédito y vigencia de autorización Gmail antes de lunes30. OAuth sigue en modo Prueba, con duración limitada; no activar pagos ni publicar/verificar la app para todos implícitamente. Rotación y propiedad definitivas de cuenta institucional siguen como cierre previo a entrega operativa.

## Continuación y autorización

Rama `ops/cai-railway-pilot-2026-11-25`, creada desde candidata `b4a2f46` de `release/cai-v1-candidate-2026-11-25` (PR#42). Integra la aplicación conectada, no el adaptador ficticio de Vercel. El titular autoriza preparar la presentación del lunes **30 de noviembre** para 2–3 personas, con computadora apagada y solo recursos gratuitos. No cambiar la muestra pública de Vercel, main, release o bases previas.

La elección de Railway sustituye la preparación de Google Cloud: el alta de facturación mexicana quedó detenida por RFC rechazado, sin VM ni prueba de Google Cloud activadas. Su rama `ops/cai-google-cloud-trial-2026-11-25`/PR#43 conserva el antecedente; no retomarla por leer instrucciones antiguas.

## Estado comprobado en el alojamiento — 25-11, CDMX

- **Enlace conectado:** https://cai-piloto-production.up.railway.app/. El servicio ya está publicado; los19 cambios preparados pertenecen a la etapa anterior. Al retomar se encontró el despliegue aplicado; no se atribuye al agente el clic inicial de publicación.
- Rama `ops/cai-railway-pilot-2026-11-25`, código `ad075df`, despliegue `dced254b-cc32-4494-bf17-ca6b1bc2e0c7`. Proyecto `99a774ba-d312-4166-9cb7-e2a3fb3b7355`, servicio `0ecbbebd-6c2c-4ee7-9d64-6cd18694a40e`, entorno `9dbb4ffc-f614-4aee-b941-1ff7991de60a`.
- Cuenta verificada, Trial30 días o5USD; el panel sigue mostrando esos valores redondeados, sin medir coste futuro. Servicio con límite1GB RAM/2vCPU, una réplica US West California y suspensión por inactividad. El arranque en frío demoró la primera navegación: abrir antes de presentar. Sin tarjeta, cambio de plan o dominio comprado.
- Volumen `cai-piloto-volume`, ID `f88eeff7-b723-4931-b72f-b6486b183e6c`, montado en `/data`; base nueva SQLite esquema23. El despliegue y el reinicio funcionaron; no se observó incompatibilidad regional. No se copiaron bases/fotos privadas habituales.
- GitHub App ya conectada por el titular; autodeploy activo para esta rama, por lo que un push puede generar otro despliegue. Dockerfile y parámetros explícitos del panel; sin railway.json.
- Google: guardado el origen exacto `https://cai-piloto-production.up.railway.app` en el cliente escolar existente; confirmación «Se guardó el cliente OAuth» y lectura posterior de URI3. No se cambiaron localhost/Vercel ni scopes. La recarga posterior del SDK todavía produce «The given origin is not allowed»; no dar el acceso por cerrado ni atribuirlo a propagación como causa confirmada.
- Correo: `/api/local/delivery/config` devuelve `enabled:false, adminEnabled:false`. Gmail API sin habilitar; formulario del cliente separado «CAI Gmail - piloto Railway 2026-11-25» preparado sin crear. Pendiente aceptación de condiciones/cliente y posterior consentimiento de solo envío.
- Contraseña administrativa inicial permanece en `/data/initial-admin-password.txt`, nunca leída ni mostrada. La revisión automática rechazó descargarla, incluso después de «continúa», por faltar consentimiento explícito para ese archivo. Pregunta específica pendiente; no usar terminal u otro camino para eludirlo.

La desactivación posterior de bootstrap se aplicó en `aff10769-a2cc-4a7d-acc6-873ea4711482`, con la misma revisión funcional. Los IDs anteriores identifican cada comprobación; los pushes documentales pueden crear despliegues nuevos sin cambiar la aplicación.

## Comprobaciones realizadas en el piloto

- Portada y login reales renderizados en navegador; registro en Brave aislado `cai-railway-pilot-qa`, con Inglés/Francés/Español y sin matrícula/grupo/tutor obligatorios. Sin desbordamiento horizontal a1440 y375px.
- API `/api/local/health` y `/api/local/ready`200; `/api/local/students`401 sin sesión. `/.env`, `/server/index.ts`, `/shared/badges.ts` y `/assets/absent.js`404. Una solicitud de origen ajeno devolvió403. Esto no sustituye una auditoría exhaustiva de cabeceras del edge.
- Envío real de solicitud ficticia201, folio automático `CAI-0001`, remitente de prueba `railway-pilot-qa-20261125@example.test`; sin enviar correos. Conservar como fixture identificable, no crear una cuenta real con esos datos.
- Reinicio explícito del despliegue: se observó ausencia temporal de instancia y nueva instancia `a800c612`. Repetir la solicitud con la misma clave idempotente devolvió el mismo folio, sin duplicado: persistencia comprobada. Después de deshabilitar bootstrap se volvió a recibir el mismo folio y el servicio mantuvo HTTP200.
- Respaldo creado y verificado con las funciones existentes, ejecutadas como UID/GID1000 en el contenedor Linux. Resultado: esquema23,1 solicitud,0 alumnos,0 cuentas,0 publicaciones,0 imágenes. Está en `/data/backups`; aún no hay copia fuera de Railway ni restauración comprobada allí.
- No se han probado administración autenticada, aprobación/activación/correo/recuperación hospedados, Google real exitoso, fotos privadas o interacción entre dos usuarios. No presentar estas comprobaciones parciales como sistema listo al100%.

## Diagnóstico y corrección de Google — 26-11, CDMX

La configuración del origen escolar sí estaba guardada. Se aisló la causa del rechazo: el HTML del proxy enviaba Referrer-Policy: no-referrer, que dejaba el iframe de Google sin el origen requerido. Prueba A/B en Brave aislado sobre la misma página: cambiar únicamente esa cabecera a strict-origin-when-cross-origin hizo que /gsi/button pasara de400 a200, sin errores nuevos. Solo el dominio viaja entre sitios; API/recursos privados conservan no-referrer. Recomendación oficial: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid

Corrección en server/railway-proxy.ts y regresión en server/tests/railway-proxy.test.ts:6 resultados correctos (5 subpruebas y conjunto), tipos y ESLint correctos. Corrección publicada como `c9c0ff0` y despliegue Active `da8775b4-ff33-440a-b02a-ab08b13227e5`. Brave sin interceptación confirmó cabecera HTML correcta y /gsi/button200 con solo el origen como Referer. API /ready200/no-referrer y /students401 sin sesión. La petición401 fue deliberada y aparece como error de recurso esperado en consola; no es un fallo nuevo del acceso. En navegador institucional, Google identificó realmente la cuenta y CAI abrió el formulario pendiente de datos, conservado al recargar. No se enviaron datos de alumno, ni se aprobaron cuentas o probó acceso completo a comunidad. No habilita Gmail ni exporta la contraseña inicial; ambas confirmaciones siguen pendientes. La plantilla Caddy y los gateways históricos no se han aplicado a Railway ni forman parte de este despliegue.

## Gmail API y cliente creados por el titular — 26-11

El titular continuó manualmente en Google. Comprobado: Gmail API muestra Estado Habilitada y el cliente «CAI Gmail - piloto Railway 2026-11-25» existe, tipo Escritorio, creado26-11. ID público: `534198422441-gcbh2fipj6i1fmtse5cl31999ntccd5o.apps.googleusercontent.com`. No volver a habilitar la API, crear otro cliente ni repetir la aceptación que el titular ya completó.

El detalle del cliente tiene «Información y resumen» → «Descargar JSON»; usar ese cliente existente. No se descargó ni guardó su JSON por el agente ni se obtuvo un refresh token. Falta consentimiento institucional de solo envío, instalación privada y comprobación real. La API pública de CAI confirmó200 con enabled:false y adminEnabled:false; habilitar la API de Google no activa por sí solo el correo de CAI.

La comprobación del chat no contiene respuesta explícita a las preguntas previas de exportación; «creo que ya, checa» acredita la petición de revisar lo realizado, no autoriza por sí sola exportar contraseñas. No reintentar la descarga administrativa previamente rechazada ni obtenerla por otra vía. Preparar una confirmación concreta para descargar/usar privadamente tanto /data/initial-admin-password.txt de Railway como el JSON del cliente existente, sin chat/Git, y continuar con la pantalla real de consentimiento Gmail tras recibirla.

## Archivos y contrato del alojamiento

- `deploy/railway/Dockerfile`: compilación conectada en Node24, dependencias Linux de producción y solo las constantes de src que importa el backend. Sin copiar node_modules de Windows.
- `.dockerignore`: lista positiva; excluye bases, .local, .git, claves, logs y tests. Nunca copiar la carpeta local completa al alojamiento.
- Configuración del panel: una réplica, builder Dockerfile/ruta `deploy/railway/Dockerfile`, sondeo `/healthz`/120s y máximo3 reintentos. El panel informa que Config as Code ya no admite servicios nuevos desde28-08-2026 y que los existentes terminan01-12-2026. Se retiró el `railway.json` inicial; no confiar en que ese archivo configure este servicio. No añadir IaC ni dependencias solo para esta prueba. Revisar los valores explícitos del panel antes de desplegar.
- `server/railway-start.ts`: exige volumen montado en `/data`, producción y origen HTTPS. No cae en disco efímero. Si inicia como root, prepara el directorio y baja a UID/GID1000 antes de abrir datos o conexiones.
- Bootstrap solo si falta la base y `CAI_INITIALIZE_EMPTY=true`; crea una base nueva esquema23 y acceso administrativo aleatorio guardado únicamente en `/data/initial-admin-password.txt` (0600). No imprime accesos ni cambia los ya existentes. La preparación inicial ya terminó: CAI_INITIALIZE_EMPTY=false aplicado, sin eliminar la variable ni su historial. La recuperación administrativa por correo permite que el titular elija su contraseña sin copiar la inicial al chat.
- `server/railway-proxy.ts`: publica exclusivamente dist y reenvía `/api/local` a la API loopback. Comprueba host, HTTPS y X-Real-IP válido; reconstruye las cabeceras de confianza y conserva Origin/CSRF/cookies seguras. Archivos fuente, rutas ocultas y API inexistente no devuelven HTML.
- `/healthz` es un sondeo sin datos personales, disponible después de arrancar/comprobar la API; no sustituye la prueba de navegador ni comprueba correo/Google externos.

**Límite de confianza:** Railway identifica al visitante con X-Real-IP en su edge HTTPS. El proyecto debe tener un único servicio de CAI, sin servicios de terceros en el mismo entorno ni proxy TCP. La red privada también puede llegar al puerto público del contenedor; no tiene una firma que pruebe el origen del edge. No confiar en IP de socket observada ni posiciones de X-Forwarded-For. Antes de compartir el piloto, comprobar cabeceras falsificadas mediante el enlace HTTPS real y configuración del entorno. La API mantiene sin cambios su política loopback; el adaptador es específico de este proveedor.

## Configuración aplicada

Variables de ejecución, nunca build args o variables VITE:

```text
PORT=8080
CAI_PUBLIC_ORIGIN=https://${{RAILWAY_PUBLIC_DOMAIN}}
CAI_BOOTSTRAP_EMAIL=CORREO-INSTITUCIONAL
CAI_INITIALIZE_EMPTY=false
GOOGLE_CLIENT_ID=ID-PUBLICO-DEL-ACCESO-ESCOLAR
```

El origen usa la referencia de Railway al dominio generado; navegación y API comprobaron su resolución. CAI_INITIALIZE_EMPTY=false quedó aplicado; el arranque ya no puede crear otra base vacía si falta el volumen o el archivo. El Dockerfile define NODE_ENV=production, CAI_DATA_DIR=/data, CAI_TRUST_PROXY=loopback y CAI_API_PORT=3100. Railway debe montar su volumen persistente de0,5GB en `/data`, publicar el puerto8080 por HTTP/HTTPS y mantener una réplica. Suspensión por inactividad activada; la primera solicitud tras dormir puede tardar. No agregar PostgreSQL u otro servicio: se conserva SQLite/WAL actual. No activar Hobby/Pro, tarjeta ni dominio comprado.

## Gmail por HTTPS

Railway bloquea SMTP en Free/Trial/Hobby. `server/email-delivery.ts` conserva SMTP existente y añade proveedor `gmail-api`, reutilizando OAuth2Client y nodemailer/MailComposer ya instalados. No se añade dependencia. MIME incluye texto/HTML, enlace canónico y un solo destinatario. Solo se confirma entrega al recibir éxito y ID de mensaje; no se reintenta automáticamente un POST incierto y los errores no muestran tokens/respuestas privadas.

Requiere permiso institucional **gmail.send** (enviar correo), sin lectura de buzón. Preparar cliente OAuth de servidor separado del inicio de sesión escolar, redirect loopback y un archivo privado. No reutilizar la contraseña de aplicación compartida ni pedir secretos en chat. No activar facturación de Google Cloud. En Testing, la autorización de actualización caduca a los7 días: renovar antes del lunes si fuera necesario; publicar la aplicación de correo y verificarla sería otra decisión, no parte de esta prueba.

La configuración privada tiene provider=gmail-api, clientId, clientSecret, refreshToken, from y publicOrigin. Puede instalarse como archivo JSON dentro del directorio de datos con CAI_MAIL_CONFIG o mediante variable privada `CAI_GMAIL_CONFIG_JSON` (el arranque la valida y escribe atómicamente `/data/railway-gmail.json`, modo0600). No subirla a Git, logs, capturas, frontend o PR. Si se retira la variable, el envío deja de seleccionarse salvo CAI_MAIL_CONFIG explícito; no cae automáticamente en una credencial antigua.

## Comprobaciones nuevas de esta preparación

37 resultados correctos en `gmail-delivery`, `railway-proxy`, `email-settings`, `account-email` y `production`: MIME HTTPS con proveedor sustituido, errores/redacción/no reintentos, origen y privacidad de configuración, proxy con API real local, cookies __Host/CSRF, bloqueo de archivos, permisos, activación/recuperación, esquema y reinicio/respaldo. Fixtures nuevas en `.local/tests`, sin tocar la base habitual ni enviar correo real. El primer intento del proxy fue bloqueado por permisos de conexión local (EACCES); la ejecución autorizada posterior pasó.

Tipos, build conectado y lint correctos en la preparación anterior. Docker local no está instalado; el despliegue actual sí arrancó en Linux y se comprobó registro, reinicio y respaldo. Google/Gmail reales del piloto aún sin cierre; las pruebas históricas de la candidata no se vuelven a contar.

## Orden para terminar

Usar los pendientes concretos del cierre26-11 de arriba. Google, cliente/API Gmail, archivos autorizados, consentimiento e instalación ya están terminados. No repetir bootstrap, permisos, configuración o envíos; no aprobar CAI-0001/example.test. El titular ya completó la recuperación y nueva entrada, observada en navegador. Quedan rechazo de clave anterior y enlace consumido. Continúan después activación con contraseña de alumno, dispositivos físicos y cierre operativo.

## Fuentes oficiales

- [Plan/prueba Railway](https://docs.railway.com/pricing/free-plan): créditos, verificación y vencimiento.
- [Volúmenes](https://docs.railway.com/volumes/reference): persistencia y 0,5GB en Free/Trial.
- [Variables y referencia al dominio](https://docs.railway.com/variables/reference); [Config as Code](https://docs.railway.com/config-as-code), contrastado con el aviso específico del panel del servicio nuevo.
- [Cabeceras del edge](https://docs.railway.com/networking/public-networking/specs-and-limits): X-Real-IP, protocolo y host.
- [Correo saliente](https://docs.railway.com/networking/outbound-networking): bloqueo SMTP y APIs HTTPS.
- [Envío Gmail](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send) y [scopes](https://developers.google.com/workspace/gmail/api/auth/scopes).
- [Modalidad estándar gratuita](https://developers.google.com/workspace/guides/quota-pricing) y [caducidad OAuth en Testing](https://developers.google.com/identity/protocols/oauth2#expiration).
