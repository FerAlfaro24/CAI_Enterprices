# Comunidad — fotos, resultados y notificaciones

**22 de noviembre de 2026.** Rama `feat/v1-photo-viewer-notification-history`, base `fb28061` de PR #21; código `bb7b8f6`. Entrega acumulativa: conserva el cierre visual y las funciones previas. No mueve `main`/`release`, fusiona PR, modifica datos habituales ni publica infraestructura.

## Lo solicitado y lo implementado

| Observación | Resultado |
| --- | --- |
| Las imágenes de una publicación se recortaban y no podían ampliarse | La vista de publicación usa `contain`. Tocar la fotografía o **Ampliar** abre un visor completo, con Anterior/Siguiente, contador y flechas de teclado. Escape/cerrar vuelve a la misma imagen de la publicación y devuelve el foco. |
| Todas las actividades completadas aparecían verdes | Acierto verde/✓, error rojo/×, pendientes numeradas. Se anuncia el resultado con nombre accesible. Tres respondidas siguen contando 3/3; acertar y participar mantienen sus puntos existentes. |
| Lectura manual de todas las notificaciones | La bandeja abre en **Sin leer**. Las normales vistas siguen ahí durante esa apertura y pasan a **Historial** al cerrar con X/Escape. Cambiar de pestaña no las marca antes de cerrar. |
| Importantes necesitan confirmación | **Marcar leído** solo para importantes. Permanecen Sin leer al cerrar; al confirmar pasan al historial. Nuevos avisos de CAI, revisiones de publicaciones/logros/comentarios y cambios de acceso/inscripción se consideran importantes. Ganar una insignia es una novedad normal. |
| El historial se acumulaba | Cada elemento leído tiene X; **Vaciar historial** muestra advertencia y confirmación. Cancelar/Escape conserva los elementos. Solo se quitan los IDs leídos seleccionados al abrir la confirmación; novedades posteriores se conservan. |

El visor usa las rutas privadas existentes: no crea copias públicas, nuevas descargas o permisos de pantalla completa. Contiene el foco, bloquea el fondo y funciona con los diálogos de publicación existentes. Las fotos oficiales siguen fuera de Git.

## Servidor y persistencia

Migración **20** aditiva sobre `local_notices`: `important` y `student_dismissed_at`, más índice de bandeja. Clasifica avisos previos por tipo/asunto reconocido sin cambiar IDs, lecturas ni revisiones administrativas. No genera avisos retroactivos por todas las publicaciones históricas. El preflight productivo exige historia 1–20 y continúa sin migrar al arrancar. El verificador de copias reconoce 9–20.

- `GET /api/local/student/notices`: solo avisos propios no descartados, con `important` calculado por servidor.
- `POST /api/local/student/notices/archive-viewed`, `{ids}`: lectura de normales, sin poder confirmar importantes por manipulación del cliente.
- `POST /api/local/student/notices/dismiss-history`, `{ids,confirmed:true}`: descarte solo del historial propio. Un lote con aviso ajeno o sin leer falla sin modificarlo parcialmente.
- `POST /api/local/student/notices/:id/seen`: confirmación individual conservada.

IDs únicos, positivos y seguros, máximo 500 por petición; el cliente divide bandejas mayores en lotes. Sesión, origen, revocación tras cuerpo asíncrono y límites de petición conservados. Reintentos idempotentes. El borrado del alumno **no borra filas, revisión administrativa ni historial de coordinación**.

Publicar un aviso institucional nuevo genera notificaciones importantes dentro de la misma transacción, para alumnos aprobados/activos de su audiencia. Reintentar la creación no duplica avisos. Comunidad incluye aprobados sin grupo; grupo exige coincidencia. Historias/álbumes no generan avisos generales. El mensaje privado no copia título/texto restringido: invita a consultar los avisos actualmente autorizados en Inicio, incluso si después cambia el grupo o se retira el aviso.

