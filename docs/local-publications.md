# Publicaciones de texto y moderación local

Rama: `feat/local-publications-moderation`, desde la integración opcional de Google. Esta entrega conecta publicaciones de texto, revisión administrativa e historial a SQLite y a las sesiones existentes. Solo para pruebas locales con datos ficticios. No se ha desplegado para alumnos reales.

## Recorrido

1. El alumno aprobado, activo y con cuenta activada entra en `/alumnos`. La navegación **Publicaciones** abre `/alumnos/publicaciones`.
2. En **Comparte un avance**, elige Logro o Experiencia, escribe un título de 4 a 100 caracteres y una historia de 10 a 1200. El botón **Enviar a revisión** guarda el envío como pendiente.
3. **Mis publicaciones** muestra el estado, el texto y, en caso de rechazo, el motivo. Un pendiente no aparece en el grupo. Recargar o reiniciar el servicio conserva el envío.
4. Coordinación entra en `/gestion`. El inicio muestra cuántas publicaciones faltan por revisar y enlaza a `/gestion/publicaciones`.
5. La bandeja tiene filtros y búsqueda por título, alumno o grupo. Cada tarjeta ofrece una sola acción principal: **Revisar publicación**.
6. El detalle muestra el texto completo, el autor, su nombre visible, programa, grupo y si es menor. Para publicar, coordinación debe confirmar la revisión de contenido y privacidad. Para rechazar, debe elegir un motivo que recibirá el autor en su historial.
7. Publicar comparte el texto con alumnos activos del mismo programa y grupo. **Devolver a revisión** lo oculta hasta una nueva aprobación. Cerrar el diálogo no toma ninguna decisión.
8. El autor puede **Retirar publicación** y confirmar o cancelar. El retiro conserva el historial, oculta el contenido del grupo y no puede ser revertido por coordinación.

La visibilidad por programa y grupo es la regla conservadora de esta primera conexión, pendiente de validación final con CAI. No se aplica el selector de comunidad amplia de la demostración a estos textos. Quien tenga grupo «Por asignar» debe esperar la asignación antes de enviar o leer el feed de grupo.

El diseño de la demostración avanzada en `/community` se conserva con sus datos ficticios. Sus publicaciones, galerías, reacciones, comentarios, retos e insignias siguen en memoria y no se mezclan con los registros de esta entrega. No hay todavía carga de imágenes ni edición de publicaciones guardadas. El formulario explica la revisión y evita prometer esas funciones.

## Permisos y persistencia

- El servidor obtiene autor, programa y grupo de la sesión y del expediente activo. Rechaza intentos de enviar identidad, estado, imágenes o audiencia desde el formulario.
- Solo una sesión administrativa puede consultar la bandeja completa y moderar. La sesión del alumno solo permite leer su propio historial y el feed autorizado, enviar y retirar sus propios textos.
- El feed devuelve título, cuerpo, tipo, fechas y nombre visible/avatar. No incluye nombre administrativo, correo, edad, tutor, folio del alumno, motivo de rechazo ni revisión interna. Los motivos se devuelven únicamente al autor y a coordinación.
- Solo se comparte texto aprobado, con autor aprobado y activo, que conserve el mismo programa y grupo. Suspender al autor o devolver su solicitud a pendientes oculta sus publicaciones además de revocar sus sesiones. Reactivar no restaura sesiones antiguas; los textos que sigan aprobados vuelven a ser visibles si el autor conserva programa y grupo. Para mantener un texto oculto, coordinación debe devolverlo a revisión o el autor retirarlo.
- Un identificador por envío evita duplicados al reintentar. Está asociado al autor; no sirve para apropiarse de publicaciones ajenas. Cambiar el contenido de un envío ya recibido genera un conflicto visible.
- Las decisiones y retiros usan revisión numérica y transacciones. Una decisión obsoleta no sobrescribe otra. Dos decisiones simultáneas no pueden aprobar y rechazar el mismo estado inicial.
- La migración 4 añade `publications` y `publication_audit` sin recrear tablas previas. El historial registra envío, decisión administrativa y retiro. No se borran registros al suspender o devolver a pendientes.
- El texto se representa como texto React, sin interpretar HTML. Se mantienen límites de longitud, intentos por alumno, comprobación de origen, cookies y permisos en servidor. No hay comprobación automática del significado del contenido; la revisión humana sigue siendo necesaria.
- Los alumnos con Google usan estos mismos permisos cuando están aprobados. El registro y la prueba real de Google quedan pendientes hasta contar con la cuenta de CAI.

