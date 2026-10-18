# CAI Community · Fase 6.2-A · Inicio

## Alcance y base comprobada

La subronda implementada es **6.2-A: Inicio**. **6.2-B: Galería queda pendiente de aprobación explícita.** Rama comprobada al empezar: `feat/community-visual-polish`; carpeta `C:\Users\feral\Proyectos\CAI_Enterprices\CAI_Enterprices`; HEAD de partida `a8f4d91`.

**Estado actual:** fase 6.2-A completa, incluido el ajuste móvil, aprobada por el usuario. Respaldo autorizado mediante commit y push exclusivamente a `origin/feat/community-visual-polish`. Galería sigue pendiente. [Comparativas locales del ajuste](../review/community-phase-6-2/mobile-hero-adjustment/index.html). Las cifras y capturas de la implementación inicial se conservan como histórico; las medidas móviles vigentes figuran al final de este documento.

**Evidencias locales excluidas del respaldo:** los enlaces de este informe a `review/` requieren los archivos de revisión del entorno original; no se incluyen en Git. También se excluyen `.playwright-mcp/`, `design-reference/`, `reference/` y archivos temporales. Las menciones posteriores a entregas «sin commit ni push» describen los puntos de revisión anteriores a esta aprobación.

La fase 6.1 estaba guardada en `2116677` y `a8f4d91`. No había modificaciones de archivos rastreados. Las carpetas sin seguimiento de referencias, herramientas y revisiones anteriores se conservaron. Se leyeron AGENTS, visión, requisitos, plan de prototipo, informes de fases 2/4/6.1 y la revisión visual de 6.1. Motion, Lucide y ambos SVG de insignias continuaban presentes.

Se abrieron los PNG aprobados de Inicio y Galería. La consulta de HOME `3:2` en Figma devolvió el límite del plan Starter: no se obtuvieron capas ni recursos de esa API. La referencia efectiva es el PNG local, con libertad de transformación editorial expresamente autorizada en esta tarea. Las cuatro capturas anteriores se tomaron en Brave antes de editar código.

## Dirección y arquitectura visual

70 % claridad de producto y edición; 30 % expresión de comunidad. Se mantienen Figtree, marino, azul institucional, amarillo, temas y navegación. El hero funciona como una doble página: titular grande con cierre amarillo, texto conciso, CTA principal y secundario, y una composición ilustrada con cartela propia. Cada diapositiva tiene una escena: conversación colectiva, libreta de práctica o escalones de progreso. Son ilustraciones originales, nunca fotografías de estudiantes ni registros de eventos.

La ilustración deja de estar detrás de una cartela flotante. Imagen, leyenda y controles ocupan espacios separados. La relación de aspecto y la altura reservada del texto mantienen estable el carrusel al cambiar de diapositiva. En escritorio se reparten texto y póster; en tablet la cartela acompaña lateralmente al póster y en móvil se apilan. Los botones siguen accesibles durante las transiciones.

El diario usa un encabezado editorial y conserva filtros, cantidades y orden. Las historias de logros reciben una jerarquía mayor, metadatos compactos y un hito con medallón gráfico; las experiencias musicales usan una portada de disco, las fotos tienen recorte controlado y etiqueta ilustrativa. Los encuentros muestran su fecha y los contenidos institucionales se distinguen por autor y tratamiento cromático, sin crear categorías nuevas.

Los módulos dejan de repetir la misma tarjeta: aviso con margen azul, reto de alto contraste con esquina expresiva, bienvenida abierta con perfiles y reconocimiento amarillo con sello. El contenido y los puntos proceden de los mismos selectores y estado. El sello de reconocimiento es decorativo: no concede una insignia.

En oscuro se reutilizan los tokens de papel, tinta, bordes, acentos y sombras de 6.1. Los pósteres de marca, el reto azul y el reconocimiento amarillo conservan su paleta ilustrativa y tinta contrastada. El resto del feed adopta las superficies oscuras existentes. No hay estilos globales ni cambios en otras áreas.

## Archivos

