# CAI — piloto gratuito en Railway, 25-11-2026

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

La configuración del origen escolar sí estaba guardada. Se aisló la causa del rechazo: el HTML del proxy enviaba Referrer-Policy: no-referrer, que dejaba el iframe de Google sin el origen requerido. Prueba A/B en Brave aislado sobre la misma página: cambiar únicamente esa cabecera a strict-origin-when-cross-origin hizo que /gsi/button pasara de400 a200, sin errores nuevos. Solo el dominio viaja entre sitios; API/recursos privados conservan no-referrer. Recomendación oficial: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid#

Corrección en server/railway-proxy.ts y regresión en server/tests/railway-proxy.test.ts:6 resultados correctos (5 subpruebas y conjunto), tipos y ESLint correctos. Publicación y acceso real sin interceptación todavía pendientes en este punto de control. No habilita Gmail ni exporta la contraseña inicial; ambas confirmaciones siguen pendientes. La plantilla Caddy y los gateways históricos no se han aplicado a Railway ni forman parte de este despliegue.

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

1. Resolver el rechazo del origen por el SDK de Google, conservando el origen ya guardado y sin repetir autorizaciones del mismo cambio.
2. Obtener respuesta explícita a la descarga privada de la contraseña inicial para QA administrativo, o completar primero correo y recuperación del titular. No mostrar secretos en chat/Git ni eludir el bloqueo.
3. Completar Gmail API sin facturación: aceptar las condiciones mostradas, crear el cliente separado preparado y guardar su JSON privadamente con permiso. Después, conceder solo identificación básica y `gmail.send` a la cuenta institucional, con confirmación ante la pantalla real de Google.
4. El asistente local `scripts/configure-gmail-oauth.mjs` está preparado para un cliente **de escritorio**, PKCE, state, retorno loopback temporal, comprobación de identidad/cuenta y rechazo de scopes extra. Guarda únicamente en una subcarpeta privada de `.local`, sin sobrescribir; en Windows limita ACL a propietario/SYSTEM. Sintaxis Node, tipos y ESLint comprobados; una prueba nueva verifica PKCE/scopes/state, rechazo de GET con sesión ajena, POST y Host ajeno, sin tokens guardados ni conexión a Google. Primer intento bloqueado por EACCES local; ejecución autorizada correcta. Flujo OAuth real todavía no ejecutado. No envía mensajes ni imprime tokens. Uso tras autorizar el cliente:

   ```powershell
   node scripts/configure-gmail-oauth.mjs --client .local/railway-private/desktop-client.json --output .local/railway-private/gmail.json --from CORREO-INSTITUCIONAL@gmail.com --origin https://cai-piloto-production.up.railway.app
   ```

5. Instalar configuración de envío en el servidor con permiso para transmitirla a Railway y probar mensajes únicamente a la cuenta institucional autorizada. Recorrer registro→aprobación→activación→entrada y recuperación; luego dos dispositivos/2–3 participantes autorizados.
6. Bootstrap deshabilitado (`CAI_INITIALIZE_EMPTY=false`), despliegue `aff10769-a2cc-4a7d-acc6-873ea4711482` observado Active/Deployment successful; comprobar persistencia tras cada cambio operativo. Copia externa del respaldo pendiente; material oficial privado por instalar mediante backend protegido, sin convertirlo en assets públicos.
7. Revisar crédito y vigencia Gmail antes de lunes30. Ningún cambio de plan, tarjeta o coste recurrente sin decisión del titular. No prometer gratuidad indefinida ni disponibilidad sin límites; Vercel y datos habituales se conservan.

## Fuentes oficiales

- [Plan/prueba Railway](https://docs.railway.com/pricing/free-plan): créditos, verificación y vencimiento.
- [Volúmenes](https://docs.railway.com/volumes/reference): persistencia y 0,5GB en Free/Trial.
- [Variables y referencia al dominio](https://docs.railway.com/variables/reference); [Config as Code](https://docs.railway.com/config-as-code), contrastado con el aviso específico del panel del servicio nuevo.
- [Cabeceras del edge](https://docs.railway.com/networking/public-networking/specs-and-limits): X-Real-IP, protocolo y host.
- [Correo saliente](https://docs.railway.com/networking/outbound-networking): bloqueo SMTP y APIs HTTPS.
- [Envío Gmail](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send) y [scopes](https://developers.google.com/workspace/gmail/api/auth/scopes).
- [Modalidad estándar gratuita](https://developers.google.com/workspace/guides/quota-pricing) y [caducidad OAuth en Testing](https://developers.google.com/identity/protocols/oauth2#expiration).