## Actualización y pruebas

Antes de actualizar se ejecutó `npm.cmd run local:backup`. La migración se aplicó sobre la base existente y se compararon con ese respaldo sus 47 filas previas de solicitudes, alumnos, cuentas de alumno y administración: permanecían idénticas. Los recorridos de navegador añadieron nuevos registros ficticios de prueba; no se eliminó la base.

Comprobaciones realizadas:

- `npm.cmd run test:api`: 46 resultados correctos, incluidos cuatro contenedores. Se verifican permisos, validación, idempotencia, aislamiento por grupo y programa, motivos privados, retiro, revisiones simultáneas, suspensión, cuentas Google ficticias y persistencia tras reiniciar. Se mantienen las regresiones de solicitudes, activación, contraseña y migraciones.
- `npm.cmd run lint`, `npm.cmd run build` y typecheck: correctos. Permanece el aviso conocido de tamaño del bundle principal.
- `scripts/check-local-publications.browser.mjs`: 29 comprobaciones en Brave y 29 en Opera GX, sobre la compilación y la API local real. Incluye formulario, revisión, rechazo, lectura, retiro y separación entre alumnos; 12 combinaciones de vistas/anchuras por navegador (1440, 768, 375 y 320 px).
- Recorrido previo de cuentas por contraseña y activación: 23 comprobaciones correctas en Brave para evitar regresiones en las pantallas compartidas.
- Los cinco scripts existentes de modelos de Community siguen pasando. No se volvió a ejecutar toda la auditoría visual de la demostración avanzada.
- Capturas inspeccionadas de bandeja en escritorio y formulario/historial en móvil, con los temas existentes. No hay errores de ejecución de JavaScript en los recorridos de publicaciones.

El script de publicaciones recibe las credenciales administrativas por argumento; no las guarda en el repositorio. Crea dos alumnos ficticios de grupos distintos y utiliza las operaciones reales de la API para preparar las cuentas. La interacción de publicaciones y moderación se prueba desde la interfaz. Los casos negativos HTTP se prueban con sesiones independientes en la suite del servidor.

Para revisar manualmente: `npm.cmd run dev:local` y abrir `http://127.0.0.1:5173/gestion/publicaciones` o `http://127.0.0.1:5173/alumnos/publicaciones`. Para revisar la compilación, mantener la API local y servir preview en el puerto 4180. Las vistas del alumno actualizan datos cada 15 segundos mientras la pestaña es visible y también ofrecen actualización manual.

No se probaron dispositivos físicos, lectores de pantalla, Firefox/Safari, carga masiva ni seguridad mediante auditoría independiente. Siguen pendientes el entorno productivo, recuperación de acceso y entrega de avisos, archivos privados, administración de grupos y unión del diseño avanzado de Community con los servicios reales.

## Archivos afectados

- `server/database.ts`, `contracts.ts`, `app.ts`, `publications.ts` y `server/tests/publications.test.ts`: almacenamiento, tipos y reglas compartidas, rutas, permisos y pruebas.
- `src/features/local-publications/`: formulario e historial del alumno, feed de grupo, bandeja y detalle de revisión, confirmación de retiro y estilos.
- `src/features/local-access/LocalAccessApp.tsx`, `LocalAccessViews.tsx`, `StudentArea.tsx`, `api.ts` y `src/app/router.tsx`: navegación y conexión de las pantallas existentes.
- `scripts/check-local-publications.browser.mjs`, esta guía, requisitos, plan y README: verificación y documentación de la entrega.
