# CAI — próximos pasos vigentes

**17 de noviembre de 2026.** Basado en `3971284`, [estado real](PROJECT_STATE.md) y decisiones más recientes del usuario. No es una lista de funciones nuevas autorizadas por existir en una demo.

## Orden de trabajo

| ID / prioridad | Pendiente | Qué puede avanzar desarrollo solo | Qué necesita CAI/usuario y criterio de cierre |
| --- | --- | --- | --- |
| N1 · alta | Preparación técnica de producción | Diseñar separación de configuración, dominios/orígenes, HTTPS/cookies seguras, secretos, procesos, registros sin datos sensibles y almacenamiento persistente; preparar pruebas aisladas. | Datos finales de entorno y autorización antes de publicar. Cierre: configuración/protecciones comprobadas y repetidas en infraestructura aprobada. El servidor actual es solo local. |
| N2 · revisión local completada | Revisión integral del alcance ampliado | [17-11: 193 API y 1,314 navegador aprobados](v1-integral-review-2026-11-17.md), modelos, lint/build, visual y trece bloqueos privados. Repetir recorridos pertinentes ante cambios; conservar observación intermitente del simulador sin atribuirle una causa no confirmada. | Aceptación humana de CAI, volumen esperado y verificación en infraestructura final pendientes. No repetir toda la matriz sin motivo ni presentar la prueba local como producción. |
| N3 · alta | Operación de base/medios e instalación | Mantener SQLite salvo motivo contrastado para cambiar; preparar migraciones, separación de datos ficticios, copia consistente y recuperación separada. Copias ya existen: no reconstruirlas. | Custodia, retención, frecuencia, ubicación y responsables. Cierre: instalación y recuperación ensayadas también en el alojamiento definitivo. |
| N4 · mantenimiento | Alertas y fallos históricos | Revisar versiones compatibles cuando cambien herramientas o antes de publicar; capturar diagnóstico si reaparecen intermitencias Opera. | Cierre: auditoría, instalación reproducible y checks pertinentes, sin force/overrides incompatibles ni afirmar reparación por un reintento. Diez avisos moderados de desarrollo registrados, no auditados hoy. |
| N5 · tanda final | Google y correo reales | Preparar guías/casos de prueba y configuración sin cuentas personales. La integración Google y los avisos/recuperación local ya están. | Proyecto/cuenta de CAI, remitente/proveedor, orígenes finales y verificación de entrega. Cierre: alta/aprobación/acceso/revocación y entrega/expiración/errores comprobados realmente. |
| N6 · tanda final | Contenido, permisos y panel intuitivo | Preparar inventario de textos/medios y tareas para validación con cuentas ficticias. Revisar carga de fotos y mensajes/estados. | Material comercial, programas/horarios, imágenes/autorizaciones, tutores, responsables y reglas finales. Cierre: persona administradora completa tareas y se registran/corrigen dificultades. Pruebas automáticas no sustituyen esa sesión. |
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

La revisión integral local del punto 1 solicitado por el usuario quedó completada; sus resultados e intentos están en el informe. **Siguiente trabajo autónomo: N1, preparación técnica de producción**, con criterio de cierre y pruebas separadas, sin contratar ni publicar. Resolver primero cualquier incidencia nueva reproducible. Mantener Google/correo/CAI agrupados al final y alojamiento después. No reiniciar otra revisión integral ni desarrollar vídeos por un plan histórico.
