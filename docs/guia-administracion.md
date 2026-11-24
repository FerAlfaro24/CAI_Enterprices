# Guía sencilla de administración de CAI

**Actualización vigente F5 — 24-11:** continuación `feat/v1-daily-challenges-refresh`, código `258abfb`/PR #34. Los alumnos ven las tres actividades comunes de inglés, cuándo se renuevan, sus puntos diarios/acumulados y cada acierto/error. Pueden repasar errores sin volver a puntuar. **Retos de inglés → Calendario/Banco** y la pausa administrativa conservan su funcionamiento; pausar no borra el progreso ni el cuaderno. Se mantiene inglés para toda la comunidad, también si la inscripción dice Francés/Español. Top/ranking pendiente del cliente. [Entrega y pruebas](NEXT_STEPS.md#entrega-f5-retos-diarios-y-progreso-personal--24-11-2026). La demo anterior todavía no contiene esta versión.

**Actualización vigente F3b/F4 — 24-11:** rama `feat/v1-publisher-notice-carousel`, código `5b6d31c`, [PR #32](https://github.com/FerAlfaro24/CAI_Enterprices/pull/32). Las notas siguientes de F3a y revisiones anteriores conservan su fecha; esta actualización define el recorrido actual.

## Publicar, avisar y moderar ahora

- **Crear publicación** está en el menú principal. Elige **Publicación normal** para experiencias/fotos o **Aviso de CAI** para información importante. Escribe título/texto, añade imágenes opcionales, revisa los permisos y confirma. Las publicaciones nuevas son para todos los alumnos aprobados; las fotos históricas privadas no se amplían al seleccionar otras imágenes.
- Las fotos de una publicación normal también están en Galería, con la misma conversación. Los avisos tienen su propio carrusel en Inicio, empezando por el más reciente y pasando cada 5 segundos. No necesitas marcar Destacar en Inicio. Puedes pausar; con un solo aviso no hay avance y sin avisos se oculta el carrusel.
- En **Publicaciones**, filtra por estado y autor para ver alumnos o Equipo CAI. Una tarjeta publicada ofrece **Eliminar**: escribe un motivo privado y confirma. **Eliminadas de la comunidad** conserva el registro; ya no aparece para alumnos ni se restaura automáticamente. Los logros privados validados y las insignias no se borran.
- Los alumnos **comentan al enviar**, sin aprobación previa, y pueden **Eliminar mi comentario** desde la conversación. La antigua cola de comentarios ya no aparece. Usa **Ver comunidad → Ver comentarios → Moderar comentario** para eliminar contenido o aplicar una suspensión, como se explica abajo. Los antiguos rechazados, retirados o retenidos no se republican.
- Los Logros de alumnos tienen nombre, aprendizaje, palabras/frases opcionales e imágenes. Los campos pueden estar vacíos si son opcionales. Se revisa lo enviado para publicar o para validación privada; guardarlo por su cuenta no lo hace público. El motivo de una revisión permanece privado.

[Entrega, pruebas y límites](NEXT_STEPS.md#entrega-f3b-y-f4-logros-comentarios-y-publicador--24-11-2026). El código probado todavía no se adoptó en la demo anterior ni en una instalación real.

**Actualización vigente F3a — 24-11:** rama `feat/v1-community-moderation`. Abre **Ver comunidad** en el menú: allí puedes leer las publicaciones, ampliar fotografías y abrir sus comentarios. [Estado y pruebas](NEXT_STEPS.md#entrega-f3a-moderación-y-suspensiones--24-11-2026). Las notas anteriores describen sus entregas, no sustituyen esta actualización.

## Moderar la convivencia

1. En **Ver comunidad → Publicaciones**, abre **Ver comentarios** y selecciona **Moderar comentario** junto al autor.
2. Elige **Eliminar este comentario**, **Suspender el acceso**, o ambas medidas. Eliminar por sí solo permite al alumno seguir entrando.
3. Si suspendes, elige1,3,7 o30 días, o **Permanente**. Escribe el motivo, revisa la confirmación y guarda. Se cierran sus sesiones y cancelan sus enlaces de activación/recuperación. La suspensión impide entrar a toda la comunidad.
4. Para revisar o terminar una medida, abre **Suspensiones activas → Levantar suspensión**, escribe el motivo y confirma. **Historial** conserva lo ocurrido y muestra si está activa, finalizada o levantada por coordinación.

Al vencer una suspensión temporal, el alumno puede iniciar sesión otra vez si su inscripción está activa. Una suspensión manual en **Alumnos** se gestiona allí por separado. Los comentarios eliminados no regresan. Las publicaciones anteriores del alumno permanecen; esta medida bloquea su acceso, no borra todo su contenido. Si un enlace de activación quedó cancelado, prepara otro después de levantar la medida.

En la entrega histórica F3a los comentarios todavía pasaban por revisión. F3b ya quitó ese paso; usa el recorrido vigente del inicio. La pantalla no se actualiza en la demo anterior hasta adoptar expresamente esta versión.

**Actualización F1b/F2 — 23-11:** Registro nuevo: revisar la Clase y los datos, aprobar y preparar el acceso; el menor no necesita el paso de tutor. La matrícula corresponde al folio automático. Grupos/tutores mostrados en expedientes anteriores son historial. Cambiar una clase conserva la comunidad compartida y exige volver a entrar. Retos usa calendario común; comentarios continúan en revisión hasta F3. [Detalle vigente](NEXT_STEPS.md#entrega-f1b-y-f2-registro-y-comunidad-compartida--23-11-2026).


**Actualizada el 22 de noviembre de 2026.** Corresponde a `feat/v1-admin-usability-review`. Las tareas guardan información en la instalación abierta. La muestra de revisión usa cuentas ficticias y una base separada. Alojamiento, entrega de correo y validación con coordinación real siguen pendientes. [Estado](PROJECT_STATE.md) · [Revisión de uso](ADMIN_USABILITY_REVIEW.md).

## Dónde encontrar cada tarea

| Necesito… | Abro… |
| --- | --- |
| Leer la comunidad y moderar un comentario | Ver comunidad → Publicaciones → Ver comentarios |
| Revisar o levantar suspensiones | Ver comunidad → Suspensiones activas / Historial |
| Crear una publicación o aviso | Crear publicación |
| Eliminar contenido ya publicado | Publicaciones → Publicadas → Eliminar |
| Empezar por lo pendiente | Resumen → Tu mesa de trabajo |
| Revisar el ingreso de una persona | Solicitudes de ingreso → Revisar solicitud |
| Preparar el acceso | Alumnos → Ficha → Resumen y acceso |
| Cambiar de programa/grupo | Alumnos → Ficha → Programa y grupo |
| Corregir nombre, nacimiento, matrícula o tutor | Alumnos → Ficha → Expediente privado |
| Suspender/reactivar a alguien | Alumnos → Ficha → botón inferior |
| Aprobar/rechazar historias | Publicaciones → Historias de alumnos |
| Revisar comentarios | Publicaciones → Comentarios |
| Crear un aviso, historia o álbum oficial | Publicaciones → Equipo CAI · Publicar |
| Gestionar fotografías y permisos | Galería privada |
| Validar un aprendizaje | Logros e insignias → Logros por revisar |
| Consultar insignias obtenidas | Logros e insignias → Insignias obtenidas |
| Consultar solicitudes antiguas de insignia | Logros e insignias → Solicitudes anteriores |
| Revisar/programar preguntas | Retos de inglés → Calendario / Banco de preguntas |
| Atender interesados | Mensajes y avisos → Consultas de contacto |
| Consultar notificaciones enviadas a cuentas | Mensajes y avisos → Registro de notificaciones |
| Crear/archivar/reactivar grupos | Configuración → Grupos |
| Pausar solicitudes, publicaciones, comentarios o reacciones | Configuración → Participación |
| Gestionar administradores | Configuración → Equipo |
| Cambiar mi contraseña | Configuración → Mi seguridad |

Entrar por **Acceso de administración**. La cuenta de alumno no abre el panel. Cada administrador tiene su cuenta; al terminar, usar **Cerrar sesión**.

## Rutina diaria

Abrir Resumen. En **Tu mesa de trabajo**, los cuatro contadores llevan a solicitudes, historias, comentarios y logros/solicitudes anteriores. Pueden solaparse: un logro que solicita publicación también es una historia en revisión. No sumar los contadores como personas o tareas exclusivas. Guardar una decisión actualiza el resumen; **Actualizar datos** vuelve a consultar el servidor.

Los accesos inferiores permiten crear contenido oficial, gestionar grupos o atender consultas. Los gráficos quedan como información de apoyo, debajo de las tareas.

## Revisar ingreso y preparar acceso

En Solicitudes buscar por nombre, correo, grupo, programa, matrícula o folio. La búsqueda admite nombres sin tildes. Elegir estado y abrir la solicitud correcta; comprobar datos e inscripción antes de aprobar. Aprobar incorpora al directorio. Rechazar conserva la decisión. Cerrar sin decidir mantiene el estado.

Un menor requiere autorización del tutor **registrada por coordinación**. Revisar el contacto, escribir una referencia de la autorización comprobada y confirmarla; solo entonces puede aprobarse. La declaración de edad o una casilla del registro no verifica identidad por sí sola.

Para acceso por contraseña: Alumnos → Ficha → **Resumen y acceso** → **Preparar acceso**. Entregar el enlace privado al destinatario correcto. No se envía correo automáticamente. Preparar otro invalida el anterior. Si falla, la ficha conserva el contexto para reintentar. El acceso Google requiere la configuración real todavía pendiente.

**Devolver a pendientes** una solicitud aprobada bloquea el acceso e invalida sesiones/enlaces hasta que vuelva a aprobarse. No utilizarlo para cambiar un horario: usar Programa y grupo.

## Alumnos: encontrar y gestionar

El directorio filtra estado, programa, grupo y activación; busca también por correo. Los filtros quedan en la dirección al recargar. **Quitar filtros** recupera la vista inicial de activos. Desde Configuración → Grupos → **Ver alumnos de este grupo** se abre el directorio ya filtrado, incluso si todavía está vacío.

En la ficha:

- **Resumen y acceso:** estado, cuenta y siguiente paso de activación.
- **Programa y grupo:** cambiar asignación y confirmar efectos. El alumno deberá volver a entrar; sus historias conservan el grupo original y las publicadas vuelven a revisión.
- **Expediente privado:** corregir los datos necesarios, indicar motivo, contraseña administrativa y confirmación. El historial permanece privado; la operación cierra sesiones del alumno. Correo e identidad Google se conservan.

**Suspender acceso** abre una confirmación antes de guardar. Suspender cierra el acceso, conserva datos y permite reactivar desde la ficha. Reactivar no restaura enlaces viejos. Usar **Cancelar** si solo se quería consultar la ficha.

## Moderar historias y comentarios

**Historias de alumnos:** filtrar estado/tipo, buscar texto o autor y abrir Revisar. Leer texto y fotografías; **Ampliar** permite comprobarlas completas. Confirmar contenido y privacidad antes de publicar. Para rechazar, elegir un motivo; lo consulta el autor y coordinación. Una historia aprobada conserva su audiencia autorizada. Devolver a revisión la oculta; una retirada definitiva no se republica desde esta bandeja.

**Comentarios:** comprobar autor, historia y disponibilidad antes de decidir. El motivo de no aprobación es privado. Pausar comentarios de una historia desde su revisión conserva los existentes. Para recibir nuevos comentarios deben estar abiertos el permiso general de Participación y el de esa historia.

## Publicar como Equipo CAI

En **Equipo CAI · Publicar**, abrir **Crear publicación de CAI** y elegir historia, aviso o álbum. Escribir título/texto y destinatarios: todos los alumnos aprobados o un grupo. Se admiten hasta doce fotos JPEG/PNG de 3 MB, con descripción accesible y referencia de autorización. Un álbum requiere imágenes. Los borradores/cargas no son un banco público.

**Guardar también las fotos en Galería** permite encontrarlas allí sin duplicar la conversación. **Destacar en Inicio** incorpora el contenido al carrusel; la fecha de finalización es opcional. Revisar permisos y audiencia, confirmar y publicar. Un nuevo aviso institucional notifica a alumnos activos de su audiencia; una historia/álbum común no envía ese aviso general.

**Publicaciones de coordinación** conserva estado, audiencia, destacados y retirada. Retirar oculta el contenido de Inicio/Galería/destacados. Las publicaciones de alumnos se moderan en su propia pestaña.

## Galería

Gestionar fotos ya publicadas, borradores o retiradas. Una foto muestra su audiencia y referencia interna. Retirar requiere confirmar; cancelar la conserva. Las herramientas **Cargar el paquete de fotos oficiales** y **Agregar una fotografía solo a Galería** están plegadas para no estorbar la lista.

El paquete privado contiene las seis fotos oficiales autorizadas para todos los aprobados. Cargarlo de nuevo no duplica ni restaura retiradas. No está en GitHub: seguir [OFFICIAL_MEDIA](OFFICIAL_MEDIA.md). Para un álbum con historia y conversación, usar Equipo CAI · Publicar.

## Logros e insignias

En **Logros por revisar**, abrir **Revisar logro y decidir**. Comprobar práctica, expresión, ejemplo e imágenes. Escribir una indicación privada y confirmar la revisión. **Validar en privado** no publica nada; **Validar y publicar** solo aparece si el alumno solicitó compartir. **Pedir un ajuste** permite explicar qué reforzar.

Las **21 insignias** se obtienen por requisitos progresivos; las nuevas no se solicitan. **Insignias obtenidas** conserva concesiones e historial. Los reconocimientos especiales de CAI tienen su formulario separado y motivo privado; no sustituyen los requisitos de progreso. **Solicitudes anteriores** conserva las nueve categorías del modelo anterior y sus revisiones históricas.

Un logro compartido puede revisarse también como historia en Publicaciones, incluidas sus fotos. Su estado se sincroniza en servidor; no se necesita aprobarlo en ambos sitios.

## Retos

El calendario prepara tres preguntas diarias automáticamente, por grupo y fecha de Ciudad de México. No hay que cargarlas cada día. El banco inicial tiene 180 preguntas y 45 temas.

Calendario permite revisar cada pregunta/solución, cambiarla por otra disponible o pausarla. Si ya hay respuestas, no cambiar el contenido de ese reto: programar otro día. Pausar conserva resultados y repaso.

Banco permite buscar/filtrar, revisar/editar o crear pregunta. **Borrador** queda en administración; **Lista** entra en rotaciones nuevas; **Archivada** conserva historial. Guardar una pregunta no modifica el contenido ya fijado en calendarios existentes.

Cada intento suma cinco puntos; acertar suma diez más. Tres respuestas cuentan como día de constancia aunque haya errores. No es una calificación ni un ranking público.

## Consultas y registro de notificaciones

En Consultas, abrir **Atender**, elegir Nueva/En seguimiento/Atendida y guardar una nota interna. Esto no responde un correo ni reserva clases.

**Registro de notificaciones** muestra mensajes de las cuentas: revisiones, insignias, avisos o acceso. **Marcar revisado** indica seguimiento de coordinación y es independiente de que el alumno lo haya leído. El borrado del historial por el alumno no borra este registro administrativo. Los enlaces de recuperación requieren comprobar el destinatario; no se envían automáticamente por correo.

## Configuración, equipo y seguridad

- **Participación:** activar/pausar solicitudes, publicaciones, reacciones y comentarios. Las pausas conservan contenido, cuentas e historial. Privacidad de menores y premoderación son reglas protegidas; no son interruptores ficticios.
- **Grupos:** crear un programa/horario o archivar/reactivar uno existente. Archivar impide nuevas selecciones; no suspende alumnos ni elimina sus historias. Para otra audiencia, crear grupo y reasignar desde la ficha.
- **Equipo:** agregar una cuenta pendiente, preparar enlace privado o desactivar/reactivar otra cuenta. Requiere contraseña y confirmación. Todas las cuentas administrativas tienen acceso completo. No se puede desactivar la propia ni dejar el sistema sin un administrador activo y activado.
- **Mi seguridad:** cambiar solo la contraseña propia. Las confirmaciones deben coincidir. Guardar cierra todas las sesiones de esa cuenta; volver a entrar con la nueva contraseña. Para una contraseña olvidada, usar **Olvidé mi contraseña** desde el acceso administrativo y el procedimiento de recuperación local existente.

## Si algo falla o cambia en otra ventana

Leer el mensaje antes de repetir. Una decisión no confirmada no debe darse por guardada; recargar el estado cuando se indique. Las correcciones de expediente, equipo y publicaciones usan revisión para evitar sobrescribir cambios ajenos. Conservar el borrador cuando el formulario lo permita; nunca incluir contraseñas o enlaces privados en documentos públicos.

La validación con una persona de coordinación real sigue pendiente: probar ingreso, activación, cambio de grupo, moderación con fotos, aviso y recuperación. Las comprobaciones automáticas de [ADMIN_USABILITY_REVIEW](ADMIN_USABILITY_REVIEW.md) no sustituyen esa sesión ni un despliegue desde internet.