| Archivo | Cambio |
| --- | --- |
| `src/features/community/home/HomeHero.tsx` | Composición, entrada y transición Motion, recurso con fallback y crédito, controles conservados. |
| `src/features/community/home/HomeView.tsx` | Encabezado, estado anunciado de conteo, transición de filtros, acción Motion y estado vacío. |
| `src/features/community/home/EditorialPostCard.tsx` | Formatos editoriales, diferenciación institucional, fecha de evento, respuesta a reacción y elevación Motion. |
| `src/features/community/home/HomeCommunityPanels.tsx` | Reto, bienvenida y reconocimiento; mismos datos, enlaces y handlers. |
| `src/features/community/home/data.ts` | Identificadores del hero tipados contra el manifiesto; crédito opcional compatible. |
| `src/features/community/home/home.module.css` | Estilos locales reorganizados; composición, temas heredados, estados, accesibilidad y responsive. |
| `src/features/community/home/media.ts` | Nuevo manifiesto de las tres posiciones de medios del hero. |
| `src/assets/community/home/together.svg` | Collage original de conversación y cartel tipográfico. |
| `src/assets/community/home/practice.svg` | Libreta original de práctica y audífonos. |
| `src/assets/community/home/celebrate.svg` | Cartel original de progreso con escalones y medalla ilustrada. |
| `scripts/check-community-home-premium.browser.mjs` | Nueva regresión de presentación e interacciones de Inicio para el navegador existente. |
| `scripts/check-community-mobile-hero.browser.mjs` | Regresión del ajuste móvil, teclado y comparación opcional de geometría anterior. |
| `docs/community-phase-6-2.md` | Este informe. |

No se modifican paquetes, lockfile, modelo, fixtures guardados, permisos, reglas, componentes de Galería/Retos/Logros, landing, administración, `reference/` ni los PNG aprobados. El respaldo autorizado incluye únicamente los 13 archivos de la tabla. No incluye merge ni despliegue.

## Sustitución posterior por fotografía autorizada

`home/media.ts` declara IDs estables (`home-hero-community`, `home-hero-practice`, `home-hero-progress`), ruta, texto alternativo, crédito y dimensiones. Para reemplazar una escena se cambia su recurso y metadatos allí, o se proporciona `HeroSlide.image` con `src`, `alt` y crédito. La propiedad anterior `image: { src, alt }` sigue siendo compatible; conviene añadir crédito explícito al integrar cualquier foto. No se reescribe el layout.

Las fotos de publicaciones, eventos y álbumes ya comparten IDs estables, `src`, `alt` y `caption` mediante `Photo` y `photoLibrary` en `data/fixtures.ts`. Se conserva esa fuente única; no se duplica el catálogo en otro manifiesto. `StockImage` conserva su fallback, dimensiones y carga diferida. El nuevo fallback del hero mantiene la composición y el control de diapositivas cuando falla el recurso.

Esta subronda no desarrolla portadas ni imágenes internas de Galería. Su integración visual corresponde a 6.2-B; el contrato de datos existente se conserva. No hay CMS, subida, descarga de Instagram, fotos nuevas de stock ni rostros generados. El feed sigue usando las fotografías ilustrativas existentes; la atribución completa permanece en el detalle. Las fotos oficiales aún deben seleccionarse, entregarse y autorizarse.

## Movimiento, accesibilidad y carga

Se reutilizan `CommunityMotion`, `MotionButton`, `MotionCard`, `MotionFeedback` y los tokens existentes. Entrada del hero de opacidad, cambio de póster con 10 px de desplazamiento y opacidad (320 ms), respuesta al pulsar y reacción, elevación de 3 px en hover, filtro con opacidad breve y apertura del compositor con 8 px/opacidad. No hay secuencias de entrada por tarjeta, parallax, scroll-jacking ni animación decorativa permanente.

Una guardia CSS local impide también las transformaciones de gestos al activar movimiento reducido durante la visita. La versión instalada del hook de Motion conserva el valor al montar; por eso se comprueba el movimiento normal tras cargar con esa preferencia y la reducción en vivo mediante la guardia local. No se modifican las primitivas compartidas ni se cambia su comportamiento en otras áreas.

`prefers-reduced-motion` desactiva transformaciones/transiciones locales y autoavance. Se conserva la pausa del carrusel por foco, hover, pestaña oculta o elección manual. El avance automático mantiene ocho segundos y exige reactivación explícita tras navegar manualmente.

