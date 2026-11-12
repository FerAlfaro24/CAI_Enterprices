# CAI — Guía para agentes de desarrollo

## Estado vigente: lectura obligatoria antes de trabajar

- Leer primero `docs/PROJECT_STATE.md`: inventario de ramas, componentes existentes y orden de integración. Prevalece sobre descripciones históricas de prototipo; las instrucciones nuevas del usuario tienen prioridad.
- Base oficial de interfaz: `release/cai-demo-v1.0` (`f3ba46b`). Dashboard y Community avanzada YA existen. No reconstruirlos ni reemplazarlos por las pantallas locales simplificadas.
- Avance técnico auditado: `feat/local-password-recovery` (`1b84fb3`), descendiente de v1.0 con seis mejoras acumulativas. No fusionarlas como trabajos independientes ni usar `main` por defecto.
- Antes de editar comprobar Git y localizar la función en v1.0 y avances posteriores. Indicar componente reutilizado, servicio a conectar y criterio de cierre. Conectar y adaptar lo existente primero.
- Prioridad: contratos/rutas, acceso y dashboard oficiales conectados, después feed/moderación oficiales. No abrir otra administración/comunidad paralela ni comenzar imágenes antes de esta integración.
- Distinguir interfaz, demo en memoria, persistencia local, integración comprobada y producción. La existencia de archivos o pruebas aisladas no demuestra producto integrado.
- Al cerrar tareas actualizar el registro de continuidad de `docs/PROJECT_STATE.md`: base/commit, componentes reutilizados, pruebas y pendientes. Ante documentación contradictoria verificar Git/código antes de proponer implementación nueva.
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
