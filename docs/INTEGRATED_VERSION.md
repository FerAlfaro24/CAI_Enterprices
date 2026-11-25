# CAI — versión integrada del 25 de noviembre de 2026

## Punto de continuación

**Rama: `integration/cai-v1-completa-2026-11-25`.** Copia completa desde `ae634d6`, cierre de Google/correo real de `feat/v1-google-email-onboarding`. La consolidación actualiza guías; código de producto, pruebas y herramientas heredados permanecen idénticos a esa base. No es una publicación en producción ni sustituye main o la v1.0 congelada.

## Cobertura comprobada

Se actualizaron las referencias con `git fetch origin` y se examinaron las ramas locales y remotas antes de publicar la nueva. La v1.0 (`release/cai-demo-v1.0`, `f3ba46b`) es antecesora de esta versión. Todas las ramas locales revisadas están incluidas por ascendencia.

Ramas remotas revisadas antes de publicar: **64**. **61** están incluidas por ascendencia, **2** tienen cambios equivalentes ya incorporados y **1** corresponde a documentos iniciales de octubre sustituidos por sus versiones vigentes. No quedaron avances funcionales exclusivos identificados fuera de la base. No se hicieron merges/cherry-picks de ramas antiguas.

Las implementaciones antiguas frontend-foundation y landing-page se contrastaron con `git cherry`: sus commits aparecen con `-` (parche equivalente). La rama project-foundation solo añade los seis archivos iniciales AGENTS, README, .gitignore, visión, requisitos y plan; todos existen en la versión actual, con guías posteriores. No reintroducir esas instrucciones antiguas como pendientes ni sobrescribir su evolución.

El [inventario JSON](integration-audit-2026-11-25.json) conserva SHA, estado de cada rama, fuente y referencias protegidas para reproducir el análisis. No incluye credenciales, direcciones de acceso temporal o datos de alumnos.

## Qué reúne

- Base visual v1.0 y todas sus mejoras posteriores de navegación, diseño y administración.
- Backend de acceso, aprobación/activación/recuperación, administración/equipo/expedientes, configuración, auditoría y respaldo.
- Comunidad conectada, comentarios inmediatos/borrado propio, reacciones, moderación y sanciones, galería privada/visor, perfiles, Logros e insignias.
- F1–F6: registro simplificado por clase y matrícula automática; comunidad común; moderación y comentarios; Logros/publicador/avisos; Retos diarios; Google y correo.
- Google y dos correos reales de Gmail comprobados en local, con vinculación segura de cuentas anteriores y configuración SMTP privada. Esquema23 en fixtures nuevas.

## Evidencia y límites

Tandas heredadas:351 resultados distintos de servidor,52 UI finales Brave/Opera,13 verificaciones nuevas del recorrido SMTP real; Gmail y Google reales locales comprobados por UI. [Informe F6](GOOGLE_EMAIL.md) separa pruebas simuladas y reales. No se reejecutan para esta copia documental; se comprueban ascendencia, parches equivalentes, igualdad de archivos funcionales, referencias protegidas y enlaces locales.

Las fotos privadas, credenciales, configuración institucional, SQLite y buzones/enlaces de QA **no están en Git**. Integración del código no equivale a trasladar esos datos ni a configurar otro equipo. La copia temporal22 anterior permanece separada/inactiva; no se migra para esta entrega.

Pendiente: rotar la credencial compartida, dominio/alojamiento/configuración final de Google y SMTP, adopción controlada de datos23 y pruebas externas/aceptación de CAI. Top espera decisión del cliente; vídeos opcionales sin implementar. [Guía inicial](START_HERE.md) y [siguientes pasos](NEXT_STEPS.md).

## Inventario remoto en el momento de la revisión

