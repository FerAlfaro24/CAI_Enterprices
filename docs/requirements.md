# Requisitos iniciales — CAI
> Requisitos y propuestas iniciales; no son una lista de funciones ya integradas. Consultar `PROJECT_STATE.md` para distinguir interfaz, demo, servicios locales y pendientes.
> Ampliación posterior confirmada por el usuario: comentarios, reacciones, retos, insignias y vídeos deben entrar en la entrega final, mejorando diseño y uso. Vídeos solo subidos por coordinación y visibles al grupo autorizado. Ver `v1-community-expansion.md`; autorización no significa implementación comprobada ni aprobación de reglas finales por CAI.
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
- **RF-09 [C]** Comentarios y reacciones persistentes, identidades autenticadas, permisos por grupo y gestión administrativa. Detalles de moderación según el plan de ampliación.
- **RF-10 [C]** Vídeos privados: coordinación sube y el grupo autorizado reproduce; límites, permisos, retirada y pruebas de archivos. Alumnos no suben vídeos inicialmente.
- **RF-11 [C/D]** Retos e insignias incluidos; otros sistemas de notificación/gamificación no se incluyen automáticamente por este requisito.
- **RF-12 [P]** Formulario de solicitud de acceso por pasos, con autorización de tutor para menores (ver `docs/student-signup.md`).
- **RF-13 [C]** Acceso opcional con Google, conservando contraseña como alternativa, con datos del alumno obligatorios y aprobación administrativa antes de entrar. Preparado para pruebas locales; configuración y validación real pendientes (ver `docs/google-signin.md`).
- **RF-14 [C]** Guardar publicaciones de texto, revisión administrativa, motivos de rechazo y retiro por el autor con permisos en servidor e historial persistente. La conexión local usa visibilidad por programa/grupo como regla inicial pendiente de validación final (ver `docs/local-publications.md`).
- **RF-15 [C]** Retos educativos con gestión sencilla de coordinación, calendario real, intentos y progreso persistentes, validación/puntuación en servidor y experiencia móvil clara.
- **RF-16 [C]** Insignias automáticas y revisadas por coordinación, colección/progreso/estado comprensibles y compartición voluntaria sin filtrar solicitudes privadas.

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
