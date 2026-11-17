# CAI — Empieza aquí (continuidad independiente del chat)

**Corte de inventario: 17 de noviembre de 2026.** Este documento es el punto de entrada para una persona o agente que no conoce las conversaciones previas. Describe hechos comprobados en las referencias remotas y separa pendientes de decisiones.

## Qué es CAI

Centro de Asesorías Integrales: sitio público de enseñanza de inglés, comunidad privada de alumnos y administración de solicitudes, alumnos, grupos y contenido. Participan potencialmente menores; **no conectar estudiantes reales ni publicar el sistema** sin consentimiento, infraestructura, privacidad y validación operacional.

## Qué rama abrir

- **Para estudiar el diseño v1.0 congelado:** `release/cai-demo-v1.0` (`f3ba46b`). Referencia visual, no el avance funcional más completo.
- **Para continuar el trabajo local acumulado:** `chore/v1-final-review` (`fee87d1` al corte). Incluye la integración, los ajustes y la revisión final local documentada. **No es producción**.
- **Para revisar esta actualización documental:** `docs/continuidad-auditoria-2026-11-17`, nacida de `chore/v1-final-review`; integrar mediante PR tras revisión.
- **No empezar desde `main` para desarrollar la última versión:** `main` (`a3c2569`) está 59 commits detrás de `chore/v1-final-review` por comparación de GitHub al corte; es antecesora, no el avance funcional completo.

Ver [inventario y tratamiento de ramas](BRANCHES.md). No fusionar todas las ramas `feat/*`: muchas son pasos acumulativos o versiones superadas de los mismos módulos.

## Estado funcional en lenguaje preciso

| Módulo | Estado en la revisión final | Límite |
| --- | --- | --- |
| Sitio institucional | Landing y navegación visual integradas | Información comercial y fotografías definitivas requieren aprobación |
| Solicitudes y cuentas | Registro, revisión, activación, sesiones, suspensión, expedientes y control de permisos locales | Verificación humana de tutores, Google/correo reales y producción pendientes |
| Administración | Dashboard oficial conectado, equipo administrador, grupos, bandejas y moderación | Prueba de usabilidad con quien administrará CAI pendiente |
| Comunidad | Feed autenticado, publicaciones de texto moderadas y galería privada por permisos locales | Retos, insignias, comentarios/reacciones pertenecen a demo o alcance no aprobado para persistencia |
| Datos y operación | SQLite local, pruebas y herramientas de respaldo/verificación | No existe despliegue apto para estudiantes; restauración productiva y operación pendientes |

**Evidencia histórica:** [revisión final local](v1-final-review.md): 134 pruebas API y 844 comprobaciones de navegador (24 recorridos completos); dos intentos Opera incompletos que pasaron en nueva ejecución sin causa inicial confirmada; fotografías externas no verificadas en inspección. Esto **no** implica que las pruebas se hayan vuelto a ejecutar en esta rama documental.

## Abrir en VS Code sin tocar datos existentes

```bash
git clone https://github.com/FerAlfaro24/CAI_Enterprices.git
cd CAI_Enterprices
git fetch origin
git switch --track origin/chore/v1-final-review
npm ci
npm run dev:local
```

Requiere Node.js **>=24.12.0** y npm **>=10**. El servidor local está previsto en `http://127.0.0.1:5173`. **Si ya hay una instalación local, no volver a ejecutar `local:setup` ni sustituir su base o credenciales.** Antes de configurar un equipo nuevo, leer [backend local](local-backend.md), [gestión administrativa](guia-administracion.md) y [respaldos](respaldo-recuperacion-local.md). En PowerShell puede usarse `npm.cmd` cuando `npm.ps1` esté bloqueado.

Comprobaciones de código, cuando corresponda: `npm run lint`, `npm run typecheck`, `npm run build` y `npm run test:api`. Las pruebas de navegador requieren sus servidores/fixtures aislados descritos en los informes; **no ejecutarlas contra la base habitual**. Esta actualización no ejecutó pruebas: solo inspección documental remota.

## Lecturas obligatorias y orden

1. **Esta página** para orientación.
2. [PROJECT_STATE.md](PROJECT_STATE.md) para decisiones, historial detallado y último punto de retorno.
3. [BRANCHES.md](BRANCHES.md) para elegir rama y evitar fusiones duplicadas.
4. [NEXT_STEPS.md](NEXT_STEPS.md) para prioridades, responsables y bloqueos.
5. [v1-final-review.md](v1-final-review.md) para evidencia, incidencias y límites.
6. `AGENTS.md` para normas de desarrollo; guías técnicas especializadas según la tarea.

## Reglas de continuidad

- Documentar **en la misma PR** cada cambio funcional: qué cambió, rama/base, pruebas realmente ejecutadas, riesgos, estado y siguiente paso.
- No reemplazar diseño oficial con pantallas prototipo antiguas. No dar por completado un producto porque existe una demo.
- Los documentos de fases `community-phase-*`, `prototype-plan.md`, `frontend-foundation.md`, `landing-implementation.md` y otros informes de funcionalidades terminadas son **bitácoras históricas**, no instrucciones vigentes por sí solos. No borrarlos sin revisión.
- Nunca introducir secretos, datos de estudiantes, bases de datos o credenciales en Git. No hacer merge, borrar ramas ni desplegar por inferencia.
- Si esta guía y el código difieren, inspeccionar la rama y registrar la corrección documental antes de trabajar.
