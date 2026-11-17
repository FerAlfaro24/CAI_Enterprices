# Revisión integral local — 17 de noviembre de 2026

**Resultado técnico local: aprobado en la matriz final. Aceptación humana y producción pendientes.** Rama `test/v1-integral-review-2026-11-17`, base documental `b55cd50` y punto de retorno de pruebas `8c515de`. El código de aplicación corresponde a `3971284`; esta entrega solo cambia pruebas y documentación. No sustituye componentes ni reconstruye módulos.

## Alcance y aislamiento

Aplicación compilada en `http://127.0.0.1:4180`, API de fixtures en 127.0.0.1:3181, Brave principal y Opera GX para compatibilidad. Cada recorrido/navegador comenzó con una fixture nueva de `server/tests/*-browser-server.ts` bajo `.local/tests`, sin reutilizar la actividad de otra prueba. Contextos de navegador separados; buzón ficticio separado para recuperación administrativa.

No se abrió, migró, leyó o modificó la base/acceso habitual; no se usaron sesiones personales ni datos reales. La carpeta habitual siguió en `fix/v1-dev-preview-cache`, sin cambios. Los procesos de prueba y pestañas propias se cerraron al terminar; no se detuvieron los servicios habituales.

## Matriz final de navegador

| Recorrido | Brave | Opera GX | Qué comprueba |
| --- | ---: | ---: | --- |
| Ingreso y dashboard | 30 | 30 | Solicitud, aprobación, activación, acceso, suspensión y rutas protegidas. |
| Comunidad y moderación | 39 | 39 | Publicaciones, decisiones, retirada, grupos y sesiones. |
| Grupos y configuración | 27 | 27 | Catálogo, asignación, archivo/reactivación y pausas persistentes. |
| Contacto, avisos y recuperación del alumno | 37 | 37 | Seguimiento, bandejas propias y recuperación local. |
| Galería privada | 37 | 37 | Subida ficticia, permisos por grupo, retirada y errores. |
| Navegación unificada | 45 | 45 | Rutas oficiales, redirecciones, sesiones y página no encontrada. |
| Estabilización | 25 | 25 | Carga diferida, fallos de módulos/servicio, recuperación y permisos. |
| Contraseña administrativa | 29 | 29 | Cambio, revocación de sesiones, otras cuentas y respuestas perdidas. |
| Recuperación administrativa | 45 | 45 | Buzón ficticio, enlace de un uso, revocación y errores simulados. |
| Equipo administrador | 37 | 37 | Invitación, activación, desactivación/reactivación y protección del acceso. |
| Perfil del alumno | 36 | 36 | Alias/color, menores, conflictos y errores sin perder borrador. |
| Expediente | 35 | 35 | Reautenticación, tutor, historial, revocación y conflictos. |
| Reacciones | 28 | 28 | Selección, contadores, revisión antigua, reintento, pausas, grupos y teclado. |
| Comentarios | 47 | 47 | Premoderación, paginación, motivos privados, retirada y pausas. |
| Retos funcionales | 53 | 53 | Progreso, calendario/banco, respuestas únicas, permisos, errores y repaso. |
| Retos visuales/teclado | 18 | 18 | Selector antes de pregunta, controles sin recortes y teclado. |
| Insignias funcionales | 46 | 46 | Reglas reales, solicitudes, decisiones, historial, correcciones y compartición moderada. |
| Insignias visuales/teclado | 18 | 18 | Colección, pestañas, textos largos, diálogos y teclado. |
| **Menor nuevo: recorrido transversal** | **25** | **25** | Tutor → autorización comprobada → aprobación → activación → tres retos → primera insignia → compartir en revisión → suspensión. |
| **Total** | **657** | **657** | **38 recorridos completos y 1,314 comprobaciones.** |

