# CAI — Plataforma web

Plataforma para **CAI (Centro de Asesorías Integrales)**, centrada en la presentación de sus servicios de enseñanza de inglés y en una futura comunidad privada de estudiantes.

> **Estado vigente:** `release/cai-demo-v1.0` es la base oficial de diseño. `chore/v1-final-review` conserva los avances acumulados hasta expediente (`c712abb`) y herramientas (`9274dc9`), con revisión local y mejora de lectura móvil (`940573a`). Consulta [la revisión final y sus límites](docs/v1-final-review.md) y [el registro de continuidad](docs/PROJECT_STATE.md). No es un sistema apto para usuarios reales.

> **Continuación:** revisión técnica del punto 5 realizada: 134 resultados de servidor y matriz de 844 comprobaciones en Brave/Opera; incidencias registradas en el informe. Puntos 1–3 comprobados localmente; punto 4 conserva diez avisos moderados de desarrollo pendientes y cero en ejecución. Sigue la tanda con CAI: uso del panel, contenido/autorizaciones, cuentas Google/correo y alcance del cambio verificado de correo. Presupuesto/alojamiento después, como acordado. Las ramas son acumulativas; no fusionarlas como trabajos independientes.

## Objetivo inmediato

Conectar el diseño oficial de v1.0 con los servicios locales ya desarrollados, sin reconstruir sus pantallas. La demostración visual existente se conserva como referencia. El orden y los criterios de cierre están en `docs/PROJECT_STATE.md`.

### Módulos previstos
1. **Web pública:** presentación, programas, información comercial y contacto.
2. **Comunidad:** feed y logros de alumnos, publicaciones sujetas a moderación.
3. **Administración:** gestión visual de alumnos, solicitudes y publicaciones.

## Estado del repositorio
Esta rama incluye **React + TypeScript + Vite**, **Tailwind CSS** y **React Router**. La landing adapta la propuesta visual original con Figtree, logotipos CAI, secciones responsive y estilos encapsulados mediante CSS Modules. Los textos comerciales, cifras y testimonios se identifican como contenido de muestra.

`/` utiliza `LandingLayout`; `/community` tiene `CommunityLayout`; `/admin/*` usa el dashboard completo de `AdminLayout`; la página 404 conserva `AppLayout`. Los enlaces antiguos `/gestion/*`, `/registro-local`, `/alumnos` y `/alumnos/publicaciones` redirigen al destino oficial correspondiente. `/mi-inscripcion` conserva la ficha y grupo del alumno; `/admin/mensajes?bandeja=avisos` abre los avisos directamente. El contacto institucional guarda consultas y permite seguimiento en el panel original. La lista de interés de la plataforma futura conserva su demostración.

La comunidad oficial consulta la cuenta autenticada, miembros del grupo, publicaciones aprobadas, avisos propios e imágenes privadas del servidor local. El diseño y los componentes de demostración se conservan como referencia; comentarios/reacciones persistentes y retos/insignias siguen pendientes de alcance, sin presentarse como guardado real. La galería conectada no mezcla fotografías de stock con los registros del grupo.

## Desarrollo local

Requisitos: **Node.js 24.12 o posterior** y **npm 10 o superior**. Consulta [cómo preparar el servicio y la cuenta local](docs/local-backend.md) y [cómo activar cuentas y probar permisos](docs/student-accounts.md). Preparar `local:setup` únicamente al configurar un entorno nuevo según esa guía; no reemplazar la base ni las credenciales de un entorno existente.

```sh
npm ci
npm run dev:local
```

Abrir `http://127.0.0.1:5173`. `dev:local` inicia interfaz y API en este equipo. Si PowerShell bloquea `npm.ps1`, utilizar `npm.cmd` en lugar de `npm` sin modificar la política de ejecución.

| Comando | Función |
| --- | --- |
| `npm run dev:local` | Interfaz y API local conectadas, con datos ficticios. |
| `npm run dev` | Solo Vite; las funciones conectadas requieren iniciar la API aparte. |
| `npm run test:api` | Regresiones de servidor, permisos, persistencia y respaldos. |
| `npm run local:backup` | Respaldo consistente de SQLite, incluidas imágenes procesadas. |
| `npm run local:verify-backup -- "RUTA.sqlite"` | Comprobar una copia en solo lectura, sin restaurar ni modificar la base activa. |
| `npm run typecheck` | Comprobar tipos de la aplicación y la configuración de Vite. |
| `npm run lint` | Ejecutar ESLint; las advertencias también hacen fallar el control. |
| `npm run build` | Comprobar tipos y generar los archivos estáticos en `dist/`. |
| `npm run preview` | Revisar localmente la compilación de `dist/`. |

