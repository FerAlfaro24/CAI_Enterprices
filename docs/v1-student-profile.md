# Perfil visible del alumno

Comprobado localmente en `feat/v1-student-profile`, desde `34b78b4` de cuenta administrativa. Puntos de retorno: `9388b2c` (servicio/pruebas) y `8490701` (interfaz/recorrido). Conserva la base visual oficial v1.0 y todas las integraciones acumulativas. No está desplegado ni habilitado para alumnos reales.

## Uso y alcance

En Community, abrir el botón de nombre/avatar **Mi espacio**, elegir **Editar mi perfil**, ajustar **Nombre visible** y **Color del avatar** y pulsar **Guardar mi perfil**. El nuevo nombre aparece también en las publicaciones anteriores y el directorio del mismo grupo. Cancelar descarta el borrador. La paleta es la misma del registro y se muestra una vista previa.

Para menores, el servidor calcula las dos abreviaturas permitidas a partir del expediente existente; la interfaz ofrece un selector, sin un campo libre. No se cambia la visibilidad ni se permite modificar correo, nombre legal, nacimiento, tutor, programa, grupo o rol. Para esos datos se remite a coordinación: su edición administrativa completa sigue pendiente.

La vista de otro miembro conserva únicamente alias/avatar, sin edición ni avisos privados. El UUID público permanece estable. No se agregan fotos de perfil, biografía, datos de contacto o permisos más amplios. No se inventa un consentimiento ni se habilitan comentarios/reacciones persistentes.

## Servicio y estados

- `GET /api/local/student/profile`: sesión de alumno vigente, devuelve únicamente nombre visible, color, revisión y opciones de nombre cuando corresponden. No devuelve nacimiento, tutor o identidad Google.
- `PATCH /api/local/student/profile`: admite exclusivamente `revision`, `displayName`, `avatarColor`; el propietario proviene de la sesión. Revalida la sesión después de leer el cuerpo. Mantiene origen/JSON/tamaño y limita a 30 intentos por alumno en 15 minutos.
- Nombre de 1–141 caracteres tras recortar extremos, sin controles ni caracteres invisibles de formato; color hexadecimal de seis cifras, normalizado. Menores solo pueden usar las abreviaturas del registro, con regla compartida en `validation.ts`.
- Transacción sobre el payload existente: actualiza solo nombre/color e incrementa revisiones de solicitud y alumno. Una acción administrativa preparada sobre la versión anterior recibe conflicto; no sobreescribe datos con una ficha antigua. No hay migración ni nueva dependencia.
- Auditoría `student.profile_updated` con referencia al alumno y fecha; sin copiar nombres, correos o expediente en el evento. Un envío sin cambios o un reintento idéntico de la versión inmediatamente anterior no vuelve a modificar ni duplica auditoría.
- Un borrador con revisión antigua no sobreescribe otro cambio. La interfaz conserva el borrador y ofrece **Cargar perfil actual y descartar borrador**, una acción explícita que vuelve al perfil leído del servidor.
- Si se pierde la respuesta, no se afirma que el cambio haya fallado o se haya guardado: se conserva el borrador y se permite reintentar o cargar. No se reenvía automáticamente. Una sesión terminada retira los datos privados y exige acceder otra vez.

Los datos personales siguen almacenados con el modelo local existente, en SQLite privado. Esta mejora no implica cifrado de base, identidad verificada ni preparación para producción. Una edición del alias afecta el nombre mostrado en historias anteriores; no cambia su autor ni audiencia. El registro histórico de solicitudes y los reintentos del formulario original siguen teniendo las reglas existentes; esta función no promete que se pueda volver a presentar una solicitud ya aprobada.

## Archivos

