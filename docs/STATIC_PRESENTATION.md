# CAI — presentación independiente de la computadora

## Versión y propósito

Rama `demo/v1-vercel-presentation`, desde `c1bf677` de `fix/v1-vercel-navigation`, que conserva la integrada `04bb0df` y F1–F6. Presentación ficticia autorizada por el usuario el25-11: variada, sin servidor local y con cambios independientes por navegador. La versión conectada continúa en `integration/cai-v1-completa-2026-11-25`; no fusionar este modo en ella o main como si fuera producción.

Vercel usa `npm run build:presentation` en esta rama y sirve únicamente dist. Los enlaces directos se resuelven con la configuración de navegación de PR#37. El acceso compartido debe crearse para esta rama; el enlace compartido anterior de la integrada no concede acceso automáticamente a una rama distinta.

## Cómo explorarla

- Portada en `/`; comunidad directamente en `/community`; coordinación en `/admin`.
- La barra inferior identifica la presentación y permite cambiar de área o reiniciar con confirmación.
- `/login` ofrece entradas de muestra como alumno/coordinación, sin pedir correo o contraseña.
- Registro admite solo datos ficticios: las solicitudes se guardan en ese navegador y se revisan desde su propio panel.
- Reacciones, comentarios inmediatos y borrado propio; fotos y visor; notificaciones; perfiles; Logros privados con imágenes; Retos actuales con aciertos/errores, puntos, repaso e insignias.
- Coordinación puede revisar solicitudes/publicaciones y crear publicaciones normales o avisos que aparecen en el carrusel.

Los datos se guardan en localStorage bajo `cai-presentation-v1`. Borrar el almacenamiento del sitio o confirmar Reiniciar restaura la muestra. Un navegador nuevo empieza con el contenido inicial; no recibe lo que otra persona publique. No existe autenticación ni autorización real en este modo. Usar solo contenido ficticio.

## Material y datos

`seed.json` contiene90 respuestas de ejemplo, generadas a partir de una fixture nueva de `community-showcase-server --client-presentation`, más ejemplos ficticios de lectura, música y series. Hay once personajes de alumnos y solicitudes de muestra; el Inicio añade una publicación propia, reacciones/comentarios y ejemplos de notificaciones. Se reutilizan las pantallas actuales, no la demo histórica de octubre.

Las imágenes privadas de convivencias/cumpleaños y sus blobs no se exportan: se sustituyeron las referencias por las cuatro fotografías oficiales que ya estaban autorizadas para la página pública. No hay bases, cookies, contraseñas, credenciales de Google/SMTP ni archivos de .local en el paquete. Las imágenes añadidas por el visitante permanecen en su navegador y pueden alcanzar su cuota de almacenamiento; el guardado falla con explicación si no caben.

Google, envíos de correo, contraseñas/equipo reales y edición de expedientes no se simulan. Algunas acciones administrativas avanzadas muestran un mensaje indicando que no están incluidas; no afirman cambios inexistentes. Este adaptador no mide permisos, seguridad ni entrega de correos de producción. No implementar Top ni vídeos por esta presentación.

## Separación de la aplicación real

`import.meta.env.MODE === 'presentation'` activa el adaptador únicamente al compilar. Un parámetro de URL no puede habilitarlo. `npm run build` conserva la aplicación conectada y se comprobó que sus JS compilados excluyen los marcadores, datos y adaptador de esta presentación. Ningún cambio de servidor, base, sesiones reales o dependencias.

Los módulos de presentación se cargan por importación dinámica: `store.ts` conserva datos, fechas y renovación de Retos; `community.ts` simula la actividad del alumno; `admin.ts` las operaciones administrativas; `requests.ts` enlaza esos comportamientos con el contrato actual; `PresentationTools.tsx` aporta entradas/controles. Las llamadas desconocidas fallan de forma explícita y nunca recurren a fetch.

## Comprobaciones realizadas

- `npm.cmd run build:presentation`: tipos y compilación correctos.
- `npm.cmd run lint`: correcto.
- Compilación conectada separada, sin marcadores de datos/adaptador ficticios; no se ejecutó su backend habitual.
- **39 comprobaciones finales en Brave y39 en Opera GX:78**, con contextos aislados; sin errores de JavaScript/consola y cero solicitudes a API local.
- Inicio/avisos; reacción y persistencia al recargar; comentario y eliminación propia; independencia entre navegadores; notificación normal archivada al cerrar; foto cargada y ampliada; resultado erróneo distinguible; tres respuestas con35 puntos para dos aciertos; insignia nueva y ausencia de repetición al recargar.
- Logro privado con imagen y palabras opcionales; registro/aprobación en el mismo navegador; publicación de un aviso y aparición en carrusel; once pantallas administrativas navegables; acceso sin contraseña; reinicio con confirmación.
- Sin desbordamientos en1440/768/375/320. Capturas de escritorio/móvil revisadas. Guion reproducible: `scripts/check-static-presentation.browser.mjs`; resultados/capturas locales en .local/tests.

Durante las pruebas se corrigió el formato de fecha de las solicitudes ficticias para ajustarlo al contrato del panel. Los primeros intentos del guion también ajustaron esperas de render y selección del visor; los78 anteriores corresponden a las tandas finales completas, no a los intentos fallidos. No repetir la suite histórica de servidor para sumar cifras: el backend no cambió.

El despliegue externo y su enlace compartido se verifican al quedar disponibles. No afirmar que la presentación pública esté comprobada solo por compilar localmente.
