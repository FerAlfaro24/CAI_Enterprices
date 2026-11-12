# Seguridad de la contraseña administrativa propia

Comprobado localmente el 12 de noviembre de 2026. Rama `feat/v1-admin-account-security`, base `7daa623` de `chore/v1-stabilization`. Puntos de retorno: `1dc3c4a` (servicio/permisos) y `a7465f0` (Configuración y pruebas de navegador). Conserva el panel v1.0 y las integraciones acumulativas; no crea otra administración.

## Recorrido disponible

En **Configuración → Seguridad de mi cuenta**, el administrador escribe su contraseña actual, la nueva y su confirmación. La nueva usa la misma política local de 15 a 128 caracteres y puede ser una frase; no se impone una combinación nueva de símbolos. La actual puede tener la longitud anterior admitida para conservar acceso a cuentas existentes.

**Guardar contraseña y cerrar mis sesiones** actualiza únicamente la cuenta autenticada y cierra todas sus sesiones, incluida la del formulario. No inicia otra sesión automáticamente. El acceso muestra confirmación y exige la nueva contraseña; conserva la ruta protegida, por ejemplo Configuración, al volver a entrar. Otros administradores y alumnos mantienen sus sesiones.

Los tres campos están ocultos inicialmente, admiten el gestor de contraseñas y tienen una casilla de visibilidad local. Durante el envío quedan bloqueados y no se duplica la acción. Una contraseña actual incorrecta se limpia sin cambiar la cuenta. Al terminar o requerir nuevo acceso se desmontan los campos; no se guardan las contraseñas en localStorage/sessionStorage ni en URLs.

Si se pierde la respuesta, el sistema no sabe con certeza si se guardó el cambio. Limpia el formulario y vuelve al acceso con ese resultado incierto, sin afirmar éxito/fracaso ni reintentarlo automáticamente. Si se guardó, sirve la nueva contraseña; si el envío no llegó, sirve la anterior. Se probaron ambos casos. Una sesión terminada o una credencial cambiada en paralelo también exigen nuevo acceso.

## Servicio y revocación

`POST /api/local/auth/password` requiere sesión administrativa vigente, origen permitido, JSON limitado y solo `currentPassword`, `password` y `confirm`. No acepta identificadores de otra cuenta, correo o rol. La comprobación se limita a cinco intentos por cuenta cada 15 minutos. No modifica el correo ni el nombre de la cuenta.

Se reutilizan scrypt, sal aleatoria, comparación existente y sesiones HttpOnly. No se cambia el algoritmo ni se añade dependencia. Se comprueba la contraseña actual, se deriva el nuevo hash y se vuelve a consultar la sesión y el hash original antes de actualizar en transacción. El cambio y la revocación de sesiones son atómicos. La auditoría guarda actor, evento y número de sesiones revocadas; no incluye contraseñas, hashes, tokens o enlaces. La respuesta no devuelve una credencial nueva.

El login vuelve a leer el hash después de su verificación asíncrona. Una comprobación iniciada con la credencial anterior no puede producir una sesión nueva si el hash cambió mientras se calculaba. Dos cambios concurrentes no se sobrescriben: el primero revoca las sesiones y el siguiente deja de estar autorizado.

### Escrituras cuyo cuerpo seguía llegando

La prueba adicional de revocación detectó un fallo previo: una petición administrativa podía conservar el usuario comprobado antes de terminar de leer el cuerpo HTTP. Al completar el cuerpo después de revocar su sesión, aún respondía 200. El caso falló esperando 401 y se corrigió.

Las escrituras administrativas y de alumno vuelven a consultar la sesión después de leer el cuerpo, antes de modificar registros. Se mantienen los controles de origen, tamaño y negocio. Se comprobó tanto una actualización administrativa retrasada tras cambiar contraseña como una publicación de alumno suspendido durante el envío: ambas reciben 401 y no escriben. Las operaciones largas de contraseña e imágenes conservan además su comprobación posterior al procesamiento.

## Pruebas realizadas

