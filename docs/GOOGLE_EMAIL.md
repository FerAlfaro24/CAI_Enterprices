# Google y correo de acceso — F6

## Estado al 24-11-2026

Rama `feat/v1-google-email-onboarding`, desde `aabd5bc` de la presentación actualizada. **Preparación técnica implementada; cierre externo pendiente.** La copia de presentación conserva F1–F5/esquema22 y ventana original. En la comprobación del 24-11 a las23:33 CDMX, los PID remotos anteriores no estaban activos y su dominio ya no resolvía; no se cambió ni reanudó el túnel y no se determinó la causa del cierre. No afirmar que el enlace sigue disponible. No se modificó su frontend/base/proceso, main, release o Vercel. La nueva rama requiere esquema23 en fixtures nuevas; no arrancarla contra la base habitual ni la copia remota para migrarlas implícitamente.

El usuario creó una cuenta institucional y autorizó expresamente aceptar condiciones de Google Cloud, política de datos de API, cliente web local y consentimiento básico de nombre/foto/correo. Se creó el proyecto de CAI y un cliente web **en Prueba**, con una sola cuenta de prueba y origen `http://localhost:4680`. No se activó facturación, prueba de pago, scopes de Gmail, API key general ni acceso de la cuenta personal. Identificador público/proyecto y evidencia de la prueba en `.local/tests/f6-google-config.json`; ningún secreto de Google en Git ni en la aplicación. GIS solo necesita el identificador público.

**Google real comprobado:** botón oficial, cuenta institucional seleccionada, ID token verificado por biblioteca oficial, formulario con datos de alumno ficticio, solicitud pendiente CAI-0001, aprobación y entrada a `/community` sin contraseña CAI. Fixture independiente `.local/tests/onboarding-real-latest.json`. La recepción de Gmail no se simuló como éxito real: el adaptador de correo de esa fixture solo captura mensajes privados. El ID token/nonce/sesiones no se imprimen ni versionan. Cuenta personal no utilizada.

## Implementación

- `server/account-email.ts`: bandeja persistente de activación, recuperación y aprobación Google. Encolar aprobación es parte de la misma transacción que aprueba; el correo no decide la aprobación. Proveedor ausente conserva el flujo manual anterior.
- Estados: pendiente, enviando, aceptado por proveedor, fallido y cancelado. **Aceptado no significa recibido, abierto ni leído.** Fallar mantiene la solicitud aprobada. La ficha del alumno muestra estado y reintento; máximo tres emisiones/hora por cuenta y un minuto entre reenvíos administrativos. Recuperación pública aplica espera15min y respuesta uniforme para conocidos/desconocidos.
- El servidor elige destinatario y origen; el navegador nunca proporciona un destinatario o URL alternativo. No se mandan contraseñas. Los tokens se generan en memoria y solo sus hashes entran en las tablas existentes después de aceptación SMTP y revalidación. Activación24h/recuperación15min, un uso, sin tokens en registros de envío/API pública/logs. Renovar, suspender/reactivar, sancionar/levantar, cambiar contraseña o preparar enlace manual durante la entrega no restaura un acceso anterior.
- Al reiniciar, pendientes se procesan y envíos interrumpidos quedan fallidos, sin reenviarse a ciegas. Un correo aceptado antes de un corte pero no confirmado en SQLite puede contener un enlace inválido: generar otro desde la ficha. No se promete entrega exactamente una vez frente a una caída del proveedor/proceso.
- `server/email-delivery.ts`: SMTP con Nodemailer, TLS obligatorio/validación de certificado, puertos465/587, tiempos acotados, sin trazas SMTP ni archivos/URLs adjuntos. Remitente y configuración solo en archivo privado explícito. Biblioteca necesaria para SMTP; no se añadieron frameworks.
- Recuperación administrativa reutiliza su servicio existente y el mismo transporte, conservando mínimo15 y separación de cuentas. Invitaciones de nuevos administradores siguen manuales; no se afirma envío automático para ellas.
- Google de cuentas anteriores: **Mi perfil → Mi cuenta → Entrar con Google**. Exige sesión propia vigente y correo igual al de inscripción, vuelve a comprobar la sesión tras la verificación externa y no une cuentas por correo automáticamente. Conserva clave CAI, expediente, publicaciones y logros; no concede administración.

## Configuración SMTP privada

Sin `CAI_MAIL_CONFIG` no se envían correos ni se leen credenciales de correo. En producción el archivo debe ser pequeño, regular, sin symlink y estar dentro de `CAI_DATA_DIR`, fuera del código público; en local debe estar dentro del directorio de datos configurado. Se valida antes de abrir SQLite. Su `publicOrigin` debe coincidir exactamente con `CAI_PUBLIC_ORIGIN`; localhost HTTP con puerto solo se admite en pruebas locales.

