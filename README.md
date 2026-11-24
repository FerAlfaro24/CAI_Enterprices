# CAI — sitio institucional, comunidad y administración

**Estado vigente — 24-11-2026, cierre F3b/F4:** continuación `feat/v1-publisher-notice-carousel`, código `5b6d31c` (núcleo `e217fdc`, [PR #32](https://github.com/FerAlfaro24/CAI_Enterprices/pull/32), borrador). Incluye F4a `dac485f` ([PR #33](https://github.com/FerAlfaro24/CAI_Enterprices/pull/33)), F3a y F1/F2. Logros en un formulario simple; comentarios nuevos inmediatos con borrado propio; sección principal Crear publicación; eliminación administrativa con motivo; carrusel solo de avisos vigentes, más reciente primero y avance cada 5s. **323 pruebas de servidor y 184 comprobaciones UI** (62 Logros + 122 publicador/comentarios, Brave/Opera), lint/tipos/build correctos. Esquema22 sin nueva migración. [Entrega y límites](docs/NEXT_STEPS.md#entrega-f3b-y-f4-logros-comentarios-y-publicador--24-11-2026). **Siguiente F5: Retos**, sin Top hasta decisión del cliente. Google/correo reales y alojamiento siguen pendientes. Datos habituales y demo sin modificar. Las notas fechadas anteriores describen sus versiones, no la continuación vigente.

**Entrega anterior F3a — 24-11-2026:** F3a comprobado en `feat/v1-community-moderation`, código `cb19d59` ([PR #31](https://github.com/FerAlfaro24/CAI_Enterprices/pull/31), borrador), desde `2129b5d` de F2. Administración → **Ver comunidad** permite recorrer publicaciones/fotos/comentarios, eliminar un comentario y suspender el acceso de su autor por 1/3/7/30 días o permanentemente, de forma independiente. Incluye suspensiones activas, levantamiento e historial. Esquema22; **307 pruebas de servidor y 90 comprobaciones UI** (45 Brave/45 Opera), lint/tipos/build correctos. [Entrega y límites](docs/NEXT_STEPS.md#entrega-f3a-moderación-y-suspensiones--24-11-2026). **Siguiente F3b:** comentarios inmediatos y borrado propio directo; la revisión previa sigue activa en esta entrega. Top pendiente del cliente; Google/correo reales y alojamiento pendientes. Sin migrar datos habituales ni actualizar/renovar la demo. Las notas fechadas anteriores son antecedentes, no la continuación vigente.

**Registro y comunidad compartida comprobados:** `feat/v1-shared-community`, código `3a7fdb3`, esquema 21. [Entrega, pruebas y adopción](docs/NEXT_STEPS.md#entrega-f1b-y-f2-registro-y-comunidad-compartida--23-11-2026).294 pruebas de servidor/98 de navegador; la demostración remota conserva la versión anterior.


**F1a comprobado:** `feat/v1-access-usability`, código `ce3160d`: activación y recuperación de alumnos con mínimo 8, mostrar/ocultar y confirmación inmediata; 58 pruebas de servidor/94 navegador, lint y build. [Entrega y próximos bloques](docs/NEXT_STEPS.md#entrega-f1a-activación-y-contraseñas--23-11-2026). El enlace remoto sigue en su versión anterior; Top pendiente del cliente.


**23-11, entrada pública autorizada:** continuación `fix/v1-open-preview-entry`, desde `cb84099` de PR #25. [Prueba temporal sin contraseña adicional](docs/REMOTE_DEMO.md#entrada-pública-temporal--23-de-noviembre-de-2026): misma base y claves; enlace nuevo y vencimiento original conservado. Portada/registro libres, comunidad/administración/fotos privadas con cuenta. 13 pruebas de entrada y 33 comprobaciones HTTPS nuevas, tipos/lint correctos. No renovar la ventana implícitamente.


**Empieza por [docs/START_HERE.md](docs/START_HERE.md).** Permite recuperar el proyecto sin conversaciones de ChatGPT: rama, instalación, pruebas y decisiones pendientes.

**Estado al 23 de noviembre de 2026:** aplicación integrada, SQLite esquema 20. **Continuar en `fix/v1-remote-registration-guidance`**, código `146e061`, desde `2f6a04f` de PR #24. [Registro propio en prueba remota](docs/REMOTE_DEMO.md#registro-propio-de-amigos--23-de-noviembre-de-2026): solicitud, aprobación y activación para elegir contraseña, con textos adecuados al enlace compartido. 24 API dirigidas y 17 HTTPS nuevas, lint/tipos/build. Incluye [administración revisada](docs/ADMIN_USABILITY_REVIEW.md) y las funciones de comunidad anteriores; sus cifras conservan su propio corte. Aceptación humana, servicios reales e infraestructura definitiva pendientes. Las fotos y accesos de la copia temporal están fuera de Git. `main` es antigua y `release/cai-demo-v1.0` conserva la referencia visual congelada.

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
git switch --track origin/fix/v1-remote-registration-guidance
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
