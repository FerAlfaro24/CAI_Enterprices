# CAI — respaldo y recuperación local

**22-11:** el esquema vigente es 20. La copia conserva prioridad, lectura y descarte del historial del alumno sin eliminar el aviso administrativo. El verificador acepta copias 9–20; migrar solo una copia aislada al ensayar recuperación. [Entrega y prueba de persistencia](COMMUNITY_FEEDBACK.md).

**Guía operativa al 17-11-2026**, contrastada con `server/backup.ts` y `server/verify-backup.ts`; no se ejecuta aquí contra datos del usuario. Para pruebas del agente, usar solo fixtures nuevas y copias separadas. [Inicio](START_HERE.md) · [Arranque](RUN_LOCAL.md) · [Pruebas](TESTING.md).

**Producción:** usar `production:backup` con configuración privada explícita; reutiliza el mismo mecanismo y guarda en CAI_DATA_DIR/backups, sin abrir .local como alternativa. `local:backup` se detiene en NODE_ENV=production. Ver [guía productiva](PRODUCTION_PREPARATION.md); la operación/recuperación del alojamiento real aún debe validarse.

## Qué se conserva

SQLite actual: esquema 16. La copia incluye expedientes/tutores, cuentas y hashes/sesiones, grupos/ajustes, publicaciones, imágenes y retiradas, avisos/contacto, comentarios/reacciones, respuestas/preguntas de retos, solicitudes/concesiones/correcciones de insignias y auditorías. Puntos/constancia se calculan desde respuestas; no dependen de storage del navegador.

Los datos y las copias son privados, aunque una prueba use personas ficticias. No subir `.local`, bases/WAL/SHM, credenciales o enlaces a GitHub. No se han añadido archivos de vídeo; si se implementan habrá que ampliar consistencia, copias y restauración a esos medios.

## Crear una copia: tarea del responsable de la instalación

Con permiso y desde el repositorio de la instalación correspondiente:

```powershell
npm.cmd run local:backup
```

El script usa el mecanismo de backup de SQLite y crea un archivo nuevo con fecha/identificador en `.local/backups`, incluso con WAL activo. Abre la base de origen en solo lectura para obtener la copia; no reemplaza la activa. No copiar únicamente el archivo principal mientras haya escrituras.

No ejecutar este comando contra la base habitual como parte de una prueba del agente. Las pruebas de código usan `backupLocalDatabase` sobre su fixture y un destino nuevo; no manipulan `.local/cai.sqlite`.

## Verificar una copia, sin restaurar

Sustituir el marcador por la ruta concreta de una **copia**, no por la base activa:

```powershell
npm.cmd run local:verify-backup -- "RUTA_DE_LA_COPIA.sqlite"
```

Admite esquemas **9–16** y abre en solo lectura; comprueba integridad de SQLite, relaciones, versión y decodificación/dimensiones/bytes de imágenes, y devuelve totales. No migra ni repara ni restaura el archivo. Rechaza la ruta habitual activa. Un archivo inexistente no crea una base nueva.

Los totales de ensayos antiguos no son valores esperados universales. Contrastar fecha y datos que se quería preservar. Integridad técnica no demuestra que se eligió el momento correcto de copia ni aceptación de producción.

## Ensayo separado

La suite API utiliza carpetas temporales bajo `.local/tests`, genera copias y arranca APIs aisladas con ellas. Los informes de módulos registran conservación de sesiones/estado, imágenes/retiradas, comentarios/reacciones, retos, insignias y vínculos moderados. Ver [evidencia](TESTING.md). No se reejecuta esa suite por esta auditoría Markdown.

```powershell
npm.cmd run test:api
```

Ejecutar desde una instalación preparada con permisos de localhost y datos ficticios. Es un ensayo aislado, no restauración productiva ni prueba de correo real.

## Recuperar una instalación: operación específica

1. Elegir copia y versión de código compatibles; comprobar/abrir primero en destino separado. `openDatabase` puede aplicar migraciones cuando se arranca la aplicación, a diferencia del verificador de solo lectura.
2. Acordar el punto de recuperación y los cambios posteriores que se perderían; preservar íntegro el estado actual, con WAL/SHM asociados.
3. Preparar ensayo aislado de acceso/grupos/medios y decisiones; revisar sesiones/suspensiones que hubieran cambiado después de la copia.
4. Solo con autorización del reemplazo concreto, detener el servicio y aplicar el procedimiento de mantenimiento acordado. No mezclar WAL de otra base ni sobrescribir archivos desde una orden genérica.
5. Volver a comprobar datos/permisos y conservar el estado previo para regreso. Reabrir al público requiere decisión propia, no ocurre como consecuencia automática de copiar.

No se proporciona un comando destructivo de restauración. No usar esta operación para deshacer una sola decisión administrativa si existe acción revisable en el panel. Custodia, retención, frecuencia, copias externas, supervisión y restauración en el proveedor contratado siguen pendientes de la entrega real.
