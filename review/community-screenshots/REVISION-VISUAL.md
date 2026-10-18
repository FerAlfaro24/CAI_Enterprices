# Auditoría visual de CAI Community

Fecha: 17 de octubre de 2026. Rama comprobada: `feat/community`.
Implementación observada: árbol de trabajo actual, incluidos los cambios previos sin commit.
URL local utilizada: `http://127.0.0.1:5173/community`.
Navegador: Brave mediante Playwright, en perfil de automatización aislado.

## Resultado de la revisión

La comunidad ya permite presentar un recorrido comprensible: leer publicaciones, reaccionar, abrir conversaciones, recorrer una galería, resolver retos y mostrar una aprobación simulada. La identidad CAI es reconocible y los estados de aprobación y de respuesta al reto se distinguen bien.

El problema visual principal es la distribución de la atención. La introducción, los controles de demostración y los dos avisos fijados retrasan la actividad de los alumnos. El feed resulta largo y repetitivo; en escritorio pierde equilibrio cuando termina la columna derecha. En móvil, una parte importante del contenido comunitario queda muy lejos del inicio. La siguiente iteración debería resolver densidad, jerarquía y orden móvil antes de añadir adornos.

Se entregan **75 capturas PNG** y este informe:

- 44 capturas con viewport de escritorio de 1440 × 900.
- 2 capturas adicionales a 1024 × 900 y 768 × 900.
- 24 capturas a 375 × 812.
- 5 capturas a 320 × 812.
- Dentro de las anteriores hay 5 capturas de página completa y 11 segmentos solapados del inicio de escritorio.

Carpeta: `review/community-screenshots/`.
ZIP: `review/CAI-Community-Revision-Visual.zip`.
Todos los enlaces de imágenes de este documento son relativos y funcionan al extraer el ZIP.

## Cómo revisar el material

Empezar por [01-inicio-escritorio.png](01-inicio-escritorio.png), [02-inicio-completo.png](02-inicio-completo.png), [18-inicio-movil.png](18-inicio-movil.png) y [34a-inicio-320-movil.png](34a-inicio-320-movil.png). Después, revisar los estados concretos con las capturas numeradas por función.

La imagen completa del inicio mide **1425 × 8839 px**. Sirve para evaluar composición y espacios; para leer textos se incluyen los once archivos `02-inicio-segmento-XX.png`, además de las capturas individuales de publicaciones. Los segmentos avanzan aproximadamente 760 px sobre un viewport de 900 px; el último termina al pie del documento.

El número del archivo agrupa una función. No representa necesariamente la secuencia temporal de las acciones. Cada fila del inventario identifica el estado observado.

Las imágenes de página completa tienen 1425 px de ancho porque Brave excluye la barra vertical al capturar el documento. Su viewport configurado fue 1440 × 900. Las capturas móviles son viewports de navegador de escritorio redimensionados; no son pruebas sobre teléfonos físicos y conservan la barra de desplazamiento de Windows.

## Cobertura de las pantallas solicitadas

| Solicitud | Evidencia |
| --- | --- |
| Inicio de escritorio | 01 |
| Inicio completo y segmentos legibles | 02 y sus once segmentos |
| Avisos fijados de CAI | 03a y 03b |
| Publicación de texto | 04; móvil 22 |
| Imagen compacta | 05; móvil 21b |
| Galería navegable | 06a–06b; móvil 24a–24b |
| Comentarios expandidos y comentario nuevo | 07a y 07c; móvil 23a–23b |
| Reacciones disponibles y selección | 08a–08b |
| Logros | 09a–09b |
| Galería como sección | 10a–10b |
| Reto inicial | 11a–11c; móvil 25a–25b y 35 |
| Reto correcto, incorrecto y constancia | 12a–12d; móvil 26–27 |
| Alumnos | 13a–13b; móvil 29a–29b |
| Crear publicación | 14a–14b; móvil 30a–30b y 36a–36b |
| Moderador demo | 15a–15b; móvil 31a–31b |
| Pendiente antes de aprobar | 16a–16b; móvil 32 |
| Publicación aprobada en feed | 17a–17b; móvil 33 |
| Navegación móvil | 19 |
| Bienvenidas y reconocimientos móviles | 28a–28b |

**Dos estados pedidos no existen en la interfaz actual:**

1. **Selector de reacciones abierto:** hay cinco botones de reacción permanentemente visibles; no hay un desplegable. Se capturaron los botones disponibles y la reacción seleccionada en 08a y 08b.
2. **Menú móvil abierto:** las cinco secciones permanecen visibles en una fila. No hay botón hamburguesa ni panel que abrir. La captura 19 documenta la navegación real.

No se añadieron controles para producir esas imágenes. Las demás pantallas solicitadas pudieron capturarse. No se utilizaron recreaciones de la interfaz.

## Condiciones y estados de la demostración

