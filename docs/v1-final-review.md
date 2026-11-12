# Revisión final local de CAI, punto 5

> Decisión posterior a esta revisión: el usuario incluyó comentarios, reacciones, retos, insignias y vídeos en la entrega final; solo coordinación sube vídeos. Ver [comunidad ampliada](v1-community-expansion.md). Las exclusiones y el siguiente paso de este informe describen el alcance anterior; sus resultados de pruebas siguen siendo evidencia de ese código, no de funciones nuevas.

**Revisión técnica realizada; aceptación de CAI y preparación de producción pendientes.** Rama `chore/v1-final-review`, base `9274dc9`, punto de retorno de código `940573a`. Conserva la interfaz oficial de `release/cai-demo-v1.0` (`f3ba46b`) y los avances acumulados hasta expediente `c712abb`. No se fusionaron ramas ni se publicó el sitio.

La revisión usa los componentes originales y sus recorridos existentes. No demuestra funcionamiento con usuarios reales ni sustituye una sesión con quien administrará CAI. La base y las credenciales habituales no se abrieron, migraron ni modificaron durante las pruebas; los cambios de acceso se hicieron únicamente en cuentas ficticias.

## Resultado por recorrido

Compilación real en `http://localhost:4180`, Brave como navegador principal y Opera GX para compatibilidad. Contextos de automatización separados y bases nuevas bajo `.local/tests`.

| Recorrido existente | Brave | Opera GX | Alcance comprobado |
| --- | ---: | ---: | --- |
| Acceso y dashboard oficial | 30 | 30 | Solicitud, revisión, activación, acceso, suspensión y rutas protegidas. |
| Community y moderación | 39 | 39 | Publicación, decisiones compartidas, retiro, grupos y sesiones. |
| Grupos y configuración | 27 | 27 | Catálogo, asignación, archivo/reactivación y pausas efectivas. |
| Contacto, bandejas y recuperación de alumno | 37 | 37 | Consulta persistente, seguimiento, avisos propios y recuperación local. |
| Galería privada | 37 | 37 | Imagen sintética, subida, permisos por grupo, retirada y errores. |
| Navegación unificada | 45 | 45 | Destinos oficiales, redirecciones antiguas, sesiones y 404. |
| Estabilización | 25 | 25 | Carga diferida, fallos de módulo/servicio, recuperación y permisos. |
| Contraseña administrativa propia | 29 | 29 | Cambio, revocación, otras cuentas y resultado incierto. |
| Recuperación administrativa | 45 | 45 | Buzón ficticio, enlace de un uso, revocación y respuestas perdidas/ilegibles. |
| Equipo administrador | 37 | 37 | Alta, invitación, activación, desactivación/reactivación y protección del acceso. |
| Perfil del alumno | 36 | 36 | Alias/color, privacidad de menores, conflictos y errores. |
| Correcciones del expediente | 35 | 35 | Reautenticación, tutor, historial, revocación y conflictos sin perder borrador. |
| **Total de la matriz** | **422** | **422** | **24 recorridos completos y 844 comprobaciones.** |

No se suman intentos interrumpidos ni repeticiones a ese total. Los recorridos incluyen comprobaciones a 1440, 768, 375 y 320 px según sus vistas, permisos entre cuentas y errores de ejecución JavaScript; las ejecuciones completas no registraron errores JavaScript inesperados. Las fallas de red y rechazos provocados deliberadamente no equivalen a una consola limpia durante toda la simulación.

Después del ajuste de CSS descrito abajo se recompiló y se repitieron completos acceso/dashboard (30 por navegador) y expediente (35 por navegador). Los demás recorridos se ejecutaron antes de ese ajuste exclusivamente visual. La matriz mantiene el último resultado de cada recorrido y navegador.

## Otras comprobaciones realizadas

