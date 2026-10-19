# CAI Community — Fase 6.3: Retos y Logros

Entrega conjunta de Retos, Mis Logros y La Comunidad **aprobada visual y funcionalmente por el usuario**. Se autoriza su cierre mediante un único commit y push exclusivamente a `origin/feat/community-visual-polish`. No se inicia 6.4; no se realiza merge ni despliegue.

## Base y alcance comprobados

Se ejecutaron `git branch --show-current`, `git status --short`, `git log -3 --oneline` y `pwd` antes de editar. Rama: `feat/community-visual-polish`. Repositorio: `C:\Users\feral\Proyectos\CAI_Enterprices\CAI_Enterprices`.

Inicio 6.2-A está en `652b146026624c9ce72076ee2a132cdf1f1ec5bc`; Galería 6.2-B está en `3d1953c1f9a09f89db05de10369f2b1d956d5549`. Se verificó mediante `git ls-remote` que esta última era también la punta remota antes de implementar. Al comenzar el cierre autorizado se volvió a confirmar ese HEAD local y remoto, la presencia de ambas fases anteriores en el historial y el índice vacío.

Se leyeron AGENTS, visión, requisitos, documentación de Retos, Logros y fases visuales anteriores. Se compararon la aplicación y las referencias locales `RETOS — DESKTOP.png`, `LOGROS — MIS LOGROS.png` y `LOGROS — LA COMUNIDAD V2.png`. Se conservaron los archivos no rastreados.

La auditoría SHA-256 inicial contiene 110 archivos de `src/`: **99 permanecen idénticos**. Los únicos 11 originales modificados pertenecen a `challenges/` o `achievements/`. Inicio, Galería, landing, autenticación, administración, temas globales, modelos, permisos, fixtures, catálogo de reglas, hooks de respuesta y persistencia permanecen intactos. Se añaden únicamente recursos visuales y dos componentes auxiliares de presentación.

## Resultado visual e interacción

### Retos

- Encabezado editorial Figtree con acento azul; pregunta sobre papel y borde azul, acompañada por una cartela amarilla de recompensa. Se conservan navy, azul, amarillo y el fondo Cloud del producto aprobado.
- Tres respuestas nativas en formato editorial con placas A/B/C, foco visible y espacio reservado para el estado. Elegir una opción no desplaza las otras ni el CTA.
- Selección, acierto y error se distinguen mediante texto y marcas además del color. El resultado explica lo ocurrido, muestra los puntos y conserva el foco accesible original.
- Recorrido visible de cinco días **explícitamente ficticios**, construido sobre la acción de cambio de día ya existente. Indica el día actual y los respondidos. El selector demo original sigue disponible.
- Desde tableta hacia abajo, la pregunta antecede visualmente al resumen de constancia. Se mantienen detalles de reglas, recompensas, participación, mejores series y acceso al feed.
- Motion comunica presión, aparición del resultado y actualización de puntos, con duraciones breves. Sin animaciones de entrada en cascada ni confeti.

Las reglas permanecen iguales: una pregunta compartida por día simulado, tres respuestas, +5 por participar y +10 adicionales por acertar; sin puntos duplicados. Se mantienen los criterios de las tres insignias automáticas y las series consecutivas, incluidos días no contiguos y reinicio.

### Mis Logros

- La colección personal aparece antes de la solicitud privada. El estado vacío invita a empezar sin atribuir insignias ficticias al alumno.
- Resumen compacto de cuatro indicadores, en dos columnas en móvil. “Automáticas de Retos” evita cortes incómodos de palabras a 320 px.
- Certificados ilustrados con distintivo escrito **PRÁCTICA EN RETOS** o **RECONOCIDA POR CAI**, condición satisfecha, procedencia y acción voluntaria de compartir.
- El formulario conserva campos, validación, ayuda de privacidad, estados y límites. La cartela refleja disponible, pendiente, rechazada o conseguida sin alterar solicitudes ni historial.
- Catálogo móvil en dos columnas, con descripciones completas y controles táctiles. Se conservan las cuatro entradas iniciales y la expansión a seis que ya existía; no se añade un colapso nuevo para reducir altura.
- Historial con SVG, estado y acceso a la declaración completa. Revisión, rechazo y reintento mantienen los componentes y reglas originales.

### La Comunidad

