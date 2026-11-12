> Fotografía del bloque 4. Grupos y Configuración se conectaron después: consultar `v1-groups-settings.md` y el registro vigente de `PROJECT_STATE.md`.

# Community y moderación v1.0 conectadas

Rama: `feat/v1-community-connected`, desde `cf12d8a` de `integration/cai-v1-connected`. Interfaz oficial preservada: `release/cai-demo-v1.0` (`f3ba46b`). Este documento describe integración local con datos ficticios, no una entrega de producción. Puntos de retorno: `4c0af54` (contrato público) y `f9e60bc` (interfaz, integración y pruebas). Los commits de este bloque se consultan con `git log -- docs/v1-connected-community.md`.

## Recorrido comprobado

El alumno entra por `/login` y llega a `/community`, protegido por la sesión del servidor. El editor original envía Logros o Experiencias a revisión; el historial muestra el estado y, cuando corresponde, el motivo de rechazo. El administrador usa la bandeja, filtros, tarjetas y ventana de revisión originales en `/admin/publicaciones`. Publicar exige confirmación expresa del contenido y privacidad. Aprobar muestra la historia en el feed avanzado del mismo programa/grupo. Devolver a revisión la oculta; rechazar comunica el motivo solo al autor. Retirar la conserva como retirada en el historial administrativo y no permite republicarla. Suspender al autor revoca su acceso y oculta sus publicaciones al grupo.

Las respuestas guardadas sobreviven a una recarga y al reinicio del servicio. No se añadieron dependencias ni se reconstruyeron el dashboard, Community o sus diseños. `/alumnos` conserva la inscripción; enlaza a Community. Las rutas locales históricas siguen disponibles hasta la consolidación del bloque 8, sin eliminar datos ni ramas.

## Datos y protección

- Migración 6 aditiva: `public_profiles`, con un UUID estable por inscripción. Respaldo local realizado antes de migrar. No expone el folio administrativo como identidad pública.
- Sesión propia: mantiene los datos privados necesarios de la cuenta y añade `publicId`. Grupo y autor público: únicamente identificador público, alias y color. La respuesta de publicaciones al compañero no añade campos de correo, fecha de nacimiento, nombre legal ni motivos privados.
- `ConnectedCommunity` consulta `student/me`, `student/group` y `student/posts`; adapta los datos al modelo visual existente sin cargar publicaciones, perfiles o actividad de muestra en el estado conectado. Las consultas usan permisos del servidor, no un selector de roles.
- Actualiza al recuperar foco/visibilidad, cada 15 segundos mientras la ventana está visible y mediante el botón Actualizar comunidad. No es un servicio de actualización instantánea. La bandeja de moderación ofrece Actualizar publicaciones para consultar envíos nuevos sin recargar la página. Al recibir 401 borra el estado visible y vuelve al acceso.
- Escrituras con exclusión de doble envío y revisiones para detectar cambios desde otra ventana. El editor conserva el texto cuando falla el envío; el mismo borrador reintentado mantiene la clave contra duplicados. Si el servidor confirma una escritura pero falla la actualización posterior, se informa del error de lectura sin repetir la escritura.
- No hay fallback a Alex Demo en el recorrido conectado. El perfil de otro miembro muestra solo su alias; no inventa biografía, fechas, insignias o puntos.

## Qué se reutilizó

`CommunityShell`, `CommunityWorkspace`, `HomeView`, `HomeHero`, `Composer`, `EditorialPostCard`, `PostCard`, `PostDetailDialog`, `MemberProfileDialog`, bienvenida/reconocimiento e historial; `AdminPostsPage`, `PostCard` y `PostDialog` administrativos, `useAdminConnection` y sus servicios anteriores. `MemberDirectory` tiene adaptación a miembros públicos; su consolidación de navegación/perfil completo pertenece al siguiente bloque, no se da por terminada aquí.

Los títulos largos desbordaban el encabezado de revisión móvil. Se corrigió la anchura mínima del contenedor flexible y el ajuste de palabras, conservando la composición original. El botón Retirar mantiene una etiqueta accesible con el título, con texto visual breve.

## Pruebas realizadas

- Servidor: 48 resultados correctos (incluidos cuatro contenedores). Se ampliaron las pruebas de privacidad para comprobar el UUID compartido entre sesión, directorio de grupo y autor; persistencia de los identificadores y migración única al reiniciar. Incluye permisos, aislamiento por grupo/programa, revisiones obsoletas, retiro, suspensión, respaldo y recuperación anteriores. Google se prueba con verificador controlado, no con una cuenta real.
- `scripts/check-community-connected.browser.mjs`: 39 comprobaciones en Brave y 39 en Opera GX. Administrador y tres alumnos en contextos separados: autor, compañero del mismo grupo y alumno de otro grupo. Envío real desde el editor, pendientes privados, confirmación de revisión, publicación/recarga, aislamiento, rechazo y motivo privado, devolución/republicación, retiro definitivo, suspensión y nueva entrada tras reactivación.
- Pérdida de respuesta simulada después de guardar: se conserva el borrador, el reintento usa la misma clave y se crea una sola publicación.
- Community, editor, bandeja y revisión a 1440, 768, 375 y 320 px en ambos navegadores. Se repitió el recorrido completo después de corregir el desbordamiento real. Cero errores de ejecución JavaScript en las cuatro sesiones de cada recorrido; los 401 esperados y la interrupción intencional de red son parte de la prueba, no se afirma que la consola no contenga solicitudes denegadas.
- Actualización manual de moderación comprobada con un envío nuevo sin recargar en Brave; botón y anchuras de 1440/768/375/320 comprobados en Brave/Opera después de incorporarlo.
- Inspección visual adicional en Brave: comunidad de escritorio, historial móvil, revisión móvil y detalle de historia móvil. Perfil sin datos administrativos; detalle con texto guardado y sin acciones de interacción simuladas. Editor vacío devuelve el foco al título y no desborda a 375/320 px.
- Lint, typecheck y build correctos. Permanece el aviso conocido de tamaño del paquete principal (~668 KB minificado).
- `check-v1-connected.browser.mjs` se adaptó al nuevo destino de login. Su recorrido previo de 30 comprobaciones por navegador corresponde a `8e205b0`; no se atribuye una nueva ejecución completa a este bloque.

Los primeros intentos del script nuevo requirieron corregir sus selectores (texto accesible duplicado y filtro de suspendidos). Esos intentos incompletos no se contaron como pruebas superadas. Los resultados anteriores corresponden a los recorridos completos posteriores.

## Pendientes y siguiente trabajo

1. Bloque 5: catálogo y asignación de grupos/programas, perfil y ajustes mínimos persistentes en el panel existente. Conservar el aislamiento al cambiar asignaciones. Configuración oficial continúa señalada como pendiente.
2. Bloque 6: incorporar recuperación y bandeja de avisos a los accesos/panel oficiales; contacto institucional.
3. Galería y archivos privados pendientes. En Community conectada, Galería, Retos e Insignias muestran conexión pendiente y conservan sus componentes de referencia en código. Reacciones/comentarios se ocultan; no se simula que se guardan. Los logros de texto sí se comparten desde Inicio.
4. Consolidación de rutas, contenido/privacidad y validación de uso final según `PROJECT_STATE.md`. No se eliminaron las herramientas locales anteriores.
5. Google real, entrega de correo, cuentas del cliente, presupuesto, servidor público y despliegue quedan para la tanda final acordada. Ninguna de esas pruebas se presenta como realizada. No se publicó el sitio ni se fusionó esta rama a la base oficial.
