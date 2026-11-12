# CAI — Integración para demostración

> Antecedente previo al commit de v1.0. Esta integración SÍ quedó confirmada en `release/cai-demo-v1.0`, `f3ba46b`. Las referencias siguientes a worktree, integración sin commit y aprobación pendiente describen aquel momento. Para el estado actual leer `PROJECT_STATE.md`.

## Estado y ejecución

Prototipo integrado, pendiente de revisión del usuario. No es una aplicación de producción.

- Rama de trabajo: `integration/cai-demo`, en `.worktrees/cai-demo` dentro del repositorio original.
- Base: `12cf1ce92520afbfb175ba9b187290a9ef3e2922` (Community aprobada).
- Integración: `origin/feat/admin-dashboard`, `f38b17c720a7e946d66b2f18cc7e68817d7a2ef0`, mediante merge sin commit.
- `feat/auth-pages` apunta al mismo commit y no se incorpora otra vez.
- La landing original ya estaba incluida; se conservan también el pulido `f200c07` y los enlaces de registro de administración.
- Sin commit, push, merge a main ni despliegue. La fusión en la rama de integración queda resuelta y pendiente de commit, exclusivamente después de aprobación.

Desde este worktree:

```powershell
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4180 --strictPort
```

Abrir `http://127.0.0.1:4180/`. Se reutilizaron las dependencias locales existentes; no se añadieron paquetes ni se cambió el lockfile. El servidor de desarrollo para el fixture de las pruebas de Inicio usa `5180`; las pruebas del producto usan el build en `4180`.

## Módulos y rutas

| Ruta | Contenido |
| --- | --- |
| `/` | Landing institucional, con acceso demo y solicitud de acceso |
| `/login` | Login visual simulado; campos, mostrar/ocultar y accesos directos de estudiante/administrador |
| `/registro` | Solicitud por pasos, tutor cuando corresponde, perfil y consentimiento |
| `/community` | Inicio, Galería, Retos, Mis Logros y La Comunidad aprobados; secciones internas |
| `/admin` | Resumen administrativo |
| `/admin/solicitudes` | Solicitudes del registro, autorización de tutor y decisiones |
| `/admin/publicaciones` | Escenario propio de moderación del panel |
| `/admin/alumnos` | Directorio, nuevas altas desde solicitudes, suspensión y reactivación simuladas |
| `/admin/configuracion` | Reglas e interruptores con vista previa propia |
| `/admin/*` | Redirige al resumen del panel |
| Otras rutas | Página de ruta no encontrada existente |

Recorrido disponible y probado: landing → registro → login demo → Community → administración. También se conserva el acceso directo desde la confirmación de registro a su solicitud administrativa.

## Cambios y conflictos resueltos

- `src/app/router.tsx`: combina `CommunityLayout`, las rutas anidadas de `AdminLayout`, registro y login. Se conserva un solo `BrowserRouter`.
- `src/pages/CommunityPage.tsx`: se conserva exactamente la pantalla aprobada, en lugar del placeholder de administración.
- `src/app/App.tsx` y `src/layouts/CommunityLayout.tsx`: se eleva el proveedor existente de Community al nivel de aplicación. Sus datos sobreviven a cambios de ruta sin reescribir el reducer. `DemoStoreProvider` mantiene conectados registro y administración.
- `src/pages/LoginPage.tsx` y `src/features/login/login.module.css`: acceso visual con identidad CAI, campos etiquetados, validación nativa de formato/campos requeridos, control de contraseña y dos entradas demo sin formulario.
- Navegación: enlaces de entrada en landing/navegación común, registro y confirmación; acceso demo desde el menú administrativo.
- Transparencia: el panel explica que sus publicaciones y ajustes son independientes de Community; una publicación aprobada allí no se presenta como enviada a su feed.
- Corrección responsive concreta en `src/features/admin/admin.module.css`: los botones de la cola permiten varias filas bajo 560 px. Se eliminó un desbordamiento real a 320 px, sin ocultar acciones ni alterar escritorio.

Los componentes, estilos, SVG y pruebas existentes bajo `src/features/community`, `src/assets/community` y `scripts/check-community*` permanecen sin cambios respecto de la base. Solo cambia su montaje en los archivos de composición indicados. Se conservan estilos globales, dependencias y configuración.

## Simulación y límites

