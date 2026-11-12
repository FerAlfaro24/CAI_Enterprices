# Estado oficial y orden de integración de CAI

Auditoría del 11 de noviembre de 2026. Leer antes de planear o implementar otra tarea. Este documento prevalece sobre las descripciones históricas de demostración de los demás documentos; las instrucciones nuevas del usuario tienen prioridad. Actualizarlo al cerrar cada integración.

## 1. Decisión y límites

- **Base oficial de interfaz y producto: `release/cai-demo-v1.0`, commit `f3ba46b`.** Contiene landing, login/registro, dashboard administrativo completo y Community avanzada. No reconstruirlos.
- **Avance técnico acumulado: `feat/local-password-recovery`, commit `1b84fb3`.** Contiene v1.0 y seis commits posteriores. Sus servicios locales son aprovechables, pero sus pantallas paralelas NO sustituyen el diseño oficial ni constituyen una versión final integrada.
- `main`, `a3c2569`, está 12 commits detrás de v1.0 por alcance del historial; no es la base de desarrollo de esta integración.
- La auditoría no fusiona ni elimina ramas, no cambia código de aplicación y no despliega nada. El cambio de esta entrega es documentación y reglas de continuidad.
- El problema actual es integración incompleta y duplicación de interfaces. Parte del trabajo técnico sí era necesario; ampliar una administración y comunidad simplificadas separadas consumió trabajo que debió dirigirse al diseño existente.
- No describir la aplicación como terminada, operativa con alumnos reales o lista para producción. No asignar porcentajes de avance sin criterios comprobables.

## 2. Ramas revisadas y relación real

Se actualizó `origin` con `git fetch origin`. Se revisaron las 15 ramas remotas de trabajo; las ocho ramas locales existentes reflejan un subconjunto de ellas. `origin/HEAD` es un alias de `origin/main`, no otro trabajo. Referencias al inicio de la auditoría:

| Rama, omitiendo `origin/` | Commit | Relación y contenido | Tratamiento |
| --- | --- | --- | --- |
| `main` | `a3c2569` | Base inicial más landing; antecesor de v1.0 | Conservar; no tomarla como versión más completa. |
| `chore/project-foundation` | `e3ac8fd` | Documentación inicial y reglas. Su árbol es idéntico a `e707cdb`, ya en el historial oficial. | Histórico; nada pendiente de fusionar. |
| `feat/frontend-foundation` | `eca282f` | Fundación React/TS/Vite; `git cherry` confirma parche equivalente ya incorporado. | Histórico; no repetir integración. |
| `feat/landing-page` | `a37bb08` | Landing; `git cherry` confirma parche equivalente incorporado. | Histórico; conservar versión y pulidos de v1.0. |
| `feat/admin-dashboard` | `f38b17c` | Dashboard, solicitudes, publicaciones, alumnos, ajustes y registro. Antecesor de v1.0. | Ya integrado visualmente; reutilizar. |
| `feat/auth-pages` | `f38b17c` | Apunta exactamente al mismo commit que admin-dashboard. | No es otro avance independiente. |
| `feat/community` | `a6d9603` | Comunidad funcional simulada; antecesor de v1.0. | Ya incluida; no recuperar una versión anterior. |
| `feat/community-visual-polish` | `12cf1ce` | Inicio editorial, motion, galería, retos, logros y auditoría; antecesor de v1.0. | Ya incluida en la interfaz oficial. |
| `release/cai-demo-v1.0` | `f3ba46b` | Merge del panel/registro con Community pulida y landing. | Referencia oficial a preservar. |
| `feat/admin-guided-requests` | `a54e401` | v1.0 + revisión guiada de solicitudes; 1 commit posterior. | Conservar mejora dentro del panel original. |
| `feat/local-access-backend` | `f3f07b9` | Cadena anterior + Node/SQLite, solicitudes, administración local y permisos; 2 commits. | Integrar servicios en interfaz oficial. |
| `feat/student-account-activation` | `e92fff8` | Cadena anterior + activación, contraseña, sesiones y grupo; 3 commits. | Conservar lógica; integrar acceso y perfil existentes. |
| `feat/google-signin-onboarding` | `35cfe1c` | Cadena anterior + Google opcional y solicitud obligatoria; 4 commits. | Preparado; registro y prueba Google real pendientes. |
| `feat/local-publications-moderation` | `a60d0a6` | Cadena anterior + texto persistente, revisión, motivos y retiros; 5 commits. | Conectar a dashboard y feed oficial. |
| `feat/local-password-recovery` | `1b84fb3` | Cadena anterior + recuperación y avisos locales; 6 commits. | Último avance técnico acumulado revisado. |

Las ramas recientes son una cadena: `v1.0 → guiado → backend → activación → Google → publicaciones → recuperación`. La última ya contiene las otras cinco. No fusionarlas todas como si fueran contribuciones independientes. La falta de relación directa por SHA en algunas ramas antiguas se explica por integración equivalente; no significa trabajo perdido.

## 3. Qué existe y en qué forma

**Visual** significa una interfaz ya implementada. **Demo** significa acciones en memoria con datos ficticios. **Local persistente** significa sesiones/permisos y datos en el servidor de este equipo. Ninguna de esas etiquetas implica producción.