La preferencia del carrusel usa ahora `useSyncExternalStore`: vuelve a leer el valor al suscribirse. Así se evita perder un cambio de preferencia ocurrido entre el primer render y el efecto, caso detectado al alternar la emulación durante una recarga. Es una corrección local de sincronización de presentación; no cambia intentos, puntos, permisos ni el contrato del carrusel.

Se mantienen encabezados semánticos, nombres de botones, alternativas de imagen, filtros con `aria-pressed`, indicador con `aria-current`, foco visible y navegación de diálogos compartida. El nuevo conteo de filtro usa `role=status`. Los SVG se muestran con alt contextual; adornos, sellos y números redundantes no se anuncian. Los controles principales tienen al menos 44 px de altura; los indicadores conservan un ancho más compacto en el carrusel. No se presenta la comprobación automatizada como auditoría integral de accesibilidad.

Los tres SVG se importan con `?no-inline`: son archivos locales independientes de 2,01–2,35 kB cada uno, evitando incrustarlos en el bloque JavaScript inicial. Solo se solicita el póster actual, sin precargar todos los álbumes. La imagen principal declara dimensiones y prioridad alta; las fotos del feed conservan lazy loading. No se añaden fuentes ni dependencias.

## Validación y comparación

Los resultados finales y las capturas se registran en [el índice visual](../review/community-phase-6-2/index.html). La nueva prueba usa el preview de producción a `127.0.0.1:4173`; el escenario vacío necesita además Vite en `127.0.0.1:5173`.

Para revisar la app: ejecutar `npm.cmd run build` y después `npm.cmd run preview -- --host 127.0.0.1 --port 4173`; abrir `/community`. Para reproducir también el fixture vacío, iniciar en otra terminal `npm.cmd run dev -- --host 127.0.0.1 --port 5173`. El script `.browser.mjs` es una función para `browser_run_code_unsafe` del navegador aislado, no un ejecutable de Node; puede recibir `screenshotDir` absoluto. El índice HTML se puede abrir directamente, sin servidor.

El escenario vacío usa una página aislada del navegador con una respuesta interceptada del módulo de fixtures de desarrollo para entregar arrays vacíos antes de inicializar el provider. No altera archivos, permisos, reducer ni el bundle de producción, ni crea un acceso de prueba en la aplicación. La evidencia se identifica como fixture de prueba. El fallback del hero se comprueba abortando intencionalmente solo la petición de su SVG; el error de red esperado se separa de errores inesperados.

| Comprobación ejecutada | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Correcto. |
| `npm.cmd run lint` | Correcto, sin advertencias. No hay Prettier configurado. |
| `npm.cmd run build` | Correcto, sin advertencia de tamaño. |
| `node scripts/check-community-model.mjs` | 29 comprobaciones + 4 igualdades correctas. |
| `node scripts/check-community-publication.mjs` | 23 comprobaciones correctas. |
| `node scripts/check-community-challenges.mjs` | 27 comprobaciones + 1 igualdad correctas. |
| `node scripts/check-community-gallery.mjs` | 25 comprobaciones + 4 igualdades correctas. |
| `node scripts/check-community-achievements.mjs` | 51 comprobaciones + 4 igualdades correctas. |
| Compositor existente · Brave / dev | 19 comprobaciones correctas. |
| Retos existente · Brave / dev | 30 comprobaciones correctas. |
| Galería existente · Brave / dev | 40 comprobaciones correctas. |
| Logros existente · Brave / preview | 55 comprobaciones correctas. |
| Inicio premium · Brave / preview final | **141 comprobaciones correctas**, cero errores/advertencias inesperados. [Registro detallado](../review/community-phase-6-2/resultados-inicio.json). |
| Visual 6.1 existente · Opera GX / preview | 32 comprobaciones correctas, cero errores/advertencias. Incluye Motion, Lucide, carga de ambas insignias originales, gestos, teclado, temas y movimiento reducido. |
| Compatibilidad adicional · Opera GX / preview | Seis combinaciones de 1440/375/320 y claro/oscuro sin overflow. Carrusel, foco del feed, compositor/Escape y acceso a Retos correctos; sin errores de ejecución. |
| Contraste · Opera GX / preview | Once pares sólidos por tema medidos con colores computados: mínimo 4,63:1, máximo 12,64:1. [Registro](../review/community-phase-6-2/contraste.json). No cubre toda la interfaz. |
| Reflujo equivalente a 200 % · Opera GX / preview | Simulación de 1440 píxeles físicos mediante 720 CSS y DPR 2, sin overflow en ambos temas. Los atajos de zoom nativo no cambiaron la escala; no se afirma haber probado ese control nativo. [Registro](../review/community-phase-6-2/reflow.json). |
| `git diff --check` | Correcto. Git muestra avisos de normalización LF/CRLF y acceso denegado a su ignore global; no impidieron los checks. |

