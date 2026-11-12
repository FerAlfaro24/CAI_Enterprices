# Galería privada conectada al diseño oficial

Bloque 7 comprobado localmente el 12 de noviembre de 2026. Rama `feat/v1-private-gallery`, base `db45ac6` de `feat/v1-inbox-recovery-contact`. Conserva v1.0 y las integraciones acumulativas anteriores; no son ramas independientes que deban fusionarse una por una. Puntos de retorno: `a703087` (bloqueo de archivos privados), `d763e94` (servicio/almacenamiento) y `9bd1c03` (interfaz/pruebas).

## Recorrido disponible

Administración abre **Galería privada** en el menú original. Elige un JPEG/PNG, revisa su vista previa, escribe título, descripción y texto alternativo, elige categoría y programa/grupo activo y anota una referencia interna de autorización. Publicar exige confirmar la revisión de imagen, permisos y destinatarios. Cambiar campos exige confirmar nuevamente. Una referencia no demuestra por sí misma la existencia o validez de un permiso: el proceso real de CAI continúa pendiente de validación humana.

La imagen aparece en la galería existente de alumnos activos del mismo programa y grupo. Se reutilizan GalleryView, FeaturedAlbum, AlbumCard, AlbumCover, GalleryImage y AlbumDialog: portada, tarjetas, filtros, orden y visor con cierre por teclado/foco. El modo conectado no incorpora stock, editor ficticio, celebraciones inventadas ni enlaces a conversaciones sin conectar. Cada imagen administrativa forma un álbum de una fotografía; no se añadió un editor de colecciones ni subidas de alumnos.

Administración puede cancelar o confirmar la retirada. Confirmar impide futuras lecturas incluso por URL y para administración. El registro permanece en Retiradas con su referencia/historial; no permite republicarlo. La actualización de Community quita la tarjeta y cierra el visor si seguía abierto. La instantánea se actualiza al volver a la ventana, con Actualizar comunidad o mediante el temporizador existente de 15 segundos cuando la página está visible. Retirar impide nuevas consultas; no borra copias que una persona ya haya descargado.

## Almacenamiento y permisos

- Migración 9 aditiva, con respaldo previo de la base local; no recrea cuentas ni borra datos anteriores. SQLite guarda únicamente la imagen procesada como BLOB junto a su audiencia, metadatos, referencia privada, revisión y retirada. El archivo original no se conserva en el servicio. El archivo fuente elegido por el usuario no se modifica.
- JPEG/PNG estáticos, máximo 3 MB y 12 millones de píxeles. `sharp` decodifica el contenido real, rechaza formatos fingidos/dañados, reorienta, limita a 1600 px por lado sin agrandar y recodifica a WebP sin conservar metadatos del original. Se incorporó esta dependencia para decodificación/recodificación real; no otro framework. Máximo dos procesados simultáneos, tiempo de procesado limitado y límite local de intentos por administrador.
- Capacidad local inicial de 128 MB de imágenes procesadas, incluidas las retiradas. Retirar no libera ese espacio porque se conserva el historial. La política de retención/borrado y la capacidad de entrega se definen antes de producción; no se añadió borrado destructivo automático.
- Cada consulta de bytes comprueba una sesión vigente y su rol/audiencia. Un alumno de otro grupo recibe 404; sin sesión, 401. Suspender/reasignar revoca sesiones previas y vuelve a exigir acceso autorizado. Un grupo archivado conserva lectura para sus alumnos actuales e impide nuevas publicaciones administrativas. No se revela la referencia de autorización, cuenta administrativa ni bytes en el listado del alumno.
- El recurso usa `image/webp`, `private, no-store`, `nosniff` y restricción de origen. No hay archivo estático accesible por nombre, ruta de disco ni URL pública. Las escrituras mantienen control de origen, revisión, auditoría y validación estricta; la sesión se comprueba otra vez después de procesar. La clave de envío conserva un reintento sin duplicar la imagen.
- El respaldo consistente de SQLite incluye los BLOB; se comprobó abrir una copia restaurada y recuperar los mismos bytes junto con las cuentas. La restauración operativa completa en la infraestructura final sigue pendiente.

## Corrección de acceso directo durante desarrollo

Una prueba HEAD anónima detectó que Vite servía archivos de `.local` directamente con estado 200, al margen de la protección de la API. Se añadió `server.fs.deny` para `.local` y Git, incluidas variantes de mayúsculas en Windows y conservando las exclusiones de secretos de Vite. La comprobación usa HEAD, sin cookies y sin descargar cuerpos de base de datos o credenciales.

`scripts/check-private-paths.mjs` comprobó siete rutas con respuesta 403: base/credenciales, mayúsculas, punto codificado, consulta raw, Git y ruta absoluta mediante @fs. Este control protege el servidor de desarrollo; no sustituye configurar la infraestructura final. No se afirma que haya ocurrido un acceso de terceros.

