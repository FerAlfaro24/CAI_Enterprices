# CAI Community — Fase 3: Retos

Rediseño exclusivo de Retos en `feat/community`, basado en la inspección visual de `design-reference/RETOS — DESKTOP.png` (1440 × 1220). [Revisión visual y diferencias](../review/community-phase-3/REVISION-VISUAL.md) · [Índice de 24 capturas](../review/community-phase-3/index.html).

## Arquitectura y alcance

La ruta sigue siendo `/community`. `CommunityWorkspace` monta `ChallengesView` cuando el estado interno selecciona Retos. No se cambiaron el router, la landing, la administración, los componentes de Inicio ni los diseños de Galería y Logros.

Se reutilizan `CommunityProvider`, contexto, tipos `Challenge`/`Attempt`, las cinco preguntas de fixtures y el reducer existente. El modelo continúa siendo la única fuente de respuestas y puntuación. La selección de opción y el mensaje de validación son locales al formulario; no hay un segundo registro de intentos.

La lógica del formulario compacto existente se extrajo a `useChallengeAnswer`: lo utilizan tanto `DailyChallenge` como el panel de Retos. El primero conserva su marcado y apariencia. Inicio ya tenía un resumen del reto y un CTA hacia Retos: sigue leyendo el mismo contexto sin cambios de diseño.

### Archivos de esta fase

Todos los nuevos componentes y CSS están en `src/features/community/challenges/`:

| Archivo | Responsabilidad |
| --- | --- |
| ChallengesView.tsx | Composición independiente, titular, progreso, panel, recompensas y tarjetas inferiores. |
| ChallengeQuestionPanel.tsx | Elección A/B/C, validación, comprobación y explicación. |
| ChallengeRewards.tsx | Recompensa diaria y colección automática derivada. |
| ChallengeDemoSelector.tsx | Selector existente de cinco días, dentro de las opciones de demo en Retos. |
| useChallengeAnswer.ts | Selección local y envío de la acción existente answer; compartido con DailyChallenge. |
| progress.ts | Proyección de intentos: puntos, días respondidos, constancia y contrato ChallengeBadge. |
| challenges.module.css | Estilos encapsulados, responsive y estados; usa variables de tema ya existentes. |

Archivos existentes adaptados:

- `CommunityWorkspace.tsx`: integra la composición propia de Retos.
- `components/CommunityShell.tsx`: identifica las opciones de demo e incorpora el selector solo en Retos.
- `components/DailyChallenge.tsx`: consume el hook compartido; conserva el formulario compacto usado por otras secciones.
- `docs/community-implementation.md`: enlaza esta fase y actualiza su estado.

Pruebas nuevas: `scripts/check-community-challenges.mjs` y `scripts/check-community-challenges.browser.mjs`. Documentación nueva: este archivo y la carpeta de revisión. Las modificaciones anteriores de las fases 1, 2 y 2.1 siguen presentes en el árbol de trabajo; no se atribuyen a esta fase.

## Reglas conservadas y constancia explícita

Seleccionar no concede puntos. La acción `answer` existente concede +5 por participar y +10 extra por acertar; rechaza un segundo intento del mismo reto. Una respuesta incorrecta muestra la correcta y una explicación, sin penalización. No hay reloj, preguntas abiertas ni variantes por nivel.

Inicio y Retos consultan `state.challengeId` y `state.attempts`. Cambiar de sección o día conserva los intentos. Reiniciar los elimina y devuelve al primer día; recargar también reinicia la demo. Solo el tema continúa persistido bajo el namespace ya existente.

Los días 1 a 5 representan días consecutivos **ficticios**, sin relación con el reloj del equipo:

- Días respondidos: número de retos con intento.
- Serie actual: recorre hacia atrás los días contiguos respondidos hasta el día seleccionado. Si ese día está pendiente, empieza en el anterior; un hueco corta la serie.
- Mejor serie: mayor bloque contiguo entre todos los intentos. No depende del orden de clics.
- Ejemplo: 1, 3 y 5 respondidos suman tres participaciones, pero la mejor serie es uno. Seleccionado el día 5, la serie actual es uno.
- Volver a un día anterior cambia el resumen de serie de ese día; la mejor serie y las insignias ganadas no se pierden. Las respuestas incorrectas también cuentan como participación.

`ChallengeBadge` describe id, título, símbolo, regla, estado y progreso. Tres insignias automáticas se derivan sin mutar el modelo: primera respuesta (1 intento), tres días seguidos (mejor serie ≥3), en comunidad (los cinco días respondidos). No requieren almacenamiento de concesiones ni arquitectura administrativa nueva. Son interfaces reutilizables; su integración completa en Logros queda pendiente de aprobación.

La insignia genérica histórica “Constancia que inspira” permanece en los perfiles y módulos anteriores: celebra tres participaciones, no afirma que sean consecutivas. La nueva insignia “3 días seguidos” sí exige días contiguos. No se construyeron solicitudes ni revisión de insignias.

## Diseño, accesibilidad y responsive

Se mantienen Figtree, colores CAI y temas existentes. El panel azul y recompensa amarilla conservan colores de marca en modo oscuro; superficies y textos periféricos usan variables semánticas. CSS Modules impide propagar estos estilos a otras rutas.