Se toma el último resultado completo de cada recorrido/navegador; no se suman repeticiones ni intentos interrumpidos. Los módulos se probaron sobre la aplicación actual, incluidos comentarios/reacciones/retos/insignias, no solo sobre sus demos. Según la vista, los scripts recorren 1440/768/375/320 px, temas claro/oscuro, teclado, conflictos y pérdida de respuestas. No se registraron errores JavaScript inesperados en las ejecuciones finales; los fallos de red y rechazos provocados no equivalen a una consola limpia durante toda la simulación.

## Otras comprobaciones nuevas

- `npm.cmd ci --no-audit --no-fund`: instalación reproducible en la carpeta aislada, sin cambios de versiones. Se registró un aviso de deprecación de node-domexception; no se investigaron ni actualizaron dependencias en esta tarea.
- `npm.cmd run test:api`: **193 aprobadas**, cero fallos/canceladas/omitidas. La primera ejecución restringida encontró conexiones localhost bloqueadas con EACCES; se repitió permitiendo esas conexiones, sin modificar pruebas o aplicación para hacerlas pasar.
- `npm.cmd run build` correcto, incluida comprobación de tipos. `npm.cmd run lint` correcto, repetido después de los cambios de pruebas. Sintaxis de los cuatro scripts modificados y `git diff --check` correctos.
- Modelos existentes: Community 29 +4 igualdades; publicaciones 23; retos 27 +1 igualdad; logros 51 +4 igualdades; galería 25 +4 igualdades. **155 comprobaciones y 13 comparaciones de igualdad**, sin convertir demos en evidencia de persistencia.
- **13 rutas privadas con 403**, mediante HEAD sin cookies sobre archivos ficticios existentes, banco de retos y metadatos Git. No se descargaron bases, credenciales o respuestas privadas.
- Inspección de nombres de archivos de `dist`: sin SQLite/DB/WAL/SHM, accesos iniciales, .env, certificados ni carpetas .local/.git. No es una auditoría completa del contenido ni un despliegue.

## Inspección visual

Se abrieron y revisaron capturas de panel a 320/1440 px, portada a 375 px, ficha del tutor a 320 px, retos de escritorio e insignias en oscuro a 320 px. La ficha permite desplazamiento vertical; no se recortan horizontalmente los valores. Se conserva identidad/composición; no fue necesario cambiar CSS.

Inspección adicional de portada/panel en Brave a 1440/375/320 px: seis vistas sin desbordamiento horizontal ni errores JavaScript. Tras desplazar la portada para cargar imágenes diferidas, **13 imágenes cargadas**, nueve externas y cuatro locales, en esa sesión. Resuelve la observación de carga incompleta de la revisión antigua para esta inspección; no garantiza disponibilidad futura de terceros ni valida fotografías/material final de CAI. Se comprobó también que localhost:4180 renderiza con la vista enlazada a loopback.

## Hallazgos y cambios de pruebas

1. **Dependencia oculta en la inspección de insignias.** El primer intento en Brave buscaba movie-explorer, concedida por otro recorrido anterior, y falló en una fixture nueva. Se usa ahora first-answer activa, que la fixture obtiene de progreso real, con error explícito si falta. No se eliminan las comprobaciones visuales ni se fabrican concesiones. Repetición completa: 18 por navegador.
2. **Sincronización de reacciones.** Un intento en Opera terminó con `route.fulfill: Route is already handled!` durante la simulación de red. Otra fixture pasó antes de modificar el script. Se detectó además una espera imprecisa que examinaba el primer botón deshabilitado de toda la página; ahora espera la respuesta del feed y su renderizado, como el recorrido de Community. Después pasó completo en Brave/Opera, 28 cada uno. **La causa exacta del error inicial de enrutamiento sigue sin confirmarse; no atribuir una reparación de aplicación al reintento ni dar por eliminada toda intermitencia.**
3. **Verificación privada reproducible sin datos habituales.** En el worktree nuevo, rutas habituales inexistentes devolvieron 200 HTML con el mismo ETag que la portada. El modo original de check-private-paths se detuvo; eso no demostró una fuga ni trece bloqueos. Se añade modo CAI_TEST_FIXTURE_DIR, limitado a `.local/tests`, que exige fixture.sqlite/browser.json existentes, adapta Git a archivo de worktree o directorio y conserva la aserción estricta 403. La repetición aprobó trece rutas sin descargar cuerpos. El modo original no cambia.
4. **Cobertura transversal nueva.** check-student-full-journey recorre un menor de once años desde cero: no puede enviar como alumno, requiere tutor/autorización, no puede elegir nombre completo o visibilidad ampliada, coordinación confirma antes de aprobar, activa contraseña, responde tres preguntas, recibe una sola insignia persistente y comparte únicamente a revisión. Suspender revoca su sesión. 25 comprobaciones por navegador.