- La sesión empezó con 15 publicaciones aprobadas, dos avisos fijados y dos publicaciones preparadas para moderación.
- En escritorio se seleccionó «Me encanta» en la publicación de Luna: el contador pasó de 24 a 25 y el botón quedó seleccionado.
- Se abrió la conversación de Dani y, más adelante, se añadió un cuarto comentario de Alex Demo, identificado expresamente como ficticio.
- El carrusel de Vale se capturó en sus imágenes 1 y 2 de 3.
- En Retos se respondió correctamente el día 1, incorrectamente el día 2 y correctamente el día 3: 15 + 5 + 15 = 35 puntos ficticios y «Constancia que inspira».
- Se creó «Un pequeño logro para la revisión visual», con texto ficticio y una imagen ilustrativa. Quedó pendiente y el feed conservó 15 aprobadas. En Moderador aparecieron tres pendientes; tras aprobar el nuevo envío, el feed tuvo 16 y la publicación quedó después de los dos avisos fijados.
- Antes del recorrido móvil se recargó la página para restaurar los datos. Allí se reprodujeron los tres días de reto y se aprobó el ejemplo preparado de Iris Ideas. Por eso las capturas móviles de moderación muestran dos pendientes iniciales y una publicación distinta de la aprobada en escritorio.
- Antes de las capturas a 320 px se volvió a recargar. Sus estados iniciales no incluyen puntos ni publicaciones añadidas.
- Al terminar las comprobaciones interactivas se usó «Reiniciar demo».
- Los cambios de interacción ocurrieron únicamente en el estado React del navegador. No se introdujeron datos personales reales ni se editaron fixtures.

Las secciones Inicio, Logros, Galería, Retos y Alumnos conservan la misma ruta `/community`. Cambian mediante estado de la interfaz; no tienen URL independiente que se pueda copiar para recuperar cada sección.

## Hallazgos de diseño

### Identidad y puntos fuertes

- El logotipo, Figtree, el azul oscuro y el azul primario mantienen una identidad clara. Los fondos claros y los acentos secundarios permiten reconocer categorías sin saturación cromática.
- La separación de autor, fecha, categoría, título, contenido y acciones es consistente. «Fijado por CAI» permite entender por qué dos avisos antiguos aparecen antes del contenido reciente.
- Los avatares por iniciales y los alias conservan la distinción entre contenido ficticio y personas reales. El perfil institucional se reconoce por el logotipo.
- Hay variedad de formatos: texto, imagen compacta, fotografía mediana, galería, hito amarillo y evento con fecha. No todas las publicaciones tienen una fotografía grande.
- Las conversaciones abiertas se leen como un conjunto. Autor y mensaje están separados, y el formulario queda al final.
- La reacción elegida cambia de fondo, borde y peso del contador. En 08b se distingue la selección.
- El reto usa texto explicativo además de color para distinguir acierto y error. El error conserva puntos por participar y el reconocimiento transmite constancia sin comparaciones negativas.
- El formulario concentra la tarea en un diálogo con etiquetas y foco visible. Los botones de aprobar y rechazar son identificables incluso en móvil.
- El estado pendiente y el aprobado tienen evidencia visible, tanto para el alumno como para el moderador.
- No se detectó desbordamiento horizontal del documento en las cinco secciones a 1440, 1024, 768, 375 y 320 px durante esta revisión.

### Jerarquía visual y primer pantallazo

**La actividad tarda en aparecer.** En el inicio de escritorio, la primera tarjeta empieza cerca de y=613 y pertenece a CAI. La primera publicación de alumno empieza aproximadamente en y=1735. En 375 px, esas posiciones son y=893 y y=2246. La captura 18 no muestra ninguna publicación: muestra aviso, cabecera, navegación entre áreas, controles de demo, navegación interna, introducción, reto y compositor.

El título «Cada pequeño paso cuenta» tiene mucha presencia. Se suma al subtítulo, cifras, acceso al reto y compositor antes del contenido. La bienvenida funciona como presentación, pero consume demasiado espacio para una comunidad que se visita repetidamente.

**El reto compite con el feed.** En escritorio tiene un acceso destacado dentro de la introducción y un cuestionario completo en la derecha. Este último concentra opciones, instrucciones, selector, botón y puntos dentro del primer pantallazo. Tiene más peso visual que las primeras conversaciones.

**La navegación presenta capas acumuladas.** Institucional/Comunidad/Administración, selector Alumno/Moderador y las cinco secciones internas conviven muy arriba. Para una presentación guiada es útil tener controles de demo; su presencia y sus textos explicativos deberían ocupar menos altura.

**Los avisos fijados tienen el mismo tratamiento extenso que una historia.** Dos tarjetas con reacciones y vista previa de comentario crean un tramo institucional largo antes de llegar a las experiencias. La condición de fijado se entiende, pero ocupa demasiado recorrido.

Evidencias: 01, 02, 03a–03b, 18, 19, 34a, 37 y 38.

### Espacios desaprovechados y longitud

En el estado inicial de escritorio el documento mide 8839 px. La columna contextual empieza cerca de y=219 y mide unos 1594 px: termina alrededor de y=1813. El resto del feed continúa durante miles de píxeles con una franja derecha vacía. La navegación izquierda permanece visible, de modo que el centro se siente aislado al avanzar.

El problema no es que cada tarjeta necesite llenar el ancho. Es la falta de equilibrio entre una columna central muy larga y una columna contextual que se agota pronto. La imagen completa y los segmentos 02 muestran la magnitud del vacío.

