# Plan de entrega local — tres semanas

> **Ampliación autorizada después de la revisión local:** comentarios, reacciones, retos, insignias y vídeos deben incluirse y mejorarse. Solo coordinación sube vídeos; su grupo los ve. Orden e inventario en [plan de comunidad ampliada](v1-community-expansion.md) y `PROJECT_STATE.md`. Primero desarrollar estos bloques localmente; cuentas/validación externa agrupadas y alojamiento al final. El calendario de tres semanas sigue siendo una referencia que requiere revisar capacidad con el nuevo alcance, no una garantía de terminación. Las prioridades iniciales siguientes son históricas.

## Acuerdos de trabajo

- Priorizar todo el desarrollo e integración autorizados que puedan completarse sin intervención del usuario. Agrupar para el final cuentas/verificaciones de Google y correo, contenido/decisiones del cliente, presupuestos y validación humana. Una dependencia externa no detiene tareas independientes; mantenerla registrada en `PROJECT_STATE.md` y no presentarla como comprobada.

- Inicio: 11 de noviembre de 2026. Objetivo: 2 de diciembre de 2026.
- Desarrollar y probar localmente. La contratación de alojamiento, dominio y correo de producción se presupuesta al acercarse a la entrega.
- Conservar React, TypeScript, Vite y la identidad visual actual.
- El panel debe poder utilizarlo una persona sin conocimientos técnicos: tareas claras, lenguaje cotidiano, siguiente paso visible y decisiones contextualizadas.
- No hacer commits, push ni publicaciones sin autorización. Conservar la rama `release/cai-demo-v1.0` como base de la demo y desarrollar en ramas específicas.
- La previsión de dos desarrolladores procede de la documentación previa; confirmar su disponibilidad antes de comprometer el calendario.

## Alcance de la primera entrega

Sitio institucional con contenido aprobado; contacto persistente; solicitud de acceso; revisión administrativa; autorización de tutor cuando corresponda; activación; login y cierre de sesión; permisos; alumnos y grupos; suspensión efectiva; publicaciones de texto y moderación compartida entre administración y comunidad; imágenes administrativas con acceso controlado.

La base de datos debe sobrevivir a recargas y reinicios. La autenticación y los permisos deben aplicarse fuera del navegador. El servicio de correo se comprobará localmente; su entrega real y los ajustes de internet requieren validación posterior en el entorno contratado.

Decisión posterior del usuario: conectar y perfeccionar comentarios, reacciones, retos e insignias, y añadir vídeos privados subidos únicamente por coordinación. Dejan de ser funciones excluidas de la entrega final. Reutilizar componentes/reglas de demo y conectar datos/administración reales por bloques, según `v1-community-expansion.md`. Pagos, chat privado y gestión escolar completa permanecen fuera. No asumir que el plazo anterior absorbe automáticamente esta ampliación.

## Secuencia y aceptación

| Semana | Prioridad | Resultado verificable |
| --- | --- | --- |
| 1 | Fijar tecnología local, modelo común, autenticación, permisos y solicitudes | Una persona solicita acceso, el administrador revisa y activa; una solicitud pendiente no da acceso. |
| 2 | Directorio, grupos, publicaciones, moderación, suspensión, contacto y recuperación | Administración y comunidad usan los mismos datos; una decisión modifica el resultado del alumno. |
| 3 | Integración, privacidad, móvil, accesibilidad, rendimiento, revisión y entrega | Flujos probados con varias cuentas; instalación y restauración documentadas; pendientes explícitos. |

Reservar la tercera semana para estabilizar. Reducir funciones secundarias si un flujo esencial se retrasa.

## Criterios de facilidad de uso del panel

1. Mostrar qué está pendiente y qué acción puede hacer la persona.
2. Una acción principal por solicitud en el listado: «Revisar solicitud».
3. Mostrar contexto y requisitos antes de aprobar o rechazar. Permitir cerrar sin tomar una decisión.
4. Explicar por escrito qué falta; no depender únicamente de color, iconos o botones deshabilitados.
5. Informar el resultado y permitir corregir decisiones cuando las reglas acordadas lo admitan.
6. Mantener búsqueda, filtros, teclado y uso móvil. Validar las tareas con la persona que administrará CAI.
7. Mantener mensajes claros de carga, error y recuperación al conectar los servicios reales.

## Primera tarea: UX-01 — revisión de solicitudes

Rama: `feat/admin-guided-requests`. Cambio limitado a la revisión de solicitudes de la demo.

- Resumen y listado ofrecen una sola entrada al detalle, con una explicación del siguiente paso.
- La autorización pendiente del tutor es visible desde el listado.
- El detalle explica la revisión; aprobar, rechazar y deshacer siguen dentro de él.
- Cerrar sin decidir conserva el estado. Se mantienen filtros, búsqueda y avisos de simulación.
- Comprobar el recorrido de registro y aprobación, el bloqueo de menores sin autorización y el diseño a 1440, 768, 375 y 320 px en Brave y Opera GX.

Esta primera tarea se limitó a la demostración. Las entregas locales posteriores de backend, cuentas y publicaciones se describen en el avance siguiente; la comprobación de tutores sigue requiriendo revisión de coordinación.

## Avance local al 11 de noviembre de 2026

- Solicitudes y revisión guiada; autorización de tutor registrada por coordinación; alumnos, suspensión, activación y sesiones por contraseña conectados a SQLite.
- Integración opcional de Google preparada. Se acordó esperar a contar con la cuenta de CAI para registrar y probar el acceso real; el entorno definitivo debe quedar bajo control del cliente.
- Publicaciones de texto y moderación conectadas: envío, revisión, aprobación por grupo, rechazo con motivo, retiro e historial. Ver `docs/local-publications.md`.
- Recuperación por enlace temporal y bandeja de avisos preparadas para pruebas locales. Falta configurar y comprobar la entrega real por correo; los enlaces administrativos de prueba no verifican al destinatario.
- Próximas prioridades: contratos/rutas comunes; conectar acceso, dashboard y Community oficiales; catálogo/grupos y ajustes mínimos; avisos/contacto; después archivos privados y revisión completa antes de cotizar el despliegue. Criterios de cierre en `PROJECT_STATE.md`.

## Dependencias del cliente

Confirmar quién administra, cómo comprueba la inscripción y la autorización del tutor, visibilidad por grupo, contenido institucional, permisos de imágenes y textos de privacidad. No convertir supuestos o casillas de la demo en verificaciones reales.

## Requisitos para la publicación posterior

Presupuestar alojamiento, base de datos, archivos privados, correo, dominio, respaldos y mantenimiento. Separar pruebas y producción; comprobar HTTPS, correos reales, permisos, supervisión y restauración antes de admitir alumnos reales.
