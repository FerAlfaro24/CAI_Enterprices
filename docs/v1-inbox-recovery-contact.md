# Mensajes, avisos y recuperación en la experiencia oficial

Rama `feat/v1-inbox-recovery-contact`, desde `e083c8f` de `feat/v1-groups-settings`; conserva la interfaz oficial v1.0 y todos los recorridos conectados anteriores. Punto de retorno del servidor: `4a84a05`. Los puntos de retorno se consultan con `git log -- docs/v1-inbox-recovery-contact.md`. Pruebas locales con datos ficticios; no es entrega de correo ni despliegue público.

## Recorrido disponible

- El formulario de contacto existente en la portada guarda una consulta con folio, nombre, medio de contacto, programa de interés y confirmación de uso de esos datos. El recibo explica que se guardó localmente, sin reservar clase ni enviar correo. Ante un fallo conserva los campos; reintentar el mismo envío no lo duplica.
- `/admin/mensajes`, dentro del panel original, permite atender consultas y revisar avisos. Las consultas tienen tres estados (Nueva, En seguimiento, Atendida) y nota interna; se conservan después de recargar. El cambio es seguimiento interno, no envía una respuesta al interesado.
- La pestaña Avisos de acceso reutiliza `LocalNotices`: filtra pendientes/todos, actualiza y marca revisados. Reutiliza también el diálogo de enlaces privados para preparar una recuperación de prueba. Preparar otro enlace invalida el anterior. Los avisos, notas y datos de contacto solo se consultan con sesión administrativa.
- El alumno abre Mis avisos desde Community. Ve solo los de su cuenta, sin destinatarios de otros alumnos ni enlaces privados. Marcar leído por el alumno es independiente de Marcar revisado por coordinación. Los avisos de cuenta no se muestran al abrir el perfil público de otro miembro.
- El enlace Olvidé mi contraseña del login lleva a recuperación con el mismo diseño. La respuesta no revela si existe la cuenta. El cambio usa un enlace de un uso, retira el fragmento de la barra, valida contraseña/confirmación, revoca sesiones previas y exige nuevo login. El cambio genera un aviso propio visible en Community.

## Reutilización y datos

`AccessFrame` extrae la composición original de `LoginPage` y la comparte con recuperación y activación, manteniendo marca, estilos, tema y estructura adaptable. Se corrigió el límite del login de 64 a 128 caracteres para que acepte las contraseñas válidas del servicio. Se verificó también la activación desde su formulario y la vuelta al login oficial. Los enlaces de éxito conservan texto blanco legible sobre el botón azul.

El seguimiento usa `ContactInbox` dentro de `AdminInboxPage`, con componentes/estilos existentes del panel, filtros sencillos y diálogo de nota/estado. La composición original del formulario de contacto se conserva; solo se conecta su variante contact. La lista de interés de la plataforma futura conserva su demostración y no se convierte en un servicio de suscripción.

Migración 8 aditiva, con respaldo previo: tabla `contact_inquiries` y columna `student_seen_at` en `local_notices`. No recrea ni borra cuentas, solicitudes, grupos, publicaciones o avisos. Los datos personales de la consulta quedan en su registro privado; la auditoría de seguimiento guarda únicamente folio y estado, sin duplicar contacto ni notas.

El servicio de contacto valida tipos, longitudes, medio de contacto, programa existente y confirmación de uso; rechaza campos no admitidos. Las notas admiten hasta 500 caracteres y saltos de línea. Las actualizaciones usan revisión para evitar sobrescribir otra ventana. El origen, tamaño de cuerpo y permisos conservan las protecciones de la API existente; los envíos de contacto tienen límite local de intentos. La recepción de consultas comerciales es independiente de pausar solicitudes de ingreso.

Las opciones de interés siguen siendo las del contenido comercial de la portada, distintas de los grupos de inscripción. Deben validarse con CAI. No se inventaron teléfono, ubicación, condiciones de clase ni destinatarios de correo.