La tarjeta lateral de Alex dedica bastante altura a avatar, alias, insignia y lema. Aporta pertenencia, pero su información cambia poco y ocupa una posición persistente.

La composición compacta de fotografía evita agrandar todas las imágenes, lo cual conviene conservar. En 05 queda una zona amplia casi vacía junto a la miniatura, utilizada principalmente por un pie de foto. Esa superficie podría comunicar algo más útil o ocupar menos ancho.

El pie del feed añade otro cierre con icono y dos frases después de quince tarjetas. Contribuye a la longitud; tiene menor prioridad que las publicaciones.

### Información repetida y ritmo del feed

Cada publicación repite una secuencia extensa: resumen de celebraciones, número de comentarios, cinco botones de reacción, enlace a conversación y, en varias, primer comentario visible. Hay consistencia, pero la repetición termina dominando el recorrido.

La vista previa de comentario es una buena señal de actividad. Mostrarla sistemáticamente en tarjetas largas hace que cada historia se sienta más alta. Conviene decidir dónde realmente ayuda a descubrir una conversación.

El aviso de prototipo debe conservarse. Actualmente se combina con escenario ficticio, explicación de duración de cambios, perfil ficticio, insignias demo, textos de muestra y avisos internos. La acumulación dispersa la atención. Puede simplificarse la redacción y el espacio conservando una identificación inequívoca de simulación.

Los mensajes globales de la última acción permanecen al cambiar de sección: por ejemplo, el inicio de Retos conserva el mensaje de la reacción previa. Esa ubicación deja información de otra tarea junto al nuevo encabezado.

Los títulos y textos repiten «pequeño paso», «celebrar», «intento» y «constancia». El tono es amable y coherente, aunque demasiado uniforme para sostener la impresión de semanas de conversaciones espontáneas. La variedad de longitud, intención y voz puede mejorar con contenido ficticio más diverso.

Evidencias: 02, 04, 05, 07a, 08b, 09b, 11a y 13a.

### Tipografía, contraste y tamaños

Figtree aporta continuidad con CAI y los títulos azul oscuro se reconocen con claridad. Las acciones primarias azules y los resultados verde/amarillo tienen una jerarquía comprensible.

La tipografía de apoyo es pequeña. En la inspección de estilos computados se observaron:

| Elemento observado | Tamaño |
| --- | --- |
| Cuerpo de una publicación en escritorio | 14 px, interlineado 25,2 px |
| Cuerpo de una publicación a 375 px | 13 px, interlineado 23,4 px |
| Fecha de publicación en escritorio | 11 px |
| Texto de un botón de reacción en escritorio | 12 px |
| Pie de imagen compacta en escritorio | 12 px |
| Otros pies fotográficos y metadatos | Se observan variantes de 11 px en la implementación |

Las líneas tienen aire, pero parte de la información exige leer texto muy pequeño. Fechas, autores de comentarios, pies y ayudas tienen poca presencia al compartir azules grisáceos similares. El tamaño agrava la sensación de bajo contraste.

No se detectó visualmente una pérdida generalizada de legibilidad en títulos ni botones primarios. Los bordes muy claros delimitan superficies de manera tenue. Esta revisión **no certifica contraste WCAG** ni sustituye mediciones completas de todas las combinaciones, estados y tamaños.

Las reacciones usan emoji y número sin una etiqueta visible permanente. La selección se ve; el significado exacto de cada emoji requiere interpretación visual. Los nombres accesibles no resuelven por sí solos el descubrimiento visual de «Bien hecho», «Felicidades» o «Increíble».

En móvil, los cinco controles siguen cabiendo y sus contadores se apilan, pero los textos auxiliares mantienen poco tamaño. A 320 px las etiquetas de las imágenes del formulario parten en varias líneas y el bloque de controles de demo también crece.

Evidencias: 04, 07a, 08b, 21a, 23b, 24a, 34a y 36b.

### Variedad visual entre publicaciones

La variedad existe y es aprovechable:

| Formato | Ejemplo capturado | Evaluación |
| --- | --- | --- |
| Texto | Dani, 04 y 22 | Se lee con claridad; la zona de interacción ocupa bastante espacio respecto del texto. |
| Fotografía compacta | Teo, 05 y 21b | Reduce el peso fotográfico; en escritorio deja espacio poco aprovechado junto a la miniatura. |
| Fotografía mediana | Nico, 21a; también en los segmentos 02 | Añade una pausa visual clara. |
| Galería | Vale, 06a–06b y 24a–24b | Controles y posición son visibles; se demostró el cambio de fotografía. |
| Logro | Luna y Leo, 08b y 09b | El bloque amarillo distingue hitos; se repite casi con la misma composición. |
| Evento | Café de conversación, segmentos 02 | Fecha y acento de categoría aportan otra composición. |
| Aviso institucional | 03a–03b | Autoridad reconocible, con demasiado peso al acumular dos fijados completos. |

La diversidad de recursos es limitada: se reutilizan tres fotografías de stock —biblioteca, portátil y reunión— en varias publicaciones y galerías. Repetir la biblioteca y el portátil hace visible el carácter de maqueta aunque haya distintos alias y fechas. Las fotografías se identifican como ilustrativas; no prueban actividad ni instalaciones reales.

