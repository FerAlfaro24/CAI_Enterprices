# CAI Community — Fase 5: Logros

Implementación exclusiva de Logros en `feat/community`. Referencias inspeccionadas: `LOGROS — MIS LOGROS.png` y **`LOGROS — LA COMUNIDAD V2.png`**. [Índice de 42 capturas](../review/community-phase-5/index.html) · [Revisión visual](../review/community-phase-5/REVISION-VISUAL.md).

## Arquitectura mínima y fuente de verdad

Se reutilizan CommunityProvider, el reducer y el reloj ficticio existente. Se añade **una sola colección de estado: badgeRequests**. No existe un segundo almacén de puntos, intentos, concesiones automáticas ni publicaciones.

| Concepto | Representación |
| --- | --- |
| Definición | BadgeDefinition: id, título, descripción, símbolo, color, categoría, modo y disponibilidad; automaticRule referencia las reglas de Retos. |
| Solicitud | BadgeRequest: alumno, insignia, declaración, fecha y estado. Una decisión conserva revisor ficticio, fecha y motivo. |
| Concesión | BadgeGrant, proyección de intentos cumplidos o solicitudes aprobadas. ID estable por alumno/insignia y deduplicación; no se almacena otra copia. |
| Reconocimiento público | Concesión unida a una publicación aprobada y compartida voluntariamente; nunca se obtiene de la descripción de solicitud. |

El catálogo importa las tres definiciones automáticas de selectChallengeProgress, que continúa siendo la fuente de las reglas de primera respuesta, tres días consecutivos y cinco días participados. La puntuación sigue siendo +5 por participar y +10 adicionales por acertar. Días respondidos, serie actual y mejor serie permanecen diferenciados. No se inventa una fecha de obtención automática: se indica “Durante esta visita”.

Hay seis insignias activas para Alex: tres automáticas y tres solicitables (Explorador de películas, Music Catcher, Book Buddy). Otras tres definiciones institucionales ilustran distinciones de CAI; no se pueden solicitar desde este formulario. El catálogo personal muestra primero cuatro disponibles y permite desplegar las seis iniciales. No se construye un editor.

**Estado inicial de Alex: cero insignias, cero solicitudes y cero puntos.** La captura 19 muestra cuatro insignias conseguidas mediante acciones reales de la simulación: primera respuesta, tres consecutivos, películas y música; además hay una solicitud de lectura pendiente. No es el estado inicial ni un contador decorativo.

## Solicitud y decisión

| Acción | Condiciones y resultado |
| --- | --- |
| requestBadge | Solo Vista alumno; insignia válida, revisable y activa; declaración recortada de 20–600 caracteres; ID nuevo; sin pendiente duplicada ni concesión previa. Crea pendiente. |
| reviewBadge | Solo Vista moderador; solicitud pendiente y definición válida; decisión explícita con motivo de 8–280 caracteres. Guarda CAI demo y fecha. |
| Aprobar | La proyección concede una única insignia personal; no toca publicaciones. Una segunda decisión sobre esa solicitud se ignora. |
| Rechazar | No concede. Se puede enviar otra solicitud con ID nuevo, conservando el rechazo anterior. |
| Reiniciar | El reducer existente vuelve a solicitudes vacías, intentos vacíos y publicaciones originales; las concesiones derivadas desaparecen. |

La descripción es **una declaración ficticia, no una prueba verificada**. El motivo predeterminado de aprobación también lo expresa. Las solicitudes solo se muestran en Mis logros y en la revisión demo autorizada.

El formulario calcula errores desde los valores actuales después del primer intento de envío, como el compositor corregido en fase 2.1: los mensajes y estilos desaparecen al corregirlos. Se reutiliza el mismo formulario en el bloque editorial y en un diálogo. Tras un envío válido el foco pasa a Tus solicitudes, incluso cuando el botón del catálogo deja de existir por haber quedado pendiente.

La revisión es un panel pequeño dentro de Mis logros. No se modifica /admin. Utiliza el selector de rol existente y controles explícitos de aprobar/rechazar; no se confunde con ModerationPanel, que sigue revisando publicaciones. Son guardias de demostración en frontend, sin seguridad real.

## Compartición voluntaria y visibilidad

