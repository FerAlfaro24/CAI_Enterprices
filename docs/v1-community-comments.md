# Comentarios conectados y revisión administrativa

**Integrados y comprobados localmente con cuentas ficticias.** Rama `feat/v1-community-comments`, base `edba92f`. Puntos de retorno: `baa078f` (servicio/migración/pruebas) y `9024905` (interfaz/recorrido). Conserva las reacciones conectadas y el diseño oficial de v1.0. Cierra comentarios de la ampliación; Retos, Insignias y vídeos siguen pendientes de conectar.

## Recorrido y decisiones de esta versión

En una historia, **Conversación** abre su detalle con la conversación y el formulario. El alumno comenta con su alias/avatar autorizado, hasta 400 caracteres. **Enviar a revisión** guarda el texto y muestra un recibo; el grupo todavía no lo ve.

**Conversación** contiene solo comentarios aprobados y disponibles para ese grupo. **Mis comentarios** contiene únicamente envíos propios y su estado: En revisión, Publicado, No aprobado o Retirado. El motivo de coordinación es privado. Ambas listas consultan páginas de 20, de más reciente a más antigua, con Ver anteriores. No hay respuestas anidadas ni edición de un comentario ya enviado: tras una indicación se puede preparar otro.

En **Publicaciones → Comentarios**, coordinación filtra estados, abre un comentario, lee historia/grupo/texto y elige una decisión. Debe confirmar la revisión de privacidad. Publicar no requiere motivo; no aprobar, devolver a revisión y retirar sí requieren de 5 a 240 caracteres. El historial privado identifica acción, responsable, fecha y motivo. Resumen ofrece acceso a comentarios pendientes y el contador lateral incluye historias/comentarios por revisar.

Un comentario retirado no se puede volver a publicar. El alumno retira el suyo mediante confirmación, incluso con nuevos envíos pausados; puede cancelar sin cambiarlo. Retirar conserva el registro y no elimina lo ya descargado por otros.

**Configuración → Comentarios de las historias → Recibir nuevos comentarios** activa o pausa el envío general. Inicialmente está pausado. Cada historia tiene además **Recibir comentarios en esta historia**, disponible en su revisión y en la de un comentario. Ambos permisos deben estar activos para nuevos envíos; las pausas no borran conversación ni impiden revisar pendientes/retirar los propios.

La comunidad actualiza su información mediante el mecanismo existente de actualización/sondeo; el servidor aplica inmediatamente sus reglas. No se añadieron correos o notificaciones externas.

## Permisos, datos y conservación

Migración 14 aditiva:

- `community_controls.comments_open`, inicialmente 0.
- `publications.comments_open`, inicialmente 1; revisión al modificarlo.
- `post_comments`: autor/publicación, cuerpo, clave de envío única por autor, estado, motivo privado, revisión y fecha.
- `comment_audit`: historial privado sin duplicar el cuerpo.

Las rutas estudiantiles revalidan sesión después de recibir el cuerpo. Lectura y alta reutilizan `publications.visible`: alumno activo/aprobado, grupo asignado, historia publicada, su autor disponible y audiencia vigente. Otro grupo no consulta conversación o envíos privados por conocer el identificador. Una historia oculta deja de exponer sus comentarios por rutas directas.

El texto y el autor se validan en servidor. El navegador no elige identidad, grupo o estado; se representa texto, sin interpretar HTML. Respuestas públicas contienen solo id, cuerpo, alias/avatar/identificador público del autor y fecha. El feed lleva el contador público; no recibe borradores, motivos ni historial. La retirada ajena e inexistente devuelve el mismo error 404.

Alta con clave de reintento: mismo autor/publicación/texto no duplica; reutilizar la clave con otros datos da conflicto. La interfaz conserva borrador/clave ante fallo y no reintenta automáticamente. Solo limpia el texto después de recibir confirmación.

Decisiones y pausas por historia usan revisiones. Si otra ventana actuó primero o el resultado es incierto, el panel conserva la preparación y bloquea nuevas decisiones hasta **Cargar estado actual**, que descarta decisión/motivo preparados explícitamente. Los controles se bloquean al guardar y no permiten doble envío.

Cambiar de grupo devuelve a revisión los comentarios publicados del alumno, con historial; volver al grupo no los republica. Una corrección protegida que requiere renovar autorización de menor también devuelve sus comentarios publicados a revisión. Las sesiones anteriores se revocan según los servicios existentes. Suspensión o salida de la audiencia excluyen textos públicos; recuperar acceso sin cambios protegidos conserva su estado original, salvo retirada/revisión explícita.

Límites de servidor: 20 intentos de alta por cuenta/hora, 60 retiradas por cuenta/15 minutos y 60 revisiones por administrador/15 minutos, además del control general, origen, JSON/campos y tamaño. Las pruebas preparan datos directamente en su fixture para verificar paginación; no desactivan límites ni añaden endpoints de preparación al producto.

Copias SQLite incluyen comentarios e historial; verificador admite esquemas 9–14. Se comprobó API sobre respaldo separado, sin restaurar sobre la base habitual. **No se abrieron/migraron ni cambiaron las credenciales o base habituales durante esta tarea.** Antes de iniciar el código actualizado sobre un entorno existente, conservar respaldo y versión de código. Retención, autorizaciones y custodia reales se validan con CAI antes de producción.

