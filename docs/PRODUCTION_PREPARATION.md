# CAI — preparación técnica de producción

> Actualización del 19-11: la rama posterior `feat/v1-official-media` añade [fotos oficiales y esquema 17](OFFICIAL_MEDIA.md). Los resultados y la ausencia de migraciones de la entrega productiva del 17-11 son históricos. La [continuación de Inicio/historias](COMMUNITY_HOME_STORIES.md) usa esquema 18; el preflight actual exige 1–18. Instalar los seis medios privados en `CAI_DATA_DIR/official-media` por un canal privado: no están en GitHub, dist o public.

**17 de noviembre de 2026.** Rama `feat/v1-production-preparation`, desde `95e53e2`; código comprobado `9be8081`. Preparación de servidor disponible y ensayada con datos ficticios. **No hay despliegue, dominio, certificado, correo real ni aceptación de CAI comprobados.** Contratación y servicios externos siguen para el final.

## Qué cambia

El modo local conserva sus rutas, cookies HTTP y datos en la instalación local. Producción exige configuración explícita y una base preparada fuera del código; no utiliza .local como alternativa. El arranque deja de rechazar toda producción y pasa a rechazar configuraciones incompletas/inseguras, bases ausentes/incompatibles o sin administrador activo.

No se cambia interfaz, esquema 16, dependencias, diseño ni funcionalidades de comunidad. Se reutilizan SQLite, las cuentas y el respaldo existentes. Las imágenes siguen dentro de SQLite; no se necesita inventar otro almacenamiento para ellas. Vídeos no implementados.

## Contrato de alojamiento, por elegir después

Un origen HTTPS para web y API. El intermediario público sirve **solo dist** y envía `/api/local/*` al proceso Node escuchando exclusivamente en 127.0.0.1. El proxy debe estar en la misma máquina/espacio de red que Node. No publicar el directorio del proyecto, server, shared, src, node_modules, .git, variables o datos.

| Cabecera hacia Node | Contrato obligatorio |
| --- | --- |
| Host | Dominio y puerto exactos de CAI_PUBLIC_ORIGIN. |
| X-Forwarded-Proto | Un solo valor `https`, fijado por el proxy después de terminar TLS. |
| X-Forwarded-For | Una sola IP válida del cliente, fijada por el proxy. No copiar la cabecera que envió el visitante. |
| Origin | Conservar el origen del navegador. Cambios requieren coincidencia exacta con CAI_PUBLIC_ORIGIN; no sustituir un origen ajeno por el permitido. |

El servidor solo confía en ese proxy loopback, no en clientes remotos ni listas arbitrarias de proxies. Rechaza listas de IP/protocolos, orígenes ajenos y URLs absolutas en el request-target. No usa X-Forwarded-Host o Forwarded para ampliar confianza. CDN, contenedores con redes separadas, hosts externos de frontend/API y varias réplicas requieren adaptación y pruebas explícitas; no son configuraciones ya validadas.

Los límites de intentos usan la IP validada del cliente en producción; una IP bloqueada no bloquea a todos por compartir el proxy. Las cuotas siguen en memoria de un solo proceso. Dimensionamiento real, NAT de muchos alumnos, supervisión y reglas del proveedor quedan por comprobar con el volumen esperado.

El servidor requiere Node >=24.12.0, proceso persistente y disco privado persistente compatible con SQLite/WAL. Mantener una instancia de la API; no asumir escalado horizontal. Preparar el frontend con build y conservar el backend completo en una carpeta privada. **No desplegar solo server y dist:** el backend actual también importa constantes de shared y src —mockData.ts y contenido de programas de contacto—. El ensayo del paquete mínimo comprobó esas dependencias; no es necesario reconstruir módulos para eliminarlas en esta entrega.

## Configuración del proceso

[.env.example](../.env.example) es una plantilla sin secretos. **Node no carga ese archivo automáticamente**; renombrarlo no configura la API. El responsable del alojamiento debe establecer las variables del proceso por su mecanismo privado. No ponerlas en VITE_* ni copiarlas a dist.

| Variable | Requisito de producción |
| --- | --- |
| NODE_ENV | `production`. Valores desconocidos o mezcla de configuración productiva con modo local se rechazan. |
| CAI_PUBLIC_ORIGIN | Origen HTTPS canónico, sin usuario/contraseña, ruta, query o fragmento. Dominio definitivo de CAI, no IP ni localhost. |
| CAI_TRUST_PROXY | `loopback`; requiere el contrato anterior. |
| CAI_API_PORT | Entero de 1024 a 65535; por defecto 3100, siempre en 127.0.0.1. |
| CAI_DATA_DIR | Carpeta absoluta existente y privada; se resuelve su ubicación real. Debe estar separada del código: ninguna puede contener a la otra. No aceptar enlaces que la lleven al código/publicación. |
| GOOGLE_CLIENT_ID | Opcional, formato de cliente web validado. Producción no lee .local/google.json. Google real sigue pendiente. |

