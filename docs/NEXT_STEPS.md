# CAI — próximos pasos vigentes

## Siguiente: adopción final tras Google y Gmail reales locales

[Cierre real de entrega de correo](GOOGLE_EMAIL.md#cierre-de-prueba-real-de-gmail--24-11-2026): dos correos recibidos en Gmail, activación/login/recuperación/uso único comprobados con cuenta institucional y alumno ficticio. No rehacer el transporte ni pedir de nuevo cuenta o 2FA por un estado anterior. Faltan rotar privadamente la credencial que se compartió en chat, adoptar en dominio/alojamiento final y comprobar allí orígenes de Google, datos/esquema23, envío y accesos desde otros dispositivos. No renovar el túnel ni migrar bases existentes implícitamente. Top sigue esperando al cliente. La configuración SMTP no debe incluirse en frontend o Git.

## Preparación anterior F6: Google local y envío preparado — 24-11-2026

[Implementación y pruebas](GOOGLE_EMAIL.md): rama `feat/v1-google-email-onboarding`, código `5da4eb4`/[PR #36](https://github.com/FerAlfaro24/CAI_Enterprices/pull/36), desde `aabd5bc`, esquema23 en fixtures nuevas. Código de activación/recuperación por SMTP y vinculación Google de cuentas existentes comprobado; Google institucional real llegó a comunidad en localhost. **No marcar F6 terminado:** falta titular Google/2FA/credencial de aplicación, SMTP/recepción real y recorrido en un dominio final. El asistente de configuración guarda credencial local con entrada oculta; no pedir secretos en chat. Presentación activa sigue con F1–F5/esquema22, sin actualizar/migrar. Top sigue pendiente del cliente.

## Presentación solicitada — 24-11-2026

Preparada una copia remota independiente con F1–F5 para la presentación del usuario; rama `test/v1-client-presentation-2026-11-24` desde `15d3a94`. [Estado, pruebas y vencimiento](REMOTE_DEMO.md#presentación-actualizada--24-de-noviembre-de-2026). Cierra el 25-11 a las 10:12 CDMX; no renovar automáticamente. Tras la presentación, recoger observaciones humanas y retomar F6 Google/correo institucionales y alojamiento final; Top espera decisión del cliente. No dar por probados los dispositivos físicos o el correo real.

## Entrega F5: Retos diarios y progreso personal — 24-11-2026

**Implementada y comprobada**, rama `feat/v1-daily-challenges-refresh`, código `258abfb`, [PR #34](https://github.com/FerAlfaro24/CAI_Enterprices/pull/34), borrador. Base `5f5ce0a` de F3b/F4; incluye esas entregas y las anteriores, sin fusionar nada nuevamente. Esta es la base funcional de la presentación actual. Top/ranking permanece a la espera del cliente.

### Qué cambió

- **Funcionamiento visible:** tres actividades comunes de inglés (gramática, vocabulario y vida diaria), un intento por pregunta y renovación a medianoche CDMX. Incluye explicación breve desplegable y plazo hasta los siguientes retos. Se mantiene el banco actual de 180 preguntas/45 temas, sin prometer práctica multilingüe por registrar Inglés/Francés/Español.
- **Hora autorizada:** snapshot añade `serverTime` y `nextRefreshAt`; la frontera se obtiene de Intl en la zona de referencia, sin fijar UTC−6 ni usar el reloj del dispositivo como autoridad. La vista mide el transcurso de forma monótona, ofrece actualizar y evita enviar desde una jornada caducada; el servidor sigue validando fecha/revisión/permisos. Se conserva la actualización existente al volver a la pestaña y cada 15s, sin un servicio nuevo.
- **Puntos entendibles:** el marcador principal muestra los puntos de hoy y separa el acumulado. Se conservan +5 por responder y +10 extra por acertar, hasta 45 diarios. Dos aciertos y un error se muestran como 35 puntos hoy, no como tres aciertos.
- **Resultados visuales:** acierto verde con marca, error rojo con cruz, texto accesible en recorrido/resultado/resumen y estado por cada actividad. Completar se distingue de acertar. Premio confirmado en grande, celebración local sin sonido y movimiento reducido respetado. Fallo al guardar no concede ni celebra; recargar/repasar no vuelve a premiar. Siguiente actividad dirige el foco al contenido.
- **Repaso privado:** acceso directo a la explicación del error y filtro de respuestas incorrectas en el cuaderno existente. Es consulta de resultados guardados, no otro intento, generador de ejercicios ni puntos extra. Incluye casos sin errores entre lo cargado y carga anterior conservada. Inicio refleja el mismo resumen diario.
- **Datos y límites:** puntos, constancia, intentos, asignaciones históricas e insignias se conservan. Cambiar de día reinicia solo la misión diaria; acumulados/historial permanecen. Pausa administrativa conserva el repaso. No hay tablas nuevas, dependencias, migración, Top, clasificación ni banco Francés/Español. Esquema22.

### Evidencia nueva

- **331 resultados de servidor correctos**, cero fallos/canceladas/omitidas, `npm.cmd run test:api`. Incluyen 8 resultados nuevos de práctica/renovación: frontera exacta CDMX y año/bisiesto, metadatos sin soluciones previas, mínimo/error/acierto/replay,35 puntos por 2 aciertos/1 error, paso al siguiente día, pausa, reinicio y conservación de historial/esquema. La tanda seleccionada de 46 está contenida en este total; no sumarla otra vez.
- **134 comprobaciones UI**, 67 Brave y67 Opera: 54 del recorrido diario y 13 del cambio de día en cada navegador. Cuentas nuevas, clases distintas y progreso privado; zona de dispositivo Tokio y Date.now deliberadamente incorrecto; elección/teclado/foco;503 controlado, reintento y ausencia de celebración falsa; resumen35/80 (hoy/acumulado),2 aciertos/1 error, repaso sin puntos, movimiento reducido, pausa administrativa y persistencia.1440/768/375/320, claro/oscuro, sin errores inesperados de consola/ejecución. La503 se reconoce únicamente durante la inyección controlada.
- Cambio de día simulado a 25-11 en el reloj de QA: tres actividades nuevas en cero,80 acumulados conservados y seis respuestas anteriores consultables. No modificó la fecha del sistema. Inspección final de capturas y comprobación adicional en ambos navegadores tras separar resumen/cuaderno en componentes y ajustar tipografía/bordes.
- Lint, tipos/build, sintaxis del verificador y diferencia de espacios correctos. Verificador vigente `scripts/check-daily-practice.browser.mjs`; fixture `server/tests/daily-practice-browser-server.ts`, reloj por archivo de QA, sin rutas ocultas de prueba en el producto. Los verificadores antiguos conservan expectativas de sus interfaces anteriores, no reemplazan la aceptación F5.

Fixture final `.local/tests/daily-practice-browser-YJzFNN`, API 3284/vista 4644, con cuentas/archivos/capturas sintéticos fuera de Git; se cerraron solo esos procesos de QA. Las fixtures incompletas anteriores se conservaron como evidencia, no se reutilizaron para contar una pasada correcta. No se abrió/migró la base habitual, reinició/renovó la demo, cambió main/release, fusionó PR o desplegó. La validación humana y adopción de esta versión siguen pendientes. **Siguiente F6: preparación/conexión de Google y correo institucionales**, con cuenta/proveedor/orígenes de CAI y prueba real de entrega; Top requiere decisión separada del cliente.

## Entrega F3b y F4: Logros, comentarios y publicador — 24-11-2026

**Comprobada.** Continuación `feat/v1-publisher-notice-carousel`, código `5b6d31c` (núcleo `e217fdc`), [PR #32](https://github.com/FerAlfaro24/CAI_Enterprices/pull/32) en borrador. Base F4a `dac485f`, rama `feat/v1-learning-form-simplification`, [PR #33](https://github.com/FerAlfaro24/CAI_Enterprices/pull/33), desde `b9d7955` de F3a. Secuencia acumulativa: F3a → F4a → F4b; F3b se cerró en F4b para poder retirar la cola sin dejar comentarios atrapados. No existe una rama independiente de comentarios directos. No fusionar otra vez las entregas incluidas.

### Comportamiento entregado

- **Logros:** un solo formulario, actividad/nombre de la obra/qué aprendiste/palabras o frases opcionales/imágenes opcionales. Nombre máximo 300, aprendizaje 5000, palabras/frases 1000; mínimo 1 tras trim en obligatorios. Borrador admite aprendizaje vacío. Ejemplos históricos se conservan y pueden editarse sin exigir otro nuevo. Guardar es privado; desde la colección se elige validación privada o enviar para publicar con aprobación de CAI.
- Límites compartidos en `shared/learning.ts`. La publicación derivada conserva los textos completos y omite apartados opcionales vacíos; las historias normales conservan sus límites previos. No se borró ni truncó información existente. Las insignias siguen contando logros distintos validados, sin pedir expresión/ejemplo obligatorio.
- **F3b:** los comentarios nuevos se guardan publicados al enviar. El autor ve **Eliminar mi comentario** junto al suyo en la conversación, con confirmación; el permiso/revisión se valida en servidor. Se conserva el historial propio, la idempotencia, los límites y las pausas. El replay de un envío eliminado no lo restaura. Pendientes/rechazados/retirados antiguos siguen privados; correcciones de privacidad pueden conservar comentarios retenidos sin republicarlos. Se retiran cola/contadores/mensajes de revisión previa del panel. Rutas antiguas de revisión e historial conservadas para compatibilidad, sin nueva cola visible. F3a sigue permitiendo eliminar comentarios y suspender cuentas.
- **Crear publicación:** sección principal independiente con Publicación normal y Aviso de CAI, fotos opcionales y vista previa. Destino nuevo: todos los aprobados; el selector no amplía fotos históricas privadas. Publicación normal con imágenes también aparece en Galería; usa una sola imagen/publicación/conversación. Los avisos pueden tener imágenes y aparecen automáticamente en Inicio, sin Destacar en Inicio. La ruta anterior `?bandeja=cai` redirige a la sección nueva.
- **Publicaciones:** administra alumnos y Equipo CAI; filtro de autor y estados. **Eliminar** está visible en la tarjeta y en la revisión de una publicada, pide motivo privado y confirmación. Oculta el contenido de feed/carrusel/galería/perfil, conserva registro/auditoría/autor/motivo y usa **Eliminada de la comunidad** en lugar de Retirada. No hay borrado físico ni restauración automática; los logros privados validados e insignias permanecen.
- **Carrusel:** exclusivamente avisos vigentes de Equipo CAI, empezando por el más reciente y avanzando cada 5 segundos. Respeta pausa manual, foco/ratón, pestaña oculta y movimiento reducido. Con0 se oculta; con 1 no rota ni muestra controles innecesarios. Álbumes/fotos normales quedan en feed/Galería. Avisos antiguos vigentes entran aunque no estuvieran destacados manualmente.
- **Sin nueva migración:** esquema 22 de F3a. No se aplicó al acceso habitual ni a la demo. Cambiar una rama no revierte una base; la adopción se ensaya por separado y se autoriza expresamente.

### Pruebas nuevas y límites de la entrega

- **323 pruebas de servidor aprobadas**, cero fallos/canceladas/omitidas, `npm.cmd run test:api`. Incluyen límites mínimos/máximos, publicación derivada sin truncar, opcionales/ejemplos históricos, privacidad y concesión de insignias; comentarios inmediatos, borrado propio/permisos/revisiones/replay, no republicación histórica; eliminación de alumnos/Equipo CAI, motivos/auditoría/fotos/perfiles, sesión revocada durante el cuerpo, respaldo/reinicio. No sumar la tanda seleccionada de49 de F4a ni otras repeticiones al total 323.
- **184 comprobaciones UI en dos tandas:** 62 de Logros (31 Brave/31 Opera),122 del publicador/carrusel/comentarios (61/61). Contextos aislados,1440/768/375/320, ambos temas, navegación, datos opcionales/largos, imágenes, aprobación voluntaria, publicación cruzada, rotación real de5s/pausa/movimiento reducido, confirmación/cancelación de borrado y actualización entre cuentas. Sin errores inesperados de ejecución/consola. Inspección de capturas y revisión adicional de bordes/campos después del ajuste visual final.
- ESLint, tipos/build, sintaxis de verificadores y diferencia de espacios correctos. Verificadores vigentes `scripts/check-learning-form.browser.mjs` y `scripts/check-publisher.browser.mjs`. Los verificadores antiguos de formularios con pasos, grupos, revisión previa o carrusel mixto corresponden a sus cortes, no a la aceptación de esta entrega.

QA aislada API3280/vista4640, fixtures nuevas `.local/tests/moderation-browser-G23GqB` (F4a) y `.local/tests/moderation-browser-eQbZSN` (integración final), imágenes/cuentas sintéticas y capturas fuera de Git. Se cerraron solo los procesos de QA. Sin abrir/migrar `.local/cai.sqlite`, renovar/reiniciar la demo, cambiar main/release, fusionar PR o desplegar. Aceptación humana, Google/correo reales y alojamiento pendientes. **Siguiente F5: Retos comunes más claros/divertidos, sin Top hasta aprobación del cliente.**

## Entrega F3a: moderación y suspensiones — 24-11-2026

**Implementada y comprobada**, código `cb19d59`, rama `feat/v1-community-moderation`, desde `2129b5d` de `feat/v1-shared-community` (F2/PR #30). Incluye F1a/F1b/F2. Esta rama anterior está incluida en F4b; `release/cai-demo-v1.0` conserva la referencia visual y `main` sigue sin actualizar. No fusionar ramas acumulativas de nuevo.

### Comportamiento y límites

- **Ver comunidad** en el menú de administración: publicaciones comunes, fotos ampliables, conversación y paginación de veinte elementos. Sesión propia de administración, sin entrar como alumno. No amplía la audiencia de fotografías históricas privadas.
- En cada comentario: **Moderar comentario**. Eliminarlo y suspender al autor son decisiones independientes; se pueden aplicar juntas de forma atómica. Motivo y confirmación obligatorios. La cuenta no se bloquea por eliminar solamente su comentario.
- Suspensión del acceso completo por 1/3/7/30 días o permanente; el servicio valida cualquier duración entera de1 a365 días. El plazo corre desde su aplicación, no desde medianoche. Se cancelan sesiones de alumno/Google y enlaces de activación/recuperación; no basta cambiar de navegador ni usar Google. Los controles externos de Google se ensayaron con identidades ficticias, sin configurar el proveedor real.
- **Suspensiones activas** permite levantar una medida con motivo y confirmación; **Historial** conserva las medidas y su estado, incluidas las activas. El vencimiento se comprueba en cada acceso desde el servidor, sin depender de que un navegador permanezca abierto. Después de vencer/levantar se exige iniciar sesión de nuevo.
- La sanción de comunidad es independiente del estado manual del expediente: no activa una inscripción suspendida por coordinación. No elimina otras publicaciones ni oculta automáticamente el historial público del alumno. Un comentario retirado no reaparece al vencer o levantar la medida.
- Esquema22 aditivo: `student_restrictions` y `community_moderation_actions`, registro administrativo, idempotencia y revisiones. El arranque productivo exige22 y rechaza bases previas sin migrarlas; preparar actualización/recuperación en copia separada antes de adoptar. Cambiar de rama no revierte la base.
- **F3b sigue pendiente:** los comentarios continúan con revisión previa. Siguiente: publicar inmediatamente los nuevos y permitir borrar los propios junto al comentario; retirar bandeja/contadores/textos de revisión, sin republicar antiguos rechazados/retirados. Top sin autorización del cliente; F4–F6 pendientes.

### Evidencia nueva

- **307 pruebas de servidor**, cero fallos/canceladas/omitidas, con `npm.cmd run test:api`. Incluye 13 resultados de moderación: permisos/origen, motivo/duración/revisión/confirmación, idempotencia, cancelación de sesión administrativa durante el cuerpo, combinación atómica, expiración/permanencia/levantamiento, suspensión manual independiente, activación/recuperación/Google, paginación con autores inactivos, migración21→22, respaldo/reinicio. Suites anteriores actualizadas solo para el nuevo esquema y sus fixtures de migración.
- **90 comprobaciones UI**, 45 Brave y 45 Opera, contextos aislados: menú, paginación de publicaciones, fotos privadas ampliadas, eliminación independiente, suspensión temporal/permanente, cierre de sesión abierta/rechazo del reingreso, levantamiento/historial, cancelación/foco/teclado,1440/768/375/320 y temas claro/oscuro. Sin errores inesperados de consola/ejecución. Inspección adicional de capturas de escritorio y diálogo móvil. Verificador `scripts/check-community-moderation.browser.mjs` y fixture `server/tests/community-moderation-browser-server.ts`.
- ESLint, revisión de tipos, build, sintaxis del verificador y `git diff --check` correctos. El acceso real a Google, correo y alojamiento no se probaron ni se afirman configurados.

Fixture nueva `.local/tests/moderation-browser-x43Q9Z`, API3276/vista compilada4636, evidencia y accesos ficticios fuera de Git. No se abrió/migró `.local/cai.sqlite`, no se actualizó/renovó la copia remota ni se publicaron datos de alumnos. Los procesos de QA se cierran al terminar. La aceptación de uso por coordinación real continúa pendiente.

## Entrega F1b y F2: registro y comunidad compartida — 23-11-2026

**Cierre conjunto comprobado.** Base del registro `0247632` en `feat/v1-registration-simplification`; integración completa `3a7fdb3` en **`feat/v1-shared-community`, continuación vigente**. Ambas incluyen F1a. La rama del registro es un punto intermedio: usar la integración F2 para adoptar o mostrar registro sin grupos. No actualizar main/release ni fusionar PR automáticamente.

### Comportamiento entregado

- Registro de tres pasos con Clase: Inglés, Francés o Español. Sin selector de quién lo llena, grupo/horario, matrícula manual ni paso de tutor. Se conserva fecha de nacimiento, nombre abreviado/privacidad de menores, normas, aprobación y activación. El folio `CAI-0001` es la matrícula automática, se muestra en la revisión administrativa y no puede cambiarse manualmente en el expediente nuevo.
- Contrato nuevo `SchoolRegistration` con `className`, normalizado internamente a inscripción con grupo vacío. No se asigna un grupo ficticio ni se depende de que haya grupos activos para aceptar solicitudes. Clases validadas en servidor. Idempotencia, folios únicos, límites de edad y correo, pausas, sesiones y aprobación conservados.
- Expedientes de registro nuevo pueden aprobarse y corregirse sin tutor, sin generar consentimientos ficticios. Formularios conectados de solicitud, resumen, ficha y edición distinguen esos registros. Los expedientes/contratos históricos conservan sus programas, grupos, tutores y evidencias; no se inventó una equivalencia de idioma para registros anteriores ni se borró su historial.
- Miembros: todos los aprobados activos, también recién aprobados sin contraseña todavía; alias, UUID social y fecha real de ingreso, sin correo, fecha de nacimiento ni expediente. Directorio/perfiles sociales e Inicio ya conectados entre clases; los ingresos recientes usan la fecha real.
- Publicaciones y Logros compartidos de alumnos usan audiencia de comunidad, conservando aprobación previa, comentarios todavía moderados y controles existentes. Cambiar clase revoca la sesión y conserva contenido común/progreso; cambiar inscripción histórica no vuelve a ocultar publicaciones/comentarios de audiencia común. Borradores, logros privados, motivos y archivos sin publicación siguen privados. Fotografías institucionales históricas restringidas conservan su audiencia original.
- Retos: un calendario común para alumnos de cualquier clase, sin grupo ni horario. Administración programa para toda la comunidad (el campo de compatibilidad `groupId=0` identifica el calendario común, no un grupo real). Banco actual de inglés, tres preguntas por día CDMX, puntos/rachas y respuestas individuales conservados. Ese corte no incluía el acabado F5, ya entregado después. El banco multilingüe no se amplió; Top sigue sin implementar.

### Migración y adopción

La migración21 reconstruye la tabla de publicaciones para retirar la restricción SQLite que exigía audiencia de grupo en contenidos de alumnos. Conserva columnas, IDs, secuencia AUTOINCREMENT, índices/triggers y referencias hijas; valida claves foráneas antes de confirmar y revierte ante error. Solo cambia audiencia de publicaciones de alumnos y registra auditoría; no publica pendientes/rechazadas/retiradas ni convierte logros privados en publicaciones. No modifica las audiencias de fotografías institucionales históricas.

Las respuestas anteriores mantienen pregunta, contenido y puntos originales, aunque pertenezcan al calendario antiguo. Un intento antiguo del día impide repetir puntos en el mismo espacio; el día siguiente todos reciben los mismos IDs comunes. El historial permanece privado. No se borró ni recalculó progreso para unificar clases.

Modo local migra como antes; **producción exige esquema 21 preparado previamente**, sin migración automática al arrancar. El verificador de respaldo acepta21 y mantiene comprobación de copias anteriores. Para adoptar en una instalación existente: copia consistente verificada, ensayo de actualización separado y revisión de integridad/conteos/privacidad antes de cambiar servicio/datos. Volver a una rama anterior no revierte el esquema. Esta entrega no ejecutó ese proceso sobre datos habituales o la copia remota.

### Evidencia nueva

- **294 resultados de servidor correctos**, suite completa `node --test server/tests/*.test.ts`. Actualizadas expectativas de audiencias de grupo que el usuario sustituyó; no se omitieron suites ni se relajaron controles de cuentas, revisión, privacidad o recursos institucionales privados. Fixtures de esquemas históricos ajustadas para retirar21 al simular versiones anteriores.
- Nuevas pruebas `simple-registration.test.ts`: tres clases, niño sin tutor, matrícula automática, idempotencia, rechazo de matrícula manual/perfil público de menor/clase ajena, catálogo de grupos archivado, corrección sin tutor y registro en pausa.
- Nuevas pruebas `shared-community.test.ts`: convivencia entre clases, recién aprobado sin activación, aprobación antes de publicar, conversación, perfiles, imagen privada, retos comunes y progreso individual; migración desde restricción física de20, IDs/credenciales/bytes/comentarios/attempts/secuencia intactos, idempotencia, respaldo, reinicio e intento histórico/cambio de día.
- **98 comprobaciones UI nuevas**,49 Brave y49 Opera: registro real de menor/adulto de clases distintas, clase obligatoria, tres pasos, aprobación en panel sin tutor, activación de ocho letras, directorio/ingresos/perfil cruzados, publicación aprobada visible en otra cuenta, preguntas comunes y cambio de clase sin perder acceso social/progreso.1440/768/375/320 y temas claro/oscuro; sin errores inesperados de ejecución/consola. Las dos respuestas401 esperadas al intentar entrar sin cuenta se reconocen únicamente durante esa comprobación de acceso.
- ESLint, tipos/build y sintaxis de verificador correctos. Verificador `scripts/check-shared-community.browser.mjs`; el verificador de registro remoto se adaptó al formulario nuevo para cuando se adopte esta versión. No ejecutarlo contra la demo anterior suponiendo que ya fue actualizada.

QA nueva `.local/tests/final-review-M6WPr3` con API3272/vista compilada4632; evidencia, accesos y capturas fuera de Git. Se cerraron únicamente esos dos procesos de QA al terminar. No se reinició ni renovó la demo remota, no se aplicó migración a `.local/cai.sqlite` ni a su copia de presentación, y no se publicaron datos de alumnos. Google/correo reales, F3–F6 y aceptación humana seguían pendientes en ese corte; ver la entrega F3a posterior al inicio.


## Entrega F1a: activación y contraseñas — 23-11-2026

**Implementado y comprobado**, código `ce3160d`, rama `feat/v1-access-usability`, PR #28. Base de preparación `95a6522`, descendiente de `12b088b`/PR #27. Siguiente entrega: F1b; antes de actualizar una demostración con registro sin grupos completar aceptación conjunta con F2.

- Alumnos: contraseña de 8 a 128, sin números/letras/símbolos obligatorios; mínimo en caracteres Unicode útiles tras quitar espacios extremos para contar, máximo 128 unidades como los campos HTML. Se conserva el valor introducido al calcular su hash; no se modifican claves existentes. Se rechazan siete caracteres, solo espacios, siete emojis y más de 128; se probaron ocho letras, 128 letras y ocho emojis.
- Regla compartida en `shared/student-password.ts`, usada por activación, recuperación y formulario de muestra anterior. Administración sigue con mínimo 15 y máximo 128; su servidor no cambió.
- Ambos campos de activación/recuperación tienen mostrar/ocultar independiente, estado accesible y aviso textual con icono de coincidencia. Se actualiza al cambiar cualquiera de los dos, no muestra error con confirmación vacía y retira errores anteriores al editar. Los controles se bloquean durante el guardado; las claves se limpian al terminar. Se conserva la retirada del token de la dirección, el tratamiento de resultado administrativo incierto y la protección de sesiones.
- Verificador reutilizable `scripts/check-access-usability.browser.mjs`: crea sesiones aisladas y alumnos ficticios, comprueba activación/recuperación real, reglas de administración, teclado, estados de envío, privacidad de campos y ausencia de errores. Capturas privadas de prueba con claves enmascaradas; se inspeccionó además el formulario vacío para revisar controles visuales.

**Pruebas nuevas:** 58 resultados Node correctos con `node --test server/tests/student-accounts.test.ts server/tests/recovery.test.ts server/tests/admin-recovery.test.ts server/tests/admin-team.test.ts server/tests/admin-security.test.ts`. Incluyen uso único/caducidad de enlaces, revocación, carreras durante hash, contraseñas anteriores y aislamiento alumno/administrador.94 comprobaciones UI correctas: 47 Brave y 47 Opera, con 1440/768/375/320, temas claro/oscuro y recorrido real de contraseña de ocho letras. ESLint, tipos/build y sintaxis del verificador correctos. No se repitió la suite integral completa; Google/correo real siguen pendientes de F6.

**Entorno:** fixture nueva `.local/tests/final-review-1UJMiC`, API 3268 y vista compilada 4628, separadas de datos habituales y demo. No se hicieron migraciones, no se cargó la mejora en la demo remota y no se amplió su vencimiento. Se detuvieron únicamente estos dos procesos de QA al cerrar las pruebas. Evidencia local fuera de Git. No presentar esta entrega como registro sin tutor/clase única/comunidad unificada: corresponden a F1b/F2.


## Preparación de ejecución — 23-11-2026

**Preparación histórica, completada antes de implementar F1a.** El estado vigente y la evidencia de F1a están en la entrega anterior. Rama creada `feat/v1-access-usability`, desde `12b088b` del plan confirmado (PR #27), con código funcional `c59ec6c`/PR #26. Esa es la continuación de desarrollo; `release/cai-demo-v1.0` continúa como referencia visual y `main` sigue sin actualizar. Esta preparación no actualiza la demostración remota ni su vencimiento.

### Entregas y ramas

Ya se crearon las ramas F1a, F1b y F2. Ese era el estado al preparar F1a. F4a/F4b ya se crearon y F3b se integró en F4b; consultar la tabla y la entrega vigente al inicio. Las futuras ramas se crearán desde la punta comprobada anterior. Commits pequeños por mejora comprobada y PR en borrador contra su base inmediata; sin fusión automática.

| Orden | Estado | Rama | Alcance y dependencia |
| --- | --- | --- | --- |
| F1a | Implementada y comprobada (`ce3160d`) | `feat/v1-access-usability` | Activación/recuperación de alumno con mínimo 8, mostrar/ocultar y coincidencia. Independiente de la reorganización de grupos. |
| F1b | Integrada en F2 (`0247632`) | `feat/v1-registration-simplification` | Clase, matrícula automática y registro normal de menores. Prepara contratos y migración compatible; aceptación conjunta con F2. |
| F2 | Comprobada (`3a7fdb3`) | `feat/v1-shared-community` | Autorizaciones sociales comunes, miembros/fechas, fotos y asignación diaria sin grupo. Comprobar F1b+F2 antes de cambiar la copia de demostración. |
| F3a | Comprobada (`cb19d59`) | `feat/v1-community-moderation` | Vista de comunidad para admin, eliminación contextual y suspensiones temporales/permanentes. Conservar controles de sesión. |
| F3b | Comprobada e integrada en F4b (`e217fdc`) | `feat/v1-publisher-notice-carousel` | Comentarios inmediatos, borrar propios, quitar revisión previa y sus contadores. Abrirlos una vez comprobadas las herramientas de moderación. |
| F4a | Comprobada (`dac485f`, PR #33) | `feat/v1-learning-form-simplification` | Logros simples, límites compartidos mayores y campos opcionales; no romper publicación derivada o insignias. |
| F4b | Comprobada (`5b6d31c`, PR #32) | `feat/v1-publisher-notice-carousel` | Crear publicación como sección principal, eliminación administrativa, avisos con fotos y carrusel exclusivo cada 5s. |
| F5 | Comprobada (`258abfb`, PR #34) | `feat/v1-daily-challenges-refresh` | Retos comunes más claros/divertidos, calendario CDMX y progreso personal. Sin Top; decidir banco lingüístico antes de ampliar idiomas. |
| F6 | Siguiente: preparación autónoma; conexión externa después | `feat/v1-google-email-onboarding` | Reutilizar Google, desarrollar envío/recuperación y estados de entrega. Cierre real con cuenta institucional, remitente y origen autorizado. |
| Top | A la espera del cliente | Sin rama | No implementar clasificación, tablas, API ni interfaz hasta decisión del cliente. |

### Primer trabajo concreto: F1a

- [x] Reutilizar el flujo de activación/recuperación; definir una regla compartida de contraseña para alumnos (8–128, sin composición obligatoria). Conservar las claves existentes y distinguir los formularios de administración que comparten pantalla, sin bajar sus requisitos por accidente.
- [x] Aplicar regla en `server/student-accounts.ts`, `server/notices.ts`, `src/features/local-access/ActivateAccountPage.tsx` y texto/prototipo relacionado de `src/features/signup/SignupForm.tsx`. Usar utilidades existentes; añadir un módulo compartido pequeño solo si evita reglas duplicadas. No agregar dependencias.
- [x] Añadir controles accesibles de mostrar/ocultar independientes y señal de coincidencia, sin mostrar error antes de escribir confirmación, sin filtrar contraseña a mensajes, registros o capturas.
- [x] Ampliar las pruebas existentes de cuentas/recuperación: acepta8 sin números, rechaza7/vacía/solo espacios, límite máximo coherente, confirmación desigual, enlace único/vencido, revocación y contraseña anterior válidas.
- [x] Comprobar también activación/recuperación/equipo administrativo, porque reutilizan pantalla. Sus reglas no deben cambiar involuntariamente.
- [x] Probar flujo en Brave y compatibilidad Opera, escritorio/móvil, teclado y errores de consola. Reutilizar verificadores y fixtures, actualizando solo las expectativas afectadas.
- [x] Ejecutar comprobaciones proporcionales, registrar evidencia nueva y hacer commit revisable; marcar casillas solo después de ejecutar y revisar el resultado.
- [x] Actualizar documentación y continuidad; F1a no incluye correo real, grupos, tutor ni migración social. Esos cambios siguen dentro de F1b/F2 y F6, no se consideran omitidos.

Pruebas previstas en la preparación y ejecutadas al cerrar F1a (resultado en la entrega anterior):

```powershell
node --test server/tests/student-accounts.test.ts server/tests/recovery.test.ts server/tests/admin-recovery.test.ts server/tests/admin-team.test.ts server/tests/admin-security.test.ts
npm.cmd run lint
npm.cmd run build
```

El build existente incluye revisión de tipos. Si los cambios posteriores amplían el área afectada, seleccionar sus suites existentes: acceso/Google/administración para F1b; publicaciones/comunidad/galería/perfiles/Retos para F2; comentarios/permisos para F3; learning/publications/badges para F4. La regresión integrada se repetirá tras las entregas relacionadas, sin presentar pruebas históricas como ejecutadas de nuevo.

### Datos, migraciones y entrega

- Preparación local registrada en una carpeta nueva `.local/tests/change-preparation-*`, sin base ni credenciales. Node24.22.0/npm11.19.1 disponibles; dependencias ya enlazadas. No se instaló ninguna herramienta ni se inició/reinició servicio.
- Cada prueba posterior generará una fixture nueva con datos ficticios bajo `.local/tests`, incluyendo adultos/menores, clases distintas, cuenta anterior, pendiente/aprobado/suspendido y contenido privado/publicado. No abrir, migrar o sustituir `.local/cai.sqlite` para pruebas.
- Antes de F1b/F2, ensayar migración desde esquema 20 en otra fixture, comprobar totales/identificadores/contraseñas/medios/puntos y permisos tras reiniciar. Especificar tratamiento de programas/grupos anteriores sin fabricar clases a partir de nombres ambiguos ni convertir campos históricos en controles sociales.
- No actualizar la demostración a un estado intermedio que deje a los nuevos alumnos sin comunidad por carecer de grupo. De igual forma, no liberar comentarios automáticos antes de tener moderación comprobada.
- Una actualización de base se recupera mediante copia coherente validada y procedimiento autorizado; cambiar de rama no revierte una migración. Para código conservar commit base y diffs por entrega. No borrar datos ni sustituir bases para simular una vuelta atrás.
- Google/correo: preparar código y pruebas simuladas sin datos de cuentas personales; no solicitar contraseñas de Google en el chat ni guardar secretos en Git. Marcar enviado solo tras entrega aceptada por el proveedor; la recepción real queda como criterio de cierre externo.


## Prioridad vigente: observaciones de amigos del 23-11-2026

**Alcance confirmado por el usuario:** avanzar con los ajustes descritos salvo el Top/clasificación, que requiere consultar y obtener la decisión del cliente antes de desarrollarlo. Mejoras de Retos diarios, puntos y rachas personales siguen incluidas. Google/correo mantienen sus dependencias de cuenta y configuración.

**Estado: análisis contra código `c59ec6c`, sin implementación funcional ni nuevas pruebas de producto.** Esta propuesta sustituye las prioridades de aceptación/N3 anteriores. Los resultados históricos validan las reglas anteriores; no prueban todavía los cambios solicitados. Rama documental `docs/v1-friends-feedback-plan`. La comunidad seguirá siendo privada para alumnos aprobados, aunque comparta contenido entre clases. Los expedientes, correo/edad, borradores, logros privados, motivos y respuestas individuales seguirán privados.

### Orden y alcance acordado o propuesto

| Bloque | Petición y diagnóstico comprobado | Trabajo propuesto y cierre |
| --- | --- | --- |
| F1 · registro | Matrícula manual opcional en SignupForm; ya existe folio automático CAI-0001 del servidor. Programa/grupo son obligatorios también en validación y catálogo. | Quitar matrícula del formulario y reutilizar el folio simple como identificación, conservando códigos anteriores. Una selección Clase: Inglés / Francés / Español. Retirar grupo/horario del alta y desacoplar disponibilidad del catálogo antiguo. Mantener aprobación de coordinación. Alta concurrente sin matrículas repetidas y cuentas existentes conservadas. |
| F1 · menores | Tutor es paso, regla de edad, validación de servidor y condición de aprobación; no basta ocultarlo. | Registro ordinario sin el paso de tutor, según nueva petición. Mantener edad real, nombre abreviado y privacidad; no fabricar consentimiento ni borrar su historial. Ajustar revisión/expediente, Google y textos relacionados. Política/documentación final de menores a validar con CAI. |
| F1 · contraseñas | Activación/recuperación actuales exigen 15; el prototipo antiguo tiene otra regla de 8 con letra/número. No hay botón de mostrar ni coincidencia inmediata en ActivateAccountPage. | Mínimo 8 para alumnos, sin números/símbolos obligatorios, máximo 128. Regla compartida entre activación, recuperación y formularios. Mostrar/ocultar en ambos campos, coincidencia clara al escribir y validación al guardar. No invalidar claves existentes; conservar hash y controles de intentos. No asumir que cambiar HTML cambia servidor. |
| F2 · comunidad común | Feed, imágenes, comentarios, publicación de logros, compañeros y perfiles condicionados por programa/grupo; Retos usa asignaciones por grupo y bloquea Por asignar. | Clase será dato de inscripción, no frontera social. Alumnos aprobados de cualquier clase verán publicaciones compartidas, perfiles sociales, compañeros y avisos comunes; preguntas diarias comunes sin grupo. Adaptar todas las autorizaciones y migración, no asignar a todos un grupo ficticio. Solo ampliar contenido publicado/compartido autorizado; no publicar borradores, privados, rechazos, retiradas ni fotos privadas antiguas ajenas a este alcance automáticamente. |
| F2 · nuevos miembros | GroupMember no aporta fecha de ingreso y publicMember asigna joinedAt vacío; hay filtro de programa/grupo. | Entregar la fecha real de incorporación, definir orden de recientes y hacer visible al nuevo aprobado en toda la comunidad. Mantener identificadores sociales y ocultar datos de expediente. |
| F3 · comentarios | Se guardan pendientes. El alumno YA puede retirar los propios desde Mis comentarios; está poco visible. | Nuevos comentarios publicados al guardar, sin revisión previa. Borrar mi comentario directamente junto a su texto; permisos solo de propietario/admin. Retirar bandeja de aprobación, contadores y mensajes de revisión; mantener herramientas de moderación. No republicar automáticamente antiguos rechazados o retirados. |
| F3 · moderación | Existe suspensión de alumno; no hay duración ni panel de moderación dentro de la comunidad. | Separar eliminar comentario de suspender al autor. Acciones contextuales de admin en una vista administrativa de comunidad sin simular cuenta de alumno. Suspensiones por días/permanentes, motivo, estado y vencimiento en servidor, revocación de sesiones, deshacer cuando corresponda. Decidir con claridad alcance del baneo (acceso completo frente a impedir interacción); propuesta inicial: suspensión de acceso completo y eliminación de comentario independientes. No restaurar contenido sancionado automáticamente al vencer suspensión. |
| F4 · Logros | Título máximo 100, práctica600, expresión160, ejemplo300. Completar exige mínimos4/20/2/5. Compartir pasa además por límite1200 de publicaciones. | Un formulario simple: nombre de obra, qué aprendiste, palabras/frases opcionales, imágenes opcionales. Eliminar ejemplo obligatorio y pasos redundantes; distinguir campo de nombre frente a relato con etiquetas/ejemplos. Propuesta de máximos: nombre300, aprendizaje 5000, palabras/frases 1000; mínimo 1 en obligatorios tras trim, opcionales0. Propagar límites al servidor, publicación derivada, panel y visualización. Mantener guardar privado / enviar a publicar y revisión de publicaciones de alumnos. Revisar condiciones de insignias para que quitar campos no las rompa. |
| F4 · panel/publicación | Publicaciones mezcla moderación, comentarios y publicador institucional escondido en details. Equipo CAI puede retirar propias; en revisión de publicaciones de alumnos solo aprobar/rechazar/devolver, falta eliminación directa administrativa. | Sección principal Crear publicación con dos opciones: Publicación normal y Aviso de CAI. Publicaciones para revisar/administrar, con eliminar visible y confirmación. Quitar cola de comentarios y destacado en Inicio del formulario normal. Distinguir motivos y autor de eliminación en historial privado. Retirada significa ocultada de comunidad y conservada como registro; proponer etiqueta Eliminada de la comunidad para entenderla. Conservar trazabilidad, sin borrado físico implícito. |
| F4 · avisos/carrusel | Avisos YA admiten fotos; el carrusel mezcla avisos/historias/galería. Actualmente arranca pausado con avisos y rota cada8s si activo. | Carrusel solo de avisos de CAI vigentes, empezando por el más reciente, rotación cada 5s. Imagen opcional accesible desde el mismo formulario, con vista previa. Sin destacado manual: aviso vigente entra automáticamente. Mantener anterior/siguiente y pausa; respetar movimiento reducido/foco. Con0 avisos ocultar carrusel; con 1 no rotar inútilmente. Fotos/álbumes en Galería y feed, conservando una sola publicación y conversación, sin duplicar archivos. |
| F5 · Retos diarios | 180 preguntas de inglés, 3 diarias (gramática/vocabulario/vida cotidiana), día CDMX, selección determinista por fecha; se persisten por grupo, 1 intento, +15 acierto/+5 error, puntos y rachas ya existen. No hay clasificación global conectada. | Explicar reinicio a medianoche CDMX y próximo reto; experiencia breve con resultados/repaso/celebración existentes. Mismo conjunto para todos. Puntos y racha personal permanecen. Top/clasificación fuera del trabajo confirmado: consultar primero al cliente; no crear interfaz, API, tablas ni pruebas de ranking antes de esa decisión. Conservar como propuesta histórica el Top semanal, sin comprometer reglas o entrega. |
| F6 · Google/correo | Google Identity Services y verificación de tokens ya implementados, sin configuración real. Correo solo avisos internos y enlaces manuales. Google rechaza enlazar automáticamente por correo coincidente. | Preparar correo automático al aprobar, con enlace privado de un uso/vencimiento, reenvío controlado, estado de entrega y recuperación. Configurar remitente institucional y entrega real con cuenta del cliente. Activar Google sin reconstruir su integración; permitir nueva solicitud/aprobación y vinculación segura para cuentas anteriores. Google no requiere contraseña CAI; correo+contraseña sigue alternativo. No enviar contraseñas por correo ni guardar claves en Git. |

### Decisiones y dependencias que requieren atención

- Iniciar sesión con Google y enviar un correo a Gmail son servicios diferentes. No hace falta que el alumno use Google para recibir activación en su correo. Crear la cuenta institucional permite administrar recursos, pero faltan proyecto/cliente web y remitente/configuración de entrega. La integración de correo requiere desarrollo, no solo encender el botón Google.
- Retos actuales enseñan únicamente inglés. Añadir Francés/Español al registro no crea bancos de esos idiomas. F5 conserva la práctica común de inglés; una ampliación a tres idiomas requiere alcance y revisión pedagógica específicos; no prometer contenido multilingüe existente ni separar de nuevo la comunidad por clase.
- Quitar tutor simplifica el producto, pero no equivale a registrar consentimiento que nadie otorgó. Mantener historial, privacidad de menores y revisión de textos/política antes de entrega real.
- F6 se puede preparar autónomamente mientras se crea la cuenta; configuración/pruebas reales dependen de titular institucional, acceso autorizado y origen HTTPS que se vaya a usar. El túnel temporal cambia de dominio y mantiene su vencimiento; no convertirlo implícitamente en servidor definitivo ni renovar la ventana. No acceder a la cuenta Google personal.
- Moderación posterior de comentarios no cambia automáticamente la revisión de publicaciones/logros solicitada antes: continúan privadas hasta aprobación cuando el alumno decide compartir.

### Verificación necesaria durante implementación

1. Registro de adulto y menor sin matrícula/grupo/tutor, folios únicos, tres clases y aprobación conservada; cuentas anteriores sin pérdida.
2. Activación/recuperación con 8 caracteres sin números, rechazo de7, mostrar/ocultar y coincidencia/desacuerdo; contraseñas anteriores válidas.
3. Dos alumnos aprobados de clases distintas se ven como compañeros, ven mismo contenido compartido/retos y nuevo miembro; visitantes y pendientes no; expediente, privados e imágenes sin permiso siguen inaccesibles.
4. Comentario inmediato visible desde otra sesión, borrar propio y rechazo al borrar ajeno; admin modera y suspende; duración/permanente/vencimiento y sesiones activas comprobados sin resucitar contenido borrado.
5. Logro con 1 carácter obligatorio, expresión vacía, textos largos e imágenes; privado sigue privado y publicación derivada no falla por límites antiguos; insignias conservadas.
6. Creación normal/aviso desde sección principal, aviso con foto, eliminación de publicaciones propias y de alumno; carrusel más reciente,5s,0/1/varios, vigente/caducado, pausa/teclado/movimiento reducido; galería sin duplicados.
7. Retos diarios comunes, cambio de día CDMX, un intento por actividad, explicación de aciertos/errores y conservación de puntos/rachas anteriores. Las pruebas de Top quedan pendientes de que el cliente lo apruebe.
8. Google nuevo/existente, aprobación y suspensión; correo real recibido, fallo/reenvío, enlace único/caducado y recuperación; no unir cuentas solo por correo ni afirmar enviado cuando falló.

Las comprobaciones visuales se harán en Brave y compatibilidad Opera cuando corresponda, escritorio/móvil, con fixtures nuevas. Una base preparada por una etapa requiere comprobar compatibilidad con la siguiente; no aplicar migraciones a la copia activa o instalación habitual durante el análisis.

Fuentes técnicas externas consultadas: [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/overview) y [envío con Gmail API](https://developers.google.com/workspace/gmail/api/guides/sending). Confirmación real de configuración/entrega pendiente.


**23-11, entrada pública autorizada:** continuación `fix/v1-open-preview-entry`, desde `cb84099` de PR #25. [Prueba temporal sin contraseña adicional](REMOTE_DEMO.md#entrada-pública-temporal--23-de-noviembre-de-2026): misma base y claves; enlace nuevo y vencimiento original conservado. Portada/registro libres, comunidad/administración/fotos privadas con cuenta. 13 pruebas de entrada y 33 comprobaciones HTTPS nuevas, tipos/lint correctos. No renovar la ventana implícitamente.


**23-11, preferencia posterior:** amigos crean su propia solicitud en `/registro`, coordinación aprueba y comparte activación para que elijan contraseña. [Recorrido comprobado](REMOTE_DEMO.md#registro-propio-de-amigos--23-de-noviembre-de-2026). Repartir las instrucciones de registro actualizadas, conservar la misma ventana temporal y recoger incidencias reales. Las cuentas preasignadas ya no son la vía de esta prueba; no saltar aprobación ni implementar correo/Google automáticamente.

**23-11, en curso:** prueba con amigos autorizada en copia HTTPS temporal de la versión actual. [Alcance y comprobaciones](REMOTE_DEMO.md#prueba-con-amigos--23-de-noviembre-de-2026). Siguiente acción humana: repartir una cuenta por persona, probar en sus dispositivos/redes y anotar incidencias. Moderación y actualización cada 15 segundos conservadas; no empezar Google/alojamiento definitivo por esta activación. No renovar automáticamente el máximo de 24 horas.

**23 de noviembre de 2026.** Continuación `fix/v1-remote-registration-guidance`, [estado real](PROJECT_STATE.md). Revisión técnica autónoma del panel completada: [diagnóstico, mejoras y evidencia](ADMIN_USABILITY_REVIEW.md). Siguiente: aceptación de coordinación real con [guía actualizada](guia-administracion.md), observaciones concretas y N3. Las correcciones de comunidad de PR #22 están incluidas. No reconstruir panel, Logros, Insignias ni notificaciones. N1–N7 conserva el trabajo general posterior.

**Avance del 19-11:** [material oficial integrado](OFFICIAL_MEDIA.md), cuatro imágenes públicas/seis de comunidad para todos los aprobados, con carga sencilla desde administración. Esquema 17. No pedir otra vez la audiencia de estas fotos ni rehacer su integración. Pendiente cargar el catálogo desde el panel al adoptar esta rama en una instalación existente.

**Presentación preparada:** ocho publicaciones y 24 comentarios ficticios, dos álbumes con fotos oficiales y reacciones interactivas en una base nueva. Inicio, carrusel, avisos, publicaciones con fotos y conversación compartida ya funcionan. No repetir esta implementación ni sembrar ejemplos en la instalación real. Recoger observaciones del cliente y de coordinación; operación/recuperación N3 sigue como siguiente trabajo técnico general.

**Observación de presentación corregida:** Galería mostraba dos portadas y ocultaba a primera vista las seis fotos agrupadas. Ahora Fotos es la vista inicial, Álbumes es opcional y los filtros incluyen categorías interiores. No rehacer ni duplicar archivos/conversaciones. 32 comprobaciones nuevas de navegador; [detalle](COMMUNITY_HOME_STORIES.md#corrección-de-visibilidad-en-galería).

**Presentación desde otra ubicación:** [demo remota temporal](REMOTE_DEMO.md) autorizada por Cloudflare, máximo 24 horas. Mantener PC conectada; compartir claves solo por canal privado. No confundir con Vercel antiguo ni con infraestructura final.

**Prioridad nueva del usuario: diseño de toda la comunidad.** [Plan y primera muestra](COMMUNITY_DESIGN.md) de Inicio/Retos, fondo, puntos, reacciones, insignias grandes, perfil y notificaciones independientes ya comprobados con 130 casos. Recoger observaciones y refinar la muestra; continuar después con Galería/Logros/estados y coherencia de interacciones según la tabla. No tratar toda la comunidad como terminada ni reconstruir sus funciones. La copia remota anterior se conserva; N3 vuelve a continuación del bloque visual.

**Observación visual siguiente atendida:** [publicaciones simplificadas](COMMUNITY_DESIGN.md#publicaciones-y-conversación-más-sencillas), una columna, emojis sin nombres visibles y detalle de conversación; 124 comprobaciones nuevas. Revisar esta muestra con el usuario y continuar la tabla de refinamientos sin rehacer las funciones.

**Observación siguiente atendida:** [cabecera y novedades](COMMUNITY_DESIGN.md#cabecera-y-novedades-en-un-solo-lugar), sin franjas de demostración/gestión, cuenta reubicada y avisos con fotos en un carrusel; 122 comprobaciones nuevas. Mantener identidad de CAI y separación real de datos/entornos. Revisar visualmente con el usuario antes de ampliar el acabado.

**Modelo de Logros implementado:** [L1–L5 conectados](COMMUNITY_DESIGN.md#logros-insignias-y-perfiles-implementados), código `5349283`; ya no es propuesta pendiente. Logros personales e imágenes, validación privada/publicación independientes, 21 insignias obtenidas y perfiles sociales. Revisar pantallas/niveles con el usuario y corregir observaciones concretas; después N3, sin reconstruirlo. Adopción/migración de instalaciones existentes y servicios externos siguen pendientes.

**Punto 1 atendido en primera pasada:** [cierre visual](COMMUNITY_DESIGN.md#cierre-visual-primera-pasada), código `5bd4c2a`. 454 comprobaciones de interfaz y 108 de regresión de Logros, tipos/lint/build. Recoger ajustes visuales concretos; punto 2: comprobar tareas con una persona administradora, sin reconstruir el panel. N3 puede prepararse de forma aislada; cuentas/servicios de CAI y alojamiento siguen al final.

## Orden de trabajo general posterior

| ID / prioridad | Pendiente | Qué puede avanzar desarrollo solo | Qué necesita CAI/usuario y criterio de cierre |
| --- | --- | --- | --- |
| N1 · base técnica comprobada | Preparación de producción | [Implementado y ensayado](PRODUCTION_PREPARATION.md): configuración separada, proxy/origen, cookies seguras, datos privados, bootstrap, preflight, salud/logs/cierre y respaldo reutilizado. 217 API/104 navegador seleccionadas. | Configurar/probar TLS, dominio, intermediario, proceso y disco del proveedor elegido. La simulación no valida infraestructura real. No rehacer esta base ni contratar/publicar ahora. |
| N2 · revisión local completada | Revisión integral del alcance ampliado | [17-11: 193 API y 1,314 navegador aprobados](v1-integral-review-2026-11-17.md), modelos, lint/build, visual y trece bloqueos privados. Repetir recorridos pertinentes ante cambios; conservar observación intermitente del simulador sin atribuirle una causa no confirmada. | Aceptación humana de CAI, volumen esperado y verificación en infraestructura final pendientes. No repetir toda la matriz sin motivo ni presentar la prueba local como producción. |
| N3 · siguiente | Operación de base/medios e instalación | Mantener SQLite; ampliar ensayo/procedimiento de actualización y recuperación separada. Bootstrap/preflight productivos y copia consistente/verificación ya funcionan; reutilizarlos. Preparar separación de datos ficticios y pasos de entrega sin tocar la base habitual. | Custodia, retención, frecuencia, ubicación y responsables. Cierre: recuperación completa y actualización repetidas también en el alojamiento definitivo. |
| N4 · mantenimiento | Alertas y fallos históricos | Revisar versiones compatibles cuando cambien herramientas o antes de publicar; capturar diagnóstico si reaparecen intermitencias Opera. | Cierre: auditoría, instalación reproducible y checks pertinentes, sin force/overrides incompatibles ni afirmar reparación por un reintento. Diez avisos moderados de desarrollo registrados, no auditados hoy. |
| N5 · tanda final | Google y correo reales | Preparar guías/casos de prueba y configuración sin cuentas personales. La integración Google y los avisos/recuperación local ya están. | Proyecto/cuenta de CAI, remitente/proveedor, orígenes finales y verificación de entrega. Cierre: alta/aprobación/acceso/revocación y entrega/expiración/errores comprobados realmente. |
| N6 · tanda final | Contenido, permisos y panel intuitivo | Fotos recibidas e integradas; importación y audiencias comprobadas. Continuar con textos comerciales y tareas de aceptación del panel; reutilizar la carga existente. | Material comercial, programas/horarios, imágenes/autorizaciones, tutores, responsables y reglas finales. Cierre: persona administradora completa tareas y se registran/corrigen dificultades. Pruebas automáticas no sustituyen esa sesión. |
| N7 · último | Presupuesto, contratación y despliegue | Preparar necesidades técnicas y opciones a revisar al acercarse a la entrega. | Cliente aprueba costes/proveedor/dominio/mantenimiento. Después: configurar, comprobar permisos/HTTPS/copias/servicios desde internet y entregar accesos/guías. No contratar ni publicar implícitamente. |

No rehacer comentarios, reacciones, retos, insignias, panel, grupos o recuperación local: ya están conectados. Tener una dependencia externa no autoriza inventar módulos nuevos para mantenerse ocupado.

## Vídeos: opcionales y de menor prioridad

Se incluyeron inicialmente y después el usuario señaló que no eran tan importantes. Se retiran del camino obligatorio de entrega; no se da por cancelada para siempre la posibilidad. Reconfirmar prioridad antes de desarrollarlos. Si se retoman: **solo coordinación sube**, grupo autorizado ve; validar formato/tamaño/duración/cuota, reproducción/rangos autorizados, apoyo textual, retirada y copia consistente. No hay ese servicio actualmente y no se presenta la galería de imágenes como vídeo.

## Propuestas por elegir, sin implementación

| Propuesta | Diferencia frente a lo existente |
| --- | --- |
| Repaso personalizado de errores/temas | Ya hay historial con explicaciones; falta seleccionar práctica dirigida, separada de puntos diarios. |
| Vista pedagógica de coordinación | Ya hay puntos/días/concesiones privados; falta resumen autorizado de actividad y temas a reforzar, sin ranking público. |
| Buscar concesiones por alumno/grupo/fecha | Ya existen revisión, estados, historial y páginas; sería ampliación de filtros. |
| Bienvenida breve opcional | Registro/activación ya funcionan; sería orientación de primera entrada, omisible. |
| Biblioteca de vídeos con búsqueda/continuación | Depende de que se elija implementar vídeos; no empezar como tarea independiente. |

Cambio verificado de correo de acceso y vinculación de cuentas Google/contraseña siguen siendo decisiones de alcance; no enlazar identidades por coincidencia de correo ni ampliar esas funciones silenciosamente. Pagos, chat privado y cursos completos no se incluyen automáticamente.

## Calendario

El 12 de noviembre se habló de tres semanas. Los documentos de planificación registran 2 de diciembre como objetivo inicial y una propuesta posterior hasta el 3. **Fecha exacta de entrega por confirmar; la auditoría del día 17 no reinicia otras tres semanas.** Preservar esos planes como históricos y reservar margen para validación/servicios externos en la última tanda. No prometer plazos a partir del número de commits o la velocidad de escritura.

## Siguiente movimiento

F5 está comprobado en `feat/v1-daily-challenges-refresh`. **Siguiente F6: Google/correo institucionales**, reutilizando lo preparado y separando trabajo autónomo de configuración externa de CAI. Probar registro/aprobación/activación/recuperación/entrega real cuando estén cuenta, remitente y orígenes. Top sigue esperando decisión del cliente. Antes de entregar, adoptar la rama completa en una copia/muestra autorizada, recoger observaciones humanas y cerrar operación/recuperación; alojamiento y presupuesto al final. No rehacer registro, comunidad, Logros, publicador, comentarios, carrusel o F5 ya terminados.