La nueva regresión comprueba las tres diapositivas en los cinco anchos y ambos temas: 30 estados con imagen local cargada, alt, cartela sin desbordamiento, ancho estable y altura del hero invariable entre diapositivas. Comprueba asimismo filtros, selección anunciada, trece historias, foco tras revelar cuatro, cinco reacciones y totales 86 → 87 → 87 → 86, comentario y contador 4 → 5, perfil sobre detalle, Tab inverso, Escape y retorno de foco, aviso siguiente, composición, pendiente fuera del feed, aprobación con autor Alex, séptimo álbum derivado, reinicio, vacío, fallback, pausa por foco, avance a los ocho segundos, pausa explícita y persistencia del tema.

La prueba adicional de gesto en Inicio midió aproximadamente −3 px al pasar el puntero y 0 px al activar reducción de movimiento en vivo. Tab muestra un anillo amarillo de 3 px en el hero. La recaptura final verificó también que los márgenes derechos reales permanecieran en 72/51,19/38,39/16/12 px para los cinco anchos. [Registro de capturas y gestos](../review/community-phase-6-2/capturas-y-gestos.json).

Build final medido: JavaScript principal **491,67 kB** (**153,06 kB gzip**); bloque diferido de Motion **46,65 kB** (**17,82 kB gzip**); CSS **185,52 kB** (**34,21 kB gzip**). SVG independientes: **2,10**, **2,35** y **2,01 kB**. Son tamaños de build; no son mediciones de tiempo de carga ni Web Vitals.

Durante la primera ejecución de Logros en desarrollo se produjeron recargas de módulos y falló la comprobación de la colección combinada. Se repitió el script original, sin editarlo, sobre el build estable de producción: 55/55 correctas. La prueba de Retos también permitió conservar su contrato del párrafo de pregunta: la nueva introducción editorial es un `span`, manteniendo un solo párrafo de pregunta.

La nueva prueba detectó un desbordamiento mínimo de la cartela del hero: se corrigió la caja de su etiqueta, que antes heredaba una línea más alta. Se investigó además un cambio aparente de 10 px tras capturar página completa: Chromium/Windows retiraba temporalmente la barra, cambiando el ancho útil en 15 px. El procedimiento de captura reserva el gutter nativo solo mientras toma la imagen y restaura el viewport antes de comparar alturas. No se cambia el CSS del producto, no se oculta contenido ni se relaja la comprobación. Se espera explícitamente a fuentes, imágenes y al foco programado con `requestAnimationFrame` para comprobar estados asentados.

Hay **23 PNG**: cuatro anteriores, diez vistas generales finales, siete estados/componentes finales y dos primeras iteraciones conservadas. Las imágenes completas finales de 375 px tienen 360 px útiles por la barra nativa; su contenido pasa de 3468 px de alto antes a 4663 px después. Este crecimiento es visible y se deja como aspecto a evaluar, no como una mejora de rendimiento.

El índice se abrió en Brave desde `file://`: cargaron sus 15 imágenes sin recursos rotos. La comprobación de sus 60 referencias locales, incluidos los enlaces de navegación, encontró cero destinos de archivo ausentes. Se conservan las dos primeras iteraciones como evidencia de refinamiento, sin presentarlas como resultados finales.

Antes de las capturas completas se desplazó realmente la página hasta la fotografía del feed y se esperó su decodificación: la captura de toda la página por sí sola no activa siempre los medios con lazy loading. Las diez vistas generales finales se comprobaron con esa fotografía cargada; no se cambia la política de carga del producto.