Si guardar la lectura al cerrar falla, la bandeja permanece abierta con error y permite reintentar. Recargar/cerrar el navegador o perder la sesión no simula una confirmación: pueden quedar avisos normales sin leer. Si una bandeja de más de 500 se interrumpe entre lotes, los lotes ya confirmados persisten y el resto puede reintentarse. Las notificaciones nuevas que lleguen mientras solo se muestra Historial no se archivan sin haber pasado por Sin leer.

## Archivos principales

Interfaz: `PostMedia`, `StockImage`, `PhotoViewer`, `DailyMission`, `NotificationsDialog`, `StudentNotices`, estilos de comunidad/Retos y conexión/API existentes. Servidor: `notice-history-migration.ts`, `notices.ts`, `shared/notice-policy.ts`, rutas, publicaciones institucionales/revisiones y controles de esquema/copia. Las pruebas de migraciones anteriores ahora deshacen también la migración 20 al construir fixtures legadas; no se eliminan sus comprobaciones.

## Evidencia realmente ejecutada

- **272 pruebas API correctas**, suite completa `npm.cmd run test:api`. Incluye 10 subcasos nuevos y su contenedor en `server/tests/notice-history.test.ts`: prioridad/consulta sin lectura, autorización/origen/validación y atomicidad, lectura de normales, descarte de importantes solo tras confirmación, instantánea de historial, audiencia/idempotencia de avisos, revisiones, reinicio/copia y migración 19→20 preservando registros.
- **144 comprobaciones UI correctas: 72 Brave y 72 Opera GX**, contextos aislados y una fixture nueva por ejecución final. `scripts/check-community-feedback.browser.mjs`: visor de tres fotos y teclado/foco, abrir/cambiar/cerrar notificaciones, fallo HTTP 503 controlado y reintento, descarte/confirmación/cancelación, respuestas reales acierto/error/acierto con 35 puntos, persistencia tras recargar, móvil/escritorio 1440/768/375/320 y claro/oscuro. Movimiento reducido; sin errores de JS ni consola inesperados.
- `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build` y revisión de espacios del diff.
- Revisión visual de capturas locales de visor, misión e historial en móvil. Capturas y datos ignorados, sin subir fotos privadas.

Los primeros intentos detectaron expectativas antiguas de esquema en pruebas y dos supuestos incorrectos del comprobador UI (cuatro opciones fijas y Retos abierto tras recargar); se corrigieron y las tandas finales usaron fixtures nuevas. También se corrigieron centrado y botón de cerrar de 44 px del visor tras detectar el defecto real. No se suman intentos fallidos ni resultados históricos. No se repitió la matriz completa de 454 del acabado anterior: la tanda nueva se centra en lo modificado.

## Repetir las pruebas de pantalla

Con el paquete privado oficial ya instalado fuera de Git, iniciar una fixture nueva:

```powershell
node server/tests/community-showcase-server.ts 4230 3240 --no-latest --feedback-qa
```

La carpeta nueva indicada por el lanzador contiene `presentation.json` y `feedback-qa.json` ignorados. Este último aporta `baseURL`, `filesDir`, `ordinary`, `history` y las respuestas de prueba `answers`; la bandera de QA añade únicamente datos sintéticos a esa fixture nueva. Importar `checkCommunityFeedback` en el entorno Playwright, pasar el navegador aislado y esa configuración con `browserLabel`. Usar otra fixture/puertos para el segundo navegador. No reutilizar una fixture ya consumida ni ejecutar la bandera sobre una instalación real. La respuesta incorrecta se calcula según el número real de opciones.

La muestra limpia de revisión usa otra base sin la bandera QA, separada de las cuentas consumidas por las pruebas. Verificar puerto/proceso/render antes de afirmar que está disponible; las URLs localhost no son alojamiento permanente. Pendiente aceptación humana y luego N3, según NEXT_STEPS. No se desplegó Vercel/Cloudflare ni migró ninguna base habitual.
