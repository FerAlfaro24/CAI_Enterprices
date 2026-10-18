# CAI Community — Fase 4: Galería

Implementación exclusiva de Galería en `feat/community`, basada en `design-reference/GALERÍA — DESKTOP.png` (1440 × 1630). [Índice de capturas](../review/community-phase-4/index.html) · [Informe visual e inventario](../review/community-phase-4/REVISION-VISUAL.md).

## Arquitectura y archivos

`CommunityWorkspace` monta `GalleryView` para la sección gallery dentro de la ruta existente `/community`, con una clave de reinicio. Galería tiene composición propia; no utiliza el feed ni la columna del reto. Cabecera, navegación, tema, aviso de prototipo y pie compartidos permanecen intactos.

Archivos nuevos en `src/features/community/gallery/`:

| Archivo | Responsabilidad |
| --- | --- |
| albums.ts | Contrato Album, categorías, proyección desde publicaciones, filtros, orden, conteos y fecha relativa. |
| presentation.ts | Títulos editoriales breves, símbolos y colores por publicación conocida; fallback para nuevos envíos. |
| GalleryView.tsx | Encabezado, compartir, destacado, filtros, mosaico, moderación y diálogos. |
| FeaturedAlbum.tsx | Composición azul asimétrica de Speaking Day; CTA vinculado al álbum derivado del Conversation Club ficticio. |
| AlbumCard.tsx | Variantes grande, compacta, horizontal y estándar. |
| AlbumCover.tsx | Portadas ilustradas editables en HTML/CSS; admite modo photo para futuras portadas autorizadas. |
| AlbumDialog.tsx | Fotografías, controles, miniaturas, procedencia, autor y publicación asociada. |
| gallery.module.css | Estilos encapsulados, temas y responsive. |

Archivos existentes adaptados:

- `CommunityWorkspace.tsx`: importa y monta la vista de Galería.
- `components/Composer.tsx`: acepta initialCategory opcional. Galería usa gallery; los usos anteriores conservan experience como valor predeterminado.
- `docs/community-implementation.md`: enlaza esta fase y actualiza el estado del rediseño.

Nuevos scripts: `check-community-gallery.mjs` y `check-community-gallery.browser.mjs`. Se añaden este documento y `review/community-phase-4/`. Las modificaciones anteriores ya presentes en Git pertenecen a fases anteriores.

## Relación álbum/publicación

No hay un segundo almacén de álbumes ni otra cola de moderación. `deriveAlbums(posts)` produce una proyección por publicación con fotos: id estable album:postId, postId, título y descripción originales, categoría, portada, colección de fotos, autor, procedencia, fecha, estado y celebraciones.

`selectAlbums` publica exclusivamente proyecciones approved. Los estados pending y rejected siguen en las publicaciones; no aparecen en el mosaico público. Aprobar una publicación con fotos la incorpora inmediatamente, sin copiar datos. Aprobar texto sin fotografías no crea un álbum.

La categoría se deriva de la publicación:

| Publicación | Álbum |
| --- | --- |
| announcement / gallery | Actividades |
| achievement | Logros |
| event | Eventos |
| experience | Detrás de cámaras |

Esta clasificación es una convención explícita del prototipo, pendiente de validar con el cliente; no hay categorización por palabras clave ni álbumes añadidos para llenar filtros.

Estado inicial: **6 álbumes, 9 referencias fotográficas y 3 fotografías de stock distintas**. Una misma foto puede estar en varias publicaciones; “9 fotos en estos álbumes” cuenta apariciones, no nueve originales diferentes. Actividades tiene cuatro álbumes y Eventos dos. Logros y Detrás de cámaras están vacíos inicialmente; una publicación aprobada con fotos de su categoría llena el filtro correspondiente.

Los títulos editoriales de portadas son etiquetas de presentación ligadas a postId. El detalle conserva título, historia, fecha, autor y conversación originales. Speaking Day es la presentación conceptual del Conversation Club ficticio existente: no se añade un evento ni se atribuyen fotografías a una celebración real.

## Composición e interacciones

La vista conserva el titular “Así se vive CAI”, invitación a compartir, destacado azul, filtros horizontales y mosaico asimétrico. Hay tarjetas grandes, compactas, horizontales y dos tarjetas finales amplias: el PNG presenta siete álbumes, pero la simulación dispone de seis aprobados.

El orden inicial **Selección CAI** dispone el destacado y las portadas con la composición editorial aprobada. Recientes, Primeros recuerdos y Más celebrados son opciones funcionales calculadas sobre los mismos datos. Los nuevos álbumes aprobados tienen presentación genérica y aparecen también en la selección; elegir Recientes los ordena según su fecha. Las fechas relativas usan días calendario de America/Mexico_City y el reloj ficticio del modelo.

El destacado permanece fuera de los filtros; estos afectan al mosaico, cuyos conteos y selección activa se anuncian mediante role=status y aria-pressed. Los filtros locales no modifican el filtro global del feed ni los retos. El reinicio restablece filtro, orden, compositor y álbum abierto.

“Compartir foto” reutiliza el compositor y sus validaciones: seleccionar medios de la biblioteca, enviar a revisión, aprobar o rechazar desde el moderador demo. No hay subida real ni publicaciones paralelas. Se conservan ModerationPanel y MySubmissions.

El detalle reutiliza StockImage, CommunityIcon, MemberLink, useCommunityDialog y el diálogo de publicación existente. Permite siguiente/anterior, miniaturas y flechas del teclado; una sola foto desactiva los controles innecesarios. La posición se anuncia en una región de estado. Cada foto muestra su atribución y descripción alternativa.

