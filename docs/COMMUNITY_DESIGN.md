# Comunidad CAI: diseño e interacciones

**Actualización vigente F5 — 24-11:** F5 aclara el ciclo de tres actividades de inglés, separa puntos diarios/acumulados, presenta aciertos/errores por actividad y facilita repaso privado. Se conservaron identidad CAI, banco, puntuación y celebraciones accesibles; no se creó Top. El diseño y las pruebas anteriores corresponden a sus versiones. [Entrega vigente](NEXT_STEPS.md#entrega-f5-retos-diarios-y-progreso-personal--24-11-2026).

**Actualización vigente F3b/F4 — 24-11:** F4a simplifica Logros y amplía sus límites; F4b deja un carrusel exclusivo de avisos vigentes cada 5s y conserva fotos/álbumes normales en feed/Galería. F3b publica comentarios nuevos al enviar y muestra borrado propio. No reintroducir el carrusel mixto ni los pasos de registro anteriores por seguir una sección histórica. [Entrega vigente](NEXT_STEPS.md#entrega-f3b-y-f4-logros-comentarios-y-publicador--24-11-2026).

**Observaciones posteriores del 22-11:** implementadas [fotos ampliadas, error visible en Retos y notificaciones Sin leer/Historial](COMMUNITY_FEEDBACK.md). Esa entrega modifica también servidor/esquema 20; las cifras de la primera pasada de abajo conservan su corte.

**19-11-2026 · `feat/v1-community-playful-design`, desde `4cdae44` de PR #15.** Prioridad nueva autorizada: hacer más atractiva la comunidad, con identidad propia, fondo sutil, respuestas visuales y celebraciones. El usuario amplió expresamente a perfil, notificaciones y Retos, con colores/puntuación/confeti inspirados en experiencias de aprendizaje lúdicas. La muestra conserva las reglas, puntos y autorizaciones reales existentes.

**Continuación funcional:** `style/v1-final-interface-polish`, desde `0b73032` (PR #20); código `5bd4c2a`. Primera pasada del punto 1: acabado visual y navegación de comunidad, página pública y panel. Logros/insignias/perfiles anteriores conservados. Resultados y límites al final; aprobación visual humana pendiente.

## Plan de trabajo y criterio de cierre

| Bloque | Primera muestra implementada | Para perfeccionar después de revisión visual |
| --- | --- | --- |
| Identidad y composición | Patrón SVG original de CAI, superficies más ligeras, fotos protagonistas, tarjetas de progreso real en Inicio, ambos temas. | Ajustar densidad, contraste y composición según observaciones del usuario. Mantener fotos completas y accesibles. |
| Retos | Puntuación grande, misión de tres pasos, barra de avance, botones táctiles, colores por estado y celebración del día completado. | Pulir ilustraciones y transición entre preguntas. El repaso existente sigue accesible; práctica adicional dirigida sigue siendo otra propuesta. |
| Reacciones y respuesta | Emoji animado tras confirmación real; revisión posterior: solo emoji/contador en una fila y retirada tocando otra vez el seleccionado. Guardado/error conservados. | Homogeneizar acciones secundarias y estados de carga de publicaciones/galería sin animaciones permanentes. |
| Insignias | Celebración grande centrada, motivo privado, cierre manual/teclado, cola de nuevas concesiones y acceso a colección; sin repetir antiguas al recargar. | Validar tamaño/ritmo con el usuario y ampliar pruebas de interrupciones/lectores de pantalla según observaciones. No convertir publicaciones de logros en nuevas insignias automáticas. |
| Mi espacio | Resumen privado de puntos, serie e insignias; colección reciente y edición de alias/avatar existentes. | Elegir si merece página completa; mejorar organización de solicitudes e historial usando los módulos ya hechos. No mostrar expediente o progreso a otros alumnos. |
| Notificaciones | Bandeja propia separada del perfil, mensajes nuevos/leídos, filtros, fechas y vacío claro; lectura mediante API existente. | Revisar los textos con CAI y priorizar tipos reales de aviso. No inventar mensajes o correo entregado. |
| Extensión | Galería, Logros y perfiles heredan fondo/controles; se mantienen sus funciones. | Afinar cada sección tras aprobar esta muestra; ningún apartado se considera rediseñado por completo solo por heredar el fondo. |

## Límites y continuidad

- La referencia de WhatsApp inspira la sutileza del fondo, no se copia su recurso. El SVG original es código del proyecto, sin imágenes generadas ni dependencias añadidas. Azul/amarillo y tipografía de CAI conservados; verde/lila apoyan estados y progreso.
- La librería Motion ya existía. Usar movimiento corto, confeti decorativo local, sin sonido por defecto ni parpadeos continuos. Con movimiento reducido, conservar información y controles sin partículas ni saltos.
- Celebrar solo resultados confirmados; errores de conexión no suman puntos ni producen éxitos ficticios. No cambiar respuestas únicas, revisiones, reglas de insignias o privacidad para mejorar la apariencia.
- La copia remota que se entregó al cliente tiene frontend compilado propio y sigue estable. No reiniciarla ni sustituir su copia, URL o claves por el rediseño sin necesidad/alcance explícito. Vista nueva local para revisar primero.
- Pruebas con nueva fixture en `.local/tests`, creada con `community-showcase-server.ts 4191 3201 --no-latest`. La opción evita reemplazar la referencia a la presentación habitual. La primera creación sin opción se corrigió restaurando esa referencia; no cambió los datos originales. No probar sobre `.local/cai.sqlite` ni las cuentas habituales.
- Verificación final: **130 comprobaciones de navegador, 65 Brave y 65 Opera GX** (50 de recorrido funcional/temas/tamaños y 15 adicionales de modales/contraste/privacidad por navegador), tipos, lint y build. No se repitieron las suites de API anteriores: no hay cambios de esquema, reglas o rutas de producto.

## Orden de continuación

1. Primera muestra comprobada: mostrar al usuario y recoger observaciones antes de extender el acabado a más pantallas.
2. Enseñar capturas y enlace local para decidir si la dirección visual encaja. Registrar observaciones concretas y refinar las pantallas de la tabla.
3. Aplicar el mismo criterio a Galería, Logros, estados vacíos/carga y demás interacciones; conservar el panel sencillo para coordinación.
4. Retomar N3 de operación/recuperación y las dependencias finales de CAI. Alojamiento definitivo, Google/correo y aceptación humana siguen pendientes.

## Evidencia y límites de esta entrega

Las pruebas recorren Inicio, perfil propio y ajeno, edición accesible sin modificar el perfil, bandeja/filtros y marcar leído, reacción confirmada y fallo simulado 503 sin celebración, pregunta sin selección y foco, respuesta incorrecta (+5), correcta (+15), tres preguntas (+35 en la fixture), modal de insignia, cola de dos concesiones reales de coordinación, teclado/Escape y no repetición al recargar. Comprueban ambas preferencias de movimiento y ambos temas a 1440/768/375/320. Los modales se revisan a 375px, los filtros alcanzan contraste de texto al menos 4.5:1 y el perfil ajeno no presenta estadísticas privadas ni edición. La galería conserva sus seis fotos. Sin errores JavaScript/consola inesperados; el único 503 es el fallo provocado por el verificador.

Los primeros intentos de preparar el verificador corrigieron la comprobación del SVG (Vite lo incrusta como data URL) y la espera del cambio de preferencia antes de contar partículas en Opera. Se conservaron las fixtures de esos intentos. Los 130 resultados corresponden a recorridos completados después de esas correcciones. La inspección de capturas detectó una transición que dejaba temporalmente texto blanco sobre un filtro claro: se eliminó en los filtros y se comprobaron colores/contraste en ambos navegadores. También se compactaron las acciones de cuenta en móvil.

Pruebas en fixtures de 4191/4193, más intento previo de 4192; material/capturas/resultados privados en `.local/tests/playful-*`. Una **muestra limpia local de revisión en 4194/API 3204**, iniciada con `--no-latest`, conserva las preguntas sin contestar y los datos iniciales, sin concesiones de QA. Se dejó su ficha en `.local/tests/community-design-preview.json`. Usar el acceso ficticio de la guía de presentación; no confundirlo con las claves nuevas del enlace remoto. La versión remota compilada anterior no se sustituyó ni reinició.

Archivos principales: `assets/learning-pattern.svg`, `DailyMission.tsx`, `HomeActivityStrip.tsx`, `CelebrationBurst.tsx`, `BadgeUnlockNotice.tsx`, `NotificationsDialog.tsx`, perfil/avisos/reacciones y sus estilos. Se reutilizan APIs, moderación, modelos, puntos, ilustraciones de insignias y edición existentes. Sin dependencias nuevas.

La celebración detecta nuevas concesiones confirmadas mientras la comunidad permanece montada; al cargar toma las existentes como punto inicial para no repetirlas. No se ha añadido una bandeja persistente entre dispositivos de celebraciones pendientes. Tampoco se declara finalizado todo el rediseño: la tabla distingue la muestra de los refinamientos posteriores. Aceptación visual del usuario y pruebas en su dispositivo real siguen pendientes.

## Publicaciones y conversación más sencillas

**19-11-2026 · `feat/v1-community-social-feed`, desde `d6e66fd`.** Observación del usuario: tarjetas estrechas y reacciones con palabras ocupaban demasiado; al abrir se sentía como un oficio. Se pidió fila de emojis/contadores y una presentación social más sencilla.

### Decisiones de interfaz

- El feed conectado utiliza una sola columna cronológica: autor/fecha/audiencia, mensaje, fotos y reacciones. Se eliminan las portadas editoriales y marcos individuales de las publicaciones conectadas; un fondo limpio y separadores conservan legibilidad. El carrusel superior de Inicio sigue siendo un espacio distinto y no se retiró. La demo en memoria conserva su variante editorial en el listado.
- Reacciones visibles solo con emoji y contador. Nombres en aria-label y tooltip para accesibilidad. Tocar otra vez la elegida la retira. La pausa de coordinación bloquea selecciones nuevas y conserva la retirada de la propia. Confirmación y ayuda normales quedan para lectores de pantalla; fallos y pausa siguen visibles. Animar solo tras confirmación; movimiento reducido respetado.
- Una historia larga se resume en el feed y Ver más abre su texto completo. El detalle elimina La historia completa y las instrucciones repetidas. El autor encabeza, el mensaje tiene tamaño/jerarquía más legible y la conversación aparece directamente. Se conserva Figtree de CAI.
- Comentarios con burbujas separadas, campo compacto, Enviar, actualización por icono y Mis envíos para revisar pendientes/retirar. Una nota breve junto al campo explica la revisión de CAI. Etiquetas accesibles y todas las reglas de moderación/autorización permanecen. No hay una conversación duplicada para las fotos de Galería.

### Comprobaciones

**124 comprobaciones nuevas: 62 Brave y 62 Opera GX**, con fixtures independientes en `.local/tests` (4195/API 3205 y 4196/API 3206). Verificador `scripts/check-community-social.browser.mjs`: orden/ancho, cinco emojis sin palabras visibles, etiquetas accesibles, elegir/quitar, confirmación/error 503 provocado, bloqueo pendiente y pausa con retirada; detalle, foco/Escape, enviar/validar/moderar/retirar un comentario real de fixture, privacidad de pendientes, Ver más con historia íntegra y conversación común con Galería.

Ambos temas y 1440/768/375/320: fila de cinco botones táctiles de al menos 44px, feed sin desbordamiento, diálogo que cabe y mantiene el foco. Movimiento reducido sin partículas; sin errores JS/consola inesperados. Capturas privadas revisadas en escritorio y móvil. Las capturas esperan transiciones finitas al cambiar de tema para no registrar colores intermedios. Tipos, ESLint, build, sintaxis de los verificadores y diff check correctos. No se repitieron las suites anteriores de 233 API/130 UI: no hay cambios de esquema, rutas o reglas de producto.

Los verificadores anteriores de Inicio, diseño, reacciones y demo remota se adaptaron a retirar tocando el emoji; se comprobó su sintaxis, sin afirmar que se ejecutaron completos en este corte. Datos, historias largas, aprobaciones y retiradas de QA no se insertan en la muestra del usuario. La muestra ya abierta en 4194 usa el código actualizado sin reiniciar sus datos ni sus accesos. La copia remota compilada permanece separada y no se actualizó.

Archivos principales de esta revisión: `home/ConnectedPostCard.tsx`, `social-feed.module.css`, selección de variante en `EditorialPostCard/HomeView`, `ReactionsBar`/estilos, `PostDetailDialog/PostCard`, `ConnectedComments` y estilos compartidos. Sin dependencias nuevas. Aceptación visual del usuario pendiente; el resto del plan conserva sus prioridades.

## Cabecera y novedades en un solo lugar

**19-11-2026 · `feat/v1-community-header-highlights`, desde `ffb323d`.** El usuario pidió retirar las franjas de demostración/gestión, ubicar mejor las opciones personales y unir avisos con el carrusel. La interfaz conectada y el acceso adoptan identidad de CAI; no se cambian ni se presentan los datos ficticios como expedientes de alumnos reales. La separación de fixtures, permisos y dependencias productivas continúa vigente.

### Cambios de interfaz

- Se eliminan ambas franjas de la comunidad conectada. Una campana con contador está junto al avatar. Programa/grupo, inscripción, actualización y cierre de sesión se encuentran en Mi espacio/Mi cuenta; las notificaciones conservan bandeja propia, también accesible desde el perfil. Éxitos rutinarios se anuncian sin ocupar una franja; errores permanecen visibles.
- Cabecera de dos filas en móvil, con controles de navegación, tema, campana y perfil dentro del ancho. Se mantienen modos claro/oscuro y las rutas existentes. No se exige una nueva configuración o alta de usuario.
- Inicio se titula **Tu comunidad, al día.** Un único carrusel reúne todos los avisos fijados autorizados y hasta cinco momentos fotográficos. Los selectores Avisos de CAI/Momentos permiten ir directamente al tipo de contenido, sin otra banda de avisos. Mensajes privados de cuenta jamás alimentan ese carrusel.
- Los avisos fijados van primero y el avance empieza pausado cuando hay alguno. Pueden abrirse completos con Leer aviso; una composición gráfica de CAI resuelve los que no tienen fotografía, sin imágenes falsas de alumnos. Las fotos siguen con sus permisos y su conversación. Se conservan pausa, controles, movimiento reducido y detención por foco/hover/visibilidad. Selección por ID estable, no solo por posición.
- Un aviso nuevo o retirado se refleja al actualizar. Si no hay avisos quedan los momentos; si no hay contenido se muestra un vacío claro sin flechas rotas. No se fusionan las conversaciones ni se crean avisos duplicados. La demo histórica en memoria conserva su variante.

### Corrección de cierre de sesión

La nueva prueba descubrió que el ayudante de escrituras actualizaba datos después de cada operación, incluso después de salir. Eso provocaba una consulta de cuenta con respuesta 401 tras haber revocado correctamente la sesión. Se añadió la opción refresh:false exclusivamente al cierre confirmado; todas las demás escrituras mantienen su actualización. Se conserva el bloqueo de operaciones, la invalidación de respuestas antiguas y el manejo de errores. No se cambió la API ni se ocultó el error en el verificador.

### Evidencia y continuidad

**122 comprobaciones nuevas: 61 Brave y 61 Opera GX.** Fixtures nuevas en 4201/API 3211 y 4199/API 3209; el intento previo en 4198/API 3208 se conserva como evidencia del 401 detectado. Verificador `scripts/check-community-header.browser.mjs`: ausencia de franjas, identidad, acceso a cuenta/inscripción/logout, campana/lectura, privacidad de mensajes y de otro grupo, aviso inicial, momentos, apertura completa, creación/retiro de aviso, vacío y casos sin avisos, pausa y avance real con reloj controlado de navegador.

Ambos temas a 1440/768/375/320: sin desbordamiento, controles de cabecera dentro de pantalla, selectores operativos. Se revisaron capturas de escritorio/móvil. Cierre revoca realmente la sesión y termina sin errores de consola; tipos/lint/build y sintaxis correctos. No se repitieron la suite de API ni las matrices históricas de otras entregas. Cuatro verificadores recientes se adaptaron al título, a Momentos y a la actualización desde Mi espacio; se comprobó su sintaxis, sin declararlos ejecutados completos.

La muestra del usuario de 4194 conserva datos/accesos y recibe el código de interfaz actualizado. No se reinició ni sustituyó su base. Las fixtures de QA no se convierten en la muestra. Capturas y datos privados permanecen fuera de Git en `.local/tests/header-highlights-*`; la copia remota compilada anterior no se reemplazó.

Archivos principales: `CommunityShell`, `MemberProfileDialog`, `StudentNotices`, `LoginPage`, `HomeView`, `ConnectedHomeHero`, proyección `highlights.ts`, estilos y opción de actualización en `ConnectedCommunity`. Sin dependencias nuevas, migraciones, cambios de permisos ni nuevas reglas de negocio. Queda pendiente la aceptación visual y continuar refinamientos del plan. Retirar rótulos de pruebas no acredita por sí solo dominio, correo/Google, infraestructura o aceptación productiva.

## Logros e insignias: modelo acordado

**19-11-2026 · corrección explícita del usuario, posterior a `d794fa1`, en `docs/v1-learning-adventures-plan`. Solo diseño/documentación; sin implementación, migraciones ni pruebas nuevas de producto.** Se mantiene **Logros** como nombre de navegación. Queda sustituida la propuesta de llamarlo Mis aventuras en inglés y de conceder una insignia por solicitar una actividad.

### Tres conceptos separados

| Concepto | Qué representa | Cómo funciona en el diseño acordado |
| --- | --- | --- |
| Logro | Una experiencia concreta de aprendizaje: lectura, película/serie, música y futuras categorías acordadas. | El alumno lo crea con preguntas guiadas, texto e imágenes opcionales; puede guardar varios de la misma categoría. Puede conservarlo privado sin publicarlo. |
| Insignia | Un reconocimiento por cumplir condiciones acumuladas de logros, Retos o participación. | Se obtiene, no se pide. Requisitos claros, progreso real y escalones cada vez más exigentes; concesión confirmada por servidor, sin duplicados. |
| Publicación | La decisión de compartir un logro u otro contenido con la comunidad autorizada. | El alumno solicita publicar; coordinación aprueba o pide un ajuste. Guardar/completar un logro u obtener una insignia no crea una publicación automática. |

La solicitud pasa a ser de **publicación de un logro**, no de insignia. Revisión de contenido, validación de un logro y concesión de insignia son responsabilidades distintas, aunque una misma acción de coordinación pueda resolver más de una. No tratar un borrador privado como una actividad validada ni obligar a compartir para progresar.

### Qué existe hoy y debe preservarse

- Catálogo actual de nueve insignias: tres automáticas de Retos, tres solicitables de lectura/cine/música y tres institucionales. Esta es la implementación anterior, no el modelo nuevo. Existen revisión, motivos privados, historial, concesiones, celebraciones y compartición moderada; reutilizarlos donde encajen.
- `ConnectedBadgeRequestForm` solo envía badgeId y texto de hasta 600 caracteres. `badges.apply` impide repetir si ya hay concesión (incluso retirada) o una petición pendiente. No basta cambiar sus etiquetas para convertirlo en logros repetibles.
- Las concesiones actuales conservan ID, condición e historial. Planificar migración versionada y compatibilidad; no borrar, retirar ni transformar insignias ganadas en nuevas afirmaciones de lectura inventadas. Las correcciones excepcionales de coordinación no equivalen a un mecanismo de pedir insignias.
- El perfil conectado ajeno (`MemberProfileDialog`) muestra alias/avatar; el propio añade progreso e insignias privadas. No existe todavía la colección social completa de un compañero. Los IDs públicos y la apertura desde autores/comentarios ya existen.
- El procesamiento con Sharp y las fotos de coordinación ya existen. Adjuntos de alumnos a sus logros siguen pendientes; no habilitar para ello el endpoint administrativo ni la carga general a Galería.

### Recorrido de Logros

Propuesta visual dentro del apartado existente: **Mis logros · Insignias · Comunidad**. Las etiquetas internas se pueden afinar al implementar; no renombrar la navegación principal.

1. **Registrar un logro.** Tarjetas iniciales Lectura, Cine y series, Música, con ideas pequeñas (capítulo, escena, canción), ayudas y preguntas adaptadas. No pedir que el alumno elija una insignia.
2. **Personalizar.** Obra/título, qué practicó, palabra o expresión y ejemplo propio. Permitir explicación en español con intentos en inglés, sin examen automático. Imágenes opcionales con vista previa, cambio y retirada. Propuesta de límite inicial: hasta tres JPEG/PNG de 3 MB cada una; comprobar al implementar. Sin vídeo/audio en este alcance.
3. **Guardar para mí.** Borrador o logro personal completado, ambos privados por defecto. El contenido privado no se expone a compañeros ni se envía a coordinación simplemente por guardar. El alumno puede volver a editar; distinguir su registro personal de un logro validado.
4. **Compartir si quiero.** Vista previa y solicitud explícita de publicación; coordinación revisa texto/imágenes, aprueba o pide ajuste. Los compañeros solo ven la versión aprobada con su audiencia autorizada. Mantener una historia canónica para comentarios/reacciones y enlaces desde perfil/Inicio.

La privacidad y la validez son independientes: propuesta a resolver antes de implementar las reglas de insignias por logros, **permitir solicitar validación privada sin publicar**. Solo coordinación autorizada vería lo enviado a validar. Así una actividad privada puede contar una vez validada; la revisión de publicación puede validar el mismo logro sin contarlo dos veces. Es una propuesta de funcionamiento, no una regla ya existente ni una obligación de validación para guardar un recuerdo personal.

### Insignias progresivas, obtenidas por condiciones

- Mostrar ilustración, requisito y avance real (por ejemplo 2 de 3), estado bloqueado/obtenido y fecha. Al cumplir, reutilizar la celebración existente; sin botón Solicitar insignia. Una concesión por nivel/ID, calculada en servidor y trazable.
- Familias propuestas: lectura; cine/series; música; práctica/constancia en Retos; aportaciones a la comunidad; combinaciones de varias actividades. Los nombres y umbrales son propuestas por definir, no cambiar el catálogo actual durante esta documentación.
- Ejemplos orientativos de niveles: 3/10/25 logros de lectura validados; 7/30/90 días de práctica completa; 5/20/50 publicaciones originales aprobadas. No confundir días acumulados con una racha consecutiva. Elegir condiciones de aprendizaje variadas para los niveles altos, en lugar de exigir únicamente más clics.
- Contar actividades distintas y realmente completadas/validadas; borradores, pendientes, reintentos y duplicados no suman. Retos usa los resultados existentes, sin sumar puntos ficticios; publicaciones usa aprobaciones reales y un criterio contra duplicación, sin premiar mensajes vacíos ni volumen de comentarios/reacciones.
- Definir antes de programar reglas de edición, corrección, retirada y exclusión de duplicados, y qué evidencia queda registrada. Retirar visibilidad de una publicación por voluntad del alumno no equivale a borrar el aprendizaje validado. Corrección de contenido inválido debe tener historial y una política explícita; no revocar automáticamente por un cambio de privacidad.
- No publicar respuestas, intentos o estadísticas privadas de Retos para justificar una insignia. El perfil puede enseñar la insignia obtenida sin su expediente ni el texto privado que la respaldó.

### Perfil de compañeros

Al tocar nombre/avatar se abre un perfil social con **Publicaciones · Logros · Insignias**, alias/avatar y colección visual. Reutilizar entrada e identidad existentes; ampliar servidor/contratos/permisos y paginación, no filtrar en cliente toda la información privada recibida.

- Publicaciones y logros: solo contenido aprobado, compartido y visible para quien visita según grupo/audiencia. El acceso por URL directa debe aplicar lo mismo. Un logro privado no aparece ni se delata por contadores/totales.
- Insignias: colección de concesiones activas y datos públicos mínimos de título/fecha/condición general; motivos, solicitudes e historial de correcciones quedan privados. La visualización de la colección en el perfil social forma parte de la ampliación solicitada; no publica su evidencia privada.
- Perfil propio: incluye logros privados, borradores, revisiones y acciones personales; vista previa de cómo lo ven compañeros. No exponer inscripción, correo, edad, avisos, puntuaciones/respuestas privadas ni expedientes.
- Conservar límites de comunidad/grupo y cuentas activas. La solicitud de perfil social no amplía por sí sola la audiencia de publicaciones antiguas ni convierte imágenes en recursos públicos. Las imágenes de logros siguen vinculadas a su dueño y a la publicación autorizada, no se incorporan automáticamente a Galería.

### Orden de implementación y cierre

| Paso | Trabajo | Criterio de cierre |
| --- | --- | --- |
| L1 · modelo y reglas | Separar logro, validación, publicación e insignia; definir niveles/umbrales y contadores, privacidad y migración histórica. | Condiciones explícitas, sin pérdida ni reclasificación ficticia de concesiones, sin publicación obligatoria para progresar. |
| L2 · logros guiados | Elección visual, preguntas, guardado/edición personal, imágenes privadas y vista previa. | Persistencia real, autorización por propietario, conversión segura sin EXIF, límites/formato, recarga/reintentos y escritorio/móvil/teclado comprobados. No presentar una carga sin persistencia como funcional. |
| L3 · validación y publicación | Ampliar revisión sencilla de coordinación; validación privada si se adopta esa propuesta; reutilizar moderación/publicaciones/conversación. | Estados independientes, aprobación/ajustes, control de versiones de imágenes, ausencia de fugas de borradores y aprobación sin duplicar conteos. |
| L4 · insignias | Motor de condiciones progresivas y catálogo con avance, concesión única/celebración y compatibilidad histórica. | Cómputo confirmado en servidor, concurrencia/idempotencia, niveles y evidencia correctos; sin peticiones de insignia ni publicación automática. |
| L5 · perfiles | Colección propia y de compañeros con publicaciones/logros compartidos/insignias; paginación y enlaces al contenido canónico. | Privacidad por audiencia en cada consulta/archivo, perfiles propios/ajenos, pendientes y retiradas comprobados; móvil, teclado, temas y consola. |

Actualizar componentes existentes y reutilizar revisión, comentarios, reacciones, IDs públicos y celebraciones. Pruebas por entrega en fixtures nuevas de `.local/tests`; nunca migrar ni probar sobre `.local/cai.sqlite` o la muestra del usuario. Mantener copia remota anterior estable y archivos privados fuera de Git. Sin dependencias o servicios externos de IA/extracción de portadas por este plan.

**Estado de este corte documental anterior (`0729cc5`):** todavía era diseño. La entrega siguiente implementa L1–L5, concreta niveles y validación privada; sus límites y pruebas figuran a continuación. No usar esta nota histórica para reconstruir lo ya conectado.

## Logros, insignias y perfiles implementados

**19-11-2026 · `feat/v1-achievements-progressive-badges`, desde `0729cc5`; código `5349283`.** El usuario autorizó implementar el modelo corregido. L1–L5 tienen primera implementación conectada; aceptación visual y prueba con coordinación siguen pendientes. No se renombra Logros.

### Qué funciona

- Mis logros presenta tarjetas de Lectura, Cine y series y Música. Registro de cuatro pasos: actividad, obra/imágenes, práctica/expresión/ejemplo y vista previa. Borrador y completado se guardan en servidor, pueden recargarse y editarse mientras no estén enviados ni validados. Las obras validadas se conservan inmutables; otra experiencia es otro registro.
- Hasta tres JPEG/PNG de 3 MB cada una, máximo 12 millones de píxeles, convertidas con Sharp a WebP de lado máximo 1600 y sin EXIF. Solo bytes procesados en SQLite, sin archivos originales o rutas públicas. El guardado revalida sesión tras procesar y dentro de transacción, conserva revisión optimista y reintentos idempotentes. Presupuesto inicial: 30 MB por alumno, 128 MB de adjuntos de logros en la instalación y 1,000 registros por alumno. Estos límites no son una estimación de capacidad del proveedor definitivo.
- Guardar no envía a coordinación ni publica. Un logro completado permite **Validar sin publicar** o **Enviar para publicar**. Validación privada y publicación tienen estados independientes. Coordinación ve la intención, texto e imágenes juntos, escribe motivo privado y confirma. Puede aprobar o pedir ajuste; se puede retirar una solicitud pendiente.
- Compartir crea una publicación moderada de grupo, vinculada al mismo logro. La aprobación puede validar el aprendizaje; aprobar una validación privada nunca publica. Se reutilizan moderación, comentarios y reacciones. Imágenes pendientes/privadas no alimentan Inicio, perfil ajeno ni Galería. Una publicación retirada desaparece para compañeros sin borrar el logro validado o retirar la insignia automáticamente.
- Perfil propio y de compañeros: Publicaciones, Logros compartidos e Insignias obtenidas. Se abre desde los autores/comentarios ya existentes y enlaza a la conversación canónica. Permisos en servidor por grupo, cuenta activa y audiencia, también en imagen/URL directa; sin borradores, motivos, expediente, correo o estadísticas privadas de Retos. La colección pública mínima de insignias incluye título/fecha/catálogo, no su evidencia privada. Paginación de 20 registros.
- Coordinación usa **Logros e insignias**; la cola de logros indica validación privada frente a publicación. El contador de navegación suma los logros pendientes y las solicitudes anteriores; al decidir se actualiza. Las solicitudes de insignia antiguas siguen consultables/revisables; nuevas solicitudes se rechazan con 410. No se eliminan concesiones ni historias anteriores.

### Reglas concretadas

| Familia | Escalones nuevos | Qué cuenta |
| --- | --- | --- |
| Lectura | 3, 10 y 25 | Títulos distintos validados por CAI, aunque permanezcan privados. |
| Cine y series | 3, 10 y 25 | Obras/experiencias con títulos distintos y validación. |
| Música | 3, 10 y 25 | Títulos distintos con validación. |
| Práctica en Retos | 7, 30 y 90 días | Tres preguntas respondidas en cada día; acumulados, no racha. |
| Publicaciones | 5, 20 y 50 | Aprobaciones reales de contenido original; título/cuerpo idénticos normalizados no duplican el avance. |

Catálogo actual: **21 insignias**, incluidos los tres reconocimientos iniciales de Retos y los tres institucionales conservados. Book Buddy, Explorador de películas y Music Catcher pasan a condiciones de tres logros validados para nuevas concesiones; el JSON/condición/fecha de las concesiones antiguas no se reescribe. Los niveles superiores tienen IDs propios. Duplicados de título en una misma actividad no suman; no es un detector semántico de textos reformulados. La moderación humana sigue siendo el control de calidad.

El servidor calcula progreso y concede al consultar la instantánea autorizada, con una concesión única por alumno/ID y auditoría. No existe petición de insignia en la nueva interfaz. No suman borradores, pendientes o reintentos ni se inventan puntos de Retos. Retirar una publicación por privacidad conserva el reconocimiento ya ganado; correcciones excepcionales siguen con motivo/historial de coordinación. No se retiran automáticamente insignias por cambiar requisitos del catálogo o recalcular el avance. La celebración toma la definición de la concesión confirmada, admite los niveles nuevos y Ver mis insignias abre su pestaña y cierra el perfil superpuesto.

### Persistencia y operación

Migración **19**, aditiva: `learning_achievements`, `learning_images` y `learning_audit`, sin convertir solicitudes antiguas en obras inventadas. `publications`, IDs públicos y concesiones existentes conservados. Los adjuntos BLOB forman parte de la copia consistente; el verificador admite esquema 19 y revisa sus imágenes. El preflight productivo exige ahora historial 1–19; no migra una instalación existente al arrancar. No actualizar bases habituales o producción implícitamente: ensayo de actualización/recuperación N3 y adopción autorizada siguen pendientes.

No se abrió ni migró `.local/cai.sqlite`, la muestra anterior de 4194 o la copia remota compilada. El frontend nuevo debe probarse con su API nueva de esquema 19. Muestra limpia de esta entrega en 4216/API 3226, creada con `community-showcase-server.ts ... --no-latest`, sin logros personales de QA, sin sustituir la referencia de presentación habitual. Datos/accesos y prueba visual privados en `.local/tests`; no forman parte del clon. Para reproducir, crear otra fixture con puertos libres, sin reiniciar la existente si se quieren conservar sus interacciones.

### Evidencia y límites

- Suite completa: **261 pruebas API correctas**, incluidas las pruebas históricas adaptadas a esquema 19 y a solicitudes antiguas; fixtures independientes. Tras el ajuste final de contador/confirmación de motivos, **42 pruebas pertinentes de logros, insignias y publicaciones** correctas. No sumar las dos tandas.
- **108 comprobaciones de navegador: 54 Brave y 54 Opera GX**, `scripts/check-learning.browser.mjs`. Guardar/editar/recargar, imagen/vista previa/retirada, validación privada desde panel, publicación moderada, acceso desde compañero y conversación, concesión real y celebración/acceso directo, progreso 3/10, retirada y privacidad de otro grupo. Editor y colección a 1440/768/375/320, claro/oscuro, Escape y movimiento reducido; sin errores JS/consola inesperados. La matriz precede al último ajuste del contador de coordinación, comprobado después por API y tipos. Capturas revisadas en escritorio/móvil. Muestra limpia final de 4216 también renderizada y comprobada sin registros personales.
- Build, comprobación de tipos del proyecto, ESLint, diff check y comprobación TypeScript estricta dirigida a `server/learning.ts`/`server/social-profiles.ts` y sus dependencias correctos. Sin dependencias añadidas. No se repitieron las matrices históricas completas de navegador de otras entregas.
- Se corrigió durante QA una aserción demasiado genérica que confundía la explicación pública del catálogo con un motivo privado; la prueba actual busca el texto confidencial específico. Se conservan los intentos y sus límites. Las primeras ejecuciones detectaron también la adaptación pendiente del contrato de fotos vacío; se conservó el contrato antiguo de publicaciones de texto.

Quedan revisión humana de las pantallas/umbrales, ajuste de nombres/criterios según CAI y N3/servicios externos de la guía general. No se implementaron vídeo/audio, evaluación automática de inglés, nuevas categorías o un verificador semántico de obras. Los motivos anteriores de revisión quedan auditados; esta primera pantalla muestra el motivo vigente, no una nueva interfaz completa de auditoría de logros. La copia remota anterior no se actualizó ni publicó otra instancia productiva.

## Cierre visual: primera pasada

**22-11-2026 · `style/v1-final-interface-polish`, desde `0b73032` de PR #20; código `5bd4c2a`.** El usuario eligió el punto 1 de la lista de entrega: cerrar diseño. Primera pasada implementada y comprobada; la aprobación visual del usuario y los datos comerciales oficiales siguen pendientes. No declarar cerrado todo el proyecto ni confundir la prueba automática con aceptación de CAI.

### Cambios concretos

- Cabecera móvil: los controles de tema pasan junto al avatar/campana y la navegación ocupa una fila completa, con texto de 14px y controles táctiles. En pantallas de 400px o menos queda la marca CAI; el enlace conserva el nombre accesible completo. Se comprobaron separación de marca/controles y ausencia de desbordamiento a 320px.
- Galería: menos introducción antes de las fotos, explicación de audiencia plegable y títulos/orden compactos. Se mantienen Fotos como inicio, las seis fotografías, Álbumes, filtros, vacío claro, visor y permisos. La primera fotografía aparece dentro de la primera pantalla de 950px en la prueba móvil; no vuelve a ocultarse tras dos portadas.
- Retos: la sección lateral muestra tres metas automáticas de la categoría Retos, priorizando las no obtenidas; añade sus barras reales y enlace a la pestaña Insignias. Ya no vuelca las 18 automáticas de todas las categorías bajo Tu pequeña colección. El catálogo completo permanece en Logros, sin cambiar requisitos, concesiones, puntos o respuestas.
- Perfil propio: Mi actividad / Mi cuenta. Actividad reúne colección compartida e insignias recientes; cuenta reúne edición de alias/color, inscripción, notificaciones, actualización y salida. Puntos/serie siguen privados. Las insignias recientes utilizan las primeras concesiones activas del orden descendente del servidor. Perfil ajeno mantiene contenido compartido y permisos anteriores. Diálogo más ancho en escritorio y cabecera/cierre pegados arriba al desplazarse.
- Notificaciones: texto y filtros más legibles, diálogo propio sin una segunda caja innecesaria y cierre visible al desplazarse. Se conservan lectura, filtros y mensajes privados.
- Inicio, Logros y registro guiado: ajustes de tipografía y espacio, acciones más legibles y pie de acciones del editor pegado al borde visible. Se conservan publicaciones sociales, emojis sin palabras, borradores, imágenes y revisión.
- Página pública: tamaños legibles en campos, botones, preguntas frecuentes y notas; ajuste de espaciado móvil. En oscuro, soporte blanco para el emblema oficial y trazos claros en el menú. Se preservan fotos, identidad y avisos de cifras/contenido comercial pendiente de confirmar; no se convierten muestras en afirmaciones comerciales aprobadas.
- Panel: controles/tarjetas consistentes y retirada de una nota de prueba duplicada, manteniendo la advertencia local. Menú móvil con cierre visible, foco inicial, Tab/Shift+Tab contenidos, Escape/restauración de foco, fondo inactivo mientras está abierto y liberación al pasar a escritorio. Se conservan rutas, datos y operaciones existentes; no se ha rediseñado otro dashboard.

### Verificación realmente ejecutada

**454 comprobaciones de interfaz: 227 Brave y 227 Opera GX**, mediante `scripts/check-interface-polish.browser.mjs`. Inicio/Galería/Retos/Logros, ambas preferencias de tema y 1440/768/375/320; navegación legible, controles separados, imágenes/álbumes/filtros/vacío, perfil/edición/cuenta, notificaciones y cierre, registro guiado, página pública/formulario/FAQ/menú, acceso/registro y las nueve secciones del panel. En acceso/registro se comprobó el ancho en los cuatro tamaños; no se declara una nueva auditoría integral de esos formularios. Menú administrativo comprobado con teclado y cambio de tamaño. Movimiento reducido y navegación con movimiento normal; sin errores JS/consola inesperados.

**108 comprobaciones adicionales de regresión de Logros: 54 por navegador**, reejecución de `check-learning.browser.mjs` adaptado a Mi cuenta. Guardado/edición/imagen, validación privada en el panel, publicación, perfil de compañero/conversación, concesión real/celebración, progreso y retirada. Son pruebas nuevas de esta entrega, separadas de las 108 históricas del 19-11, y no se suman como si aquellas se hubieran repetido dos veces.

Build, tipos, ESLint, sintaxis y diff check correctos. Capturas revisadas de móvil y escritorio. El primer intento de matriz general se detuvo buscando el menú administrativo tras numerosas recargas completas; el recorrido actual usa enlaces reales de la aplicación y pasó en ambos navegadores. No se atribuye una causa de servidor no comprobada ni se relajaron límites para superarlo. No se reejecutó la suite API: `server`, `shared` y dependencias no cambian respecto a `0b73032`; sus 261 resultados anteriores conservan su fecha/alcance.

QA solo en fixtures nuevas de 4220/API 3230 y 4221/API 3231, iniciadas con `--no-latest`. Las actividades/validaciones/retiradas de pruebas no pasan a la muestra del usuario. Bases/capturas/resultados privados en `.local/tests`; no subirlos a Git. Muestra limpia nueva de revisión en **4222/API 3232**, sin sustituir la referencia habitual ni el enlace remoto anterior. No afirmar que servidores históricos o el túnel temporal siguen disponibles sin comprobarlos.

Archivos principales: `community.module.css`, `MemberProfileDialog`, `NotificationsDialog`, `ChallengeRewards`, `GalleryView`, estilos de Inicio/Retos/Galería/Logros/landing/admin, `SocialProfileContent`, `AdminLayout` y los dos verificadores actuales. Sin nuevas dependencias, migraciones o cambios de permisos.

### Lo que sigue

Recoger observaciones visuales concretas del usuario y corregirlas. El punto 2 requiere que coordinación complete tareas para validar facilidad de uso; una matriz de navegador no sustituye esa sesión. N3 de operación/recuperación y Google/correo/servicios reales conservan su lugar en NEXT_STEPS. No añadir vídeos, repaso personalizado u otras ampliaciones por este pulido. Tampoco presentar esta pasada como actualización del alojamiento público.
