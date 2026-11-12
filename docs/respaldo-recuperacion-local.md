# Respaldo y recuperación del entorno local

Procedimiento para quien mantiene el proyecto. El administrador utiliza el panel según [su guía de tareas](guia-administracion.md). Estas instrucciones corresponden al servicio local actual; la operación del servidor contratado se define al final.

## Crear una copia

Desde la carpeta del repositorio, en PowerShell:

```powershell
npm.cmd run local:backup
```

El comando crea un archivo nuevo dentro de `.local/backups` y muestra su ruta. Utiliza una copia consistente de SQLite, incluso si la API mantiene abierta la base con WAL. No sobrescribe la base activa. No copiar únicamente `.local/cai.sqlite` mientras haya escrituras: puede faltar contenido que siga en WAL.

La copia incluye cuentas, hashes de contraseñas y sesiones, solicitudes, autorizaciones registradas, grupos, ajustes, publicaciones, consultas, avisos, auditoría e imágenes procesadas, incluidas las retiradas. Son datos privados; las copias permanecen excluidas de Git. Se conserva la imagen procesada, no el archivo original elegido al subirla.

No incluye el código, las dependencias instaladas ni archivos separados de configuración. Mantener identificada la versión del proyecto utilizada. La configuración opcional de Google (`.local/google.json`) y la custodia de acceso se conservan separadamente y con protección adecuada; no se convierten en archivos públicos para facilitar la recuperación. El acceso inicial local es de pruebas y no debe reutilizarse en producción.

## Comprobar una copia

Usar la ruta exacta mostrada al crearla; este nombre es solo un ejemplo que debe sustituirse:

```powershell
npm.cmd run local:verify-backup -- ".local/backups/NOMBRE-DE-LA-COPIA.sqlite"
```

`local:verify-backup` abre la copia en **modo de solo lectura**. Comprueba integridad de SQLite, relaciones, versión de esquema compatible 9 o 10, registros principales y decodificación de las imágenes. El esquema 10 añade la cola privada de recuperación administrativa y hashes de enlaces; no guarda el enlace en texto. Devuelve únicamente totales; no imprime expedientes, credenciales o enlaces. Incluye las imágenes retiradas porque se conserva su historial.

No restaura, migra, repara ni modifica la copia. El comando rechaza como entrada la ruta habitual de la base activa. Una ruta inexistente no crea una base nueva. Si falla, conservar el archivo original y revisar la ruta, versión e integridad; no intentar resolverlo reemplazando la base en uso.

Una copia válida no demuestra por sí sola que incluya los cambios esperados: comprobar también la fecha y los totales con el estado que se pretendía conservar. La antigüedad y la frecuencia de las copias definitivas se acuerdan para la entrega.

## Ensayo de recuperación separado

Las pruebas automáticas trabajan en carpetas temporales propias bajo `.local/tests`. Crean datos ficticios, obtienen una copia y la abren por separado. Comprueban cuentas y bytes de imágenes, e inician una API aislada con esa copia: el alumno entra con su contraseña, mantiene su programa, no puede consultar solicitudes administrativas y una imagen retirada sigue inaccesible. No sustituyen `.local/cai.sqlite` ni borran copias del usuario. La verificación también comprueba que se detecta una imagen corrupta y que el archivo verificado permanece idéntico tras la lectura.

Para repetir las pruebas existentes:

```powershell
npm.cmd run test:api
```

El ensayo usa puertos locales temporales y una base independiente. No es una restauración de producción ni una prueba de entrega de correo/Google.

## Recuperar la base utilizada por el servicio

Esto requiere una operación específica acordada; **no se ejecuta como parte de crear o verificar un respaldo**.

1. Elegir la copia y la versión de código correspondiente. Comprobarla primero y ensayar su apertura por separado.
2. Acordar qué momento se recuperará. Revisar los cambios posteriores que no estarán en esa copia.
3. Detener el servicio antes de reemplazar archivos. Preservar íntegro el estado actual, incluidos los archivos WAL/SHM que correspondan, para poder volver atrás.
4. Preparar la recuperación en un destino aislado y revisar acceso, grupos, publicaciones, consultas e imágenes. No mezclar el WAL de una base con el archivo principal de otra.
5. Solo tras autorizar el reemplazo concreto, aplicar el procedimiento de mantenimiento y volver a comprobar permisos y recorridos. No reabrir el servicio al público como consecuencia automática de copiar un archivo.

Las copias contienen estados y sesiones del momento guardado. Antes de reabrir un entorno recuperado, revisar también suspensiones y accesos que se hubieran cambiado después. La restauración no es un mecanismo para deshacer una decisión administrativa aislada; usar las acciones del panel cuando correspondan.

No se proporciona una orden que sobrescriba la base activa ni elimine archivos del usuario. El procedimiento definitivo de almacenamiento, retención, copias externas, custodia y recuperación del servicio contratado queda pendiente de su infraestructura y de la validación del responsable.

## Comprobado en esta etapa

Se creó y verificó una copia local real de pruebas: esquema 9, 119 solicitudes/alumnos, 104 cuentas, 76 publicaciones y tres imágenes. Los totales son una fotografía del ensayo, no una condición que deban cumplir copias posteriores. La suite comprueba por separado imágenes, cuentas, acceso y lectura sin alterar el archivo. No se restauró sobre la base activa.
