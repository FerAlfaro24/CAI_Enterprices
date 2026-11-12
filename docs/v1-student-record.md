# Correcciones del expediente del alumno

**Punto 3 comprobado localmente, con datos ficticios.** Rama `feat/v1-student-record`, base `7e404a3`; puntos de retorno `6817d95` (servicio/migración/pruebas) y `0f3e9a7` (ficha/editor/recorrido). Conserva el panel y las integraciones anteriores. No es validación de identidad ni autorización para admitir personas reales.

## Uso y alcance

En **Alumnos → Ficha → Expediente del alumno → Corregir expediente**, coordinación puede corregir nombre, apellidos, fecha de nacimiento, matrícula y datos de tutor cuando corresponden. Debe indicar motivo, confirmar con su contraseña y aceptar que verificó los datos y efectos. Cancelar descarta el borrador. Se pueden corregir alumnos aprobados activos o suspendidos; no se reactiva automáticamente un acceso suspendido.

La ficha conserva los controles de programa/grupo y suspensión. Este formulario **no cambia correo, contraseña, Google, rol ni grupo**. El correo de acceso aparece informativo: modificarlo exige un proceso separado de verificación del destinatario y la identidad. Queda pendiente para la tanda externa final; no se presenta este bloque como edición universal del expediente.

Los datos se cargan al pedir la edición, mediante un servicio privado. El historial muestra las últimas 20 correcciones, con fecha, administrador, motivo y antes/después de los campos modificados. El historial completo permanece en la base privada. No se guarda en el navegador ni se muestra al grupo del alumno. Para cargar cambios de otra ventana se ofrece **Cargar expediente y descartar borrador**.

## Menores y autorizaciones

- Si el expediente corregido corresponde a un menor, requiere tutor válido. Cambiar nombre, nacimiento o tutor de un menor —incluido corregir un adulto a menor— exige una **nueva referencia de autorización**, de 8–240 caracteres y distinta de la anterior, junto con la confirmación administrativa. El servidor aplica la regla aunque se altere el formulario.
- La referencia anterior se conserva en el historial. La nueva sustituye la confirmación vigente con actor/fecha; una casilla o referencia no prueba por sí sola la identidad ni la existencia del documento. CAI debe verificar y custodiar la evidencia por el procedimiento acordado para la entrega.
- El nombre visible de un menor se recalcula con las abreviaturas existentes del registro, preservando estilo de iniciales si ya lo usaba; se fuerza visibilidad privada. La pantalla muestra la vista previa antes de guardar.
- Sus historias publicadas vuelven a pendientes de revisión cuando la corrección exige renovar autorización. No se republican automáticamente; rechazadas, pendientes y retiradas conservan su estado. No se cambian autores ni audiencias.
- Corregir solo matrícula de un menor no exige renovar autorización ni volver a revisar sus historias. Si coordinación también renueva una referencia, puede registrarla sin modificar otros datos.
- Al corregir un menor a adulto, no se amplía su visibilidad ni se cambia automáticamente su alias. Se retira el tutor del expediente vigente y su confirmación vigente, conservando los datos anteriores en el historial privado. No se inventa una autorización de tutor para un adulto.
- Revisar manualmente el material donde aparezca una persona reclasificada como menor: la galería no identifica estudiantes dentro de una imagen, por lo que esta función no puede encontrar o retirar automáticamente todas sus fotografías.

La edad se valida con `ageAt`, calendario de México y rango existente 5–99 años. El formulario reutiliza `validateSubmission` y `abbreviatedNames`. La adaptación temporal de `filledBy` solo sirve para validar el expediente corregido; el valor histórico de quién llenó la solicitud no se reescribe. Un programa/grupo archivado no impide corregir sus datos: se valida la asignación existente, sin habilitar una nueva ni alterar el catálogo.

## Guardado, acceso y errores

Cada corrección guarda en una transacción los datos nuevos, historial privado, nuevas revisiones y autorización cuando corresponde. Incrementa revisiones de solicitud y alumno, de modo que las decisiones antiguas no sobrescriben una ficha corregida.

Se cierran todas las sesiones del alumno, incluidas sesiones locales de identidad Google; se invalidan recuperación e invitaciones anteriores. Se conserva su cuenta, contraseña, correo y vínculo estable de Google. Un login por contraseña iniciado antes de cambiar el expediente no puede revivir esa prueba anterior: compara de nuevo hash y revisión tras scrypt. Después puede acceder normalmente con su cuenta vigente. No se afecta el acceso de otros alumnos.

El alta de una corrección utiliza clave de envío y huella sin contraseña. Ante respuesta perdida, el borrador permanece sin la contraseña y se puede reintentar el mismo envío, sin duplicar cambios, historial, avisos o auditoría. No se reintenta automáticamente. Usar la misma clave con otros datos recibe conflicto. Una versión antigua recibe conflicto y conserva el borrador hasta que se decida cargar el expediente actual.

La reautenticación vuelve a comprobar sesión y credencial administrativa después de verificar la contraseña. Sesión caducada o cuenta revocada impide guardar. La ruta también revalida sesión después de leer el cuerpo HTTP. Motivo y confirmación son obligatorios; un envío sin cambios se rechaza, sin crear historial vacío.

## Datos y API