El cuestionario usa fieldset, legend y radios nativos: teclado con flechas, foco visible y áreas de elección de 90 px en escritorio y al menos 82 en móvil. Envío vacío muestra una alerta y enfoca la primera opción; elegir elimina el error. Tras comprobar, el resultado recibe foco, explica el acierto/error y expresa los puntos en texto. Reabrir un reto completado no roba el foco de navegación. No se depende exclusivamente del color.

A 1440 se conserva la composición de panel grande y columna secundaria, con tres tarjetas inferiores. A 1024 se ajustan textos y espacios; a 768 la pregunta pasa a una columna con recompensas adaptadas. A 375/320 la pregunta precede a puntos, constancia y recompensas; no se reduce todo proporcionalmente ni se ocultan contenidos. No hay animaciones nuevas; se respeta la preferencia de movimiento reducido.

Se realizó comparación/refinamiento antes de cerrar: alineación de constancia con la referencia, panel inicial de 640 px, fondos diferenciados para insignias y orden móvil con pregunta protagonista. El acabado de contraste usa #3470D3 tras texto blanco en opciones y metadatos (4,77:1), y #5A90E1 tras las letras grandes (más de 3:1). Capturas 00–02 documentan la iteración; 14–23 muestran la versión final.

## Verificación

Ejecutado satisfactoriamente:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
node scripts/check-community-model.mjs
node scripts/check-community-publication.mjs
node scripts/check-community-challenges.mjs
```

- Modelo anterior: 29 comprobaciones y 4 comparaciones de igualdad.
- Validación de publicaciones de fase 2.1: 23 comprobaciones.
- Modelo de retos: 24 comprobaciones y 1 comparación de igualdad (sin mutación, puntuación, duplicados, sincronización, días, serie y reinicio).
- Navegador Brave: 24 verificaciones en cada ancho 1440, 375 y 320; incluye teclado, selección sin puntos, foco, resultado, bloqueo, navegación, demo, recompensas y reinicio. El archivo `check-community-challenges.browser.mjs` es una función para la herramienta existente `browser_run_code_unsafe` (argumento filename absoluto); no instala ni importa Playwright en la aplicación. Requiere Vite corriendo en 127.0.0.1:5173; el parámetro opcional baseURL permite otro puerto.
- Diseño y desbordamiento revisados a 1440, 1024, 768, 375 y 320; claro/oscuro en escritorio y ambos móviles. Capturas completas y recortes identificados en el inventario.
- Brave sin errores/advertencias de consola; prueba básica de Opera GX con acierto +15, estado bloqueado y móvil oscuro a 320 sin desbordamiento.
- Reducción de movimiento comprobada; no se introdujeron animaciones activas en Retos.

## Diferencias y límites

La fuente efectiva es el PNG local; no hubo acceso a capas de Figma mediante herramientas en esta sesión. No se afirma fidelidad exacta a propiedades de nodos.

Se conservó la cabecera de cuatro secciones, el aviso de prototipo y el pie aprobados. La franja demo desplaza el panel unos 53 px respecto del PNG. Se mantienen las preguntas anteriores en lugar de la pizza del diseño, y el estado inicial refleja cero progreso real de la simulación. Estados completados y reglas añaden altura; el móvil es largo, con lectura completa y controles amplios. Móvil y oscuro son adaptaciones, sin PNG específico aprobado.

No hay backend, autenticación, seguridad de roles ni persistencia de resultados. No se utilizaron alumnos reales ni recursos gráficos nuevos. Las pruebas son de navegador automatizado; no equivalen a pruebas en dispositivos físicos o una auditoría completa con lector de pantalla. Firefox y Safari no se probaron.

En la entrega inicial se verificó por hashes respecto del inicio de esta fase que los únicos archivos fuente existentes cambiados fueron Workspace, Shell y DailyChallenge. Los componentes de Inicio, la landing, administración, fixtures, modelo, tipos, estilos compartidos, reference/ y los PNG se conservaron. No se añadieron dependencias ni se hicieron commits, push, merge o despliegues. **Se detiene el trabajo en fase 3 para revisión; Galería y Logros no se rediseñan.**

## Ajustes finales tras aprobación de la fase 3

- `ChallengeQuestionPanel` sustituye la instrucción de elección por «Este reto ya está completado. Aquí puedes revisar tu respuesta y lo que aprendiste» cuando existe un intento, tanto al comprobar como al reabrir el reto.
- En `model.ts`, responder desde Retos deja vacío el aviso global: la tarjeta ya comunica explicación y puntos mediante su región `role="status"`, `aria-live="polite"` y el foco en el resultado. Se evita la confirmación duplicada encima del título. Las respuestas desde el formulario compacto de otras secciones conservan su aviso global; las demás acciones no cambian sus notificaciones.
- No se cambian puntuación, preguntas, constancia, insignias, estilos ni otras secciones. Las capturas de la entrega inicial documentan el estado visual aprobado antes de estos dos ajustes de mensajes.
- Validación final: typecheck, lint y build correctos; modelo general 29 comprobaciones y 4 igualdades; publicaciones 23; retos ampliado a 27 y una igualdad; navegador ampliado a 30 verificaciones en cada ancho 1440, 375 y 320. Incluye textos pendiente/completado, reapertura, cambio de día y ausencia de la confirmación duplicada en acierto y error. Brave sin errores ni advertencias de consola.

