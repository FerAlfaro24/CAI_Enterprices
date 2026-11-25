# CAI — prueba temporal en Google Cloud

## Decisión del titular,25-11-2026

Objetivo aclarado: sistema conectado real para una presentación final, con2 o3 personas simultáneas y posibilidad de cambiar de alojamiento después. Se autoriza preparar una prueba gratuita temporal y avanzar autónomamente; no un plan de pago. Esta decisión sustituye la prioridad anterior de evaluar primero Oracle Always Free para una instalación duradera.

Rama `ops/cai-google-cloud-trial-2026-11-25`, desde `b4a2f46` de la candidata/PR#42. Se reutiliza el paquete conectado verificado, Node24, SQLite23 y las plantillas existentes. No reconstruir backend ni trasladar la muestra ficticia de Vercel.

## Paso del titular

1. Abrir la consola de Google Cloud con la cuenta institucional de CAI y comprobar que sea esa cuenta.
2. Entrar a la prueba gratuita. Confirmar México y la información real solicitada por Google.
3. Completar personalmente los datos y la verificación del medio de pago, así como la aceptación de las condiciones de la prueba. Google puede mostrar una autorización bancaria temporal; no enviar datos de tarjeta por chat.
4. Al terminar, confirmar que Google muestra **Free Trial / Prueba gratuita** y crédito disponible. No pulsar **Actualizar/Upgrade a cuenta de pago**.
5. Volver al chat para continuar. Si Google rechaza elegibilidad, muestra un cargo real o exige pasar a pago, detenerse e informar del mensaje.

La oferta publicada para cuentas elegibles es de300 USD/90 días. Google indica que no cobra automáticamente al finalizar la prueba sin actualización manual a pago. No se promete elegibilidad hasta verla en la cuenta. [Oferta](https://docs.cloud.google.com/free/docs/free-cloud-features) y [verificación/fin de prueba](https://cloud.google.com/signup-faqs).

## Preparación autónoma y siguientes acciones

`deploy/google-cloud-trial-plan.json` es un plan revisable, no una llamada API ni una orden ejecutada. Propone una sola VM e2-small/2GiB, Debian12, disco estándar20GiB y una IP efímera. Consumen crédito de la prueba: no confundir e2-small con la cuota permanente e2-micro Always Free. La estimación real, región, capacidad y estado de crédito se revisan antes de crear recursos.

Después de verificar la prueba: preparar la VM, instalar Node24/dependencias nativas y Caddy, subir el paquete por canal privado, preparar datos fuera del código y configurar HTTPS/subdominio gratuito. No comprar dominio ni añadir balanceadores, GPU, Kubernetes, servicios de pago o réplicas. Evitar permisos Google innecesarios en la VM: el sistema usa identidad Google de alumnos y SMTP, no necesita acceso general a recursos cloud.

SSH, reglas de acceso público y permisos se concretarán y revisarán al llegar al recurso correspondiente. La API queda en loopback; solo se exponen web/HTTPS. El proxy y Node comparten máquina. El alta del subdominio y el origen OAuth definitivo están pendientes; no ampliar permisos de Google sin la confirmación que corresponda.

Preparar una base nueva de prueba, cuentas individuales y correo/Google reales del entorno; no migrar ni leer la base habitual. La credencial SMTP anteriormente compartida necesita renovación privada. Probar un recorrido de alumno y coordinación con2 o3 dispositivos; una presentación con usuarios simultáneos no está acreditada por las pruebas locales anteriores.

Al concluir, respaldar SQLite/medios y acordar cierre de VM/discos/IP. No borrar recursos o datos automáticamente; detener una VM puede conservar almacenamiento que siga consumiendo crédito. El traslado posterior requiere respaldo y configuración del nuevo origen. Fecha final pendiente de indicar por el titular.

## Estado observado

Configuración y guía preparadas. Pendiente inspeccionar la pantalla real de Google y registrar el punto exacto de intervención del titular. No hay prueba activada, VM, reglas de red o despliegue creados por esta entrega.

## Fuentes oficiales

- [Máquinas E2](https://docs.cloud.google.com/compute/docs/general-purpose-machines).
- [Crear VM Debian](https://docs.cloud.google.com/compute/docs/instances/create-vm-from-public-image).
- [Cuenta de servicio de VM](https://docs.cloud.google.com/compute/docs/access/service-accounts).
- [SMTP465/587 desde VM](https://docs.cloud.google.com/compute/docs/tutorials/sending-mail): compatibles con el transporte existente, pendiente prueba real del destino.
