# CAI — Próximos pasos y decisiones pendientes

**Actualizado: 17 de noviembre de 2026.** Derivado de la última revisión local documentada en `chore/v1-final-review`; no constituye un nuevo resultado de pruebas. Para hechos y límites consultar [v1-final-review.md](v1-final-review.md).

## Estado de trabajo

- **Terminado en alcance local documentado:** conexión del panel/comunidad/acceso, moderación, grupos, mensajes/contacto, archivos privados, perfiles, expediente, equipo y recuperación; revisión técnica con incidencias documentadas.
- **Investigado pero NO corregido:** diez alertas moderadas de herramientas de desarrollo relacionadas con minimatch; cero alertas de dependencias de ejecución en la auditoría histórica. Volver a evaluar cuando existan versiones compatibles o antes del despliegue, sin forzar cambios incompatibles. Ver [v1-tooling-audit.md](v1-tooling-audit.md).
- **No terminado:** aceptación humana, servicios de Google/correo reales, contenido autorizado, infraestructura y preparación para producción.

## Lista de trabajo priorizada

| Prioridad | Tarea / decisión | Responsable propuesto | Evidencia de cierre |
| --- | --- | --- | --- |
| P0 | Sesión con la persona que administrará CAI: solicitudes, activación, moderación, bandejas y retiro de imagen con cuentas ficticias | CAI + desarrollo | Recorrido acompañado, problemas anotados, decisiones y cambios necesarios |
| P0 | Confirmar responsables del sistema, verificación de tutores, permisos por grupo, privacidad y retención | CAI | Decisiones por escrito y requisitos actualizados; sin datos reales en demo |
| P0 | Sustituir/validar textos, programas, cifras, precios, contacto y fotografías; revisar carga de imágenes externas | CAI + desarrollo | Material autorizado, procedencia y comprobación visual |
| P1 | Configurar Google en proyecto controlado por CAI y probar alta, aprobación, inicio, revocación y fallos | CAI (cuenta) + desarrollo | Pruebas documentadas en entorno aislado |
| P1 | Elegir servicio/remitente de correo y comprobar entrega real, destinatario, expiración, fallos y avisos | CAI (proveedor) + desarrollo | Evidencia de envío y recepción; no solo buzón ficticio |
| P1 | Decidir alcance del **cambio verificado de correo de acceso** | CAI | Decisión registrada; si entra, issue, diseño, implementación y pruebas |
| P1 | Investigar intermitencias Opera si vuelven a manifestarse | Desarrollo | Diagnósticos reproducibles; no asumir corrección por reintento satisfactorio |
| P2 | Revisar actualización compatible de minimatch/herramientas | Desarrollo | Instalación reproducible + auditoría, lint, tipos y build, sin `--force` |
| P2 | Presupuestar alojamiento, dominio, correo, backups, privacidad y mantenimiento **después** de validar prioridades | CAI + desarrollo | Costes/servicios elegidos, plan de entornos y responsables |
| P2 | Endurecer, desplegar y realizar aceptación de producción antes de alumnos reales | Desarrollo + CAI | HTTPS, secretos, autorización, restauración, supervisión, permisos, consentimiento, pruebas y acta de aceptación |

**Fuera del alcance acordado para entrega local**, salvo nueva decisión: pagos, chat privado, videos, cursos completos, comentarios/reacciones persistentes, retos/insignias persistentes y nuevas funciones añadidas solo por aparecer en la demo.

## Condiciones de no avanzar indebidamente

- No publicar un backend local como producto apto para estudiantes. No usar identidades/fotos/datos reales de menores.
- No afirmar corrección de las alertas o de las intermitencias sin evidencia nueva.
- No fusionar ramas, borrar historial, contratar servicios ni comprometer dinero automáticamente.
- No crear funcionalidades adicionales para eludir una decisión de CAI.
- Cuando una dependencia humana bloquee una tarea, registrar su estado y continuar solo con otra tarea **autorizada** e independiente.

## Plantilla para la siguiente actualización

En cada PR añadir: fecha y rama/base/HEAD; objetivo; archivos/módulos reutilizados; cambios; pruebas **ejecutadas en esa PR** (y las no ejecutadas); efectos sobre datos/permisos; riesgos; bloqueos; decisiones del cliente; próximo paso. Actualizar este archivo y [PROJECT_STATE.md](PROJECT_STATE.md) cuando cambie el estado real. Si una fecha o un objetivo del plan histórico vence, registrarlo, no reescribirlo como si nunca hubiera existido.
