# Comunidad CAI: diseño e interacciones

**19-11-2026 · `feat/v1-community-playful-design`, desde `4cdae44` de PR #15.** Prioridad nueva autorizada: hacer más atractiva la comunidad, con identidad propia, fondo sutil, respuestas visuales y celebraciones. El usuario amplió expresamente a perfil, notificaciones y Retos, con colores/puntuación/confeti inspirados en experiencias de aprendizaje lúdicas. La muestra conserva las reglas, puntos y autorizaciones reales existentes.

**Continuación posterior:** `feat/v1-community-social-feed`, desde `d6e66fd` de PR #16. La primera muestra de esta guía se conserva como corte anterior; la revisión de publicaciones figura al final.

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
