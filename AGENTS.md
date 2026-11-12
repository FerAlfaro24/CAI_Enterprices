# CAI — Guía para agentes de desarrollo

## Estado vigente: lectura obligatoria antes de trabajar

- Leer primero `docs/PROJECT_STATE.md`: inventario de ramas, componentes existentes y orden de integración. Prevalece sobre descripciones históricas de prototipo; las instrucciones nuevas del usuario tienen prioridad.
- Base oficial de interfaz: `release/cai-demo-v1.0` (`f3ba46b`). Dashboard y Community avanzada YA existen. No reconstruirlos ni reemplazarlos por las pantallas locales simplificadas.
- Avance técnico auditado: `feat/local-password-recovery` (`1b84fb3`), descendiente de v1.0 con seis mejoras acumulativas. No fusionarlas como trabajos independientes ni usar `main` por defecto.
- Integraciones acumulativas: acceso/dashboard, Community/moderación, grupos/ajustes, recuperación/avisos/contacto, imágenes privadas y navegación unificada ya están comprobados en sus alcances. Leer `docs/v1-*.md` y el registro final de PROJECT_STATE. Continuación vigente: `chore/v1-stabilization`, base `5405c1c`, puntos de retorno `e648269` y `876aa56`; leer `docs/v1-stabilization.md`, `docs/guia-administracion.md` y `docs/respaldo-recuperacion-local.md`. Carga diferida, recuperación de errores y verificador de respaldos YA están comprobados. No rehacer recorridos ni fusionar ramas acumulativas como avances independientes.
- Antes de editar comprobar Git y localizar la función en v1.0 y avances posteriores. Indicar componente reutilizado, servicio a conectar y criterio de cierre. Conectar y adaptar lo existente primero.
- Prioridad vigente: cerrar huecos de cuenta/perfil del inventario tras revisar su código y alcance, comenzando por seguridad de la cuenta administrativa y entrega; reutilizar Configuración, perfil y servicios existentes. No crear personas/roles reales ni añadir funciones secundarias implícitamente. La tanda técnica de carga/errores/guías del bloque 9 ya está comprobada: no repetirla. Siguen diez avisos moderados de desarrollo por minimatch; las versiones compatibles consultadas no los corrigen. No aplicar fix --force ni override mayor sin revisión específica; auditoría de ejecución sin dev devolvió cero. Conservar rutas unificadas, permisos, bloqueo `.local`/Git y prueba HEAD. Google/correo reales, contenido/consentimientos, validación humana y alojamiento continúan al final.
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
