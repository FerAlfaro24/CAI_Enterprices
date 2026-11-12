# Gestión del equipo administrador

**Punto 2 comprobado localmente con cuentas ficticias.** Rama `feat/v1-admin-team`, base `88ef627`; puntos de retorno `0f0c493` (servicio/migración/pruebas) y `f980067` (Configuración/activación/recorrido). Mantiene el panel y la identidad visual de v1.0. No incluye edición de expediente, roles adicionales, correo real ni despliegue.

## Uso sencillo

En Configuración → **Equipo administrador** se muestran nombre, correo y estado: **Activa**, **Pendiente de activación** o **Desactivada**. Todos los administradores tienen el mismo acceso completo, incluida la gestión del equipo. No hay un rol propietario ni moderador implícito.

1. **Agregar administrador:** escribir nombre/correo, confirmar la contraseña propia y aceptar el alcance del acceso. **Crear cuenta pendiente** guarda la cuenta sin concederle acceso.
2. Sobre esa cuenta, **Preparar invitación**, volver a confirmar contraseña/alcance y preparar el enlace. Es de prueba local, privado, de un uso y 24 horas. No se envía ningún correo. Otro enlace invalida el anterior.
3. El destinatario abre `/activar-administracion#token=…`, elige su propia contraseña y la confirma. Después debe entrar normalmente al panel con su correo; no se inicia sesión automáticamente.
4. **Desactivar** muestra el efecto y pide contraseña/confirmación: cierra las sesiones de esa persona e invalida sus enlaces de invitación/recuperación. Conserva la cuenta y el historial. Cancelar no cambia nada.
5. **Reactivar** permite entrar otra vez, sin revivir sesiones o enlaces antiguos. Si la persona todavía no eligió contraseña, sigue pendiente y se debe preparar una invitación nueva.

No puedes desactivar tu propia cuenta desde esa sesión ni dejar el sistema sin un administrador activo que ya pueda entrar. Una cuenta pendiente no cuenta como sustituto. Para un cambio de responsable, primero activar y comprobar el acceso de la otra persona; esa cuenta podrá desactivar la anterior después. Esto no verifica automáticamente identidad ni titularidad del correo.

## Errores y secretos

La contraseña de confirmación se limpia al terminar cada intento; cancelar retira el formulario. No se eligen contraseñas ajenas ni se permite cambiar correos desde este bloque. Si una contraseña se olvidó, usar el recorrido de recuperación ya existente.

Si se pierde la respuesta del alta, el formulario conserva nombre/correo y el mismo identificador de envío para reintentar sin duplicar la cuenta. Si se pierde la respuesta de una invitación, no se inventa ni recupera su token desde la base: actualizar el equipo y preparar otra invitación invalida la anterior. No hay reintentos automáticos.

Las decisiones con revisión antigua que no representan un reintento idéntico reciben conflicto. Se actualiza el listado y se pide elegir otra vez la acción. Un reintento inmediatamente idéntico de cambio de estado confirma lo guardado sin repetir la auditoría. El formulario se bloquea mientras guarda; una sesión caducada retira los datos privados y exige acceder de nuevo.

Los enlaces solo aparecen tras una operación administrativa autorizada y reautenticada. No son un endpoint público de recuperación. No compartirlos en chats, capturas o documentos. Para la entrega real faltan verificar responsables/correos y acordar/probar el canal seguro de invitación con CAI, además del correo y operación de recuperación pendientes.

## Servicio y persistencia

- Migración 11 aditiva: `admin_users` incorpora `active`, `activated`, `revision`, `create_key`; las cuentas anteriores conservan acceso activo/activado. Tabla `admin_invitations` con hash del token, caducidad y administrador que lo preparó. Nunca se guardan tokens de invitación en texto.
- `GET /api/local/admin-team`: solo administradores activos/activados. Directorio mínimo con id, nombre, correo, estado y revisión; no hashes, tokens o claves de alta.
- `POST /api/local/admin-team`: nombre/correo/contraseña propia/confirmación y cabecera de idempotencia. Cuenta pendiente con hash no utilizable como contraseña; no se permite elegir rol, estado o contraseña del destinatario.
- `POST /api/local/admin-team/:id/invitation`: solo pendiente habilitado, revisión vigente, contraseña propia y confirmación. Preparación auditada, con renovación que invalida la anterior.
- `PATCH /api/local/admin-team/:id`: cambio de acceso con revisión, contraseña propia y confirmación. No elimina cuentas ni modifica nombres/correos. Conserva la última cuenta activa/activada en transacción y rechaza desactivación propia.
- `POST /api/local/admin-activation`: enlace privado, contraseña de 15–128 caracteres y confirmación. Veinte intentos por IP en 15 minutos. Separa tokens de alumno/recuperación; revalida tras scrypt y consume enlace en transacción.
- Las operaciones de equipo admiten solo sus campos, mantienen origen/JSON/tamaño y revalidación tras leer el cuerpo; límite de 30 operaciones por cuenta en 15 minutos. La reautenticación comprueba sesión y versión de credencial después de la verificación asíncrona.
- Login, sesión y emisión de sesión exigen cuenta activa/activada. Login compara también la revisión después de scrypt: desactivar/reactivar durante un login no revive una prueba anterior. Cambiar estados elimina sesiones, invitaciones y recuperación; el servicio de recuperación filtra también estado al solicitar, entregar y restablecer.
- Auditoría de alta/invitación/activación/estado con identificador del destinatario y número de sesiones revocadas cuando corresponde. No registra contraseñas, correo, tokens o hashes. Los administradores son equivalentes; esta entrega no introduce una jerarquía nueva.
- El verificador admite copias 9/10/11 en solo lectura. Se respaldó el entorno habitual antes de la migración; las migraciones y pruebas se hicieron en bases ficticias. No se migró ni cambió la cuenta/base habitual durante esta tarea. Para verlo en el entorno habitual hay que reiniciar normalmente el servicio actualizado después de respaldar; no asumir que un proceso antiguo ya recargó el backend.