Las tarjetas comparten casi siempre bordes, espaciado, metadatos y pie de acciones. Las variaciones interiores ayudan, pero el ritmo general sigue siendo uniforme. La sección Galería conserva publicaciones completas con texto, reacciones y comentarios: la experiencia visual de «álbum» queda poco desarrollada.

En Alumnos hay doce perfiles bien separados, con avatares de iniciales, biografías e insignias. El resultado es ordenado, aunque muy repetitivo y estático; los bloques de equipo y alumno tienen un peso similar. Se puede mejorar la agrupación y la jerarquía sin recurrir a fotografías auténticas de estudiantes.

### Experiencia móvil

**Qué funciona:** las cinco secciones caben en 375 y 320 px; las tarjetas se apilan; los carruseles conservan sus botones; las opciones del reto y las acciones de moderación se pueden activar. Los comentarios pasan a una composición vertical legible. El diálogo tiene desplazamiento interno y se pudo cerrar con Escape.

**Qué dificulta la experiencia:**

- El inicio consume más de una pantalla antes de mostrar siquiera el primer aviso. A 320 px ni el compositor entra completo en el primer pantallazo.
- La cabecera fija ocupa aproximadamente 107 px a 375 px y mantiene la navegación entre áreas al desplazarse. La navegación entre secciones queda atrás en el flujo; cambiar de sección después de bajar mucho requiere volver a localizarla.
- En Inicio, la columna contextual empieza cerca de y=10286 en 375 px, después de las quince historias. Bienvenidas y reconocimientos quedan todavía más abajo. El acceso superior al reto y el botón Retos permiten llegar al cuestionario, pero los otros bloques no tienen la misma exposición.
- Las conversaciones expandidas alargan mucho las tarjetas. En 23a y 23b se necesitan dos encuadres para mostrar publicación, respuestas y formulario.
- El formulario cabe horizontalmente, pero el botón final requiere desplazarse dentro del diálogo. A 320 px, el título y el cierre salen del encuadre al llegar al final. No se ve simultáneamente el contexto de creación y la acción de enviar.
- La moderación es operable a 375 px. La cola dentro del feed añade otro bloque largo antes de las historias; el contexto del alumno y del moderador debería diferenciarse mejor en una presentación.

La adaptación evita roturas horizontales. Aun así, necesita una composición pensada para la prioridad de lectura en pantalla pequeña, además del apilamiento.

Evidencias: 18–36b. Las capturas 37 y 38 documentan las transiciones intermedias: dos columnas a 1024 y contenido apilado a 768.

## Mejoras propuestas para la siguiente iteración

Son propuestas para discutir con el asesor. **No se implementó ninguna.**

### Prioridad alta

| Propuesta | Motivo y evidencia | Criterio de revisión |
| --- | --- | --- |
| Compactar la entrada de comunidad y los avisos fijados. | La actividad del alumno empieza en y≈1735 en escritorio y y≈2246 en móvil. 01, 02, 18 y 34a. | Evaluar una composición que muestre actividad de alumnos en el primer pantallazo o con un desplazamiento corto, manteniendo accesibles los avisos. |
| Reordenar reto, bienvenidas y reconocimientos en móvil. | Los bloques contextuales empiezan después de más de 10.000 px en Inicio. | Poder descubrir reto y reconocimientos antes de recorrer las quince publicaciones; comprobarlo a 375 y 320 px. |
| Reducir la longitud repetitiva de cada tarjeta. | Cinco botones, resumen de reacciones, recuento y vista previa se repiten a lo largo de todo el feed. | Comparar una variante compacta de acciones y vistas previas; conservar selección comprensible y controles accesibles. |
| Equilibrar el recorrido de escritorio. | La derecha termina cerca de y=1813 y el documento continúa hasta y≈8839. | Revisar una composición que mantenga el foco y aproveche el ancho al avanzar, sin rellenar espacio con contenido redundante. |
| Revisar tamaños de lectura móvil y metadatos. | Cuerpo de 13 px y metadatos de 11 px; 21a, 23b y 36b. | Probar cuerpo móvil de 14–16 px y auxiliares legibles; revisar contraste y alturas después de compactar la estructura. |

### Prioridad media

| Propuesta | Motivo y evidencia | Criterio de revisión |
| --- | --- | --- |
| Simplificar los controles y textos de demostración. | Varias capas superiores explican la simulación y retrasan el feed. | Conservar aviso inequívoco y selector accesible con menos altura y redacción repetida. |
| Mejorar la identificación visual de las reacciones. | Emoji y contador requieren interpretación; no hay desplegable. | Validar etiquetas o una interacción compacta que permita descubrir las cinco opciones con ratón, tacto y teclado. |
| Diferenciar la sección Galería como álbum. | 10a–10b reutilizan tarjetas completas y una columna larga. | Comparar una vista de miniaturas o agrupación que facilite explorar imágenes y abrir su publicación. |
| Diversificar el material ficticio y los recursos ilustrativos autorizados. | Tres fotografías se repiten y las voces usan un tono muy homogéneo. | Variar composición, extensión e intención de los mensajes sin usar datos auténticos de alumnos. |
| Revisar el diálogo móvil y la visibilidad de sus acciones. | En 30a falta el botón final; en 36b falta el encabezado. | Evaluar acciones o cierre persistentes dentro del diálogo; verificar que no tapen campos ni reduzcan demasiado el área útil. |
| Dar más autonomía visual a la cola de moderación. | 15b, 16b y 31b mezclan revisión extensa con el resto de la comunidad. | Distinguir con claridad qué se está revisando, cuántos pendientes quedan y qué cambió después de aprobar. |
| Acotar los mensajes de acciones a su contexto. | El mensaje de una reacción permanece al entrar en Retos. | Al cambiar de sección, que la información de estado siga siendo pertinente y accesible. |