Esquema del archivo (plantilla incompleta, sin secreto real):

```json
{
  "host": "smtp.gmail.com",
  "port": 465,
  "user": "cuenta-institucional@gmail.com",
  "from": "cuenta-institucional@gmail.com",
  "password": "REEMPLAZAR_SOLO_EN_ARCHIVO_PRIVADO",
  "publicOrigin": "https://cai.example.test"
}
```

Gmail necesita una credencial autorizada para aplicaciones; la contraseña normal compartida en una conversación no es la configuración SMTP. El titular completa verificación en dos pasos y crea su contraseña de aplicación en Google cuando esté disponible. No solicitarla en el chat. El asistente `scripts/configure-gmail.ps1` permite pegar sus16 letras directamente en la computadora con entrada oculta; crea un archivo nuevo sin sobrescribir otro, sin mandar mensajes ni imprimir la credencial. No ejecuta cambios de seguridad de Google, instala servicios o modifica configuración global.

Ejemplo para el responsable, con rutas elegidas explícitamente:

```powershell
powershell -NoProfile -File scripts/configure-gmail.ps1 -OutputFile C:/RUTA/PRIVADA/smtp.json -Email cuenta-institucional@gmail.com -PublicOrigin https://cai.example.test
# Configurar únicamente en el proceso autorizado:
$env:CAI_MAIL_CONFIG = 'C:/RUTA/PRIVADA/smtp.json'
```

La cuenta/recuperación/2FA deben quedar bajo control de CAI. No usar credenciales personales, publicar el JSON, pegarlo en frontend ni enviarlo a GitHub. Cambiar la contraseña de Google puede revocar credenciales de aplicación; coordinar rotación y verificar de nuevo.

## Prueba real de entrega pendiente

1. El responsable completa en Google la verificación de identidad, 2FA y credencial para la aplicación. La pestaña de contraseñas de aplicación solicita confirmar identidad; no se introdujo una contraseña por el agente.
2. Guardar credencial directamente en archivo privado y comprobar conexión SMTP. Esta comprobación no demuestra recepción.
3. Iniciar una fixture nueva con `NODE_ENV=test`, `CAI_F6_MAIL_CONFIG` explícito y `server/tests/onboarding-browser-server.ts 4684 3292 --smtp`. El origen del archivo debe ser `http://localhost:4684`. La fixture restringe envíos reales a la misma cuenta institucional del remitente; no manda a otros alumnos. Conserva un buzón privado de QA separado y no introduce rutas de prueba en el producto.
4. Registrar datos de alumno ficticio con ese correo → aprobar → verificar recepción real en Gmail (incluido Spam) → abrir el enlace → elegir clave y entrar. Repetir recuperación, caducidad/uso único/fallo/reenvío. Solo después marcar correo real comprobado.
5. Para despliegue definitivo configurar dominio HTTPS estable, orígenes/clientes de Google y estado de publicación adecuados; validar desde otros dispositivos y completar textos/permisos de CAI. No convertir el túnel temporal en alojamiento ni publicar OAuth para todos implícitamente.

## Evidencia de esta entrega

- Suite completa **346/346** correcta tras integrar correo y vinculación; bloque posterior de configuración privada **5/5**, total351 resultados distintos. Las pasadas previas fallaron por expectativas de esquema22 en fixtures históricas; se ajustaron esos escenarios y se repitió la suite sin fallos. No se eliminó ni ignoró ningún test.
- Navegador **52 comprobaciones finales**,26 Brave/26 Opera, contextos aislados: alta/aprobación, activación desde buzón simulado, login, recuperación, contraseña anterior inválida, uso único, estado fallido sin perder aprobación, alternativas manuales, vinculación Google simulada conservando la cuenta, privacidad,1440/768/375/320 y consola sin errores. Las pasadas intermedias23+23 no se suman a la final. Se corrigió la espera del verificador para consultar la sesión después de completar respuesta/navegación de vinculación, no durante su revocación/renovación.
- Tipos frontend y servidor/fixture, build y ESLint correctos. Sintaxis PowerShell del asistente comprobada sin ejecutar entrada de credenciales. Capturas de ficha móvil inspeccionadas; evidencia solo en `.local/tests/onboarding-browser-*`.
- Google real probado manualmente por UI en muestra local, descrito arriba. **SMTP real, recepción Gmail, dominio final y otros dispositivos pendientes**. No confundir buzón simulado con correo recibido ni ventana de presentación con entorno definitivo.

Fuentes primarias: [cliente de Google Identity Services](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [contraseñas de aplicación de Google](https://support.google.com/accounts/answer/185833), [SMTP de Gmail](https://developers.google.com/workspace/gmail/imap/imap-smtp), [transporte SMTP de Nodemailer](https://nodemailer.com/smtp).
