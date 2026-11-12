# Navegación oficial y compatibilidad de enlaces anteriores

Bloque 8 comprobado localmente el 12 de noviembre de 2026. Rama `feat/v1-unified-navigation`, base `361e23a` de `feat/v1-private-gallery`; incluye las mejoras acumulativas anteriores y conserva la base visual v1.0. Puntos de retorno: `5f8bd57` (ajustes responsive y ejecución del recorrido de comunidad) y `ded8804` (rutas, enlaces, selección de bandeja y pruebas).

## Mapa de rutas

| Enlace anterior | Destino vigente | Comportamiento conservado |
| --- | --- | --- |
| `/gestion` | `/admin` | Resumen del panel original con sesión administrativa. |
| `/gestion/solicitudes` | `/admin/solicitudes` | Solicitudes, revisión, decisiones y autorización de tutor. |
| `/gestion/alumnos` | `/admin/alumnos` | Directorio, ficha, activación, suspensión y asignación. |
| `/gestion/publicaciones` | `/admin/publicaciones` | Revisión y decisiones sobre el mismo registro persistente. |
| `/gestion/avisos` | `/admin/mensajes?bandeja=avisos` | Abre Avisos de acceso directamente, con sus acciones y enlaces privados. |
| `/gestion/...` desconocido | `/admin` | Vuelve al inicio protegido del panel. |
| `/registro-local` | `/registro` | Un único SignupPage conectado al mismo servicio. |
| `/alumnos` | `/mi-inscripcion` | Conserva datos propios y nombres visibles del grupo. |
| `/alumnos/publicaciones` | `/community` | Usa el feed, compositor e historial avanzados ya conectados. |

Los alias reemplazan su entrada en el historial. No aceptan destinos externos ni propagan parámetros/fragmentos desconocidos. Los destinos administrativos siguen mostrando el acceso administrativo si falta sesión; un alumno nunca obtiene ese rol mediante la redirección. Las rutas desconocidas fuera de estos alias mantienen la pantalla 404.

`/activar`, `/recuperar`, `/recuperar-acceso` y `/solicitud-google` siguen disponibles. Los fragmentos de activación/recuperación no pasan por una redirección nueva: se conservan sus formularios, uso único y retirada del token de la barra/historial. La alternativa por contraseña, el cambio de cuenta Google y los enlaces públicos llevan al acceso oficial.

## Equivalencia y reutilización

Antes de cambiar el router se contrastaron las acciones de LocalAccessApp con AdminLayout, AdminPage, AdminRequestsPage/RequestDialog, AdminStudentsPage/StudentDialog, AdminPostsPage/PostDialog y AdminInboxPage/LocalNotices. Se mantienen los mismos servicios, revisiones, permisos, enlaces de activación, motivos privados y registros. Los recorridos actuales de acceso y moderación se repitieron para comprobar las acciones del destino, además de comprobar la URL.

StudentPublications se sustituye en la navegación por Community, cuyo compositor, aprobación, rechazo, historial y retirada ya estaban conectados. Sus archivos históricos y los de LocalAccessApp siguen en el repositorio, sin estar montados en las rutas públicas. No se eliminan datos, componentes de referencia ni ramas.

StudentArea conserva su ficha y directorio como página auxiliar `/mi-inscripcion`, con el mismo servicio autorizado y el diseño existente. Se retira únicamente su selección interna de feed paralelo. Conserva actualización, sesión, cierre, alias/programa/grupo y lectura de compañeros del mismo grupo. El enlace Mi inscripción de Community apunta al destino vigente.

AdminInboxPage lee la selección de avisos desde `bandeja=avisos`; los botones cambian la dirección y funcionan con recarga y Atrás/Adelante. Se mantiene una sola página de mensajes y los mismos componentes de contacto/avisos. No se guardan destinatarios, enlaces privados ni tokens en ese parámetro.

Los destinos preparados del servicio Google para cuentas aprobadas son ahora `/community`; la identidad sin solicitud continúa en `/solicitud-google`. Se comprobó con el verificador controlado de las pruebas. Esto no es una prueba de acceso real con Google, que sigue pendiente de las cuentas/configuración de CAI.

## Correcciones encontradas durante la verificación

- A 768 px, el texto accesible de una tabla podía escapar de su contenedor desplazable y ensanchar la página. Se hizo relativo ese contenedor, conservando el texto y el desplazamiento propio de la tabla.
- A 320 px, las opciones largas imponían un ancho mínimo al selector de programas y a la barra de búsqueda. Se permitió encoger estos controles dentro de su contenedor y ajustar el texto de programa.
- Los nombres largos de autores en tarjetas y compañeros en Mi inscripción podían desbordar. Se permite su ajuste completo, sin recortarlos ni ocultarlos. La prueba de rutas incluye un alias ficticio de 45 caracteres sin espacios.

