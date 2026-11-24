# CAI — estado vigente

**23-11, alta propia elegida:** [registro completo de amigos](REMOTE_DEMO.md#registro-propio-de-amigos--23-de-noviembre-de-2026), en `fix/v1-remote-registration-guidance`. Mismo enlace temporal/vencimiento, con solicitud propia, aprobación y activación para elegir contraseña. 24 API dirigidas y 17 comprobaciones HTTPS nuevas, lint/tipos/build. No se envían correos ni se usa Google real; validación humana pendiente. Código administrativo previo incluido, sin cambios de esquema o permisos.

**23-11, prueba con amigos:** [copia HTTPS nueva](REMOTE_DEMO.md#prueba-con-amigos--23-de-noviembre-de-2026) activada con autorización específica por máximo 24 horas, sobre código actual de administración. Nueve cuentas ficticias con claves individuales, seis fotos oficiales y base separada. 11 pruebas de entrada y 24 comprobaciones HTTPS nuevas; sincronización automática entre dos cuentas comprobada. URL/accesos/vencimiento en metadatos privados, no Git. Validación desde dispositivos y redes reales de amigos pendiente. No equivale a despliegue definitivo ni renueva la demo vieja.

**Actualizado: 22 de noviembre de 2026, revisión de administración.** Continuación `feat/v1-admin-usability-review`, base `c3d4d82` de PR #22; código `e255f91`. [Entrega](ADMIN_USABILITY_REVIEW.md): mesa de trabajo, configuración por tareas, ficha dividida, búsqueda/filtros y revisión de fotos. **272 API y 370 UI** (344 recorrido + 26 dirigidas finales), tipos/lint/build; nueve secciones revisadas. Servidor/esquema/permisos sin cambios, SQLite 20. [Inicio](START_HERE.md) · [Ramas](BRANCHES.md) · [Próximos pasos](NEXT_STEPS.md) · [Guía del panel](guia-administracion.md). Aceptación humana pendiente.

**Cierre visual anterior:** 454 comprobaciones UI y 108 de Logros en la entrega de PR #21; no son una matriz repetida hoy. La nueva tanda cubre específicamente los tres cambios solicitados.

**Corrección posterior de Galería:** seis fotos visibles individualmente por defecto; Álbumes opcional y filtros por todas las categorías interiores. 32 comprobaciones nuevas (16 Brave/16 Opera), lint/tipos/build correctos. La suite API anterior no se repitió: no hubo cambios de servidor o datos. [Detalle](COMMUNITY_HOME_STORIES.md#corrección-de-visibilidad-en-galería).

**Presentación remota autorizada:** [demo temporal protegida](REMOTE_DEMO.md) por Cloudflare sobre copia ficticia separada. Frontend compilado y política HTTPS del backend; credenciales y metadatos fuera de Git. Vercel público conserva el prototipo anterior. Comprobados 11 resultados de protección y 54 de navegador HTTPS (27 por navegador), con fotos, interacción, panel, consola y móvil/escritorio. No equivale a la entrega productiva final.

**Primera muestra visual:** [diseño de comunidad](COMMUNITY_DESIGN.md), con patrón propio, superficies más ligeras, progreso real en Inicio, misión/puntos/celebraciones de Retos, perfil privado y bandeja independiente. 130 comprobaciones (65 Brave/65 Opera), tipos/lint/build. Sin cambios de esquema/reglas/API ni repetición de suites anteriores. Aceptación visual pendiente; el plan conserva los siguientes refinamientos.

**Revisión de publicaciones:** feed conectado de una columna, emoji/contador y retirada al tocar de nuevo; detalle social y comentarios simplificados. 124 comprobaciones nuevas (62 por navegador), tipos/lint/build. [Decisiones y límites](COMMUNITY_DESIGN.md#publicaciones-y-conversación-más-sencillas). Conserva reglas, fotos y moderación; aceptación visual pendiente.

**Cabecera/novedades:** identidad oficial sin franjas de gestión; campana junto al perfil, cuenta en Mi espacio y carrusel único de avisos/momentos. 122 comprobaciones nuevas (61 por navegador), tipos/lint/build. Corregida consulta posterior al logout; no se cambió la API ni la separación de fixtures. [Detalle](COMMUNITY_DESIGN.md#cabecera-y-novedades-en-un-solo-lugar).

**Logros implementados:** [entrega](COMMUNITY_DESIGN.md#logros-insignias-y-perfiles-implementados), código `5349283`, en `feat/v1-achievements-progressive-badges`. Tres actividades guiadas con imágenes, borrador/completado privado, validación privada/publicación opcional, 21 insignias obtenidas progresivamente y perfiles sociales. Esquema 19 aditivo; se conserva historial. Aceptación humana y adopción en instalaciones existentes pendientes; datos habituales y copia remota anterior sin actualizar.

**Cierre visual:** [primera pasada](COMMUNITY_DESIGN.md#cierre-visual-primera-pasada), código `5bd4c2a`: cabecera móvil legible, galería más directa, tres metas de Retos, perfil separado de cuenta, diálogos y acabado de página pública/panel. Muestra limpia 4222; QA separada. Sin cambios de datos habituales/servidor o actualización pública. Aceptación visual y sesión con coordinación pendientes.

## Referencias de continuación

- **Continuación actual:** `feat/v1-admin-usability-review`, desde `c3d4d82` de PR #22; código `e255f91`.
- **Comunidad anterior:** `feat/v1-photo-viewer-notification-history`, código `bb7b8f6`, esquema 20.
- **Cierre visual anterior:** `style/v1-final-interface-polish`, desde `0b73032`, código `5bd4c2a`.
- **Logros anterior:** `feat/v1-achievements-progressive-badges`, desde `0729cc5`, código `5349283`.
- **Cabecera anterior:** `feat/v1-community-header-highlights`, desde `ffb323d`.
- **Revisión social anterior:** `feat/v1-community-social-feed`, desde `d6e66fd` de `feat/v1-community-playful-design`.
- **Primera muestra visual anterior:** `feat/v1-community-playful-design`, desde `4cdae44` de `feat/v1-remote-demo`.
- **Presentación remota anterior:** `feat/v1-remote-demo`, desde `d7ef781` de `fix/v1-gallery-all-photos`.
- **Corrección de Galería anterior:** `fix/v1-gallery-all-photos`, desde `f9c3c1a` de `feat/v1-community-home-stories`.
- **Inicio conectado anterior:** `feat/v1-community-home-stories`, desde `422b4d2`; backend `4e60bcd` e interfaz `86df7f6`. [Inicio, historias, álbumes y demo](COMMUNITY_HOME_STORIES.md). Esquema 18; base habitual intacta y sin despliegue.
- **Fotografías oficiales anteriores:** `feat/v1-official-media`, desde `d410247` de `feat/v1-production-preparation`; código `cfea458`. [Fotos oficiales](OFFICIAL_MEDIA.md), esquema 17 y seis imágenes para todos los alumnos aprobados; no carga sobre la instalación habitual ni despliegue.
- **Preparación productiva anterior:** `feat/v1-production-preparation`, código `9be8081`. [Preparación y límites](PRODUCTION_PREPARATION.md).
- **Base funcional anterior:** `fix/v1-dev-preview-cache`, `3971284f30110eb054f0d3616899ddafe97e3683`.
- **Revisión integral anterior:** `test/v1-integral-review-2026-11-17`, desde b55cd50; pruebas `8c515de` y cierre `95e53e2`, sin cambios de aplicación en esa tarea. [Informe y límites](v1-integral-review-2026-11-17.md).
- **Documentación corregida y código acumulado:** `docs/continuidad-auditoria-2026-11-17`, PR #9 hacia esa base. La diferencia de aplicación debe ser vacía; solo cambia Markdown. La PR sigue sin fusionarse.
- **Base visual:** `release/cai-demo-v1.0`, `f3ba46b`, preservada. Panel/Community avanzados ya existían y se conectaron; no reconstruirlos.
- **Main:** `a3c2569`, antigua, 74 commits detrás de la base funcional al corte.
- **Revisión anterior:** `chore/v1-final-review`, `fee87d1`, 15 commits detrás. No es la última línea funcional.
- **Persistencia:** SQLite esquema 20. No hay despliegue productivo validado.

Los SHAs y relaciones de todas las ramas al inicio de la auditoría están en BRANCHES. Las ramas posteriores conservan el trabajo acumulado. La nueva rama añade historias oficiales, medios vinculados y el Inicio renovado; no modifica main/release ni vuelve a fusionar funcionalidades históricas.

## Inventario funcional

| Área | Estado local real | Fuente y límite |
| --- | --- | --- |
| Institucional/contacto | Landing, rutas y consultas guardadas con seguimiento | `src/features/landing/`, `server/contact.ts`; fotos oficiales públicas integradas, paquete privado separado de GitHub; contenido comercial final pendiente. |
| Ingreso y tutor | Solicitud, revisión, consentimiento registrado, aprobación/rechazo, folio y expediente | `server/access-repository.ts`, `server/validation.ts`; verificación humana de inscripción/tutor sigue necesaria. |
| Acceso de alumnos | Contraseña, activación, sesión, recuperación local y suspensión efectiva | `server/student-accounts.ts`, `server/notices.ts`; correo real pendiente. |
| Google | Integración opcional y datos del alumno obligatorios preparados | `server/google-auth.ts`; proyecto de CAI y prueba real pendientes, botón desactivado sin configuración. |
| Panel v1.0 | Datos/acciones conectados, pendientes, alumnos y moderación | `src/layouts/AdminLayout.tsx`, `src/features/admin/`; no es otro dashboard de demo. |
| Grupos/ajustes | Catálogo, asignación, archivo y pausas persistentes | `server/administration.ts`; catálogo/material final por confirmar con CAI. |
| Comunidad | Inicio con fotos autorizadas, avisos destacados, historias, perfiles y notificaciones privadas | `src/features/community/ConnectedCommunity.tsx`, `server/public-profiles.ts`; sin expedientes ajenos públicos. |
| Publicaciones | Alumnos: texto/logros moderados por grupo. Equipo CAI: historia/aviso/álbum, hasta 12 fotos, destinatarios, destacado, vencimiento y retirada | `server/publications.ts`, `server/institutional-posts.ts`; [guía vigente](COMMUNITY_HOME_STORIES.md). |
| Reacciones | Cinco opciones, selección propia, contadores, pausa y reintentos | `server/reactions.ts`; [147 API/134 navegador en su entrega](v1-community-reactions.md). |
| Comentarios | Premoderación, paginación, motivos privados, retirada y pausas global/por historia | `server/comments.ts`; [163 API/228 navegador en su entrega](v1-community-comments.md). |
| Imágenes | Cuatro públicas y seis privadas oficiales; fotos nuevas en borrador, álbumes vinculados y una conversación; Galería respeta grupo/comunidad, retirada y vencimiento | `server/gallery.ts`, `server/official-media.ts`; [guía vigente](OFFICIAL_MEDIA.md). El [informe original](v1-private-gallery.md) corresponde al alcance anterior por grupo. No es vídeo. |
| Retos | 180 preguntas/45 temas; tres diarias, calendario/banco administrable, respuesta única, puntos/constancia y repaso privados | `server/challenge-bank.ts`, `server/challenges.ts`; [179 API/142 navegador en su entrega](v1-community-challenges.md). Fecha America/Mexico_City. |
| Insignias | 21; condiciones progresivas de logros/Retos/publicaciones, concesiones históricas y correcciones conservadas | `server/badges.ts`, `shared/badges.ts`; [193 API y matriz 234 en su entrega](v1-community-badges.md). |
| Administración de cuentas | Contraseña propia, recuperación local, equipo e invitaciones | `server/auth.ts`, `server/admin-team.ts`, `server/admin-recovery.ts`; entrega de correo real pendiente. |
| Perfil/expediente | Alias/color, restricciones de menores, correcciones con reautenticación e historial | `server/student-records.ts`; [informe](v1-student-record.md). No verifica identidad real. |
| Copias | Copia consistente/verificación local y comando productivo con destino privado | `server/backup.ts`, `server/production-backup.ts`, `server/verify-backup.ts`; [guía](respaldo-recuperacion-local.md). Ensayos en destinos separados, sin restaurar sobre la base habitual. |
| Desarrollo | Caché web separada de comprobadores SSR, portada/login/admin renderizados tras corrección | `vite.config.ts`; [3971284](solucion-pantalla-blanca-local.md). HTTP/health no bastaban. |
| Vídeos | **No implementados; opcionales y de menor prioridad** | Preferencia posterior al plan ampliado. Si se retoman, solo coordinación sube y grupo autorizado ve. |
| Producción | **Base de servidor preparada; despliegue real pendiente** | `server/runtime-config.ts`, `server/request-policy.ts`, `server/session-cookie.ts`, `server/runtime-server.ts`; configuración explícita, proxy HTTPS loopback, datos privados separados, cookies seguras, bootstrap/preflight/logs/cierre. [Guía y simulación](PRODUCTION_PREPARATION.md). |

## Evidencia y límites

**Última suite: 233/233 y 76 navegador**. [Resultados actuales](COMMUNITY_HOME_STORIES.md).

Corte anterior de fotografías: **225/225**, con las pruebas de fotografías oficiales, migración, privacidad, reintentos y carga parcial. [Resultados y límites actuales](OFFICIAL_MEDIA.md).

Preparación productiva anterior: **217/217**, incluida regresión y 24 resultados de preparación productiva. Navegador: 27 de transporte productivo simulado y 25 locales en Brave/Opera, **104 en cuatro recorridos**; flujo de menor nuevo y sesiones seguras. Lint/tipos/build correctos. Ensayo CLI en copia desechable, sin base habitual. [Guía/resultados](PRODUCTION_PREPARATION.md). No valida TLS, certificado, DNS o proceso de un proveedor real.

Revisión integral anterior: 193/193 y **1,314 en 38 recorridos completos**, con módulos acumulados y otras verificaciones del [informe](v1-integral-review-2026-11-17.md). No se repitió completa tras los cambios de transporte; no sumar con las 104 actuales.

La matriz de Insignias de 234 y la revisión antigua de 134 API/844 navegador siguen como evidencia de sus propios cortes; no se agregan a la revisión nueva. Ver [TESTING](TESTING.md).

Esquemas posteriores a la revisión antigua: 13 reacciones, 14 comentarios, 15 retos y 16 insignias y 17 audiencia de galería y 18 publicaciones institucionales/medios vinculados. La presencia de tablas, rutas y pruebas contrasta las integraciones; no se deducen de nombres de ramas o botones. La demostración en memoria se conserva como referencia separada, no como seguridad.

Incidencias: diez avisos moderados de herramientas/cero de ejecución en la auditoría anterior, no repetida hoy. Las dos intermitencias Opera antiguas no se reprodujeron; su causa sigue sin confirmar. En la revisión integral hubo un error route.fulfill del simulador de reacciones; pasó al repetir y tras mejorar la espera, sin causa exacta confirmada. La prueba visual de insignias se hizo independiente del recorrido funcional. Las trece imágenes de portada cargaron en aquella inspección Brave; las fotos oficiales se integraron después; textos comerciales definitivos siguen pendientes. No se ha probado producción real, correo/Google reales, datos reales o aceptación humana.

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

Después de esa auditoría, el usuario autorizó la revisión integral: [informe](v1-integral-review-2026-11-17.md). Se completó sobre fixtures nuevas. Esa entrega cambió cuatro scripts de pruebas/documentación, sin aplicación, dependencias o datos habituales.

La siguiente autorización llevó a la [preparación productiva](PRODUCTION_PREPARATION.md), código 9be8081: cambios de servidor/configuración, herramientas y pruebas, con interfaz/dependencias/esquema conservados. Ya está ensayada sin contratar, publicar, leer credenciales personales o abrir/migrar la base habitual. **Próximo bloque vigente: N3, operación y recuperación.**

## Cómo actualizar este estado

En cada entrega indicar fecha/base/commit, objetivo y componentes reutilizados, qué quedó implementado y comprobado, pruebas realizadas/no realizadas, efectos en datos/permisos, incidencias y siguiente tarea. No borrar evidencia previa; trasladar bitácoras extensas al historial, con enlace. NEXT_STEPS concentra prioridades; este archivo concentra hechos.
