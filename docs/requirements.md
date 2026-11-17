# CAI — requisitos y estado de alcance

**Reconciliado al 17-11-2026.** Confirmaciones del usuario distinguidas de aceptación final de CAI. No describe una aplicación ya productiva. [PROJECT_STATE](PROJECT_STATE.md) tiene la evidencia; [NEXT_STEPS](NEXT_STEPS.md) concentra prioridades. Las propuestas iniciales se conservan en el historial de Git y los documentos clasificados como antecedentes.

## Requisitos funcionales

Se conservan los identificadores RF de los documentos anteriores para poder rastrear sus referencias.

| ID | Requisito / alcance | Estado real |
| --- | --- | --- |
| RF-01 | Sitio público, presentación/programas y contacto | Interfaz y consulta persistente locales; contenido comercial final pendiente. |
| RF-02 | Comunidad privada de logros/experiencias y medios autorizados | Texto e imágenes conectados; vídeo opcional no implementado. |
| RF-03 | Visitante, alumno y administrador con permisos | Roles/sesiones en servidor; un selector de demo no concede acceso. |
| RF-04 | Solicitud, revisión y aprobación de acceso | Persistente; verificar inscripción/tutor con CAI. |
| RF-05 | Creación/revisión de publicaciones | Persistente por grupo, con retirada y motivo privado. |
| RF-06 | Feed y perfiles de compañeros autorizados | Conectado por grupo con alias/avatar; no expone expedientes ajenos. |
| RF-07 | Panel intuitivo con pendientes | Panel v1.0 conectado; falta sesión de uso con su responsable real. |
| RF-08 | Selector de roles para demostración | Solo antecedente visual en memoria; no reemplaza sesiones/permisos. |
| RF-09 | Comentarios y reacciones persistentes | Incluidos por el usuario e implementados/probados localmente; premoderación de comentarios y controles de pausa. |
| RF-10 | Vídeos privados, coordinación sube y grupo ve | Alcance inicialmente incluido, después rebajado a **opcional/menor prioridad**. No implementado ni bloqueante por defecto. |
| RF-11 | Retos/insignias y reconocimiento del aprendizaje | Incluidos e integrados localmente; no autoriza gamificación o notificaciones adicionales por inferencia. |
| RF-12 | Solicitud por pasos, datos del alumno y tutor si corresponde | Integrada; la declaración inicial no verifica edad/identidad ni sustituye confirmación de coordinación. |
| RF-13 | Acceso opcional Google con datos obligatorios y aprobación | Preparado; configuración/prueba real pendientes. Contraseña sigue disponible. No hay vinculación automática por coincidencia de correo. |
| RF-14 | Texto, estados/motivos/retirada y auditoría | Integrado en panel/Community oficiales. No publicar al enviar ni al conceder una insignia. |
| RF-15 | Retos con gestión/calendario/progreso reales | Banco 180/45 temas, tres preguntas diarias, servidor valida/puntúa; repaso e historial privados. |
| RF-16 | Insignias automáticas/revisadas y compartición voluntaria | Nueve; concesiones únicas, fecha/condición histórica, corrección e historia moderada vinculada. |

## Requisitos no funcionales

| ID | Requisito | Situación |
| --- | --- | --- |
| RNF-01 | Móvil/escritorio | Comprobaciones locales por módulo a cuatro anchos; no implica todos los dispositivos. |
| RNF-02 | Privacidad, especialmente menores | Controles locales implementados; material/consentimiento/retención/procedimientos reales por validar con CAI. |
| RNF-03 | Disponible en internet para entrega final | Base técnica [preparada y ensayada](PRODUCTION_PREPARATION.md); servicios/configuración TLS, proceso y disco aprobados y validación en alojamiento real pendientes. No está desplegado. |
| RNF-04 | Accesibilidad | Teclado/foco/etiquetas/temas revisados en recorridos documentados; no auditoría independiente completa. |
| RNF-05 | Código mantenible y continuidad en GitHub | Arquitectura existente y guías reconciliadas; actualizar con cada cambio. |

## Decisiones conservadas

Identidad visual oficial v1.0, panel sencillo, permisos en servidor, pruebas con datos ficticios, ramas/puntos de retorno por mejora. Trabajo autónomo primero, Google/correo y validaciones de CAI agrupados al final; alojamiento/presupuesto después. No contratar ni publicar implícitamente.

Cada alumno debe tener solicitud aprobada y contraseña activada o acceso Google configurado; para menores se conserva la revisión del tutor. Las solicitudes de insignia y motivos son privados; obtener una no publica una historia. Suspender revoca acceso. No convertir datos/roles de demo en autorización.

## Decisiones pendientes, propuestas y exclusiones

- CAI: programas/horarios, información comercial/tarifas/contacto, materiales y autorizaciones, responsables, operación y aceptación de reglas/textos.
- Usuario/CAI: alcance de cambio verificado de correo y vinculación de métodos de acceso; no implementarlos silenciosamente.
- Vídeos: opcionales; si se retoman, límites de tamaño/duración/cuota/formato y requisitos accesibles/privados por concretar antes del servicio.
- Repaso dirigido, resumen pedagógico, búsqueda ampliada y bienvenida son propuestas; el historial, puntos y revisión actuales no equivalen a esas mejoras.
- Pagos, chat privado y cursos completos no están autorizados automáticamente por estos requisitos.

## Cierre de entrega

Funciones locales comprobadas más configuración/servicios reales, contenido autorizado, uso humano del panel, preparación y comprobación de producción, operación/copias y aceptación. No basta una demo, un build o un HTTP 200. Las fechas 2/3 de diciembre de los planes anteriores necesitan confirmación exacta; el corte del día 17 no reinicia el plazo.
