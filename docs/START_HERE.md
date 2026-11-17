# CAI — empieza aquí

**Corte: 17 de noviembre de 2026.** Recuperación del proyecto sin conversaciones de ChatGPT. Distinguir funciones locales, referencia visual, propuestas y producción pendiente.

## Qué rama abrir

| Referencia | Uso |
| --- | --- |
| `docs/continuidad-auditoria-2026-11-17` | Esta documentación corregida y código funcional completo. PR #9, sin fusión automática. |
| `fix/v1-dev-preview-cache` / `3971284` | Última base funcional verificada: insignias, retos y corrección de caché. |
| `feat/v1-community-badges` / `bdef066` | Paso anterior acumulativo; sin la corrección posterior de caché. |
| `chore/v1-final-review` / `fee87d1` | Revisión anterior, 15 commits detrás; sin las integraciones posteriores de reacciones/comentarios/retos/insignias. |
| `release/cai-demo-v1.0` / `f3ba46b` | Referencia visual oficial congelada. |
| `main` / `a3c2569` | Rama predeterminada antigua, 74 commits detrás de la base funcional al corte. |

Esta actualización conserva los siete commits originales de PR #9 e incorpora la línea funcional en su rama de trabajo. La PR se dirige a `fix/v1-dev-preview-cache` y su diferencia debe ser **solo Markdown**. No se mueve main/release ni se fusiona la PR. Ver [BRANCHES](BRANCHES.md).

## Qué hay

Sitio institucional, comunidad privada y panel. Persistencia/permisos locales para solicitudes/activación, alumnos/tutores, grupos, moderación, comentarios, reacciones, imágenes, perfiles, equipo y recuperación/avisos. Retos e Insignias **ya conectados**: 180 preguntas/45 temas, tres al día y nueve insignias con historial y compartición voluntaria.

SQLite esquema 16. Google real, entrega de correo, contenido/autorizaciones, aceptación de CAI e infraestructura pendientes. **Vídeos opcionales y de menor prioridad**, no implementados; si se retoman, solo coordinación sube y grupo autorizado ve. No ejecutar planes antiguos como tareas abiertas.

El servidor rechaza NODE_ENV=production y está limitado a localhost. No es un despliegue validado. Pruebas con datos ficticios. Ver [PROJECT_STATE](PROJECT_STATE.md) y [NEXT_STEPS](NEXT_STEPS.md).

## Recuperar un clon en Windows

```powershell
git --version
node --version
npm.cmd --version
```

Node >=24.12.0, npm >=10. Repositorio privado: autentícate con el gestor de GitHub que utilices; no pongas tokens en comandos/archivos. Para un clon nuevo:

```powershell
git clone https://github.com/FerAlfaro24/CAI_Enterprices.git
cd CAI_Enterprices
git switch --track origin/docs/continuidad-auditoria-2026-11-17
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

Esta auditoría es documental: no reejecuta pruebas de producto ni valida producción. La aplicación no cambia respecto a `3971284`.