CAI_DATA_DIR contiene cai.sqlite, sus archivos WAL/SHM y backups. Su ubicación no se imprime en registros del servicio. Configurar derechos del usuario de servicio y copias: 0700/0600 cuando corresponda en POSIX, o ACL equivalente en Windows. **No se modificaron ni comprobaron permisos de un alojamiento real en esta tarea.** Las rutas de la plantilla son marcadores, no carpetas creadas por el agente.

## Preparación inicial y arranque

Estos pasos son para el entorno nuevo aprobado, **no para ejecutarlos ahora contra la instalación habitual**. No se copiaron ni abrieron datos reales para prepararlos.

1. Proporcionar carpeta privada y variables del proceso. Elegir responsable/correo administrativo de CAI y guardar una frase inicial de 15 a 128 caracteres en un archivo privado, de una línea, dentro de CAI_DATA_DIR.
2. Solo para preparar una base nueva: definir CAI_BOOTSTRAP_EMAIL y CAI_BOOTSTRAP_PASSWORD_FILE con la ruta absoluta de ese archivo; ejecutar `npm.cmd run production:setup` (npm en un entorno sin PowerShell). No hay cuenta o contraseña predeterminada. No se imprime ni guarda la frase en documentación o logs.
3. El comando reserva el archivo con creación exclusiva, aplica el esquema y guarda el hash del administrador. Si la base ya existe, se detiene antes de leer el archivo secreto. Una interrupción no autoriza borrar o reintentar sobre datos existentes: conservar la evidencia y revisar el estado.
4. Ejecutar `npm.cmd run production:check`: comprobación de solo lectura, integridad, referencias, historial completo 1–18 y administrador activo. No crea, migra o restaura bases ni abre un puerto. Una versión anterior/futura o un hueco de migraciones bloquean el arranque; una actualización requiere respaldo y procedimiento explícito.
5. Ejecutar `npm.cmd run start:api` bajo el gestor de procesos del alojamiento. Arranca únicamente en loopback. El responsable retira las variables/archivo de bootstrap cuando el acceso quede custodiado por su canal privado; el programa no elimina archivos implícitamente.

No usar local:setup, local:backup o google:setup como herramientas de producción: ahora se detienen si NODE_ENV=production antes de tocar .local. El acceso real de Google y la entrega real de correo se configurarán/prueban en su tanda; la recuperación pública no afirma que haya llegado un correo.

## Sesiones, salud, registros y cierre