| Función | Qué ofrece v1.0 | Avance posterior aprovechable | Falta unir o completar |
| --- | --- | --- | --- |
| Identidad visual y navegación | Landing, logotipos, tipografía, temas, móvil, layouts y enlaces | Estilos locales complementarios | Conservar composición; llevar enlaces al recorrido conectado. |
| Sitio institucional | Programas, servicios, metodología, testimonios y contacto visual | Sin servicio de contacto persistente | Contenido comercial confirmado, contactos reales y receptor del formulario. |
| Contacto y lista de interés | `DemoForm.tsx` valida y muestra simulación | Ningún endpoint/tablas de contactos | Crear solo el guardado/gestión necesarios; no rehacer formulario. |
| Acceso | `/login` diseñado; entrada demo sin autenticación | Login real local de alumno y administrador, cookies, cierre y permisos | Usar diseño existente y roles del servidor; proteger rutas finales. |
| Solicitud | `/registro`, pasos, edad, tutor, programa/grupo y privacidad; alimenta panel demo | Mismo `SignupForm` con modo local en `/registro-local`, folio servidor y persistencia | Adoptar modo conectado en registro oficial; una sola solicitud. |
| Tutores | Interfaz/validaciones demo | Confirmación administrativa con referencia persistente | Reutilizar diálogo; proceso y textos de autorización confirmados por CAI. No hay prueba automática de identidad/edad. |
| Dashboard | Menú lateral, tarjetas, gráficas, resúmenes y pendientes | Datos locales de solicitudes/alumnos/publicaciones | Conectar métricas/fechas y acciones; eliminar cifras base ficticias del modo conectado. |
| Solicitudes administrativas | Tabla, filtros, búsqueda, detalles, aprobar/rechazar/deshacer | Revisiones, conflictos, autorización y auditoría de servidor | Conectar páginas originales a API y errores/cargas reales. |
| Alumnos | Directorio, filtros, ficha, suspensión/activación demo | Directorio SQLite, suspensión efectiva y enlaces de activación | Conservar tabla/ficha y trasladar acciones reales. Falta editar/asignar grupos. |
| Activación | No hay activación real | Enlaces de un uso/24 h, contraseña, sesión y bloqueo de suspendidos | Incorporar al recorrido oficial, sin perder controles existentes. |
| Comunidad e inicio | Feed editorial, filtros, tarjetas, perfil, detalle y composición completos en demo | Feed de texto por grupo en `/alumnos/publicaciones` | Conectar diseño oficial; usuario autenticado, sin identidad fija Alex ni selector de rol demo. |
| Publicaciones/moderación | Panel y Community tienen escenarios demo separados | Texto persistente, revisión, rechazo con motivo, retiro y auditoría | Una publicación y una decisión compartidas entre dashboard/feed; adaptar contratos. |
| Miembros/perfiles | Directorio y perfiles ficticios avanzados | Perfil propio y nombres visibles del mismo grupo | API mínima y modelo de miembro autorizado, sin exponer expedientes/tutores/correos. |
| Grupos/programas | Catálogo de muestra | Servidor valida usando `mockData.ts`; asignación guardada como texto | Catálogo controlado y asignación administrable; no confundirlo con CRUD ya existente. |
| Ajustes de comunidad | Interruptores y vista previa; equipo ficticio | Reglas fijas de servidor para algunos permisos | Persistir ajustes aprobados y aplicarlos realmente. No mostrar como operativo un interruptor sin efecto. |
| Administradores | Equipo ficticio en ajustes | Una cuenta local creada por setup, rol `admin` | Cuenta del cliente, cambio/recuperación administrativa y procedimiento de entrega. No hay gestión completa de equipo ni rol moderador real. |
| Recuperación alumno | No hay recuperación funcional | Enlaces 15 min/un uso, revocación y formulario local | Integrar acceso visual y entregar al destinatario con correo real antes de producción. |
| Avisos locales | Avisos de contenido fijado en Community demo | Bandeja de eventos de solicitudes/publicaciones/recuperación | Son conceptos distintos. Integrar bandeja administrativa; configurar entrega de correo aparte. |
| Google | No existe autenticación Google | Verificador oficial, identidad estable, onboarding y aprobación | Usar cuenta/proyecto de CAI y prueba real; no bloquea integración por contraseña. |
| Fotografías/galería | Galería avanzada con stock y selección ilustrativa | No hay subida/almacenamiento privado/API de imágenes | Conservar galería; implementar archivos autorizados, permisos, retirada y validación. Primera entrega prevista: imágenes administrativas. |
| Avisos institucionales/eventos | Existen como tipos/ejemplos en Community | Backend de publicaciones solo admite logro/experiencia | Decidir alcance y conectar creación administrativa si entra en primera entrega. |
| Comentarios/reacciones | Interacciones demo completas | Sin tablas/API persistentes | Conservar referencia visual; alcance pendiente. No contarlas como integradas. |
| Retos/logros/insignias | UI y reglas demo avanzadas, incluyendo solicitudes/revisión | Sin persistencia/cuentas reales para estas funciones | Prioridad secundaria del plazo actual; no rehacer ni prometerlas productivas. |
| Base y auditoría | No hay base real | SQLite, 5 migraciones, sesiones, solicitudes, alumnos, publicaciones y avisos | Conservar migraciones/datos; decidir despliegue compatible al cotizar. No se ha implementado PostgreSQL. |
| Respaldos | No hay respaldo de datos del producto | Snapshot SQLite y prueba de restauración básica existente | Restauración integral con archivos/configuración en entorno de entrega. |
| Internet | Prototipo | API bloqueada a localhost y rechaza `NODE_ENV=production` | HTTPS, secretos, orígenes, correo, archivos, operación y despliegue controlado. Presupuesto al final, como acordado. |

## 4. Separaciones y diferencias que deben resolverse

### Tres fuentes de datos

1. `DemoStoreProvider`/`features/admin/state.ts`: registro y panel demo comparten solicitudes, alumnos derivados, publicaciones propias y ajustes. Se conserva entre rutas porque el proveedor está arriba; no sobrevive a recarga.
2. `CommunityProvider`/`features/community/model.ts`: publicaciones, perfiles, moderación, retos y logros de Community son otro estado en memoria. **Publicar en el panel demo no publica en Community.** Esta separación ya existía en v1.0.
3. `server/*` y `.local/cai.sqlite`: datos persistentes y permisos locales, usados por `/gestion`, `/alumnos`, `/registro-local` y rutas auxiliares. No alimentan el dashboard/feed oficiales.

