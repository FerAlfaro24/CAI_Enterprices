# Backend local: solicitudes y alumnos

## Alcance

Primer bloque del [plan de tres semanas](local-delivery-plan.md), en `feat/local-access-backend`. La revisión guiada aprobada permanece en `feat/admin-guided-requests`.

Incluye acceso administrativo, guardado de solicitudes, confirmación documentada de tutor, aprobación/rechazo/devolución, directorio y estado de alumnos. Solo usar datos ficticios. La siguiente rama añade [activación y permisos de alumnos](student-accounts.md): aprobar permite preparar un enlace desde Alumnos, y suspender revoca sesiones/enlaces del área protegida. Community y la demo pública siguen separadas. Faltan recuperación, correo e integración de publicaciones.

La demo anterior conserva sus datos ficticios en memoria. No se mezclan con la base local. No se contrata ni publica ningún servicio.

## Arranque en Windows

Requiere Node.js 24.12 o posterior y npm 10+. No se añadieron dependencias: se usan HTTP, SQLite, criptografía y soporte TypeScript de Node, con comprobación independiente de tipos.

```powershell
npm.cmd ci
npm.cmd run local:setup
npm.cmd run dev:local
```

La preparación crea un administrador con contraseña aleatoria, cuyos datos iniciales están en `.local/acceso-inicial.txt`. Ese archivo es privado, contiene la contraseña inicial en texto para poder entrar y está excluido de Git. No debe compartirse ni usarse en producción. La base solo guarda el hash. Si la cuenta existe, la preparación no sobrescribe cuenta ni base.

`dev:local` inicia frontend y API. Ctrl+C detiene ambos. El puerto 5173 debe estar libre. El frontend tiene recarga automática; los cambios del servidor requieren reiniciar el comando. `npm.cmd run dev:api` permite arrancar solo la API.

| Ruta en `http://127.0.0.1:5173` | Uso |
| --- | --- |
| `/registro-local` | Enviar solicitud ficticia persistente; no pide contraseña de alumno. |
| `/gestion` | Acceso administrativo y resumen de pendientes. |
| `/gestion/solicitudes` | Buscar, revisar, registrar tutor y decidir. |
| `/gestion/alumnos` | Directorio guardado, suspensión y reactivación del registro. |
| `/activar#token=…` | Enlace privado de un solo uso preparado por coordinación. |
| `/alumnos` | Acceso, perfil propio y nombres visibles del mismo grupo. |
| `/admin` | Panel de demostración anterior, sin persistencia. |

La API escucha solo en `127.0.0.1:3100`. Vite reenvía `/api/local`. El origen local en el puerto 4180 está permitido para revisar la compilación. `NODE_ENV=production` impide arrancar este servidor, limitado deliberadamente a pruebas locales.

## Datos y reglas

La migración 1 crea `admin_users`, `sessions`, `requests`, `consent_confirmations`, `students` y `audit_log`. Hay relaciones, estados válidos e índices únicos. El expediente validado se guarda en JSON; correo, estado, revisión, decisiones y relaciones tienen columnas/tablas propias. No es aún el modelo académico completo.

- El servidor asigna folio, fecha y estado pendiente. Rechaza campos extra, como contraseñas o estados enviados por el navegador.
- Valida fechas reales, edad, persona que llena, correo, programa y grupo. El catálogo sigue siendo ficticio, compartido con la demo; falta validarlo con CAI y hacerlo administrable.
- Una clave de idempotencia permite reintentar sin duplicar. No admite otro registro pendiente o aprobado con el mismo correo.
- Un menor debe tener perfil privado y nombre abreviado. La casilla del solicitante no verifica al tutor: coordinación debe confirmar y registrar una referencia antes de aprobar.
- Aprobar y añadir al directorio es una transacción. La revisión numérica detecta datos antiguos de otra ventana y evita decisiones duplicadas.
- Deshacer devuelve a pendiente y retira del directorio. Revisar esta regla cuando existan cuentas y contenido de alumnos.
- La auditoría registra actor, acción, solicitud y fecha. La referencia de autorización permanece privada.

## Acceso