- Migración 12 aditiva: `student_record_changes` guarda expediente/actor, clave/huella, motivo, campos modificados, instantáneas antes/después y fecha. Incluye información personal privada y referencias; se protege como el expediente, también en las copias. No contiene contraseñas, hashes de credenciales ni vínculo Google/correo de acceso duplicado en las instantáneas.
- `GET /api/local/students/:id/record`: solo administración, para alumno aprobado existente. Devuelve valores actuales y últimas 20 correcciones; nunca forma parte de los perfiles públicos.
- `PATCH /api/local/students/:id/record`: campos permitidos, revisión, motivo, referencia de autorización si aplica, contraseña propia, confirmación y cabecera de idempotencia. No admite correo, estado, rol, grupo o identidad Google. Mantiene origen/JSON/tamaño y límite de 30 intentos por administrador en 15 minutos.
- La auditoría general guarda id de corrección, campos cambiados y totales de sesiones/historias, sin copiar datos personales o el motivo. Los detalles antes/después se guardan únicamente en la tabla privada del historial.
- El alumno recibe un aviso genérico de corrección sin datos personales; no se afirma envío de correo. La lectura del grupo conserva exclusivamente alias/avatar e historias autorizadas.
- Se creó respaldo previo de la base habitual. Las pruebas y la migración se ejecutaron en bases ficticias, sin migrar/restaurar el entorno habitual ni cambiar su contraseña. El verificador de copias admite esquemas 9–12 en modo de solo lectura. Respaldar antes del siguiente reinicio normal del servicio actualizado; un proceso anterior sin vigilancia no carga automáticamente los endpoints nuevos.

No se añadieron dependencias ni se alteraron políticas del sistema. Retención, custodia de evidencias e historial con datos reales se validan con CAI antes de producción.

## Archivos y comprobaciones

Servicio: `server/student-records.ts`, `app.ts`, `contracts.ts`, `database.ts`, `student-accounts.ts`, `verify-backup.ts`. Interfaz: `StudentDialog.tsx`, `StudentRecordEditor.tsx`, `useAdminConnection.ts`, `admin.module.css`, API existente. Pruebas: `student-records.test.ts`, `student-record-browser-server.ts`, `check-student-record.browser.mjs`; expectativas de esquema/fixtures históricas adaptadas en las suites anteriores.

- **Suite completa correcta: 134 resultados**, incluidos doce contenedores. Nuevos casos de permisos y privacidad, campos/origen/formato/tamaño, reautenticación/motivo/confirmación, idempotencia/historial, menor con nueva autorización, adulto↔menor, matrícula, alias/privacidad/publicaciones, Google/suspensión/invitaciones, grupo archivado, concurrencia, revocación durante verificación, login anterior, copia/reinicio, migración 11→12 y límite separado. Se añadió después una comprobación explícita del enlace de recuperación anterior; el recorrido específico se repitió completo y pasó **13/13** resultados. No hubo fallos intermedios de pruebas de esta entrega.
- **Brave 35 y Opera GX 35 comprobaciones completas** sobre compilación real y sesiones ficticias separadas. Editor en ficha original, cancelación, contraseña incorrecta, respuesta perdida/reintento único, bloqueo de doble envío, historial antes/después, conservación de identidad y permisos, nueva autorización de menor, adulto→menor, revisión de historias, conflicto con borrador conservado, carga explícita, sesión terminada y storage sin expediente/contraseña. Cero errores de ejecución JavaScript.
- Anchuras 1440/768/375/320 para adulto, menor e historial; sin desbordamientos en esos casos. Revisión visual adicional de ficha/editor en escritorio y tutor/referencia/efectos a 320 px, solo con datos ficticios y campos de contraseña vacíos. Consola de esa revisión sin errores/advertencias.
- Typecheck/lint/build y revisión de espacios correctos. Entrada ~239 KB sin aviso de chunk grande. Continúan las diez alertas moderadas de herramientas pendientes; no se cambió el lockfile.

## Repetir con datos ficticios

Compilar y usar dos consolas separadas:

```powershell
$env:CAI_API_PORT = '3101'
node server/tests/student-record-browser-server.ts
```

```powershell
$env:CAI_API_PORT = '3101'
npm.cmd run preview -- --host ::1 --port 4180 --strictPort
```

La fixture crea `.local/tests/student-record-browser-*` con cuentas, tutor, publicaciones y autorizaciones ficticios por navegador. Nunca abre la base habitual. `checkStudentRecord` recibe las identidades de `browser.json` y verifica la cuenta administrativa ficticia. No introducir datos reales, subir metadatos o usar contraseñas habituales. Para repetir desde cero, crear otra fixture sin borrar/reiniciar datos del usuario. Las consolas de prueba se detuvieron al terminar.

Siguiente: **punto 4, herramientas y alertas compatibles**, contrastando versiones y documentación actuales sin forzar cambios incompatibles. Después punto 5, revisión final. Correo/Google reales, cambio verificado de correo, responsables/contenidos/autorizaciones y alojamiento continúan en la tanda final. Criterio técnico contrastado: [permisos en cada operación de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html#validate-the-permissions-on-every-request); las comprobaciones concretas son las descritas, sin atribuir cumplimiento legal o garantía de producción.