1. Solo una concesión conseguida ofrece “Compartir mi logro”.
2. Se abre Composer, con badgeShare opcional, categoría Logro y una propuesta pública editable basada únicamente en el nombre de la definición.
3. **Nunca se consulta ni copia la declaración privada para construir el mensaje.** Se puede cancelar.
4. La acción create comprueba también en el modelo que la insignia está conseguida, que se actúa como alumno y que la categoría es achievement.
5. La publicación lleva badgeId, empieza pending y usa la misma moderación de las otras áreas.
6. selectPublicRecognitions exige concesión y publicación aprobada. Deduplica por alumno/insignia y utiliza la historia pública más reciente.
7. Aprobar una publicación no concede insignias. Un logro genérico sin badgeId puede aparecer como historia, sin convertirse por ello en una concesión.

La comunidad usa las publicaciones aprobadas existentes de categoría achievement para sus historias, con reacciones, comentarios y perfiles originales a través de PostDetailDialog. No hay feed ni base de publicaciones paralelos.

Cuatro recibos históricos **explícitamente ficticios** sirven como ejemplos públicos: Luna/conversación, Dani/canción, Leo/constancia y Mara/primera respuesta. Están vinculados a publicaciones ya existentes y representan reconocimientos que esos personajes compartieron en el escenario. No se deducen de aprobar publicaciones ni de Member.badge. El recibo automático histórico de Mara no simula intentos o puntos de Alex. Nunca se mezclan esos ejemplos con la colección personal actual.

Los rótulos biográficos históricos de otros perfiles permanecen por compatibilidad. El resumen del perfil propio de Alex sí consulta selectBadgeGrants para evitar que una cadena antigua contradiga su colección. No se añade un directorio público.

## Archivos

Nuevos, dentro de `src/features/community/achievements/`:

| Archivo | Responsabilidad |
| --- | --- |
| types.ts | Definición, solicitud discriminada, concesión y reconocimiento público. |
| catalog.ts | Definiciones, disponibilidad y límites de validación. |
| seeds.ts | Recibos ficticios públicos vinculados a historias existentes. |
| model.ts | Validación, transiciones y selectores puros. |
| AchievementsView.tsx | Encabezados, pestañas accesibles, diálogos y compositor. |
| MyAchievements.tsx | Estadísticas reales, formulario y vista previa contextual. |
| BadgeCollection.tsx | Colección conseguida, progreso automático y catálogo disponible. |
| BadgeRequestForm.tsx | Formulario reutilizado y diálogo de solicitud. |
| BadgeRequestHistory.tsx | Historial privado y consulta de declaraciones/decisiones. |
| BadgeReviewPanel.tsx | Revisión mínima de solicitudes con rol ficticio. |
| CommunityAchievements.tsx | Reconocimientos públicos, destacado, historias y distinciones CAI. |
| achievements.module.css | Estilos encapsulados y responsive de ambas vistas. |

Existentes modificados:

- CommunityWorkspace.tsx: monta Logros; elimina el bloque antiguo de feed que quedó inaccesible al tener ya vistas propias las cuatro secciones. El directorio histórico conserva su comportamiento.
- types.ts: badgeRequests, acciones requestBadge/reviewBadge y badgeId opcional en publicaciones.
- model.ts: estado inicial/reinicio, delegación de acciones y validación de compartición.
- components/Composer.tsx: badgeShare opcional; mantiene los valores y comportamiento previos cuando no se proporciona.
- components/MemberProfileDialog.tsx: únicamente el resumen de insignias de Alex usa las concesiones reales.
- docs/community-implementation.md: enlaza esta fase.

Nuevos scripts: check-community-achievements.mjs y check-community-achievements.browser.mjs. Se añaden este documento y la carpeta review/community-phase-5.

Una comparación de hashes de los **102 archivos iniciales** de src, reference y design-reference confirmó que solo cambiaron los cinco archivos fuente existentes enumerados arriba. Se añadieron doce archivos fuente. Inicio, Retos, Galería, sus estilos, fixtures, navegación, landing, administración, reference/ y PNG originales permanecieron intactos. Se conservaron las modificaciones anteriores presentes en Git.

## Diseño y accesibilidad

Se conserva Figtree, colores CAI, encabezados y composición de ambos PNG: resumen/formulario/colección en Mis logros; reconocimientos compactos, destacado azul asimétrico, historias y distinciones en La comunidad V2. La vista comunitaria no contiene las estadísticas ni las declaraciones privadas de Alex.

Las pestañas tienen roving tabindex, ArrowLeft/Right, Home/End, aria-selected y paneles existentes referenciados por aria-controls. Solo se monta el contenido de la pestaña activa. Los diálogos reutilizan useCommunityDialog: cierre con Escape, contención Tab/Shift+Tab, foco inicial y restauración al cancelar. Las decisiones y envíos dirigen el foco al historial. Las notificaciones usan la región de estado existente; errores de formulario tienen role=alert.

