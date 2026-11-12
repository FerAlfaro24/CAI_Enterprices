# CAI — Guía para agentes de desarrollo

## Estado vigente: lectura obligatoria antes de trabajar

- Leer primero `docs/PROJECT_STATE.md`: inventario de ramas, componentes existentes y orden de integración. Prevalece sobre descripciones históricas de prototipo; las instrucciones nuevas del usuario tienen prioridad.
- Base oficial de interfaz: `release/cai-demo-v1.0` (`f3ba46b`). Dashboard y Community avanzada YA existen. No reconstruirlos ni reemplazarlos por las pantallas locales simplificadas.
- Avance técnico auditado: `feat/local-password-recovery` (`1b84fb3`), descendiente de v1.0 con seis mejoras acumulativas. No fusionarlas como trabajos independientes ni usar `main` por defecto.
- Integraciones acumulativas de acceso/panel/Community, grupos/ajustes, mensajes, imágenes, navegación y estabilización ya están comprobadas en sus alcances. Leer `docs/v1-*.md` y el registro final de PROJECT_STATE. Continuación vigente: `feat/v1-admin-team`, base `88ef627`, puntos de retorno `0f0c493` y `f980067`; leer `docs/v1-admin-team.md`. Contraseña/recuperación administrativas, perfil visible y equipo con alta/invitación/estados YA comprobados localmente. No rehacer recorridos ni fusionar ramas acumulativas como avances independientes.
- Antes de editar comprobar Git y localizar la función en v1.0 y avances posteriores. Indicar componente reutilizado, servicio a conectar y criterio de cierre. Conectar y adaptar lo existente primero.
- Prioridad vigente: punto 3, correcciones del expediente en ficha original. Revisar validación/datos legales/contacto/identidad y protección de tutor/menores antes de implementar; no cambiar correo o vínculos de acceso implícitamente. Punto 2 YA integrado en Equipo administrador: solo rol admin completo, reautenticación, pendientes por invitación, estados, protección propia/última cuenta y revocación. Migración 11; recuperación filtra estados y login compara revisión tras scrypt. No introducir jerarquía/propietario ni reconstruir equipo. Usar solo fixtures aisladas: admin-team-browser-server para equipo/activación, admin-recovery-browser-server para recuperación, admin-security-browser-server para contraseña y student-profile-browser-server para perfil. Nunca cambiar acceso habitual o archivo inicial durante pruebas. Mantener revalidación de sesión después de cuerpos/tareas asíncronas. Diez alertas de herramientas pendientes sin fix --force/override incompatible. Google/correo, invitaciones/recuperación reales y verificación de responsables, contenido/consentimientos, validación humana y alojamiento al final.
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
