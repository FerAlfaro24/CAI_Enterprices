# CAI — Plataforma web

Plataforma para **CAI (Centro de Asesorías Integrales)**, centrada en la presentación de sus servicios de enseñanza de inglés y en una futura comunidad privada de estudiantes.

> **Estado:** base del frontend y prototipo navegable con pantallas provisionales. No es un sistema apto para usuarios reales todavía.

## Objetivo inmediato

Crear en pocos días una demostración visual navegable para revisar con el cliente qué funcionalidades necesita.

### Módulos previstos
1. **Web pública:** presentación, programas, información comercial y contacto.
2. **Comunidad:** feed y logros de alumnos, publicaciones sujetas a moderación.
3. **Administración:** gestión visual de alumnos, solicitudes y publicaciones.

## Estado del repositorio
Esta rama incluye la base del frontend con **React + TypeScript + Vite**, **Tailwind CSS** y **React Router**. Las tres áreas tienen pantallas provisionales y navegación compartida; el diseño definitivo y los flujos de negocio se implementarán en tareas posteriores.

## Desarrollo local

Requisitos: **Node.js 22.13+ de la rama 22, o Node.js 24+**, y **npm 10 o superior**. La instalación utilizada para validar esta base se detalla en [la guía del frontend](docs/frontend-foundation.md).

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

Rutas disponibles: `/` (institucional), `/community` (comunidad simulada) y `/admin` (administración simulada). Las direcciones desconocidas muestran una pantalla 404 dentro del layout compartido. Todas las rutas son públicas durante esta demostración.

## Documentación
- [Visión del producto](docs/vision.md)
- [Requisitos iniciales](docs/requirements.md)
- [Plan de prototipo](docs/prototype-plan.md)
- [Base del frontend y guía de desarrollo](docs/frontend-foundation.md)
- [Instrucciones para Codex](AGENTS.md)

## Flujo de trabajo
- Crear un Issue por funcionalidad o corrección.
- Desarrollar en una rama específica (ej. `feat/landing`).
- Revisar los cambios mediante Pull Request antes de fusionar en `main`.
- Mantener documentación y código alineados.

## Propuesta visual anterior
Existe una landing de CAI desarrollada previamente en otro repositorio del equipo. Se utilizará como **referencia** para la identidad visual y los contenidos, respetando la atribución; este repositorio es el nuevo punto de desarrollo.

## Privacidad
El prototipo usará exclusivamente **datos ficticios**. Los controles de acceso y la moderación simulados no ofrecen garantías de seguridad. El uso real con estudiantes requiere una implementación posterior de autenticación, autorización, almacenamiento privado y consentimiento pertinente.
