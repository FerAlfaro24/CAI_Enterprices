# Insignias y reconocimientos conectados

Rama acumulativa `feat/v1-community-badges`, desde `980a1ec` (Retos comprobados). Puntos de retorno `bf9cf2e` servicio/migración/pruebas y `c8788bf` interfaz/recorridos. Conserva arte, identificadores y colección de v1.0, su demostración y todos los avances anteriores. Alcance comprobado localmente con datos ficticios; no despliegue ni aceptación con alumnos reales.

## Las nueve insignias y cómo se obtienen

| Camino | Insignias | Regla real |
| --- | --- | --- |
| Automático desde Retos | Primera respuesta | Una respuesta guardada, acierte o no. |
| Automático desde Retos | 3 días seguidos | Completar las tres preguntas diarias durante tres días consecutivos. No exige acertar todas. |
| Automático desde Retos | En comunidad | Completar las tres preguntas en cinco días; pueden ser separados. |
| Solicitud privada y revisión | Explorador de películas, Music Catcher, Book Buddy | Contar qué se practicó/aprendió; coordinación aprueba o indica qué reforzar. |
| Concesión directa de coordinación | Sin miedo al inglés, Buen compañero, Constancia | Coordinación elige alumno y reconocimiento y explica el motivo privado. |

Las reglas reales de días completos corresponden al progreso del servicio de Retos, no a los cinco días de demo. La demostración conserva sus propias reglas y está identificada como tal. Las concesiones no califican el nivel de inglés ni verifican por sí solas una declaración externa.

## Recorrido del alumno

- Logros muestra Mis logros y La comunidad. Colección personal con fecha/condición, catálogo con progreso y siguiente acción, solicitudes y motivos privados, historial de concesiones y correcciones. Retos enlaza esta colección y muestra sus tres insignias automáticas reales. Una celebración breve anuncia una concesión nueva durante la visita, sin reproducir premios antiguos al volver a entrar.
- Solicitud de 20–600 caracteres, una pendiente por insignia/alumno, con texto conservado ante error, reintento sin duplicados y retirada propia confirmada mientras está pendiente. Rechazar conserva motivo e historial y permite otra solicitud; retirar conserva el registro. Las solicitudes automáticas/institucionales no se pueden suplantar.
- Historial por páginas de veinte. Una pendiente fuera de la primera página sigue bloqueando otra solicitud: la instantánea incluye sus identificadores de insignia pendientes independientemente de la paginación.
- Conseguida y retirada son estados distintos. Una insignia retirada no reaparece al recalcular progreso. Coordinación puede restaurar la misma concesión; no se crea otro premio ni se cambia su fecha original.
- Compartir abre el Composer existente con un texto nuevo editable y un vínculo a una concesión propia activa. Nunca copia la solicitud ni los motivos privados. Cancelar no envía nada. La historia pasa por la moderación y audiencia por grupo ya existentes. Solo entonces aparece el distintivo vinculado en feed/detalle y La comunidad. No hay clasificación pública ni acceso al resto de colecciones ajenas.

## Coordinación

Sección **Insignias** en el panel original, con pendientes visibles en navegación y acceso desde Resumen. Solicitudes por estado, revisión de la declaración y del alumno, motivo de 8–280 caracteres y confirmación. Concesiones con historial, retirada/restauración con motivo y un formulario sencillo para las tres distinciones institucionales. Los listados administrativos también cargan páginas de veinte.

Retirar una concesión devuelve sus historias publicadas vinculadas a revisión y bloquea aprobarlas mientras esté retirada. Restaurar no las vuelve a publicar: necesitan revisión de la historia otra vez. Los puntos y respuestas de Retos se conservan. Se impide mantener dos historias publicadas/en revisión de la misma concesión; una historia rechazada/retirada puede ser reemplazada, y un intento de devolver una anterior que cause duplicación se rechaza con conflicto.

Las concesiones y condiciones históricas guardan su propia copia del catálogo. Cambiar una definición futura no reescribe premios anteriores. No se añadió edición arbitraria de catálogo, creación de reglas por usuarios ni concesión manual de las automáticas.

## Persistencia y permisos

Migración aditiva **16**: `badge_requests`, `badge_grants`, `badge_audit`, vínculo opcional desde publications e índices de unicidad. Catálogo común sin datos de alumnos en `shared/badges.ts`; la demo reutiliza sus seis definiciones manuales y conserva su proyección automática histórica. El verificador de copias admite esquemas 9–16 sin migrar la copia.

El servidor comprueba sesión, origen, cuerpo/tamaño, límites por cuenta, estado de alumno y revisiones; vuelve a comprobar sesión después de leer el cuerpo. No acepta concesiones o identidades elegidas por un alumno. Solicitudes y concesiones propias tienen detalle/historial privado; los listados de coordinación requieren administración. Las solicitudes no se hacen públicas al aprobarlas.

Las tres automáticas se reconcilian desde respuestas persistidas al leer la instantánea autenticada; Community lo hace al entrar/actualizar y tras responder. La fecha corresponde al intento o día que cumplió la condición. Un reinicio antes de refrescar no pierde el premio: la próxima lectura lo recupera, una sola vez. Las consultas repetidas no añaden concesiones ni avisos duplicados. Una fila retirada impide una reconcesión automática silenciosa.

El vínculo público de una historia devuelve solo identificador de insignia, título y fecha: no solicitud, motivo, identificador interno de concesión ni datos de expediente. El alumno no guarda declaraciones/credenciales en storage. Concesiones automáticas o institucionales siguen siendo privadas hasta compartir una historia aprobada; publicar una historia genérica nunca concede una insignia.

## Comprobaciones