El objetivo es que dashboard y Community conectados consulten los mismos servicios, conservando sus vistas. No crear un cuarto conjunto de datos ni copiar fixtures a la base como si fueran alumnos.

### Diferencias concretas

- Admin demo: estados `pendiente/publicada/rechazada`; Community: `pending/approved/rejected`; API: incorpora `retirada`. Definir mapeo explícito sin perder el retiro ni sus restricciones.
- Tipos: admin demo tiene logro/experiencia/reseña/evento; Community usa categorías en inglés e incluye anuncios/galería/eventos; API solo `achievement/experience`. No inventar soporte de tipos faltantes al renderizar.
- IDs: alumnado demo usa `AL-*` y solicitudes `CAI-*`; Community usa `alex`, `luna`, etc.; servidor usa expedientes `CAI-*`. Los contratos del feed/directorio real no suministran todavía todos los campos de los perfiles avanzados.
- `getMember()` devuelve Alex Demo como fallback si no reconoce un ID. Ese comportamiento no debe resolver identidades reales: mostraría un autor ficticio.
- Privacidad: opciones demo de comunidad amplia no equivalen al feed actual por programa/grupo. Confirmar regla final con CAI; mantener restricción actual hasta entonces.
- Formularios de contraseña demo aceptan reglas distintas del acceso real; el registro conectado no solicita contraseña antes de aprobar. Unificar textos y validación con el servidor existente.
- Gráficas: hay series, fechas y cifras ficticias (`sparklines`, `weeklyActivity`, `baseMetrics`, octubre fijo). La API no tiene aún agregaciones completas. Conservar gráficos, obtener datos reales y manejar vacío/división por cero; no rellenar con historia inventada.
- Ajustes: `AdminSettingsPage` solo cambia estado/vista previa. No configura la API ni las interacciones reales de Community.
- El backend depende del catálogo ficticio del frontend en `server/validation.ts`; separar el catálogo aprobado del conjunto de alumnos de muestra.
- La recuperación local permite al administrador preparar un enlace de prueba; no acredita propiedad del correo. No trasladar esa herramienta a producción como recuperación operativa.
- La interfaz de avisos no es un sistema de correo: no tiene entrega, reintentos de proveedor ni verificación de destinatario. Los avisos fijados del feed son otra función.

## 5. Orden de trabajo con criterios de cierre

No avanzar a nuevas funciones para compensar integraciones sin terminar. Cada bloque requiere revisión de archivos existentes, un cambio acotado, pruebas y actualización de este estado.

### Prioridad operativa acordada: avanzar sin intervención del usuario

El usuario quiere poder dejar tandas de trabajo en marcha sin tener que responder durante su ejecución. Completar primero todo el trabajo independiente autorizado, respetando el orden técnico de integración. Una dependencia humana de una función no bloquea las otras funciones.

- **Trabajo autónomo primero:** contratos y rutas, integración del diseño v1.0, sesiones por contraseña, permisos, dashboard/Community conectados, grupos/ajustes mínimos, formularios y datos locales, preparación de correo/Google, archivos privados con muestras ficticias, pruebas, correcciones, documentación y puntos de retorno en Git conforme a la autorización existente.
- **Intervención humana al final, agrupada:** registrar/configurar cuentas de CAI y sus verificaciones (Google, correo, dominio y servicios); facilitar contenido definitivo y decisiones de negocio; revisar el uso con el administrador; aprobar presupuestos, contratación y publicación. No solicitar contraseñas ni códigos de verificación para guardarlos en el proyecto.
- **Mientras falte una respuesta:** conservar datos de muestra identificados como tales, Google desactivado y reglas de privacidad conservadoras ya documentadas. Preparar lo que se pueda y pasar a otra tarea independiente. Una decisión pendiente se registra, no se convierte en un supuesto confirmado ni en una función añadida sin autorización.
- **Antes de entregar o publicar:** completar las pruebas reales que dependen de esas cuentas y las validaciones humanas. Posponerlas permite avanzar localmente; no permite afirmar que Google, correo, contenido o producción quedaron verificados.

Lista de dependencias humanas a mantener al cerrar tareas:

| Dependencia | Preparación autónoma | Acción final del usuario/CAI |
| --- | --- | --- |
| Google | Integración opcional, onboarding y pruebas locales con proveedor ficticio | Cuenta/proyecto de CAI, registro y prueba real autorizada. |
| Correo | Eventos/avisos, flujos de activación/recuperación y preparación del transporte | Proveedor y cuenta de CAI, verificaciones necesarias y prueba de entrega real. |
| Contenido y reglas del negocio | Formularios, validaciones, opciones editables dentro del alcance y lista de decisiones | Confirmar textos, contactos, programas/grupos, visibilidad y responsables. |
| Tutores e imágenes | Controles y pruebas exclusivamente ficticias | Confirmar proceso de autorización y permisos de material real. |
| Infraestructura | Aplicación local integrada, requisitos de instalación, respaldo y propuesta técnica | Elegir presupuesto, contratar y autorizar despliegue. |
| Revisión de uso | Recorridos automatizados, móvil/teclado y guía de tareas | Validación final con la persona que administrará CAI. |

La siguiente tabla expresa dependencias técnicas. Sus menciones a confirmaciones del cliente no exigen detener el resto del bloque o el proyecto: separar preparación autónoma de aceptación externa y registrar ambas.

