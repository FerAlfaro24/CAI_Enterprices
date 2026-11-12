# Acceso con Google y solicitud obligatoria

Rama: `feat/google-signin-onboarding`, desde la rama de activación de alumnos. Integración preparada para pruebas locales; falta registrar el cliente web de CAI y comprobar una cuenta real con el propietario. Sin esa configuración, el botón no aparece y no se carga ningún recurso de Google. El acceso con contraseña sigue disponible.

## Qué verá cada persona

1. El alumno o tutor elige «Continuar con Google» en `/alumnos` o `/registro-local`.
2. Google confirma la cuenta. Si es la primera vez, CAI pide nombre y apellidos del alumno, fecha de nacimiento, programa y grupo. La matrícula sigue siendo opcional. El correo confirmado no se puede cambiar en este formulario.
3. Si corresponde, se solicitan los datos del tutor y su autorización inicial. La confirmación administrativa continúa siendo obligatoria para menores.
4. El alumno revisa y envía sus datos; recibe un folio y espera. Recargar o volver con la misma cuenta permite consultar el estado.
5. Coordinación revisa la solicitud habitual. El detalle indica «Google · Cuenta confirmada» y recuerda comprobar la inscripción y los datos declarados.
6. Al aprobar, el alumno entra con Google sin preparar un enlace ni crear otra contraseña. Rechazar, suspender o devolver a pendientes bloquea el acceso. Una reactivación requiere una sesión nueva.

Google confirma una cuenta, no la identidad escolar, el nombre real, la edad ni la autorización del tutor. El formulario y la revisión de CAI mantienen esas funciones. Una cuenta Google previamente usada en una solicitud no admite otra solicitud desde este flujo; coordinación debe revisar el expediente. No hay vinculación automática con cuentas de contraseña por coincidencia de correo. Esa vinculación y la recuperación de cuentas se mantienen pendientes.

## Registrar CAI en Google, paso a paso

Solo se hace una vez por entorno. No requiere contratar el servidor ahora. La [guía oficial de configuración de Google](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) explica el registro y los orígenes locales.

