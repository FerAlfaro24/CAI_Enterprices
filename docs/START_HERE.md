# CAI — empieza aquí

**Nuevo análisis de pruebas con amigos:** [F1–F6 y criterios de cierre](NEXT_STEPS.md#prioridad-vigente-observaciones-de-amigos-del-23-11-2026). Rama documental `docs/v1-friends-feedback-plan`; código funcional continúa en `c59ec6c`/PR #26. No confundir el plan con cambios ya implementados.


**Actualizado: 23 de noviembre de 2026.** Recuperación del proyecto sin conversaciones de ChatGPT. Distinguir funciones locales, referencia visual, propuestas y producción pendiente.

## Qué rama abrir

| Referencia | Uso |
| --- | --- |
| `fix/v1-open-preview-entry` | **Continuación actual:** [entrada pública temporal](REMOTE_DEMO.md#entrada-pública-temporal--23-de-noviembre-de-2026), incluye PR #25; esquema 20. |
| `fix/v1-remote-registration-guidance` / código `146e061` | Entrega anterior: [Alta propia en prueba remota](REMOTE_DEMO.md#registro-propio-de-amigos--23-de-noviembre-de-2026), incluye administración; esquema 20. |
| `feat/v1-admin-usability-review` / código `e255f91` | Administración anterior: [Administración revisada](ADMIN_USABILITY_REVIEW.md); esquema 20. |
| `feat/v1-photo-viewer-notification-history` / código `bb7b8f6` | Entrega anterior: [Fotos, Retos y notificaciones](COMMUNITY_FEEDBACK.md), esquema 20. |
| `style/v1-final-interface-polish` / código `5bd4c2a` | Entrega anterior: Primera pasada visual de comunidad/página pública/panel. [Entrega](COMMUNITY_DESIGN.md#cierre-visual-primera-pasada). |
| `feat/v1-achievements-progressive-badges` / código `5349283` | Entrega anterior: Logros personales con imágenes, insignias progresivas y perfiles sociales. [Entrega](COMMUNITY_DESIGN.md#logros-insignias-y-perfiles-implementados). |
| `feat/v1-community-header-highlights` / base `ffb323d` | Entrega anterior: cabecera limpia, opciones en Mi espacio y avisos/momentos en carrusel único. [Revisión](COMMUNITY_DESIGN.md#cabecera-y-novedades-en-un-solo-lugar). |
| `feat/v1-community-social-feed` / base `d6e66fd` | Entrega anterior: publicaciones amplias, emojis sin etiquetas y conversación simplificada. [Revisión](COMMUNITY_DESIGN.md#publicaciones-y-conversación-más-sencillas). |
| `feat/v1-community-playful-design` / base `4cdae44` | Entrega anterior: primera muestra visual de comunidad, Retos, perfil/notificaciones e interacciones. [Plan y evidencia](COMMUNITY_DESIGN.md). |
| `feat/v1-remote-demo` / base `d7ef781` | Entrega anterior: presentación remota protegida y temporal, copia ficticia y frontend compilado. [Guía](REMOTE_DEMO.md). |
| `fix/v1-gallery-all-photos` / base `f9c3c1a` | Entrega anterior: todas las fotos visibles por defecto; Álbumes opcional. Incluye el Inicio conectado y las entregas anteriores. [Guía](COMMUNITY_HOME_STORIES.md#corrección-de-visibilidad-en-galería). |
| `feat/v1-community-home-stories` / base `422b4d2` | Entrega anterior: Inicio visual, publicaciones oficiales, álbumes/avisos y demo para el cliente; esquema 18. [Guía](COMMUNITY_HOME_STORIES.md). |
| `feat/v1-official-media` / base `d410247` | Paso anterior: fotografías oficiales, audiencia común y esquema 17; incluye las ramas anteriores. [Guía](OFFICIAL_MEDIA.md). |
| `feat/v1-production-preparation` / código `9be8081` | Preparación anterior: desde 95e53e2, añade configuración/sesiones/operación inicial de producción ensayadas; no desplegada. |
| `test/v1-integral-review-2026-11-17` / pruebas `8c515de` | Revisión integral anterior, código completo y documentación corregida. |
| `docs/continuidad-auditoria-2026-11-17` | Auditoría documental inicial y código funcional completo. PR #9, anterior a los resultados de la revisión integral. |
| `fix/v1-dev-preview-cache` / `3971284` | Base funcional anterior a la preparación productiva: insignias, retos y corrección de caché. |
| `feat/v1-community-badges` / `bdef066` | Paso anterior acumulativo; sin la corrección posterior de caché. |
| `chore/v1-final-review` / `fee87d1` | Revisión anterior, 15 commits detrás; sin las integraciones posteriores de reacciones/comentarios/retos/insignias. |
| `release/cai-demo-v1.0` / `f3ba46b` | Referencia visual oficial congelada. |
| `main` / `a3c2569` | Rama predeterminada antigua, 74 commits detrás de la base funcional al corte. |

PR #9 conserva sus siete commits originales e incorpora la línea funcional; se dirige a fix/v1-dev-preview-cache y su diff es solo Markdown. La rama de revisión posterior parte de b55cd50 y añade pruebas/documentación, con [193 API y 1,314 navegador comprobados de nuevo](v1-integral-review-2026-11-17.md). Ninguna PR se fusiona automáticamente ni mueve main/release. Ver [BRANCHES](BRANCHES.md).

## Qué hay

Sitio institucional, comunidad privada y panel. Persistencia/permisos locales para solicitudes/activación, alumnos/tutores, grupos, moderación, comentarios, reacciones, imágenes, perfiles, equipo y recuperación/avisos. Retos e Insignias **ya conectados**: 180 preguntas/45 temas, tres al día y 21 insignias con historial. Logros personales con imágenes, validación privada/publicación opcional y perfiles sociales ya conectados.

SQLite esquema 20; fotos oficiales públicas y para todos los alumnos aprobados integradas. Google real, entrega de correo, contenido comercial/validaciones finales, aceptación de CAI e infraestructura pendientes. **Vídeos opcionales y de menor prioridad**, no implementados; si se retoman, solo coordinación sube y grupo autorizado ve. No ejecutar planes antiguos como tareas abiertas.

El modo local sigue limitado a localhost. Producción exige configuración explícita, datos privados separados y proxy HTTPS loopback; se comprobó en simulación, **sin alojamiento definitivo**. Ver [guía productiva](PRODUCTION_PREPARATION.md), [PROJECT_STATE](PROJECT_STATE.md) y [NEXT_STEPS](NEXT_STEPS.md).

## Recuperar un clon en Windows

```powershell
git --version
node --version
npm.cmd --version
```

Node >=24.12.0, npm >=10. GitHub muestra este repositorio como público al 19-11-2026. Para operaciones autenticadas, utiliza el gestor de GitHub; no pongas tokens en comandos/archivos. Para un clon nuevo:

```powershell
git clone https://github.com/FerAlfaro24/CAI_Enterprices.git
cd CAI_Enterprices
git switch --track origin/fix/v1-open-preview-entry
code .
npm.cmd ci
```

En un clon existente, comprobar estado/cambios, actualizar referencias y elegir rama; no crear el seguimiento otra vez si ya existe. No reset/clean ni reemplazo de datos. No instalar herramientas ni cambiar políticas del sistema implícitamente. Si npm.ps1 está bloqueado, usar npm.cmd.

## Abrir y probar

Seguir [RUN_LOCAL](RUN_LOCAL.md): separa fixture nueva con cuenta ficticia de la instalación que ya tenga datos. No hay contraseña real universal en GitHub. Los servicios deben estar encendidos; un enlace localhost no es un sitio público permanente.

Rutas habituales: `/` portada, `/login` alumno, `/community` comunidad protegida y `/admin` panel/acceso administrativo. El alumno necesita aprobación y activación; administrar no crea una sesión de alumno. Confirmar renderizado en navegador, además de HTTP.

## Orden de lectura

1. Esta página y [PROJECT_STATE](PROJECT_STATE.md): orientación y hechos.
2. [BRANCHES](BRANCHES.md): cadena y clasificación de ramas.
3. [NEXT_STEPS](NEXT_STEPS.md): pendientes, propuestas y dependencias.
4. [RUN_LOCAL](RUN_LOCAL.md), [TESTING](TESTING.md) y [guía del panel](guia-administracion.md).
5. [DOCUMENTATION_INDEX](DOCUMENTATION_INDEX.md) para cualquier otro documento; [AGENTS](../AGENTS.md) para normas.

Los informes de entregas describen sus propios cortes; sus próximos pasos históricos no prevalecen sobre las guías vigentes. [PROJECT_HISTORY](PROJECT_HISTORY-2026-11-12.md) conserva el registro anterior. No confundir evidencia local ignorada con archivos recuperables tras clonar.

## Continuar

Identificar componente/servicio existente y criterio de cierre. Crear rama desde el avance funcional acordado; no fusionar todas las features ni duplicar pantallas. Cada entrega registra base/commit, alcance, archivos, pruebas realmente ejecutadas/no ejecutadas y siguiente paso. Mantener estas guías junto al código.

La auditoría documental inicial no reejecutó pruebas; las tandas integral y de preparación productiva posteriores sí, cada una con su código/alcance y sin sumar matrices. La última registra 217 API y 104 navegador seleccionadas. Preserva la interfaz y datos habituales, con cambios en servidor. TLS/proveedor reales y aceptación humana siguen pendientes.


## Material privado de comunidad

El repositorio figura público; las seis fotos oficiales de cumpleaños/convivencias se conservan fuera de Git. Para cargarlas, instalar el paquete privado en `.local/official-media` (local) o `CAI_DATA_DIR/official-media` (producción) y usar **Fotos oficiales de CAI** en Galería privada. Ver [guía y selección](OFFICIAL_MEDIA.md). Un clon puede compilar y ejecutar pruebas sin ese paquete; el importador explica su ausencia sin publicar archivos alternativos.


## Presentar la comunidad activa

Ejecutar `node server/tests/community-showcase-server.ts` para crear una base de demostración nueva y abrir la web en 4187/API 3197. Contiene ocho publicaciones, dos álbumes, 24 comentarios y reacciones ficticias, con aviso visible. Requiere los seis medios privados instalados. Usa los accesos ficticios de [COMMUNITY_HOME_STORIES](COMMUNITY_HOME_STORIES.md). No abrir local:setup ni la base habitual para llenar la presentación. No reiniciar si se quiere conservar las interacciones de esa demo: cada inicio del script crea otra base.
