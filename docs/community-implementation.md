# CAI Community — Implementación del Issue #3

Prototipo visual e interactivo desarrollado en `feat/community` para el [Issue #3](https://github.com/FerAlfaro24/CAI_Enterprices/issues/3). La comunidad representa cuatro semanas ficticias de actividad, del 22 de septiembre al 17 de octubre de 2026. Ningún perfil, publicación, resultado o interacción representa a alumnos reales.

La base visual y navegación de la fase 1, Inicio de la fase 2, Retos de la fase 3 y Galería de la fase 4 están aprobados. Sus arquitecturas y pruebas se conservan en [fase 1](community-phase-1.md), [fase 2](community-phase-2.md), [fase 3](community-phase-3.md) y [fase 4](community-phase-4.md). La **fase 5 implementa Logros**, pendiente de revisión: catálogo tipado, solicitudes privadas, concesiones derivadas, revisión demo y compartición voluntaria con moderación. Arquitectura y reglas: [community-phase-5.md](community-phase-5.md); capturas: [índice visual](../review/community-phase-5/index.html). Las descripciones históricas de columnas y directorio que siguen abajo corresponden al prototipo inicial; la navegación actual tiene cuatro secciones y los perfiles se abren individualmente.

## Alcance y arquitectura

- `/community` tiene `CommunityLayout`, separado de la landing y de `AppLayout`.
- `CommunityProvider` utiliza `useReducer` y contexto. El reducer concentra creación, comentarios, reacciones, moderación, fijación, retos y reinicio.
- Los datos están tipados; los filtros y el orden se calculan a partir del estado. No se mantiene una segunda copia del feed que pueda quedar desactualizada.
- `community.module.css` encapsula variables y estilos. Se conservan Figtree, azul `#1f56d6`, azul oscuro `#0a1f4d` y blanco; los colores secundarios distinguen categorías e insignias.
- La landing, sus recursos, sus estilos y `reference/` no se modifican. `/admin` y 404 conservan sus pantallas y layout anteriores.
- No se agregaron dependencias, backend, cuentas, servicios de envío ni carga de archivos. El contenido continúa en memoria; únicamente la preferencia de tema se guarda en localStorage bajo `cai.community.demo.theme.v1`. No se usa sessionStorage.

## Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `src/layouts/CommunityLayout.tsx` | Integra provider, shell y Outlet para la ruta de comunidad. |
| `src/pages/CommunityPage.tsx` | Entrada de la página; monta CommunityWorkspace. |
| `src/app/router.tsx` | Asigna `/community` al nuevo layout sin cambiar las demás rutas. |
| `src/features/community/types.ts` | Tipos de perfiles, publicaciones, fotografías, comentarios, reacciones, retos, estado y acciones. |
| `data/members.ts` | Doce perfiles: once alias de alumnos y Equipo CAI, todos ficticios. |
| `data/fixtures.ts` | Quince publicaciones aprobadas, dos pendientes, conversaciones, reacciones y cinco retos. |
| `model.ts` | Estado inicial, reducer, selección/orden del feed, suma de reacciones y formato de fechas. |
| `context.ts` | Contexto y hook de acceso a la demo. |
| `CommunityProvider.tsx` | Ciclo de vida del estado React. |
| `CommunityWorkspace.tsx` | Composición de las cinco secciones, filtros, creación y foco de navegación. |
| `community.module.css` | Diseño de tres columnas, tarjetas, formularios, diálogo, responsive y foco. |
| `components/CommunityShell.tsx` | Aviso, cabecera, navegación entre áreas, selector de vista, reinicio y estados accesibles. |
| `components/CommunityNavigation.tsx` | Navegación horizontal: Inicio, Logros, Galería y Retos. Sustituye a CommunitySidebar. |
| `components/CommunitySectionLayout.tsx` | Contenido con columna contextual opcional; el shell no impone columnas. |
| `components/MemberProfileDialog.tsx` | Perfil ficticio de Alex, puntos, insignia actual y acceso al directorio conservado. |
| `useCommunityTheme.ts` y `communityTheme.module.css` | Preferencia persistente y variables semánticas para ambos temas, limitadas a la comunidad. |
| `components/PostCard.tsx` | Autor, categoría, fecha, contenido, reacciones, conversación y controles de fijación. |
| `components/PostMedia.tsx` | Fotografías individuales/compactas y galerías con controles, teclado y fallback de imagen. |
| `components/Comments.tsx` | Conversaciones y creación de comentarios ficticios. |
| `components/Composer.tsx` | Diálogo accesible de nueva publicación y selección de imágenes de muestra. |
| `components/DailyChallenge.tsx` | Reto compartido, selector de día, resultado, puntos y constancia. |
| `components/RecognitionPanels.tsx` | Bienvenidas, logros semanales y publicaciones celebradas. |
| `components/MemberDirectory.tsx` | Directorio de alias y perfiles ficticios. |
| `components/ModerationPanel.tsx` | Cola mínima de revisión y estado de los envíos del alumno demo. |
| `components/ui.tsx` | Avatares de iniciales, emblema CAI e iconos SVG reutilizables. |
| `scripts/check-community-model.mjs` | Comprobación repetible del modelo con Node, assert y Vite ya instalado. |
| `README.md` | Estado actual y acceso a esta documentación. |

Las rutas abreviadas de la tabla pertenecen a `src/features/community/`.

## Feed y contenido

Hay quince publicaciones aprobadas y dos borradores pendientes preparados para moderación. El feed combina texto, hitos ilustrados, fotografía mediana, miniatura con pie, galería y tarjeta de evento. Siete publicaciones tienen entre tres y cuatro comentarios ficticios, dentro del rango de 3–6 solicitado. Las fechas de los comentarios son posteriores a sus publicaciones y anteriores al cierre del escenario.

Los nuevos envíos y comentarios avanzan un minuto por acción en el reloj ficticio a partir de las 18:30 del 17 de octubre. No dependen del reloj del equipo y mantienen un orden reproducible para la demostración.

El orden predeterminado es: avisos fijados por orden de fijación, seguidos por publicaciones aprobadas en orden cronológico descendente. Inicialmente hay dos avisos fijados; el máximo es tres. Solo se pueden fijar avisos de categoría «Desde CAI» del perfil institucional, desde la vista de moderador demo.

Los filtros Recientes, Logros y Experiencias seleccionan contenido; Más celebradas ordena por la suma de las cinco reacciones y desempata por fecha. Los avisos fijados se conservan primero entre los resultados que coinciden con el filtro. La sección Galería reúne publicaciones con imágenes, aunque su categoría sea un anuncio o un encuentro.

Cada publicación admite una reacción del participante demo: Me encanta, Bien hecho, Felicidades, Increíble o Me divierte. Se puede cambiar o retirar; los totales, la ordenación y el bloque de contenido celebrado se recalculan. Los comentarios permiten texto plano ficticio de hasta 400 caracteres, no admiten contenido vacío y se incorporan inmediatamente a la conversación.

Las tarjetas de bienvenida se derivan de las fechas de ingreso de los perfiles. Los logros de la semana se obtienen de publicaciones aprobadas desde el 12 de octubre del escenario. Los reconocimientos son positivos y no comparan rendimientos académicos ni presentan clasificaciones negativas.

## Reto compartido

Hay un único reto de opción múltiple por día de demostración, común a todos. El selector «Cambiar día · Solo demo» recorre cinco preguntas; no utiliza la fecha real ni asigna preguntas por nivel.

- Participar suma 5 puntos ficticios.
- Acertar añade otros 10: total de 15 por ese día.
- Una respuesta incorrecta muestra la correcta y una explicación; conserva los 5 puntos por participar y no aplica penalizaciones.
- Cada día se puntúa una sola vez. Volver a ese día muestra la respuesta registrada y sus controles deshabilitados.
- Tras participar en tres días de muestra aparece «Constancia que inspira». No afirma una racha real de días consecutivos.
- Reiniciar borra respuestas y puntos. No hay temporizador, preguntas abiertas ni clasificación académica.

## Creación y moderación mínima

1. «Crear una publicación ficticia» abre un diálogo nativo. El título requiere 4–100 caracteres y la historia 10–1200 después de limpiar espacios.
2. El autor es Alex Demo en vista de alumno o Equipo CAI en vista de moderador. El alumno no puede seleccionar anuncios institucionales en los controles de la demo.
3. Solo se pueden elegir las tres fotografías de stock preparadas; no existe selector de archivos ni campo de URL. La categoría Galería requiere al menos una imagen.
4. Cualquier nueva publicación queda **pendiente**, incluso una creada desde moderador. No se incorpora al feed hasta aprobarse.
5. El selector «Vista demo» muestra el panel mínimo de moderación dentro de la comunidad. Aprobar cambia el estado y publica respetando la cronología; rechazar mantiene el contenido fuera del feed.
6. Alex puede consultar el estado pendiente/aprobado/rechazado de sus envíos. No se implementó edición ni reenvío de un rechazo; se puede crear otro ejemplo o reiniciar.
7. Los avisos institucionales aprobados tienen botones de fijar/desfijar únicamente en la vista demo correspondiente.

Los guardas del reducer impiden acciones incoherentes en los controles de esta simulación. **No son autenticación ni autorización real.** Todo el código y los datos del prototipo son públicos en el navegador. No se modifica `AdminPage` ni se intenta definir el futuro panel de administración, las solicitudes de registro o su modelo de permisos.

## Accesibilidad y responsive

- Aviso de prototipo permanente en el documento; navegación a institucional, comunidad y administración visible.
- Enlace para saltar al contenido; un único main; regiones, títulos y formularios con nombres accesibles.
- Estados de filtros/reacciones con `aria-pressed`, sección activa con `aria-current` y conversación con `aria-expanded`/`aria-controls`.
- Etiquetas y errores asociados, foco al primer campo inválido y mensajes mediante `role="status"`/`role="alert"`.
- Diálogo nativo para la creación: foco inicial en el título, recorrido modal, cierre con Escape y retorno al botón que lo abrió.
- Galerías con botones y flechas izquierda/derecha; posición anunciada y fotografías con texto alternativo.
- Cabecera horizontal con cuatro secciones; por debajo de 900 px la navegación ocupa una segunda fila. El contenido actual usa dos columnas opcionales que se apilan; los perfiles ocupan el ancho disponible. El directorio sigue accesible desde el perfil de Alex, Opciones de demostración y las bienvenidas.
- Fotografías con altura limitada y composiciones variadas; textos largos pueden partirse. Diálogo con altura máxima y scroll propio.
- Foco visible y colores de texto secundarios ajustados tras revisar contraste de texto sobre fondos sólidos. Esto no equivale a una auditoría WCAG completa.
- `prefers-reduced-motion` desactiva transiciones y desplazamiento suave; no se usan animaciones continuas.

## Imágenes y privacidad

Se reutilizan tres fuentes de stock ya documentadas en la landing, sin modificar los archivos de esa funcionalidad:

| Imagen | Autor y fuente |
| --- | --- |
| Biblioteca sin personas | Janko Ferlič — [Unsplash](https://unsplash.com/photos/photo-of-library-with-turned-on-lights-sfL_QOnmy00) |
| Portátil y manos | John — [Unsplash](https://unsplash.com/photos/person-using-laptop-FlPc9_VocJ4) |
| Reunión de personas con apariencia adulta | Mimi Thian — [Unsplash](https://unsplash.com/photos/four-people-watching-on-white-macbook-on-top-of-glass-top-table-vdXMSiX-n6M) |

Los pies identifican las fotografías como ilustrativas. No representan estudiantes, personal ni instalaciones de CAI. No se utilizan fotos identificadas como menores ni retratos reales para los alias; los avatares se construyen con iniciales.

Las imágenes y Google Fonts requieren conexión. Si una imagen falla aparece una descripción alternativa visible. Las peticiones a los proveedores externos pueden transmitir los metadatos de conexión habituales; la demo no añade datos de formularios a esas peticiones. La licencia y las limitaciones de derechos de modelos/marcas constan en [la documentación de la landing](landing-implementation.md#procedencia-de-recursos-visuales); deben revisarse antes de una publicación comercial.

## Cómo demostrarlo

```powershell
npm.cmd run dev
```

Abrir `/community` en la URL que muestre Vite. Probar filtros, reacciones, comentarios y galerías. Crear una publicación con datos ficticios, cambiar a Moderador, aprobarla y comprobar su aparición después de los fijados. Crear otro ejemplo para rechazarlo y consultar su estado en la vista Alumno.

En Retos, responder Día 1, cambiar a Día 2 y después Día 3; se pueden mostrar acierto, error, puntos y reconocimiento. Volver al Día 1 demuestra que no se duplican puntos. «Reiniciar demo» restaura todos los datos.

## Comprobaciones

La tabla siguiente corresponde a la implementación inicial. La validación del rediseño de fase 1 y sus capturas están en [community-phase-1.md](community-phase-1.md).

La revisión del 17 de octubre de 2026 utiliza perfiles de automatización aislados y datos ficticios.

| Comprobación | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Correcto con TypeScript estricto. |
| `npm.cmd run lint` | Correcto, sin advertencias. |
| `npm.cmd run build` | Correcto; genera `dist/`, sin despliegue. |
| `node scripts/check-community-model.mjs` | 29 comprobaciones y cuatro comparaciones de igualdad correctas. |
| Brave: cinco secciones de comunidad | Inicio, Logros, Galería, Retos y Alumnos a 1440, 1024, 768, 375 y 320 px, sin overflow horizontal. |
| Brave sobre preview | `/`, `/community`, `/admin` y 404 en los cinco anchos, títulos y aviso correctos; Figtree en landing/comunidad y Arial en administración/404. |
| Feed | Quince aprobadas, dos avisos fijados primero, cronología descendente, filtros y Más celebradas comprobados. |
| Reacciones y comentarios | Añadir, cambiar y retirar reacción; rechazar comentario vacío, añadir comentario ficticio y actualizar recuentos comprobados. |
| Galerías y perfiles | Cambio de imagen con botones/teclado y doce perfiles de muestra comprobados. |
| Publicaciones y revisión | Crear → pendiente fuera del feed → aprobar → visible; rechazo y estado del alumno, fijación/desfijación y reinicio comprobados. |
| Retos | Opción requerida, acierto de 15 puntos, error de 5, explicación, 35 puntos tras tres días, insignia y bloqueo de doble puntuación comprobados. |
| Teclado | Salto al main, foco inicial del diálogo, ciclo Tab/Shift+Tab, Escape, retorno de foco y restauración del scroll comprobados; diálogo a 375×667 sin desbordamiento. |
| Movimiento reducido | Cero animaciones activas y transiciones de 0 s en la comprobación. |
| Navegación entre áreas | Vuelta a la landing y regreso a comunidad reinician estado; no queda bloqueo de scroll. |
| Opera GX sobre preview | Comunidad a 1440, 375 y 320 px, galerías, reto incorrecto, aprobación, diálogo y Escape correctos. También se comprobaron cargas de landing y administración en esos anchos. |
| Consola | Sin errores ni advertencias registrados en los recorridos finales de Brave y Opera GX. |
| Datos y red | Cero peticiones POST/PUT/PATCH/DELETE durante el flujo compilado. localStorage y sessionStorage permanecieron vacíos. |
| Integridad y Git | Hashes de referencia, recursos y funcionalidad de landing sin cambios. `git diff --check` correcto. |

Se revisaron capturas de escritorio y móvil. Durante la validación se corrigieron dos conversaciones inicialmente anteriores a sus publicaciones, una opción del reto que conservaba texto anterior, textos secundarios con contraste insuficiente y el recorrido de Tab en los extremos del diálogo nativo. Las comprobaciones pertinentes se repitieron después de las correcciones.

Comprobación reproducible del modelo, sin instalar herramientas adicionales:

```powershell
node scripts/check-community-model.mjs
```

El script carga las fuentes TypeScript con Vite en modo middleware, sin listener HTTP, HMR ni watchers. Comprueba contenido, autores/fechas, orden, filtros, reacciones, comentarios, aprobación/rechazo, fijación y su límite, puntos, unicidad de intentos, reinicio e integridad de los fixtures. Resultado inicial: **29 comprobaciones y cuatro comparaciones de igualdad correctas**.

Las pruebas de navegador cubren composición a 1440, 1024, 768, 375 y 320 px, secciones, diálogos, filtros, comentarios, galerías, reto, aprobación/rechazo y reinicio. No hay pruebas con usuarios o dispositivos físicos ni una revisión completa mediante lector de pantalla.

## Límites y siguientes decisiones

- El estado se pierde al recargar o salir de `/community`; el reinicio también elimina los cambios de la sesión. No hay sincronización entre pestañas o personas.
- Fechas, puntos, constancia, alias, comentarios y resultados son muestras. El día del reto se elige manualmente para demostrarlo.
- Falta aprobar con el cliente la disponibilidad real de comentarios/reacciones, publicación de alumnos, moderación y reconocimientos, originalmente propuestos o diferidos en los requisitos.
- Antes de admitir usuarios reales se requieren autenticación, autorización en servidor, almacenamiento privado, moderación persistente y consentimiento. Esta tarea no implementa esos servicios ni define políticas productivas.
- No hay notificaciones, mensajería, vídeos, edición de perfiles, búsqueda, matrícula, pagos ni carga de fotografías reales.
- La rama de administración puede integrar estos conceptos más adelante; su página actual y sus archivos permanecen intactos.

No se realiza commit, push, merge ni despliegue en esta tarea.
