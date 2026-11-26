# CAI — opciones de alojamiento revisadas el25-11-2026

**Elección vigente — 26-11:** Railway Trial publica el [piloto conectado](https://cai-piloto-production.up.railway.app/) para lunes30, 2–3 personas. SQLite/volumen/reinicio y Google real de identificación comprobados; Gmail API y pruebas administrativas pendientes. [RAILWAY_PILOT](RAILWAY_PILOT.md) conserva evidencia y límites de crédito. Sin pagos ni promesa de gratuidad ilimitada. Oracle/Google Cloud de abajo son antecedentes, no alternativas que deban desplegarse otra vez.

## Requisito del proyecto

Presupuesto autorizado: solo opciones gratuitas por ahora. El código actual necesita Node24 persistente, una instancia, SQLite/WAL en disco privado persistente, proxy HTTPS local, correo saliente a Gmail y respaldos fuera del servidor. La selección es de compatibilidad; no se crearon cuentas ni contrataron servicios.

| Opción | Compatibilidad con CAI actual | Decisión para esta preparación |
| --- | --- | --- |
| Presentación actual en Vercel | Ya sirve contenido ficticio y Google real de identificación, independiente por navegador. No aloja esta base escolar persistente. | Conservar disponible para el cliente. |
| Render gratuito | El filesystem es efímero; perdería SQLite/fotos al reiniciar o suspender. No tiene disco persistente gratuito y bloquea SMTP25/465/587 en web gratuito. | Descartado para el backend actual. |
| Koyeb gratuito | No permite adjuntar volúmenes a la instancia free. | Descartado para guardar SQLite actual. |
| Oracle Always Free, máquina virtual | Permite VM y almacenamiento persistente elegibles, adecuados en principio para el contrato de un solo servidor. Registro con tarjeta/verificación, disponibilidad por región y posible recuperación por inactividad. | Candidato gratuito para un piloto si el titular acepta y consigue cuenta/capacidad. No prometer disponibilidad o continuidad garantizadas. |

El descarte de Render/Koyeb se refiere a la arquitectura SQLite actual; no afirma que sus servicios sean incapaces de alojar otras aplicaciones con bases externas.

## Recomendación

Preparar una entrega portátil y evaluar primero Oracle Always Free para el piloto, sin cambiar la base ni reescribir el backend. Usar únicamente recursos expresamente elegibles, dentro de cuota y en la región permitida. Los créditos iniciales temporales y un plan Pay As You Go no equivalen a una instalación siempre gratuita. No activar mejoras de pago o recursos fuera de cuota.

Oracle declara que puede recuperar máquinas de poco uso y que puede faltar capacidad. La verificación de tarjeta puede generar una retención temporal; el titular debe realizar ese paso. No se garantiza que el alta sea aceptada. Para una entrega estable al cliente habrá que decidir si estos límites son aceptables o solicitar presupuesto de alojamiento; hoy no se autoriza gasto.

Si no se acepta tarjeta o no hay capacidad, la decisión siguiente es revisar otra arquitectura gratuita con base externa y correo compatible, o posponer el piloto real. Migrar a PostgreSQL/D1/Turso no se da por autorizado ni se presenta como una conexión trivial: implica adaptación y pruebas. La muestra Vercel puede seguir funcionando durante esa decisión.

## Fuentes oficiales

- [Render Free](https://render.com/docs/free): pérdida de archivos locales, SQLite e imágenes; límites de disco.
- [SMTP de Render](https://render.com/articles/can-i-send-email-over-smtp-from-render): bloqueo de puertos en instancias gratuitas.
- [Volúmenes de Koyeb](https://www.koyeb.com/docs/reference/volumes): restricciones de las instancias free/eco.
- [Oracle Always Free](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm): VM/almacenamiento, región, capacidad y recuperación por inactividad.
- [Oracle FAQ](https://www.oracle.com/cloud/free/faq/): verificación de tarjeta y retenciones temporales.
- [Caddy](https://caddyserver.com/docs/caddyfile/patterns) y [proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy): configuración propuesta, pendiente de probar en el alojamiento.

Las condiciones se comprobaron en documentación pública; no se comprobó elegibilidad, disponibilidad o costo en una cuenta concreta.
