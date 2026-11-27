# CAI — validación del piloto, 27-11-2026

Rama `ops/cai-railway-pilot-2026-11-25`, continuación de `abcbdbe`, PR #44. Pruebas solicitadas por el titular. No se migraron bases habituales ni se modificaron Vercel, main, release, permisos de Google o planes de pago.

## Resultados nuevos

- **361 pruebas de servidor correctas**, cero fallos, omitidas o canceladas. Primera ejecución bloqueada por EACCES al conectar a loopback; repetición autorizada completa correcta. Log privado: `.local/tests/qa-20261127-api-authorized.log`.
- **196 comprobaciones UI en recorridos completos**: Brave, alta/activación/recuperación/vinculación Google 26; Logros 31; Retos 54; renovación diaria 13; moderación 46. Opera GX, alta/activación/recuperación/vinculación Google 26. Google y correo son sustituidos solo en estas fixtures locales; no atribuirles recepción Gmail real.
- Altas sin matrícula/grupo/contraseña inicial; aprobación en panel; activación con ocho letras; contraseña anterior rechazada tras recuperación; enlace de un uso; datos privados protegidos; fallo del proveedor visible sin perder aprobación. Logros: imagen y frases opcionales, borrador privado, publicación aprobada y límites completos. Retos: dos aciertos/un error, puntos sin duplicados, rojo/cruz, reintento tras fallo, calendario CDMX con reloj del dispositivo incorrecto, repaso y día nuevo sin perder historial. Moderación: visor, comentarios, suspensión temporal/permanente y levantamiento, sin suplantar al alumno.
- **Publicador: 59 comprobaciones funcionales correctas antes de una interrupción del guion**, incluidas publicación normal/aviso con foto, galería compartida, comentarios inmediatos/borrado propio, eliminación administrativa con motivo y retirada del carrusel. No declarar que toda la función de prueba pasó de una sola vez: las navegaciones intensivas alcanzaron el límite global de600 solicitudes/minuto y produjeron429; la limpieza de aquel intento no pudo completarse. Una repetición con ritmo controlado encontró un fallo intermitente de la aserción de avance automático. Comprobación específica posterior con pestaña explícitamente visible: avance, pausa y redirección antigua al formulario correctos. No se ha demostrado la causa exacta de la intermitencia del temporizador ni se redujeron protecciones del producto.
- Adaptabilidad en fixtures: 1440/768/375/320 y ambos temas donde procede. **12 comprobaciones adicionales del sitio publicado**: portada, registro, login y administración a1440/375/320, sin desbordamiento ni errores pageerror. Solicitud de origen ajeno rechazada403.
- Alojamiento: ready200; Google y envío de correo enabled:true; alumnos401 anónimo; /.env y /data/railway-gmail.json404.

## Recorrido real en Railway y Gmail

- Administrador entra con la contraseña que eligió el titular; el panel muestra Resumen/Hola Coordinación/Cerrar sesión. La contraseña inicial del archivo privado previamente autorizado se probó una sola vez: **401**, sin imprimir ni guardar su valor en pruebas.
- Se creó **CAI-0003**, alumno identificado expresamente como ficticio para QA, con un alias del mismo buzón institucional. No se alteró CAI-0002/Google ni se aprobó CAI-0001/example.test.
- Registro normal desde la interfaz, revisión y aprobación administrativa, envío automático y recepción en Recibidos institucional comprobados. Mensaje de activación recibido27-11 a09:35 CDMX; enlace canónico /activar, privado, de un uso y con vencimiento28-11 a09:35.
- Enlace abierto: formulario Activa tu acceso, nueva/confirmación y **8–128 caracteres sin números obligatorios**. El agente no introduce una contraseña nueva por el titular. **Pendientes:** titular completa la activación, login hospedado y posterior recuperación de este alumno; no confundir el recorrido local completo con ese cierre remoto.

## Corrección encontrada

Registro y aprobación aún decían que no había correos automáticos y que todo debía prepararse manualmente. Se ajustan textos en SignupPage, SignupForm, AdminRequestsPage y LocalRequestDialog para explicar instrucciones posteriores a la aprobación y consultar el estado del envío en la ficha. No cambia lógica, diseño, contraseñas, permisos o transporte. Comprobación en navegador de ausencia del texto antiguo y presencia de las instrucciones nuevas; tipos/build y ESLint de los cuatro archivos correctos.

## Pendientes y límites

1. Completar manualmente CAI-0003 y probar login/recuperación hospedados. El token consumido de recuperación administrativa todavía no se ha vuelto a probar; sí están comprobados nueva entrada y rechazo de contraseña inicial.
2. Mínimo administrativo de8, sin números obligatorios: autorizado pero pospuesto por el titular; **continúa15**. No implementado en esta prueba.
3. Prueba con dos dispositivos físicos y2–3 personas; navegadores/contextos aislados no equivalen a dispositivos físicos.
4. Incorporar material oficial al piloto, respaldo externo/restauración separada y revisión de crédito/vigencia Gmail antes del lunes30.
5. El registro todavía muestra que el texto del aviso de privacidad está pendiente de redactar con CAI. Debe completarlo/validarlo el responsable antes de una entrega operativa; las fixtures ficticias no sustituyen esa revisión.
6. Mejorar el ritmo y el manejo de visibilidad del guion de publicador para evitar falsos negativos de automatización; no afirmar resuelta la intermitencia sin nueva evidencia. Las bases de QA quedan separadas y sus procesos deben cerrarse al terminar.

Evidencia resumida privada: `.local/tests/qa-20261127-results.json`; nunca contiene las claves reales ni los enlaces privados. Las capturas y bases sintéticas permanecen ignoradas. Esta revisión no implica aceptación final ni entrega al100%.
