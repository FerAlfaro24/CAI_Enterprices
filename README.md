# CAI — sitio institucional, comunidad y administración

**Piloto conectado — 25-11:** [Abrir CAI en Railway](https://cai-piloto-production.up.railway.app/), rama `ops/cai-railway-pilot-2026-11-25`, código `ad075df`, PR#44. Web/registro, persistencia tras reinicio y respaldo Linux comprobados. Google y correos automáticos aún pendientes de cierre; [estado y pasos concretos](docs/RAILWAY_PILOT.md). Preparación para lunes30, 2–3 personas; no depende de mantener la computadora encendida. Vercel conserva su presentación independiente.

**Continuación para entrega:** `release/cai-v1-candidate-2026-11-25`, desde la integrada `04bb0df`. Leer [RELEASE_CANDIDATE](docs/RELEASE_CANDIDATE.md) y [HOSTING_OPTIONS](docs/HOSTING_OPTIONS.md). No fusionar adaptador, cuentas o ejemplos ficticios de la presentación. La muestra Vercel sigue publicada aparte en `feat/demo-community-content`/PR#41. Solo opciones gratuitas; no crear cuentas, activar facturación o adoptar bases implícitamente. Cliente aprobó presentación/diseño general, no operación productiva. Top y vídeos conservan su estado pendiente.


## Versión integrada más completa

**Continuar en `integration/cai-v1-completa-2026-11-25`.** Esta rama reúne la v1.0 y todos los avances posteriores incorporados hasta `ae634d6`, incluidos Google y correos reales comprobados en local. No es todavía una entrega desplegada en producción.

Empieza por [START_HERE](docs/START_HERE.md). [Versión integrada](docs/INTEGRATED_VERSION.md) documenta alcance, auditoría de ramas y límites; [próximos pasos](docs/NEXT_STEPS.md) indica lo pendiente. Las ramas de funciones quedan como puntos de retorno y antecedentes. `main` y `release/cai-demo-v1.0` se conservan.

## Qué contiene

- **Sitio público y registro:** página institucional, contacto persistente, solicitud por clase, matrícula automática, aprobación y activación de alumnos.
- **Comunidad compartida:** publicaciones, comentarios inmediatos y borrado propio, reacciones, perfiles, galería privada y visor de fotos completas; todos los aprobados comparten comunidad entre clases.
- **Logros, insignias y Retos:** actividades personales de lectura/cine/música con imágenes y guardado privado, validación/publicación voluntarias,21 insignias progresivas y tres actividades diarias de inglés sobre180 preguntas/45 temas, puntos/resultados/repaso privados.
- **Administración:** panel conectado, alumnos/expediente, equipo, ajustes, solicitudes, publicaciones, avisos con imágenes/carrusel, moderación contextual y suspensiones temporales o permanentes.
- **Accesos y correo:** contraseña de alumno desde8 caracteres, Google y vinculación segura de cuentas anteriores, activación/recuperación por SMTP con estado/reintento y alternativa manual.
- **Backend y datos:** Node/SQLite, esquema23, controles de acceso, auditoría, respaldo/verificación y preparación técnica para proxy HTTPS.

Google institucional real ya llegó a comunidad en una muestra local. Dos correos reales de activación/recuperación llegaron a Gmail; botones, activación, login, cambio de contraseña y uso único comprobados. Ver [evidencia y configuración](docs/GOOGLE_EMAIL.md). Esto no habilita automáticamente un dominio público o cualquier cuenta Google en un clon nuevo.

## Clonar en Windows

```powershell
git clone --branch integration/cai-v1-completa-2026-11-25 https://github.com/FerAlfaro24/CAI_Enterprices.git
cd CAI_Enterprices
npm.cmd ci
code .
```

Node >=24.12.0, npm >=10 y Git. Si GitHub solicita autenticación, usar su gestor de credenciales; no introducir tokens en comandos o archivos. `npm.cmd` evita el bloqueo de `npm.ps1` sin cambiar políticas del sistema.

Para abrir una muestra nueva y separada, seguir [RUN_LOCAL](docs/RUN_LOCAL.md). No arrancar una base existente para comprobar una rama: iniciar el backend puede migrarla. No hay una contraseña real universal en GitHub.

## Datos y configuración separados

Las contraseñas, claves de envío, bases, enlaces de acceso y fotos privadas de Galería permanecen fuera de Git. Una rama conserva el código y documentación, no copia ese material. Para las seis fotos privadas se necesita el [paquete oficial privado](docs/OFFICIAL_MEDIA.md); para Google/correo, la [configuración institucional](docs/GOOGLE_EMAIL.md). No publicar esos archivos como recursos del frontend.

## Pendiente antes de la entrega pública

- Sustituir de forma privada la credencial de correo compartida y preparar responsables/recuperación bajo control de CAI.
- Elegir dominio/alojamiento y adoptar datos/esquema23 con respaldo, HTTPS, configuración de correo y orígenes/estado de Google del entorno definitivo.
- Verificar allí recepción, acceso y operación desde otros dispositivos, además de aceptación y material/textos finales de CAI.

El Top espera decisión del cliente. Vídeos opcionales no implementados. El enlace temporal anterior no estaba activo en su última comprobación; no renovarlo implícitamente.

## Comprobaciones registradas

Antes de crear esta rama se registraron351 resultados distintos de servidor,52 comprobaciones UI finales (Brave/Opera) y13 verificaciones nuevas del recorrido SMTP real, además de las verificaciones en Gmail y Google reales locales. No se repitieron esas tandas para renombrar/copiar el estado. La creación de esta rama comprueba cobertura de Git, igualdad del código funcional y enlaces/documentación, sin abrir o migrar datos.

[Inventario de ramas](docs/BRANCHES.md) · [Estado del proyecto](docs/PROJECT_STATE.md) · [Índice documental](docs/DOCUMENTATION_INDEX.md) · [Normas de agentes](AGENTS.md).

Los encabezados antiguos y sus pendientes se conservan en [README histórico](docs/README_HISTORY-2026-11-25.md); no prevalecen sobre esta entrada.
