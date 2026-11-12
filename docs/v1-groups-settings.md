> Fotografía del bloque 5. Recuperación, avisos y contacto se integraron después: consultar `v1-inbox-recovery-contact.md` y el registro vigente de `PROJECT_STATE.md`.

# Grupos, asignaciones y ajustes mínimos conectados

Rama `feat/v1-groups-settings`, desde `9a5ef81` de `feat/v1-community-connected`. Conserva la interfaz oficial de `release/cai-demo-v1.0`. Puntos de retorno: `45900a2` (servidor) y `08ce05d` (interfaz y pruebas). Los commits de este bloque se identifican con `git log -- docs/v1-groups-settings.md`. Desarrollo local con datos ficticios; no es un despliegue de producción.

## Qué puede hacer el administrador

La página original `/admin/configuracion` permite crear un programa/grupo, archivar o reactivar sus grupos y pausar/reabrir nuevas solicitudes o publicaciones. El catálogo se guarda en SQLite y alimenta el registro y los selectores de la ficha. Los programas se obtienen de los grupos existentes; no se añadió una segunda gestión de programas.

Archivar oculta el grupo para nuevas selecciones en registro/asignación, sin borrar alumnos, solicitudes anteriores o historias ni expulsar a sus miembros actuales. Los expedientes ya recibidos siguen disponibles para revisión. No hay borrado o renombrado de grupos: los nombres forman parte de la audiencia histórica de las publicaciones. Para otro programa/horario se crea un grupo y se reasignan alumnos desde su ficha.

La ficha original permite elegir programa y grupo, o dejarlo Por asignar dentro de un programa activo. Antes de guardar se explica y confirma que el alumno deberá volver a entrar y que sus historias conservan el grupo de origen. Se mantienen cuenta, identidad pública, datos personales, consentimiento y estado activo/suspendido. El perfil del alumno sigue mostrando su inscripción actual, procedente del servidor; la ficha administrativa consolida su asignación, no es un editor del expediente legal.

## Privacidad al reasignar

La operación usa revisión del alumno y transacción. Actualiza la asignación, incrementa las revisiones del alumno y solicitud, revoca sesiones y enlaces de activación anteriores, registra auditoría y crea un aviso local. Los enlaces de recuperación no conceden sesión y conservan su validación habitual; no se cambian contraseñas ni identidades de Google.

Las publicaciones mantienen el programa/grupo de su envío. Las publicadas vuelven a pendientes y se elimina su fecha de publicación; las otras conservan estado y motivo, salvo el incremento de revisión para impedir decisiones obsoletas. Las retiradas siguen retiradas. El grupo anterior deja de ver las historias; el grupo nuevo no recibe publicaciones antiguas. Volver al grupo original tampoco las republica: hace falta revisión expresa. El historial del autor permanece consultable.

Sin grupo asignado no se habilita el editor y el servidor rechaza nuevos envíos. Suspender sigue siendo una acción independiente y no se revierte al reasignar.

## Controles reales y límites de Configuración

- Recibir nuevas solicitudes: se aplica al guardar en el servidor, tanto en registro por contraseña como en el formulario de Google. No cancela solicitudes anteriores ni sesiones.
- Recibir nuevas publicaciones: impide nuevos borradores en servidor y deshabilita el editor cuando Community actualiza sus datos. Conserva lectura, moderación y retiro. Reintentar exactamente un envío ya guardado conserva su resultado sin duplicarlo.
- Las reglas de tutor, expediente privado, alias y revisión permanecen protegidas. La configuración no ofrece ampliar permisos ni desactivar la moderación. Para adultos el alias aprobado puede contener su nombre; no se afirma que un interruptor esté ocultando todos los apellidos.
- Fotos, reacciones y comentarios muestran Pendiente y permanecen desactivados. No se permite guardar indicadores que aparenten habilitar funciones aún sin integrar.
- Equipo administrador muestra únicamente la cuenta de la sesión actual. Crear otras cuentas o gestionar sus roles permanece pendiente. La vista previa se identifica como ejemplo ficticio.