## Archivos principales

Servidor: `server/contact.ts`, `notices.ts`, `app.ts`, `database.ts`, `contracts.ts` y `server/tests/inbox-contact.test.ts`.

Interfaz: `DemoForm` y `ContactSections`; `AccessFrame`, `LoginPage`, `RecoveryPage`, `ActivateAccountPage`; `LocalNotices` y `LocalInvitationDialog`; `AdminInboxPage`/`ContactInbox`; `StudentNotices`, perfil, cabecera y conexión de Community; API, router y estilos existentes. No se añadieron dependencias ni otra administración paralela.

## Comprobaciones realizadas

- Suite del servidor: 63 resultados correctos, incluidos seis contenedores. Las pruebas nuevas cubren validación/consentimiento/origen, recibo público mínimo, idempotencia, permisos de contacto, notas y revisiones obsoletas, auditoría sin duplicar datos privados, avisos propios sin destinatarios/tokens, lectura y revisión independientes, suspensión y persistencia al reiniciar. Incluye regresiones anteriores de cuentas, menores, grupos, moderación, recuperación y Google con verificador controlado.
- `check-inbox-recovery-contact.browser.mjs`: 37 comprobaciones completas en Brave y 37 en Opera GX. Administrador y tres contextos separados: visitante que luego usa otra cuenta, alumno y otra sesión del mismo alumno. Prueba interfaz de contacto/consentimiento, pérdida de respuesta tras guardar y reintento único, seguimiento/nota persistente, lectura propia y privacidad, recuperación desde login, nueva contraseña de más de 64 caracteres, revocación de la otra sesión, rechazo de contraseña anterior y reutilización del enlace.
- Diálogo de enlace privado, seguimiento, solicitud de recuperación y avisos propios a 1440, 768, 375 y 320 px en ambos navegadores. Cero errores de ejecución JavaScript en los recorridos completos. Las interrupciones de red y denegaciones esperadas son escenarios de prueba; no se afirma que toda petición de consola sea correcta.
- Inspección adicional en Brave: bandeja de escritorio, bandejas completas a 320 px, contacto y recuperación móviles. Activación real por interfaz, enlace de éxito legible y vuelta a `/login` comprobados.
- Lint, typecheck, build y revisión de espacios de Git correctos. Permanece el aviso conocido de tamaño del paquete principal (~693 KB minificado).

Los intentos iniciales incluyeron un error de sintaxis de validación, ya corregido, y ajustes del script para llevar al frente la ventana de contacto durante sus clics. Se detectó y corrigió desbordamiento real con un correo largo en el texto del diálogo privado; se repitieron después ambos recorridos completos. Se ajustó la casilla de consentimiento a los estilos reales de la portada. Los intentos incompletos no se cuentan como pruebas aprobadas.

## Límites y continuación

La recuperación real por destinatario sigue dependiendo de configurar correo y verificar la entrega. La preparación manual del enlace es una herramienta local de pruebas: no demuestra la identidad del destinatario y no es el mecanismo de recuperación final para clientes. Las cuentas de Google se recuperan desde Google. No se guardan tokens de recuperación en texto ni se devuelven en listados.

No se enviaron correos, mensajes externos o reservas, ni se contactó a los interesados. No se publicaron ni fusionaron ramas. Los datos siguen siendo de prueba en este equipo. Las pantallas anteriores de `/gestion` se conservan hasta consolidar rutas; los scripts antiguos que esperaban aquellas pantallas no se atribuyen como pruebas de esta entrega.

Siguiente bloque: archivos privados e imágenes, reutilizando galería y componentes existentes, con autorización por recurso y pruebas con archivos ficticios. Después, consolidación de rutas y estabilización. Google real, correo real, datos comerciales, validaciones del cliente, presupuesto y alojamiento continúan en la tanda final acordada. No empezar otro panel ni reconstruir los recorridos ya conectados.
