# CAI — inventario de ramas

**Corte remoto: 17-11-2026, antes de corregir PR #9.** Se verificaron **37 ramas reales**, excluyendo el alias origin/HEAD y siguiendo la paginación del conector. Git fetch confirmó sus puntas y permitió revisar relaciones/parches/árboles. Los SHAs son fotografías del inicio de esta auditoría; la rama documental avanza en la propia PR.

## Qué utilizar

- **Continuación actual:** `fix/v1-gallery-all-photos`, desde `f9c3c1a`. Restaura las seis fotos como vista inicial; Álbumes opcional, filtros corregidos.
- **Inicio conectado anterior:** `feat/v1-community-home-stories`, desde `422b4d2` de PR #12. Inicio conectado, publicaciones oficiales/álbumes y demo independiente, esquema 18. [Guía](COMMUNITY_HOME_STORIES.md).
- Fotografías anteriores: `feat/v1-official-media`, desde `d410247` de la preparación productiva. Fotos oficiales, galería para todos los aprobados y esquema 17. [Guía](OFFICIAL_MEDIA.md).
- Revisión integral anterior: `test/v1-integral-review-2026-11-17`, desde b55cd50.
- Auditoría documental inicial y código completo: `docs/continuidad-auditoria-2026-11-17`.
- Base funcional de la PR: `fix/v1-dev-preview-cache` / `3971284`.
- Referencia visual: `release/cai-demo-v1.0` / `f3ba46b`.
- Main sigue en `a3c2569`, 74 commits detrás de la base; chore/v1-final-review está 15 detrás. Ninguna es la última línea conectada.

## Ramas añadidas después del corte

`fix/v1-gallery-all-photos` parte de `f9c3c1a` de PR #13. Ajuste de interfaz: ninguna foto eliminada, todas visibles por defecto, apertura directa y categorías interiores. 32 comprobaciones nuevas (16 por navegador), sin volver a ejecutar API. No se mueve main/release ni se fusiona ninguna PR.

`feat/v1-community-home-stories` parte de `422b4d2`, punta de PR #12. Backend `4e60bcd` e interfaz `86df7f6`. Une el Inicio con fotos autorizadas, publicaciones institucionales, álbumes y conversación; crea una demo local con contenido ficticio para la presentación. Esquema 18, 233 API y 76 comprobaciones Brave/Opera. La revisión se dirige a `feat/v1-official-media`, sin fusionar PR anteriores ni mover main/release. [Guía](COMMUNITY_HOME_STORIES.md).

`feat/v1-official-media` parte de `d410247`, punta de PR #11 (`feat/v1-production-preparation`). Integra cuatro imágenes públicas y la carga privada de seis fotos oficiales (archivos privados fuera de Git), audiencia común explícita sin ampliar las fotos antiguas de grupo, importación recuperable e idempotente, y migración 17. 225 API y revisión manual de las vistas afectadas en navegador integrado; Brave/Opera no disponibles en esta sesión. Revisión dirigida a la rama de PR #11; no fusiona las PR anteriores ni cambia main/release. [Guía y límites](OFFICIAL_MEDIA.md).

`feat/v1-production-preparation` parte de 95e53e2, punta de PR #10. [9be8081](https://github.com/FerAlfaro24/CAI_Enterprices/commit/9be8081c6f790e0be4e507154d622ed0a76077e9) prepara configuración, transporte/cookies, operación inicial y pruebas productivas; las guías se actualizan después. 217 API y 104 navegador seleccionadas, sin desplegar. Es el paso productivo anterior y su revisión se dirige a la rama de PR #10; no fusiona esa PR ni mueve main/release. [Guía](PRODUCTION_PREPARATION.md).

