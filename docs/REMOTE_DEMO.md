# Presentación remota protegida de CAI

**19-11-2026 · rama `feat/v1-remote-demo`, desde `d7ef781` de PR #14.** Solicitud del usuario: mostrar desde otra ubicación la comunidad actual con fotos oficiales e interacciones ficticias, sin contratar aún el alojamiento definitivo.

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
