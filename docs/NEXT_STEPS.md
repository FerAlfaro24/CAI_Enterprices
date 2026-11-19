# CAI — próximos pasos vigentes

**19 de noviembre de 2026.** Continuación `feat/v1-community-header-highlights`, [estado real](PROJECT_STATE.md) y decisiones del usuario. La prioridad inmediata autorizada fue la [presentación y el Inicio conectado](COMMUNITY_HOME_STORIES.md), ya implementados; el orden N1–N7 conserva las tareas generales posteriores.

**Avance del 19-11:** [material oficial integrado](OFFICIAL_MEDIA.md), cuatro imágenes públicas/seis de comunidad para todos los aprobados, con carga sencilla desde administración. Esquema 17. No pedir otra vez la audiencia de estas fotos ni rehacer su integración. Pendiente cargar el catálogo desde el panel al adoptar esta rama en una instalación existente.

**Presentación preparada:** ocho publicaciones y 24 comentarios ficticios, dos álbumes con fotos oficiales y reacciones interactivas en una base nueva. Inicio, carrusel, avisos, publicaciones con fotos y conversación compartida ya funcionan. No repetir esta implementación ni sembrar ejemplos en la instalación real. Recoger observaciones del cliente y de coordinación; operación/recuperación N3 sigue como siguiente trabajo técnico general.

