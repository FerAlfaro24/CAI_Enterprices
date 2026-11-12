# Recuperación administrativa

**Comprobada localmente con entrega ficticia; correo real pendiente.** Rama `feat/v1-admin-recovery`, base `d8df768`. Puntos de retorno: `2d1ec13` (servicio/migración/pruebas) y `874b00a` (pantallas/recorrido). Resuelve el desarrollo local del primero de los cinco puntos acordados; no incluye otras cuentas, expediente ni publicación.

## Recorrido

En el acceso de administración, **Olvidé mi contraseña** abre `/recuperar-acceso-administrativo`. Se escribe el correo de la cuenta; la respuesta es la misma exista o no y no dice que se haya enviado un correo. El servidor no devuelve enlaces ni muestra una vista previa administrativa.

Con un proveedor de entrega configurado y comprobado, el destinatario recibe un enlace que abre `/recuperar-administracion#token=…`. Elige una contraseña de 15–128 caracteres y la confirma. El enlace dura 15 minutos desde su preparación y sirve una sola vez. El cambio cierra todas las sesiones de esa cuenta y exige el acceso normal; no inicia sesión automáticamente. Si el navegador estaba en otra cuenta administrativa, conserva esa identidad y su sesión, sin convertirla en la cuenta recuperada.

La pantalla reutiliza `RecoveryPage`, `ActivateAccountPage` y `AccessFrame`; el recorrido de alumnos conserva sus rutas y servicio separados. No añade un panel o formulario paralelo.

Si la respuesta se pierde, el envío no llega o una respuesta 200 contiene JSON ilegible, se retiran los campos y se informa que el resultado es incierto. Probar el acceso normal y, si hace falta, pedir otro enlace; el formulario no reintenta automáticamente. Si se solicitó un enlace recientemente, hay un intervalo de 15 minutos por cuenta antes de preparar otro; una petición repetida no invalida el primero. El límite por IP es adicional.

## Límite del entorno habitual

`server/index.ts` **no configura un adaptador de correo**. Por tanto, la solicitud se guarda como pendiente, pero no genera un enlace utilizable ni envía mensajes. Saber el correo de una cuenta no basta para recuperarla. No se habilitó una consola, endpoint de previsualización o acceso de emergencia para saltarse la entrega.

Antes de usar esta función con personas reales falta confirmar que el correo de administración pertenece al responsable de CAI y configurar/probar un proveedor. La aceptación del adaptador es confirmación de transporte, no prueba de recepción humana. También debe integrarse el aviso de contraseña cambiada y el seguimiento operativo de entregas fallidas. Esto queda en la tanda externa final acordada, junto con HTTPS, remitente/dominio y configuración de producción. No pedir contraseñas al cliente por chat.

## Servicio y almacenamiento

- `POST /api/local/admin-recovery/request` admite solo `email`; respuesta 202 uniforme con mensaje local. Diez intentos por IP en 15 minutos, más intervalo persistente de 15 minutos por cuenta. No cambia contraseña, bloquea la cuenta ni cierra sesiones al solicitar.
- `POST /api/local/admin-recovery/reset` admite únicamente `token`, `password`, `confirm`. Veinte intentos por IP en 15 minutos, validación de origen, JSON, tamaño y política existente. Una solicitud puede ser pública; el cambio requiere el secreto privado recibido por el canal configurado.
- Migración 10 aditiva: tabla `admin_password_resets`, una fila por cuenta, con solicitud, estado de entrega, versiones de correo/hash, hash del token y caducidad. Nunca se guarda el enlace/token en texto. No se reemplazan tablas anteriores.
- Adaptador privado opcional de `createApplication`: destino tomado de la cuenta, ruta interna fija y caducidad; el navegador no elige destinatario o URL. La entrega ocurre fuera de la respuesta pública. La cola se procesa al arrancar y al solicitar, con segunda pasada para solicitudes recibidas durante otra entrega. No se ha medido ni garantizado resistencia completa a canales temporales.
- Un token en entrega, fallido o cancelado no permite cambiar contraseña. Entregas interrumpidas vuelven a pendientes al arrancar, descartando el token no confirmado. Las solicitudes antiguas se cancelan; no se envían enlaces vencidos.
- Después de la entrega se comprueban de nuevo correo, credencial y plazo antes de activar el token. Cambiar cualquiera invalida el enlace. Cambiar la contraseña desde Configuración elimina también cualquier recuperación anterior.
- El restablecimiento revalida el enlace dentro de transacción después de scrypt: dos usos concurrentes no se sobrescriben, y la caducidad/cambio de credencial durante el cálculo cancela la operación. Guarda solo el hash, elimina recuperación, revoca sesiones propias y audita el resultado sin credenciales.
- El fragmento se retira de la barra/historial al cargar la pantalla. No se guarda en local/sessionStorage ni aparece en URLs HTTP. El token sí viaja en el cuerpo del restablecimiento; el proveedor real deberá evitar registrar secretos.
- Auditoría de entrega confirmada y recuperación final con número de sesiones revocadas; no copia correo, contraseña, hash o enlace. Es historial técnico, no una nueva bandeja de avisos para el cliente.