El diálogo nativo tiene nombre y descripción, foco inicial en cerrar, contención Tab/Shift+Tab, Escape y restauración del foco. Se bloquea el fondo. “Ver publicación y conversación” abre la historia original sobre el álbum, conservando reacciones, comentarios y perfiles; al cerrarla se regresa al control del álbum.

## Recursos y privacidad

No se añaden imágenes externas: se reutilizan las tres fotografías existentes, cuyos autores y páginas se revisaron el 18 de octubre de 2026:

- Janko Ferlič: [biblioteca](https://unsplash.com/photos/photo-of-library-with-turned-on-lights-sfL_QOnmy00).
- John: [portátil y manos](https://unsplash.com/photos/person-using-laptop-FlPc9_VocJ4).
- Mimi Thian: [reunión de personas con apariencia adulta](https://unsplash.com/photos/four-people-watching-on-white-macbook-on-top-of-glass-top-table-vdXMSiX-n6M).

Las páginas indican uso bajo [licencia Unsplash](https://unsplash.com/license), que permite usos gratuitos, incluidos comerciales, con sus restricciones. Esto no acredita autorizaciones institucionales de CAI ni sustituye permisos sobre personas, marcas o propiedades. Se conservan atribuciones en pies de foto. No se usan fotos de estudiantes reales ni de menores identificables.

Como el PNG utiliza espacios gráficos conceptuales, las portadas y el destacado se construyen con bloques CSS, texto y emojis, sin rasterizar el diseño. Las fotografías reales de stock se consultan dentro del detalle. AlbumCover permite sustituir después la ilustración por la portada del álbum mediante mode=photo y cambiar los medios en su publicación fuente.

## Responsive, accesibilidad y tema

Verificado a 1440, 1024, 768, 375 y 320 px, sin desbordamientos detectados. A 768 se reorganiza el mosaico; a 375/320 se apilan destacado y álbumes, conservando diferencias de proporción. Los filtros se distribuyen en filas y los controles móviles tienen áreas cómodas.

En el detalle móvil, título y categoría preceden a la foto; las miniaturas ocupan una sola fila. Se conserva el DOM semántico, el nombre del diálogo y el orden de controles interactivos. Se verificaron navegación por foto y foco tras cerrar después de ese refinamiento.

La variante oscura utiliza las variables existentes. Las ilustraciones conservan fondos pastel con tinta azul oscura; tarjetas y textos periféricos adoptan el tema. No se modifica la persistencia del tema. No se añaden animaciones ni autoavance; se comprobó la experiencia con movimiento reducido.

## Pruebas

Correctos:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
node scripts/check-community-model.mjs
node scripts/check-community-publication.mjs
node scripts/check-community-challenges.mjs
node scripts/check-community-gallery.mjs
```

- Modelo general: 29 comprobaciones y 4 comparaciones de igualdad.
- Publicaciones: 23 comprobaciones.
- Retos: 27 comprobaciones y una igualdad.
- Galería: 25 comprobaciones y 4 igualdades: relación con fuente, conteos, filtros, orden, calendario, creación, guardia demo, aprobación, rechazo, comentarios, reacciones, reinicio y ausencia de mutaciones.
- Brave: **40 verificaciones de interacción en escritorio y a 375 px**, incluidas filtros, detalle, navegación circular y por teclado, foco, modales apilados, creación, moderación, reinicio y tema. El script es una función para la herramienta browser_run_code_unsafe existente; requiere Vite en 127.0.0.1:5173 y no incorpora Playwright a las dependencias del producto.
- A 320 px se comprobaron navegación de fotos, Escape, restauración de foco, diálogo sin desbordamiento y título antes de la foto. Inspección responsive en los cinco anchos y capturas claras/oscuras.
- Brave sin errores ni advertencias de consola. No se probaron Opera GX, Firefox, Safari, lectores de pantalla completos ni dispositivos físicos en esta fase.

## Comparación y limitaciones

Se realizó Implementación → Captura → Comparación → Refinamiento: se cambió la disposición cronológica inicial por una selección editorial explícita para acercar colores y posiciones al PNG, se corrigió la fecha relativa por calendario y se afinó la disposición móvil del detalle. Se verificó de nuevo tras los ajustes.

El PNG local fue la fuente visual efectiva. Durante la comprobación adicional apareció disponible la integración de Figma, pero get_design_context para el nodo 10:2 devolvió límite de llamadas del plan Starter. No se obtuvo contexto de capas; no se atribuyen dimensiones a la API.

Diferencias deliberadas: seis álbumes y conteos reales frente a siete tarjetas con cantidades ilustrativas del PNG; dos filtros inicialmente vacíos; títulos editoriales ligados a las historias disponibles; últimas dos tarjetas más anchas; cabecera aprobada de cuatro secciones; aviso y pie compartidos conservados; controles, conteos y nota de privacidad adicionales. Los emojis cambian según sistema operativo. Móvil y oscuro son adaptaciones, sin referencia PNG propia.

La vista móvil completa es larga (unos 3386 px a 375 y 3503 px a 320 en claro). Se priorizó mantener las seis colecciones y los controles. Las etiquetas secundarias de escritorio son pequeñas, próximas al PNG; en móvil aumentan. Solo hay tres fuentes fotográficas repetidas, algo que limita la variedad dentro de los detalles.

No hay backend, subida de archivos, persistencia de álbumes, autorización real, edición de álbumes independientes ni nuevo sistema de Logros. Las fotos y la fuente tipográfica requieren conexión; StockImage conserva el fallback existente. No se cambian Inicio, Retos, Logros, landing, administración, reference/, diseños aprobados, paquetes ni dependencias. No se hace commit, push, merge o despliegue. **La fase 4 se detiene para revisión; Logros queda pendiente.**