### Prioridad baja

| Propuesta | Motivo |
| --- | --- |
| Ajustar la tarjeta lateral de perfil y el cierre del feed. | Su contenido aporta poco cambio durante un recorrido largo. |
| Afinar ritmo y alineaciones en fotografías compactas y pies. | La miniatura y el pie dejan superficies amplias con poca información. |
| Dar más jerarquía al equipo institucional dentro del directorio. | Los doce perfiles repiten una composición muy similar. |
| Revisar espaciados, bordes y acentos después de resolver la estructura. | El refinamiento visual rendirá más cuando estén decididas densidad y prioridades. |

## Comprobaciones realizadas y límites

| Comprobación en esta auditoría | Resultado |
| --- | --- |
| Rama y estado de Git antes del recorrido | `feat/community`; cambios previos de implementación conservados. |
| Servidor utilizado | Vite en desarrollo, `127.0.0.1:5173`, leyendo el código actual. |
| Cinco secciones en 1440, 1024, 768, 375 y 320 px | Navegación realizada; ancho desplazable igual al ancho cliente en las 25 combinaciones. |
| Filtros del feed | Recientes: 15; Logros: 3; Experiencias: 4; Más celebradas: 15, manteniendo fijados primero. |
| Reacciones | Clic real, contador 24 → 25 y `aria-pressed="true"`. |
| Comentarios | Conversación abierta y comentario ficticio añadido, visible con recuento actualizado a cuatro. |
| Carrusel | Cambio real entre imágenes 1 y 2, en escritorio y móvil. |
| Retos | Acierto, error, explicaciones y 35 puntos tras tres días; reconocimiento capturado. |
| Creación y aprobación de escritorio | Envío ficticio pendiente → tres pendientes en moderación → 16 aprobadas; nuevo envío visible tras los dos fijados. |
| Moderación móvil | Aprobación del ejemplo de Iris y aparición en el feed. |
| Diálogo móvil | Desplazamiento interno a 375 y 320 px; cierre con Escape. |
| Consola de Brave | Cero errores y cero advertencias registrados al consultar la sesión. |
| Recursos de las capturas | Figtree e imágenes ilustrativas cargadas; se esperó la decodificación en las capturas de detalle finales. |
| Integridad de archivos existentes | Comparación SHA-256 de 82 archivos de fuentes, documentación, scripts, referencia y archivos raíz: sin diferencias. |
| Código y referencia | No se editaron durante esta auditoría. |
| Dependencias y Git | No se instalaron dependencias ni se ejecutaron commit, push, merge o despliegue. |

No se reejecutaron `typecheck`, `lint` ni `build`: esta tarea consistió en observar y documentar la interfaz existente, sin cambios de implementación. No se presentan las pruebas de una iteración anterior como resultados de esta auditoría.

No se efectuó una auditoría WCAG completa, validación con lector de pantalla, revisión de seguridad, prueba sobre dispositivos físicos ni comprobación en otros navegadores. No se auditó el diseño de `/` o `/admin`. La vista «Moderador» capturada pertenece a `/community`, no a la página de administración independiente.

Las capturas dependen de los datos de demostración y de sus estados de sesión. Recargar restaura los ejemplos y no reproduce automáticamente los estados interactivos del ZIP.

## Inventario completo de capturas

Cada fila incluye la ruta real y el estado al capturarla. «Completa» significa captura del documento entero; las demás son encuadres de viewport, en ocasiones desplazados hasta una tarjeta o control.

### Escritorio: 1440 × 900

