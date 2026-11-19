# Fotografías oficiales de CAI

> Continuación del mismo día: [Inicio, historias y álbumes](COMMUNITY_HOME_STORIES.md), esquema 18. Las fotos se pueden vincular a publicaciones de Equipo CAI desde un único formulario; las conversaciones se comparten entre Inicio y Galería. Esta guía conserva la selección y evidencia del corte de fotografías. El preflight actual exige 1–18.

**19-11-2026 · código `cfea458`, rama `feat/v1-official-media`, desde `d410247` de `feat/v1-production-preparation`.** Integración autorizada por el usuario: página pública con materiales/aula/práctica en línea; convivencias y cumpleaños visibles para **todos los alumnos aprobados**. No es un despliegue ni una carga sobre la instalación habitual.

## Selección y preparación

Se revisaron 27 JPEG de los dos ZIP de WhatsApp del 17-11-2026. Se eligieron diez escenas. Los originales, archivos ZIP, hojas de contacto y revisión permanecen fuera de Git en `.local/media-review`; Git conserva únicamente los cuatro recortes públicos y el manifiesto; los seis recortes privados quedan fuera del repositorio. **GitHub muestra el repositorio como público:** los cumpleaños y convivencias nunca se agregan a Git. Se preparó el paquete privado local `.local/media-review/cai-private-community-v1.zip`, que contiene la carpeta `official-media`. Conservarlo en un medio privado; no adjuntarlo a issues, PR o releases públicas. SHA-256 del paquete: `af873ce503311f533b2c52b2dbe3e57f644510bead95f5d9ae6cdf0ed7cc0ed1`. Al instalar, extraer esa carpeta dentro de `.local` en modo local o dentro de CAI_DATA_DIR en producción. El acceso a las fotos no depende de que el código fuente sea privado.

El [manifiesto](official-media-manifest.json) registra archivo/lote de origen, SHA-256, coordenadas de recorte, destino, dimensiones y tamaño. No se retocan personas ni se inventan fechas, nombres o testimonios.

| Destino | Fotografías | Uso |
| --- | --- | --- |
| Público | CAI-17, 09, 08, 02 | Taza/materiales en portada; aula en trayectoria; práctica en línea; tres tarjetas de «Así se aprende en CAI». |
| Comunidad privada | CAI-12, 14, 16, 25, 26, 27 | Seis recuerdos de cumpleaños/convivencias; categorías, descripción y texto alternativo propios. |
| Referencia sin publicar | Logos y anuncios | Se conserva la identidad existente. No copiar promociones, fechas, teléfonos ni afirmaciones sin validarlos. |

Se recortaron cabeceras, botones, iconos de sonido y rótulos donde fue posible sin reconstruir la imagen. CAI-15 se excluye por repetir la escena de CAI-14. Las fotos públicas suman **339,914 bytes** en WebP; los seis archivos privados preparados suman **696,422 bytes** en JPEG, que el servidor vuelve a procesar a WebP al publicarlos. Sin EXIF, sin ampliación de los originales. La vista ampliada permite ver el recorte completo; las portadas de tarjetas se adaptan a su espacio.

Se retiraron del sitio público los retratos de stock y los tres testimonios ficticios para no asociar fotografías reales con identidades/comentarios inventados. Los textos comerciales y las estadísticas restantes siguen marcados como muestra y requieren validación de CAI.

Para reproducir la preparación, recuperar los originales por las referencias y hashes del manifiesto. La carpeta de revisión debe contener los JPEG normalizados como CAI-xx.jpeg y su manifest.json original (id, archivoOriginal, zip). Ejecutar `node scripts/prepare-official-media.mjs RUTA_DE_REVISION`. No es necesario regenerar las imágenes para instalar el proyecto: las cuatro imágenes públicas están en Git y las seis privadas se entregan por separado.

## Uso para coordinación

1. Abrir **Galería privada** desde administración con una cuenta autorizada.
2. En **Fotos oficiales de CAI**, marcar **Compartir las seis fotos con todos los alumnos aprobados** y pulsar **Cargar fotos oficiales**.
3. Las fotos aparecen en la lista y en la galería de alumnos. La referencia interna de autorización queda solo en administración. Los aprobados sin grupo asignado también ven las fotos comunes.
4. Repetir la carga no duplica fotos. Si se interrumpe, reintentar continúa lo que falta. Una foto retirada conserva su historial y no se vuelve a publicar al repetir la carga.
5. Para nuevas fotos, elegir **Un grupo específico** (valor inicial, con programa/grupo obligatorio) o **Todos los alumnos aprobados**. Revisar archivo, destinatarios y permisos antes de confirmar.

