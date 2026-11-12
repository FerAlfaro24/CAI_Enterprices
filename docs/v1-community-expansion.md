# Comunidad ampliada: alcance y plan de mejora

**Nuevo alcance autorizado por el usuario:** incluir comentarios, reacciones, retos, insignias y vídeos en la entrega final, mejorando su claridad visual y facilidad de uso. **Vídeos: solo coordinación sube; el grupo autorizado puede verlos**, confirmado por el usuario. La inclusión de estos módulos ya no está pendiente de permiso.

Rama de análisis `docs/v1-community-expansion`, base `fee87d1` de `chore/v1-final-review`. No modifica la aplicación ni migra bases. La revisión anterior conserva su validez para el código y alcance que probó; sus porcentajes y “pendientes de alcance” no describen esta ampliación.

## Inventario contrastado con código

| Área | Lo que existe | Qué falta realmente | Reutilizar |
| --- | --- | --- | --- |
| Reacciones | Cinco opciones, selección propia, contadores y selector de demo. En modo conectado se ocultan. | Guardado por cuenta/publicación, API y permisos por grupo, cambios/reintentos, ajustes administrativos y presentación conectada. | EditorialPostCard, PostCard, reactionOptions y modelo de Community. |
| Comentarios | Lista/formulario en demo, límite de 400 caracteres, detalle de publicación y vista previa. Usa personajes ficticios. | Identidad autenticada, persistencia, permisos, moderación/retirada y paginación; respuestas de error y borrador conservado. | Comments, CommentItem, PostDetailDialog y avisos/revisiones existentes. |
| Retos | Vista completa, pregunta/opciones, explicación, puntos, constancia y recompensas. Cinco días ficticios y estado en memoria. CommunityWorkspace conectado muestra un marcador provisional. | Gestión por coordinación, calendario real, respuestas validadas por servidor y progreso de cada cuenta persistente. | ChallengesView, ChallengeQuestionPanel, useChallengeAnswer, progress y resúmenes de Inicio. |
| Insignias | Arte SVG, catálogo, colección, solicitudes privadas, revisión demo, historial y compartición voluntaria. El modo conectado muestra un marcador provisional. | Catálogo/reglas persistentes, concesión única por alumno, revisión desde el panel real e integración con retos/publicaciones. | AchievementsView, BadgeCollection, BadgeArtwork, formularios/historial/modelo existentes y Composer. |
| Vídeos | Galería privada conectada para JPEG/PNG y PostMedia de fotografías. | Subida y validación de vídeo, almacenamiento privado, reproducción autorizada, entrega parcial, retirada, cuotas y copias. No hay servicio de vídeo. | Identidad visual, selección de grupo, permisos/referencias, galería y patrón de historial existentes; no tratar vídeo como si fuera JPEG. |
| Administración | Panel oficial con Publicaciones, Galería privada, Configuración, equipo y revisiones. Comentarios/reacciones aparecen pendientes y desactivados. | Acciones simples para estos módulos y pendientes visibles; controles que se apliquen en servidor. | AdminLayout y secciones originales, sin crear otro dashboard. |

La base acumulada revisada llega al esquema 12. No hay tablas de comentarios/reacciones, retos educativos/intentados, concesiones/solicitudes de insignias o vídeos. `google_challenges` corresponde a autenticación y **no** a retos educativos. Las funciones avanzadas de Community visual están en la base oficial y sus componentes actuales. Se consultó el inventario de ramas conocidas; no se realizó otra auditoría exhaustiva de todos sus árboles ni una actualización remota en esta sesión.

No se confundirá “hay un botón/componente” con “integrado”. No basta con retirar las condiciones que ocultan estas vistas: sus identidades, fechas, respuestas y reglas siguen siendo de demostración.

## Diseño de uso propuesto

Conservar logos, colores, Figtree, temas, navegación y componentes de v1.0. Cambiar jerarquía, textos y recorridos donde ayude a comprender la tarea; no diseñar otra identidad.