Contraseñas con scrypt y sal aleatoria, comparación de tiempo constante; sesiones aleatorias con hash en base, caducidad de ocho horas y revocación al salir. Cookie HttpOnly y SameSite=Strict; no hay tokens en localStorage. No se usa Secure porque esta etapa funciona sobre HTTP local: HTTPS y la configuración productiva quedan pendientes.

Lecturas privadas y decisiones comprueban sesión administrativa en cada operación. Se restringen Host/origen a localhost, se requieren JSON y cuerpos limitados, se limitan intentos y se usan consultas parametrizadas. No hay CORS abierto. No equivale a una auditoría de seguridad completa ni a permisos reales de alumnos/grupos.

## Respaldo

Base, credenciales, WAL/SHM, pruebas y copias viven bajo `.local/`, excluida de Git.

```powershell
npm.cmd run local:backup
```

Usa la copia consistente de SQLite y crea un archivo nuevo en `.local/backups/`, incluso con la base abierta. No sobrescribe la base utilizada por el servicio. Las copias incluyen datos privados y hashes de sesiones; no subirlas al repositorio. La prueba automatizada abre una copia y comprueba solicitudes, alumnos, estados y consentimiento. Para restaurar sobre la base en uso: detener el servicio, preservar el original y aprobar la operación específica. No copiar solo el archivo principal mientras hay escrituras WAL.

SQLite permite avanzar sin instalar PostgreSQL ni Docker, ausentes en el equipo. Un despliegue posterior puede usar un proceso Node con disco persistente y respaldos. Si se elige PostgreSQL/Supabase habrá que portar el repositorio SQL, migrar y repetir pruebas; no es automático. El contrato HTTP mantiene esa decisión separada de las pantallas.

## Archivos y pruebas

- `server/`: contratos, validación, migración, repositorio, autenticación, HTTP, preparación, arranque y respaldo.
- `server/tests/access.test.ts`: acceso, validación, reintentos, tutor, revisión simultánea, persistencia tras reinicio, revocación y copia.
- `src/features/local-access/`: cliente HTTP, acceso, panel, listas y detalle.
- `SignupForm.tsx`, `SignupPage.tsx`, `RequestReview.tsx` y estilos: variante local conservando la demo.
- `src/app/router.tsx`, `vite.config.ts`, `scripts/dev-local.mjs`, `package.json`, lockfile, TypeScript/ESLint y `.gitignore`.
- `scripts/check-local-access.browser.mjs`: recorrido de adulto y menor, guardado, autorización, suspensión, sesión y cuatro tamaños de pantalla. Las credenciales se pasan como argumentos y no se guardan en el archivo.

Comandos: `npm.cmd run test:api`, `npm.cmd run lint`, `npm.cmd run build`. Las pruebas HTTP requieren conexión a localhost. Crean una base temporal en `.local/tests` y solo limpian el directorio aleatorio de esa prueba.

## Validación de este bloque

Lint, typecheck y build correctos. Permanece el aviso conocido del bundle principal superior a 500 kB. `test:api`: once pruebas correctas (prueba contenedora y diez casos), incluyendo reapertura de la base, consulta de un respaldo, rechazo de formatos/orígenes no admitidos y límite de intentos de acceso.

El recorrido local pasó 29 comprobaciones en Brave y 29 en Opera GX, con 16 combinaciones de cuatro rutas y cuatro anchuras por navegador. La regresión de la demo anterior pasó 77 comprobaciones por navegador y las cinco pruebas de modelo de Community permanecen correctas. Se verificaron además fallos de conexión, reintento y sesión vencida en Brave; diálogos estrechos y capturas de escritorio/móvil. No se probaron dispositivos físicos, Safari, Firefox ni lectores de pantalla, y no hay prueba de carga ni auditoría de seguridad independiente.

## Siguiente bloque

La activación, el acceso de alumnos y su suspensión efectiva se detallan en [el bloque de cuentas](student-accounts.md). Siguen pendientes recuperación, correo, integración con Community y moderación. Antes de admitir datos reales faltan contenido aprobado, privacidad, procedimiento verificable de tutor y revisión productiva.