| Captura | Ruta | Viewport | PNG | Estado de la interfaz |
| --- | --- | --- | --- | --- |
| [01-inicio-escritorio.png](01-inicio-escritorio.png) | `/community` | 1440 × 900 | 1440 × 900 | Inicio · Alumno · estado inicial, sin interacciones |
| [02-inicio-completo.png](02-inicio-completo.png) | `/community` | 1440 × 900 · completa | 1425 × 8839 | Inicio completo · 15 publicaciones, dos fijadas · todas las fotografías cargadas |
| [02-inicio-segmento-01.png](02-inicio-segmento-01.png) | `/community` | 1440 × 900 | 1440 × 900 | Inicio · recorrido solapado del feed · segmento 1 |
| [02-inicio-segmento-02.png](02-inicio-segmento-02.png) | `/community` | 1440 × 900 | 1440 × 900 | Inicio · recorrido solapado del feed · segmento 2 |
| [02-inicio-segmento-03.png](02-inicio-segmento-03.png) | `/community` | 1440 × 900 | 1440 × 900 | Inicio · recorrido solapado del feed · segmento 3 |
| [02-inicio-segmento-04.png](02-inicio-segmento-04.png) | `/community` | 1440 × 900 | 1440 × 900 | Inicio · recorrido solapado del feed · segmento 4 |
| [02-inicio-segmento-05.png](02-inicio-segmento-05.png) | `/community` | 1440 × 900 | 1440 × 900 | Inicio · recorrido solapado del feed · segmento 5 |
| [02-inicio-segmento-06.png](02-inicio-segmento-06.png) | `/community` | 1440 × 900 | 1440 × 900 | Inicio · recorrido solapado del feed · segmento 6 |
| [02-inicio-segmento-07.png](02-inicio-segmento-07.png) | `/community` | 1440 × 900 | 1440 × 900 | Inicio · recorrido solapado del feed · segmento 7 |
| [02-inicio-segmento-08.png](02-inicio-segmento-08.png) | `/community` | 1440 × 900 | 1440 × 900 | Inicio · recorrido solapado del feed · segmento 8 |
| [02-inicio-segmento-09.png](02-inicio-segmento-09.png) | `/community` | 1440 × 900 | 1440 × 900 | Inicio · recorrido solapado del feed · segmento 9 |
| [02-inicio-segmento-10.png](02-inicio-segmento-10.png) | `/community` | 1440 × 900 | 1440 × 900 | Inicio · recorrido solapado del feed · segmento 10 |
| [02-inicio-segmento-11.png](02-inicio-segmento-11.png) | `/community` | 1440 × 900 | 1440 × 900 | Inicio · recorrido solapado del feed · segmento 11 |
| [03a-avisos-fijados.png](03a-avisos-fijados.png) | `/community` | 1440 × 900 | 1440 × 900 | Primer aviso institucional fijado · conversación plegada |
| [03b-aviso-fijado-imagen.png](03b-aviso-fijado-imagen.png) | `/community` | 1440 × 900 | 1440 × 900 | Segundo aviso fijado · fotografía compacta |
| [04-post-texto.png](04-post-texto.png) | `/community` | 1440 × 900 | 1440 × 900 | Dani Notes · publicación de texto · conversación plegada |
| [05-post-imagen.png](05-post-imagen.png) | `/community` | 1440 × 900 | 1440 × 900 | Teo Talks · imagen compacta de escritorio |
| [06a-post-galeria.png](06a-post-galeria.png) | `/community` | 1440 × 900 | 1440 × 900 | Vale Vocab · carrusel en imagen 1 de 3 |
| [06b-post-galeria-segunda-imagen.png](06b-post-galeria-segunda-imagen.png) | `/community` | 1440 × 900 | 1440 × 900 | Vale Vocab · carrusel navegado a imagen 2 de 3 |
| [07a-comentarios.png](07a-comentarios.png) | `/community` | 1440 × 900 | 1440 × 900 | Dani Notes · conversación expandida con tres comentarios ficticios |
| [07c-comentario-nuevo.png](07c-comentario-nuevo.png) | `/community` | 1440 × 900 | 1440 × 900 | Conversación de Dani · cuarto comentario recién añadido por Alex Demo |
| [08a-reacciones-disponibles.png](08a-reacciones-disponibles.png) | `/community` | 1440 × 900 | 1440 × 900 | Cinco reacciones visibles · no existe selector desplegable |
| [08b-reaccion-seleccionada.png](08b-reaccion-seleccionada.png) | `/community` | 1440 × 900 | 1440 × 900 | Me encanta seleccionada · Luna Azul · contador 24 → 25 |
| [09a-logros.png](09a-logros.png) | `/community` | 1440 × 900 | 1440 × 900 | Sección Logros · tres publicaciones · comienzo |
| [09b-logros-completo.png](09b-logros-completo.png) | `/community` | 1440 × 900 · completa | 1425 × 2209 | Sección Logros completa · tres publicaciones |
| [10a-galeria.png](10a-galeria.png) | `/community` | 1440 × 900 | 1440 × 900 | Sección Galería · seis publicaciones con imágenes · comienzo |
| [10b-galeria-carrusel.png](10b-galeria-carrusel.png) | `/community` | 1440 × 900 | 1440 × 900 | Sección Galería · carrusel de Vale en imagen 2 de 3 |
| [11a-reto-inicial.png](11a-reto-inicial.png) | `/community` | 1440 × 900 | 1440 × 900 | Sección Retos · día 1 · sin responder |
| [11b-reto-inicial-completo.png](11b-reto-inicial-completo.png) | `/community` | 1440 × 900 · completa | 1425 × 1315 | Sección Retos completa · sin respuesta ni puntos |
| [11c-reto-inicial-detalle.png](11c-reto-inicial-detalle.png) | `/community` | 1440 × 900 | 1440 × 900 | Reto día 1 completo en viewport · sin responder |
| [12a-reto-correcto.png](12a-reto-correcto.png) | `/community` | 1440 × 900 | 1440 × 900 | Día 1 · respuesta correcta · explicación y 15 puntos |
| [12b-reto-incorrecto.png](12b-reto-incorrecto.png) | `/community` | 1440 × 900 | 1440 × 900 | Día 2 · respuesta incorrecta · explicación · 20 puntos acumulados |
| [12c-reto-resuelto-reconocimiento.png](12c-reto-resuelto-reconocimiento.png) | `/community` | 1440 × 900 | 1440 × 900 | Día 3 · respuesta correcta · 35 puntos · tres días · Constancia que inspira |
| [12d-retos-resueltos-completo.png](12d-retos-resueltos-completo.png) | `/community` | 1440 × 900 · completa | 1425 × 1441 | Retos completo · reconocimiento tras tres días simulados |
| [13a-alumnos.png](13a-alumnos.png) | `/community` | 1440 × 900 | 1440 × 900 | Directorio de doce perfiles ficticios · comienzo |
| [13b-alumnos-completo.png](13b-alumnos-completo.png) | `/community` | 1440 × 900 · completa | 1425 × 2130 | Directorio completo · once alumnos y Equipo CAI · Alex con reconocimiento |
| [14a-crear-publicacion.png](14a-crear-publicacion.png) | `/community` | 1440 × 900 | 1440 × 900 | Diálogo de creación · campos vacíos · Alumno |
| [14b-crear-publicacion-rellena.png](14b-crear-publicacion-rellena.png) | `/community` | 1440 × 900 | 1440 × 900 | Diálogo listo para enviar · datos exclusivamente ficticios · una imagen ilustrativa |
| [15a-moderador.png](15a-moderador.png) | `/community` | 1440 × 900 | 1440 × 900 | Moderador demo · comienzo · tres publicaciones pendientes |
| [15b-moderador-cola.png](15b-moderador-cola.png) | `/community` | 1440 × 900 | 1440 × 900 | Moderador demo · cola de revisión · tres pendientes |
| [16a-publicacion-pendiente-alumno.png](16a-publicacion-pendiente-alumno.png) | `/community` | 1440 × 900 | 1440 × 900 | Alumno · nuevo envío pendiente · 15 publicaciones aprobadas |
| [16b-publicacion-pendiente-moderador.png](16b-publicacion-pendiente-moderador.png) | `/community` | 1440 × 900 | 1440 × 900 | Moderador demo · nuevo envío pendiente · acciones Aprobar y Rechazar |
| [17a-publicacion-aprobada-estado.png](17a-publicacion-aprobada-estado.png) | `/community` | 1440 × 900 | 1440 × 900 | Alumno · envío aprobado · contador 16 · estado visible |
| [17b-publicacion-aprobada-feed.png](17b-publicacion-aprobada-feed.png) | `/community` | 1440 × 900 | 1440 × 900 | Feed · publicación ficticia aprobada · situada tras los dos avisos fijados |

