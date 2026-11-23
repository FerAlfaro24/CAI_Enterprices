# Administración — revisión de uso

**22 de noviembre de 2026.** Entrega en `feat/v1-admin-usability-review`, desde `c3d4d82` de PR #22; código `e255f91`. Alcance autorizado: analizar, probar y mejorar el uso del panel conservando funciones, permisos y datos habituales. Fixtures nuevas, no producción.

## Diagnóstico inicial comprobado

- Nueve secciones revisadas en Brave. Configuración medía 2,858 px de contenido en escritorio y mezclaba controles, grupos, cuenta, ejemplo ficticio y equipo.
- El contador de Logros ya incluía aprendizajes nuevos; la etiqueta del resumen decía «insignias». No reconstruir el conteo existente.
- El detalle genérico de moderación recibía fotos de servidor pero no las mostraba. Revisar solo el texto dejaba la aprobación incompleta.
- Historias de alumnos, comentarios y publicaciones oficiales compartían página sin tres entradas equivalentes. Grupos estaba enterrado en Configuración.
- Búsquedas limitadas a ciertos campos, sin normalizar tildes; alumnos sin filtro de grupo/activación.
- La ficha volcaba acceso, cambio de grupo y corrección de expediente juntos. Preparar acceso cerraba la ficha antes de conocer el resultado.
- «Avisos de acceso» contiene notificaciones de varios tipos; revisión de coordinación no equivale a lectura del alumno.

## Cambios de esta rama

Mesa de trabajo con enlaces a bandejas y creación de aviso/álbum; Configuración por apartados; publicaciones con tres entradas; ficha separada, confirmación de suspensión y conservación ante fallo al preparar acceso; imágenes ampliables en revisión; búsquedas/filtros; logros separados de insignias e historial anterior; galerías con herramientas de carga plegadas; nombres y textos acordes con lo conectado. No cambiar servidor/esquema/permisos ni añadir dependencias.

## Pruebas realmente ejecutadas

- **272 pruebas API correctas**, suite completa `npm.cmd run test:api`, en bases nuevas. Confirman también privacidad, revocación, concurrencia, moderación y recuperación existentes. No hay cambios de servicios productivos ni migraciones nuevas: esquema 20.
- **344 comprobaciones del recorrido administrativo, 172 Brave y 172 Opera GX**, mediante `scripts/check-admin-usability.browser.mjs`, cada ejecución final con fixture nueva. Recorrido real: formulario de acceso, revisión/aprobación/rechazo, tutor, fallo controlado de invitación/reintento, corrección de expediente con reautenticación, suspensión/cancelación/reactivación, creación/asignación/archivo/reactivación de grupo, filtros/correos/tildes/recarga, controles, revisión con fotos, publicación, logros privados y compartidos, comentario, aviso institucional visible al alumno autorizado, foto sintética y retirada, consulta, banco/borrador de pregunta, equipo y cambio de contraseña con cierre de sesión/nuevo acceso.
- La tanda incluye **14 vistas/variaciones × 2 temas × 4 anchuras (1440/768/375/320)** por navegador, navegación real entre secciones, menú, foco y ausencia de errores JS/consola inesperados. 112 de las 172 son comprobaciones de desbordamiento; no presentar todas como tareas distintas.
- **26 comprobaciones dirigidas finales, 13 por navegador**, en `scripts/check-admin-modal-focus.browser.mjs`: Tab/Shift+Tab en visor y confirmación sobre otra ficha, Escape y restitución de foco, bloqueo de fondo, confirmación descartable/limpia al navegar y estado de autorización visible en ficha del menor. Reejecutadas tras el ajuste final; no sumar las tandas previas de 11.
- **Total de interfaz de esta entrega: 370** (344 + 26). No incluye capturas iniciales, intentos fallidos ni matrices de comunidad de entregas anteriores.
- Tipos, ESLint y compilación de producción comprobados; revisión de capturas móviles claras/oscuras y enlaces documentales. Sin nuevas dependencias.

Las pruebas encontraron un filtro de grupo vacío que perdía la opción visible y un cierre de diálogo durante el montaje doble de desarrollo; corregidos. Se conservaron los datos del tutor en la ficha y se comprobó la separación de mensajes de éxito entre páginas.