- Servicio: `server/public-profiles.ts`, `server/app.ts`, `server/contracts.ts`, `server/validation.ts`.
- Conexión: `src/features/local-access/api.ts`, `src/features/community/ConnectedCommunity.tsx`, `connection.ts`.
- Diálogo original y editor nuevo: `MemberProfileDialog.tsx`, `OwnProfileForm.tsx`, `community.module.css`.
- Paleta: `src/features/signup/profile-options.ts`, reexportada por `options.ts` sin traer los datos de muestra del registro al editor.
- Pruebas: `server/tests/student-profile.test.ts`, `student-profile-browser-server.ts`, `scripts/check-student-profile.browser.mjs`.

## Comprobaciones realizadas

- Suite de servidor: **93 resultados correctos**, incluidos nueve contenedores. Nuevos casos de permisos y respuesta mínima, origen/formato/tamaño, campos protegidos, texto/color, menores, conservación de expediente y otra cuenta, alias de publicaciones anteriores/directorio, UUID, reintento/auditoría, conflicto y revisiones administrativas, cuenta Google preparada con fixture, reinicio/esquema 9, sesión revocada durante cuerpo retrasado y límite separado por alumno.
- Compilación real: **36 comprobaciones completas en Brave y 36 en Opera GX**, con tres sesiones ficticias por navegador. Edición/cancelación, validación, envío bloqueado/doble envío, foco al cerrar, recarga, datos de otra sesión, vista ajena mínima, conflicto con borrador conservado, carga explícita, respuesta perdida después de guardar y fallo antes de enviar, reintento idéntico, selector de menor, tema oscuro, Escape y revocación.
- Anchuras 1440/768/375/320 con alias largo y perfiles de menor; sin desbordamientos en los casos comprobados. Inspección visual adicional de editor adulto en Brave a 1440 y 320 px. Cero errores de ejecución JavaScript en los recorridos; consola sin errores/advertencias en la revisión visual. Los fallos de red/409/401 provocados por las pruebas no se presentan como fallos inesperados.
- Typecheck, lint, build y `git diff --check` correctos. Entrada de compilación ~239 KB, sin aviso de chunk superior a 500 KB. No se cambiaron dependencias ni lockfile; continúan las diez alertas moderadas de herramientas ya documentadas.

El primer intento de navegador se interrumpió por un método inexistente del script (`isFocused`); se corrigió usando `document.activeElement`. Se repitió el recorrido completo con fixture nueva en Brave y luego Opera. Ese intento incompleto no se cuenta como aprobado.

## Repetir las pruebas aisladas

La fixture crea otra SQLite bajo `.local/tests/profile-browser-*`; no abre `.local/cai.sqlite`, no usa credenciales habituales y escribe metadatos de cuentas ficticias sin contraseñas. El recorrido verifica la identidad ficticia esperada antes de modificar perfiles. No se borran ni reinician bases habituales para repetirlo.

Después de compilar, iniciar consolas separadas:

```powershell
$env:CAI_API_PORT = '3101'
node server/tests/student-profile-browser-server.ts
```

```powershell
$env:CAI_API_PORT = '3101'
npm.cmd run preview -- --host ::1 --port 4180 --strictPort
```

Ejecutar `checkStudentProfile` del script con las identidades de `browser.json` para cada navegador y `http://localhost:4180`. Usa la frase ficticia de la fixture, nunca una contraseña real. Crear otra fixture si se desea repetir con identidades iniciales. Los procesos de esta verificación se detuvieron al terminar, dejando intactos los servicios habituales. Reiniciar normalmente el servicio de desarrollo para usar el backend actualizado; no asumir que un proceso antiguo sin vigilancia ya cargó el código nuevo.

## Pendientes siguientes

La recuperación administrativa posterior ya está comprobada con entrega ficticia: [alcance y correo real pendiente](v1-admin-recovery.md). Sigue gestión de otras cuentas en Configuración. Expediente completo, políticas de nombres/contenido y alcance de funciones secundarias requieren definición adicional. Google/correo reales, cuentas finales, contenido/autorizaciones, validación con CAI, presupuesto y alojamiento continúan agrupados al final.
