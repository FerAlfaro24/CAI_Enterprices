# CAI — estado vigente

**Actualizado: 17 de noviembre de 2026, después de la revisión integral.** Pruebas nuevas: 193 API y 1,314 comprobaciones en 38 recorridos de navegador. Los resultados de entregas anteriores siguen siendo históricos y no se suman. [Inicio](START_HERE.md) · [Ramas](BRANCHES.md) · [Próximos pasos](NEXT_STEPS.md) · [Índice documental](DOCUMENTATION_INDEX.md).

## Referencias de continuación

- **Base funcional verificada:** `fix/v1-dev-preview-cache`, `3971284f30110eb054f0d3616899ddafe97e3683`.
- **Continuación actual:** `test/v1-integral-review-2026-11-17`, desde b55cd50. Punto de retorno de pruebas `8c515de`, sin cambios de aplicación. [Informe integral y límites](v1-integral-review-2026-11-17.md).
- **Documentación corregida y código acumulado:** `docs/continuidad-auditoria-2026-11-17`, PR #9 hacia esa base. La diferencia de aplicación debe ser vacía; solo cambia Markdown. La PR sigue sin fusionarse.
- **Base visual:** `release/cai-demo-v1.0`, `f3ba46b`, preservada. Panel/Community avanzados ya existían y se conectaron; no reconstruirlos.
- **Main:** `a3c2569`, antigua, 74 commits detrás de la base funcional al corte.
- **Revisión anterior:** `chore/v1-final-review`, `fee87d1`, 15 commits detrás. No es la última línea funcional.
- **Persistencia:** SQLite esquema 16. No hay despliegue productivo validado.

Los SHAs y relaciones de todas las ramas al inicio de la auditoría están en BRANCHES. Esta PR conserva su historia documental previa y añade el código funcional acumulado en su rama de trabajo; no modifica main/release ni fusiona funcionalidades otra vez en ellas.

## Inventario funcional

| Área | Estado local real | Fuente y límite |
| --- | --- | --- |
| Institucional/contacto | Landing, rutas y consultas guardadas con seguimiento | `src/features/landing/`, `server/contact.ts`; contenido comercial/medios finales pendientes. |
| Ingreso y tutor | Solicitud, revisión, consentimiento registrado, aprobación/rechazo, folio y expediente | `server/access-repository.ts`, `server/validation.ts`; verificación humana de inscripción/tutor sigue necesaria. |
| Acceso de alumnos | Contraseña, activación, sesión, recuperación local y suspensión efectiva | `server/student-accounts.ts`, `server/notices.ts`; correo real pendiente. |
| Google | Integración opcional y datos del alumno obligatorios preparados | `server/google-auth.ts`; proyecto de CAI y prueba real pendientes, botón desactivado sin configuración. |
| Panel v1.0 | Datos/acciones conectados, pendientes, alumnos y moderación | `src/layouts/AdminLayout.tsx`, `src/features/admin/`; no es otro dashboard de demo. |
| Grupos/ajustes | Catálogo, asignación, archivo y pausas persistentes | `server/administration.ts`; catálogo/material final por confirmar con CAI. |
| Comunidad | Cuenta, miembros y feed del grupo, perfil propio y avisos privados | `src/features/community/ConnectedCommunity.tsx`, `server/public-profiles.ts`; sin expedientes ajenos públicos. |
| Publicaciones | Texto, revisión, motivo privado, retirada e historial | `server/publications.ts`; [informe](v1-connected-community.md). |
| Reacciones | Cinco opciones, selección propia, contadores, pausa y reintentos | `server/reactions.ts`; [147 API/134 navegador en su entrega](v1-community-reactions.md). |
| Comentarios | Premoderación, paginación, motivos privados, retirada y pausas global/por historia | `server/comments.ts`; [163 API/228 navegador en su entrega](v1-community-comments.md). |
| Imágenes | Subida de coordinación, validación, permisos por grupo, retirada y almacenamiento privado | `server/gallery.ts`; [informe](v1-private-gallery.md). No es servicio de vídeo. |
| Retos | 180 preguntas/45 temas; tres diarias, calendario/banco administrable, respuesta única, puntos/constancia y repaso privados | `server/challenge-bank.ts`, `server/challenges.ts`; [179 API/142 navegador en su entrega](v1-community-challenges.md). Fecha America/Mexico_City. |
| Insignias | Nueve, automáticas/revisadas/institucionales; concesión única, historial/corrección y compartición voluntaria moderada | `server/badges.ts`, `shared/badges.ts`; [193 API y matriz 234 en su entrega](v1-community-badges.md). |
| Administración de cuentas | Contraseña propia, recuperación local, equipo e invitaciones | `server/auth.ts`, `server/admin-team.ts`, `server/admin-recovery.ts`; entrega de correo real pendiente. |
| Perfil/expediente | Alias/color, restricciones de menores, correcciones con reautenticación e historial | `server/student-records.ts`; [informe](v1-student-record.md). No verifica identidad real. |
| Copias | Copia consistente SQLite/verificación y ensayos en destinos separados | `server/backup.ts`, `server/verify-backup.ts`; [guía](respaldo-recuperacion-local.md), no restauración sobre la base habitual. |
| Desarrollo | Caché web separada de comprobadores SSR, portada/login/admin renderizados tras corrección | `vite.config.ts`; [3971284](solucion-pantalla-blanca-local.md). HTTP/health no bastaban. |
| Vídeos | **No implementados; opcionales y de menor prioridad** | Preferencia posterior al plan ampliado. Si se retoman, solo coordinación sube y grupo autorizado ve. |
| Producción | **Pendiente** | `server/index.ts` bloquea NODE_ENV=production, escucha 127.0.0.1 y app.ts admite hosts/orígenes locales. No basta contratar alojamiento. |

