# Estabilización local: carga, errores y operación

> Cierre histórico de esta tanda. El cambio de contraseña administrativa propia se completó después en `v1-admin-account-security.md`; consultar PROJECT_STATE para pendientes vigentes.

Tanda técnica del bloque 9 comprobada localmente el 12 de noviembre de 2026. Rama `chore/v1-stabilization`, base `5405c1c` de `feat/v1-unified-navigation`. Puntos de retorno: `e648269` (carga diferida/recuperación) y `876aa56` (verificación de respaldos). Conserva v1.0 y todas las integraciones acumulativas. No es cierre de producción ni validación del cliente.

## Carga por pantallas

Las rutas existentes cargan sus componentes mediante React.lazy y Suspense. No cambian las direcciones ni sus protecciones. Se conserva el panel montado al navegar entre secciones: la prueba comprueba que no vuelve a descargar su instantánea de solicitudes cada vez que llega el código de otra página.

ConnectedCommunity ya aporta los contextos del recorrido conectado, por lo que no se inicializa también el proveedor de demostración en el arranque. DemoStoreProvider queda dentro de SignupPage, único consumidor vigente; sus datos no se descargan con la portada. Los modelos y proveedores históricos siguen en el repositorio. La solicitud oficial continúa usando el servicio persistente, y se volvió a recorrer completa.

Mediciones de compilación, en bytes decimales y antes de comprimir:

| Medida | Antes | Después |
| --- | --- | --- |
| Archivo JavaScript principal | ~677 KB | ~239 KB |
| JavaScript necesario para la portada | Incluido en la entrada anterior | ~323 KB, repartidos en 13 archivos |
| Aviso de archivo mayor de 500 KB | Presente | Ausente |

La prueba del navegador confirma que la portada no descarga AdminLayout, CommunityPage ni SignupPage. La suma estática del manifiesto coincide con los 13 scripts observados. Son medidas de archivos; no se afirma un porcentaje de velocidad en una conexión real ni se oculta el coste de descargar otras áreas cuando se abran.

## Estados de carga y recuperación

- Mientras llega una pantalla, se muestra Cargando página con anuncio de estado.
- Si falla descargar o representar una página, aparece un mensaje sencillo, Volver a cargar y Volver al sitio. No muestra trazas técnicas ni hace recargas automáticas repetidas. El reintento explícito recarga el documento porque React conserva el rechazo de una importación diferida; conserva destino y cookie de sesión, pero no garantiza recuperar un formulario ante cualquier error de representación.
- Si el servicio no responde al comprobar la sesión administrativa, se distingue de una cuenta sin sesión. Se muestra el error de conexión y un reintento; no se presenta como contraseña incorrecta.
- Los errores previstos de datos, catálogo, Community y envíos mantienen sus controles existentes de reintento. Se comprobó que un fallo de envío conserva el borrador y que reintentarlo no duplica la publicación.

Se reutiliza AccessFrame y su botón de acceso. La inspección encontró que el primer botón de reintento usaba tokens administrativos fuera de su contenedor y quedaba blanco sobre claro. Se corrigió usando el estilo del acceso y se añadió una comprobación de contraste de texto de al menos 4,5 sobre fondo opaco. Se repitió el recorrido después. Se inspeccionaron además el error de ruta en escritorio y a 320 px con tema oscuro, y el error de sesión móvil con recuperación posterior.

## Respaldo comprobable sin reemplazar datos

Nuevo comando `npm.cmd run local:verify-backup -- "RUTA-DE-LA-COPIA.sqlite"`. Abre una copia en modo de solo lectura y comprueba SQLite, relaciones, esquema 9, registros principales e imágenes completas, incluidas las retiradas. No migra, repara ni restaura el archivo y no imprime expedientes, hashes o enlaces.

La prueba verifica igualdad del archivo antes/después de leerlo, rechazo de imagen corrupta, ruta ausente sin crear archivo y acceso HTTP desde una copia separada: la cuenta puede entrar y conserva los permisos de alumno y la retirada de imagen. La base original queda intacta. Se creó y verificó también un respaldo local de pruebas mediante ambos comandos. No se reemplazó la base activa ni se ejecutó una restauración destructiva.

Instrucciones y límites en [respaldo y recuperación local](respaldo-recuperacion-local.md). Tareas del panel en [guía sencilla de administración](guia-administracion.md), contrastada con las acciones existentes. La prueba con el administrador real sigue pendiente.

## Alertas de herramientas: pendientes explícitas

