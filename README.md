# CAI — Plataforma web

Plataforma para **CAI (Centro de Asesorías Integrales)**, centrada en la presentación de sus servicios de enseñanza de inglés y en una futura comunidad privada de estudiantes.

> **Estado vigente:** `release/cai-demo-v1.0` es la base oficial de diseño: dashboard completo, landing, registro/login y Community avanzada. En `integration/cai-v1-connected`, registro/acceso y solicitudes/alumnos del dashboard original ya utilizan servicios persistentes locales. Falta conectar moderación, Community y ajustes. Las pantallas locales anteriores se conservan temporalmente. Consulta [Estado oficial y orden de integración](docs/PROJECT_STATE.md). No es un sistema apto para usuarios reales.

> **Avance posterior:** en `integration/cai-v1-connected`, registro/login y solicitudes/alumnos del dashboard original ya están conectados al servidor local. La conexión del feed avanzado y moderación es el siguiente bloque. Ver [recorrido conectado de v1.0](docs/v1-connected-access.md).

## Objetivo inmediato

Conectar el diseño oficial de v1.0 con los servicios locales ya desarrollados, sin reconstruir sus pantallas. La demostración visual existente se conserva como referencia. El orden y los criterios de cierre están en `docs/PROJECT_STATE.md`.

### Módulos previstos
1. **Web pública:** presentación, programas, información comercial y contacto.
2. **Comunidad:** feed y logros de alumnos, publicaciones sujetas a moderación.
3. **Administración:** gestión visual de alumnos, solicitudes y publicaciones.

## Estado del repositorio
Esta rama incluye **React + TypeScript + Vite**, **Tailwind CSS** y **React Router**. La landing adapta la propuesta visual original con Figtree, logotipos CAI, secciones responsive y estilos encapsulados mediante CSS Modules. Los textos comerciales, cifras y testimonios se identifican como contenido de muestra.

`/` utiliza `LandingLayout`; `/community` tiene `CommunityLayout`; `/admin/*` usa el dashboard completo de `AdminLayout`; la página 404 conserva `AppLayout`. `/gestion/*` y `/alumnos` son las interfaces locales provisionales que deben integrarse en el diseño oficial. Los formularios de contacto institucional siguen siendo demostraciones sin guardado.

La comunidad avanzada conserva publicaciones ficticias, reacciones, comentarios, galerías, filtros, perfiles, retos y logros. Su estado en memoria es independiente del panel demo y de SQLite; recargar o reiniciar la demo lo restaura. Los proveedores elevados conservan estado al cambiar de ruta. Las cuentas, permisos y publicaciones persistentes locales todavía no alimentan estas vistas oficiales.

## Desarrollo local

Requisitos: **Node.js 24.12 o posterior** y **npm 10 o superior**. La rama de trabajo incorpora un backend local de solicitudes, cuentas y alumnos, separado de la demo: consulta [cómo iniciar el guardado local](docs/local-backend.md) y [cómo activar cuentas y probar permisos](docs/student-accounts.md). Las publicaciones de Community siguen en demostración.

```sh
npm ci
npm run dev
```

Abrir la dirección que indique Vite (normalmente `http://localhost:5173`). Si PowerShell bloquea `npm.ps1`, utilizar `npm.cmd` en lugar de `npm` sin modificar la política de ejecución.

| Comando | Función |
| --- | --- |
| `npm run dev` | Servidor local con recarga durante el desarrollo. |
| `npm run typecheck` | Comprobar tipos de la aplicación y la configuración de Vite. |
| `npm run lint` | Ejecutar ESLint; las advertencias también hacen fallar el control. |
| `npm run build` | Comprobar tipos y generar los archivos estáticos en `dist/`. |
| `npm run preview` | Revisar localmente la compilación de `dist/`. |

Para comprobar las reglas de la comunidad sin instalar un framework de pruebas: `node scripts/check-community-model.mjs`.

Rutas disponibles: `/` (institucional), `/community` (comunidad simulada) y `/admin` (administración simulada). Las direcciones desconocidas muestran una pantalla 404 dentro del layout compartido. Todas las rutas son públicas durante esta demostración.

## Documentación
- [Estado oficial, auditoría de ramas y orden obligatorio de integración](docs/PROJECT_STATE.md)
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
El prototipo usará exclusivamente **datos ficticios**. Los controles de acceso y la moderación simulados no ofrecen garantías de seguridad. El uso real con estudiantes requiere una implementación posterior de autenticación, autorización, almacenamiento privado y consentimiento pertinente.