| Orden | Trabajo | Reutilizar | Criterio de cierre |
| --- | --- | --- | --- |
| 0, esta auditoría | Fijar inventario, base, pendientes y protocolo | Historial y código existente | Documento de estado y reglas accesibles; sin fusión de aplicación. |
| 1 | Acordar contratos y destino de rutas. Preparar rama de integración desde el descendiente técnico revisado de v1.0 | `1b84fb3` ya contiene `f3ba46b` | Mapa de estados/IDs/categorías y campos; v1.0 preservada. No requiere fusionar seis ramas otra vez. |
| 2 | Integrar acceso, registro, activación y protección con diseño oficial | `LoginPage`, `SignupPage`, `SignupForm`, sesiones y API actuales | Solicitud oficial persiste; pendiente no entra; alumno no abre admin; sesión real determina rol. Google puede seguir desactivado. |
| 3 | Conectar dashboard, solicitudes y alumnos originales | `AdminLayout`, páginas y diálogos existentes; `localApi` | Acción en panel original cambia SQLite, contadores y directorio; reinicio conserva estado; tutor/suspensión se aplican en servidor. Gráficas con datos disponibles/vacío correcto. |
| 4 | Conectar composición, feed y moderación oficiales | `HomeView`, tarjetas, Composer, historial y `publications.ts` | Envío real aparece pendiente en panel; aprobar aparece en Community autorizado; rechazo informa al autor; retiro y suspensión se reflejan. Dos sesiones independientes, sin Alex ni fixtures. |
| 5 | Consolidar perfil, catálogo/grupos y ajustes mínimos | Ficha/directorio/ajustes visuales existentes | Asignación real, acceso coherente al cambiar grupo y reglas realmente aplicadas. Funciones sin backend no se presentan como activas. Confirmar necesidades de equipo administrador. |
| 6 | Incorporar recuperación/avisos al panel/acceso oficiales y resolver contacto institucional | `notices.ts`, `RecoveryPage`, `DemoForm` | Bandeja persistente; contacto guardado/atendible; ningún mensaje afirma correo enviado sin entrega. La recuperación por destinatario sigue condicionada al servicio real. |
| 7 | Archivos privados e imágenes de administración | Galería y componentes visuales v1.0 | Subida validada, límites, permiso por recurso, autorización de imágenes y retirada. Sin URLs públicas de menores ni reescritura de galería. |
| 8 | Limpieza controlada de rutas duplicadas y navegación | Rutas oficiales | Recorrido único coherente. `/gestion` y pantallas provisionales se retiran/redirigen solo tras equivalencia comprobada. No borrar datos o ramas como parte de esta limpieza sin autorización. |
| 9 | Estabilizar y validar contenido/uso con cliente | Pruebas existentes y nuevas de integración | Pruebas de recorrido conjunto en Brave/Opera, móvil/teclado, errores, permisos, respaldo/restauración y tareas sencillas de administración. Contenido y privacidad validados. |
| 10 | Configuración externa, presupuesto y entrega | Servicios ya probados localmente | Cuenta de CAI para Google/correo/dominio/infraestructura; prueba real de Google y correo antes de admitir usuarios. Despliegue solo después de presupuesto y autorización. |

Los bloques 2–4 son la prioridad inmediata. Los cambios de asignación de grupos del bloque 5 deben mantener el aislamiento del bloque 4. Las funciones secundarias (retos/insignias/comentarios/reacciones) conservan su demo, pero su integración persistente requiere decisión de alcance; no se añaden automáticamente al plazo de tres semanas.

Rutas objetivo: conservar `/`, `/login`, `/registro`, `/admin/*` y `/community` como experiencia principal. Activación/recuperación pueden seguir siendo enlaces auxiliares. Determinar durante el bloque 1 dónde reside la ficha de cuenta; no reemplazar Community por el listado sencillo de `/alumnos/publicaciones`. Ninguna redirección debe abrir rutas protegidas ni hacerse antes de conectar su destino.

El horizonte acordado sigue siendo tres semanas, del 11 de noviembre al 2 de diciembre de 2026: primero integración esencial, después huecos de producto, última semana estabilización. El orden anterior no es una estimación garantizada por tarea. Tras el primer recorrido conjunto se debe revisar capacidad y recortar funciones secundarias si es necesario. Cotizar alojamiento al final no significa posponer permisos, privacidad o diseño de almacenamiento.

## 6. Qué se conserva, adapta y retira después

- **Conservar:** diseño y componentes oficiales v1.0; revisión guiada posterior; servicios, migraciones, validación, cuentas, permisos, auditoría y pruebas útiles.
- **Adaptar:** conexión de datos, contratos y estados; KPIs/gráficas; identidad real en Community; rutas/login, textos, perfil/directorio y configuración.
- **Sustituir en la experiencia final tras comprobar equivalencia:** navegación y listas paralelas de `LocalAccessApp`, directorio básico de `StudentArea`, feed/lista simplificada de `local-publications` y formularios de acceso duplicados. Extraer acciones útiles, no descartarlas con sus reglas.
- **Mantener como referencia histórica:** ramas oficiales y previas. No se propone borrar ninguna rama.
- **Pendiente de cliente:** contenidos/precios/contacto, grupos y programas, responsable de administración, autorización de tutores/imágenes, visibilidad, interacciones y servicios/cuentas bajo control de CAI.

## 7. Verificación de esta auditoría y límites

Se revisaron refs remotas actualizadas, árbol de commits, relaciones de ancestros, equivalencias de parches y árboles, diferencias v1.0→avance acumulado, rutas, proveedores de estado, formularios, contratos, endpoints, esquema y documentación. Admin-dashboard y auth-pages comparten SHA; Community y pulidos son ancestros de v1.0. El árbol de foundation coincide exactamente con su integración; frontend y landing tienen equivalencia de parche. Las seis mejoras posteriores son descendientes directas en cadena.

Reejecutado sobre `1b84fb3`: lint, typecheck y build correctos; aviso conocido de bundle principal (~658 KB minificado). Suite API: 47 resultados correctos, incluidos cuatro contenedores. Los cinco scripts de modelos Community pasan: 29, 23, 25, 27 y 51 comprobaciones, respectivamente, además de comparaciones de igualdad donde corresponde.

No se reconstruyó ni se recorrió visualmente cada rama histórica por separado. No se repitieron en esta auditoría los recorridos de navegador: sus resultados anteriores siguen documentados como históricos, no como prueba de la futura unión. Google real, correo real, infraestructura, archivos privados y un recorrido completo de dashboard/Community con servidor siguen sin validar. Esto es una auditoría de estado e integración, no una auditoría exhaustiva de seguridad ni garantía de ausencia de errores.

