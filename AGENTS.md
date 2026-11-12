# CAI — Guía para agentes de desarrollo

## Estado vigente: lectura obligatoria antes de trabajar

- NUEVA PRIORIDAD DEL USUARIO tras la revisión final: incluir y perfeccionar comentarios, reacciones, retos, insignias y vídeos en la entrega final. Vídeos solo subidos por coordinación, visibles al grupo autorizado (confirmado). Leer `docs/v1-community-expansion.md`: inventario, componentes a reutilizar, orden y cierre por bloque. Siguiente desarrollo autónomo: reacciones/comentarios, luego retos, insignias y vídeo. No pedir otra vez autorización para incluirlos. Rama de análisis `docs/v1-community-expansion`, base `fee87d1`, cambios solo documentales; nada de esta ampliación está ya conectado por haber aprobado el plan. Las indicaciones anteriores de excluir estos módulos o pasar directamente a dependencias humanas son históricas y quedan sustituidas por esta decisión. Google/correo/validaciones humanas agrupados y alojamiento/presupuesto al final; no prometer que el plazo anterior absorbe el alcance nuevo.
- Leer primero `docs/PROJECT_STATE.md`: inventario de ramas, componentes existentes y orden de integración. Prevalece sobre descripciones históricas de prototipo; las instrucciones nuevas del usuario tienen prioridad.
- Base oficial de interfaz: `release/cai-demo-v1.0` (`f3ba46b`). Dashboard y Community avanzada YA existen. No reconstruirlos ni reemplazarlos por las pantallas locales simplificadas.
- Avance técnico auditado: `feat/local-password-recovery` (`1b84fb3`), descendiente de v1.0 con seis mejoras acumulativas. No fusionarlas como trabajos independientes ni usar `main` por defecto.
- Integraciones acumulativas de acceso/panel/Community, grupos/ajustes, mensajes, imágenes, navegación y estabilización ya están comprobadas en sus alcances. Continuación vigente: `chore/v1-final-review`, base `9274dc9`, código `940573a`; conserva expediente `c712abb` y añade lectura de detalles en móvil/fixture general/diagnóstico. Leer `docs/v1-final-review.md` y el cierre de PROJECT_STATE. Revisión local: API 134 y matriz de 844 comprobaciones, 24 recorridos Brave/Opera; acceso/expediente repetidos tras CSS. Dos intentos Opera incompletos luego pasaron en bases nuevas, causa no confirmada; no ocultarlos ni afirmar reparación. Fotos externas sin terminar de cargar durante inspección. No rehacer cuentas/panel/integraciones ni fusionar ramas acumulativas como avances independientes.
- Antes de editar comprobar Git y localizar la función en v1.0 y avances posteriores. Indicar componente reutilizado, servicio a conectar y criterio de cierre. Conectar y adaptar lo existente primero.
- Prioridad vigente: revisión técnica del punto 5 realizada, aceptación humana pendiente. Siguiente tanda agrupada con CAI: uso del panel/guía, responsables, material/autorizaciones, Google/correo reales y decisión de alcance para cambio verificado de correo; alojamiento/presupuesto después. No inventar trabajo nuevo para eludir dependencias humanas. Punto 4 YA revisado: diez alertas moderadas de desarrollo por minimatch 10.2.6; ESLint 10.14.0/config-array 0.23.5/estree 8.72.2 siguen requiriendo ^10; parche desde 11.0.1 fuera de rango. Auditoría de ejecución: cero avisos. Mantener pendiente externo, sin force/override incompatible ni repetir la investigación sin cambios de versiones/alcance. Punto 3 integrado con migración 12 e historial/tutor; no cambiar correo/Google/grupo desde la corrección. Pruebas solo en fixtures final-review-browser-server, student-record-browser-server, admin-team-browser-server, admin-recovery-browser-server, admin-security-browser-server y student-profile-browser-server según recorrido. Nunca cambiar acceso habitual/archivo inicial. Mantener revocación y revalidación tras tareas asíncronas. HEAD privado: siete 403 comprobados en desarrollo; preview responde fallback HTML y no equivale a esa aserción. No descargar datos privados para probar el bloqueo.
- Trabajo autónomo: completar primero las tareas autorizadas que no requieren intervención del usuario. Si una subtarea depende de cuentas, verificaciones, pagos, contenido o decisiones del cliente, registrarla en la lista de dependencias y continuar con otra tarea independiente del alcance acordado. Dejar Google, correo real, contratación y validaciones humanas para una tanda final agrupada; no bloquear el desarrollo local por ellas ni simular que se comprobaron. No inventar decisiones del cliente ni ampliar el alcance para mantenerse ocupado.
- Distinguir interfaz, demo en memoria, persistencia local, integración comprobada y producción. La existencia de archivos o pruebas aisladas no demuestra producto integrado.
- Al cerrar tareas actualizar el registro de continuidad de `docs/PROJECT_STATE.md`: base/commit, componentes reutilizados, pruebas y pendientes. Ante documentación contradictoria verificar Git/código antes de proponer implementación nueva.
- Actualizar también después de cada avance lógico significativo durante una sesión larga. Antes del siguiente cambio contrastar el registro con Git y código; usar la lista de comprobación activa y estados explícitos, sin marcar como comprobado lo que solo está implementado. Registrar bloqueos y correcciones relevantes sin secretos.
- Conservar diseño, ramas, datos e historial. Retirar/redirigir rutas provisionales tras equivalencia comprobada; no borrar datos/ramas ni fusionar a la base oficial implícitamente.

## Contexto inicial del prototipo (antecedente)
CAI (Centro de Asesorías Integrales) tendrá un sitio institucional público, una comunidad privada para alumnos y un panel de administración. La meta inmediata es un prototipo visual navegable para validarlo con el cliente en pocos días; NO es un sistema listo para producción.

Antes de implementar, consulta `docs/vision.md`, `docs/requirements.md` y la tarea/Issue asignada.

## Stack propuesto
React + TypeScript + Vite. Reutilizar la identidad visual del proyecto previo de CAI únicamente cuando los materiales estén disponibles y se haya acordado su adaptación. No agregar librerías sin justificación.

## Reglas
- Trabajar en ramas específicas; no modificar `main` directamente.
- Cambios pequeños, revisables y alineados con una sola tarea.
- Priorizar diseño responsive, accesibilidad, semántica HTML y componentes reutilizables.
- Mantener textos/datos de muestra identificados como ficticios.
- Simular autenticación, publicaciones y moderación SOLO para demostración; jamás presentarlas como seguridad real.
- No usar imágenes, nombres ni datos reales de estudiantes, especialmente menores, sin autorización y controles adecuados.
- No subir secretos, credenciales ni archivos `.env` con valores reales.
- No desplegar el prototipo simulado como comunidad operativa con alumnos reales.
- No eliminar material existente ni hacer push, merge o despliegue sin aprobación explícita.
- Cuando exista el tooling, ejecutar los checks disponibles (lint, typecheck, build); reportar los no ejecutados.

## Entrega de cada tarea
Explicar qué se cambió, archivos afectados, pruebas ejecutadas, decisiones y limitaciones. Actualizar documentación al modificar requisitos o arquitectura.

## Primeras funcionalidades de prototipo
1. Landing institucional de CAI con contenido de muestra verificable.
2. Comunidad con feed, logros y perfiles ficticios.
3. Vista de moderación con solicitudes simuladas.
4. Navegación visible entre las tres áreas y selector de roles demo.