`test/v1-integral-review-2026-11-17` parte de b55cd50, punta corregida de PR #9. [8c515de](https://github.com/FerAlfaro24/CAI_Enterprices/commit/8c515ded7a7e60349fff458e629c0d6a5f02a30e) guarda cuatro cambios de pruebas; un commit posterior actualiza las guías y el [informe integral](v1-integral-review-2026-11-17.md). Código de aplicación idéntico a 3971284, con 193 API/1,314 navegador recién comprobados. La revisión se propone hacia la rama documental, conservando ambas historias; no fusiona PR #9 ni mueve main/release. Esta rama es posterior a las 37 referencias de la fotografía siguiente y no altera sus recuentos históricos.

## Todas las ramas auditadas en el corte inicial

| Rama | SHA auditado | Finalidad | Relación con 3971284 |
| --- | --- | --- | --- |
| `chore/project-foundation` | [e3ac8fd](https://github.com/FerAlfaro24/CAI_Enterprices/commit/e3ac8fd6268d50f4e4d663f2def31683b33d38b9) | Historia inicial alternativa; árbol equivalente a e707cdb incluido en la línea funcional. | Árbol inicial equivalente, historia distinta; conservar. |
| `chore/v1-final-review` | [fee87d1](https://github.com/FerAlfaro24/CAI_Enterprices/commit/fee87d14c3ac98df4e2d69a4d927dc8584478b17) | Revisión local anterior; no contiene las cuatro integraciones posteriores. | Ancestro incluido; 15 commits detrás, 0 exclusivos. |
| `chore/v1-stabilization` | [7daa623](https://github.com/FerAlfaro24/CAI_Enterprices/commit/7daa6231fed2caee4d783dbbef7895e80c72e138) | Carga, errores y robustez local. | Ancestro incluido; 33 commits detrás, 0 exclusivos. |
| `chore/v1-tooling-audit` | [9274dc9](https://github.com/FerAlfaro24/CAI_Enterprices/commit/9274dc90aa0ff28a4b5743e9e39cc19789094c5b) | Auditoría histórica de dependencias; corrección de alertas pendiente. | Ancestro incluido; 17 commits detrás, 0 exclusivos. |
| `docs/auditoria-v1-integracion` | [be90193](https://github.com/FerAlfaro24/CAI_Enterprices/commit/be90193a436395fc5f5640985f33d4307635fe8c) | Auditoría inicial de integración; informe histórico. | Ancestro incluido; 54 commits detrás, 0 exclusivos. |
| `docs/continuidad-auditoria-2026-11-17` | [b57311c](https://github.com/FerAlfaro24/CAI_Enterprices/commit/b57311c64da63f31db19521b5e6e1ce8730a31cb) | Actualización documental de esta PR; el SHA listado es su estado anterior a la corrección. | Divergencia documental original: 7 commits propios/15 faltantes; esta PR incorpora la base sin borrar esa historia. |
| `docs/v1-community-expansion` | [e1b2a0f](https://github.com/FerAlfaro24/CAI_Enterprices/commit/e1b2a0fccc81bda9109f960c0079bdd58f5973e1) | Alcance ampliado autorizado; decisiones posteriores en NEXT_STEPS. | Ancestro incluido; 14 commits detrás, 0 exclusivos. |
| `feat/admin-dashboard` | [f38b17c](https://github.com/FerAlfaro24/CAI_Enterprices/commit/f38b17c720a7e946d66b2f18cc7e68817d7a2ef0) | Dashboard visual original; mismo SHA que auth-pages. | Ancestro incluido; 71 commits detrás, 0 exclusivos. |
| `feat/admin-guided-requests` | [a54e401](https://github.com/FerAlfaro24/CAI_Enterprices/commit/a54e4019b25aa56f8b793b5e2c2a4cb74281292b) | Revisión guiada de solicitudes. | Ancestro incluido; 61 commits detrás, 0 exclusivos. |
| `feat/auth-pages` | [f38b17c](https://github.com/FerAlfaro24/CAI_Enterprices/commit/f38b17c720a7e946d66b2f18cc7e68817d7a2ef0) | Acceso visual; misma referencia que admin-dashboard, no trabajo adicional. | Ancestro incluido; 71 commits detrás, 0 exclusivos. |
| `feat/community` | [a6d9603](https://github.com/FerAlfaro24/CAI_Enterprices/commit/a6d9603faefa423a7079357f584590fb61cc0175) | Community visual/simulada inicial. | Ancestro incluido; 72 commits detrás, 0 exclusivos. |
| `feat/community-visual-polish` | [12cf1ce](https://github.com/FerAlfaro24/CAI_Enterprices/commit/12cf1ce92520afbfb175ba9b187290a9ef3e2922) | Pulido editorial, arte, motion y temas de la base visual. | Ancestro incluido; 66 commits detrás, 0 exclusivos. |
| `feat/frontend-foundation` | [eca282f](https://github.com/FerAlfaro24/CAI_Enterprices/commit/eca282fe73a35a9149110e08a9f0f59354bdb35e) | Fundación React/TypeScript/Vite; parche equivalente ya incorporado. | Parche equivalente comprobado; no ancestro por SHA. |
| `feat/google-signin-onboarding` | [35cfe1c](https://github.com/FerAlfaro24/CAI_Enterprices/commit/35cfe1c8a6a38e6087ba973a3c0245b877ce479c) | Google opcional preparado y datos obligatorios; prueba real pendiente. | Ancestro incluido; 58 commits detrás, 0 exclusivos. |
| `feat/landing-page` | [a37bb08](https://github.com/FerAlfaro24/CAI_Enterprices/commit/a37bb0834c5d20ab0f389496033525bf242d4a63) | Landing; parche equivalente ya incorporado. | Parche equivalente comprobado; no ancestro por SHA. |
| `feat/local-access-backend` | [f3f07b9](https://github.com/FerAlfaro24/CAI_Enterprices/commit/f3f07b97b7a871316a8ed053debacffefa47a45e) | Primer servicio HTTP/SQLite y permisos administrativos. | Ancestro incluido; 60 commits detrás, 0 exclusivos. |
| `feat/local-password-recovery` | [1b84fb3](https://github.com/FerAlfaro24/CAI_Enterprices/commit/1b84fb303dfe86b403a2aca6f11571d480c6d163) | Recuperación/avisos locales; paso anterior a conexión completa de v1.0. | Ancestro incluido; 56 commits detrás, 0 exclusivos. |
| `feat/local-publications-moderation` | [a60d0a6](https://github.com/FerAlfaro24/CAI_Enterprices/commit/a60d0a6a54a3b892b443e3f085abc7ec4a1fca63) | Primer servicio persistente de publicaciones y revisión. | Ancestro incluido; 57 commits detrás, 0 exclusivos. |
| `feat/student-account-activation` | [e92fff8](https://github.com/FerAlfaro24/CAI_Enterprices/commit/e92fff8a347c00c2c0a778e36ed5be0ffe9faff5) | Activación, contraseña, sesión y permisos de alumno. | Ancestro incluido; 59 commits detrás, 0 exclusivos. |
| `feat/v1-admin-account-security` | [34b78b4](https://github.com/FerAlfaro24/CAI_Enterprices/commit/34b78b4d10babd529fa53cee39d4613bc984344b) | Cambio de contraseña administrativa propia. | Ancestro incluido; 30 commits detrás, 0 exclusivos. |
| `feat/v1-admin-recovery` | [88ef627](https://github.com/FerAlfaro24/CAI_Enterprices/commit/88ef627c19338ccde34b2ec63df8a7fb4f084c67) | Recuperación administrativa con entrega local/ficticia. | Ancestro incluido; 24 commits detrás, 0 exclusivos. |
| `feat/v1-admin-team` | [7e404a3](https://github.com/FerAlfaro24/CAI_Enterprices/commit/7e404a38e75f9969c3662de656805aad5f9250ee) | Equipo, invitaciones y estados de administradores. | Ancestro incluido; 21 commits detrás, 0 exclusivos. |
| `feat/v1-community-badges` | [bdef066](https://github.com/FerAlfaro24/CAI_Enterprices/commit/bdef066fae18eda0cfb27c15c5df40215334953a) | Insignias persistentes y planificación; contiene todas las anteriores salvo caché posterior. | Ancestro incluido; 1 commits detrás, 0 exclusivos. |
| `feat/v1-community-challenges` | [980a1ec](https://github.com/FerAlfaro24/CAI_Enterprices/commit/980a1ec736a1421e95525b0877d4d309b801a907) | Retos persistentes: banco 180, calendario/progreso/repaso; no solo demo. | Ancestro incluido; 5 commits detrás, 0 exclusivos. |
| `feat/v1-community-comments` | [46466b7](https://github.com/FerAlfaro24/CAI_Enterprices/commit/46466b78a39e88ee73a09dcd9a573ab68db116eb) | Comentarios persistentes: premoderación, historial, retirada y pausas; no solo demo. | Ancestro incluido; 8 commits detrás, 0 exclusivos. |
| `feat/v1-community-connected` | [9a5ef81](https://github.com/FerAlfaro24/CAI_Enterprices/commit/9a5ef81fc4824638af877ea919df67fd9ff04fd3) | Feed/moderación de v1.0 conectados a persistencia. | Ancestro incluido; 49 commits detrás, 0 exclusivos. |
| `feat/v1-community-reactions` | [edba92f](https://github.com/FerAlfaro24/CAI_Enterprices/commit/edba92faf8d22e47f4614353c98609a62e6d7c4d) | Reacciones persistentes: API, permisos, contadores y reintentos; no solo demo. | Ancestro incluido; 11 commits detrás, 0 exclusivos. |
| `feat/v1-groups-settings` | [e083c8f](https://github.com/FerAlfaro24/CAI_Enterprices/commit/e083c8fd480a1746eed70da1b6e69e66f3baed86) | Catálogo, asignación y configuración persistentes. | Ancestro incluido; 46 commits detrás, 0 exclusivos. |
| `feat/v1-inbox-recovery-contact` | [db45ac6](https://github.com/FerAlfaro24/CAI_Enterprices/commit/db45ac6ccb96a9f8689ffaf127d0234673f4d299) | Contacto, bandejas y recuperación en experiencia oficial. | Ancestro incluido; 43 commits detrás, 0 exclusivos. |
| `feat/v1-private-gallery` | [361e23a](https://github.com/FerAlfaro24/CAI_Enterprices/commit/361e23a039e6952ecaae56f8631311c8f78efe3f) | Imágenes privadas: subida de coordinación y permisos por grupo. | Ancestro incluido; 39 commits detrás, 0 exclusivos. |
| `feat/v1-student-profile` | [d8df768](https://github.com/FerAlfaro24/CAI_Enterprices/commit/d8df768f8c507aecb1b8f0b37d8db5ffed84e5fb) | Perfil visible propio y privacidad. | Ancestro incluido; 27 commits detrás, 0 exclusivos. |
| `feat/v1-student-record` | [c712abb](https://github.com/FerAlfaro24/CAI_Enterprices/commit/c712abbf23a9dc5d56abe456a2c1177910374f3f) | Corrección de expediente, tutor e historial privado. | Ancestro incluido; 18 commits detrás, 0 exclusivos. |
| `feat/v1-unified-navigation` | [5405c1c](https://github.com/FerAlfaro24/CAI_Enterprices/commit/5405c1c4404cd716c3e71a9b0f877e212bdcbaf6) | Rutas oficiales, aliases y navegación unificada. | Ancestro incluido; 36 commits detrás, 0 exclusivos. |
| `fix/v1-dev-preview-cache` | [3971284](https://github.com/FerAlfaro24/CAI_Enterprices/commit/3971284f30110eb054f0d3616899ddafe97e3683) | Base funcional de continuación: corrige caché/504 de desarrollo. | Base funcional verificada. |
| `integration/cai-v1-connected` | [cf12d8a](https://github.com/FerAlfaro24/CAI_Enterprices/commit/cf12d8ad6f1cb539e86ab07bc2c281a72364b5f8) | Paso intermedio de conexión de v1.0. | Ancestro incluido; 52 commits detrás, 0 exclusivos. |
| `main` | [a3c2569](https://github.com/FerAlfaro24/CAI_Enterprices/commit/a3c2569d0fc6ca7f8153ee0ec2c6a362aec53881) | Rama predeterminada antigua; no es la versión conectada. | Ancestro incluido; 74 commits detrás, 0 exclusivos. |
| `release/cai-demo-v1.0` | [f3ba46b](https://github.com/FerAlfaro24/CAI_Enterprices/commit/f3ba46b25f41803a07b4577abec19573188ef791) | Base visual oficial congelada: dashboard y Community avanzados. | Ancestro incluido; 62 commits detrás, 0 exclusivos. |

## Qué significa la comparación

33 ramas son la base misma o ancestros incluidos. Dos ramas —frontend-foundation y landing-page— tienen un commit propio por SHA pero `git cherry` confirma parche equivalente, sin parches exclusivos pendientes. Foundation tiene seis commits no ancestros: su árbol completo es idéntico al de `e707cdb`, que sí es ancestro de la base (árbol `3a3e18dd135dc439ce83249b9252c0e1d5ed7574`). Eso no convierte su historia en ancestro ni autoriza borrar sus commits. La rama documental original era la otra divergencia, con siete commits exclusivamente Markdown; la corrección conserva esos padres e incorpora 3971284.

La cuenta 33 corresponde a base/ancestros dentro de las 37: las cuatro excepciones originales son foundation, frontend-foundation, landing-page y la rama documental. Los números describen el corte inicial, no el HEAD nuevo de esta PR.

## Línea funcional acumulativa

La secuencia principal es visual v1.0 → ingreso/servicios/cuentas → integración oficial → grupos/contacto/imágenes → navegación/robustez/cuentas/expediente → revisión antigua → reacciones → comentarios → retos → insignias → caché. La última ya contiene las funciones anteriores. No fusionar cada rama de nuevo ni reconstruir módulos por un nombre o un informe antiguo. [PROJECT_STATE](PROJECT_STATE.md) describe capacidades actuales.

## Verificar antes de integrar o limpiar

```powershell
git fetch origin
git status
git rev-list --left-right --count origin/fix/v1-dev-preview-cache...origin/RAMA
git merge-base --is-ancestor origin/RAMA origin/fix/v1-dev-preview-cache
git cherry origin/fix/v1-dev-preview-cache origin/RAMA
git diff --stat origin/fix/v1-dev-preview-cache...origin/RAMA
```

RAMA es un marcador que hay que sustituir. Para foundation se contrastaron `git rev-parse 'origin/chore/project-foundation^{tree}'` y `git rev-parse 'e707cdb^{tree}'` y la pertenencia de e707cdb a la línea funcional. Las comillas preservan la expresión en PowerShell. Una diferencia de SHA no prueba una función faltante; un diff de árboles antiguos contra actuales tampoco equivale a cambios nuevos por integrar.

## Integración y conservación

PR #9 se dirige a fix/v1-dev-preview-cache y debe ser exclusivamente documental en el diff contra esa base. No se fusiona aquí ni se cambia main/default/release. Para actualizar main, preparar una integración separada desde la línea funcional elegida, revisar su diff y comprobaciones y obtener autorización de fusión. No cherry-pick de todas las features acumulativas ni squash que haga perder trazabilidad por accidente.

No se borró ni archivó ninguna rama. La clasificación permite preparar una propuesta de limpieza; borrar ramas requiere revisión y permiso específicos, incluidos parches exclusivos/historia/PRs. No usar reset o push forzado para sincronizar instalaciones.