## Archivos principales

Servidor: `server/gallery.ts`, `contracts.ts`, `database.ts`, `app.ts` y `server/tests/gallery.test.ts`; dependencia y lockfile. Interfaz: `GalleryUploader`, `AdminGalleryPage`, menú/router/estilos del panel, API/ConnectedCommunity y componentes existentes de galería. Pruebas: `check-private-gallery.browser.mjs`, regresión del modelo existente y `check-private-paths.mjs`. Continuidad: este documento, PROJECT_STATE, AGENTS y README.

## Comprobaciones realizadas

- `npm run test:api`: 71 resultados correctos, incluidos siete contenedores. Casos nuevos: formatos fingidos/SVG/GIF/daño, límites de bytes/píxeles y campos, salida WebP reducida sin EXIF/ICC/XMP, idempotencia/revisión, sesión caducada durante procesado, permiso por recurso, reasignación/suspensión, grupo archivado, retirada y respaldo/reapertura con bytes idénticos. Incluye las regresiones previas de acceso, menores, catálogo, moderación, recuperación y Google con verificador controlado.
- `check-private-gallery.browser.mjs`: 37 comprobaciones completas en Brave y 37 en Opera GX. Administrador, alumno, otro grupo y visitante en contextos aislados; imagen falsa rechazada sin perder campos, respuesta perdida después del guardado y reintento único, referencia privada, acceso directo denegado, filtros/visor, Escape/foco, cancelación/retirada e historial. Cero errores de ejecución JavaScript en esos recorridos. Las denegaciones y el fallo de red introducido son escenarios esperados.
- Administración, galería de alumno y visor a 1440, 768, 375 y 320 px en ambos navegadores, sin desbordamiento. Inspección visual adicional en Brave de administración escritorio/móvil, galería escritorio/móvil y visor a 320 px. Todas las imágenes utilizadas son rectángulos ficticios sin personas. La imagen de revisión visual se retiró al terminar.
- Modelo histórico de galería: 25 comprobaciones y cuatro comparaciones de igualdad correctas. Siete rutas privadas bloqueadas con 403. Lint, typecheck, build y revisión de espacios de Git correctos. Queda el aviso de paquete principal de ~704 KB minificado.
- `npm audit --omit=dev`: cero avisos al cierre. La instalación informó diez avisos moderados en el conjunto de herramientas de desarrollo ESLint/minimatch; no en sharp. La resolución propuesta exige cambios incompatibles, por lo que queda registrada para estabilización, sin ejecutar `audit fix --force`.

El primer typecheck de interfaz señaló una conversión de evento y una comparación ya inalcanzable al habilitar Galería; corregidas antes de los recorridos completos. Durante la inspección visual se corrigió únicamente el selector del script que buscaba el correo en el listado de alumnos: está en el expediente de solicitud, no en ese DTO mínimo. No fue un fallo de la aplicación ni invalida los recorridos completos.

Para repetir el recorrido se prepara una imagen ficticia en `.local/fixtures/gallery-test.png` con sharp y se pasa su ruta absoluta como `fixturePath`, además de las credenciales locales sin imprimirlas. El script exporta `checkPrivateGallery(page, {email,password,browserLabel,fixturePath,baseURL})` y utiliza Playwright ya disponible. Los registros ficticios permanecen como historial; no ejecuta borrado de alumnos ni imágenes.

## Límites y siguiente paso

Comprobado localmente; no apto todavía para alumnos reales ni publicación. Sin subidas de alumnos, vídeos, edición de imágenes publicadas, álbumes múltiples, gestión de consentimientos como expediente documental, comentarios/reacciones persistentes ni CDN. Los archivos y permisos reales requieren validación del cliente; no se inventaron autorizaciones.

Siguiente bloque autónomo: **8, consolidar navegación y rutas provisionales** después de verificar la equivalencia de sus acciones. Conservar la ficha de inscripción y enlaces privados útiles; redirigir donde corresponda sin borrar datos, ramas o servicios ni abrir rutas protegidas. Después, estabilización conjunta: incidencias de herramientas, tamaño de paquete, errores/red, respaldo y guía sencilla de administración. Edición completa de expediente/perfil y otras cuentas administrativas siguen pendientes del alcance ya registrado. Google/correo reales, contenido, revisión con administrador, presupuesto y alojamiento permanecen en la tanda final.

Referencias técnicas primarias utilizadas: [entrada y límites de sharp](https://sharp.pixelplumbing.com/api-constructor/), [salida y metadatos de sharp](https://sharp.pixelplumbing.com/api-output/) y [exclusiones del servidor Vite](https://vite.dev/config/server-options#server-fs-deny). La ausencia de metadatos y el bloqueo se comprobaron además con pruebas propias.
