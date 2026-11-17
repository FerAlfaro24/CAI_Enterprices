# Inventario de ramas — CAI

**Observado mediante GitHub el 17 de noviembre de 2026.** Inventario de **35 ramas remotas anteriores** a esta actualización (la nueva rama documental se añade aparte). SHA abreviados según la consulta. El nombre de una rama no garantiza que esté desplegada, revisada o fusionada. Conservar todo el historial hasta decisión explícita de limpieza.

## Ramas de referencia y continuidad

| Rama | HEAD al corte | Papel | Acción recomendada |
| --- | --- | --- | --- |
| `main` | `a3c2569` | Ancestro, rama predeterminada, **desactualizada respecto al avance local** | No desarrollar el estado más reciente desde aquí; planificar integración controlada aparte |
| `release/cai-demo-v1.0` | `f3ba46b` | Base visual oficial de la demo v1.0 | Congelar como referencia visual; no sobrescribir |
| `integration/cai-v1-connected` | `cf12d8a` | Punto intermedio conectado | Histórico de integración |
| `docs/auditoria-v1-integracion` | `be90193` | Auditoría y guía de integración anterior | Histórico; información superada por revisión final |
| `chore/v1-stabilization` | `7daa623` | Mejora de carga y robustez local | Incluida en la línea posterior |
| `chore/v1-tooling-audit` | `9274dc9` | Análisis de dependencias | Punto de base de revisión final |
| `chore/v1-final-review` | `fee87d1` | **Último estado acumulado documentado y comprobado localmente** | Base para nueva documentación y trabajo posterior |
| `docs/continuidad-auditoria-2026-11-17` | creada desde `chore/v1-final-review` | Actualización de continuidad (esta entrega) | Revisar mediante PR; no confundir con producto publicado |

## Ramas de funcionalidades (historia, no tareas abiertas por nombre)

| Rama | HEAD | Tema original |
| --- | --- | --- |
| `chore/project-foundation` | `e3ac8fd` | Estructura inicial |
| `feat/frontend-foundation` | `eca282f` | React/TypeScript/Vite |
| `feat/landing-page` | `a37bb08` | Landing institucional |
| `feat/admin-dashboard` | `f38b17c` | Dashboard visual |
| `feat/auth-pages` | `f38b17c` | Misma referencia que admin-dashboard; no es trabajo adicional |
| `feat/community` | `a6d9603` | Comunidad simulada inicial |
| `feat/community-visual-polish` | `12cf1ce` | Pulido visual de comunidad |
| `feat/admin-guided-requests` | `a54e401` | Revisión guiada |
| `feat/local-access-backend` | `f3f07b9` | Servicio local y SQLite |
| `feat/student-account-activation` | `e92fff8` | Activación de alumno |
| `feat/google-signin-onboarding` | `35cfe1c` | Integración Google preparada |
| `feat/local-publications-moderation` | `a60d0a6` | Publicaciones moderadas |
| `feat/local-password-recovery` | `1b84fb3` | Recuperación local |
| `feat/v1-community-connected` | `9a5ef81` | Comunidad conectada a servicio |
| `feat/v1-groups-settings` | `e083c8f` | Grupos y ajustes |
| `feat/v1-inbox-recovery-contact` | `db45ac6` | Bandejas, consultas, recuperación |
| `feat/v1-private-gallery` | `361e23a` | Imágenes privadas |
| `feat/v1-unified-navigation` | `5405c1c` | Rutas y redirecciones |
| `feat/v1-admin-account-security` | `34b78b4` | Contraseña propia administrativa |
| `feat/v1-admin-recovery` | `88ef627` | Recuperación administrativa |
| `feat/v1-admin-team` | `7e404a3` | Equipo administrador |
| `feat/v1-student-profile` | `d8df768` | Perfil de alumno |
| `feat/v1-student-record` | `c712abb` | Expediente, tutor e historial |
| `feat/v1-community-comments` | `46466b7` | Comentarios de demo |
| `feat/v1-community-reactions` | `edba92f` | Reacciones de demo |
| `feat/v1-community-badges` | `bdef066` | Insignias de demo |
| `feat/v1-community-challenges` | `980a1ec` | Retos de demo |
| `fix/v1-dev-preview-cache` | `3971284` | Ajuste de caché/preview |

Las ramas `feat/v1-community-*` de comentarios, reacciones, insignias y retos conservan trazabilidad de interfaces/modelos; **no** prueban persistencia conectada. Para detalle histórico y cadena de integración ver [PROJECT_STATE.md](PROJECT_STATE.md).

## Cómo clasificar y limpiar sin perder trabajo

1. Antes de archivar/borrar, comparar con la rama de continuidad: `git log --oneline BASE..RAMA`, `git diff --stat BASE...RAMA`, `git merge-base BASE RAMA` y los PR/Issues asociados.
2. Distinguir **ancestro incluido**, **parche equivalente**, **rama divergente con cambios exclusivos** y **rama no verificada**. Un SHA distinto no prueba exclusividad.
3. No borrar automáticamente ramas por antigüedad, prefijo o nombre. Preparar propuesta de limpieza con evidencia para revisión humana.
4. Las ramas de integración son acumulativas: evitar fusionar nuevamente cada feature hacia la rama final si su código ya está incorporado.
5. Abrir una PR de documentación hacia `chore/v1-final-review`. Decidir **por separado** cuándo y cómo actualizar `main`; no cambiar la rama predeterminada ni la release en esta tarea.

## Convención futura

`feat/<tema>` funcionalidad, `fix/<tema>` corrección, `docs/<tema>` documentación, `chore/<tema>` mantenimiento, `release/<version>` referencia de entrega. Una rama por objetivo, PR hacia la base acordada, evidencia de pruebas y actualización de continuidad. Evitar crear un nuevo árbol paralelo de pantallas/servicios si existe la implementación oficial.
