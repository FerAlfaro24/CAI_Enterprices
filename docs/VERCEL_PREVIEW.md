# CAI — revisión de Vercel, 25-11-2026

## Resultado comprobado

La vista previa automática de `integration/cai-v1-completa-2026-11-25`, commit `04bb0df`, sirve el frontend integrado. El enlace normal redirige al acceso de Vercel; el enlace compartido por el titular permitió abrir la portada en Brave aislado sin iniciar sesión en Vercel. No guardar el parámetro privado de compartición en este documento ni en Git.

En esa vista previa, abrir directamente `/login`, `/registro` y `/community` devolvió HTTP404. La navegación interna a comunidad mostró «No pudimos actualizar tu comunidad» y «El servicio local no está disponible». `/api/local/health` y `/api/local/catalog` devolvieron HTTP404. La portada anterior de producción también responde, pero su API devuelve404.

## Corrección preparada

Rama `fix/v1-vercel-navigation`, desde la integrada `04bb0df`:

- `vercel.json` establece Vite, build y carpeta dist, y envía las15 rutas/raíces de navegación del router a index.html para las entradas directas y recargas. No captura `/api/*` ni recursos inexistentes: no convertir un fallo del servicio en una respuesta HTML200.
- `.vercelignore` excluye archivos privados/locales y resultados de pruebas de futuras cargas por CLI. Los despliegues desde GitHub siguen sin incorporar archivos ignorados/no versionados.

Esta corrección permite cargar las pantallas del frontend. **No despliega el backend, no habilita cuentas o correos y no transforma la comunidad conectada en una demo ficticia.** No exponer fotos privadas en dist para compensar la ausencia de API.

## Comprobaciones y límites

- Antes de editar: portada y error de comunidad observados en Brave aislado sobre la vista previa compartida; entradas directas y API comprobadas por HTTP.
- Después de editar: JSON leído correctamente; `npm.cmd run build` terminó con tipos y compilación correctos; `git diff --check` correcto.
- Falta validar las reescrituras en el despliegue nuevo de Vercel. No se ejecutaron de nuevo las pruebas de backend: no hay cambios de servidor, permisos, base o interfaz.
- Datos habituales y copias anteriores sin abrir/migrar; sin cambios de main/release, contratación, credenciales ni protección de Vercel.

## Pendiente para una presentación sin computadora

El usuario solicita una presentación de un día y solo opciones gratuitas. Está pendiente confirmar si basta una muestra interactiva con datos ficticios independientes por navegador o necesita operaciones reales entre dispositivos. Una demo ficticia debe identificarse como tal y conservar por separado la versión conectada. No restaurar sin más la demo histórica: sus formularios y Retos no representan todos los avances F1–F6.

La alternativa real requiere alojamiento del backend y almacenamiento compatible con la base actual, además de configurar/probar Google y correo en el origen publicado. Las Functions estándar de Vercel no conservan una base SQLite local entre instancias. No prometer que una vista previa de frontend equivale al sistema completo.

Fuentes: [reescrituras](https://vercel.com/docs/routing/rewrites), [enlaces compartidos](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links), [almacenamiento de Functions](https://vercel.com/docs/functions/runtimes).