La fecha mostrada es **Publicada el…**, fecha de carga, sin atribuir al evento una fecha que no se confirmó. Una retirada impide nuevas consultas; no puede retirar una copia que alguien haya guardado anteriormente.

## Persistencia, acceso y entrega

- Migración **17** añade `gallery_images.audience`, con `group` por defecto. No amplía la audiencia de imágenes anteriores ni cambia sus huellas de idempotencia. Las demás publicaciones siguen por grupo.
- Solo administración puede cargar/importar/retirar. Se comprueba sesión/origen y se revalida la sesión después del procesamiento. Pendientes, suspendidos y visitantes no reciben listados ni bytes privados.
- Los seis JPEG privados están fuera de Git: `.local/official-media` en local y `CAI_DATA_DIR/official-media` en producción. Vite bloquea `.local`, también con variantes de mayúsculas, escape, @fs, ?raw y ?url comprobadas. El paquete público dist contiene solo las cuatro fotos públicas. Servir únicamente dist en el alojamiento.
- La API guarda la versión WebP procesada en SQLite y sirve sus bytes a través del recurso autenticado existente, con no-store. La copia consistente conserva también las imágenes y sus audiencias.
- Al entregar, copiar el paquete de medios por un canal privado a la carpeta de datos anterior, fuera del código publicado. El runtime determina el directorio; el cliente no puede enviar rutas. Sin paquete instalado, la carga muestra un error útil y permite reintentar después; no busca archivos públicos alternativos. Las fotos ya guardadas en SQLite siguen disponibles aunque se retire el paquete original.
- Preflight productivo actual exige historial completo **1–18**; backups compatibles 9–18. Arranque productivo no migra bases. Antes de actualizar una instalación: copia consistente, ensayo en una copia separada y procedimiento explícito; no usar setup para sustituir datos/accesos existentes. Esta sesión no abrió ni migró la base habitual.

## Comprobaciones y límites

Suite completa de API tras integrar: **225 resultados correctos**, incluidos ocho de material oficial (siete subcasos y su prueba contenedora). Cubren migración 16→17, permisos anteriores, reintentos, audiencias, ausencia de EXIF, sesión caducada, suspensión, retirada, recuperación de carga parcial y copia de respaldo y ausencia del paquete privado. La suite utiliza imágenes sintéticas, de modo que funciona en un clon sin acceso a las fotografías privadas. Los ensayos antiguos que construyen esquemas históricos se ajustaron para retirar primero la migración 17; no se reinterpretan sus resultados anteriores.

Lint, tipos, build y `git diff --check` comprobados. Seis variantes de descarga directa al archivo privado devolvieron 403 en Vite. Comprobación del paquete público: cuatro imágenes oficiales públicas y ningún JPEG privado del catálogo.

Revisión manual en el navegador aislado integrado disponible: sitio, administración y alumno ficticios; carga de seis fotos/reintento sin duplicar, selección de audiencia, filtros, orden, apertura/cierre de álbum, Escape, textos, carga de imágenes y consola. Tamaños 1440/768/375/320 según la vista; temas claro/oscuro. Sin desbordamiento horizontal en las vistas comprobadas. La cuenta de otro grupo vio las seis fotos comunes y no la imagen sintética exclusiva del primer grupo.

**Brave/Opera no estaban disponibles mediante las herramientas de esta sesión.** No se declara repetida su matriz histórica. Pruebas y capturas usan fixtures nuevas en `.local/tests`, sin alumnos ni credenciales reales; las fotografías sí son el material oficial autorizado. Capturas locales en `.local/tests/official-media-proof`, sin subirlas como datos de cuentas. La aceptación de contenido/diseño por CAI y la verificación en alojamiento real siguen pendientes.

Para repetir la revisión aislada: `node server/tests/official-media-browser-server.ts`. Crea una base nueva cada vez, usa web 4187/API 3197 y deja metadatos ficticios en su propia carpeta de pruebas. No inicia el acceso habitual ni importa automáticamente el catálogo: probar la acción desde administración. Cerrar el proceso después de la revisión.

[Estado vigente](PROJECT_STATE.md) · [Próximos pasos](NEXT_STEPS.md) · [Pruebas](TESTING.md)
