# CAI Community · Fase 6.1 · Playful Premium

Rama verificada: `feat/community-visual-polish`. Base estable: `a6d9603`. La carpeta de diseños y las revisiones anteriores ya existían sin rastrear y se conservaron.

## Herramientas y alcance

- Entorno efectivo: Node **24.22.0**, React/React DOM **19.3.1**, Vite **8.3.4**, Tailwind **4.3.3** mediante su plugin de Vite. Se conserva Figtree y CSS Modules.
- Antes: SVG dibujados a mano en `CommunityIcon`, emojis narrativos y transiciones CSS. No había biblioteca de iconos ni animaciones.
- Instaladas como dependencias directas **motion 14.3.0** y **lucide-react 1.59.0**; seis paquetes añadidos contando dependencias transitivas. La instalación informó cero vulnerabilidades. No se añadió GSAP ni una dependencia directa de Framer Motion; `framer-motion` figura como implementación transitiva del paquete oficial Motion actual.
- API React desde `motion/react`, con `LazyMotion`, componentes `m`, `MotionConfig` y `useReducedMotion`. Las funciones `domAnimation` se importan de forma diferida al montar la comunidad. [Documentación oficial de Motion](https://motion.dev/docs/react-motion-config).
- Lucide se consume con imports específicos, detrás de la interfaz existente de `CommunityIcon`; se conservan tamaños, peso de trazo 1.8, nombres accesibles y SVG decorativos. Las pestañas de Logros sustituyen ★/♧ por Award/Users. No se reemplazaron emojis narrativos ni el catálogo completo. [Documentación oficial de Lucide](https://lucide.dev/guide/react/).

## Muestra aplicada

Cabecera y navegación: selección visible mediante una superficie azul suave, sombra contenida, botones de tema con respuesta al pulsar y acceso al perfil existente. Se conservan las cuatro secciones y su comportamiento.

Botones primarios/secundarios compartidos: radios, sombra, borde, hover, pressed, disabled y foco. En Logros, el formulario y la acción de compartir añaden presión sutil de Motion conservando semántica nativa y handlers. La previsualización de solicitud tiene una transición breve de opacidad cuando cambia su estado.

Las tarjetas del catálogo y de la colección personal son la muestra de profundidad: borde suave, brillo casi imperceptible, sombra y elevación de **3 px** al pasar el puntero. El foco dentro de la tarjeta también refuerza su borde y sombra. No se convierten artículos en botones ni se añaden paradas de teclado innecesarias.

## Fundamentos

| Token/patrón | Decisión |
| --- | --- |
| Identidad | Marino #0A1F4D, azul #1F56D6, amarillo #FFCD1F, fondo #F4F7FF, Figtree. |
| Radios | Control 12 px, tarjeta 24 px, píldora 999 px. Adopción selectiva; las composiciones aprobadas conservan otros radios existentes. |
| Espaciado | Escala 4, 8, 12, 16, 24, 32 px; se documenta sin reespaciar todas las pantallas. |
| Superficies | Paper/canvas/azul suave existentes; brillo local en tarjetas de muestra, sin fondos decorativos que compitan con el contenido. |
| Sombras | Rest, lift, control y dialog; variantes oscuras con profundidad azul y sombra más contenida. |
| Estados | Hover con borde reforzado, focus-visible con el anillo de 3 px existente, pressed sin sombra o escala .97 en botones Motion, disabled atenuado y sin movimiento. |
| Tiempo | CSS 120/180 ms; Motion 180 ms; feedback 160 ms. Curva de interfaz cubic-bezier(.22,1,.36,1). |
| Movimiento reducido | Política `user` dentro de la comunidad, guardias de hook para gestos, opacidad inicial 1 y duración 0 en feedback; se conserva la regla CSS existente que desactiva transiciones y animaciones. |

La intención es 70 % claridad editorial y 30 % energía: gestos breves, amarillo reservado, stickers de colección y profundidad discreta. El modo oscuro usa superficies marino, bordes azul gris y brillo tenue; las ilustraciones conservan su papel claro para contrastar. No hay entradas escalonadas, confeti ni animación de todas las tarjetas al montar.

## Dos SVG originales

- `src/assets/community/badges/first-answer.svg`: diálogo azul y tarjeta amarilla de respuesta, silueta recortada, detalles de celebración.
- `src/assets/community/badges/three-consecutive.svg`: tres hojas enlazadas de calendario, número tres y pequeña llama plana.

Ambos usan viewBox 160×160, contorno marino, papel cálido y capas planas. No son iconos Lucide ampliados, emojis, packs descargados ni recursos externos. `BadgeArtwork` los muestra únicamente en el catálogo/colección de Logros para esos dos identificadores; el resto conserva su presentación. Retos mantiene su diseño aprobado hasta una fase posterior.

**Los SVG son presentación, no concesiones.** Al iniciar hay cero insignias; en el catálogo se ven como disponibles y con progreso real. Las capturas de colección se obtuvieron respondiendo los días 1, 2 y 3: dos insignias y 35 puntos, con un fallo incluido. No se tocaron definiciones, selectores, solicitudes, privacidad ni moderación.

## Archivos

Nuevos:

- `src/features/community/components/CommunityMotion.tsx`: alcance de Motion y patrones reutilizables Button/Card/Feedback.
- `src/features/community/components/motionFeatures.ts`: carga diferida de gestos/animación.
- `src/features/community/achievements/BadgeArtwork.tsx`: elección de ilustración, sin acceso al modelo.
- Los dos SVG locales indicados arriba.
- `scripts/check-community-visual-polish.browser.mjs`: comprobaciones de integración, movimiento, teclado, temas y tamaños sobre preview.
- Este informe y `review/community-phase-6-1/` con comparativas.

Modificados:

- `package.json`, `package-lock.json`: exclusivamente las dos dependencias autorizadas y su resolución.
- `communityTheme.module.css`: tokens de fundamentos y sus variantes oscuras.
- `community.module.css`: controles compartidos, cabecera y sombra de perfil.
- `components/ui.tsx`, `CommunityShell.tsx`, `CommunityNavigation.tsx`: iconos y alcance/gestos.
- `achievements/AchievementsView.tsx`, `BadgeCollection.tsx`, `BadgeRequestForm.tsx`, `MyAchievements.tsx`, `achievements.module.css`: muestra visual descrita.

## Validación

Resultados finales y capturas: [índice visual](../review/community-phase-6-1/index.html) y [registro de revisión](../review/community-phase-6-1/REVISION.md).

- `typecheck`, `lint` y `build`: correctos; build final sin advertencia de tamaño.
- Modelos existentes: Comunidad 29 + 4 igualdades; Publicaciones 23; Retos 27 + 1 igualdad; Galería 25 + 4 igualdades; Logros 51 + 4 igualdades. Todos correctos.
- Regresión de Logros en Brave/dev: **55 comprobaciones correctas**, incluido el recorrido completo de concesión, privacidad, compartición y moderación; rechazo, nueva solicitud, ausencia de duplicados y reinicio.
- Nueva prueba visual en Brave/preview de producción: **32 comprobaciones correctas**, sin errores ni advertencias de consola. Incluye gestos con movimiento normal/reducido, foco y activación por teclado, tema persistente, SVG cargados y ausencia de desbordamiento en 1440, 375 y 320 px en ambos temas.
- El compositor existente en preview: **19 comprobaciones correctas**, incluida la corrección de errores obsoletos con texto válido de 82 caracteres.
- Regresiones existentes en Brave/preview: **Retos 30** y **Galería 40** comprobaciones correctas.
- Comprobación adicional en preview de las cuatro secciones a 1440/375/320 px: **12 vistas sin desbordamiento**; `/` y `/admin` cargan con su `main` y sin el contenedor de tema comunitario. Sin errores de página en ese recorrido. Es una comprobación básica de aislamiento, no una regresión completa de esas otras áreas.

Hay **27 capturas** en el índice: nueve antes y dieciocho después. Las cabeceras móviles usan 375×812 y 320×812. En los recortes de colección se amplía temporalmente la altura del viewport para que el componente completo quepa y se oculta la cabecera fija solo durante la captura; se conserva el ancho móvil y no se modifica ningún estilo del producto para conseguirlo.

Se abrió el índice local sin servidor: sus 29 imágenes (27 PNG y dos SVG) cargaron, sin recursos rotos. No se probó Opera GX, Firefox o Safari en esta fase.

Durante la integración, Vite recargó dependencias y conservó temporalmente módulos React de distintas optimizaciones; una navegación completa eliminó los errores transitorios de HMR. La prueba de producción anterior comprueba una carga limpia, no solo una sesión ya abierta. Las aserciones de Motion esperan al valor final de la transformación; no presuponen que un temporizador fijo coincida con los fotogramas del navegador.

El primer build superó 500 kB en el bloque principal; se corrigió con carga diferida de `domAnimation`, sin elevar el límite de advertencia. Resultado: JavaScript principal **488.24 kB** (152.07 gzip), bloque Motion **46.65 kB** (17.82 gzip), CSS **184.75 kB** (34.05 gzip). Frente al build de fase 5 documentado, el coste total de JavaScript crece unos 96 kB sin comprimir y 36 kB gzip. No se oculta ese coste; la separación completa por rutas queda fuera de esta muestra.

## Pendientes

Validar la dirección de los dos stickers y el grado de profundidad/movimiento antes de ampliar el catálogo. No se rediseñaron Inicio, Retos, Galería ni Logros completos. Quedan para otras fases sus ilustraciones restantes, celebraciones importantes y ajustes editoriales generales.

No hay nueva persistencia, backend, autenticación real ni seguridad de roles. No se modificaron landing, `/admin`, `reference/`, PNG aprobados ni modelos. No se hizo commit, push, merge o despliegue. No se probaron dispositivos físicos ni se realizó una auditoría formal con lector de pantalla.

Para revisar: `npm.cmd run dev`, abrir `/community` → Logros → Ver catálogo completo; las dos muestras también aparecen en Mis insignias después de completar tres días consecutivos con el selector demo existente. El índice de capturas se abre sin servidor.
