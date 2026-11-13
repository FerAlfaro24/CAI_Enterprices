# Retos diarios de inglés: implementación y comprobación

Rama acumulativa `feat/v1-community-challenges`, desde `46466b7` (comentarios/reacciones ya conectados). Puntos de retorno: `fbb1545` servicio/migración/banco/pruebas y `e14eda7` interfaz/administración/recorridos. Base visual oficial v1.0 conservada. Comprobación local con datos ficticios; no despliegue ni prueba con alumnos reales.

## Qué se entregó

- **180 preguntas originales y 45 temas**, cuatro contextos por tema; 60 preguntas de gramática, 60 de vocabulario y 60 de vida cotidiana. Cinco formatos de selección: completar, elegir una frase, significado, respuesta a una situación y orden de palabras.
- **Tres preguntas nuevas cada día**, una por área. Fecha del servidor en `America/Mexico_City`, cambio a medianoche. Rotación determinista con temas intercalados y desfase entre áreas; sin cambiar el banco ni programar sustituciones, cada área recorre sus 60 preguntas antes de repetir. El banco editable puede alterar ese ciclo; no prometer novedad ilimitada.
- Cada pregunta incluye una regla breve en español y **otro ejemplo con traducción**, disponibles para el alumno después de responder. No es una prueba de nivel ni una calificación.
- **Un intento por pregunta**, +5 puntos por participar y +10 adicionales si acierta, hasta 45 al día. Un error no resta puntos. Completar las tres suma un día de constancia, sin exigir tres aciertos. La serie incluye hoy, o se conserva hasta ayer mientras comienza hoy; un día incompleto corta la serie. Puntos y mejor serie se conservan.
- Inicio muestra el mismo progreso que Retos. Navegación entre las tres preguntas, resultado persistente, paso explícito a la siguiente, cierre del día y cuaderno de repaso con páginas de veinte respuestas propias. Sin selector de días ficticios en acceso real, clasificaciones públicas ni soluciones ajenas.
- Administración **Retos de inglés** dentro del panel existente: estado global, calendario por grupo/fecha, banco con búsqueda/filtros/páginas de doce, creación/edición, borrador/lista/archivada, tres o cuatro opciones y vista previa con solución. Programación de hoy hasta 90 días después; pausa global o de una pregunta concreta para un grupo/día.

El banco refuerza be, tercera persona, do/does/did, continuo, rutinas, since/for, pasado/perfecto, artículos por sonido, some/any, much/many, comparativos, pronombres, posesivos y participios. También actually/currently, sensible/sensitive, library/bookshop, attend/assist, embarrassed/pregnant, borrow/lend, say/tell, make/do, job/work, look/see/watch, teach/learn, win/earn, fun/funny, meet/know y adjetivos de emoción. Uso cotidiano: edad, clima, agree, want to, like/would like, there is/are, preposiciones de tiempo, cortesía, indicaciones, preguntas, frecuencia, patrones verbales, no contables, a few/a little y respuestas cortas.