- **Inicio:** leer, reaccionar o abrir conversación desde la misma historia. Mostrar claramente la reacción propia y el resultado de guardar; no depender de pasar el ratón.
- **Comentarios:** una conversación sencilla por publicación, sin respuestas anidadas inicialmente. Diferenciar pendiente/visible/retirado. Identidad visible autorizada, nunca nombre legal/correo del expediente.
- **Retos:** explicar qué hacer hoy, una acción principal “Comprobar respuesta”, resultado con explicación y acceso al progreso. Retirar selector de días ficticios y controles de rol en el modo conectado.
- **Mis logros:** distinguir “Conseguida”, “En progreso” y “En revisión”; mostrar qué hacer para obtener cada insignia. Compartir un logro siempre voluntariamente.
- **Vídeos:** dentro del área de medios/galería, con título, descripción, grupo y controles de reproducción claros, sin reproducción automática. La colocación exacta se contrastará con el diseño existente antes de implementarla.
- **Coordinación:** ver pendientes, revisar y decidir desde el panel existente. Crear un reto o subir un vídeo mediante un formulario corto con vista previa; evitar pantallas llenas de ajustes técnicos.

Son propuestas de implementación dentro del alcance autorizado, no interfaces ya comprobadas ni nuevas reglas de negocio confirmadas por CAI. Si un prototipo demuestra que un recorrido no se entiende, corregirlo antes de ampliar su lógica.

## Orden de trabajo y cierre por módulo

### 1. Reacciones y comentarios

Ramas acumulativas propuestas `feat/v1-community-reactions` y `feat/v1-community-comments`, partiendo del último avance aprobado/comprobado, no de main.

- Reacción elegida por cuenta y publicación; reemplazar o retirar explícitamente, sin acumular votos por doble clic ni depender de alternar ciegamente en un reintento.
- Contadores obtenidos del servicio, persistentes después de recarga/reinicio y coherentes entre listado/detalle.
- Comentarios con alias/avatar autorizados, validación, límites y carga por páginas; conservar borrador si falla el envío.
- Recomendación inicial: comentario enviado a revisión antes de ser visible al grupo. Autor ve su estado; coordinación aprueba, rechaza con indicación o retira. Es una decisión de producto propuesta, no una función ya habilitada.
- El autor puede retirar su comentario; coordinación puede cerrar interacción de una historia y pausar nuevos envíos. Evitar que retirar una publicación deje visibles sus conversaciones por otra ruta.
- Aislamiento por grupo/publicación vigente, suspensión y cambios de grupo/expediente; revalidar sesión tras tareas asíncronas, origen/tamaño/campos y límites. No enviar listas de correos ni expedientes al navegador.
- Reutilizar moderación y revisiones sin añadir un rol ficticio de moderador en la comunidad conectada.

**Cierre:** alumno A interactúa, alumno B autorizado ve lo aprobado y otro grupo no; retirada/suspensión bloquean nuevas consultas; recarga/reinicio y reintentos conservan un solo resultado; coordinación modera desde su panel; controles reales, teclado/móvil y errores comprobados.

### 2. Retos conectados y administración sencilla

Rama propuesta `feat/v1-community-challenges`, después del último bloque integrado.

- Coordinación prepara pregunta, opciones, respuesta correcta, explicación, grupo y fecha de publicación. Borrador → publicado → archivado, con vista previa.
- Conservar formato de opción múltiple existente para esta primera versión; no ampliar a exámenes, preguntas abiertas calificadas por IA o gestión escolar.
- Calendario/fechas y ventana de participación definidos por servidor; establecer y mostrar la zona horaria del centro. No usar cinco días ficticios ni permitir que cambiar el reloj del alumno cambie sus puntos.
- No entregar la respuesta correcta o explicación protegida antes de responder. Validar intento y conceder puntos en servidor; una participación por cuenta/reto y reintento seguro.
- Progreso/constancia basados en participaciones guardadas. Resumen de Inicio y Retos deben consultar la misma información.
- Conservar el contenido/versionado que respondió cada alumno; una edición posterior no debe cambiar retroactivamente sus resultados.
- Valores de puntuación y constancia actuales son antecedentes de demo; proponer continuidad y dejar reglas visibles. No introducir clasificación pública de alumnos por defecto.

**Cierre:** publicar para un grupo, responder desde dos cuentas sin compartir progreso, rechazar duplicados/respuestas anticipadas y cambios de reloj, conservar explicación/historial, y comprobar administración y móvil.

### 3. Insignias y reconocimientos

Rama propuesta `feat/v1-community-badges`, conectada al progreso del bloque anterior.