### Móvil: 375 × 812

| Captura | Ruta | Viewport | PNG | Estado de la interfaz |
| --- | --- | --- | --- | --- |
| [18-inicio-movil.png](18-inicio-movil.png) | `/community` | 375 × 812 | 375 × 812 | Inicio · Alumno · 375 px · estado inicial restaurado al recargar |
| [19-navegacion-visible-movil.png](19-navegacion-visible-movil.png) | `/community` | 375 × 812 | 375 × 812 | Navegación móvil real · cinco botones siempre visibles · no existe menú desplegable |
| [20-aviso-fijado-movil.png](20-aviso-fijado-movil.png) | `/community` | 375 × 812 | 375 × 812 | Primer aviso fijado · móvil |
| [21a-post-fotografia-movil.png](21a-post-fotografia-movil.png) | `/community` | 375 × 812 | 375 × 812 | Nico Norte · fotografía mediana cargada y decodificada · móvil |
| [21b-post-imagen-compacta-movil.png](21b-post-imagen-compacta-movil.png) | `/community` | 375 × 812 | 375 × 812 | Teo Talks · fotografía compacta y pie apilado · móvil |
| [22-post-texto-movil.png](22-post-texto-movil.png) | `/community` | 375 × 812 | 375 × 812 | Dani Notes · texto sin imagen · móvil |
| [23a-comentarios-publicacion-movil.png](23a-comentarios-publicacion-movil.png) | `/community` | 375 × 812 | 375 × 812 | Dani Notes · conversación expandida · cabecera del post en móvil |
| [23b-comentarios-formulario-movil.png](23b-comentarios-formulario-movil.png) | `/community` | 375 × 812 | 375 × 812 | Dani Notes · tres comentarios y formulario de respuesta · móvil |
| [24a-galeria-movil.png](24a-galeria-movil.png) | `/community` | 375 × 812 | 375 × 812 | Vale Vocab · galería imagen 1 de 3 · móvil |
| [24b-galeria-segunda-imagen-movil.png](24b-galeria-segunda-imagen-movil.png) | `/community` | 375 × 812 | 375 × 812 | Vale Vocab · galería imagen 2 de 3 · móvil |
| [25a-retos-inicio-movil.png](25a-retos-inicio-movil.png) | `/community` | 375 × 812 | 375 × 812 | Sección Retos · día 1 sin responder · comienzo móvil |
| [25b-reto-diario-movil.png](25b-reto-diario-movil.png) | `/community` | 375 × 812 | 375 × 812 | Reto día 1 · pregunta, opciones y botón · móvil |
| [26-reto-resuelto-movil.png](26-reto-resuelto-movil.png) | `/community` | 375 × 812 | 375 × 812 | Día 1 correcto · explicación · 15 puntos · primer reconocimiento · móvil |
| [27-constancia-reconocimiento-movil.png](27-constancia-reconocimiento-movil.png) | `/community` | 375 × 812 | 375 × 812 | Día 3 resuelto · 35 puntos · Constancia que inspira · móvil |
| [28a-bienvenidos-reconocimientos-movil.png](28a-bienvenidos-reconocimientos-movil.png) | `/community` | 375 × 812 | 375 × 812 | Bloques Bienvenidos a CAI y Logros de la semana · móvil |
| [28b-contenido-celebrado-movil.png](28b-contenido-celebrado-movil.png) | `/community` | 375 × 812 | 375 × 812 | Bloque de publicaciones más celebradas · móvil |
| [29a-alumnos-inicio-movil.png](29a-alumnos-inicio-movil.png) | `/community` | 375 × 812 | 375 × 812 | Sección Alumnos · comienzo móvil |
| [29b-alumnos-perfiles-movil.png](29b-alumnos-perfiles-movil.png) | `/community` | 375 × 812 | 375 × 812 | Directorio · perfiles y reconocimiento de Alex · móvil |
| [30a-crear-publicacion-movil.png](30a-crear-publicacion-movil.png) | `/community` | 375 × 812 | 375 × 812 | Diálogo de publicación · móvil · campos vacíos · comienzo |
| [30b-crear-publicacion-final-movil.png](30b-crear-publicacion-final-movil.png) | `/community` | 375 × 812 | 375 × 812 | Diálogo móvil · selección de imágenes y acción de revisión |
| [31a-moderador-inicio-movil.png](31a-moderador-inicio-movil.png) | `/community` | 375 × 812 | 375 × 812 | Moderador demo · móvil · comienzo · dos pendientes preparados |
| [31b-moderador-cola-movil.png](31b-moderador-cola-movil.png) | `/community` | 375 × 812 | 375 × 812 | Cola de moderación móvil · dos ejemplos preparados |
| [32-publicacion-pendiente-movil.png](32-publicacion-pendiente-movil.png) | `/community` | 375 × 812 | 375 × 812 | Iris Ideas · pendiente · Aprobar y Rechazar · móvil |
| [33-publicacion-aprobada-movil.png](33-publicacion-aprobada-movil.png) | `/community` | 375 × 812 | 375 × 812 | Iris Ideas · publicación aprobada visible en feed · móvil |