- Suite API completa: **193/193**. Casos específicos: **14/14**, con reglas/días separados y completos, fecha, no duplicación de avisos, catálogo congelado, solicitudes/rechazo/reenvío/retirada, privacidad entre alumnos/grupos, concesiones institucionales, revocación/restauración, moderación vinculada, sesión revocada durante el cuerpo, límites/origen y copia separada/reinicio/migración 15→16. Las fixtures históricas desmontan además el esquema 16 al simular versiones anteriores.
- Tipos/build y ESLint correctos; `git diff --check` correcto. Sin dependencias nuevas.
- Modelos originales: Logros **51 comprobaciones + cuatro igualdades**, Retos **27 + una**, Community **29 + cuatro**.
- Brave y Opera GX, contextos aislados: **46 comprobaciones funcionales por navegador**. Incluyen solicitud, rechazo y otra solicitud, aprobación, concesión institucional, texto privado separado del Composer, moderación, audiencia, retirada/restauración, solicitud con respuesta de red perdida, retirada propia, historial y desbloqueo del quinto día real.
- Inspección adicional: **18 por navegador**, claro/oscuro a 1440/768/375/320, teclado de pestañas/Home/Escape, declaración de 600 caracteres y motivo largo. Se inspeccionaron capturas de colección en escritorio/móvil oscuro y revisión administrativa móvil. Cero errores JavaScript en estos recorridos.
- Regresión de Retos después de integrar insignias: **53 por navegador** completas, usando otra base nueva de challenges-browser-server, con calendario/banco, puntos/constancia/repaso, red perdida y conflicto entre ventanas.

Matriz de esta tarea: insignias 128 (46+18 por navegador) y regresión de Retos 106; **234 comprobaciones**, sin sumar repeticiones.

Incidencias: primer intento Brave incompleto tras 12 comprobaciones por selector exacto de un motivo cuyo elemento incluía el prefijo “Indicación de CAI”. Se ajustó el selector y pasó completo en otra base. También se acotaron las comprobaciones de historias al autor del navegador actual, porque ambos comparten grupo; Opera pasó completo con el grupo ya conteniendo historias de Brave. No eran fallos de autorización ni se cambiaron las aserciones de privacidad. ESLint detectó una variable sin reasignación en una prueba; se corrigió y pasó. Tipos señalaron una propiedad exclusiva de demo y dos variables aún no conectadas; se corrigió la adaptación y la compilación pasó. Los intentos incompletos no cuentan como recorridos aprobados.

No se repitió toda la matriz histórica de comentarios/reacciones ni la auditoría de dependencias. Diez alertas moderadas de desarrollo e incidencias históricas conservan el estado de sus informes; no se afirma que esta tarea las haya corregido.

## Archivos

- Servicio: `server/badges.ts`, `database.ts`, `contracts.ts`, `publications.ts`, `app.ts`, `verify-backup.ts` y `shared/badges.ts`.
- Pruebas nuevas: `server/tests/badges.test.ts`, `badges-browser-server.ts`, `scripts/check-connected-badges.browser.mjs`, `check-connected-badges-visual.browser.mjs`. Actualización de esquemas en pruebas de admin-recovery, admin-security, admin-team, challenges, comments, gallery, reactions, student-profile y student-records.
- Comunidad: `ConnectedCommunity`, `CommunityWorkspace`, `connection`, `types`, Composer, CommunityShell, PostCard, EditorialPostCard, ChallengeRewards y API compartida. Reutilización/adaptación de AchievementsView, BadgeCollection/BadgeCatalog, BadgeRequestForm/Dialog, BadgeRequestHistory, BadgeUnlockNotice, catálogo/arte/estilos. Nuevos ConnectedAchievementsView, ConnectedBadgeRequests, ConnectedRecognitions, SharedBadge y adaptadores puros connectedBadges.
- Panel: `src/pages/AdminBadgesPage.tsx`, AdminPage, AdminLayout, router, useAdminConnection y estilos de formulario compartidos.
- Guías: este informe, PROJECT_STATE, AGENTS, README, plan ampliado, administración y respaldo.

## Repetición aislada

Después de compilar, en consolas separadas:

```powershell
$env:CAI_API_PORT = '3101'
node server/tests/badges-browser-server.ts
```

```powershell
$env:CAI_API_PORT = '3101'
npm.cmd run preview -- --host 127.0.0.1 --port 4180 --strictPort
```

La fixture crea otra base en `.local/tests/badges-browser-*` y metadatos browser.json. Tiene día fijo 2026-11-05, cuatro días completos previos por autor y 24 solicitudes por compañero para probar paginación/bloqueo de una pendiente antigua. Ejecutar checkConnectedBadges con admin, fixture por navegador, browserLabel Brave/Opera y baseURL; después checkBadgesVisual, opcionalmente con screenshotDir. Repetir desde cero exige otra fixture nueva. El reloj fijo y secreto de prueba pertenecen a esa fixture, no al entorno habitual. Evidencias locales ignoradas en `.local/tests/badges-*`.

## Estado y siguiente bloque

Insignias conectadas y comprobadas localmente. Pendiente aceptación de reglas/textos/uso con CAI en la tanda humana final; no se realizó con alumnos reales. Base/acceso habituales no abiertos ni migrados durante esta tarea. No merge ni despliegue.

Siguiente bloque autorizado: **vídeos privados, solo coordinación sube y el grupo autorizado ve**, reutilizando la galería y el panel. Preparar límites/formato/permisos/reproducción/rangos/retirada/copias en entorno aislado; no tratar vídeo como un JPEG ni instalar herramientas del sistema o contratar servicios implícitamente. Google/correo reales, material/autorizaciones, aceptación y alojamiento/presupuesto mantienen su tanda final acordada.