Se mantiene la composición funcional V2: reconocimientos recientes, reconocimiento de la semana, historias compartidas y distinciones de CAI. Se refinan la tipografía, las franjas ilustradas, los artículos y el póster central. En móvil permanece el desplazamiento horizontal **intencional y contenido** de reconocimientos; no se extiende a la página.

Los selectores de reconocimientos e historias no cambian. Obtener una insignia o aprobar una solicitud **no publica**. Compartir abre el compositor público existente, editable y sin copiar la justificación privada; el envío sigue pasando por moderación simulada. Se conservan historias completas, reacciones, comentarios, ordenación, expansión y enlaces de perfiles.

### Celebración de una concesión real

`BadgeUnlockNotice` compara las concesiones derivadas mientras la vista está montada. Muestra una sola celebración durante 4,8 segundos, con cierre de 44 px, sin tomar el foco ni escribir en el dominio. Al volver a una sección inicializa con las concesiones actuales: no reproduce premios antiguos. Reiniciar elimina el aviso y los premios de la visita.

El aviso es una superposición transitoria cerrable; la información del premio permanece en la colección. No modifica el tamaño del documento. `useCommunityReducedMotion` escucha cambios de preferencia en vivo para las opciones y el aviso; las reglas CSS locales también anulan transformaciones de tarjetas y botones cuando se solicita movimiento reducido. No se cambia el comportamiento de Inicio ni Galería.

## Recursos originales

Se conservan sin cambios `first-answer.svg` y `three-consecutive.svg`. Se añaden ocho SVG propios en `src/assets/community/badges/`, con contornos navy, formas de pegatina y la paleta CAI:

| Archivo | Ilustración / uso |
| --- | --- |
| `five-days.svg` | Calendario y sello de participación en los cinco días |
| `movie-explorer.svg` | Claqueta y reproducción; Explorador de películas |
| `music-catcher.svg` | Disco y notas musicales |
| `book-buddy.svg` | Libro abierto y marcador |
| `speaking-confidence.svg` | Diálogo y medalla de confianza |
| `good-companion.svg` | Dos compañeros y corazón |
| `cai-consistency.svg` | Estrella, roseta y cinta institucional |
| `progress-poster.svg` | Póster “Not perfect. Progress.” para el reconocimiento semanal |

Los SVG de insignia son decorativos junto al título accesible; el póster tiene descripción alternativa. No se añaden fotografías, imágenes de Instagram ni dependencias.

## Medidas antes / después

Mediciones del escenario inicial, mismas preguntas, concesiones vacías, fuentes cargadas y navegador Brave aislado. Anchos CSS nominales; viewport de 1000 px de alto en 1440/1024 y 812 px en los demás. `height` es el documento completo; no debe confundirse con la altura de un hero. Los resultados coinciden entre claro y oscuro.

| Ancho | Retos: documento | Mis Logros: documento | La Comunidad: documento |
| --- | --- | --- | --- |
| 1440 | 1350 → 1519 px | 1828 → 2048 px | 1931 → 2141 px |
| 1024 | 1352 → 1495 px | 1847 → 2312 px | 1987 → 2512 px |
| 768 | 2187 → 1966 px | 2612 → 2767 px | 3424 → 3462 px |
| 375 | 2701 → 2701 px | **3858 → 3288 px** | 3902 → 3769 px |
| 320 | 2698 → 2783 px | **4092 → 3447 px** | 4072 → 3909 px |

Mis Logros reduce **570 px (14,8 %) a 375** y **645 px (15,8 %) a 320**. El catálogo se adelanta de 2371,02 a 2061,39 px y de 2438,52 a 2116,23 px respectivamente. La colección ya aparece a 842,70 y 859,86 px, antes del formulario.

En Retos la pregunta empieza a 395,66 px a 375 (antes 400,77) y a 389,22 px a 320 (antes 396,30). A 768 se adelanta de 443,58 a 383,58 px. Se preserva la tipografía y el recorrido nuevo añade controles; no se afirma una reducción de altura en todos los tamaños. El aumento de escritorio responde a títulos e ilustraciones mayores y a la distribución del catálogo en dos columnas a 1024.

Registros completos: [antes](../review/community-phase-6-3/antes.json), [después y contrastes Brave](../review/community-phase-6-3/validacion-conjunta.json), [Opera GX](../review/community-phase-6-3/compatibilidad-opera-gx.json).

## Validación ejecutada