## Evidencia y límites

La suite completa se **repitió: 193/193**. Revisión integral actual: **657 comprobaciones por navegador, 1,314 en 38 recorridos completos**, en Brave/Opera. Incluye módulos anteriores, reacciones/comentarios/retos/insignias y un menor nuevo desde solicitud hasta insignia y suspensión. También modelos, lint, tipos/compilación, inspección visual y trece rutas privadas con 403 sobre fixtures. Intentos interrumpidos excluidos del total. [Informe](v1-integral-review-2026-11-17.md).

La matriz de Insignias de 234 y la revisión antigua de 134 API/844 navegador siguen como evidencia de sus propios cortes; no se agregan a la revisión nueva. Ver [TESTING](TESTING.md).

Esquemas posteriores a la revisión antigua: 13 reacciones, 14 comentarios, 15 retos y 16 insignias. La presencia de tablas, rutas y pruebas contrasta las integraciones; no se deducen de nombres de ramas o botones. La demostración en memoria se conserva como referencia separada, no como seguridad.

Incidencias: diez avisos moderados de herramientas/cero de ejecución en la auditoría anterior, no repetida hoy. Las dos intermitencias Opera antiguas no se reprodujeron; su causa sigue sin confirmar. En la tanda nueva hubo un error route.fulfill del simulador de reacciones; pasó al repetir y tras mejorar la espera, sin causa exacta confirmada. La prueba visual de insignias se hizo independiente del recorrido funcional. Las trece imágenes de portada cargaron en la nueva inspección Brave; material definitivo de CAI sigue pendiente. No se ha probado producción, correo/Google reales, datos reales o aceptación humana.

## Decisiones que prevalecen

- Conservar interfaz, logos, Figtree, arte y componentes de v1.0; conectar lo existente.
- Trabajar en ramas y documentar por mejora; no fusionar todas las ramas acumulativas, borrar versiones ni actualizar main implícitamente.
- Priorizar trabajo autónomo autorizado; agrupar cuentas, permisos, decisiones/validación de CAI para el final. Alojamiento/presupuesto después.
- Vídeos se rebajan a opcionales; no iniciar su construcción como siguiente tarea obligatoria.
- Repaso personalizado, visión educativa para coordinación, búsqueda ampliada/biblioteca de vídeos y bienvenida son **propuestas**, no funciones implementadas ni autorización automática.
- No abrir/migrar datos habituales para probar. Datos ficticios en fixtures nuevas; nunca subir archivos privados.

## Auditoría documental del 17 de noviembre

Se contrastaron las 37 ramas remotas, ancestros, parches equivalentes y árboles; se corrigió PR #9, que partía de `fee87d1` y describía las integraciones posteriores como demo/no autorizadas. README, instrucciones y estado también contenían frases antiguas. La bitácora de 601 líneas se conserva en [PROJECT_HISTORY](PROJECT_HISTORY-2026-11-12.md); este archivo deja de mezclar pendientes antiguos con hechos actuales.

La auditoría reorganiza documentación, clasifica todos los Markdown versionados y verifica enlaces/rutas/referencias. No instala dependencias, ejecuta la aplicación, reejecuta pruebas funcionales, accede a cuentas o cambia datos/configuración. Criterios y resultados documentales en [AUDIT_2026-11-17](AUDIT_2026-11-17.md).

Después de esa auditoría, el usuario autorizó la revisión integral: [informe nuevo](v1-integral-review-2026-11-17.md). Se completó sobre fixtures nuevas. Solo cambian cuatro scripts de pruebas y documentación; no aplicación, dependencias o datos habituales. Siguiente trabajo autónomo: preparación técnica de producción, sin contratar/publicar todavía.

## Cómo actualizar este estado

En cada entrega indicar fecha/base/commit, objetivo y componentes reutilizados, qué quedó implementado y comprobado, pruebas realizadas/no realizadas, efectos en datos/permisos, incidencias y siguiente tarea. No borrar evidencia previa; trasladar bitácoras extensas al historial, con enlace. NEXT_STEPS concentra prioridades; este archivo concentra hechos.
