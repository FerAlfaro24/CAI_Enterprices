# Reacciones conectadas de Community

> Avance posterior: [comentarios/moderación](v1-community-comments.md) ya integrados y comprobados, esquema 14. Las referencias a comentarios pendientes de este informe son históricas; sus resultados de reacciones se conservan y se repitieron como regresión.

**Integradas y comprobadas localmente con cuentas ficticias.** Rama `feat/v1-community-reactions`, base `e1b2a0f`. Puntos de retorno: `3ceb1ee` (servicio/migración/pruebas) y `2816175` (interfaz/recorrido). Es la primera implementación de la [ampliación autorizada](v1-community-expansion.md), no el cierre de comentarios, retos, insignias o vídeos.

## Experiencia

Las historias de Inicio y su detalle comparten **Celebra esta historia**: cinco opciones existentes de CAI, sus contadores y la elección propia. Las opciones son visibles y no requieren pasar el ratón. Elegir otra reemplaza la anterior; pulsar otra vez la seleccionada no cambia nada. **Quitar mi reacción** realiza la retirada explícita. Se muestran el estado propio y el guardado; no hay votos ficticios ni identidad fija de demostración.

Se reutilizan EditorialPostCard, PostCard, PostDetailDialog, las opciones de reacción y los temas. Un componente compartido evita diferencias entre listado y detalle. En 320 px los controles se apilan para conservar etiquetas completas; en anchos mayores se distribuyen en columnas. Teclado, selección accesible y objetivos táctiles de al menos 44 px comprobados.

En **Configuración → Reacciones a las historias → Permitir reacciones**, coordinación activa o pausa nuevas selecciones. **Inicialmente están pausadas** al migrar. Pausar conserva contadores/elecciones y permite quitar la propia. Es independiente de pausar nuevas publicaciones. Comentarios siguen pendientes y no se habilitan por activar este control.

## Servicio y datos

Migración 13 aditiva, sin sustituir tablas ni borrar datos:

- `community_controls.reactions_open`, inicialmente 0.
- `post_reactions`: clave única publicación/alumno, selección o null, revisión y fecha. Se conserva la fila al retirar para que una revisión antigua no vuelva a ser válida.
- `reaction_requests`: clave por alumno y envío, huella de publicación/destino/revisión y fecha, para reintentos sin duplicar ni sobrescribir un cambio posterior.

`PATCH /api/local/student/posts/PUB-…/reaction` recibe únicamente reaction y revision, con Idempotency-Key. La selección es un destino explícito, no una orden de alternar sin conocer el resultado. Repetir la misma clave/datos no vuelve a aplicar el cambio; reutilizarla con otros datos devuelve conflicto. Una revisión vieja con otra clave no sobrescribe la elección actual.

El servicio reutiliza comprobaciones de publicaciones: sesión de alumno activa, solicitud aprobada, grupo asignado, publicación publicada, autor activo y audiencia original vigente. Se revalida la sesión después de recibir el cuerpo y los datos actuales dentro de la transacción. Otro grupo, un anónimo o una sesión solo administrativa no reaccionan por este endpoint. Retirar/devolver a revisión una historia oculta también sus controles y bloquea nuevos cambios/replays.

Origen/campos/formato/tamaño y límite de 60 solicitudes de reacción por cuenta en 15 minutos, además del límite general. No se envían identidades de quienes reaccionaron: el feed recibe solo contadores y selección/revisión propias. Los contadores excluyen cuentas suspendidas, no aprobadas o actualmente fuera del programa/grupo. Al recuperar el acceso y seguir en la audiencia, su selección conservada puede volver a contar.

La interfaz bloquea controles mientras guarda y conserva la clave de un envío incierto si se reintenta la misma intención/revisión. Un conflicto carga la información actual. No guarda contraseñas/correos en storage ni reintenta automáticamente. La declaración de privacidad y el consentimiento real siguen pendientes de validación con CAI.

No se añadieron dependencias. Las copias SQLite incluyen estas tablas; verificador compatible con esquemas 9–13. Pruebas sobre copia separada conservan selección, sesión y reintento. **La base y acceso habituales no se migraron ni cambiaron en esta tarea.** Antes de iniciar el código actualizado sobre un entorno existente, conservar su respaldo y la versión de código correspondiente.

## Comprobaciones realizadas

