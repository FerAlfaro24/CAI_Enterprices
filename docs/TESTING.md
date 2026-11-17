# CAI — pruebas y lectura de evidencia

**Actualizado: 17-11-2026.** Esta auditoría documental no reejecuta pruebas de producto. Distinguir resultados registrados de las comprobaciones realizadas en una nueva entrega. No probar contra la base/acceso habitual.

## Evidencia histórica por corte

| Entrega / código | Suite API registrada | Navegador registrado | Fuente |
| --- | --- | --- | --- |
| Revisión anterior, `940573a` y cierre `fee87d1` | 134 correctos | 844: 24 recorridos, 422 por navegador | [Informe](v1-final-review.md) |
| Reacciones, `3ceb1ee` / `2816175` | 147 correctos | 134: reacciones 28 + Community 39 por navegador | [Informe](v1-community-reactions.md) |
| Comentarios, `baa078f` / `9024905` | 163 correctos | 228: comentarios 47 + reacciones 28 + Community 39 por navegador | [Informe](v1-community-comments.md) |
| Retos, `fbb1545` / `e14eda7` | 179 correctos | 142: 53 funcionales +18 adicionales por navegador | [Informe](v1-community-challenges.md) |
| Insignias, `bf9cf2e` / `c8788bf` | **193 correctos** | 234: insignias 46+18 y regresión de Retos 53 por navegador | [Informe](v1-community-badges.md) |
| Caché, `3971284` | No repetida | Portada/login/admin anónimos en Brave/Opera; modelos, tipos, lint de configuración y HEAD privados | [Informe](solucion-pantalla-blanca-local.md) |

No sumar estas matrices como pruebas únicas de una sola versión ni deducir menor cobertura del total inferior de una tanda: cada una tiene alcance propio y regresiones seleccionadas. No se volvió a ejecutar la matriz antigua completa al conectar cada módulo. Las cifras son resultados, no garantías de producción.

## Comandos disponibles

Desde una rama actual e instalación de dependencias ya preparada:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test:api
```

La suite API crea fixtures propias bajo `.local/tests`, utiliza puertos locales y ensaya copias separadas. Requiere permisos de ejecución y localhost; no cambiar límites/aserciones para hacerla pasar. Typecheck cubre aplicación/configuración de Vite según tsconfig, no afirmar que compila estáticamente todo el servidor.

Modelos existentes, sin instalar otro framework:

```powershell
node scripts/check-community-model.mjs
node scripts/check-community-publication.mjs
node scripts/check-community-challenges.mjs
node scripts/check-community-achievements.mjs
node scripts/check-community-gallery.mjs
```

Son comprobaciones de reglas de demo; por sí solas no prueban persistencia ni autorización. Los verificadores SSR usan caché distinta de la web; no borrar la caché del servidor abierto para ejecutar modelos.

## Navegador y fixtures

Brave principal, Opera GX para compatibilidad; perfiles/contextos aislados. [RUN_LOCAL](RUN_LOCAL.md) permite explorar comunidad con datos ficticios. Los recorridos `.browser.mjs` son funciones para las herramientas de navegador existentes; **no son comandos Node autónomos ni añaden Playwright como dependencia**. Leer exportación/parámetros y pasar metadatos de la fixture correcta. No ejecutar por nombre de archivo sin inspeccionar sus requisitos.

| Recorrido | Servidor nuevo | Script |
| --- | --- | --- |
| Insignias | `server/tests/badges-browser-server.ts` | `scripts/check-connected-badges.browser.mjs`, `check-connected-badges-visual.browser.mjs` |
| Retos | `server/tests/challenges-browser-server.ts` | `scripts/check-connected-challenges.browser.mjs`, `check-connected-challenges-visual.browser.mjs` |
| Comentarios | `server/tests/comments-browser-server.ts` | `scripts/check-connected-comments.browser.mjs` |
| Reacciones | `server/tests/reactions-browser-server.ts` | `scripts/check-connected-reactions.browser.mjs` |
| Bloques anteriores | Fixture nombrada en cada informe del índice | Usar sus cuentas, secreto ficticio y parámetros; no la instalación habitual. |

Compilar la rama, apuntar preview y fixture al mismo CAI_API_PORT y usar origen permitido. Cada fixture produce otra carpeta y metadatos; una fecha fija no representa producción. Repetir desde cero exige otra fixture. Evitar que la actividad de un navegador se confunda con otro alumno del mismo grupo.

Comprobar 1440/768/375/320 según vista, teclado/foco, claro/oscuro, movimiento reducido, carga/vacío/error, conflicto, respuesta perdida y revocación. Inspeccionar visualmente cambios de interfaz importantes. No declarar consola totalmente limpia mientras se provocan deliberadamente errores de red; distinguirlos de errores JavaScript inesperados.

## Archivos privados y copias

Con un servidor **de desarrollo** en el destino correcto, `node scripts/check-private-paths.mjs` hace HEAD sin cookies. Se registraron 13 bloqueos después de proteger el banco de retos. No descargar una base/credenciales para probar seguridad. Preview responde fallback HTML en algunas rutas: un 200 HTML no es un 403 comprobado ni demuestra una fuga. Revisar también el artefacto público antes de publicar.

Copias y restauración separada: [guía](respaldo-recuperacion-local.md). No copiar, reemplazar, migrar o borrar `.local/cai.sqlite` para un test. Los logs y capturas locales ignorados pueden no existir tras clonar; los informes versionados conservan el resultado y cómo repetirlo, no prometen esos archivos.

## Incidencias abiertas y actualización

Auditoría de herramientas: diez alertas moderadas de desarrollo y cero de ejecución **en aquel corte**, pendiente actualización compatible. No es una auditoría de npm ejecutada hoy. Dos recorridos Opera antiguos pasaron en nuevas fixtures sin identificar causa inicial; no afirmar corrección. Fotos externas pendientes de validación final. Ver [herramientas](v1-tooling-audit.md) y [revisión](v1-final-review.md).

Cada nueva entrega debe registrar fecha/base/commit, comandos y recorridos realizados, resultados, fallos/intentados/no ejecutados y límites. Para cambios solo Markdown, comprobar enlaces/referencias/diff y consignar que no se ejecutaron npm/API/navegadores. No reutilizar el resultado de otra rama como prueba nueva.