Ejemplos y explicaciones redactados para CAI. Contraste puntual con fuentes primarias: [British Council, adjetivos en -ing/-ed](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/adjectives-ing-ed) y resultado del [diccionario Cambridge, lend/borrow](https://dictionary.cambridge.org/grammar/british-grammar/lend-or-borrow). La página completa de Cambridge respondió 403; no se afirma una revisión íntegra de ella ni una certificación pedagógica externa. Evitar simplificaciones como “-ed solo para personas”: una persona también puede ser boring.

## Persistencia, privacidad y cambios de coordinación

Migración aditiva **15**, banco inicial sembrado una sola vez y cuatro tablas: `challenge_bank`, `challenge_controls`, `daily_challenges`, `challenge_attempts`. Usa la auditoría administrativa existente. Editar/archivar el banco no borra preguntas ni resultados históricos.

Las asignaciones guardan una copia del contenido servido. Un cambio del banco afecta futuras selecciones automáticas; no reescribe una pregunta del calendario, aunque conserve su identificador. Para sustituir una pregunta ya programada se elige otra entrada del banco. Si alguien ya respondió, solo puede pausarse/reactivarse; la sustitución requiere otro día. Pausar no borra el resultado de quien participó.

El servidor decide alumno activo/aprobado, grupo vigente, fecha, revisión, opción válida, resultado y puntos. No acepta puntos/identidad/solución enviados por el cliente. El banco completo y el calendario con soluciones son solo administrativos. El alumno recibe una lista explícita de campos sin solución antes de responder, y solo su historial después. No guarda respuestas o credenciales en storage del navegador. El banco y el servicio están bloqueados además como archivos estáticos de desarrollo, incluidas mayúsculas, ruta codificada, `?raw` y `@fs`; el banco no aparece en dist.

Clave de envío y huella recuperan el resultado si la red pierde la respuesta, incluso después de cambiar de día; no puntúan dos veces. Otra respuesta o clave para un espacio ya respondido produce conflicto y actualización. La restricción alumno/día/espacio impide repetir puntos al cambiar de grupo. Se conserva la pregunta anterior ya respondida, identificada como del grupo previo; los espacios restantes pertenecen al grupo actual. Sin grupo asignado no hay nuevas respuestas, pero se conserva el repaso propio. Grupos archivados mantienen las preguntas servidas a sus integrantes, según el patrón existente del proyecto.

Las rutas reutilizan autenticación, comprobación de origen/tamaño/cuerpo, límites por cuenta y revalidación de sesión después de leer el cuerpo. El reloj inyectable existe solo en la construcción interna de fixtures; no hay endpoint para elegir el día o desactivar límites.

## Comprobaciones realizadas

- `npm.cmd run test:api`: **179/179**, incluidos **16 resultados específicos** de retos. Banco/esquema, equilibrio de opciones, límites, acceso privado, grupo, validación, puntos, reintento, conflicto, reloj/medianoche, serie, rotación de 60 días, edición/programación, copia separada/reinicio y migración 14→15 sin resembrar cambios del administrador. Incluye revocación mientras llega el cuerpo. Las fixtures históricas se adaptaron para desmontar también el esquema 15 al simular versiones anteriores.
- `npm.cmd run build` (incluye tipos) y `npm.cmd run lint`: correctos. `git diff --check`: correcto. Sin nuevas dependencias.
- Modelos anteriores: retos demo **27 comprobaciones y una igualdad**, comunidad **29 y cuatro igualdades**; no se sustituyen sus reglas con datos reales.
- **Brave y Opera GX: 53 comprobaciones completas por navegador**, con contextos aislados y cuentas nuevas. Inicio, tres áreas, foco, error/acierto/ejemplo, recarga, privacidad entre alumnos, constancia, repaso paginado, calendario/banco/creación/edición, pausa, programación futura, respuesta de red perdida, conflicto entre ventanas, storage y 1440/768/375/320 px. Cero errores JavaScript en esos recorridos.
- Tras ajuste del orden móvil: **18 comprobaciones adicionales por navegador**, claro/oscuro en esos cuatro anchos, selector antes del formulario, controles sin recortes, radios por teclado y ausencia de errores JavaScript. Total matriz de esta tarea: **142**, sin sumar repeticiones. Inspección visual de capturas del alumno, selector y pregunta, temas claro/oscuro, y editor administrativo móvil.
- HEAD sin cookies: **13 rutas privadas bloqueadas en desarrollo**, sin descargar datos privados. Preview tiene fallback HTML, no equivale a esta comprobación. Búsqueda del banco/una explicación original en dist sin coincidencias.

Incidencias registradas: primer recorrido Brave se detuvo tras 21 comprobaciones porque volver a seleccionar el mismo grupo vaciaba el calendario sin cambiar sus dependencias. Se corrigió evitando ese reinicio cuando el valor no cambia; después pasó completo en bases nuevas. La inspección visual encontró el selector de tres preguntas detrás del repaso en móvil por ordenación heredada de demo: se aplicó distribución específica solo al modo conectado y se volvieron a comprobar los cuatro anchos/temas en ambos navegadores. La vista previa anterior ocupaba 4180: se identificó/cerró únicamente ese proceso de prueba y se inició otro apuntando a la fixture, sin detener el entorno habitual. No contar intentos incompletos como aprobados.

No se repitió aquí toda la matriz histórica de comentarios/reacciones ni una auditoría de dependencias; sí pasó la suite completa del servicio y los modelos indicados. Las diez alertas moderadas de desarrollo y las incidencias históricas del informe anterior siguen registradas con sus límites; no se atribuye su reparación a Retos.

## Archivos cambiados

- Servicio: `server/challenge-bank.ts`, `challenges.ts`, `database.ts`, `contracts.ts`, `app.ts`, `verify-backup.ts`; bloqueo en `vite.config.ts` y `scripts/check-private-paths.mjs`.
- Pruebas: `server/tests/challenges.test.ts`, `challenges-browser-server.ts`, ajustes de esquema en `admin-recovery.test.ts`, `admin-security.test.ts`, `admin-team.test.ts`, `comments.test.ts`, `gallery.test.ts`, `reactions.test.ts`, `student-profile.test.ts`, `student-records.test.ts`. Recorridos `scripts/check-connected-challenges.browser.mjs` y `check-connected-challenges-visual.browser.mjs`.
- Comunidad: `ConnectedCommunity.tsx`, `CommunityWorkspace.tsx`, `connection.ts`, `types.ts`, `home/HomeCommunityPanels.tsx`; reutilización de `challenges/ChallengesView.tsx`, `ChallengeQuestionPanel.tsx`, `ChallengeRewards.tsx`, `useChallengeAnswer.ts`, estilos y nuevo `ConnectedChallengesView.tsx`. Demo anterior conservada.
- Panel: `src/pages/AdminChallengesPage.tsx`, `features/admin/components/ChallengeEditor.tsx`, `features/admin/challenges.module.css`, `layouts/AdminLayout.tsx`, `app/router.tsx`, API compartida `features/local-access/api.ts`.
- Continuidad: este informe, PROJECT_STATE, AGENTS, README, plan ampliado y guías de administración/respaldos.

## Repetir en aislamiento

Después de compilar, en consolas distintas:

```powershell
$env:CAI_API_PORT = '3101'
node server/tests/challenges-browser-server.ts
```

```powershell
$env:CAI_API_PORT = '3101'
npm.cmd run preview -- --host 127.0.0.1 --port 4180 --strictPort
```

La fixture crea base y cuentas ficticias nuevas en `.local/tests/challenges-browser-*`, con día fijo 2026-11-12 y 27 respuestas previas por autor para probar paginación/constancia. Metadatos en browser.json. Ejecutar `checkConnectedChallenges` con admin, fixture de cada navegador y browserLabel Brave/Opera; luego `checkConnectedChallengesVisual` con el email ficticio peer, browserLabel y directorio de capturas. El día fijo no pertenece al servicio habitual. Repetir el recorrido principal exige fixture nueva. Los archivos de evidencia están ignorados en `.local/tests/challenges-*`; no publicar cuentas, bases ni capturas con información real.

## Pendientes reales

Retos quedan conectados y comprobados localmente. **Insignias persistentes** siguen como siguiente módulo, reutilizando la colección/arte/reglas/solicitudes de v1.0 y este progreso, sin fingir concesiones de demo. Vídeos privados de coordinación siguen después. Validación pedagógica/uso con CAI, Google/correo reales, contenido y autorizaciones, alojamiento/presupuestos siguen para la tanda final acordada. No se probó uso simultáneo de producción ni infraestructura contratada. Base/acceso habituales no abiertos, migrados o modificados durante esta tarea.