## Evaluación y pendientes

La transformación busca una diferencia visible en tipografía, protagonistas gráficos, composición y ritmo, conservando toda la información y los flujos. Las capturas permiten comparar el mismo escenario inicial, el mismo ancho y el mismo tema. Tablet y móvil son adaptaciones propias; no existe un PNG aprobado específico para ellas ni para oscuro.

La lectura móvil es más larga al dar espacio real al póster y mantener todas las secciones. El orden visual heredado intercala el reto tras la primera historia; la lectura semántica del DOM mantiene el feed unido. Conviene validar ese orden con lector de pantalla antes de producción. Las capturas no sustituyen una revisión del movimiento en navegador.

Siguen pendientes las fotografías oficiales, validación del cliente, revisión formal con lector de pantalla y dispositivos físicos. No se han medido Web Vitals ni rendimiento en redes móviles reales. La aplicación sigue siendo un prototipo con datos ficticios, sin seguridad de roles real ni persistencia de publicaciones.

**Punto de control: detenerse tras presentar Inicio; no implementar Galería sin aprobación.**

## Ajuste final: composición móvil del hero

El usuario aprobó la dirección artística y solicitó únicamente reducir el recorrido vertical del hero a 375/320 antes de comenzar Galería. Se comprobó de nuevo la rama `feat/community-visual-polish`, la carpeta y el estado Git: el trabajo previo de 6.2-A seguía sin commit y se preservó.

Solo cambia el CSS del hero en `@media (max-width: 600px)` y su ajuste de 360 px. No se modifican JSX, textos, datos, SVG, funciones, temporizadores ni primitivas compartidas. Los CTA pasan a dos columnas; se agrupan reproducción, indicadores y anterior/siguiente en una sola fila, conservando su orden en el DOM y por teclado. La etiqueta del carrusel y el número de escena siguen visibles arriba.

Se reducen márgenes, padding y altura reservada de la cartela, que continúa siendo estable para los tres contenidos. El póster usa un marco moderadamente menor con `object-fit: contain`: cada ilustración se conserva íntegra. Los CTA mantienen 48 px de alto y los controles 44 px; los indicadores amplían su ancho móvil a 34 px. Los textos de botones pueden usar dos líneas sin recortes. No se oculta información ni se cambia el tamaño del titular, cuerpo o subtítulos; la nota de apoyo a 320 incluso pasa de 9 a 10 px.

| Viewport · ambos temas | Hero anterior | Hero final | Reducción | Titular, antes/después |
| --- | --- | --- | --- | --- |
| 375 px | 935,9 px | **775,5 px** | **160,4 px · 17,1 %** | 36,375 px |
| 320 px | 922,9 px | **764,3 px** | **158,6 px · 17,2 %** | 32 px |

Las medidas completas no redondeadas están en [reducciones.json](../review/community-phase-6-2/mobile-hero-adjustment/reducciones.json). El encabezado del feed se adelanta de 1348,6 a 1188,1 px a 375 y de 1335,5 a 1177,0 px a 320. La primera historia se adelanta exactamente los mismos 160,4/158,6 px: no se cambian su contenido ni su posición relativa dentro del feed.

La comparación automática en 1440, 1024 y 768 px, claro/oscuro, mantiene exactamente la geometría anterior del hero, su tipografía principal, sus elementos y el inicio del feed. La comparación SHA-256 de **103 archivos de `src/`** detecta únicamente `src/features/community/home/home.module.css` modificado durante este ajuste. Los tres SVG y toda la lógica previa conservan sus hashes.

Archivos propios de este ajuste:

- `src/features/community/home/home.module.css`: exclusivamente composición responsive del hero.
- `scripts/check-community-mobile-hero.browser.mjs`: prueba específica de geometría, texto íntegro, controles, comparación con escritorio, foco/teclado y CTA.
- `docs/community-phase-6-2.md`: este registro y enlace al estado vigente.
- `review/community-phase-6-2/index.html`: enlace al ajuste móvil.
- `review/community-phase-6-2/mobile-hero-adjustment/`: cuatro PNG antes, cuatro después, una revisión intermedia, índice y registros de medidas/pruebas/hashes; copia del CSS anterior. No se sobrescriben las capturas históricas de 6.2-A.