## 8. Registro de continuidad

### Control antes y después de cada cambio lógico

Antes de modificar una función: leer este registro, comprobar rama/estado de Git y localizar su implementación existente. Definir qué pendiente se resolverá y cómo se comprobará. Después de cada avance coherente: registrar resultado, archivos/servicios afectados, comprobación ejecutada y siguiente paso. No esperar al final de una sesión larga para actualizar un avance significativo.

Usar estados explícitos: **pendiente**, **en curso**, **implementado sin comprobar**, **comprobado localmente** y **dependencia externa pendiente**. Conservar incidencias o pruebas fallidas relevantes hasta documentar su corrección y nueva comprobación. No guardar contraseñas, tokens ni información de alumnos en esta bitácora. Un cambio documental no requiere repetir pruebas de aplicación ni se cuenta como una función nueva.

| Hito | Estado actual | Evidencia / punto de retorno | Falta |
| --- | --- | --- | --- |
| Auditoría y base oficial | Comprobado | `bd3e606`; v1.0 `f3ba46b`; inventario de esta guía | Mantener fotografía histórica y registro actual diferenciados. |
| Prioridad de trabajo autónomo | Registrada | `be90193` | Agrupar intervención humana al final; continuar tareas independientes. |
| Registro, acceso, aprobación, activación y suspensión con diseño v1.0 | Comprobado localmente | `8e205b0`; `v1-connected-access.md`; nuevo recorrido de navegador | Google/correo reales siguen pendientes. |
| Dashboard, solicitudes y alumnos originales conectados | Comprobado localmente en el alcance descrito | `8e205b0`; 48 resultados Node, 30 comprobaciones por navegador Brave/Opera; contraste de indicadores, vacío y autorización de menor | Grupos/perfil completo/ajustes y demás bloques siguen pendientes; moderación se completó después, en la fila siguiente. |
| Moderación y Community avanzadas, bloque 4 | Comprobado localmente en `feat/v1-community-connected`, base `cf12d8a` | `f9e60bc` (interfaz) y `4c0af54` (contratos); `v1-connected-community.md`; 48 resultados Node, 39 comprobaciones por navegador Brave/Opera, respaldo antes de migración 6 | Configuración, grupos/perfil completo, archivos e interacciones secundarias siguen pendientes. |
| Grupos, asignaciones y ajustes mínimos, bloque 5 | Comprobado localmente en `feat/v1-groups-settings`, base `9a5ef81` | `45900a2` y `08ce05d`; `v1-groups-settings.md`; 56 resultados Node, 27 comprobaciones por navegador Brave/Opera; migración 7 respaldada | Catálogo final de CAI, edición completa de expediente/perfil y otras cuentas administrativas no incluidos. Avisos/recuperación/contacto se completaron después, en la fila siguiente. |
| Recuperación, avisos y contacto oficiales, bloque 6 | Comprobado localmente en `feat/v1-inbox-recovery-contact`, base `e083c8f` | `4a84a05` y `8b81f90`; `v1-inbox-recovery-contact.md`; 63 resultados Node, 37 comprobaciones por navegador Brave/Opera, migración 8 respaldada | Correo real/identidad del destinatario, datos comerciales y entrega al cliente continúan pendientes. |
| Galería privada e imágenes administrativas, bloque 7 | Comprobado localmente en `feat/v1-private-gallery`, base `db45ac6` | `a703087` (bloqueo de archivos), `d763e94` (servicio), `9bd1c03` (interfaz); `v1-private-gallery.md`; 71 resultados Node, 37 comprobaciones por navegador, cuatro anchuras; respaldo previo a migración 9 y restauración de bytes | Permisos/material real y retención final de CAI; consolidar rutas (8), estabilizar (9), configuración/entrega (10). |

Lista de comprobación del bloque 4:

- [x] Contrato público con UUID estable compartido entre sesión, grupo y autor de publicación; migración 6 aditiva. API comprobada: 48 resultados correctos, incluida privacidad/aislamiento y persistencia al reiniciar. Adaptación visual comprobada en los recorridos del bloque.
- [x] Aplicar sesión y permisos a las consultas de Community conectada.
- [x] Conectar el editor existente con envío persistente y estado del autor.
- [x] Conectar la bandeja/detalle originales de moderación a las decisiones del servidor.
- [x] Mostrar aprobadas en el feed avanzado del programa/grupo autorizado.
- [x] Reflejar rechazo con motivo, retiro y suspensión sin mezclar datos de muestra.
- [x] Comprobar recorrido entre sesiones, recarga, errores y diseño adaptable en Brave/Opera.
- [x] Actualizar rutas, documentación y punto de retorno; indicar expresamente lo que siga pendiente.

Última base funcional auditada: `1b84fb3`. Después de la auditoría se completó el primer recorrido conectado en `integration/cai-v1-connected`, desde `be90193`: registro/login oficiales, protección administrativa, solicitudes y alumnos en dashboard original, activación/suspensión e indicadores con datos del servidor. Detalles, archivos y pruebas en `v1-connected-access.md`; identificar su commit con `git log -- docs/v1-connected-access.md`.

Estado de bloques: 1 resuelto para acceso/solicitudes/directorio; 2 comprobado por contraseña; 3 conectado en esas vistas e indicadores; 4 comprobado localmente con moderación y Community avanzadas; 5 catálogo/asignaciones y ajustes mínimos; 6 recuperación, avisos y contacto oficiales; 7 imágenes administrativas y galería privada existentes conectadas. Consultar sus documentos `v1-*.md`. **Siguiente bloque: 8, consolidación de rutas y navegación**, después estabilización conjunta. La edición completa de expediente/perfil y otras cuentas administrativas siguen pendientes. La tabla de ramas y el inventario de las secciones 2–4 son la fotografía de la auditoría previa, no una afirmación de que estas integraciones posteriores no existan. **No reconstruir galería, administración ni recorridos ya conectados.**