Para comprobar las reglas de la comunidad sin instalar un framework de pruebas: `node scripts/check-community-model.mjs`.

Rutas principales: `/` institucional, `/login`, `/registro`, `/community` para alumnos autorizados y `/admin/*` para administración. Activación y recuperación conservan enlaces auxiliares. Los permisos se aplican en el servidor local, también a cada recurso de imagen. Las rutas desconocidas muestran 404; dentro de administración se vuelve a su inicio protegido.

## Documentación
- [Revisión final local: resultados, incidencias y siguiente tanda con CAI](docs/v1-final-review.md)
- [Estado oficial, auditoría de ramas y orden obligatorio de integración](docs/PROJECT_STATE.md)
- [Herramientas y alertas: revisión actual y corrección pendiente](docs/v1-tooling-audit.md)
- [Correcciones del expediente, historial y protección de menores](docs/v1-student-record.md)
- [Equipo administrador, invitaciones, estados y pruebas](docs/v1-admin-team.md)
- [Recuperación administrativa: enlace privado, pruebas y correo pendiente](docs/v1-admin-recovery.md)
- [Perfil visible propio del alumno, privacidad y pruebas](docs/v1-student-profile.md)
- [Contraseña administrativa propia, entrega y pruebas](docs/v1-admin-account-security.md)
- [Guía sencilla de administración](docs/guia-administracion.md)
- [Respaldos y recuperación local](docs/respaldo-recuperacion-local.md)
- [Estabilización: carga, errores, pruebas y alertas pendientes](docs/v1-stabilization.md)
- [Navegación unificada, compatibilidad de enlaces y pruebas](docs/v1-unified-navigation.md)
- [Galería privada, límites y pruebas](docs/v1-private-gallery.md)
- [Contacto, bandejas y recuperación oficiales](docs/v1-inbox-recovery-contact.md)
- [Catálogo, asignaciones y ajustes conectados](docs/v1-groups-settings.md)
- [Community y moderación oficiales conectadas](docs/v1-connected-community.md)
- [Acceso y dashboard originales conectados](docs/v1-connected-access.md)
- [Recuperación y avisos locales](docs/local-recovery.md)
- [Publicaciones de texto y moderación local](docs/local-publications.md)
- [Acceso con Google: configuración y revisión obligatoria](docs/google-signin.md)
- [Activación de alumnos y permisos locales](docs/student-accounts.md)
- [Backend local: acceso, solicitudes, alumnos y respaldos](docs/local-backend.md)
- [Plan de entrega local en tres semanas](docs/local-delivery-plan.md)
- [Visión del producto](docs/vision.md)
- [Requisitos iniciales](docs/requirements.md)
- [Plan de prototipo](docs/prototype-plan.md)
- [Base del frontend y guía de desarrollo](docs/frontend-foundation.md)
- [Implementación de la landing, pruebas y procedencia de imágenes](docs/landing-implementation.md)
- [Implementación de la comunidad y guía de demostración](docs/community-implementation.md)
- [Instrucciones para Codex](AGENTS.md)

## Flujo de trabajo
- Crear un Issue por funcionalidad o corrección.
- Desarrollar en una rama específica (ej. `feat/landing`).
- Revisar los cambios mediante Pull Request antes de fusionar en `main`.
- Mantener documentación y código alineados.

## Propuesta visual anterior
La copia local de la propuesta anterior se conserva en `reference/cai-original/`, ignorada por Git. Se adaptó su diseño sin modificarla ni importarla desde la aplicación. Únicamente se copiaron los dos SVG necesarios a `src/assets/cai/`. La procedencia de las fotografías de stock, las diferencias y los contenidos por validar se detallan en la guía de implementación.

## Privacidad
Utilizar exclusivamente **datos ficticios**. Ya existen autenticación, permisos, moderación persistente y almacenamiento privado locales comprobados en el alcance documentado. La revisión técnica local está realizada; permanecen las incidencias y límites del informe, configuración externa, entrega real de correo/Google, consentimiento/contenido, infraestructura y aceptación humana de CAI. No publicar ni admitir alumnos reales como parte de las pruebas locales.
