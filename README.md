# CAI — Plataforma web

Plataforma para **CAI (Centro de Asesorías Integrales)**, centrada en la presentación de sus servicios de enseñanza de inglés y en una futura comunidad privada de estudiantes.

> **Estado:** landing institucional y comunidad interactiva de demostración implementadas. Administración mantiene su pantalla provisional. No es un sistema apto para usuarios reales.

## Objetivo inmediato

Crear en pocos días una demostración visual navegable para revisar con el cliente qué funcionalidades necesita.

### Módulos previstos
1. **Web pública:** presentación, programas, información comercial y contacto.
2. **Comunidad:** feed y logros de alumnos, publicaciones sujetas a moderación.
3. **Administración:** gestión visual de alumnos, solicitudes y publicaciones.

## Estado del repositorio
Esta rama incluye **React + TypeScript + Vite**, **Tailwind CSS** y **React Router**. La landing adapta la propuesta visual original con Figtree, logotipos CAI, secciones responsive y estilos encapsulados mediante CSS Modules. Los textos comerciales, cifras y testimonios se identifican como contenido de muestra.

`/` utiliza `LandingLayout`; `/community` tiene su propio `CommunityLayout`; `/admin` y la página 404 conservan `AppLayout`. Los formularios institucionales no envían solicitudes ni reservan clases.

La comunidad incluye 15 publicaciones ficticias, reacciones, comentarios, galerías, filtros, perfiles y retos compartidos. La vista «Moderador» permite demostrar aprobación/rechazo y fijación de avisos dentro de `/community`, sin modificar el futuro panel administrativo. Todo usa estado React en memoria: al salir de la ruta, recargar o pulsar «Reiniciar demo» se restaura el escenario. No hay cuentas, permisos reales, envíos ni almacenamiento de datos de alumnos.

## Desarrollo local

Requisitos: **Node.js 24.12 o posterior** y **npm 10 o superior**. La rama de trabajo incorpora un backend local de solicitudes y alumnos, separado de la demo: consulta [cómo iniciar el guardado local y el acceso administrativo](docs/local-backend.md). Las cuentas de alumnos y Community aún no están conectadas a él.

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