Al cerrar cada tarea añadir: rama/base y commit; archivos de interfaz reutilizados; datos/endpoint conectado; criterio de cierre demostrado; pruebas realmente ejecutadas; pendientes. «Implementado en una rama», «integrado visualmente», «conectado al servidor», «probado localmente» y «listo para producción» son estados distintos y nunca intercambiables.

### Notas cronológicas del bloque 4 (los pendientes intermedios se resolvieron según el cierre)

Avance intermedio del bloque 4: `public-profiles.ts`, migración 6 y DTO públicos comprobados con `npm run test:api` (48/48). El identificador público es opaco y no sustituye el folio privado de administración. Se añadió el proveedor protegido de Community; todavía sin conectar todas sus vistas ni comprobar en navegador.

Avance intermedio de interfaz: proveedor de Community con sesión real y datos del mismo grupo; reutilizados Composer, tarjetas, historial, directorio y diálogos. Bandeja y revisión originales de administración conectadas. Retos/insignias/galería se conservan en código, pero en sesión conectada muestran pendiente; reacciones/comentarios no simulan guardado. Lint, typecheck y build correctos; advertencia conocida de bundle principal ~668 KB. Navegadores y criterio de cierre todavía pendientes.

Incidencia de verificación del bloque 4: el primer recorrido necesitó corregir selectores del propio script (texto accesible repetido y filtro de alumnos suspendidos). Después se detectó desbordamiento real del encabezado de revisión con título largo a 375 px; se añadió min-width/ajuste de palabras al contenedor original. Pendiente repetir recorrido completo tras la corrección; no se cuenta un recorrido incompleto como aprobado.

Verificación intermedia superada: `check-community-connected.browser.mjs`, 39 comprobaciones en Brave y 39 en Opera GX. Cuatro sesiones independientes, pérdida de respuesta y reintento sin duplicación, revisión/privacidad/rechazo/retiro/suspensión y cuatro anchuras (1440/768/375/320). Corregido y vuelto a comprobar el desbordamiento móvil. Cero errores de ejecución de JavaScript en los recorridos; las denegaciones 401 y la red interrumpida intencionalmente son escenarios de prueba. Capturas de escritorio y móvil inspeccionadas en Brave. Cierre documental y Git pendientes.

Cierre del bloque 4: contrato público guardado en `4c0af54`; rama `feat/v1-community-connected`, base `cf12d8a`; alcance, archivos, pruebas y límites en `docs/v1-connected-community.md`. Puntos de retorno: `4c0af54` (identidad pública) y `f9e60bc` (Community/moderación comprobadas). Lint, typecheck, build y API volvieron a pasar al cierre; actualización manual de bandeja comprobada en ambos navegadores. No se fusiona implícitamente a `release/cai-demo-v1.0` ni a la rama de integración.


### Notas cronológicas del bloque 5 (los pendientes intermedios se resuelven en el cierre)

Rama `feat/v1-groups-settings`, base `9a5ef81`. Respaldo previo a migración 7 realizado. Reutilizar Configuración y ficha del alumno de v1.0; no abrir un panel paralelo. Alcance: catálogo persistente con alta/archivo/reactivación, asignaciones administrativas y controles reales para pausar solicitudes/envíos. Archivo de grupos impide nuevas selecciones, sin expulsar alumnos actuales; las reglas de privacidad siguen protegidas. Cambiar asignación exigirá confirmación en la interfaz, cerrará sesiones e impedirá que publicaciones antiguas migren de audiencia o se republicuen al volver de grupo.

- En curso: migración 7 y servicios. El primer intento de pruebas detectó una importación de frontend sin extensión compatible con Node; corregida para reutilizar directamente la semilla histórica. No se declara comprobado hasta repetir pruebas.
- Pendiente: prueba de permisos/concurrencia/aislamiento al reasignar; conectar formulario de registro al catálogo; adaptar Configuración y ficha originales; pruebas de navegador y cierre documental/Git.
- Perfil completo: en este bloque se consolida la inscripción y su asignación. Edición de nombre legal/edad/consentimiento y gestión de otros administradores no se añade automáticamente al alcance.

Avance del bloque 5: migración 7, catálogo, controles y reasignación comprobados con 56 resultados de servidor y typecheck. La migración conserva incluso registros históricos no interpretables sin modificarlos; se corrigió el supuesto de JSON válido detectado por la prueba de versión 1. Alta/archivo/reactivación, pausas, revisiones obsoletas, permisos, audiencia de historias al cambiar/volver de grupo y reinicio comprobados. Interfaz todavía pendiente.

Avance de interfaz del bloque 5 (todavía sin comprobar en navegador): Configuración original adapta controles reales, reglas protegidas, funciones pendientes y sesión administrativa sin equipo ficticio; alta/archivo/reactivación de grupos; ficha original con reasignación confirmada. Registro y Community consultan catálogo/pausas del servidor. No se afirma cierre hasta comprobar recorridos y móvil.

Verificación de interfaz del bloque 5: el primer recorrido comprobó catálogo dinámico, pausas y archivo/reactivación, pero detectó que las etiquetas de los selectores de asignación incluían las opciones en su nombre accesible. Se separaron etiquetas y selectores para que sean identificables correctamente. Pendiente repetir el recorrido completo y cerrar el bloque.

El segundo recorrido del bloque 5 completó reasignación, revocación, aislamiento entre grupos y vuelta sin republicar, pero encontró desbordamiento móvil por el nombre largo del programa en la ficha. Se limitaron las columnas de la ficha existente y el ajuste de texto; se repetirá el recorrido después de verificar la corrección. No se dan por superados recorridos incompletos.