- `npm.cmd run test:api`: **134 resultados correctos, cero fallos, cancelados u omitidos**. Incluye permisos, revisiones, reintentos, concurrencia, migraciones, reinicio y ensayo de recuperación sobre bases/copias ficticias. No fue una restauración de la base habitual.
- Modelos de Community, publicaciones, retos, logros y galería: **29/23/27/51/25 comprobaciones**, respectivamente, más **13 comparaciones de igualdad**. Probar reglas de retos/logros no los convierte en funciones persistentes.
- `npm.cmd run lint`, tipos y compilación correctos. Se repitieron lint y build después del ajuste móvil; entrada ~239.55 KB, sin aviso de fragmento grande. No se instalaron dependencias ni se cambió el archivo de versiones.
- Sintaxis de los dos recorridos modificados y `git diff --check` correctos.
- Desarrollo: las **siete rutas privadas** del verificador devolvieron 403 mediante HEAD sin cookies, sin descargar bases ni credenciales.
- Vista compilada: el mismo verificador se detuvo porque esperaba 403 y obtuvo 200. Se compararon cabeceras HEAD de seis rutas con la portada: mismo ETag y tipo `text/html`, coherentes con el fallback de navegación de Vite. No se descargó su contenido ni se demostró una fuga. La inspección de `dist` no encontró SQLite/WAL/SHM, archivos de acceso inicial, .env, certificados o carpetas .local/.git. **No afirmar que preview devolvió siete bloqueos 403**; el verificador original corresponde al servidor de desarrollo.
- Se mantiene la auditoría del punto 4: cero avisos en dependencias de ejecución y diez moderados en herramientas. No se repitió su investigación al no cambiar versiones. Ver [evidencia y criterio de cierre](v1-tooling-audit.md).

## Hallazgos y cambios

**Lectura de fichas en móvil.** A 320 px, la columna automática de etiquetas dejaba poco espacio para los valores y partía palabras como “activada”. Se reutilizó `.details` de los diálogos administrativos: hasta 560 px, cada etiqueta queda encima de su valor. Escritorio conserva dos columnas, colores y tipografía. Inspección posterior de ficha a 320/1440 px y solicitud a 320 px: valores legibles, sin desbordamiento del diálogo y sin errores/advertencias en la consola de esas inspecciones.

También se inspeccionaron portada y panel a 1440 px y registro/portada a 375 px. **Las fotografías externas de Unsplash no terminaron de cargar durante la inspección**; su disponibilidad y aspecto final quedan sin comprobar. No se atribuyó una causa ni se sustituyó material sin decisión de CAI. Validar las imágenes definitivas y su forma de servirlas en la entrega.

**Dos intentos automáticos incompletos en Opera.** Community se detuvo tras 28 comprobaciones esperando revisar una publicación móvil. La consulta de solo lectura en su base ficticia confirmó que estaba pendiente y guardada; no identificó la causa de la espera. Recuperación administrativa se detuvo tras 39 esperando el formulario de acceso después de un envío abortado deliberadamente. Cada recorrido pasó completo al repetirlo en otra base, 39 y 45 respectivamente. Se conservaron los intentos y se amplió el diagnóstico con estado visible y método/ruta/estado HTTP, sin tokens, cuerpos o contraseñas. No se debilitó ninguna aserción ni se aumentaron/desactivaron límites. **Causas iniciales sin confirmar; no afirmar que se repararon defectos funcionales ni que se eliminaron intermitencias.** Si se repiten, recoger el nuevo diagnóstico antes de cambiar la aplicación.

Dos preparaciones de capturas manuales se interrumpieron por usar la etiqueta de otro formulario y buscar un enlace que está dentro del menú móvil. Se corrigieron los selectores; no se contaron como pruebas aprobadas ni como defectos de la aplicación.

Archivos de código/pruebas modificados:

- `src/features/admin/admin.module.css`: lectura de detalles en móvil.
- `server/tests/final-review-browser-server.ts`: entorno general desechable, cuenta ficticia y JPEG sintético.
- `scripts/check-community-connected.browser.mjs` y `scripts/check-admin-recovery.browser.mjs`: diagnóstico de fallos, sin cambiar criterios de aceptación.

El resto de cambios son documentación/continuidad: este informe, PROJECT_STATE, README, AGENTS, plan local y guía administrativa.

## Qué tenemos ahora y qué sigue

| Punto acordado | Estado real |
| --- | --- |
| 1. Recuperación administrativa | Desarrollo y recorrido local comprobados con buzón ficticio. Correo real pendiente. |
| 2. Equipo administrador | Integrado y comprobado localmente. Responsables/canales definitivos pendientes. |
| 3. Corrección de expediente | Integrada y comprobada localmente, con historial/tutor/revocación. Cambio verificado de correo no implementado. |
| 4. Alertas de herramientas | Investigación terminada; **diez alertas todavía sin corregir**, pendiente de versión compatible o migración específica. |
| 5. Revisión final | Revisión técnica local realizada, mejora móvil comprobada y guía contrastada. Incidencias y límites registrados; aceptación humana pendiente. |

