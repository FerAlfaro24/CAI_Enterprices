# CAI — sitio institucional, comunidad y administración

**Empieza por [docs/START_HERE.md](docs/START_HERE.md).** Permite recuperar el proyecto sin conversaciones de ChatGPT: rama, instalación, pruebas y decisiones pendientes.

**Estado al 17 de noviembre de 2026:** aplicación integrada y persistente localmente, esquema SQLite 16. Base funcional verificada: `fix/v1-dev-preview-cache` / `3971284`. Esta documentación está en `docs/continuidad-auditoria-2026-11-17`, [PR #9](https://github.com/FerAlfaro24/CAI_Enterprices/pull/9), e incluye el mismo código de aplicación. `main` es antigua y `release/cai-demo-v1.0` la referencia visual congelada. No es una entrega productiva.

## Qué funciona localmente

- Sitio institucional y contacto persistente; material comercial definitivo por validar.
- Solicitud, tutor, revisión, activación, contraseña, suspensión, perfiles y expediente.
- Panel v1.0 conectado: alumnos, grupos, ajustes, equipo, bandejas y moderación.
- Comunidad por grupo: publicaciones, comentarios revisados, reacciones e imágenes privadas.
- Retos: **180 preguntas/45 temas**, tres al día, explicaciones, puntos, constancia y repaso.
- Insignias: **nueve**, automáticas o concedidas por CAI, solicitudes/correcciones privadas y compartición voluntaria moderada.
- SQLite, migraciones, copias/verificación, avisos y recuperación locales.

Google real, entrega real de correo, preparación productiva, contenidos/autorizaciones y aceptación de CAI siguen pendientes. **Vídeos: menor prioridad y opcionales; no implementados.** Si se retoman, solo coordinación sube y el grupo autorizado ve.

## Recuperar el proyecto

Repositorio privado: autentícate mediante el gestor de credenciales de GitHub que utilices; no pongas tokens en comandos o archivos. En un clon nuevo, PowerShell:

```powershell
git clone https://github.com/FerAlfaro24/CAI_Enterprices.git
cd CAI_Enterprices
git switch --track origin/docs/continuidad-auditoria-2026-11-17
code .
npm.cmd ci
```

Node >=24.12.0 y npm >=10. Seguir [RUN_LOCAL.md](docs/RUN_LOCAL.md) para elegir fixture nueva separada o instalación propia. No preparar/migrar la base habitual para probar. `npm.cmd` evita el bloqueo de npm.ps1 sin cambiar la política de PowerShell.

## Documentación vigente

| Necesito… | Documento |
| --- | --- |
| Recuperar el contexto | [Empieza aquí](docs/START_HERE.md) |
| Estado y evidencia | [PROJECT_STATE](docs/PROJECT_STATE.md) |
| Entender las 37 ramas auditadas | [BRANCHES](docs/BRANCHES.md) |
| Prioridades y dependencias | [NEXT_STEPS](docs/NEXT_STEPS.md) |
| Instalar/probar sin datos habituales | [RUN_LOCAL](docs/RUN_LOCAL.md) |
| Pruebas y resultados históricos | [TESTING](docs/TESTING.md) |
| Encontrar cualquier documento | [Índice completo](docs/DOCUMENTATION_INDEX.md) |
| Usar el panel | [Guía administrativa](docs/guia-administracion.md) |
| Conservar datos | [Respaldos](docs/respaldo-recuperacion-local.md) |
| Instrucciones para agentes | [AGENTS](AGENTS.md) |

Última suite API **registrada**: 193 resultados correctos en Insignias. La revisión anterior de 134 API/844 comprobaciones y las matrices posteriores son cortes distintos; no se suman como una prueba nueva. Ver TESTING.

## Trabajo y límites

Conservar diseño y componentes de v1.0. Trabajar por ramas y revisar antes de integrar. Actualizar documentación junto al código. No reconstruir funciones porque un informe antiguo las describa como demo. Nunca subir bases/WAL/SHM, accesos, sesiones, secretos o datos reales de alumnos; `.local/` está ignorada.

Esta auditoría es documental: no cambia aplicación/dependencias/datos ni fusiona PR, actualiza main o despliega. [NEXT_STEPS](docs/NEXT_STEPS.md) describe la preparación pendiente de producción.