- **Servidor: 83 resultados correctos**, incluidos ocho contenedores. Nuevos casos: permisos, origen/cuerpo, campos extra y selección de otra cuenta, política/confirmación/contraseña actual, límite por cuenta, revocación completa, conservación de otras cuentas y alumnos, contraseña de más de 64 caracteres, auditoría mínima, cambios simultáneos, sesión caducada y hash sustituido durante el cálculo, login anterior en curso, reinicio/copia y cuerpos retrasados. Conserva las regresiones previas de cuentas, grupos, imágenes, recuperación y moderación.
- **Brave: 29 comprobaciones completas; Opera GX: 29.** Compilación real, con varias sesiones aisladas. Cambio/confirmación/mostrar, validación, bloqueo de doble envío, cuatro anchuras 1440/768/375/320 para formulario y acceso, revocación de otra sesión propia, continuidad de otras cuentas/alumno, acceso viejo/nuevo y pérdida de respuesta antes/después del guardado. Sin errores de ejecución JavaScript en los recorridos completos.
- Inspección visual de Configuración y formulario en escritorio y a 320 px, conservando marca, estilos y composición. Ninguna contraseña se mostró en las capturas.
- Typecheck, lint, build y revisión de espacios de Git correctos. Siete rutas privadas de Vite siguen bloqueadas. Sin migración, dependencia nueva ni sobrescritura de la base habitual.

El primer recorrido de navegador esperaba erróneamente Resumen tras volver a entrar. El diagnóstico mostró acceso correcto en Configuración, que es la ruta conservada. Se corrigió la expectativa y se repitió cada recorrido completo con una base ficticia nueva. Los intentos incompletos y el caso de cuerpo retrasado que encontró el fallo no se cuentan como resultados aprobados.

## Aislamiento de las pruebas de contraseña

Las pruebas de navegador no usan las credenciales del administrador habitual. `server/tests/admin-security-browser-server.ts` crea una base nueva bajo `.local/tests/admin-browser-*`, con cuentas ficticias diferentes para Brave y Opera, otra administrativa y un alumno. Escribe metadatos de esas identidades, sin contraseñas, y nunca abre `.local/cai.sqlite`. El recorrido verifica la identidad ficticia esperada antes de cambiar nada.

Vite respeta ahora `CAI_API_PORT`, igual que el arranque de la API, para poder apuntar el frontend de pruebas al puerto aislado. Por defecto sigue siendo 3100; se valida que sea un puerto numérico local válido. No se modificó la configuración del sistema ni se ampliaron los orígenes permitidos. En el ensayo se usó `localhost:4180` con una vista previa separada sobre loopback IPv6, dejando la vista previa habitual en IPv4 intacta.

Para repetir, primero compilar y luego usar consolas separadas exclusivamente de pruebas:

```powershell
# Consola de API ficticia
$env:CAI_API_PORT = '3101'
node server/tests/admin-security-browser-server.ts
```

```powershell
# Consola de frontend ficticio
$env:CAI_API_PORT = '3101'
npm.cmd run preview -- --host ::1 --port 4180 --strictPort
```

El script `check-admin-security.browser.mjs` recibe las identidades del archivo de metadatos generado y usa la frase ficticia definida en el propio fixture. No pasarle datos de una persona real. Si un intento de prueba ya cambió contraseñas, crear otra base de fixture; no reinicializar la base habitual. Detener y cerrar estas consolas al terminar; no establecer esas variables como configuración permanente.

## Entrega y límites

La contraseña del administrador habitual y su archivo de acceso inicial **no se cambiaron** en este trabajo. El archivo de pruebas `.local/acceso-inicial.txt` tampoco se actualiza cuando una persona cambia su contraseña desde el panel: la antigua deja de servir. No se debe publicar, copiar a un manual ni tomar como credencial de producción.

Antes de entregar al responsable real, confirmar la cuenta bajo control de CAI y que esa persona puede entrar, elegir personalmente su contraseña y custodiar el acceso. No pedir que envíe la contraseña por chat o la comparta con la IA. Cambiar la contraseña propia no crea otra cuenta ni transfiere el correo de la cuenta existente.

Siguen pendientes alta/gestión de otros administradores, recuperación administrativa verificada, roles adicionales, identidad/cuentas definitivas y configuración externa. Si se pierde la contraseña actual, el formulario no permite omitirla; `local:setup` no es un mecanismo de recuperación. El procedimiento debe acordarse con el responsable antes de producción, sin añadir un acceso de emergencia sin protección.

La API continúa limitada a pruebas locales. HTTPS, entrega de correo/Google reales, contenido y permisos, validación humana y alojamiento permanecen para la tanda final. Los diez avisos moderados de herramientas de desarrollo ya registrados no se resuelven ni cambian en esta entrega.

La revisión posterior del perfil visible del alumno ya se completó en `feat/v1-student-profile`; ver [alcance y pruebas](v1-student-profile.md). Mantiene separados los datos visibles del expediente legal, sin edición de nacimiento, tutores, correo o roles.

Referencias primarias consultadas: [cambio de contraseña y reautenticación de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#change-password-feature) y [scrypt de Node.js](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback). Las garantías concretas anteriores corresponden al alcance probado localmente, no a una auditoría de producción.
