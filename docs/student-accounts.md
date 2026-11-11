# Cuentas de alumnos y permisos locales

## Alcance de este bloque

Rama `feat/student-account-activation`, a partir del backend local ya comprobado. Añade activación, sesión de alumnos, perfil propio y un directorio mínimo del mismo programa/grupo. No conecta todavía el feed, comentarios, fotos, retos ni logros de Community. La demo pública continúa separada y utiliza datos ficticios.

La base existente se actualiza con la migración 2, que añade `student_accounts`, `student_invitations` y `student_sessions`. No borra expedientes, alumnos ni decisiones existentes. Antes de actualizar se creó una copia local mediante el comando de respaldo.

## Recorrido para coordinación

1. Abrir `/gestion` e iniciar sesión con el acceso administrativo local.
2. Revisar y aprobar una solicitud; para menores debe existir la autorización de tutor documentada.
3. Abrir Alumnos y pulsar «Preparar acceso» en un alumno activo con cuenta por activar.
4. Copiar el enlace y entregarlo al alumno o tutor después de verificar su identidad. No se envían mensajes automáticamente.
5. El alumno abre el enlace en este mismo equipo, elige y confirma una contraseña de prueba, y entra por `/alumnos` con el correo de su solicitud.

Las cuentas ya activadas muestran ese estado y dejan de ofrecer «Preparar acceso». Para una contraseña olvidada aún debe intervenir coordinación: el restablecimiento no está implementado en este bloque.

El enlace funciona una sola vez y caduca a las 24 horas. Preparar otro reemplaza el anterior. Si se cierra el diálogo sin copiarlo, se debe preparar uno nuevo; el servidor no puede recuperar el token en texto. Al suspender al alumno se cancelan enlaces pendientes y sesiones.

## Permisos y privacidad

- Alumno: solo su propio perfil y nombres visibles/avatares de cuentas activadas y alumnos activos del mismo programa y grupo. No se entregan correos, fechas de nacimiento, contactos de tutores, nombres administrativos, folios de compañeros ni expedientes.
- Grupos aún «Por asignar»: no se agregan entre sí como si fueran un grupo confirmado.
- Administrador: conserva su sesión separada para solicitudes, decisiones y gestión. La cookie de alumno no abre esos endpoints.
- Suspensión: revoca sesiones y enlaces del alumno; cada lectura y cada inicio de sesión vuelve a comprobar aprobación y estado activo en el servidor. Reactivar permite iniciar sesión de nuevo y no recupera sesiones revocadas.
- Devolver una solicitud aprobada a pendientes bloquea el acceso y revoca sesiones/enlaces. La cuenta y su hash se conservan; si coordinación vuelve a aprobar, el alumno puede iniciar una sesión nueva con su contraseña. La pantalla explica el efecto antes de decidir.
- El área del alumno comprueba el acceso al recuperar visibilidad y cada 15 segundos mientras está visible. El servidor bloquea desde la suspensión; una pantalla ya abierta se cierra en su siguiente comprobación. No hay canal de actualización instantánea por WebSocket.

## Seguridad implementada y límites

Tokens de activación y sesión generados con aleatoriedad criptográfica; solo se guardan hashes en la base. El token de activación viaja en el fragmento de URL, que no forma parte de la solicitud HTTP; al abrir la página se retira de la barra y queda en memoria del formulario. Un nuevo enlace en la misma pestaña reinicia ese formulario. Nunca se incluye en auditoría, consola ni localStorage.

La activación revalida token, caducidad y estado del alumno dentro de la transacción después del cálculo de contraseña, para impedir usos simultáneos o activaciones posteriores a una suspensión/renovación. No inicia sesión automáticamente: cierra cualquier sesión previa de alumno de ese navegador y el alumno entra después por el formulario normal. La sesión administrativa permanece independiente.