Actualización posterior: la revisión específica del punto 4 volvió a comprobar versiones, árboles, requisitos y alcance el 12 de noviembre de 2026. Mantiene diez avisos de desarrollo y cero en ejecución; no hay corrección compatible publicada entre los consumidores consultados. Ver [evidencia actual y criterio de cierre](v1-tooling-audit.md). Las cifras de pruebas de esta estabilización siguen siendo históricas.

`npm audit` volvió a informar diez avisos moderados que dependen del mismo aviso de minimatch 10.2.6. Las versiones compatibles consultadas —ESLint 10.14.0 y typescript-eslint 8.72.2— siguen usando la rama afectada. No se instalaron esas versiones porque no resolverían el aviso, ni se ejecutó fix --force o un override mayor fuera de sus rangos. El parche publicado está en minimatch 11.0.1 en adelante. [Aviso oficial](https://github.com/advisories/GHSA-g3hv-75wg-m249).

Queda pendiente una actualización compatible de esa cadena o una migración de herramientas revisada específicamente. No se consideran corregidos los diez avisos. `npm audit --omit=dev` informó **cero** avisos al cierre; no equivale a garantía general de seguridad. No cambiaron dependencias ni lockfile en esta tanda.

## Comprobaciones realizadas

Compilación real servida exclusivamente en el puerto local 4180, con la API local existente. En Brave y Opera GX, cada uno:

- Estabilización: **25** comprobaciones completas, incluidas descarga diferida, mantenimiento del panel, módulos lento/fallido, recarga, errores de sesión/datos/Community, contraste del reintento, conservación de borrador, envío único y revocación. Cuatro anchuras para la recuperación de ruta.
- Acceso/solicitudes/dashboard/activación/suspensión: **30**.
- Community/composición/moderación/privacidad/rechazo/retiro: **39**.
- Galería privada/subida/reintento/permisos/visor/retirada: **37**.
- Contacto/seguimiento/avisos/recuperación: **37**.

Son **168 comprobaciones por navegador**, repartidas en cinco recorridos. Cero errores inesperados de ejecución JavaScript en los recorridos completos. La pérdida de red y el error de módulo se introducen deliberadamente. Los recorridos conservan sus verificaciones de escritorio/tableta/móvil y teclado donde ya estaban definidas; no son una auditoría exhaustiva de accesibilidad ni una prueba de carga.

API: **72 resultados correctos**, incluidos siete contenedores. Typecheck, lint, build y revisión de espacios de Git correctos. Siete rutas privadas de Vite siguen bloqueadas por HEAD sin cookies. No se relajaron los límites de peticiones; las tandas se separaron y se reinició únicamente el servicio local entre algunas de ellas. Los registros son ficticios y conservan historial.

Incidencias de implementación/verificación registradas: paréntesis omitido al acotar el proveedor, corregido antes de compilar; espera del formulario administrativo en el script tras navegación diferida; botón de reintento sin contraste, corregido y vuelto a comprobar. Tras reanudar el trabajo se reiniciaron servicios locales que ya no estaban en ejecución, sin repetir trabajo completado ni reemplazar datos. Los intentos incompletos no se suman como recorridos aprobados.

## Archivos principales y continuación

Interfaz: App, router, RouteContent y sus estilos, SignupPage, useAdminConnection y AdminLayout. Compilación: manifiesto de Vite para identificar los archivos que se prueban. Operación: `server/verify-backup.ts`, ampliación de pruebas de galería y comando en package.json. Prueba nueva: `scripts/check-stabilization.browser.mjs`; recibe credenciales de prueba y nombres del manifiesto sin incorporarlos al archivo. Documentación: guías, este cierre, PROJECT_STATE, AGENTS y README.

La tanda de carga/errores/guías está comprobada. El bloque 9 conserva pendientes: avisos de herramientas, validación de contenido/privacidad/uso con CAI y los huecos de cuenta/perfil ya inventariados. Siguiente revisión autónoma: acotar el cierre de seguridad de la cuenta administrativa y del perfil usando Configuración y componentes existentes, antes de crear cualquier implementación nueva. No crear personas/roles reales ni añadir funciones secundarias sin el alcance correspondiente.

Google y correo reales, contenido y autorizaciones, cuentas del cliente, presupuesto y alojamiento continúan en la tanda final acordada. No hubo despliegue ni admisión de alumnos reales.

Referencias técnicas primarias: [React.lazy y su carga](https://react.dev/reference/react/lazy), [límites de error de React](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary). El comportamiento y las cifras descritos se comprobaron además con los recorridos y la compilación propios.