Se ejecutaron en el proyecto, sin nuevas dependencias:

```text
npm.cmd run typecheck   correcto
npm.cmd run lint        correcto, --max-warnings 0
npm.cmd run build       correcto
git diff --check        correcto
```

Los scripts de navegador se ejecutaron como funciones mediante `playwright-brave` sobre el build de producción servido localmente en `http://127.0.0.1:4173`. La prueba nueva también se ejecutó con `playwright-opera-gx`, en perfiles aislados. El estado vacío de Inicio usa la fixture de desarrollo existente en 5173.

| Prueba de modelo | Resultado |
| --- | --- |
| `node scripts/check-community-model.mjs` | 29 comprobaciones + 4 igualdades |
| `node scripts/check-community-publication.mjs` | 23 comprobaciones |
| `node scripts/check-community-challenges.mjs` | 27 comprobaciones + 1 igualdad |
| `node scripts/check-community-gallery.mjs` | 25 comprobaciones + 4 igualdades |
| `node scripts/check-community-achievements.mjs` | 51 comprobaciones + 4 igualdades |

| Prueba de navegador | Resultado |
| --- | --- |
| `check-community-challenges.browser.mjs` | 30 correctas |
| `check-community-achievements.browser.mjs` | 55 correctas |
| `check-community-composer.browser.mjs` | 19 correctas |
| `check-community-home-premium.browser.mjs` | 141 correctas, sin errores ni advertencias |
| `check-community-mobile-hero.browser.mjs` | 135 correctas, opciones predeterminadas |
| `check-community-gallery.browser.mjs` | 40 correctas |
| `check-community-gallery-premium.browser.mjs` | 144 correctas, sin errores ni advertencias |
| `check-community-visual-polish.browser.mjs` | 33 correctas, sin errores ni advertencias |
| **`check-community-learning-premium.browser.mjs`**, Brave | **173 correctas** con comparación contra las métricas base |
| Mismo script nuevo, Opera GX | **165 correctas**, sin comparación base opcional |

La regresión visual 6.1 esperaba exactamente dos imágenes SVG en toda la vista. El requisito nuevo extiende el catálogo a seis ilustraciones y reutiliza los recursos en cartela y vacío. Se sustituyó esa expectativa por la correspondencia exacta de los seis identificadores de catálogo y **se añadió** una aserción que conserva explícitamente la pareja original. Las pruebas de hover −3 px, presión, teclado, temas, puntuación y movimiento reducido siguen activas. No se cambian los tests funcionales existentes de Retos o Logros.

La prueba conjunta nueva verifica las **30 combinaciones** de tres vistas × cinco tamaños × dos temas: ausencia de desbordamiento horizontal, carga de SVG, radios nativos, controles de al menos 44 px, catálogo y estados vacíos reales. Cubre además selección por teclado sin cambio geométrico, acierto y error, cambio de día nuevo, sincronización sin duplicar ni reproducir celebraciones, solicitud pendiente/aprobada, separación por procedencia, privacidad, compositor voluntario y reinicio. A 320 px prueba validación, foco, Escape y devolución del foco en el diálogo, en ambos temas.

Se midieron **19 muestras de contraste de texto** en fondos opacos reales: mínimo **4,96:1**, incluyendo instrucción, pregunta, opciones, CTA, descripción de insignia, cartela, reconocimiento y estados elegido/correcto/incorrecto. La matriz nueva termina sin errores ni advertencias en Brave y Opera GX. Se revisaron visualmente capturas de escritorio, tableta y móvil, ambos temas, las ocho ilustraciones y los estados principales. El índice local carga las imágenes y permite cambiar entre las cinco comparativas.

La incidencia histórica de **0,03125 px** en el ancho de CTA de Inicio conserva su registro y comparación con `652b146` en [fase 6.2](community-phase-6-2.md). No se modificó Inicio, su prueba ni sus métricas históricas para ocultarla. Aquí se ejecutó la regresión móvil predeterminada (135/135); no se presenta una nueva comparación exacta contra aquel JSON histórico.

## Evidencia para revisar

**[Abrir comparativas y estados](../review/community-phase-6-3/index.html)**. También puede abrirse mediante el servidor local de desarrollo en `/review/community-phase-6-3/index.html`.