El verificador de copias acepta esquemas 9 y 10 en modo de solo lectura, sin migrar la copia. La migración conserva cuentas y sesiones. Se creó respaldo previo del entorno habitual; las pruebas y migraciones de esta tarea utilizaron exclusivamente bases ficticias separadas. La base y contraseña habituales no se migraron/cambiaron durante las pruebas. Al reiniciar normalmente el servicio actualizado, realizar antes respaldo y conservar la versión de código correspondiente.

## Comprobaciones

- **108 resultados de servidor correctos**, incluidos diez contenedores: respuesta uniforme/sin proveedor, origen/formato/tamaño/campos, destino fijo, hash privado, repetición/intervalo, contraseña larga, revocación y ausencia de auto-login, sesión de otra cuenta conservada en el mismo navegador, enlaces inválidos/caducados/renovados y separados de alumnos, uso concurrente, cambios durante scrypt/entrega, fallo de entrega, cola durante otra entrega, reinicio/copia y migración 9→10 con cuentas/sesiones intactas. Incluye las regresiones anteriores.
- **45 comprobaciones completas en Brave y 45 en Opera GX** sobre compilación real: enlace desde acceso oficial, mensajes uniformes, ninguna exposición pública del enlace, solicitud repetida, confirmación, bloqueo/doble envío, eliminación de fragmento, guardado/acceso, revocación, reutilización, respuesta perdida antes/después y JSON 200 ilegible, datos sensibles fuera de storage/URLs y cero errores de ejecución JavaScript. El último ajuste que conserva una sesión distinta al usar el enlace se comprobó después en servidor; no se repitió el recorrido completo de navegadores por ese ajuste exclusivo del caso entre cuentas.
- Cuatro anchuras 1440/768/375/320 para solicitud, formulario y éxito. Revisión visual adicional en Brave: solicitud en escritorio y formulario vacío a 320 px, sin desbordamiento. Consola de esa revisión sin errores/advertencias; fallos de red y rechazos provocados en las pruebas son esperados.
- Typecheck, lint, build y revisión de espacios correctos. Entrada ~239 KB sin aviso de chunk grande. Sin dependencias nuevas; las diez alertas moderadas de herramientas siguen pendientes.

Incidencias de las pruebas: primero se esperaba el límite después de ocho envíos tras reiniciar (eran necesarios diez); se corrigió la preparación. El primer recorrido Brave no esperaba la ruta diferida antes de comprobar si había sesión; se añadió la espera explícita. Esos intentos incompletos no se cuentan como aprobados. Tras reforzar cola/JSON se repitieron las comprobaciones relevantes.

## Repetición aislada

`server/tests/admin-recovery-browser-server.ts` crea otra SQLite en `.local/tests/admin-recovery-browser-*`, cuentas ficticias por navegador y un buzón ficticio separado en loopback 3102 protegido con una clave aleatoria de prueba. **El producto no tiene ese endpoint.** Los metadatos privados están excluidos de Git. El script comprueba identidades ficticias antes de cambiar contraseñas.

Después de compilar, usar dos consolas separadas:

```powershell
$env:CAI_API_PORT = '3101'
node server/tests/admin-recovery-browser-server.ts
```

```powershell
$env:CAI_API_PORT = '3101'
npm.cmd run preview -- --host ::1 --port 4180 --strictPort
```

Ejecutar `checkAdminRecovery` de `scripts/check-admin-recovery.browser.mjs` con las identidades/metadatos de prueba y `http://localhost:4180`. No usar datos de personas reales, mostrar enlaces en capturas o publicar el buzón. Para repetir desde cero crear otra fixture, sin borrar/reinicializar la base habitual. Detener las dos consolas al terminar; no establecer variables permanentes del sistema.

El punto posterior de equipo ya se completó localmente: [altas, estados e invitaciones](v1-admin-team.md). Recuperación filtra ahora también cuentas desactivadas o sin activar; sus enlaces se invalidan al desactivar. Siguen expediente, herramientas y revisión final en ese orden. Fuente técnica contrastada: [recuperación de contraseña de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html), que recomienda respuesta uniforme, canal separado, tokens temporales de un uso y acceso normal después del cambio. Las garantías de este documento se limitan a las pruebas descritas.
