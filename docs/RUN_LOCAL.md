# CAI — abrir y probar localmente

**Guía operativa al 17-11-2026**, para la línea de [START_HERE](START_HERE.md). Node >=24.12.0, npm >=10 y Git. Solo datos ficticios. La documentación no mantiene encendido ningún servidor: los enlaces localhost funcionan mientras se ejecutan los procesos en ese equipo.


**Entrega de Logros/insignias/perfiles (19-11):** usar la rama actual de START_HERE con API de esquema 19. Para una presentación nueva independiente con medios oficiales privados instalados: `node server/tests/community-showcase-server.ts 4216 3226 --no-latest`, eligiendo otros puertos si ya están ocupados. Cada ejecución crea otra base; no reiniciar la muestra para actualizar contenido. La muestra de esta entrega se comprobó en 4216, con accesos ficticios de la guía de presentación. No usar el frontend nuevo contra la API antigua de 4194 ni migrar la base habitual para probar. [Funciones y límites](COMMUNITY_DESIGN.md#logros-insignias-y-perfiles-implementados).

## Elegir entorno antes de arrancar

- **Quiero explorar Retos/Logros:** usar la fixture nueva separada siguiente. No necesita leer, preparar o migrar la base habitual.
- **Soy responsable de una instalación local propia:** seguir la sección de instalación, con respaldo y permiso al actualizar. No confundirla con las pruebas desechables.

Un clon de main no contiene la versión actual. Elegir la rama indicada en START_HERE antes de instalar con `npm.cmd ci`. Si GitHub pide autenticación, usar el gestor de credenciales existente; nunca pegar tokens aquí o en un archivo versionado.

## Prueba separada de comunidad

Compilar la rama actual:

```powershell
npm.cmd run build
```

En una primera terminal, desde la carpeta del repositorio:

```powershell
$env:CAI_API_PORT = '3101'
node server/tests/badges-browser-server.ts
```

En otra terminal, desde esa misma carpeta:

```powershell
$env:CAI_API_PORT = '3101'
npm.cmd run preview -- --host 127.0.0.1 --port 4180 --strictPort
```

Abrir **http://localhost:4180/login**. Cuenta exclusivamente ficticia creada por esa fixture:

- Correo: `brave-author-badges@example.test`
- Contraseña ficticia: `Frase ficticia de insignias navegador 2026`
- Pulsar **Entrar a mi espacio**; después Retos o Logros.

No son credenciales reales ni funcionan en la base habitual de 5173. La fixture crea otra base en `.local/tests/badges-browser-*`, escribe metadatos en browser.json y usa día fijo **2026-11-05** con actividad previa de muestra. Eso permite ver la colección y practicar; no representa el reloj del servicio habitual. Repetir el arranque crea otra fixture; los datos de la anterior permanecen en su carpeta y no se reutilizan automáticamente. No es una cuenta de producción.

Para probar el panel de esa misma fixture: http://localhost:4180/admin, correo ficticio `admin-badges@example.test`, misma contraseña ficticia. Solo incluye cuentas y actividad de prueba; no conectar personas reales. Usar localhost para esta vista separa sus cookies de la instalación habitual abierta en 127.0.0.1. No mezclar nombres de host durante un mismo recorrido.

Dejar ambos procesos abiertos durante la prueba. Ctrl+C los detiene en sus terminales. No detener procesos ajenos si un puerto está ocupado. Las fixtures de otros módulos, secretos ficticios y parámetros de recorridos están en [TESTING](TESTING.md) y los informes respectivos; no reutilizar una fixture ya consumida para afirmar un recorrido desde cero.

## Instalación local propia, no prueba automática

**Solo en una carpeta recién clonada y sin datos previos**, para quien prepara su propio entorno ficticio:

```powershell
npm.cmd ci
npm.cmd run local:setup
npm.cmd run dev:local
```

Setup crea la base y un administrador con contraseña aleatoria en `.local/acceso-inicial.txt`, ignorado por Git. Ese archivo es privado: no subirlo, copiarlo a documentación o compartirlo. No hay contraseña universal. Setup puede abrir/migrar la base antes de comprobar la cuenta; **no usarlo para reparar un acceso o repetir pruebas en una instalación existente**.

En un entorno existente, cambiar de versión y arrancar la API puede aplicar migraciones. Antes: permiso para esa actualización concreta, copia consistente y versión conocida. No abrir ni migrar `.local/cai.sqlite` durante pruebas del agente. Ver [respaldos](respaldo-recuperacion-local.md).

Desarrollo habitual: http://127.0.0.1:5173, API en 127.0.0.1:3100. `dev:local` inicia ambos; `dev` inicia solo Vite y `dev:api` inicia solo API en modo watch. No reiniciar la API habitual implícitamente: conserva datos y puede aplicar migraciones al arrancar.

## Rutas y cuentas

| Ruta | Uso |
| --- | --- |
| `/` | Institucional |
| `/registro` | Solicitud de alumno/tutor |
| `/login` | Acceso de alumno aprobado y activado |
| `/community` | Comunidad protegida; Retos y Logros dentro de la navegación |
| `/mi-inscripcion` | Estado/ficha propia |
| `/admin` | Acceso/resumen administrativo |
| `/admin/solicitudes`, `/admin/alumnos` | Revisión y cuentas |
| `/admin/publicaciones` | Historias y comentarios |
| `/admin/retos`, `/admin/insignias` | Calendario/banco y reconocimientos |
| `/admin/galeria`, `/admin/mensajes`, `/admin/configuracion` | Medios, bandejas y ajustes |

Una cuenta administradora no crea una sesión de alumno. En una instalación propia, enviar solicitud, revisar/aprobar y activar contraseña con el enlace preparado por coordinación. Entrega real de correo y Google pendientes. No sacar contraseñas de datos personales para facilitar una prueba.

## Problemas habituales

- **Pantalla en blanco:** comprobar consola/renderizado y caché de desarrollo; ver [corrección de caché](solucion-pantalla-blanca-local.md). La web usa `.vite-cai-web-${apiPort}`; no compartirla con comprobadores SSR ni borrar node_modules/datos como primera acción.
- **npm.ps1 bloqueado:** usar npm.cmd. No cambiar políticas de Windows por esta guía.
- **Puerto ocupado:** identificar el proceso/terminal correcto; no matar todos los procesos Node. `--strictPort` evita abrir otra dirección silenciosamente.
- **No conecta el servicio:** comprobar ambas terminales y CAI_API_PORT del proxy y la API. Un build nuevo requiere recargar; preview no recompila al editar.
- **No puede entrar:** comprobar host/puerto/entorno, cuenta aprobada/activada y suspensión. La fixture y la instalación habitual usan bases distintas.
- **Cambios del servidor no aparecen:** dev:local no observa código de API; un reinicio debe ser consciente de la base y autorización. Para pruebas, arrancar otra fixture.

Esta guía inicia **modo local**. La [preparación productiva](PRODUCTION_PREPARATION.md) requiere configuración/base privadas distintas y proxy HTTPS; no se activa con este recorrido ni se considera despliegue validado. Usar una terminal sin variables de producción para las pruebas locales; mezclar ambos entornos se rechaza. No preparar una base real para resolver un error de configuración de pruebas.