### Móvil: 320 × 812

| Captura | Ruta | Viewport | PNG | Estado de la interfaz |
| --- | --- | --- | --- | --- |
| [34a-inicio-320-movil.png](34a-inicio-320-movil.png) | `/community` | 320 × 812 | 320 × 812 | Inicio · Alumno · 320 px · estado inicial restaurado |
| [34b-filtros-320-movil.png](34b-filtros-320-movil.png) | `/community` | 320 × 812 | 320 × 812 | Inicio a 320 px · filtros en dos filas y comienzo del primer aviso |
| [35-reto-320-movil.png](35-reto-320-movil.png) | `/community` | 320 × 812 | 320 × 812 | Reto día 1 sin responder · 320 px |
| [36a-formulario-320-movil.png](36a-formulario-320-movil.png) | `/community` | 320 × 812 | 320 × 812 | Diálogo de publicación · 320 px · comienzo |
| [36b-formulario-final-320-movil.png](36b-formulario-final-320-movil.png) | `/community` | 320 × 812 | 320 × 812 | Diálogo de publicación · 320 px · imágenes y botón final |

### Anchos intermedios

| Captura | Ruta | Viewport | PNG | Estado de la interfaz |
| --- | --- | --- | --- | --- |
| [37-inicio-tableta-1024.png](37-inicio-tableta-1024.png) | `/community` | 1024 × 900 | 1024 × 900 | Inicio · 1024 × 900 · navegación horizontal y dos columnas |
| [38-inicio-tableta-768.png](38-inicio-tableta-768.png) | `/community` | 768 × 900 | 768 × 900 | Inicio · 768 × 900 · navegación horizontal y contenido apilado |

## Integridad y entrega

Al comenzar ya estaban modificados `README.md`, `src/app/router.tsx` y `src/pages/CommunityPage.tsx`; también existían sin seguimiento `docs/community-implementation.md`, `scripts/`, `src/features/community/` y `src/layouts/CommunityLayout.tsx`. Esos cambios pertenecen al trabajo previo y se conservaron.

Las únicas incorporaciones de esta auditoría son los 75 PNG, este informe y el ZIP dentro de `review/`. No se modificaron archivos de código ni archivos de `reference/`. No se realizaron commits, push, merge ni despliegue.

Para compartir, enviar `CAI-Community-Revision-Visual.zip`. Extraerlo y abrir `REVISION-VISUAL.md` junto a las imágenes. La revisión puede empezar por las cuatro capturas indicadas al principio y seguir por las prioridades altas antes de discutir una nueva propuesta.