Community consulta los controles al actualizar y en su comprobación periódica de foco/visibilidad. El registro consulta el catálogo al abrirse o recuperar foco, y ofrece reintento ante un fallo; no usa el catálogo ficticio como sustitución si el servicio falla. El servidor vuelve a validar catálogo y pausas al escribir, por lo que una pantalla desactualizada no elude las reglas. Las actualizaciones no son instantáneas entre ventanas.

## Persistencia y componentes

Migración 7 aditiva: `course_groups`, `community_controls` y `administration_audit`. Respaldo SQLite consistente antes de migrar. La semilla conserva los programas/grupos de prueba anteriores y las asignaciones ya guardadas; no se modifica el contenido de expedientes históricos no interpretables. Los datos ficticios iniciales no se dan por catálogo final de CAI.

Servicios: `server/administration.ts`, `access-repository.ts`, `publications.ts`, `app.ts`, `validation.ts`, contratos y migración. Endpoints: catálogo público mínimo; configuración/grupos/asignaciones solo con sesión administrativa. Las revisiones de ajustes, grupos y alumnos evitan sobrescribir cambios de otra ventana. Auditoría y mutación se confirman juntas.

Interfaz reutilizada: `AdminSettingsPage`, `StudentDialog`, `Switch`, estilos del panel, `SignupForm`, inscripción local y Community. Adaptaciones separadas en `CatalogSettings`, `StudentAssignment`, `usePublicCatalog` y la conexión administrativa existente. No se añadieron dependencias ni otra administración paralela.

## Pruebas realizadas

- `npm run test:api`: 56 resultados correctos, incluidos cinco contenedores. Pruebas nuevas de autorización, contrato público mínimo, alta/duplicados/archivo/reactivación, catálogo real en solicitudes, pausas y campos protegidos, revisiones obsoletas, confirmación, revocación, identidad estable, audiencia histórica al cambiar/volver y persistencia tras reiniciar. Incluye las regresiones anteriores de acceso, menores, Google controlado, publicaciones y recuperación.
- `check-groups-settings.browser.mjs`: 27 comprobaciones en Brave y 27 en Opera GX. Administrador y tres alumnos en contextos separados; alta desde Configuración, solicitud desde el registro original, pausas/reapertura, archivo sin perder acceso, reasignación desde ficha, nuevo login, separación de historias y vuelta sin republicación. Restaura los controles globales originales incluso si falla una aserción; conserva los datos de prueba.
- Configuración y ficha a 1440, 768, 375 y 320 px en ambos navegadores. Cero errores de ejecución JavaScript en los recorridos completos. Capturas inspeccionadas en Brave: Configuración de escritorio, catálogo móvil y ficha móvil.
- Comprobación adicional Brave: conflicto de configuración provocado como otra ventana, aviso visible y actualización al valor guardado en servidor; se restauraron después los controles. Fallo de red del catálogo: aviso/reintento y ausencia de formulario ficticio de sustitución.
- Lint, typecheck, build y comprobación de espacios de Git correctos. Continúa el aviso conocido de paquete principal grande (~684 KB minificado).
- Los intentos iniciales detectaron importación incompatible con Node, supuesto de JSON válido en una prueba histórica, etiquetas de selectores que incluían opciones y desbordamiento móvil con programa largo. Se corrigieron las causas; se repitieron pruebas y ambos recorridos completos. Los intentos incompletos no se cuentan como aprobados.

## Qué sigue pendiente

Siguiente bloque: recuperación y avisos dentro de los accesos/panel oficiales, y contacto institucional guardado y atendible. Reutilizar los servicios y las pantallas existentes. Después: archivos privados/imágenes, consolidación de rutas y estabilización según `PROJECT_STATE.md`.

No incluye edición de nombre legal/edad/consentimiento, editor personal de alias, gestión de otros administradores, borrado/renombrado de grupos ni funciones educativas nuevas. Esos cambios no se introducen implícitamente. CAI debe validar programas, horarios, contenido y uso de la administración. Google real, entrega de correo, presupuesto y alojamiento siguen reservados para la tanda final. No se desplegó ni se fusionó la rama a la base oficial.