**Observación de presentación corregida:** Galería mostraba dos portadas y ocultaba a primera vista las seis fotos agrupadas. Ahora Fotos es la vista inicial, Álbumes es opcional y los filtros incluyen categorías interiores. No rehacer ni duplicar archivos/conversaciones. 32 comprobaciones nuevas de navegador; [detalle](COMMUNITY_HOME_STORIES.md#corrección-de-visibilidad-en-galería).

**Presentación desde otra ubicación:** [demo remota temporal](REMOTE_DEMO.md) autorizada por Cloudflare, máximo 24 horas. Mantener PC conectada; compartir claves solo por canal privado. No confundir con Vercel antiguo ni con infraestructura final.

**Prioridad nueva del usuario: diseño de toda la comunidad.** [Plan y primera muestra](COMMUNITY_DESIGN.md) de Inicio/Retos, fondo, puntos, reacciones, insignias grandes, perfil y notificaciones independientes ya comprobados con 130 casos. Recoger observaciones y refinar la muestra; continuar después con Galería/Logros/estados y coherencia de interacciones según la tabla. No tratar toda la comunidad como terminada ni reconstruir sus funciones. La copia remota anterior se conserva; N3 vuelve a continuación del bloque visual.

**Observación visual siguiente atendida:** [publicaciones simplificadas](COMMUNITY_DESIGN.md#publicaciones-y-conversación-más-sencillas), una columna, emojis sin nombres visibles y detalle de conversación; 124 comprobaciones nuevas. Revisar esta muestra con el usuario y continuar la tabla de refinamientos sin rehacer las funciones.

**Observación siguiente atendida:** [cabecera y novedades](COMMUNITY_DESIGN.md#cabecera-y-novedades-en-un-solo-lugar), sin franjas de demostración/gestión, cuenta reubicada y avisos con fotos en un carrusel; 122 comprobaciones nuevas. Mantener identidad de CAI y separación real de datos/entornos. Revisar visualmente con el usuario antes de ampliar el acabado.

**Prioridad nueva por preparar:** [Mis aventuras en inglés](COMMUNITY_DESIGN.md#propuesta-mis-aventuras-en-inglés). Diseño guiado para lecturas/películas/música, imágenes privadas y prácticas repetibles. Es propuesta documentada: A1 interfaz, A2 datos/archivos, A3 revisión/insignias, A4 compartición/colección. No está implementada ni autoriza abrir la galería general a alumnos.

## Orden de trabajo general posterior

| ID / prioridad | Pendiente | Qué puede avanzar desarrollo solo | Qué necesita CAI/usuario y criterio de cierre |
| --- | --- | --- | --- |
| N1 · base técnica comprobada | Preparación de producción | [Implementado y ensayado](PRODUCTION_PREPARATION.md): configuración separada, proxy/origen, cookies seguras, datos privados, bootstrap, preflight, salud/logs/cierre y respaldo reutilizado. 217 API/104 navegador seleccionadas. | Configurar/probar TLS, dominio, intermediario, proceso y disco del proveedor elegido. La simulación no valida infraestructura real. No rehacer esta base ni contratar/publicar ahora. |
| N2 · revisión local completada | Revisión integral del alcance ampliado | [17-11: 193 API y 1,314 navegador aprobados](v1-integral-review-2026-11-17.md), modelos, lint/build, visual y trece bloqueos privados. Repetir recorridos pertinentes ante cambios; conservar observación intermitente del simulador sin atribuirle una causa no confirmada. | Aceptación humana de CAI, volumen esperado y verificación en infraestructura final pendientes. No repetir toda la matriz sin motivo ni presentar la prueba local como producción. |
| N3 · siguiente | Operación de base/medios e instalación | Mantener SQLite; ampliar ensayo/procedimiento de actualización y recuperación separada. Bootstrap/preflight productivos y copia consistente/verificación ya funcionan; reutilizarlos. Preparar separación de datos ficticios y pasos de entrega sin tocar la base habitual. | Custodia, retención, frecuencia, ubicación y responsables. Cierre: recuperación completa y actualización repetidas también en el alojamiento definitivo. |
| N4 · mantenimiento | Alertas y fallos históricos | Revisar versiones compatibles cuando cambien herramientas o antes de publicar; capturar diagnóstico si reaparecen intermitencias Opera. | Cierre: auditoría, instalación reproducible y checks pertinentes, sin force/overrides incompatibles ni afirmar reparación por un reintento. Diez avisos moderados de desarrollo registrados, no auditados hoy. |
| N5 · tanda final | Google y correo reales | Preparar guías/casos de prueba y configuración sin cuentas personales. La integración Google y los avisos/recuperación local ya están. | Proyecto/cuenta de CAI, remitente/proveedor, orígenes finales y verificación de entrega. Cierre: alta/aprobación/acceso/revocación y entrega/expiración/errores comprobados realmente. |
| N6 · tanda final | Contenido, permisos y panel intuitivo | Fotos recibidas e integradas; importación y audiencias comprobadas. Continuar con textos comerciales y tareas de aceptación del panel; reutilizar la carga existente. | Material comercial, programas/horarios, imágenes/autorizaciones, tutores, responsables y reglas finales. Cierre: persona administradora completa tareas y se registran/corrigen dificultades. Pruebas automáticas no sustituyen esa sesión. |
| N7 · último | Presupuesto, contratación y despliegue | Preparar necesidades técnicas y opciones a revisar al acercarse a la entrega. | Cliente aprueba costes/proveedor/dominio/mantenimiento. Después: configurar, comprobar permisos/HTTPS/copias/servicios desde internet y entregar accesos/guías. No contratar ni publicar implícitamente. |

No rehacer comentarios, reacciones, retos, insignias, panel, grupos o recuperación local: ya están conectados. Tener una dependencia externa no autoriza inventar módulos nuevos para mantenerse ocupado.

## Vídeos: opcionales y de menor prioridad

Se incluyeron inicialmente y después el usuario señaló que no eran tan importantes. Se retiran del camino obligatorio de entrega; no se da por cancelada para siempre la posibilidad. Reconfirmar prioridad antes de desarrollarlos. Si se retoman: **solo coordinación sube**, grupo autorizado ve; validar formato/tamaño/duración/cuota, reproducción/rangos autorizados, apoyo textual, retirada y copia consistente. No hay ese servicio actualmente y no se presenta la galería de imágenes como vídeo.

## Propuestas por elegir, sin implementación

| Propuesta | Diferencia frente a lo existente |
| --- | --- |
| Repaso personalizado de errores/temas | Ya hay historial con explicaciones; falta seleccionar práctica dirigida, separada de puntos diarios. |
| Vista pedagógica de coordinación | Ya hay puntos/días/concesiones privados; falta resumen autorizado de actividad y temas a reforzar, sin ranking público. |
| Buscar concesiones por alumno/grupo/fecha | Ya existen revisión, estados, historial y páginas; sería ampliación de filtros. |
| Bienvenida breve opcional | Registro/activación ya funcionan; sería orientación de primera entrada, omisible. |
| Biblioteca de vídeos con búsqueda/continuación | Depende de que se elija implementar vídeos; no empezar como tarea independiente. |

Cambio verificado de correo de acceso y vinculación de cuentas Google/contraseña siguen siendo decisiones de alcance; no enlazar identidades por coincidencia de correo ni ampliar esas funciones silenciosamente. Pagos, chat privado y cursos completos no se incluyen automáticamente.

## Calendario

El 12 de noviembre se habló de tres semanas. Los documentos de planificación registran 2 de diciembre como objetivo inicial y una propuesta posterior hasta el 3. **Fecha exacta de entrega por confirmar; la auditoría del día 17 no reinicia otras tres semanas.** Preservar esos planes como históricos y reservar margen para validación/servicios externos en la última tanda. No prometer plazos a partir del número de commits o la velocidad de escritura.

## Siguiente movimiento

La revisión integral y la base técnica autónoma de producción quedaron comprobadas con sus límites. **Siguiente trabajo: refinamiento visual de COMMUNITY_DESIGN; después N3, operación y recuperación**, con fixtures/copias nuevas y sin tocar datos habituales. Resolver primero incidencias reproducibles y reutilizar las herramientas existentes. Google/correo/CAI continúan agrupados al final y alojamiento después. No reiniciar estas tareas completas ni desarrollar vídeos por un plan histórico.