**Siguiente tanda agrupada, sin contratar alojamiento todavía:**

1. **Sesión de uso con el administrador de CAI.** Con cuentas ficticias, pedirle revisar una solicitud, preparar acceso, moderar una historia, atender una consulta y retirar una imagen usando [la guía sencilla](guia-administracion.md). Registrar dónde necesita ayuda y corregir fricciones concretas. Las pruebas automáticas no acreditan que una persona lo encuentre intuitivo.
2. **Decisiones y material de CAI.** Confirmar responsables, programas/grupos, visibilidad, contactos, textos/cifras/precios, fotografías y autorizaciones de tutores; definir custodia/retención. Revisar carga de las imágenes finales. No usar datos reales para sustituir la demostración sin estos acuerdos.
3. **Cuentas y servicios externos.** Preparar Google con un proyecto bajo control de CAI y probar solicitud obligatoria/aprobación y revocación reales. Elegir remitente/proveedor de correo, integrar entrega y avisos de cambio de contraseña, comprobar destinatario, recepción, expiración y fallos. La entrega ficticia no prueba recepción humana.
4. **Cerrar el alcance restante.** El cambio verificado de correo de acceso requiere un flujo específico y verificación del destinatario/identidad; hoy sigue protegido y no se cambia desde expediente. Acordar si se exige para la primera entrega. Comentarios/reacciones persistentes, retos/logros/insignias, eventos/avisos institucionales y vídeos no se incluyen por la existencia de su demo; no implementarlos sin una decisión de alcance.
5. **Al acercarse a la entrega, cotizar infraestructura y mantenimiento.** Alojamiento compatible, base/archivos privados, dominio, correo, copias y operación. Después implementar/probar la configuración elegida, HTTPS/orígenes/secretos, separación de entornos, supervisión, restauración y revisión previa a usuarios reales. El backend local rechaza producción; no basta con subir `dist` para poner el sistema a trabajar con el cliente.

No quedan tareas autónomas nuevas de los puntos 1–3 por inventar o rehacer en este alcance. Las intermitencias se investigan si reaparecen; las alertas al cambiar versiones/antes de publicar. Mantener el sitio local para revisión mientras se agrupan las dependencias anteriores.

## Repetir la revisión sin tocar el entorno habitual

Compilar primero y abrir consolas separadas desde la raíz del repositorio:

```powershell
$env:CAI_API_PORT = '3101'
node server/tests/final-review-browser-server.ts
```

```powershell
$env:CAI_API_PORT = '3101'
npm.cmd run preview -- --host ::1 --port 4180 --strictPort
```

Usar `http://localhost:4180` y los metadatos ficticios que imprime la primera consola. El entorno general crea otra base/imagen bajo `.local/tests/final-review-*`; no imprime ni necesita la contraseña habitual. El secreto fijo de prueba aparece en su fuente y solo corresponde a esa fixture. No usarlo como contraseña real.

Reutilizar los siete `check-*.browser.mjs` generales con email/password/baseURL/browserLabel de prueba; galería requiere fixturePath y estabilización las rutas actuales del manifiesto de `dist`. Crear una fixture nueva por tanda/navegador si se quiere repetir desde cero, sin reiniciar ni borrar la base habitual.

Para contraseña, recuperación administrativa, equipo, perfil y expediente, detener la API ficticia anterior y utilizar su `*-browser-server.ts` específico con su recorrido. Recuperación usa además el buzón separado de prueba en loopback 3102, protegido por una clave aleatoria: **no es un endpoint del producto**. No exponerlo ni publicar metadatos/enlaces. No desactivar límites para completar una tanda.

Evidencia local excluida de Git: `.local/tests/final-review-api.log`, `final-review-build.log`, `final-review-results.json` y bases de los intentos conservados. El informe versionado registra la matriz y los límites sin credenciales. Detener las consolas aisladas al terminar; no parar los servicios habituales del usuario.

