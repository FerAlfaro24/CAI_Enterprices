# CAI — sitio institucional, comunidad y administración

**Empieza por [docs/START_HERE.md](docs/START_HERE.md).** Permite recuperar el proyecto sin conversaciones de ChatGPT: rama, instalación, pruebas y decisiones pendientes.

**Estado al 22 de noviembre de 2026:** aplicación integrada, SQLite esquema 20. **Continuar en `feat/v1-admin-usability-review`**, desde `c3d4d82` de PR #22; código `e255f91`. [Administración revisada](docs/ADMIN_USABILITY_REVIEW.md): tareas directas, configuración por apartados, ficha clara, búsqueda/filtros y fotos en moderación. 272 API y 370 comprobaciones UI de esta entrega. Incluye las correcciones de fotos/Retos/notificaciones y las funciones anteriores. [Guía para coordinación](docs/guia-administracion.md). Aceptación humana, servicios externos e infraestructura definitiva pendientes; fotos privadas fuera de Git. `main` es antigua y `release/cai-demo-v1.0` conserva la referencia visual congelada.

## Qué funciona localmente

- Sitio institucional y contacto persistente; material comercial definitivo por validar.
- Solicitud, tutor, revisión, activación, contraseña, suspensión, perfiles y expediente.
- Panel v1.0 conectado: alumnos, grupos, ajustes, equipo, bandejas y moderación.
- Comunidad: historias de alumnos por grupo y publicaciones de Equipo CAI con fotos/álbumes, avisos y destacados para grupo o todos los aprobados; comentarios/reacciones compartidos entre vistas.
- Retos: **180 preguntas/45 temas**, tres al día, explicaciones, puntos, constancia y repaso.
- Logros: lectura, cine/series y música con imágenes; borrador o completado privado, validación privada y publicación voluntaria moderada.
- Insignias: **21**, progreso por actividades validadas, Retos y publicaciones; concesiones históricas conservadas. Perfil de compañeros con contenido compartido e insignias.
- SQLite, migraciones, copias/verificación, avisos y recuperación locales.

Google real, entrega real de correo, contenido comercial y validaciones finales, aceptación de CAI y validación del alojamiento siguen pendientes. La base técnica del servidor está [preparada y comprobada en simulación](docs/PRODUCTION_PREPARATION.md). **Vídeos: menor prioridad y opcionales; no implementados.** Si se retoman, solo coordinación sube y el grupo autorizado ve.

## Recuperar el proyecto

GitHub muestra este repositorio como público al 19-11-2026. Para operaciones autenticadas, utiliza el gestor de credenciales de GitHub; no pongas tokens en comandos o archivos. En un clon nuevo, PowerShell:

```powershell
git clone https://github.com/FerAlfaro24/CAI_Enterprices.git
cd CAI_Enterprices
git switch --track origin/feat/v1-admin-usability-review
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
| Revisión integral nueva y hallazgos | [Informe del 17 de noviembre](docs/v1-integral-review-2026-11-17.md) |
| Configuración y preparación del alojamiento | [PRODUCTION_PREPARATION](docs/PRODUCTION_PREPARATION.md) |
| Encontrar cualquier documento | [Índice completo](docs/DOCUMENTATION_INDEX.md) |
| Usar el panel | [Guía administrativa](docs/guia-administracion.md) |
| Conservar datos | [Respaldos](docs/respaldo-recuperacion-local.md) |
| Instrucciones para agentes | [AGENTS](AGENTS.md) |

**Última tanda:** 217 API aprobadas, lint/tipos/build y 104 comprobaciones de navegador seleccionadas —54 de producción simulada y 50 locales, Brave/Opera—. La revisión integral anterior de 1,314 no se repitió completa ni se suma a estas 104. Simular el origen HTTPS no valida un certificado o proveedor real. Resultados y límites en la guía productiva y TESTING.

## Trabajo y límites

Conservar diseño y componentes de v1.0. Trabajar por ramas y revisar antes de integrar. Actualizar documentación junto al código. No reconstruir funciones porque un informe antiguo las describa como demo. Nunca subir bases/WAL/SHM, accesos, sesiones, secretos o datos reales de alumnos; `.local/` está ignorada.

La preparación actual cambia servidor, pruebas y documentación, sin añadir dependencias ni alterar interfaz o datos habituales. No fusiona PRs, actualiza main o despliega. [NEXT_STEPS](docs/NEXT_STEPS.md) ordena operación/recuperación y las dependencias externas finales. Las pruebas usan fixtures nuevas; no se reinicia la API habitual.