También se corrigió el verificador: esperar cambios de dirección/filtros, identificar filas por folio, navegar mediante el menú y espaciar peticiones. Una primera matriz automática alcanzó el límite de peticiones; se mantuvo el límite de la aplicación y se ralentizó únicamente QA. La automatización de Opera alteró espacios al introducir contraseñas ficticias; el verificador fija los valores suministrados en el formulario de prueba antes de enviarlo. La aplicación sigue tratando la contraseña literalmente y no recorta espacios para hacer pasar pruebas. Los errores esperados de guardado se aíslan de los errores inesperados.

## Repetir el recorrido

Con el paquete oficial privado instalado como indica OFFICIAL_MEDIA, iniciar una base nueva para cada navegador:

```powershell
node server/tests/community-showcase-server.ts 4234 3244 --no-latest --admin-qa
```

El lanzador indica una carpeta nueva dentro de `.local/tests`, con `presentation.json` y `admin-qa.json` ignorados. El segundo aporta URL, IDs ficticios y ruta a una imagen sintética para `checkAdminUsability(browser,{...config,browserLabel})`. El recorrido cambia contraseñas y estados **solo de esa fixture**: nunca reutilizar una instalación habitual ni presentar una fixture consumida como muestra limpia. Los comprobadores dirigidos usan las mismas fixtures ya completadas, con su nueva contraseña ficticia, sin rehacer la matriz.

`server/tests/admin-usability-fixture.ts` prepara solicitudes adultas/menor, cuenta pendiente/suspendida, historia y comentario pendientes, logro privado/compartido con foto y consulta. No simula envío de correo ni carga datos de usuarios reales. La bandera es opcional y no modifica el arranque habitual. La muestra para revisión humana se crea aparte, sin ejecutar el verificador ni cambiar sus contraseñas. La referencia local vigente se conserva en `.local/tests/admin-preview-current.json`, ignorada; comprobar proceso y renderizado antes de afirmar que sigue abierta.

## Archivos y decisiones

- `AdminPage`: mesa de trabajo y accesos a creación de CAI, grupos y consultas. Los contadores existentes se reutilizan; no son tareas exclusivas (un logro compartido puede aparecer también entre historias).
- `AdminSettingsPage`, `CatalogSettings`: Participación/Grupos/Equipo/Mi seguridad, grupos buscables con estado y enlace al directorio. Reglas protegidas informativas; sin interruptor falso de fotos pendientes ni vista previa editorial mezclada con seguridad.
- `AdminRequestsPage`, `AdminStudentsPage`, `search.ts`: búsquedas normalizadas; directorio por grupo/activación, estado y programa, filtros en URL y vacíos recuperables.
- `StudentDialog`, `LocalRequestDialog`, `ContactInbox`, `useAdminModal`, `useAdminConnection`: ficha dividida, acceso conservado ante fallo, suspensión confirmada, cierre/foco/scroll y mensajes coherentes.
- `AdminPostsPage`, `posts`, `AdminReviewPhotos`: Historias de alumnos/Comentarios/Equipo CAI; fotografías autorizadas visibles y ampliables antes de moderar.
- `AdminBadgesPage`, `LearningReviews`: prácticas actuales separadas de concesiones y solicitudes históricas; revisión guiada plegable, con imágenes. Las nuevas insignias siguen obteniéndose automáticamente, no solicitándose.
- `AdminGalleryPage`, `AdminInboxPage`, `LocalNotices`, `AdminLayout` y CSS: cargas plegadas, registro de notificaciones correctamente nombrado, confirmaciones descartables, cabecera/acciones de ficha accesibles en móvil. La franja local solo aparece en desarrollo; no convertir el panel productivo en una pantalla de prototipo.
- Guía operativa actualizada y entradas de continuidad sincronizadas. Nunca incluir fotos privadas, capturas, bases o accesos reales en el repositorio.

## Cierre y límites

Cerrada la revisión técnica autónoma de esta pasada. **Pendiente la aceptación de una persona de coordinación real**, que debe completar las tareas de ingreso, activación, cambio de grupo, revisión con imágenes, aviso y recuperación con su contenido autorizado. Los ensayos automáticos no sustituyen esa sesión, ni comprueban Google/correo reales o infraestructura desde internet. No se ejecutó una prueba de carga de usuarios concurrentes ni se repitió la matriz visual completa de comunidad. N3 y dependencias externas siguen en NEXT_STEPS; no recrear el panel.

Se conservaron las reglas y mecanismos existentes. No se añadieron roles limitados: los administradores siguen teniendo acceso completo. No se fusionó ninguna PR, movió `main`/`release`, publicó Vercel/Cloudflare o migró una base habitual. La muestra de revisión y los datos consumidos por QA son distintos.
