# Pendientes y prioridades al 12 de noviembre de 2026

Inventario contrastado con HEAD `6e1ee02` de `feat/v1-community-badges`, PROJECT_STATE, informes de Retos/Insignias/revisión local y código de arranque/autenticación. Actualización de planificación: no implementa funciones, migra bases ni repite pruebas. Horizonte propuesto: tres semanas, aproximadamente hasta el 3 de diciembre; son bloques de trabajo, no una garantía de aprobaciones externas.

## Ya conectado y comprobado localmente

Acceso por contraseña, solicitud/revisión/activación, alumnos/expediente/tutor, grupos y ajustes, publicaciones y moderación, comentarios, reacciones, contacto/avisos/recuperación local, equipo administrador, galería privada de imágenes, perfiles, navegación, Retos (180 preguntas/45 temas; tres al día) e Insignias (nueve; automáticas, solicitudes privadas y distinciones). Se conserva la interfaz de v1.0 y los avances acumulados; no volver a construir estos módulos.

Última suite del servicio: 193/193. Informes por módulo registran compilación/lint/modelos y recorridos de navegador; no se suman resultados históricos como una prueba nueva de todo el producto. Persistencia local SQLite y pruebas de copias separadas ya existen. No están comprobados con alumnos reales o un alojamiento contratado.

## Pendientes para la entrega, en orden

1. **Vídeos privados.** Subida solo de coordinación, grupo autorizado, título/descripción/portada, límites de tamaño/duración/cuota y formato admitido; validación real, reproducción/búsqueda dentro del vídeo y rangos autorizados, carga/errores, retirada y copia consistente de metadatos/archivos. Accesibilidad y apoyo textual. Construcción/prueba local autónoma, material definitivo/permisos con CAI al final. No suponer conversión de todos los formatos ni instalar herramientas del sistema implícitamente.
2. **Preparación técnica de producción sin contratar todavía.** Arranque/configuración por entorno, dominio/orígenes, HTTPS y cookies de sesión seguras, secretos fuera del código, registros sin datos sensibles, almacenamiento persistente de archivos y apagado/arranque. Verificar límites y fallos. `server/index.ts` rechaza expresamente NODE_ENV=production y escucha en 127.0.0.1; app.ts valida solo hosts/orígenes locales. El código local no equivale a un despliegue listo. Diseñar/probar configuración separada, conservando el aislamiento de desarrollo.
3. **Base y operación de la entrega.** Decidir la configuración definitiva según uso/alojamiento; no asumir que SQLite deba sustituirse. Preparar instalación/migraciones y separación de datos de prueba, cuentas responsables, copias de base y medios, recuperación en otro destino y documentación. Automatización y recuperación en el proveedor real se comprueban tras contratarlo. La base habitual no se migra ni borra implícitamente.
4. **Pulido de interfaz/contenido.** Recorrido inicial claro, formularios y textos coherentes, móvil/teclado/temas, carga/vacío/error y accesibilidad del nuevo vídeo. Confirmar datos, programas/horarios, textos, imágenes/vídeos y permisos con CAI; sustituir material de muestra al preparar la entrega. Las fotos externas que no terminaron de cargar en la revisión previa siguen pendientes de validación, sin causa atribuida.
5. **Revisión integral del alcance ampliado.** Cuenta nueva → solicitud → aprobación → acceso → historia/comentario/reacción → reto → insignia → compartir → vídeo → suspensión/recuperación. Varios grupos/cuentas, red perdida, conflictos, permisos, volumen representativo y recuperación de copia. Conservar pruebas por módulo y completar regresión conjunta después de vídeo/producción. Revisar alertas registradas y compatibilidad de herramientas antes de publicar; el informe anterior conserva diez moderadas de desarrollo, no una auditoría ejecutada hoy.
6. **Tanda final con usuario/CAI.** Configurar y comprobar Google real con formulario obligatorio y aprobación; titularidad bajo control del cliente. Preparar entrega real de activaciones/recuperación por correo y verificarla. Material/autorizaciones, responsable del panel y de respaldos, aceptación de reglas de retos/insignias y prueba de tareas con el administrador sin ayuda. Avisos internos ya existen; no confundirlos con correo entregado. Cambio verificado de correo y vincular accesos Google/contraseña siguen como decisiones de alcance pendientes.
7. **Presupuesto, contratación y publicación al final.** Estimar almacenamiento/tráfico de vídeos y uso esperado, presentar alternativas/costes al cliente y contratar lo aprobado. Configurar dominio/HTTPS/servicios/copias, ensayar instalación y regreso a la versión anterior, comprobar desde internet con cuentas autorizadas y entregar accesos/guías. Sin proveedor/pagos/publicación implícitos. Revisar otra vez privacidad/permisos/rangos bajo infraestructura real.

## Mejoras recomendadas dentro del tiempo disponible

Son propuestas, no funciones implementadas ni un permiso para ampliar automáticamente el alcance. Elegirlas después de comprobar vídeos y reservar la última semana para la entrega.

- **Repaso personalizado en Retos:** seleccionar errores o temas a reforzar para volver a practicarlos. El historial con explicaciones ya existe; falta este modo dirigido. Mantener separados práctica y puntos del reto diario.
- **Vista de aprendizaje para coordinación:** días completos, actividad y temas con dificultad, con permisos de administración y sin clasificaciones públicas. Los puntos/concesiones privados ya existen; falta una vista pedagógica conjunta.
- **Biblioteca de vídeos más fácil de explorar:** temas/categorías, búsqueda y posición de reproducción por alumno, si el módulo básico y los costes lo permiten. La reproducción autorizada sigue siendo el requisito principal.
- **Búsqueda de concesiones por alumno y filtros de grupo/fecha:** ampliar la administración de insignias, que ya tiene estados/historial y paginación; no reconstruir la revisión.
- **Bienvenida breve en la primera entrada:** explicar Retos, Logros y cómo compartir, con opción de omitir/revisar después. Registro y datos obligatorios ya existen.

Prioridad propuesta para extras: repaso dirigido y visión de aprendizaje de coordinación. Evaluar cambios pequeños y comprobables antes de añadir más módulos.

## Distribución propuesta de las tres semanas

| Fechas | Objetivo | Criterio |
| --- | --- | --- |
| 13–19 noviembre | Vídeos y preparación técnica de producción | Vídeo privado completo localmente; configuración de producción diseñada/comprobable sin contratar. |
| 20–26 noviembre | Mejoras educativas elegidas, pulido y revisión integral | Flujos ampliados consistentes; instalación/copias documentadas; lista de validación con CAI preparada. |
| 27 noviembre–3 diciembre | Cuentas/configuración real, validación humana y entrega | Google/correo/material/panel validados; presupuesto/contratación al final y pruebas en el alojamiento aprobado. Reservar margen para incidencias y aprobaciones. |

El ritmo actual permite aspirar a más pulido. Medir avance por funciones comprobadas y pendientes concretos; no extrapolar una garantía de plazo desde cantidad de commits o velocidad de escritura. Priorizar trabajo autónomo hasta la tanda externa acordada.
