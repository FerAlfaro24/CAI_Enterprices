# Requisitos iniciales — CAI
**Versión:** 0.1 · No aprobada por el cliente

Convención: `[C]` confirmado en conversación, `[P]` propuesto para validar, `[D]` diferido.

## Funcionales — prototipo
- **RF-01 [C]** Sitio público con presentación de CAI, servicios y medio de contacto.
- **RF-02 [C]** Comunidad orientada a logros, experiencias, reseñas y contenido multimedia.
- **RF-03 [C]** Diferenciar acceso de visitante, alumno y administrador.
- **RF-04 [C]** Mostrar flujo de solicitud y aprobación de acceso.
- **RF-05 [C]** Mostrar flujo de creación y aprobación de publicaciones.
- **RF-06 [P]** Feed de publicaciones con perfiles ficticios.
- **RF-07 [P]** Panel con solicitudes de registro y publicaciones pendientes.
- **RF-08 [P]** Selector de roles para navegar la demostración sin credenciales reales.
- **RF-09 [P]** Comentarios y reacciones (pendiente de decisión).
- **RF-10 [D]** Reproducción/carga de videos reales.
- **RF-11 [D]** Notificaciones y gamificación.

## No funcionales
- **RNF-01 [C]** Experiencia usable en móviles y escritorio.
- **RNF-02 [C]** Privacidad elevada por participación de menores.
- **RNF-03 [C]** Producto final disponible por internet.
- **RNF-04 [P]** Accesibilidad básica: navegación por teclado, contraste, etiquetas y mensajes de estado.
- **RNF-05 [P]** Código tipado, componentes reutilizables y documentación dentro del repositorio.

## Restricciones del prototipo
Las sesiones, autorizaciones y publicaciones pueden ser simuladas. Ninguna comprobación de rol en frontend o almacenamiento local constituye autorización segura. No admitir usuarios ni contenidos reales. Etiquetar la demostración como prototipo.

## Requisitos para producción (posteriores)
- Validación de identidad y sesión en servidor, contraseñas seguras y recuperación de acceso.
- Autorización por rol aplicada en cada endpoint y recurso.
- Archivos privados con acceso controlado; no URLs públicas adivinables para fotos de menores.
- Consentimiento informado y, cuando corresponda, autorización de padres/tutores para contenido de menores.
- Moderación persistente, posibilidad de retirar publicaciones y gestionar bajas.
- Protección contra abuso, políticas de retención y copias de respaldo.

## Criterios de aceptación de la demo
1. Visitante puede recorrer el sitio público y encontrar contacto y acceso a la comunidad.
2. Modo alumno puede visualizar feed y enviar una publicación ficticia a revisión.
3. Modo administrador puede ver una solicitud pendiente y aprobarla/rechazarla visualmente.
4. Se entiende la diferencia entre contenido pendiente y aprobado.
5. Se ve correctamente en móvil y escritorio.

## Pendientes de confirmar con el cliente
- Programas, tarifas, trayectoria, datos de contacto y textos definitivos.
- Quién puede publicar directamente (alumnos vs. administradores).
- Comentarios, reacciones, privacidad de perfiles y visibilidad de nombres.
- Fotografía/video de menores, autorizaciones y moderación.
- Si la comunidad incluirá cursos, tareas u otros recursos educativos.