Son **18 PNG**: cinco capturas iniciales, ocho finales de vistas principales y cinco de estados. El acierto y la insignia recién desbloqueada comparten una captura; el estado vacío está en Mis Logros. Se incluyen Retos escritorio/móvil claro y oscuro, ambas vistas de Logros escritorio/móvil, solicitud pendiente/aprobada y compositor voluntario.

Comparativas directas:

| Vista | Antes | Después |
| --- | --- | --- |
| Retos 1440 | [Antes](../review/community-phase-6-3/antes-retos-1440.png) | [Después](../review/community-phase-6-3/despues-retos-1440-claro.png) |
| Retos 375 | [Antes](../review/community-phase-6-3/antes-retos-375.png) | [Después](../review/community-phase-6-3/despues-retos-375-claro.png) |
| Mis Logros 1440 | [Antes](../review/community-phase-6-3/antes-mis-logros-1440.png) | [Después](../review/community-phase-6-3/despues-mis-logros-1440-claro.png) |
| Mis Logros 375 | [Antes](../review/community-phase-6-3/antes-mis-logros-375.png) | [Después](../review/community-phase-6-3/despues-mis-logros-375-claro.png) |
| La Comunidad 1440 | [Antes](../review/community-phase-6-3/antes-comunidad-1440.png) | [Después](../review/community-phase-6-3/despues-comunidad-1440-claro.png) |

El [resumen técnico JSON](../review/community-phase-6-3/resultados.json) conserva resultados y auditoría de alcance. Las evidencias de `review/` y los archivos auxiliares de `.playwright-mcp/` son locales; no forman parte del código de producto para un futuro respaldo.

## Archivos de la entrega

**24 archivos de producto, pruebas y documentación** (12 modificados y 12 nuevos), sin contar las evidencias locales:

- `src/features/community/challenges/`: `ChallengesView.tsx`, `ChallengeQuestionPanel.tsx`, `ChallengeRewards.tsx`, `challenges.module.css`.
- `src/features/community/achievements/`: `AchievementsView.tsx`, `MyAchievements.tsx`, `CommunityAchievements.tsx`, `BadgeArtwork.tsx`, `BadgeCollection.tsx`, `BadgeRequestHistory.tsx`, `achievements.module.css`; nuevo `BadgeUnlockNotice.tsx`.
- Nuevo componente compartido indispensable: `src/features/community/components/useCommunityReducedMotion.ts`, dedicado a la preferencia de presentación en vivo de estas vistas.
- Los ocho SVG originales enumerados arriba, en `src/assets/community/badges/`.
- Nueva regresión conjunta: `scripts/check-community-learning-premium.browser.mjs`.
- Regresión visual adaptada al nuevo catálogo: `scripts/check-community-visual-polish.browser.mjs`.
- Este informe: `docs/community-phase-6-3.md`.

## Límites y cierre

La fase conjunta está aprobada por el usuario. Se mantienen la autenticación, moderación, datos y estados de sesión simulados del prototipo. Las comprobaciones de accesibilidad cubren semántica, teclado, foco, contraste de muestras y movimiento reducido; no se ejecutó un lector de pantalla real ni una auditoría completa WCAG. La compatibilidad se probó en Brave y Opera GX, no en Safari o Firefox.

El respaldo autorizado parte de `3d1953c1f9a09f89db05de10369f2b1d956d5549` en `feat/community-visual-polish`, con los 24 archivos enumerados y el mensaje exacto `style(community): completar retos y logros editoriales fase 6.3`. La preparación del índice utiliza rutas explícitas; `review/`, `.playwright-mcp/`, `design-reference/`, `reference/` y los archivos temporales quedan fuera. El hash completo y su coincidencia con la rama remota se informan en la entrega del respaldo.

Durante el cierre se repitieron typecheck, lint, build, los cinco modelos y las nueve regresiones de navegador de la tabla anterior: todos correctos, con los mismos recuentos. La prueba conjunta volvió a pasar 173 comprobaciones en Brave y 165 en Opera GX, sin errores ni advertencias. Se revisaron el diff completo, el inventario exacto del índice, `git --no-pager diff --cached --stat`, `git status --short` y `git diff --cached --check`. No se modificó código funcional durante el cierre; solo se actualiza este documento para registrar la aprobación y la validación del respaldo.

No se borran materiales previos ni se modifica el producto fuera de lo aprobado. El cierre termina después del respaldo, sin cambios de rama, merge, despliegue ni trabajo de 6.4.