A 375/320 las estadísticas forman dos columnas, el formulario y la vista previa se apilan, el catálogo ocupa una columna y los controles táctiles mantienen áreas cómodas. Los reconocimientos recientes usan una franja de desplazamiento horizontal nativo: la siguiente tarjeta asoma y Tab desplaza el control enfocado. La página no desborda horizontalmente. El destacado aparece antes que en la primera versión móvil de cuatro tarjetas apiladas.

Ambas pestañas usan la preferencia de tema existente; solo se añaden variables locales de color para Logros. No se añaden animaciones, librerías ni medios externos. Se respeta movimiento reducido. Los emojis dependen del sistema operativo.

## Pruebas realizadas

Correctos:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
node scripts/check-community-model.mjs
node scripts/check-community-publication.mjs
node scripts/check-community-challenges.mjs
node scripts/check-community-gallery.mjs
node scripts/check-community-achievements.mjs
```

- Modelo general: 29 comprobaciones y 4 igualdades.
- Publicaciones: 23 comprobaciones.
- Retos: 27 comprobaciones y 1 igualdad.
- Galería: 25 comprobaciones y 4 igualdades.
- Logros: **51 comprobaciones y 4 igualdades**. Cubre condiciones automáticas, ausencia de publicaciones implícitas, validación, duplicados, roles, aprobación idempotente, rechazo y reintento con historial, privacidad, compartición, moderación, deduplicación pública, reinicio e inmutabilidad.
- Brave, regresiones existentes: compositor 19 comprobaciones (incluido el caso de 82 caracteres), Retos 30 y Galería 40.
- Brave, Logros: recorrido completo de **55 verificaciones en escritorio**. También se ejecutó el recorrido completo de 51 verificaciones a 375 antes de añadir las últimas comprobaciones de foco/rótulo y relaciones ARIA.
- A 320 se comprobó nuevamente: error → corrección, cancelación/foco, envío/foco en historial, pendiente sin concesión, ausencia de controles de aprobación del alumno, aprobación única, compositor sin declaración privada, publicación moderada, visibilidad pública posterior y reinicio.
- Ambas pestañas inspeccionadas a 1440, 1024, 768, 375 y 320; claro/oscuro en escritorio y ambos móviles. Sin desbordamiento detectado. La navegación por controles desplazó la franja móvil sin desbordar la página.
- No se probaron lectores de pantalla completos, dispositivos físicos, Opera GX, Safari o Firefox en esta fase.
- Brave no registró errores ni advertencias de consola. El índice offline cargó sus 46 referencias de imagen (42 capturas más referencias/comparaciones), sin imágenes rotas.

Los scripts browser son funciones para la herramienta de navegador existente; no requieren instalar Playwright en la aplicación. Aceptan baseURL (127.0.0.1:5173 por defecto) y screenshotDir opcional. El reinicio final deja limpia la demostración; solo el tema permanece guardado.

## Diferencias y límites

La consulta adicional del nodo Figma 14:2 devolvió límite del plan Starter; no se obtuvo contexto de capas. La fuente visual efectiva fueron los dos PNG locales, incluida La comunidad V2.

Se mantiene la cabecera aprobada de cuatro secciones, el aviso de prototipo y el pie compartido. El PNG personal muestra cantidades y concesiones de ejemplo; el estado inicial real muestra cero. Las definiciones automáticas conservan sus nombres y reglas de Retos. El catálogo y las declaraciones añaden texto explicativo y las tarjetas conseguidas incluyen condición y compartición; por ello la página crece. Los alias, historias y fechas públicas se adaptan a los datos disponibles, sin inventar métricas.

La versión móvil aún es larga: Mis logros claro mide aproximadamente 3846 px a 375 y 4052 px a 320; La comunidad pasó de 4601 a 3898 px a 375 mediante la franja compacta. Los borradores no enviados del formulario se descartan al cambiar de pestaña. La colección de otros perfiles no se ha migrado completamente al nuevo catálogo.

No hay backend, API, verificación de evidencias, seguridad de roles real, persistencia de solicitudes/concesiones, editor de insignias ni integración de feat/admin-dashboard. Las funciones del modelo quedan separadas para una integración futura, pero esta demo tiene a Alex como alumno activo. No se hace commit, push, merge o despliegue. **Se detiene la fase 5 para revisión; no comienza el refinamiento visual general.**

