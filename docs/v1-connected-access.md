> Fotografía del primer bloque (`8e205b0`). Community y Publicaciones se conectaron después: consultar `v1-connected-community.md` y el registro vigente de `PROJECT_STATE.md`. Las limitaciones descritas aquí corresponden al momento de esa entrega.

# v1.0 conectada: primer recorrido de ingreso

Rama `integration/cai-v1-connected`, desde `be90193` (auditoría y prioridades, con el avance funcional `1b84fb3` ya incluido). La referencia visual oficial `f3ba46b` se conserva como antecesor; no se fusionaron otra vez las ramas acumulativas ni se modificó la rama release. Se creó un respaldo local antes de los cambios.

## Alcance completado

- `/registro` reutiliza `SignupPage` y `SignupForm` en modo persistente, sin pedir contraseña antes de aprobar. El folio se asigna en servidor.
- `/login` reutiliza la página visual de v1.0 con autenticación de alumno. El acceso administrativo usa el mismo diseño cuando se abre `/admin/*` sin sesión de administrador. Se eliminaron las entradas que omitían las credenciales en esta página conectada.
- `/admin` reutiliza `AdminLayout` completo (menú lateral, barra, tarjetas, gráficas y resúmenes), protegido por la sesión administrativa existente. El servidor sigue siendo responsable de autorizar las operaciones.
- `/admin/solicitudes` conserva tabla, búsqueda, filtros y entrada guiada de v1.0. El detalle reutiliza `LocalRequestDialog` para decisiones persistentes, referencia de tutor y revisión numérica, dentro del mismo estilo administrativo. No se creó otro panel.
- `/admin/alumnos` conserva tabla, filtros y ficha. Sus filas proceden del servidor, no de `mockData`. La ficha prepara enlaces de activación y suspende/reactiva mediante la API existente.
- El alumno activa su cuenta con el formulario existente, entra por `/login` y llega a su espacio protegido en `/alumnos`. Si falta sesión, `/alumnos` dirige al acceso oficial. Los permisos y la suspensión se mantienen en servidor.

No hay migraciones, endpoints nuevos, cambios de contraseñas administrativas ni dependencias nuevas en este bloque. Las solicitudes y cuentas añadidas durante las pruebas son ficticias; los registros previos se conservaron.

## Contratos y fuente de datos

`useAdminConnection` consulta sesión y carga solicitudes, alumnos y publicaciones mediante `localApi`. Publica una adaptación compatible con el contexto administrativo existente:

- Solicitudes: `LocalRequest` conserva estados y campos compatibles con la tabla, sin perder la revisión usada para escribir.
- Directorio: `AdminState.directory` contiene exclusivamente alumnos devueltos por el servidor. `buildDirectory` usa esa colección, incluso cuando está vacía; no mezcla alumnos de muestra. Los contadores de publicaciones son las publicaciones actualmente publicadas del alumno; «Nuevo» se limita al mes del alta.
- Resumen de publicaciones: los tipos actuales Logro/Experiencia se adaptan para las tarjetas de pendientes. Los retiros se excluyen de esa cola. Esta adaptación de lectura no conecta todavía el editor ni el feed avanzado.
- Las acciones de solicitudes y suspensión esperan confirmación del servidor. Un error de lectura posterior no provoca repetir una escritura ya confirmada. La exclusión de escrituras simultáneas evita dobles clics; las revisiones siguen detectando cambios desde otra ventana.
- El contexto conserva la referencia a los datos y revisiones originales para las operaciones; no se confía en IDs/roles enviados por un selector visual.

## Indicadores sin datos de demostración

`connectedMetrics` calcula ocho semanas UTC a partir de las fechas guardadas. La línea de publicaciones usa envíos y publicaciones actualmente aprobadas, agrupadas por su fecha de publicación; no representa todas las decisiones históricas de moderación. Las series pequeñas de las tarjetas agrupan registros por fecha de alta/envío y estado actual, no reconstruyen instantáneas históricas del total.

La cuarta tarjeta muestra **Solicitudes aprobadas · total actual**, porque la API no proporciona aún una métrica de aprobaciones del mes. Se quitaron `baseMetrics`, `sparklines`, `weeklyActivity` y el mes fijo del dashboard conectado. Los ceros son válidos: no se rellenan con muestras. La interpolación del gráfico se limita a los valores de cada segmento para evitar curvas negativas inventadas con series de ceros; los ejes usan intervalos enteros.

## Límites explícitos de esta entrega

- Community sigue con su estado de demostración. Tras entrar se muestra el espacio protegido local, hasta conectar el diseño avanzado en el siguiente bloque.
- Las rutas oficiales de Publicaciones y Configuración indican conexión pendiente. Se conservan sus componentes originales en el repositorio para integrarlos; no se presentan como funciones ya persistentes. La moderación local anterior continúa disponible en `/gestion/publicaciones`.
- `/gestion`, sus avisos y demás herramientas previas no se eliminaron. La consolidación de rutas se hará tras completar el resto de la integración.
- La regla efectiva de visibilidad sigue siendo programa/grupo. La ficha y tabla conectadas lo indican; no presentan como aplicada una preferencia de comunidad amplia.
- El catálogo de programas/grupos sigue siendo de prueba. No hay nueva gestión de grupos, miembros avanzados, ajustes, archivos o roles administrativos en este bloque.
- Google, correo real y alojamiento siguen pendientes de la intervención final del usuario/CAI. No se publicó el proyecto.

## Pruebas y archivos

- `scripts/check-v1-connected.browser.mjs`: 30 comprobaciones en Brave y 30 en Opera GX sobre desarrollo local. Recorre registro oficial, rechazo de login pendiente, panel original, aprobación persistente, ficha/enlace, activación, login oficial, recarga, denegación de dashboard a sesión solo de alumno y suspensión desde la ficha. Comprueba cinco rutas a 1440, 768, 375 y 320 px (20 combinaciones por navegador).
- Comprobación adicional en Brave: autorización de menor mediante interfaz oficial, comparativa de tres indicadores con respuestas reales de la API y dashboard sin registros mediante respuestas de lectura vacías sustituidas en el navegador. Sin muestras ni `NaN` en este último escenario.
- Capturas inspeccionadas de dashboard de escritorio y login móvil. Se corrigió un desbordamiento de la tabla de alumnos a 768 px; la tabla tiene desplazamiento interno cuando necesita más anchura y conserva la presentación móvil existente.
- Suite Node: 48 resultados correctos, incluidos cuatro contenedores; incorpora una prueba de calendario/series vacías y las regresiones existentes del servidor. Lint, typecheck y build comprobados; continúa el aviso conocido por tamaño del bundle.
- No se repitieron los scripts de navegador antiguos que esperan login/registro simulados o la pantalla de acceso anterior de `/alumnos`: sus selectores y expectativas deben migrarse al recorrido oficial. El nuevo script es la referencia para este bloque. No se hicieron pruebas de Google/correo reales, dispositivos físicos ni auditoría de seguridad de producción.

Archivos: `src/features/admin/useAdminConnection.ts`, `connectedMetrics.ts`, `state.ts`, diálogos y gráficas existentes; `AdminLayout.tsx`; páginas originales `LoginPage`, `SignupPage`, `AdminPage`, `AdminRequestsPage`, `AdminStudentsPage`; redirección de `StudentArea`, router y estilos de tabla; script de navegador y prueba de métricas en `server/tests/dashboard-metrics.test.ts`. El siguiente bloque reutilizará `AdminPostsPage` y la interfaz avanzada de Community.