## Archivos principales

Servicio: `server/admin-team.ts`, `database.ts`, `auth.ts`, `admin-recovery.ts`, `app.ts`, `contracts.ts`, `verify-backup.ts`. Interfaz: `AdminSettingsPage.tsx`, `AdminTeamSettings.tsx`, `useAdminConnection.ts`, `admin.module.css`; se reutilizan `ActivateAccountPage.tsx` y `LocalInvitationDialog.tsx`, con API/ruta administrativa. Pruebas nuevas en `server/tests/admin-team.test.ts`, `admin-team-browser-server.ts` y `scripts/check-admin-team.browser.mjs`; expectativas de esquema actualizadas en las suites anteriores.

## Comprobaciones realizadas

- **121 resultados de servidor correctos**, incluidos once contenedores. Permisos de anónimo/alumno, respuesta mínima, origen/formato/tamaño/campos, reautenticación, altas idempotentes/duplicadas, pendientes sin login/recuperación, renovaciones, confirmación/uso único, sesiones distintas conservadas, suspensión/reactivación sin revivir enlaces/sesiones, revocación durante hash/login, última cuenta, desactivaciones cruzadas, límites, copia/reinicio y migración 10→11. Incluye las regresiones de recuperación, publicaciones, grupos, imágenes y alumnado.
- **37 comprobaciones completas en Brave y 37 en Opera GX**, sobre compilación real. Varias sesiones ficticias, alta con respuesta perdida/reintento único, bloqueo de doble envío, invitación perdida/renovada, activación/acceso normal, alcance del equipo, cancelación, desactivación/reactivación y revisión antigua. Cero errores de ejecución JavaScript; sin contraseñas/tokens en storage.
- Cuatro anchuras 1440/768/375/320 para equipo/alta, diálogo privado y activación, con nombres largos. Revisión visual adicional de equipo en escritorio y alta vacía a 320 px, sin desbordamientos ni secretos mostrados; consola de esa revisión sin errores/advertencias.
- Typecheck/lint/build y revisión de espacios correctos; entrada ~239 KB, sin aviso de chunk grande. Sin dependencias nuevas ni cambio del lockfile; diez alertas moderadas de herramientas siguen pendientes.

El primer caso nuevo de carrera estaba mal preparado: la activación acababa antes de reautenticar la desactivación y cambiaba correctamente la revisión. Se corrigió la fixture para forzar la revocación durante scrypt y se repitió la suite. Después de los navegadores se reforzó la comparación de revisión en login; ese caso exclusivo de servidor se añadió y la suite completa volvió a pasar (121). No se repitió todo el recorrido de navegador por ese ajuste sin cambios de interfaz. No se cuentan intentos incompletos como pruebas aprobadas.

## Repetición aislada

Compilar y usar dos consolas separadas:

```powershell
$env:CAI_API_PORT = '3101'
node server/tests/admin-team-browser-server.ts
```

```powershell
$env:CAI_API_PORT = '3101'
npm.cmd run preview -- --host ::1 --port 4180 --strictPort
```

La fixture abre una SQLite nueva en `.local/tests/admin-team-browser-*`, con cuentas ficticias diferentes por navegador; no abre la base habitual. `checkAdminTeam` recibe identidades de `browser.json` y usa la frase ficticia del fixture, nunca credenciales reales. Crear otra fixture para repetir desde cero, sin borrar ni reiniciar datos habituales. Se detuvieron las consolas aisladas al terminar.

El punto posterior de correcciones de expediente ya se completó en su alcance local: [ficha e historial privado](v1-student-record.md). No cambia correo o vínculos de acceso. Siguen 4 herramientas y 5 revisión final; correo/Google reales, cuentas definitivas, contenidos/autorizaciones y alojamiento al final.

Criterios técnicos contrastados: [reautenticación para acciones sensibles](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#require-re-authentication-for-sensitive-features) y [permisos en cada operación](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html#validate-the-permissions-on-every-request), de OWASP. El alcance comprobado es el descrito, no una auditoría exhaustiva de producción.