Las contraseñas nuevas usan el formato versionado `scrypt-v2` (N=32768, r=8, p=3). La verificación conserva el formato anterior del administrador, sin cambiar ni invalidar su contraseña. Esta configuración es una de las alternativas publicadas por [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt). Los enlaces aleatorios, limitados y de un solo uso siguen los principios descritos para tokens de acceso en [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html#url-tokens).

Hay límite de intentos de activación/login, cookies HttpOnly y SameSite=Strict, protección de origen y consultas parametrizadas. Continúan el límite a localhost y la prohibición de arrancar este servidor con `NODE_ENV=production`. HTTPS, correo real, recuperación, verificación del destinatario y revisión productiva siguen pendientes. Las cuentas son para pruebas locales ficticias, no una autorización para admitir alumnos reales.

Las sesiones administrativas y de alumnos son independientes. En un navegador donde coordinación ya haya iniciado sesión pueden coexistir ambas; salir de una no cierra la otra. En uso real deberán separarse los perfiles o dispositivos de cada persona.

## Archivos y comprobaciones

- `server/database.ts`: migración 2, reutilizable y sin recrear la base.
- `server/student-accounts.ts`: invitaciones, activación, sesiones y permisos de grupo.
- `server/auth.ts`: hash versionado y compatibilidad con credenciales previas.
- `server/app.ts`, `server/contracts.ts`, `server/access-repository.ts`: endpoints, tipos, estado de cuenta y revocación al suspender/devolver a pendientes.
- `server/tests/student-accounts.test.ts`: casos positivos y negativos, activaciones concurrentes, caducidad, renovación durante hash, aislamiento por grupo, suspensión, reinicio, migración y compatibilidad de contraseña anterior.
- `src/features/local-access/`: diálogo de enlace, activación, acceso de alumnos, espacio protegido y conexiones del panel.
- `src/app/router.tsx`, formulario/página de solicitud y estilos del panel: nuevas rutas y textos actualizados.
- `scripts/check-student-accounts.browser.mjs`: recorrido de navegador con credenciales administrativas por argumento; no se guardan en código.

Comandos generales: `npm.cmd run test:api`, `npm.cmd run lint`, `npm.cmd run build`. Arranque: `npm.cmd run dev:local`. Para pruebas visuales de la compilación, mantener la API activa y ejecutar preview en el puerto 4180. Los casos negativos provocan respuestas 400/401 esperadas; deben diferenciarse de errores de ejecución de JavaScript.

## Validación realizada

Lint, typecheck y build correctos; continúa el aviso conocido por tamaño del bundle principal. Las dos suites del backend y los casos de migración/contraseña anterior suman 24 pruebas correctas, contando sus dos contenedores.

Sobre la compilación servida localmente: nuevo recorrido de cuentas, 23 comprobaciones por navegador con 12 combinaciones de rutas/anchuras en Brave y Opera GX; recorrido anterior de solicitudes, 29 por navegador; demo integrada anterior, 77 por navegador. Las cinco pruebas existentes de modelos de Community también pasan. Los rechazos 400 de enlaces usados/reemplazados se provocan deliberadamente y se distinguen de errores de JavaScript.

En Brave se comprobó además que un espacio de alumno ya abierto vuelve al acceso en la siguiente comprobación automática tras una suspensión (sin recargar), y que reactivar permite una sesión nueva. Se inspeccionaron capturas de escritorio y móvil y temas claro/oscuro, sin errores ni advertencias de consola en la última comprobación normal. No se probaron dispositivos físicos, lectores de pantalla, Firefox/Safari, carga concurrente real ni seguridad mediante una auditoría independiente.

## Próximos pasos

Restablecimiento de contraseña con comprobación del destinatario, entrega local de avisos, integración de publicaciones/moderación, reglas y administración de grupos y configuración productiva. La región/grupo actual procede del catálogo ficticio existente; no hay aún una interfaz para cambiarlo. Todas las modificaciones del servidor deben preservar estas restricciones al incorporar nuevos endpoints.