| Rama | Commit | Cobertura |
| --- | --- | --- |
| `origin/chore/project-foundation` | `e3ac8fd626` | Documentación inicial sustituida |
| `origin/chore/v1-final-review` | `fee87d14c3` | Incluida por ascendencia |
| `origin/chore/v1-stabilization` | `7daa6231fe` | Incluida por ascendencia |
| `origin/chore/v1-tooling-audit` | `9274dc90aa` | Incluida por ascendencia |
| `origin/docs/auditoria-v1-integracion` | `be90193a43` | Incluida por ascendencia |
| `origin/docs/continuidad-auditoria-2026-11-17` | `b55cd503c1` | Incluida por ascendencia |
| `origin/docs/v1-community-expansion` | `e1b2a0fccc` | Incluida por ascendencia |
| `origin/docs/v1-friends-feedback-plan` | `12b088ba21` | Incluida por ascendencia |
| `origin/docs/v1-learning-adventures-plan` | `0729cc5b13` | Incluida por ascendencia |
| `origin/feat/admin-dashboard` | `f38b17c720` | Incluida por ascendencia |
| `origin/feat/admin-guided-requests` | `a54e4019b2` | Incluida por ascendencia |
| `origin/feat/auth-pages` | `f38b17c720` | Incluida por ascendencia |
| `origin/feat/community` | `a6d9603fae` | Incluida por ascendencia |
| `origin/feat/community-visual-polish` | `12cf1ce925` | Incluida por ascendencia |
| `origin/feat/frontend-foundation` | `eca282fe73` | Parche equivalente incorporado |
| `origin/feat/google-signin-onboarding` | `35cfe1c8a6` | Incluida por ascendencia |
| `origin/feat/landing-page` | `a37bb0834c` | Parche equivalente incorporado |
| `origin/feat/local-access-backend` | `f3f07b97b7` | Incluida por ascendencia |
| `origin/feat/local-password-recovery` | `1b84fb303d` | Incluida por ascendencia |
| `origin/feat/local-publications-moderation` | `a60d0a6a54` | Incluida por ascendencia |
| `origin/feat/student-account-activation` | `e92fff8a34` | Incluida por ascendencia |
| `origin/feat/v1-access-usability` | `f0191478a4` | Incluida por ascendencia |
| `origin/feat/v1-achievements-progressive-badges` | `0b730329aa` | Incluida por ascendencia |
| `origin/feat/v1-admin-account-security` | `34b78b4d10` | Incluida por ascendencia |
| `origin/feat/v1-admin-recovery` | `88ef627c19` | Incluida por ascendencia |
| `origin/feat/v1-admin-team` | `7e404a38e7` | Incluida por ascendencia |
| `origin/feat/v1-admin-usability-review` | `cbf9a414c1` | Incluida por ascendencia |
| `origin/feat/v1-community-badges` | `bdef066fae` | Incluida por ascendencia |
| `origin/feat/v1-community-challenges` | `980a1ec736` | Incluida por ascendencia |
| `origin/feat/v1-community-comments` | `46466b78a3` | Incluida por ascendencia |
| `origin/feat/v1-community-connected` | `9a5ef81fc4` | Incluida por ascendencia |
| `origin/feat/v1-community-header-highlights` | `3b368e8f3a` | Incluida por ascendencia |
| `origin/feat/v1-community-home-stories` | `f9c3c1ac73` | Incluida por ascendencia |
| `origin/feat/v1-community-moderation` | `b9d79551c7` | Incluida por ascendencia |
| `origin/feat/v1-community-playful-design` | `d6e66fd076` | Incluida por ascendencia |
| `origin/feat/v1-community-reactions` | `edba92faf8` | Incluida por ascendencia |
| `origin/feat/v1-community-social-feed` | `ffb323d6b1` | Incluida por ascendencia |
| `origin/feat/v1-daily-challenges-refresh` | `15d3a94104` | Incluida por ascendencia |
| `origin/feat/v1-google-email-onboarding` | `ae634d6727` | Incluida por ascendencia |
| `origin/feat/v1-groups-settings` | `e083c8fd48` | Incluida por ascendencia |
| `origin/feat/v1-inbox-recovery-contact` | `db45ac6ccb` | Incluida por ascendencia |
| `origin/feat/v1-learning-form-simplification` | `dac485f6a5` | Incluida por ascendencia |
| `origin/feat/v1-official-media` | `422b4d25ca` | Incluida por ascendencia |
| `origin/feat/v1-photo-viewer-notification-history` | `c3d4d826fd` | Incluida por ascendencia |
| `origin/feat/v1-private-gallery` | `361e23a039` | Incluida por ascendencia |
| `origin/feat/v1-production-preparation` | `d4102478c6` | Incluida por ascendencia |
| `origin/feat/v1-publisher-notice-carousel` | `5f5ce0afef` | Incluida por ascendencia |
| `origin/feat/v1-registration-simplification` | `0247632fa7` | Incluida por ascendencia |
| `origin/feat/v1-remote-demo` | `4cdae44aeb` | Incluida por ascendencia |
| `origin/feat/v1-shared-community` | `2129b5d676` | Incluida por ascendencia |
| `origin/feat/v1-student-profile` | `d8df768f8c` | Incluida por ascendencia |
| `origin/feat/v1-student-record` | `c712abbf23` | Incluida por ascendencia |
| `origin/feat/v1-unified-navigation` | `5405c1c440` | Incluida por ascendencia |
| `origin/fix/v1-dev-preview-cache` | `3971284f30` | Incluida por ascendencia |
| `origin/fix/v1-gallery-all-photos` | `d7ef78145e` | Incluida por ascendencia |
| `origin/fix/v1-open-preview-entry` | `c59ec6c78d` | Incluida por ascendencia |
| `origin/fix/v1-remote-registration-guidance` | `cb840994d9` | Incluida por ascendencia |
| `origin/integration/cai-v1-connected` | `cf12d8ad6f` | Incluida por ascendencia |
| `origin/main` | `a3c2569d0f` | Incluida por ascendencia |
| `origin/release/cai-demo-v1.0` | `f3ba46b25f` | Incluida por ascendencia |
| `origin/style/v1-final-interface-polish` | `fb28061476` | Incluida por ascendencia |
| `origin/test/v1-client-presentation-2026-11-24` | `aabd5bc6b6` | Incluida por ascendencia |
| `origin/test/v1-friends-remote-2026-11-23` | `2f6a04ff68` | Incluida por ascendencia |
| `origin/test/v1-integral-review-2026-11-17` | `95e53e258f` | Incluida por ascendencia |