Validación efectuada sobre el build actualizado:

- `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`: correctos, sin advertencia de tamaño.
- Nueva regresión específica en Brave: **171 comprobaciones correctas**, cero errores/advertencias. Incluye las tres diapositivas en los dos tamaños móviles y ambos temas, ausencia de desbordamientos y superposiciones, textos dentro de sus cajas, CTA íntegros, altura estable, imágenes completas, foco visible, orden de Tab/Enter, navegación de escenas, control de reproducción y reducción de movimiento en vivo. Los CTA de feed y Retos conservan su destino.
- Script existente `check-community-home-premium.browser.mjs`, sin modificar: **141 comprobaciones correctas**, cero errores/advertencias. Comprueba además autoavance de ocho segundos, pausas, filtros, reacciones, comentarios, perfiles, publicación/moderación, álbum derivado, reinicio y estados vacío/error.
- Opera GX: comprobación básica en 375/320 y ambos temas; mismas alturas que Brave, sin overflow y con siguiente diapositiva funcional. [Registro](../review/community-phase-6-2/mobile-hero-adjustment/opera-gx.json). No es una regresión completa en ese navegador.
- Los registros completos se encuentran en el índice del ajuste. Las capturas reservan el gutter nativo y cargan los medios diferidos con un scroll real, tal como el procedimiento anterior.
- Índice específico abierto en Brave desde archivo local: ocho imágenes cargadas, cuatro pares de comparación y cero imágenes rotas. La comprobación de sus 40 referencias no encontró destinos de archivo ausentes.

La prueba específica se puede ejecutar directamente con `browser_run_code_unsafe` pasando su ruta mediante `filename`: verifica el estado final sin necesitar `review/`. Opcionalmente acepta el contenido local de `mobile-hero-adjustment/antes.json` mediante su argumento `before` para añadir la comparación con escritorio y la reducción respecto al estado anterior; ese registro histórico se excluye de Git. `screenshotDir` permite regenerar las cuatro capturas finales sin sobrescribir las anteriores.

No se realizan nuevas regresiones completas de Galería, Retos o Logros en este ajuste limitado: sus fuentes no cambian y se comprueban los enlaces y flujos relevantes desde Inicio. No se prueban dispositivos físicos ni un lector de pantalla formal. Se conserva el alcance de prototipo y las fotografías institucionales siguen pendientes.

**Entrega para revisión: ajuste móvil terminado; Galería no iniciada. Sin commit, push ni merge.**

## Validación del respaldo aprobado · 18 de octubre de 2026

El usuario aprobó Inicio y su ajuste móvil y autorizó el commit `style(community): renovar inicio editorial fase 6.2-A` y el push exclusivamente a `origin/feat/community-visual-polish`. Se confirmó la rama y la carpeta del repositorio, se revisaron los seis archivos rastreados modificados y los siete archivos nuevos de esta fase, y se comprobó que el índice estuviera vacío antes de preparar la selección explícita. No se cambió el código aprobado durante esta revisión; solo se aclaró este informe.

Se volvieron a ejecutar `typecheck`, `lint`, `build` y las cinco regresiones de modelo: todas correctas. El build produjo CSS de **186,29 kB / 34,37 kB gzip**, conservando los tamaños de JavaScript y SVG indicados anteriormente. La ejecución paralela inicial de modelos mostró un aviso de puerto HMR ocupado, sin fallos de aserciones; se repitió la comprobación de modelo de forma individual.

Sobre el preview estable, Brave completó **488 comprobaciones**: Inicio premium 141, hero móvil 171 (con el registro anterior local), compositor 19, Retos 30, Galería 40, Logros 55 y presentación compartida de 6.1 32. Inicio, hero y presentación compartida devolvieron cero errores y advertencias de consola. Las medidas finales del hero y el acceso adelantado al feed coinciden con la tabla del ajuste. No se modificaron las otras secciones al comprobar sus regresiones.

El respaldo contiene los 13 archivos de código, SVG originales, pruebas y documentación enumerados arriba. Los registros y capturas locales permanecen fuera del commit. No se autoriza ni se realiza merge, despliegue o implementación de Galería en esta entrega.
