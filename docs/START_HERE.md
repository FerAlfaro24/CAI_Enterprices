# CAI — empieza aquí

**Paso actual del piloto:** rama `ops/cai-google-cloud-trial-2026-11-25`, desde candidata `b4a2f46`. Titular autoriza preparar Google Cloud Free Trial para presentación temporal2/3 personas, sin pasar a pago. Leer [GOOGLE_CLOUD_TRIAL](GOOGLE_CLOUD_TRIAL.md). Paso1/2 institucional/México/oferta observado; el titular debe aceptar condiciones y completar verificación de tarjeta. No hay prueba activada ni VM; continuar después de su respuesta, comprobar Free Trial/crédito y no volver a elegir Oracle por notas históricas.


**Continuación para entrega:** `release/cai-v1-candidate-2026-11-25`, desde la integrada `04bb0df`. Leer [RELEASE_CANDIDATE](RELEASE_CANDIDATE.md) y [HOSTING_OPTIONS](HOSTING_OPTIONS.md). No fusionar adaptador, cuentas o ejemplos ficticios de la presentación. La muestra Vercel sigue publicada aparte en `feat/demo-community-content`/PR#41. Solo opciones gratuitas; no crear cuentas, activar facturación o adoptar bases implícitamente. Cliente aprobó presentación/diseño general, no operación productiva. Top y vídeos conservan su estado pendiente.


## Rama para continuar

**`integration/cai-v1-completa-2026-11-25` es el punto integrado más completo al 25-11-2026.** Parte de `ae634d6` de Google/correo, que ya incluye la v1.0 y todos los avances funcionales posteriores. Las actualizaciones propias de la consolidación son documentales; no se vuelve a fusionar cada rama.

[Versión integrada y auditoría](INTEGRATED_VERSION.md) contiene el inventario y la evidencia. `release/cai-demo-v1.0` conserva la referencia visual histórica; `main` sigue sin sustituirse. Crear las siguientes ramas de trabajo desde esta integrada y registrar su alcance antes de desarrollar.

## Recuperar el proyecto

```powershell
git --version
node --version
npm.cmd --version
git clone --branch integration/cai-v1-completa-2026-11-25 https://github.com/FerAlfaro24/CAI_Enterprices.git
cd CAI_Enterprices
npm.cmd ci
code .
```

Node >=24.12.0 y npm >=10. Para un clon existente, comprobar `git status`, guardar sus cambios y actualizar referencias antes de seleccionar esta rama; no reset/clean. Usar el gestor de GitHub cuando solicite autenticación y no poner tokens en comandos. `npm.cmd` evita restricciones de `npm.ps1` sin cambiar la configuración del equipo.

## Abrir una muestra segura

[RUN_LOCAL](RUN_LOCAL.md) explica cómo iniciar una fixture nueva de comunidad, separada de `.local/cai.sqlite`, con cuenta exclusivamente ficticia. No ejecutar setup o backend sobre una instalación previa para probar la rama. La versión actual requiere esquema23 en sus nuevas fixtures; las bases antiguas no retroceden al cambiar de rama.

Rutas: `/` portada, `/registro` solicitud, `/login` alumno, `/community` comunidad protegida, `/admin` panel. El alumno necesita aprobación y acceso activado; administrar no crea una sesión de alumno. Verificar renderizado además de HTTP. No hay un servidor o enlace público que se mantenga activo por tener esta documentación.

## Qué está integrado

Sitio público, registro simplificado, comunidad compartida entre clases, panel completo, alumnos/expediente/equipo, publicaciones/avisos/carrusel, comentarios inmediatos y moderación, reacciones, fotos privadas/visor, perfiles, Logros con imágenes,21 insignias y Retos diarios de inglés. Backend y SQLite esquema23; Google y envío real por SMTP comprobados en muestras locales.

No volver a desarrollar funciones por leer los próximos pasos de un informe antiguo. [PROJECT_STATE](PROJECT_STATE.md) y los informes especializados detallan sus pruebas y límites.

## Qué queda fuera de un clon

Credenciales, configuración real de Google/SMTP, bases, buzones/enlaces de prueba y las seis fotos privadas de Galería. Se conservan por separado y no deben ir a Git. Un clon necesita la configuración de su propio entorno; no habilita automáticamente el acceso de Google o correos reales.

Las fotos requieren [material oficial privado](OFFICIAL_MEDIA.md). Los accesos requieren [configuración de Google/correo](GOOGLE_EMAIL.md). No reemplazar fotos reales por imágenes generadas ni publicarlas en frontend para eludir permisos.

## Qué sigue

1. Sustituir privadamente la credencial de correo compartida y asegurar titular/recuperación de CAI.
2. Elegir y preparar dominio/servidor y configuración institucional definitiva; adoptar datos/esquema23 con respaldo y autorización, sin migración implícita.
3. Probar allí alta/aprobación/correos/login/recuperación y permisos desde distintos dispositivos; cerrar aceptación y material/textos de CAI.

Top pendiente del cliente; vídeos opcionales no implementados. El túnel anterior no está confirmado como activo y no se debe reanudar o renovar implícitamente.

## Documentos de referencia

- [INTEGRATED_VERSION](INTEGRATED_VERSION.md): qué contiene esta rama y cómo se comprobó su cobertura.
- [PROJECT_STATE](PROJECT_STATE.md), [BRANCHES](BRANCHES.md), [NEXT_STEPS](NEXT_STEPS.md): hechos, ramas y prioridades.
- [RUN_LOCAL](RUN_LOCAL.md), [TESTING](TESTING.md), [GOOGLE_EMAIL](GOOGLE_EMAIL.md), [guía de producción](PRODUCTION_PREPARATION.md): operación y evidencia.
- [DOCUMENTATION_INDEX](DOCUMENTATION_INDEX.md) y [AGENTS](../AGENTS.md): índice y normas.

La [guía anterior](START_HERE_HISTORY-2026-11-25.md) conserva sus fechas/estados como antecedente, sin prioridad operativa.