| Comprobación | Resultado |
| --- | --- |
| Suite completa de servidor | 147 resultados correctos, cero fallos/cancelados/omitidos. |
| Casos específicos de reacciones | 13 resultados incluidos en los anteriores: permisos, validación, audiencia, selección/cambio/retirada, reintento, conflicto concurrente, pausa, suspensión, revocación mientras llega el cuerpo, copia/reinicio, migración 12→13 y límite por cuenta. |
| Reacciones en Brave y Opera GX | 28 por navegador, repetidas completas después del ajuste final de ancho de botones. |
| Regresión de Community/moderación oficial | 39 por navegador sobre el código final. |
| Modelo de Community/publicaciones | 29 + cuatro comparaciones de igualdad; 23, respectivamente. |
| Tipos, lint y build | Correctos; entrada ~239.55 KB, sin aviso grande. |
| Inspección visual | Selección en escritorio/móvil y temas claro/oscuro; sin desbordamiento ni errores/advertencias en esas inspecciones. |
| Sintaxis del recorrido y espacios | Correctos. |

Los dos recorridos de navegador suman **134 comprobaciones** (67 por navegador), sin añadir repeticiones al total. Ningún recorrido nuevo quedó incompleto; cero errores de ejecución JavaScript. No se repitieron los 24 recorridos de la revisión anterior: se seleccionaron las regresiones pertinentes a este cambio.

Se reforzó después el caso de copia para iniciar la API desde el archivo respaldado, en otro destino, y se repitieron los 13 resultados específicos completos. No se restauró sobre la base habitual.

Incidencias de comprobación: primera suite completa falló en una aserción antigua que enumeraba los campos públicos sin engagement; se actualizó para comprobar explícitamente los contadores y la ausencia de datos privados. Suite completa repetida, 147/147. Dos modelos ejecutados en paralelo emitieron un aviso de puerto WebSocket ocupado en uno (salida 0); se repitió publicaciones en solitario y pasó sin ese aviso. En la primera captura de 320 px se partía “Felicidades”; ancho mínimo ajustado de 115 a 128 px, build y recorridos repetidos e inspección posterior correcta.

Las diez alertas moderadas de herramientas continúan pendientes del informe previo. No se investigaron ni corrigieron aquí; tampoco se atribuye una reparación a las intermitencias antiguas de Opera por pasar estos recorridos.

## Archivos

- Servicio/contrato/migración/ruta: `server/reactions.ts`, `publications.ts`, `contracts.ts`, `database.ts`, `administration.ts`, `app.ts` y `verify-backup.ts`.
- Pruebas: `server/tests/reactions.test.ts`, fixture `reactions-browser-server.ts` y `scripts/check-connected-reactions.browser.mjs`; adaptación de versiones/fixtures históricas de administración, publicaciones, galería, seguridad y perfiles/expedientes al esquema 13.
- Interfaz: `ReactionsBar.tsx` y `reactions.module.css`; tarjetas oficial/editorial, ConnectedCommunity, connection/types, API y AdminSettingsPage.
- Continuidad: este documento, PROJECT_STATE, README, AGENTS, plan ampliado y guías de administración/respaldos.

## Repetición aislada

Después de compilar, usar dos consolas separadas:

```powershell
$env:CAI_API_PORT = '3101'
node server/tests/reactions-browser-server.ts
```

```powershell
$env:CAI_API_PORT = '3101'
npm.cmd run preview -- --host ::1 --port 4180 --strictPort
```

La fixture crea cuentas/base nuevas en `.local/tests/reactions-browser-*` y escribe sus metadatos. Ejecutar checkConnectedReactions con admin, fixture por navegador, browserLabel y `http://localhost:4180`. Crear otra fixture para repetir desde cero, sin borrar datos ni debilitar límites. La contraseña de su fuente es exclusivamente ficticia. El recorrido cambia pausa/elecciones y devuelve su historia a revisión; no usarlo con personas reales.

Evidencia excluida de Git: `.local/tests/reactions-api.log`, `reactions-build.log`, `reactions-browser-results.json` y las fixtures. Detener consolas aisladas al terminar.

**Siguiente bloque:** comentarios persistentes y revisión desde el panel, conservando este servicio y el diseño oficial. Luego retos, insignias y vídeos privados de coordinación, según el alcance autorizado. Google/correo reales y alojamiento mantienen su tanda final.