Se repitieron los recorridos relevantes tras corregir. Los primeros intentos que detectaron estos fallos no se contabilizan como recorridos aprobados.

## Comprobaciones realizadas

En **Brave y Opera GX**, cada uno:

- `check-unified-navigation.browser.mjs`: **45** comprobaciones completas. Alias antes/después del acceso, pestaña correcta, historial/recarga, rechazo de destino externo, activación por interfaz, ficha preservada, feed oficial, permisos de alumno/API, suspensión, alternativa por contraseña, 404 y cuatro anchuras.
- `check-v1-connected.browser.mjs`: **30** comprobaciones del registro, decisiones/tutor, dashboard, activación/acceso, sesión y suspensión oficiales, con revisión responsive.
- `check-community-connected.browser.mjs`: **39** comprobaciones de composición/reintento, moderación, privacidad entre grupos, rechazo/retiro, suspensión/reactivación y editor/revisión a cuatro anchuras.
- `check-inbox-recovery-contact.browser.mjs`: **37** comprobaciones de contacto, reintento, seguimiento, avisos privados, recuperación, revocación, contraseña larga y móviles. Confirma que la selección por URL no altera las acciones de las bandejas.

Son 151 comprobaciones por navegador, repartidas en cuatro recorridos; no una única prueba continua de todas las funciones del producto. Cero errores de ejecución JavaScript en los recorridos completos. Los errores de red y denegaciones introducidos deliberadamente son escenarios de prueba. Las pruebas usan perfiles/contextos aislados y exclusivamente datos ficticios; conservan su historial en la base local.

API: **71 resultados correctos**, incluidas regresiones anteriores de imágenes/respaldos y las expectativas nuevas de destino Google con verificador controlado. Siete rutas privadas de Vite siguen bloqueadas mediante HEAD sin cookies. Lint, typecheck, build y revisión de espacios de Git correctos. Sin migración nueva, cambio de dependencias ni configuración del sistema.

Anchuras 1440/768/375/320. Inspección visual adicional de Mi inscripción en escritorio y a 320 px, y del directorio administrativo a 320 px. Las correcciones conservaron marca, colores, tipografía y composición. El paquete principal pasa de ~704 KB a ~677 KB al dejar de importar las pantallas paralelas desde el router; sigue existiendo el aviso de tamaño y no se da por terminada su optimización.

Al encadenar numerosas pruebas rápidamente se activó el límite global de 600 peticiones/minuto. No se amplió ni desactivó. Se separaron las tandas y se reinició únicamente el servicio local entre algunas de ellas, conservando SQLite/sesiones. Hubo también esperas agotadas al alternar ventanas; el script de Community lleva ahora cada sesión al frente, limpia sus listeners e incluye diagnóstico de fallo sin secretos. Se completaron después los recorridos por navegador. No es una prueba de carga ni garantiza capacidad en producción.

## Archivos modificados

- Rutas/enlaces: `src/app/router.tsx`, MainNavigation, CommunityShell, ContactSections, SignupPage y GoogleOnboardingPage.
- Páginas reutilizadas: StudentArea y AdminInboxPage; estilos existentes `admin.module.css`.
- Servicio: únicamente los destinos de Google en `server/app.ts` y sus comprobaciones en `server/tests/google-auth.test.ts`.
- Pruebas: nuevo `scripts/check-unified-navigation.browser.mjs` y adaptación de foco/diagnóstico del recorrido existente de Community.
- Continuidad: este documento, PROJECT_STATE, AGENTS, README y referencia al cierre posterior desde el documento de galería.

## Continuación

Siguiente bloque autónomo: **9, estabilización**. Revisar primero los diez avisos moderados de las herramientas de desarrollo registrados en el bloque 7, sin forzar cambios incompatibles; reducir la carga inicial donde convenga; revisar errores/red y el recorrido conjunto; completar una guía breve de tareas del administrador y el procedimiento de respaldo/restauración. Las migraciones, permisos y servicios comprobados se conservan; no se abre otro panel ni se reconstruyen funciones terminadas.

Edición completa de expediente/perfil, gestión de otras cuentas administrativas e interacciones secundarias siguen pendientes en los términos del inventario. No se incorporaron a este bloque implícitamente. Google/correo reales, contenido y autorizaciones, validación de uso con el administrador, presupuesto y alojamiento quedan agrupados para el final. La aplicación continúa siendo local con datos ficticios, sin despliegue ni admisión de alumnos reales.