- Login no autentica ni crea sesiones: cualquier dato ficticio con formato válido permite continuar a Community. Los accesos demo omiten los campos. No hay guardas que finjan proteger rutas.
- Las credenciales de login no pasan al estado compartido, almacenamiento ni peticiones; el formulario se limpia al salir. La contraseña del registro tampoco forma parte de la solicitud administrativa.
- Registro y panel comparten solicitudes en memoria. Aprobar añade al alumno al directorio; los menores requieren registrar la confirmación simulada del tutor. No se crean cuentas ni se envían correos.
- **Moderación independiente:** el panel usa su modelo y fixtures; Community conserva su propia moderación, retos, insignias, publicaciones y fotografías. No se creó un adaptador entre modelos con reglas distintas. Los ajustes, suspensión y aprobación de acceso del panel no restringen las rutas abiertas de esta demo.
- Community conserva sus datos y sección al salir y regresar mediante navegación interna. Una recarga completa descarta ambos estados de contenido. Los controles «Reiniciar demo» de cada módulo afectan a su propio escenario.
- Ajuste posterior: la preferencia de tema ahora es global y persistente en todas las rutas; ver [tema, navegación y reto de Inicio](cai-demo-theme-polish.md). Se conserva el selector aprobado de Community.

## Validación realizada

`npm.cmd run typecheck`, `npm.cmd run lint` y `npm.cmd run build`: correctos. `git diff --check` y comprobación del staging: sin errores de espacios ni conflictos pendientes.

El build integrado emite el aviso de Vite por un bundle principal de aproximadamente **596 kB minificado / 180 kB gzip**, superior a 500 kB. No se oculta el aviso ni se cambia el umbral. No impide servir esta demo local; queda como mejora de carga para una integración posterior.

Los cinco modelos de Community pasaron: 29 + 4 igualdades, 23, 27 + 1 igualdad, 25 + 4 igualdades y 51 + 4 igualdades, respectivamente.

| Regresión existente, Brave | Comprobaciones correctas |
| --- | --- |
| Retos | 30 |
| Logros | 55 |
| Compositor | 19 |
| Inicio premium | 141 |
| Hero móvil | 135 |
| Galería | 40 |
| Galería premium | 144 |
| Pulido visual | 33 |
| Aprendizaje premium | 173, incluida comparación opcional con métricas aprobadas de 6.3 |
| Auditoría integral | 273 |

Nueva prueba `scripts/check-cai-demo-integration.browser.mjs`: **73 comprobaciones en Brave y 73 en Opera GX**, incluyendo 36 escenarios de nueve rutas a 1440, 768, 375 y 320 px por navegador. Sin desbordamientos horizontales, pantallas vacías, errores ni advertencias de consola en esos recorridos. Solo solicitudes GET.

Comprueba login, campos y contraseña, entradas sin credenciales, ausencia de credenciales persistidas o enviadas, conservación del reto/puntos/insignia/tema entre rutas, registro de adulto y menor, validación, aprobación, consentimiento, directorio, suspensión/reactivación, publicación con verificación, rechazo con motivo, deshacer y ajustes con vista previa. Durante la construcción de esta prueba se corrigieron selectores que apuntaban a enlaces ocultos o suponían alias abreviados; no se alteró ninguna regresión existente. El registro histórico de 0,03125 px de Inicio permanece intacto.

Las pruebas de navegador se ejecutan proporcionando la función del archivo a la herramienta de automatización aislada existente; no requieren instalar Playwright en el producto. Las regresiones existentes usan sus fuentes intactas, con los puertos de esta integración sustituidos únicamente en memoria al ejecutarlas.

## Evidencias y revisión

[Abrir las siete capturas](../review/cai-demo-integration/index.html) · [Resultados](../review/cai-demo-integration/resultados.json).

1. Landing, 1440 px.
2. Login, 1440 px.
3. Login completo, 375 px (captura de página completa; requiere scroll real).
4. Registro, 768 px.
5. Administración, 1440 px.
6. Community oscura, 375 px.
7. Administración, 320 px.

## Pendientes y paso a una aplicación real

Se espera revisión y aprobación antes de cualquier commit o publicación. No se verificó con lectores de pantalla reales, dispositivos físicos, Firefox o Safari. Brave y Opera GX comparten motor Chromium.

Para producción serían necesarios contratos de API, sesiones y autorización de servidor, identidad real, persistencia, reglas de moderación e idempotencia, almacenamiento privado de medios, consentimiento verificable, políticas de acceso y datos, recuperación de contraseña, contenido autorizado, pruebas de seguridad y operación. Conectar ambas moderaciones o sustituir fixtures exige un acuerdo explícito; no forma parte de este prototipo congelado.
