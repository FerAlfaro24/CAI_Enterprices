# Recuperación y avisos locales

Rama `feat/local-password-recovery`. Se conserva la arquitectura local, sin dependencias nuevas. Antes de migrar se creó un respaldo con `npm.cmd run local:backup`.

## Recorrido de prueba

- En `/alumnos`, «Olvidé mi contraseña» abre `/recuperar-acceso`. La respuesta es la misma para cuentas inexistentes, Google, pendientes o cuentas elegibles. No confirma si existe un correo.
- Solo las cuentas con contraseña, aprobadas y activas generan un aviso de recuperación. Los reintentos dentro de 15 minutos se agrupan. Hay límites por IP y comprobación de origen.
- En `/gestion/avisos`, coordinación revisa avisos de solicitudes, decisiones de publicaciones, recuperación y cambios de contraseña. «Marcar revisado» no significa enviado.
- **No se envía ningún correo.** «Preparar enlace de prueba» es una herramienta administrativa exclusiva del entorno local con datos ficticios. No comprueba la identidad ni la posesión del correo del alumno. En producción debe sustituirse por entrega al destinatario verificado mediante el servicio de correo; nunca exponerse como bandeja administrativa de contraseñas.
- El enlace generado permite probar `/recuperar#token=…`. Caduca en 15 minutos, solo sirve una vez y generar otro invalida el anterior. El token no se guarda en texto en la base, avisos ni auditoría. El fragmento se elimina de la barra al abrir el formulario.
- Se exige una frase de 15 a 128 caracteres y confirmación. Tras guardar, se cierran las sesiones anteriores del alumno y sus comprobantes Google locales; el acceso administrativo permanece independiente. No se inicia sesión automáticamente. Google no recibe un cambio de contraseña desde CAI.
- Suspender o devolver la solicitud a pendientes invalida enlaces de recuperación. Reactivar no los restaura. Se revalida dentro de una transacción después del cálculo de contraseña para impedir usos concurrentes, renovaciones o cambios obsoletos.

La migración 5 añade `local_notices` y `password_resets`; no elimina ni recrea tablas existentes. Los avisos de decisiones se guardan en la misma transacción que esas decisiones. Los avisos no incluyen el contenido privado de publicaciones ni enlaces secretos; los enlaces de prueba se generan bajo demanda y quedan en memoria del diálogo. Se conservan el bloqueo de producción y el acceso exclusivo a localhost.

## Archivos

`server/notices.ts`, `database.ts`, `app.ts`, `access-repository.ts`, `publications.ts`, `server/tests/recovery.test.ts`; componentes `RecoveryPage.tsx`, `LocalNotices.tsx`, reutilización del formulario `ActivateAccountPage.tsx`, `StudentLogin.tsx`, `LocalAccessApp.tsx`, `api.ts` y rutas de `src/app/router.tsx`. El script `scripts/check-recovery.browser.mjs` recibe las credenciales administrativas por argumento y prepara cuentas ficticias.

## Validación realizada

- Suite de API: 47 resultados correctos, contando cuatro contenedores. El nuevo caso comprueba respuesta uniforme, acceso administrativo, reintentos, contraseñas antiguas/nuevas, revocación, expiración, renovación durante el hash, uso único y consumo simultáneo del enlace.
- Lint, tipos y build correctos; permanece el aviso conocido de tamaño del bundle.
- Brave y Opera GX: 14 comprobaciones por navegador del recorrido completo sobre el servidor de desarrollo local. Diálogo y formulario a 1440, 768, 375 y 320 px; etiquetas, retirada del fragmento, cambio de contraseña, login nuevo y rechazo del enlace reutilizado. No hubo errores de ejecución de JavaScript.
- Capturas inspeccionadas del formulario móvil y la bandeja en escritorio.

Pendientes: SMTP/proveedor de correo, entrega y verificación del destinatario, política de recuperación administrativa, textos definitivos, pruebas de producción y revisión independiente de seguridad. Los avisos aún no tienen paginación ni entrega automática. No se probaron dispositivos físicos, lectores de pantalla, Firefox/Safari ni restauración específica de los nuevos avisos desde respaldo. No se ha habilitado este flujo para alumnos reales.