Los dos intentos de Opera interrumpidos de la revisión antigua —Community y recuperación administrativa— no se reprodujeron en esta tanda. Su causa anterior tampoco queda diagnosticada por ello. Conservar el diagnóstico si reaparecen.

Archivos de pruebas: `scripts/check-student-full-journey.browser.mjs`, `scripts/check-connected-badges-visual.browser.mjs`, `scripts/check-connected-reactions.browser.mjs`, `scripts/check-private-paths.mjs`. Sin cambios de src/server/shared/configuración/dependencias.

## Repetir y conservar evidencia

Seguir [TESTING](TESTING.md) y [RUN_LOCAL](RUN_LOCAL.md). Compilar la rama y ejecutar preview con CAI_API_PORT=3181 en 4180. Iniciar el `*-browser-server.ts` indicado por cada recorrido con ese mismo puerto; crear otra fixture por recorrido/navegador. Pasar su metadata ficticia, browserLabel, baseURL y, cuando proceda, screenshotDir/fixturePath/assets/buzón según la firma del script. Son funciones de navegador, no programas Node autónomos.

Para el recorrido transversal nuevo, usar final-review-browser-server.ts; su metadata proporciona email y la contraseña ficticia está en la fuente. No utilizar cuentas habituales. Para las rutas privadas, con Vite de desarrollo en 5174 y una fixture nueva ya creada:

```powershell
$env:CAI_TEST_URL = 'http://127.0.0.1:5174'
$env:CAI_TEST_FIXTURE_DIR = '.local/tests/NOMBRE-DE-LA-FIXTURE'
node scripts/check-private-paths.mjs
```

Sustituir NOMBRE-DE-LA-FIXTURE por la carpeta ficticia recién creada; el verificador exige fixture.sqlite y browser.json. No crear esos archivos en la raíz .local ni preparar la base habitual para esta prueba. No cambiar puertos/orígenes del producto para admitir una prueba.

Resultados detallados, intentos, metadatos y capturas de esta sesión se conservaron localmente bajo `.local/tests/integral-review` y las carpetas de fixtures. Son material ignorado, **no enlaces recuperables tras clonar**, y no se suben por contener datos/metadatos de prueba. Este informe y los scripts versionados conservan alcance, resultados y forma de repetirlos.

## Límites y siguiente paso

No se probaron Google real, recepción real de correo, infraestructura/HTTPS productivos, volumen real, dispositivos físicos ni uso con personas reales. No se repitió la auditoría de dependencias: los diez avisos moderados anteriores no se dan por resueltos. No se fusionaron PRs, cambiaron main/release, publicaron servicios o añadieron vídeos.

La revisión técnica integral acordada queda completada localmente. La facilidad de uso debe validarse también con quien administrará CAI en la tanda final. Próximo trabajo autónomo: **preparación técnica de producción**, con presupuesto/contratación y configuración externa al final. No repetir esta matriz completa sin cambios o hallazgos que lo justifiquen. Ver [NEXT_STEPS](NEXT_STEPS.md).
