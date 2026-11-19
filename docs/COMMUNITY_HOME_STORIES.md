# Inicio de comunidad, historias y álbumes

**Entrega del 19-11-2026 · rama `feat/v1-community-home-stories`, desde `422b4d2` de `feat/v1-official-media`.** Backend `4e60bcd`, interfaz/verificador `86df7f6`. Solicitud: renovar Inicio con contenido real y preparar una comunidad ficticia activa para presentar hoy al cliente. Reutilizar publicaciones, fotos, moderación, comentarios y reacciones existentes.

## Decisiones implementadas

- La publicación es la historia y el lugar de la conversación. Puede incluir hasta doce fotos. El álbum es una selección de esas fotos, y Galería es su archivo visual; no se duplican ni los archivos ni los comentarios.
- Coordinación tiene un único formulario para historia, aviso o álbum; destinatarios, fotos nuevas o ya disponibles, guardar en Galería, destacar en Inicio y fecha opcional para dejar de mostrarlo.
- Los avisos compartidos de CAI son distintos de las notificaciones privadas de inscripción/revisión/recuperación. Estas últimas nunca alimentan el carrusel.
- Inicio conectado utiliza fotografías autorizadas, avisos destacados y publicaciones. Las ilustraciones se conservan en la demo histórica en memoria, separada de las cuentas conectadas.
- Los alumnos conservan sus historias de texto/logros y su moderación por grupo. Inicialmente solo coordinación añade fotos. La creación oficial usa una autoría institucional real, sin una cuenta de alumno ficticia como sustituto.
- Se conserva la audiencia anterior de cada foto. Una publicación no puede ampliar sus destinatarios. Las seis oficiales siguen siendo para todos los aprobados. Los archivos privados permanecen fuera de GitHub, que figura público.
- Fotografías nuevas del formulario permanecen privadas como borradores hasta publicarse. Al retirar una publicación, dejan de estar disponibles su historia, imágenes y álbum asociados; la conversación y auditoría se conservan sin mostrarse. Avisos vencidos tampoco aparecen.

## Demostración para el cliente

`node server/tests/community-showcase-server.ts` crea una base nueva bajo `.local/tests/community-showcase-*` y abre web 4187/API 3197 por defecto. Acepta otros dos puertos locales como argumentos. No abre ni modifica `.local/cai.sqlite`, no usa acceso habitual y rechaza producción.

Requiere el paquete privado de [fotografías oficiales](OFFICIAL_MEDIA.md) en `.local/official-media`. Crea once cuentas ficticias, ocho publicaciones (dos álbumes, un aviso, un consejo de inglés y cuatro historias de alumnos), 24 comentarios aprobados y 76 reacciones de ejemplo guardadas en la base de prueba. Las fotos oficiales se asocian a publicaciones de Equipo CAI, sin identificar a las personas con los alias inventados. La cronología es ilustrativa de la demo, no una fecha atribuida a los eventos de las fotos.

La interfaz muestra un aviso visible de que historias, perfiles, comentarios y reacciones son ficticios. No hay ruta web para llenar una instalación real con estos ejemplos. Las interacciones funcionan: cambiar reacciones, enviar comentarios a revisión y moderar desde administración.

Accesos exclusivamente ficticios: `bob@example.test` (alumno) y `admin@example.test` (coordinación). Frase de la fixture: `Frase ficticia para fotos oficiales 2026`. No son credenciales de entrega o producción. Metadatos de la última presentación en `.local/tests/community-showcase-latest.json`; conservar el proceso abierto durante la presentación. Reiniciar el script crea otra fixture independiente.

## Migración 18 y continuidad

Se amplía la tabla de publicaciones para autor institucional, audiencia, tipo, Galería, destacado y vencimiento, manteniendo IDs y referencias de comentarios/reacciones/insignias. La reconstrucción sigue el [procedimiento documentado por SQLite](https://www.sqlite.org/lang_altertable.html#making_other_kinds_of_table_schema_changes), con transacción, comprobación de referencias y restauración de claves foráneas. `publication_images` vincula cada imagen a una historia y conserva su orden; cada archivo pertenece a una conversación. Las fotos históricas sin vínculo siguen disponibles con sus permisos anteriores.

Preflight productivo pasa a exigir esquema 18; backups compatibles 9–18. El arranque productivo no migra una base. Actualizar instalaciones existentes exige copia consistente y ensayo previo sobre una copia separada. No se realizó esa actualización en la instalación habitual.

## Verificación

- **233 API correctas**, ocho resultados nuevos de contenido (siete subcasos y su contenedor): borradores privados, creación institucional, recursos y audiencias, reintentos, conversación/reacciones comunes, aislamiento de historias por grupo, revisión concurrente, retirada, vencimiento y rechazo de demo en producción antes de abrir datos. La suite anterior y sus ensayos de esquemas históricos se conservaron y adaptaron a la versión 18.
- **76 comprobaciones nuevas de navegador**, 38 en Brave y 38 en Opera GX: 28 de Inicio/carrusel, conversación compartida, reacción/quitar reacción, Escape, filtros/paginación, fotos, temas, 1440/768/375/320, preferencia de movimiento reducido, creación/retiro de aviso; 10 de álbum con dos archivos nuevos, confirmación al editar, panel a 1440/375/320, recorrido de fotos y retirada de todas las vistas.
- Se corrigió la reacción del carrusel ante cambios de movimiento reducido, usando una suscripción explícita a la preferencia del navegador. Los fallos de selección de datos/relleno sin cambio de valor durante la preparación del verificador se corrigieron en las pruebas; los resultados anteriores son las ejecuciones completas posteriores.
- ESLint, tipos, build y diff check correctos. Los verificadores se guardan en `scripts/check-community-home.browser.mjs`; resultados/capturas en `.local/tests/community-home-*`, fuera de Git porque incluyen fotografías privadas.
- La aceptación del cliente/administrador real, infraestructura/TLS, correo/Google reales y actualización de una instalación existente siguen pendientes. No se desplegó ni se alteró la instalación habitual. Las cifras anteriores de 225 API y otras matrices son históricas y no se suman.


## Archivos principales

Backend: `server/community-content-migration.ts`, `community-media.ts`, `institutional-posts.ts`, `publications.ts`, `gallery.ts`, `comments.ts`, `reactions.ts`, `app.ts`, contratos y comprobaciones de producción/respaldo. Frontend: `home/ConnectedHomeHero.tsx`, `HomeView.tsx`, `RecentAlbums.tsx`, `admin/components/OfficialPublisher.tsx`, `AdminPostsPage.tsx`, `AdminGalleryPage.tsx`, adaptadores, galería y componentes de conversación. Se conservan el diseño/ilustraciones de la demo histórica y los módulos ya conectados.


## Presentación final comprobada

Se dejó en `http://127.0.0.1:4187/community`, iniciada con el script de presentación y sin datos de las pruebas de navegador. Lectura de solo consulta de esa fixture: esquema 18, ocho publicaciones, 24 comentarios publicados, 76 reacciones y seis fotos vinculadas; quick_check correcto. Acceso/renderizado completo y consola sin errores comprobados también en el navegador integrado. Las fixtures temporales de comprobación de 4188/4190 se detuvieron; sus archivos se conservaron. La API habitual y su acceso permanecieron intactos.