- Reutilizar catálogo y arte existentes; separar las automáticas por participación de las concedidas por coordinación.
- Registrar concesión única y fecha real; evitar dobles premios al actualizar, reintentar o recalcular.
- Solicitud privada con estado/motivo/historial y revisión en el panel original; nunca copiar la declaración privada a una historia pública.
- Mostrar condición/progreso/estado y siguiente acción en lenguaje sencillo. Obtener una insignia no publica automáticamente.
- Compartición voluntaria por Composer y moderación existentes, con vínculo válido a la concesión. Aprobar una historia genérica no concede una insignia.
- Definir corrección/revocación con motivo e historial; un cambio de catálogo no debe reescribir premios históricos silenciosamente.
- Conservar privacidad de menores y audiencia por grupo; no generar reconocimiento público de una concesión privada.

**Cierre:** automática y solicitud manual completas, persistencia, duplicados bloqueados, denegación/revisión/corrección explicadas y publicación voluntaria sin filtrar datos privados.

### 4. Vídeos privados de coordinación

Rama propuesta `feat/v1-community-videos`. Se puede preparar/probar localmente antes de contratar el servidor; la operación final depende del alojamiento elegido.

- Solo administración sube; elegir grupo activo, título, descripción, portada y referencia de permiso. Alumnos no reciben un endpoint de subida autorizado.
- Establecer formatos, tamaño, duración y cuota total antes de implementar la carga; comunicarlos junto al selector. Validar contenido real, no únicamente extensión o tipo declarado.
- Diseñar la subida para archivos mayores que imágenes, con estado/progreso y recuperación de fallos; no reutilizar indiscriminadamente el envío base64 de fotografías.
- Guardado privado y autorización en la reproducción y entrega parcial; un identificador/enlace no vuelve público el archivo.
- Controles de reproducción/volumen, portada, carga/error y alternativa textual/subtítulos. Sin reproducción automática ni inserción de enlaces públicos como sustituto de permisos.
- Retirar bloquea nuevas consultas y mantiene auditoría; no prometer revocar bytes ya descargados.
- Copias consistentes de metadatos y archivos, cuotas/limpieza acordadas y prueba de restauración separada.
- Procesamiento/conversión de formatos, almacenamiento externo y costes son decisiones técnicas por comprobar. No instalar herramientas del sistema ni contratar servicios implícitamente.

**Cierre local:** coordinación publica vídeo ficticio; grupo autorizado reproduce y busca un punto; otros grupos/suspendidos/anónimos no acceden al archivo ni a rangos; subida inválida/reintento/cuota y retirada se comprueban; copia/reinicio conservan el medio. Repetir entrega/reproducción/restauración en el alojamiento definitivo antes de producción.

### 5. Revisión de experiencia completa

- Recorrer Inicio → conversación → reto → logro → compartir → moderación, con cuentas ficticias y datos compartidos del servicio.
- Comprobar 1440/768/375/320, teclado/foco, temas y movimiento reducido; Brave principal y Opera GX para compatibilidad.
- Casos de carga, vacío, éxito, conexión perdida, duplicación, conflicto, falta de permisos y sesión revocada. No esconder fallos cambiando límites o aserciones.
- Extender API/modelos/recorridos existentes según cada cambio. Migraciones aditivas, copia previa y pruebas sobre bases ficticias.
- Actualizar guía y registro después de cada bloque, con implementación/pruebas/pendientes separados; punto de retorno y rama por mejora.
- Sesión posterior con la persona que administrará CAI: las pruebas automáticas no demuestran intuición humana.

## Planificación y dependencias

Es una ampliación funcional importante, especialmente retos/insignias con administración y vídeo privado. No se garantiza completar todo con calidad dentro del calendario original únicamente por el avance del alcance anterior. Mantener entregas verificables por bloque; revisar capacidad/plazo tras la primera implementación. No comprometer una fecha nueva sin acuerdo ni quitar pruebas/privacidad para encajar.

**Siguiente trabajo autónomo:** bloque 1, empezando por diseño conectado y reacciones persistentes; después comentarios y su revisión. Esta sesión realiza inventario y plan, no implementación de esos servicios. No pedir otra vez permiso para incluir los cinco módulos ni para que solo coordinación suba vídeos.

Google/correo reales, contenido/reglas finales y aceptación de CAI conservan su tanda agrupada; contratación de servidor/presupuesto al final. Vídeo local no equivale a almacenamiento/reproducción en producción. No hace falta esperar a cuentas externas para construir interacciones, retos o insignias localmente.

Las diez alertas de herramientas y las dos intermitencias registradas siguen siendo pendientes del informe anterior, sin atribuirles una reparación en este cambio documental.

