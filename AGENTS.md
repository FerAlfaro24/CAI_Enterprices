# CAI — instrucciones vigentes para agentes

## Antes de trabajar

1. Leer [START_HERE](docs/START_HERE.md), [PROJECT_STATE](docs/PROJECT_STATE.md), [BRANCHES](docs/BRANCHES.md) y [NEXT_STEPS](docs/NEXT_STEPS.md). Las instrucciones nuevas del usuario prevalecen. [DOCUMENTATION_INDEX](docs/DOCUMENTATION_INDEX.md) clasifica el resto.
2. Comprobar Git y cambios del usuario. Localizar componente/servicio existente, base y criterio de cierre antes de editar. No confundir un informe histórico con trabajo pendiente.
3. Continuación actual: `feat/v1-official-media`, desde `d410247` de `feat/v1-production-preparation`; código `cfea458`. Leer [OFFICIAL_MEDIA](docs/OFFICIAL_MEDIA.md): 4 imágenes públicas/6 de comunidad, audiencia de todos los alumnos aprobados autorizada, migración 17. 225 API y revisión manual en navegador integrado; Brave/Opera no disponibles en esta sesión. Resultados anteriores de 217 API/104 navegador y 193 API/1,314 corresponden a sus cortes y no se suman. Main antigua; v1.0/f3ba46b sigue como referencia visual.

## Alcance y prioridad

- Ya conectados: acceso/solicitudes/tutor, panel v1.0, alumnos/expediente, grupos/ajustes, publicaciones, imágenes privadas, comentarios/reacciones, perfiles, equipo, avisos/recuperación local, Retos e Insignias. No recrearlos ni sustituirlos por pantallas simplificadas.
- Retos: 180 preguntas/45 temas, tres al día según Ciudad de México, calendario/banco, respuesta única y progreso/repaso privado. Insignias: nueve, reglas reales, revisión/correcciones privadas, compartición voluntaria moderada. Ver informes especializados.
- Fotos oficiales ya integradas; las seis convivencias/cumpleaños son para todos los alumnos aprobados, también sin grupo. No convertirlas en recursos públicos ni ampliar la audiencia de imágenes antiguas. Repetir la carga no duplica ni restaura retiradas; conservar CAI_DATA_DIR/official-media (producción) o .local/official-media (local) en el backend privado. No pedir otra vez esta decisión ni sustituir personas reales con imágenes generadas.
- Vídeos son **opcionales y de menor prioridad**; no iniciarlos por un plan histórico. Si se retoman, coordinación sube y grupo autorizado ve. Repaso dirigido, analítica pedagógica, búsqueda ampliada y bienvenida siguen como propuestas sin implementación ni autorización automática.
- Priorizar trabajo autónomo autorizado. Agrupar Google/correo reales, material/permisos/validación y responsables de CAI al final; presupuesto/contratación después. Registrar dependencias sin inventar funciones para eludirlas.
- Modo local conservado. Producción requiere origen HTTPS canónico, proxy loopback que sobrescriba cabeceras, datos privados fuera del código y base esquema 17 ya preparada. Cookies __Host/Secure por aplicación; no relajar orígenes, red o confianza para superar una prueba. No presentarlo como desplegado o apto para alumnos reales antes de validar entorno/servicios/CAI.

## Desarrollo y seguridad

- Español claro; explicación breve antes de tareas complejas. Al cerrar: cambios/archivos, pruebas realizadas/no realizadas y pendientes.
- Usar React/TypeScript/Vite, CSS Modules, Tailwind y Node/SQLite existentes. No añadir dependencias innecesarias. Conservar identidad, arte, composición y componentes de v1.0; priorizar móvil y accesibilidad.
- Permisos en servidor, snapshots históricos, revisiones, idempotencia y revalidación de sesión tras operaciones asíncronas. La demo nunca sirve como autorización.
- **Pruebas solo con fixtures nuevas en `.local/tests`. Nunca abrir/migrar/borrar/cambiar `.local/cai.sqlite` o el acceso habitual para probar.** No leer credenciales personales ni usar sesiones personales.
- Caché web `node_modules/.vite-cai-web-${apiPort}`, separada de verificadores SSR. Ver [pantalla en blanco](docs/solucion-pantalla-blanca-local.md). Antes de dar un enlace comprobar renderizado; HTTP/health no bastan. No reiniciar la API habitual ni borrar cachés/datos implícitamente.
- Brave principal y Opera GX para compatibilidad, en contextos aislados. Revisar interacción, consola, 1440/768/375/320, teclado y temas cuando corresponda.
- Ejecutar checks existentes proporcionales al cambio. Resultados históricos no son pruebas nuevas. No repetir auditorías/matrices sin cambio relevante. Las alertas e intermitencias antiguas permanecen con sus límites hasta evidencia nueva.
- Revisión integral y base técnica autónoma de producción completadas con sus límites. Próximo trabajo: operación/recuperación N3, reutilizando copias existentes; no reconstruirlas ni repetir matrices completas sin motivo. Aceptación humana y alojamiento siguen para el final. La causa del error route.fulfill antiguo sigue sin confirmar.
- Configuración por instancia, sin mutar process.env en pruebas. Arranque productivo no crea/migra una base ausente/incompatible; bootstrap explícito solo para archivo nuevo. No usar local:setup/local:backup/google:setup en producción. El paquete backend conserva sus constantes de shared/src; servir públicamente solo dist, nunca la raíz del repositorio.

## Git y continuidad

- Ramas específicas, cambios revisables y respeto a modificaciones existentes. Muchas ramas son acumulativas: no fusionar cada feature de nuevo.
- Respetar autorizaciones de commits/push ya dadas. No fusionar PR, borrar ramas, cambiar main/release, publicar, contratar o ejecutar operaciones destructivas sin autorización específica. No reset/clean ni restauración implícita.
- Actualizar PROJECT_STATE (hechos), NEXT_STEPS (prioridades), BRANCHES si cambia base y guía especializada en la misma entrega. Registrar avances significativos durante sesiones largas.
- Nunca subir bases, accesos, secretos o datos de alumnos. Contraseñas de fixtures son ficticias; no convertirlas en credenciales reales.
- En cambios solo documentales, verificar enlaces, cobertura y diferencia de código. No ejecutar servidores/migraciones/tests de producto solo para adornar un informe Markdown.

## Recuperación del contexto

START_HERE orienta, PROJECT_STATE describe qué hay, NEXT_STEPS qué sigue y AGENTS cómo trabajar. [PROJECT_HISTORY](docs/PROJECT_HISTORY-2026-11-12.md) conserva íntegra la bitácora anterior, con estados superados y sin prioridad operativa. Ante contradicción, inspeccionar Git/código y corregir documentación antes de desarrollar.
