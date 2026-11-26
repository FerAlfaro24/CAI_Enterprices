# CAI — piloto gratuito en Railway, 25-11-2026

## Continuación y autorización

Rama `ops/cai-railway-pilot-2026-11-25`, creada desde candidata `b4a2f46` de `release/cai-v1-candidate-2026-11-25` (PR#42). Integra la aplicación conectada, no el adaptador ficticio de Vercel. El titular autoriza preparar la presentación del lunes **30 de noviembre** para 2–3 personas, con computadora apagada y solo recursos gratuitos. No cambiar la muestra pública de Vercel, main, release o bases previas.

La elección de Railway sustituye la preparación de Google Cloud: el alta de facturación mexicana quedó detenida por RFC rechazado, sin VM ni prueba de Google Cloud activadas. Su rama `ops/cai-google-cloud-trial-2026-11-25`/PR#43 conserva el antecedente; no retomarla por leer instrucciones antiguas.

## Estado observado, sin inferir despliegue

- El titular completó personalmente el acceso GitHub/Railway.
- Railway → Plans muestra cuenta **verificada**, Trial Plan y **30 días o 5 USD de crédito**, lo que ocurra primero; panel indica 0,5 GB RAM y 2 vCPU por servicio. El panel de la cuenta es la referencia para sus límites, no una estimación de documentación.
- Instalación de Railway App preparada con **Only select repositories → FerAlfaro24/CAI_Enterprices**, sin confirmar. Solicita lectura de metadata/correos y escritura de código, actions, administración, checks, estados, despliegues, PR y workflows. Hace falta autorización en ese punto antes de pulsar Install & Authorize.
- Aún no hay proyecto/servicio/volumen/dominio de CAI creados en Railway ni Gmail API autorizado. No hay enlace conectado que compartir todavía.

## Archivos y contrato del alojamiento

- `deploy/railway/Dockerfile`: compilación conectada en Node24, dependencias Linux de producción y solo las constantes de src que importa el backend. Sin copiar node_modules de Windows.
- `.dockerignore`: lista positiva; excluye bases, .local, .git, claves, logs y tests. Nunca copiar la carpeta local completa al alojamiento.
- `railway.json`: una réplica, Dockerfile explícito y sondeo `/healthz`; máximo tres reintentos de arranque fallido. Configurar variables **antes** de iniciar el servicio.
- `server/railway-start.ts`: exige volumen montado en `/data`, producción y origen HTTPS. No cae en disco efímero. Si inicia como root, prepara el directorio y baja a UID/GID1000 antes de abrir datos o conexiones.
- Bootstrap solo si falta la base y `CAI_INITIALIZE_EMPTY=true`; crea una base nueva esquema23 y acceso administrativo aleatorio guardado únicamente en `/data/initial-admin-password.txt` (0600). No imprime accesos ni cambia los ya existentes. Tras comprobar la primera preparación, retirar esa variable. La recuperación administrativa por correo permite que el titular elija su contraseña sin copiar la inicial al chat.
- `server/railway-proxy.ts`: publica exclusivamente dist y reenvía `/api/local` a la API loopback. Comprueba host, HTTPS y X-Real-IP válido; reconstruye las cabeceras de confianza y conserva Origin/CSRF/cookies seguras. Archivos fuente, rutas ocultas y API inexistente no devuelven HTML.
- `/healthz` es un sondeo sin datos personales, disponible después de arrancar/comprobar la API; no sustituye la prueba de navegador ni comprueba correo/Google externos.

**Límite de confianza:** Railway identifica al visitante con X-Real-IP en su edge HTTPS. El proyecto debe tener un único servicio de CAI, sin servicios de terceros en el mismo entorno ni proxy TCP. La red privada también puede llegar al puerto público del contenedor; no tiene una firma que pruebe el origen del edge. No confiar en IP de socket observada ni posiciones de X-Forwarded-For. Antes de compartir el piloto, comprobar cabeceras falsificadas mediante el enlace HTTPS real y configuración del entorno. La API mantiene sin cambios su política loopback; el adaptador es específico de este proveedor.

## Configuración prevista

Variables de ejecución, nunca build args o variables VITE:

```text
PORT=8080
CAI_PUBLIC_ORIGIN=https://DOMINIO-ASIGNADO.up.railway.app
CAI_BOOTSTRAP_EMAIL=CORREO-INSTITUCIONAL
CAI_INITIALIZE_EMPTY=true
GOOGLE_CLIENT_ID=ID-PUBLICO-DEL-ACCESO-ESCOLAR
```

El Dockerfile define NODE_ENV=production, CAI_DATA_DIR=/data, CAI_TRUST_PROXY=loopback y CAI_API_PORT=3100. Railway debe montar su volumen persistente de 0,5 GB en `/data`, publicar el puerto8080 por HTTP/HTTPS y mantener una réplica. No agregar PostgreSQL u otro servicio: se conserva SQLite/WAL actual. No activar Hobby/Pro, tarjeta ni dominio comprado.

## Gmail por HTTPS

Railway bloquea SMTP en Free/Trial/Hobby. `server/email-delivery.ts` conserva SMTP existente y añade proveedor `gmail-api`, reutilizando OAuth2Client y nodemailer/MailComposer ya instalados. No se añade dependencia. MIME incluye texto/HTML, enlace canónico y un solo destinatario. Solo se confirma entrega al recibir éxito y ID de mensaje; no se reintenta automáticamente un POST incierto y los errores no muestran tokens/respuestas privadas.

Requiere permiso institucional **gmail.send** (enviar correo), sin lectura de buzón. Preparar cliente OAuth de servidor separado del inicio de sesión escolar, redirect loopback y un archivo privado. No reutilizar la contraseña de aplicación compartida ni pedir secretos en chat. No activar facturación de Google Cloud. En Testing, la autorización de actualización caduca a los7 días: renovar antes del lunes si fuera necesario; publicar la aplicación de correo y verificarla sería otra decisión, no parte de esta prueba.

La configuración privada tiene provider=gmail-api, clientId, clientSecret, refreshToken, from y publicOrigin. Puede instalarse como archivo JSON dentro del directorio de datos con CAI_MAIL_CONFIG o mediante variable privada `CAI_GMAIL_CONFIG_JSON` (el arranque la valida y escribe atómicamente `/data/railway-gmail.json`, modo0600). No subirla a Git, logs, capturas, frontend o PR. Si se retira la variable, el envío deja de seleccionarse salvo CAI_MAIL_CONFIG explícito; no cae automáticamente en una credencial antigua.

## Comprobaciones nuevas de esta preparación

37 resultados correctos en `gmail-delivery`, `railway-proxy`, `email-settings`, `account-email` y `production`: MIME HTTPS con proveedor sustituido, errores/redacción/no reintentos, origen y privacidad de configuración, proxy con API real local, cookies __Host/CSRF, bloqueo de archivos, permisos, activación/recuperación, esquema y reinicio/respaldo. Fixtures nuevas en `.local/tests`, sin tocar la base habitual ni enviar correo real. El primer intento del proxy fue bloqueado por permisos de conexión local (EACCES); la ejecución autorizada posterior pasó.

Tipos, build conectado y lint correctos. No se ejecutó Docker/Linux (Docker no está instalado en este equipo), ni Google/Gmail reales del piloto, ni pruebas de navegador sobre alojamiento aún inexistente. Las pruebas históricas de la candidata no se vuelven a contar.

## Orden para terminar

1. Confirmar instalación GitHub App limitada a CAI; guardar/push de esta rama y PR en borrador, sin fusionar.
2. Crear proyecto aislado, servicio de esta rama y volumen `/data`; revisar Trial/crédito/límites y variables antes de desplegar. Obtener dominio y origen canónico.
3. Validar compilación Linux/sharp, volumen, arranque, TLS, cabeceras y navegación en Brave; probar reinicio conservando datos y preparar respaldo fuera del servidor. No compartir link antes de comprobar renderizado.
4. Autorizar nuevo origen escolar en Google y permiso de envío de la cuenta institucional cuando los cambios estén preparados. Probar correos reales a cuenta institucional y recorrido registro→aprobación→activación→entrada y recuperación.
5. Prueba con dos dispositivos y 2–3 participantes autorizados; fotos oficiales privadas solo mediante instalación protegida, sin convertirlas en assets públicos. No copiar bases anteriores ni inventar ejemplos dentro del piloto conectado.
6. Retirar opt-in de bootstrap; comprobar crédito y autorización Gmail antes de presentar el lunes. Descargar respaldo al finalizar y acordar continuidad; la prueba no garantiza alojamiento gratuito indefinido ni alta disponibilidad.

## Fuentes oficiales

- [Plan/prueba Railway](https://docs.railway.com/pricing/free-plan): créditos, verificación y vencimiento.
- [Volúmenes](https://docs.railway.com/volumes/reference): persistencia y 0,5GB en Free/Trial.
- [Cabeceras del edge](https://docs.railway.com/networking/public-networking/specs-and-limits): X-Real-IP, protocolo y host.
- [Correo saliente](https://docs.railway.com/networking/outbound-networking): bloqueo SMTP y APIs HTTPS.
- [Envío Gmail](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send) y [scopes](https://developers.google.com/workspace/gmail/api/auth/scopes).
- [Modalidad estándar gratuita](https://developers.google.com/workspace/guides/quota-pricing) y [caducidad OAuth en Testing](https://developers.google.com/identity/protocols/oauth2#expiration).
