# Base del frontend de CAI

## Alcance

Esta tarea prepara la infraestructura local de P0 descrita en `prototype-plan.md`: React, TypeScript, Vite, Tailwind CSS, React Router, layout compartido y pantallas provisionales. El aviso «Prototipo / datos ficticios» se muestra en todas las rutas.

Los estilos son neutros y temporales. La identidad visual anterior no se ha adaptado porque sus materiales y su adaptación no están acordados. El diseño definitivo, el selector de roles demo y los flujos de publicaciones y moderación siguen pendientes para próximas tareas. Esta entrega no altera los requisitos funcionales del producto.

No se implementan autenticación, controles de acceso, backend, base de datos ni almacenamiento de usuarios. No se solicitan ni se incluyen datos personales. `/community` y `/admin` son pantallas de demostración de acceso público.

## Estructura

```text
CAI_Enterprices/
├── docs/
│   ├── frontend-foundation.md
│   ├── prototype-plan.md
│   ├── requirements.md
│   └── vision.md
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── router.tsx
│   ├── components/
│   │   ├── MainNavigation.tsx
│   │   ├── PlaceholderPage.tsx
│   │   └── PrototypeNotice.tsx
│   ├── layouts/
│   │   └── AppLayout.tsx
│   ├── pages/
│   │   ├── AdminPage.tsx
│   │   ├── CommunityPage.tsx
│   │   ├── InstitutionalPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── styles/
│   │   └── index.css
│   └── main.tsx
├── .gitignore
├── AGENTS.md
├── README.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

`node_modules/` y `dist/` son directorios generados e ignorados por Git. Las cachés de TypeScript se guardan dentro de `node_modules/.tmp/`.

## Organización y decisiones

- `main.tsx` monta React en modo estricto e importa los estilos globales.
- `app/` integra la aplicación y centraliza las rutas con React Router en modo declarativo, sin servidor de aplicación.
- `layouts/` reúne aviso, cabecera, navegación, contenido y pie compartidos.
- `components/` contiene piezas reutilizables. `PlaceholderPage` unifica la estructura de las pantallas y actualiza el título del documento.
- `pages/` contiene una pantalla independiente por ruta y una alternativa para direcciones desconocidas.
- `styles/index.css` importa Tailwind y define estilos mínimos de base y foco. El plugin oficial `@tailwindcss/vite` integra los estilos en Vite.
- TypeScript utiliza modo estricto y verifica tanto `src/` como `vite.config.ts`. ESLint aplica las reglas recomendadas de JavaScript, TypeScript y React Hooks, además del control de exportaciones para React Refresh.
- No se añaden librerías de componentes, gestión de estado, formularios ni servicios externos.
- La navegación permite uso por teclado, identifica la ruta activa y ofrece un enlace para saltar al contenido. El layout adapta la cabecera y permite que los enlaces se distribuyan en varias líneas en pantallas pequeñas.

## Instalación y comandos

Utilizar Node.js 22.13+ de la rama 22, o Node.js 24+, y npm 10 o superior. Este rango respeta los requisitos de Vite y ESLint 10. Entorno de validación: Windows, Node.js 24.22.0 y npm 11.19.1. Conservar `package-lock.json` y usar `npm ci` para instalaciones reproducibles.

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm run build
npm run preview
```

En PowerShell con bloqueo de `npm.ps1`, usar `npm.cmd` en estos comandos. `preview` requiere haber ejecutado `build` y sirve únicamente para revisar el resultado local.

## Dependencias

- Aplicación: `react`, `react-dom` y `react-router`.
- Compilación y estilos: `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss` y `@tailwindcss/vite`.
- Tipos: `@types/react`, `@types/react-dom` y `@types/node`.
- Calidad: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` y `globals`.

Las versiones declaradas están en `package.json`; las versiones exactas y sus dependencias transitivas quedan fijadas en `package-lock.json`.

Referencias de configuración: [Vite](https://vite.dev/guide/), [Tailwind con Vite](https://tailwindcss.com/docs/installation/using-vite) y [React Router declarativo](https://reactrouter.com/start/declarative/installation).

## Verificación y límites

Verificaciones realizadas el 17 de octubre de 2026 con Node.js 24.22.0 y npm 11.19.1:

| Control | Resultado |
| --- | --- |
| `npm run typecheck` | Correcto; comprueba aplicación y configuración de Vite. |
| `npm run lint` | Correcto, sin errores ni advertencias. |
| `npm run build` | Correcto; genera `dist/`. |
| `npm ls --depth=0` | Árbol de dependencias directas sin errores. |
| Auditoría automática de `npm install` | Cero vulnerabilidades reportadas. |
| Servidores `dev` y `preview` | Arranque correcto y respuesta HTTP 200 en `/`. |
| Brave: 1440, 375 y 320 px | Las tres rutas y la alternativa 404 abren y recargan correctamente; aviso visible, enlace activo y títulos correctos, sin desbordamiento horizontal. |
| Brave: interacciones | Navegación cliente sin recargar el documento, historial atrás/adelante, retorno desde 404, salto al contenido y navegación por Tab/Enter correctos. |
| Brave: revisión visual | Capturas de escritorio y móvil revisadas. |
| Opera GX: 1440 y 375 px | Las tres rutas y la navegación funcionan sin desbordamiento horizontal. |
| Consola de Brave y Opera GX | Sin errores ni advertencias durante las comprobaciones. |
| `git diff --check` | Correcto. |

No se configura ni se ejecuta una suite de pruebas unitarias en esta tarea. No se han realizado pruebas con usuarios reales ni una auditoría completa de accesibilidad. Las comprobaciones del navegador se realizaron sobre la compilación local servida mediante `preview`.

Vite permite abrir y recargar las rutas durante desarrollo y preview. En un futuro alojamiento estático será necesario devolver `index.html` para las rutas de la SPA; no se configura ni publica alojamiento en esta tarea. El archivo 404 corresponde a la interfaz cliente y no a un estado HTTP de servidor.

Esta base no es apta para operar una comunidad con alumnos reales. La compilación de Vite genera archivos estáticos; no realiza ningún despliegue.