Producción usa cookies **__Host-, Secure, HttpOnly, SameSite=Strict, Path=/** y sin Domain para administrador, alumno, reto y sesión Google; se leen y eliminan con el mismo nombre/ámbito. El modo local conserva nombres/ámbito anteriores y sigue siendo utilizable sin HTTPS. Las sesiones locales antiguas no se adoptan como cookies productivas.

Las respuestas API llevan identificador generado por el servidor, no-store, nosniff, no-referrer y protección de marcos; HSTS en producción. La política CSP restrictiva de la API corresponde a JSON/imágenes, **no se debe copiar sin adaptar al HTML de la web**. El servidor HTTPS de frontend necesita sus propias cabeceras y una política compatible con el sitio/Google cuando se configure. HTTPS real/certificado y políticas del intermediario se verifican después en el alojamiento elegido.

| Operación | Alcance |
| --- | --- |
| GET /api/local/health | Liveness mínima y modo; sin rutas, cuentas, versiones SQL o secretos. |
| GET /api/local/ready | Consulta ligera a SQLite; no sustituye una auditoría de integridad o un ensayo de restauración. |
| Logs productivos | JSON con evento, UUID propio, método, categoría conocida de operación, estado y duración. Sin URL/query, cabeceras, IP, correo, cuerpos, tokens, credenciales o expedientes. Errores internos no publican trazas. |
| SIGINT/SIGTERM | Cierre de escucha y conexiones, liberación de SQLite; hasta 15 s antes de cerrar conexiones restantes. El gestor de procesos deberá permitir margen y comprobarse en el sistema definitivo. |

El cierre idempotente y el conflicto de puerto se ensayaron sobre fixtures. El arranque CLI se comprobó en Windows; eso no valida señales, reinicios automáticos, supervisión, certificados o persistencia de un proveedor real. No se instalaron servicios ni cambiaron opciones del sistema.

## Respaldos

`npm.cmd run production:backup` utiliza la configuración explícita y el mecanismo SQLite consistente existente. Guarda en CAI_DATA_DIR/backups, exige origen privado existente y rechaza enlaces/destinos que salgan de esa carpeta. No necesita que haya un administrador disponible, para permitir conservar datos ante problemas de acceso. El resultado contiene también las imágenes almacenadas en SQLite; no es una copia manual del archivo abierto.

Se ensayó la copia y `verifyLocalBackup` en un destino separado con datos ficticios. Para comprobar una copia concreta, `node server/verify-backup.ts RUTA_DE_LA_COPIA`; no indicar la base activa ni interpretar el comando como restauración. Programación, retención, cifrado/custodia, copia fuera del equipo, recuperación completa y actualización de versiones en el alojamiento real siguen en N3/N7 de [NEXT_STEPS](NEXT_STEPS.md). No reconstruir las herramientas ya existentes.

## Validación de esta entrega

- **217 pruebas API aprobadas**, cero fallos, canceladas u omitidas: regresión anterior y 24 resultados nuevos de configuración/producción/CLI. Incluye creación exclusiva, rechazo de esquema/historial inválido, permisos, origen/IP, cookies seguras, Google simulado, límites por cliente, logs, errores internos, reinicio y respaldo.
- **104 comprobaciones de navegador en cuatro recorridos:** 27 de producción simulada y 25 locales en cada uno de Brave/Opera. Tutor, aprobación, activación, tres retos, primera insignia, compartición a revisión y suspensión. En modo simulado, el navegador conservó/envió las cookies seguras de alumno y administrador; no hubo errores JavaScript inesperados.
- **La simulación HTTPS intercepta el dominio ficticio cai.example.test y lo comunica con la API loopback. No establece TLS real ni valida certificado, DNS o software del proxy.** No confundirla con una puesta en producción.
- Lint, tipos y build correctos; sintaxis del recorrido y git diff --check correctos. El frontend compilado no mostró los indicadores de código privado buscados —CAI_DATA_DIR, DatabaseSync, scrypt-v2, SQL de cuentas—. No es una auditoría completa de secretos.
- No se repitió la matriz anterior de 1,314 ni los modelos; siguen siendo evidencia de su corte. No se suman con estas 104. No se ejecutó npm audit ni se actualizaron dependencias.
- Se corrigió la nota anterior de TESTING: typecheck **ya incluía servidor y sus pruebas**, mediante tsconfig.server.json; no se añadió otra herramienta de tipos. La compilación detectó y permitió corregir tipos de los nuevos tests.

Durante el desarrollo se corrigió una referencia URL que seguían usando paginación/filtros después de extraer la política de solicitudes. La regresión final comprobó su recuperación. El primer cliente HTTP de prueba no conservaba Host; se usó HTTP nativo para simular el proxy sin relajar la política. El primer paquete CLI ficticio omitía las constantes de contacto de src; se completó y se repitió el ensayo. Ninguno de esos intentos se cuenta como aprobado en los resultados finales.

Código y recorrido de esta entrega: runtime-config/request-policy/session-cookie, runtime-server/index, production-storage/setup/check/backup, operational-log y adaptación de repositorios de sesión; tests runtime-config, production, production-cli, production-browser-server y check-student-full-journey. Datos/metadatos/capturas/logs de prueba bajo `.local/tests` son ignorados y no recuperables tras clonar; este informe, plantilla y fuentes versionadas conservan el procedimiento.

## Siguiente paso

La base técnica autónoma de N1 queda preparada. Próximo bloque: **operación y recuperación de datos (N3)**, aprovechando estos respaldos y preparando instalación/actualización/recuperación sin tocar datos habituales. Google/correo, material/aceptación de CAI y presupuesto/alojamiento siguen al final. Antes de usuarios reales faltan también los textos/avisos de prototipo y el contenido final; este modo del servidor no los convierte en una entrega aprobada.

Referencias técnicas consultadas: [cookies y prefijo __Host- (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie), [HTTP/cierre de servidor en Node 24](https://nodejs.org/docs/latest-v24.x/api/http.html), [cabeceras del intermediario y límites de confianza (Caddy)](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), [limpieza de interceptaciones en Playwright](https://playwright.dev/docs/api/class-browsercontext#browser-context-unroute-all). El contrato de CAI es una decisión de esta implementación; no supone haber instalado o validado Caddy.