1. Abre [Google Cloud Console](https://console.cloud.google.com/). Entra tú con la cuenta que administrará este registro.
2. Crea o selecciona un proyecto, por ejemplo **CAI · Pruebas locales**.
3. En **Google Auth Platform**, configura los datos de la aplicación: nombre CAI, correo de soporte y contacto. Mantén este entorno para pruebas; completa Audience/usuarios de prueba si la consola lo solicita. No añadas permisos de Drive, Gmail o contactos.
4. En **Clients / Clientes**, elige **Crear cliente** y tipo **Aplicación web**. Pon un nombre como **CAI web local**.
5. En **Orígenes autorizados de JavaScript**, agrega `http://localhost` y `http://localhost:5173`. Si probarás la compilación, agrega también `http://localhost:4180`. No añadas rutas como `/alumnos` a esos orígenes.
6. Este flujo usa una respuesta en JavaScript, así que no necesita una URL de redirección. Guarda y copia el **ID de cliente**, terminado en `.apps.googleusercontent.com`. No hace falta copiar ni compartir el secreto del cliente.
7. Desde la carpeta del proyecto, guarda ese identificador:

```powershell
npm.cmd run google:setup -- TU_ID_DE_CLIENTE.apps.googleusercontent.com
```

El comando acepta un ID completo real, valida su formato y lo guarda en `.local/google.json`, ignorado por Git. También se puede definir `GOOGLE_CLIENT_ID` en el entorno del proceso. No hay secretos de cliente en este flujo.

8. Reinicia `npm.cmd run dev:local` y abre **http://localhost:5173/alumnos**. Usa exactamente el origen registrado; `127.0.0.1` es otro origen.
9. Con una cuenta de prueba autorizada, comprueba el botón y completa datos ficticios del alumno. Comprueba la espera, aprobación, reingreso y suspensión. No utilices datos de alumnos reales en este entorno.

Si aparece **origin_mismatch**, revisa protocolo, nombre y puerto exactos. Si hay restricciones de organización o cuenta supervisada, conserva la alternativa de contraseña y revisa las condiciones de esa cuenta con su propietario. Si el botón no carga, permite la ventana de acceso de Google y revisa conexión/extensiones sin cambiar configuraciones del sistema. Tras cinco minutos sin completar el acceso, puede ser necesario volver a cargar Google para obtener un reto nuevo.

La configuración para internet, dominio, HTTPS, políticas definitivas y verificación que pudiera exigir Google se revisará al preparar el despliegue. No se publica nada con estos pasos.

## Implementación y límites

- `google-auth-library`: única dependencia nueva, para comprobar ID tokens en el servidor. Se usa `verifyIdToken` con audiencia fija y se exige correo confirmado. No se acepta como prueba un JWT decodificado por el navegador. Referencia: [validación oficial del ID token](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
- Reto de un solo uso, aleatorio, con caducidad de cinco minutos y nonce ligado al ID token. Se comprueba origen en cada operación de escritura y se vuelve a validar el reto después de esperar al proveedor.
- Migración 3 añade identidades Google, comprobantes temporales y retos. No borra ni recrea expedientes, alumnos o contraseñas existentes. La asociación utiliza `sub`, el identificador estable de Google; no el nombre ni el correo.
- La comprobación temporal dura una hora y permite completar o consultar la solicitud. Es independiente de la sesión de alumno y nunca concede acceso por sí sola. Las sesiones usan cookies HttpOnly y SameSite=Strict; en la base solo se guardan hashes de sus tokens.
- La sesión de alumno conserva la duración de ocho horas y comprueba aprobación y estado activo en cada acceso. Los perfiles de grupo incluyen las cuentas Google aprobadas y conservan su respuesta mínima.
- Salir del área del alumno elimina también su comprobante Google de CAI. No cierra la cuenta de Google ni la sesión administrativa. Cambiar de cuenta con Google cancela la sesión anterior de alumno.
- No se guardan ID tokens, contraseñas de Google, permisos de otras APIs ni tokens en localStorage. El script y el botón oficiales solo se cargan cuando el cliente web está configurado.
- Continúan la restricción del servidor a localhost y el bloqueo de `NODE_ENV=production`. No se ha desplegado ni habilitado el uso con alumnos reales.

## Archivos y validación

Servidor: `server/google-auth.ts`, `google-config.ts`, `google-setup.ts`, migración en `database.ts`, rutas en `app.ts`, integración en `student-accounts.ts`, `access-repository.ts`, `contracts.ts` e `index.ts`. Interfaz: `GoogleSignInButton.tsx`, `GoogleOnboardingPage.tsx`, estilos y API de `local-access`, rutas, formulario/página de solicitud y detalle administrativo. Se corrige la configuración de ESLint para comprobar las firmas TypeScript con su regla correspondiente.

Las pruebas HTTP del servidor suman 35 resultados correctos, contando tres contenedores: incluyen el flujo Google y las regresiones de contraseña, permisos, solicitudes y migración. El proveedor Google se sustituye por un verificador ficticio en las pruebas; el adaptador de la biblioteca oficial también se prueba con su respuesta sustituida. Estos casos no acreditan un acceso real a Google.

`scripts/check-google-onboarding.browser.mjs` comprueba el recorrido con proveedor ficticio y backend real aislado: 24 comprobaciones en Brave y 24 en Opera GX; botón, formulario y estado a 1440, 768, 375 y 320 px. El servidor de fixtures `server/tests/google-browser-server.ts` usa solo memoria y exige `NODE_ENV=test`; nunca lo importa el arranque normal. El script del navegador sustituye exclusivamente la biblioteca externa; los endpoints, cookies, decisiones y permisos de CAI se ejecutan de verdad.

Para reproducir, iniciar ese servidor en el puerto 3102 y un preview Vite en 4180 con proxy `/api/local` hacia 3102. El escenario incluye las credenciales públicas y ficticias de ese servidor de pruebas. Nunca utilizarlo con la base normal. Para los checks generales: `npm.cmd run test:api`, `npm.cmd run lint`, `npm.cmd run build`.

También pasó el recorrido previo de activación y contraseña, con 23 comprobaciones por navegador. Lint, tipos y build correctos; permanece el aviso conocido de tamaño del bundle. Se inspeccionó visualmente el formulario en escritorio y móvil, en temas oscuro y claro. Se comprobó la actualización de la base existente sin pérdida de expedientes, alumnos ni cuentas. Sigue pendiente la ventana real de Google, posibles restricciones de navegador/cuenta, dispositivos físicos y una revisión de seguridad de producción.