## Comprobaciones realizadas

| Comprobación | Resultado |
| --- | --- |
| Suite completa de servidor | **163 resultados correctos**, cero fallos/cancelados/omitidos. |
| Comentarios específicos | **16 resultados** incluidos arriba: autorización/validación, privacidad, aprobación, motivos, retirada, pausas, cursores, cambio de grupo/menores, revocación durante cuerpos, límite, copia/reinicio y migración 13→14. |
| Comentarios en Brave / Opera GX | **47 / 47**, completos y repetidos sobre el último código. |
| Regresión de reacciones | **28 / 28**, completas. |
| Regresión de Community/moderación | **39 / 39**, completas. |
| Modelos Community / publicaciones | **29 + cuatro igualdades / 23**, correctos, ejecutados en secuencia. |
| Calidad | Tipos, lint, build, sintaxis del recorrido y espacios correctos; entrada ~239.59 KB sin aviso grande. |
| Inspección visual | Estado propio/formulario en escritorio y 320 px, claro/oscuro, revisión administrativa con texto de 400 caracteres; sin desbordamiento ni errores/advertencias en esa inspección. |

Matriz de **228 comprobaciones de navegador, 114 por navegador**, sin sumar repeticiones ni intentos incompletos. Recorridos a 1440/768/375/320, con cero errores de ejecución JavaScript inesperados. Fallos de red/conflictos provocados deliberadamente son parte de la prueba. No se repitieron los 24 recorridos completos de la revisión anterior; se seleccionaron regresiones pertinentes.

### Incidencias corregidas durante la comprobación

- Regresión inicial de reacciones se detuvo por expectativas de esquema 13; fixtures/expectativas históricas se adaptaron a 14 y la suite completa pasó. Se conservan pruebas de migración desde esquemas anteriores.
- Lint inicial señaló carga de estado desde efectos. Se separaron respuestas asíncronas, control de versiones de lectura y dependencias primitivas, sin desactivar reglas.
- Primeros intentos Brave incompletos: uno tras una comprobación por historia fuera de la primera página del feed; otro tras tres al buscar antes de terminar la recarga. Se corrigió preparación con Ver más historias y espera del snapshot.
- Otro intento se detuvo tras 20 al consultar una etiqueta exacta después de un conflicto. Reproducción corta confirmó motivo conservado/controles bloqueados: el label envolvente incluía el valor del textarea. Se añadieron etiquetas explícitas htmlFor/id, se recompiló y se repitieron recorridos completos.
- Una preparación manual de captura esperaba Ver más historias aunque el registro ya estaba visible; se corrigió para usar el estado real y acotar el texto ficticio a 400 caracteres.

Estos intentos no se cuentan como aprobados. Ninguna aserción o límite se debilitó para completar las pruebas. No se atribuye reparación a las intermitencias antiguas ni a las diez alertas moderadas de herramientas; continúan según sus informes previos.

## Archivos modificados

- Servicio: `server/comments.ts`, `database.ts`, `contracts.ts`, `app.ts`, `administration.ts`, `publications.ts`, `access-repository.ts`, `student-records.ts`, `verify-backup.ts`.
- Pruebas: `server/tests/comments.test.ts`, `comments-browser-server.ts`, `scripts/check-connected-comments.browser.mjs`; adaptación de esquemas/campos públicos en las pruebas históricas de recuperación, seguridad, equipo, galería, publicaciones, reacciones, perfil y expediente.
- Comunidad: `ConnectedComments.tsx`, `CommentItem.tsx`, `connected-comments.module.css`; adaptación de Comments, PostCard, EditorialPostCard, ConnectedCommunity, connection/types y API.
- Administración: `AdminCommentsPanel.tsx`, AdminPostsPage, AdminPage, AdminLayout, AdminSettingsPage, useAdminConnection, PostDialog, aviso del editor de expediente y estilos compartidos.
- Guías/continuidad: este informe, PROJECT_STATE, AGENTS, README, plan ampliado, administración y respaldos.

## Repetición aislada

Después de compilar, dos consolas separadas:

```powershell
$env:CAI_API_PORT = '3101'
node server/tests/comments-browser-server.ts
```

```powershell
$env:CAI_API_PORT = '3101'
npm.cmd run preview -- --host ::1 --port 4180 --strictPort
```

La fixture crea otra base/cuentas ficticias en `.local/tests/comments-browser-*` y escribe sus metadatos. Incluye historias y 23 comentarios ficticios aprobados en otra conversación para probar paginación. Su secreto fijo es solo de prueba. Ejecutar checkConnectedComments con admin, fixture por navegador, browserLabel y `http://localhost:4180`. Crear una fixture nueva para repetir desde cero; no borrar/reinicializar la base habitual.

Evidencia local ignorada: `.local/tests/comments-api.log`, `comments-build.log`, `comments-browser-results.json` y bases de los intentos. Las consolas/contextos propios se detuvieron/cerraron al terminar. Sin nuevas dependencias, merge ni despliegue.

**Siguiente bloque autorizado: Retos con administración, calendario y progreso persistente**, reutilizando las vistas/reglas existentes. Después Insignias y vídeos privados de coordinación. Google/correo reales y alojamiento mantienen su tanda final.

