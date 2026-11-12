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

Última entrega funcional revisada: `1b84fb3`. Siguiente trabajo autorizado por la planificación, pendiente de implementación: bloque 1 y después acceso/dashboard oficiales conectados. **No comenzar imágenes ni otra administración paralela.**

Al cerrar cada tarea añadir: rama/base y commit; archivos de interfaz reutilizados; datos/endpoint conectado; criterio de cierre demostrado; pruebas realmente ejecutadas; pendientes. «Implementado en una rama», «integrado visualmente», «conectado al servidor», «probado localmente» y «listo para producción» son estados distintos y nunca intercambiables.