Verificación del bloque 5 superada: 27 comprobaciones en Brave y 27 en Opera GX, cada recorrido con administrador y tres alumnos en contextos independientes. Alta de catálogo desde Configuración y solicitud desde registro originales, pausas/reapertura, archivo sin expulsar miembros, reasignación con confirmación, nuevo login, audiencia conservada y vuelta sin republicación. Configuración/ficha a 1440/768/375/320 px. Corregidas las etiquetas accesibles y el desbordamiento con programa largo; se repitieron ambos recorridos completos. Cierre documental/Git pendiente.

Cierre del bloque 5: comprobados catálogo persistente, Configuración original, asignación confirmada desde ficha, registro dinámico, pausas y aislamiento al reasignar. Puntos de retorno guardados: `45900a2` (servidor) y `08ce05d` (interfaz/pruebas). Faltan los bloques 6 en adelante y los límites de perfil/equipo indicados en ese documento. No se da por terminado el producto ni se publica el sitio.

Lista de comprobación del bloque 5:
- [x] Respaldo, migración aditiva y catálogo compartido por registro/asignación.
- [x] Alta/archivo/reactivación de grupos y controles aplicados en servidor.
- [x] Ficha original con confirmación, revisiones y nueva entrada del alumno.
- [x] Historial/audiencia conservados al cambiar y volver de grupo.
- [x] Configuración coherente con funciones realmente disponibles, sin equipo ficticio.
- [x] Pruebas de servidor, ambos navegadores, errores, móvil, lint/typecheck/build y documentación.

Siguiente tarea autónoma: reutilizar `notices.ts`, recuperación existente y componentes oficiales para conectar avisos y recuperación en un solo recorrido. Verificar primero lo ya hecho; Google/correo/cuentas/presupuesto siguen para el final. No comenzar otra administración ni reconstruir el contacto sin revisar el formulario existente.


### Notas cronológicas del bloque 6 (los pendientes intermedios se resuelven en el cierre)

Rama `feat/v1-inbox-recovery-contact`, base `e083c8f`. Respaldo previo a migración 8 realizado. Se reutilizan `notices.ts`, recuperación/activación existentes, `LocalNotices`, `LoginPage`, el panel original y `DemoForm` de contacto. Alcance: recuperación con diseño oficial; mensajes de contacto persistentes y atendibles en administración; bandeja de avisos administrativa y avisos propios del alumno con lectura independiente. No entrega de correo ni reservas, sin convertir la lista de interés de cursos futuros en un servicio nuevo.

Implementado sin cierre: migración 8, contacto con consentimiento/idempotencia/seguimiento, avisos propios filtrados por sesión. Las 56 regresiones previas pasaron antes de incorporar pruebas nuevas; un error de sintaxis al ampliar la validación de notas se corrigió y se están repitiendo las pruebas. No se da por validada todavía la interfaz.

Cierre previsto: probar permisos, privacidad, concurrencia y persistencia; recorrer contacto → seguimiento y login → recuperación → aviso → cambio → nuevo login con sesiones separadas; verificar lectura propia, móvil, errores, lint/build, documentación y puntos de retorno. Google/correo/datos comerciales siguen para el final.

Avance comprobado del bloque 6: servidor con 63 resultados correctos y typecheck; contacto privado/idempotente, seguimiento con revisiones y notas, avisos por sesión con lectura independiente y persistencia al reiniciar. Implementación de interfaz: marco de acceso original compartido por login/activación/recuperación, mensajes en panel oficial, contacto original persistente y avisos propios en Mi espacio. Falta comprobar recorridos y móvil en navegador.

Verificación del bloque 6 en curso: los primeros intentos de navegador necesitaron llevar al frente la ventana de contacto durante el reintento; el botón respondía al probarlo en la ventana activa. Se ajustó el script para probar las sesiones en primer plano, sin forzar clics ni sustituir interacciones por envíos directos. Se corrigió el espaciado de la casilla de consentimiento. No se cuentan esos intentos incompletos como recorridos aprobados.

El recorrido oficial del bloque 6 comprobó contacto/reintento/seguimiento, avisos propios y solicitud de recuperación. Detectó desbordamiento del correo largo en el texto del diálogo privado a 375 px. Se corrigió el ajuste de palabras del texto en el diálogo original; falta repetir el recorrido completo antes de contarlo como superado.

Verificación del bloque 6 en Brave: 37 comprobaciones completas superadas. Contacto con consentimiento, respuesta perdida y reintento único, seguimiento/nota persistente, avisos propios y separación de lectura/revisión, recuperación desde login oficial, revocación de otra sesión, contraseña larga y enlace de un uso. Cuatro anchuras 1440/768/375/320 para diálogo privado, seguimiento, recuperación y avisos. Corrección móvil repetida y cero errores de ejecución JavaScript. Opera y cierre final pendientes.

Verificación final del bloque 6: Opera GX también superó las 37 comprobaciones completas. En Brave se inspeccionaron además la bandeja de escritorio, bandeja móvil a 320 px, contacto móvil y recuperación móvil. Comprobada activación real desde su formulario compartido y vuelta al login oficial; se corrigió el color del enlace/botón de éxito tras compartir el marco de acceso. Backend: 63 resultados correctos. Lint/typecheck/build correctos, salvo aviso conocido de tamaño del paquete principal (~693 KB). Cierre documental y Git pendiente.

Cierre del bloque 6: contacto original persistente, seguimiento privado en panel oficial, bandeja administrativa reutilizada, avisos propios con lectura independiente y recuperación/activación con diseño oficial comprobados localmente. Rama `feat/v1-inbox-recovery-contact`, base `e083c8f`; puntos de retorno guardados: `4a84a05` (servidor) y `8b81f90` (interfaz/pruebas). No se da por comprobado correo real, reservas, identidad del destinatario ni producción.

Lista de comprobación del bloque 6:

- [x] Respaldo y migración aditiva, contacto idempotente y seguimiento con revisión.
- [x] Bandeja administrativa dentro del panel original, sin sustituirlo.
- [x] Avisos propios autorizados por sesión y lectura independiente de revisión administrativa.
- [x] Recuperación y activación con composición v1.0, sin prometer correo ni auto-login.
- [x] Cambio de contraseña probado entre sesiones y con más de 64 caracteres.
- [x] Recorridos completos Brave/Opera, cuatro anchuras, revisión visual, errores y lint/typecheck/build.
- [x] Registro de archivos/servicios, límites y puntos de retorno; correo y Google reales quedan para el final.

Estado al cierre histórico del bloque 6: bloques 2–6 conectados en los alcances descritos. La continuación de archivos/imágenes privadas se completó después, según el cierre del bloque 7 que sigue. Usar contenido ficticio; las autorizaciones y medios reales del cliente no se inventan.


### Notas cronológicas del bloque 7 (pendientes intermedios resueltos en el cierre)

Rama `feat/v1-private-gallery`, base `db45ac6`. Respaldo previo realizado. Reutilizar GalleryView, FeaturedAlbum, AlbumCard, AlbumDialog y GalleryImage; administración conserva el panel original. Primera entrega: imágenes subidas por administración y visibles solo para alumnos activos del programa/grupo elegido. No se amplía a subidas de alumnos ni a vídeos.

Diseño técnico: validar JPEG/PNG con decodificación real, límites de bytes/píxeles, reorientar/reducir y recodificar sin metadatos; almacenar la versión procesada como BLOB privado en SQLite para que el respaldo consistente incluya también imágenes. Ninguna ruta estática ni URL sin autorización. Metadatos públicos mínimos; referencia de autorización privada para administración. Retirada revoca acceso y conserva historial; no implica borrar registros ni originales del usuario. Se incorpora `sharp` por necesidad de decodificación/recodificación, sin nuevo framework.

Pendiente de comprobar: migración/servicio, permisos por recurso, aislamiento al cambiar grupo/suspender, validación y metadatos, retiro, respaldo/restauración con imagen y errores; interfaz original conectada y pruebas entre sesiones, móvil y ambos navegadores. Solo material ficticio; proceso y autorizaciones reales de CAI se validan al final.

Incidencia real del bloque 7: comprobaciones HEAD sin cookies detectaron archivos de `.local` accesibles directamente por Vite (estado 200), aunque la API estuviera protegida. Se añadió exclusión expresa de carpeta privada y Git en `server.fs.deny`, incluidas variantes de mayúsculas para Windows. No se descargaron ni imprimieron credenciales o base de datos; comprobar estado 403 y variantes antes de cerrar. La instalación de sharp informó 10 avisos moderados en herramientas ESLint/minimatch ya presentes; no corresponden a sharp. No aplicar fix --force: requiere cambio incompatible; registrar para estabilización.

Avance comprobado del bloque 7: typecheck y 71 resultados correctos del servidor. Pruebas nuevas de formato/daño/píxeles, recodificación sin EXIF, autorización por recurso, sesión caducada durante procesado, reintento, aislamiento por grupo, suspensión/reasignación, retirada y respaldo/reapertura con bytes de imagen. Siete rutas privadas de Vite bloqueadas con estado 403, incluidas mayúsculas, codificación, query raw y @fs. Interfaz todavía pendiente de integración y prueba.

Avance de interfaz del bloque 7: Galería privada integrada en el panel original (subida/revisión/retiro), GalleryView/FeaturedAlbum/AlbumCard/AlbumDialog reutilizados con datos autorizados del grupo. Typecheck/build correctos. Recorrido completo de Brave superado: 37 comprobaciones, imagen falsa, pérdida de respuesta y reintento único, aislamiento por recurso, datos públicos mínimos, filtros, visor, Escape/foco, retirada y cuatro anchuras 1440/768/375/320. Cero errores de ejecución JavaScript. Opera, inspección visual y cierre documental/Git pendientes.

Cierre del bloque 7: 37 comprobaciones completas también en Opera GX; 71 resultados de servidor, regresión histórica de galería (25 comprobaciones y cuatro igualdades), siete rutas privadas bloqueadas, lint/typecheck/build correctos. Inspección visual de administración escritorio/móvil, galería escritorio/móvil y visor a 320 px en Brave. La muestra visual adicional se retiró; no se borran alumnos ni historial. Puntos de retorno: a703087 (Vite privado), d763e94 (almacenamiento/permisos), 9bd1c03 (interfaz/recorrido). Detalles y archivos en docs/v1-private-gallery.md. Paquete principal ~704 KB; audit sin dependencias de desarrollo devuelve cero avisos. Diez avisos moderados de herramientas de desarrollo quedan para estabilización sin cambios incompatibles forzados.

Lista de comprobación del bloque 7:

- [x] Respaldo previo y migración aditiva; imágenes procesadas privadas incluidas en SQLite.
- [x] Decodificación JPEG/PNG, límites, reducción y salida sin metadatos; ninguna ruta estática para archivos recibidos.
- [x] Administración publica/retira con revisión y referencia privada; permisos por sesión/programa/grupo en cada recurso.
- [x] Galería y visor originales conectados sin mezclar stock ni funciones simuladas.
- [x] Reintento único, revocación al retirar/suspender/reasignar y respaldo/reapertura con bytes idénticos.
- [x] Brave/Opera, cuatro anchuras, teclado/foco, revisión visual y controles de calidad.
- [x] Bloqueo de archivos .local/Git verificado; documentación, instrucciones y README actualizados.

Estado vigente: bloques 2–7 comprobados localmente en sus alcances. Siguiente tarea autónoma: bloque 8, inventariar acciones de /gestion, /registro-local y /alumnos frente a destinos oficiales antes de redirigir. Conservar ficha de inscripción, activación/recuperación/enlaces útiles y permisos; no eliminar datos ni ramas. Después, estabilización conjunta y guía de administración; mantener registrados edición completa de expediente/perfil, otras cuentas administrativas y funciones secundarias aún pendientes. Google, correo real, contenido y consentimientos, revisión humana, presupuesto y alojamiento siguen para la tanda final acordada.
