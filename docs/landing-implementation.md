# Landing institucional de CAI — Issue #2

Implementación local en `feat/landing-page`, a partir de la referencia aprobada en `reference/cai-original/`. Conserva el orden, la paleta, Figtree, los logotipos, los bloques alternados, degradados, tarjetas y composición responsive de la propuesta. Es un prototipo para revisión, sin autenticación, backend, pagos ni usuarios reales.

Issue consultado: [Construir landing pública de CAI #2](https://github.com/FerAlfaro24/CAI_Enterprices/issues/2).

## Arquitectura y archivos

| Archivo o directorio | Responsabilidad |
| --- | --- |
| `src/app/router.tsx` | Asigna `/` a `LandingLayout`; conserva comunidad, administración y 404 dentro de `AppLayout`. |
| `src/layouts/LandingLayout.tsx` | Aviso compartido, navegación entre áreas, cabecera, contenido de ancho completo, footer y navegación por anclas con foco. |
| `src/pages/InstitutionalPage.tsx` | Compone las 12 secciones del contenido y establece el título de la página. |
| `src/features/landing/components/LandingHeader.tsx` | Cabecera sticky, menú móvil y desplegable accesible de programas. |
| `src/features/landing/components/LandingFooter.tsx` | Footer institucional y estados pendientes de enlaces oficiales. |
| `HeroSection.tsx` | Hero, CTA, fotografías ilustrativas y ejemplos de prueba social identificados como ficticios. |
| `TrustSections.tsx` | Franja de preparación y estadísticas ficticias. |
| `HistorySection.tsx` | Trayectoria y cronología de muestra. |
| `ServicesSection.tsx` | Servicios y vista ilustrativa de aprendizaje, sin funciones educativas reales. |
| `ProgramsSection.tsx` | Testimonios, públicos, CTA intermedio y programas; reutiliza las tarjetas desplazables. |
| `ContactSections.tsx` | Propuesta de cursos futuros, FAQ y contacto. |
| `CardCarousel.tsx` | Scroll-snap nativo, controles de desplazamiento y acceso por teclado. |
| `DemoForm.tsx` | Formularios de contacto y lista de interés con validación y mensajes de estado. |
| `ui.tsx`, `utils.ts` | Botones de enlace, iconos SVG, notas y composición de clases. |
| `data/content.ts` | Datos TypeScript: navegación, fotos, estadísticas, historia, servicios, testimonios, programas, FAQ y footer. |
| `hooks/useLandingMotion.ts` | Apariciones progresivas y contadores; respeta movimiento reducido y limpia observadores, animaciones y frames. |
| `landing.module.css` | Variables de identidad y estilos encapsulados de la landing. |
| `src/assets/cai/` | Copias de `logo-cai-emblema.svg` y `logo-cai-blanco.svg`. |
| `index.html` | Figtree desde Google Fonts, preconexiones, favicon CAI y color del navegador. |
| `src/styles/index.css` | Único ajuste compartido: sustituye el mínimo rígido de 320 px del body por 0 para evitar overflow cuando la barra vertical reduce el área útil. |

Los nombres de componentes sin directorio en la tabla pertenecen a `src/features/landing/components/`.

`AppLayout`, `MainNavigation`, `PrototypeNotice`, comunidad, administración y 404 conservan su código. Las otras rutas mantienen Arial y el diseño provisional. La landing no depende en ejecución ni compilación de `reference/`. No se agregaron dependencias ni se modificó el lockfile.

## Secciones

Cabecera → hero → franja de confianza → estadísticas → trayectoria → servicios y mockup → testimonios → públicos → CTA → programas → cursos futuros → FAQ → contacto → footer.

El aviso de prototipo y la navegación entre áreas se muestran antes de la cabecera. Hay enlaces explícitos a `/community` identificados como demo. La plataforma futura de cursos se explica por separado y no se presenta como una función existente ni como la comunidad privada.

## Interacciones y accesibilidad

- Menú móvil hasta 1100 px; el contenido mantiene los cambios originales de 960, 640 y 380 px. El cambio de navegación se adelantó para evitar la cabecera desbordada observada cerca de 961 px en la referencia.
- Al abrir el menú se alinea la cabecera con la parte superior y se enfoca el primer enlace. Tab y Shift+Tab recorren el menú y el botón de cierre; el contenido de fondo queda `inert` y se bloquea el scroll. Escape, fondo, enlaces y cambio a escritorio cierran el menú. Se restauran `inert` y el scroll al cerrar o desmontar.
- El desplegable usa un botón con `aria-expanded` y `aria-controls`; cierra mediante Escape, clic exterior o salida del foco. Su visibilidad y sus atributos dependen del mismo estado React. No usa apertura exclusivamente por hover.
- Las anclas conservan identificadores, historial y URL. El destino recibe foco y queda por debajo de la cabecera sticky. Hay enlace para saltar al contenido.
- El FAQ utiliza `details`, `summary` y agrupación nativa mediante `name`, con una respuesta abierta a la vez en los navegadores comprobados.
- Las tarjetas permiten desplazamiento nativo, scroll-snap, flechas accesibles y foco de teclado; no hay carrusel automático.
- Los formularios incluyen etiquetas, campos requeridos, errores asociados mediante `aria-describedby`, `aria-invalid`, foco al primer error y una región `role="status"` con `aria-live="polite"`.
- El contacto admite correo o teléfono con 10–15 dígitos. La validación comprueba el formato, no la existencia ni la titularidad. El nombre requiere al menos dos caracteres tras quitar espacios; el programa debe pertenecer al catálogo.
- Los datos de entrada se usan solo para validar en memoria y se limpian tras una prueba válida. No hay fetch, servicio de formularios, cookies propias, almacenamiento local ni de sesión para guardarlos. Los mensajes explican que no se envía información, no se reserva una clase y no se enviarán avisos.
- Los valores finales de las estadísticas están presentes desde el renderizado; el texto accesible permanece estable durante la animación. Con movimiento reducido no se animan cifras ni elementos CSS/JavaScript. El contenido no depende de quedar oculto hasta ejecutar un observador.

## Diferencias deliberadas respecto de la referencia

1. Se añade el contexto visible de prototipo y la navegación a las tres áreas.
2. Se mantienen las cifras y fechas originales únicamente como muestras ficticias; se reformulan promociones, afirmaciones y CTA que parecían ofertas vigentes.
3. Se identifican los testimonios como ficticios y sus fotografías como stock. No se asocian con alumnos reales.
4. Se sustituyen las fotografías del aula y de niños. Kids utiliza una biblioteca sin personas; trayectoria y programas utilizan reuniones de personas con apariencia adulta.
5. Se reutiliza una foto empresarial verificable en lugar de la imagen original cuya página de procedencia actualmente devuelve 404.
6. Los formularios no prometen contactos ni avisos inexistentes. Se mejoran validación y mensajes accesibles.
7. Redes, privacidad y términos se muestran como pendientes, sin enlaces `#` que parezcan operativos. No se publica teléfono, dirección o correo inventado como oficial.
8. Se corrigen foco móvil, estados del desplegable, contraste del texto de éxito y movimiento reducido.
9. Se añade carga diferida para fotografías fuera del hero, dimensiones declaradas y controles de tarjetas. El hero conserva carga prioritaria.
10. Los efectos del script original se adaptan al ciclo de vida de React, sin listeners globales permanentes ni manipulación de clases de otras rutas.

## Procedencia de recursos visuales

Los dos logotipos proceden de los materiales CAI aportados y aprobados para esta adaptación. La carpeta original permanece intacta; la aplicación compone JSX y no carga el HTML ni el JavaScript de la referencia.

Las fotografías se sirven desde `images.unsplash.com`. Se contrastaron sus identificadores con las páginas oficiales siguientes y se revisó su presentación visual. No son fotografías de alumnos, docentes ni instalaciones de CAI. La apariencia adulta de los retratos y reuniones se revisó visualmente; no constituye una verificación documental de edad. La fotografía del portátil solo muestra manos y brazos.

| Uso | Autor mostrado por la fuente | Página oficial |
| --- | --- | --- |
| Hero | Brooke Cagle | [Friends at a coffee shop](https://unsplash.com/photos/a-group-of-friends-at-a-coffee-shop--uHVRvDr7pg) |
| Trayectoria, públicos y programas | Mimi Thian | [Four people watching a MacBook](https://unsplash.com/photos/four-people-watching-on-white-macbook-on-top-of-glass-top-table-vdXMSiX-n6M) |
| Programa Kids, sin personas | Janko Ferlič | [Library with turned on lights](https://unsplash.com/photos/photo-of-library-with-turned-on-lights-sfL_QOnmy00) |
| Propuesta de cursos | John, `@johnishappysometimes` | [Person using laptop](https://unsplash.com/photos/person-using-laptop-FlPc9_VocJ4) |
| Retrato ilustrativo 1 | Michael Dam | [Woman smiling](https://unsplash.com/photos/closeup-photography-of-woman-smiling-mEZ3PoFGs_k) |
| Retrato ilustrativo 2 | Joseph Gonzalez | [Man wearing white V-neck shirt](https://unsplash.com/photos/man-wearing-white-v-neck-shirt-iFgRcqHznqg) |
| Retrato ilustrativo 3 | Christopher Campbell | [Woman outdoors](https://unsplash.com/photos/shallow-focus-photography-of-woman-outdoor-during-day-rDEOVtE7vOs) |

La [licencia de Unsplash](https://unsplash.com/license), consultada el 17 de octubre de 2026, permite uso gratuito, incluso comercial, y aprecia la atribución. Prohíbe revender imágenes sin modificaciones significativas y recopilar imágenes para replicar un servicio competidor. Las páginas de las imágenes seleccionadas indican licencia Unsplash gratuita. La licencia no demuestra por sí sola las autorizaciones de personas, marcas o propiedades; véase la [explicación de Unsplash](https://help.unsplash.com/es/articles/2612329-autorizaciones-y-marcas-comerciales). Antes de una publicación comercial se deben revisar esos permisos y los materiales definitivos con el cliente.

Figtree se carga mediante la hoja de Google Fonts indicada en `index.html`. Las fotografías y la fuente requieren conexión; la fuente tiene fallback de sistema. No se garantiza una demostración offline completa.

## Contenido que debe validar el cliente

- Nombre y uso definitivo de la identidad, lema y fotografías.
- Oferta, edades, niveles, metodología, modalidades, tamaño de grupos y preparación para certificaciones; no se presume afiliación oficial.
- Fundación en 2010, hitos de 2015/2019/2026 y trayectoria de más de 15 años.
- 5000 alumnos, 40 empresas, 95 % de aprobación, valoración 4.9 y afirmación de nueve de cada diez. Todos son ejemplos sin evidencia aportada.
- Testimonios definitivos y autorizaciones; los actuales son personajes y experiencias ficticias.
- Tarifas, inscripción, materiales, duración, pagos, facturación, promociones y condiciones de clase muestra.
- Teléfono, WhatsApp, sede, horarios, correo, redes y textos legales.
- Alcance de los cursos futuros, su eventual lista de interés y cualquier fecha de lanzamiento. No existe compromiso de implementar esos cursos en este Issue.

## Comprobaciones

Resultados de la revisión del 17 de octubre de 2026. La comparación visual utiliza la referencia original y capturas del navegador; no hay una prueba automática de igualdad de píxeles.

| Control | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Correcto. |
| `npm.cmd run lint` | Correcto, sin advertencias. |
| `npm.cmd run build` | Correcto. Genera archivos locales en `dist/`; no despliega. |
| Brave: `/`, `/community`, `/admin` y 404 | Carga directa, títulos, aviso y un único main correctos en 1440, 1024, 768, 375 y 320 px; sin overflow horizontal. |
| Aislamiento visual | Comunidad, administración y 404 conservan Arial y el layout compartido; Figtree se limita a la landing. |
| Navegación | Enlaces entre áreas, atrás/adelante y retorno a la landing correctos. |
| Menú y desplegable | Foco inicial, recorrido Tab/Shift+Tab, Escape, fondo, anclas, salida hacia comunidad, cambio a escritorio y restauración de efectos comprobados. |
| Anclas y salto al contenido | URL, foco y destino visible bajo cabecera comprobados. |
| FAQ y tarjetas | Una respuesta abierta; controles de desplazamiento horizontal comprobados. |
| Formularios | Vacíos, correo/contacto inválido, selección de programa, valores válidos, limpieza y mensajes accesibles comprobados con datos ficticios. Sin solicitudes de escritura ni persistencia de entrada. |
| Movimiento reducido | Cifras finales desde el inicio, hero sin animación y cero animaciones activas en la comprobación. |
| Recursos | Todas las imágenes utilizadas cargaron durante la revisión. |
| Compilación en preview | Las cuatro rutas y los cinco anchos se comprobaron también sobre `dist/` servido por Vite preview; menú, anclas, FAQ y formulario correctos. |
| Opera GX sobre preview | `/`, `/community` y `/admin` a 1440, 375 y 320 px, menú con foco, Escape y FAQ correctos; sin overflow horizontal. |
| Consola sobre preview | Sin errores ni advertencias registrados durante los recorridos de Brave y Opera GX. |
| Integridad de referencia | Los hashes SHA-256 de sus 14 archivos coincidieron antes y después de la implementación. |
| `git diff --check` | Correcto. |

Las capturas y logs temporales de navegador se retiraron de la entrega. No hay auditoría completa con lector de pantalla, dispositivos físicos ni pruebas con personas reales. No se agregó un framework de pruebas ni se instaló Prettier, que no está configurado en este proyecto.

## Cómo ejecutar y revisar

Con las dependencias ya instaladas:

```powershell
npm.cmd run dev
```

Abrir la URL que muestra Vite, normalmente `http://localhost:5173/`. Probar los enlaces de comunidad y administración, recorrer todas las secciones y utilizar exclusivamente datos ficticios en los formularios.

Para revisar la compilación:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run preview
```

Abrir la URL de preview que indique Vite. La recarga de rutas en un futuro hosting requerirá fallback al `index.html` de la SPA. Esta tarea no configura alojamiento ni realiza commit, push, merge o despliegue.
