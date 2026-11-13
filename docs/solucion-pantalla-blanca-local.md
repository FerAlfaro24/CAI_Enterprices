# Pantalla en blanco al abrir el desarrollo local

Corrección en `fix/v1-dev-preview-cache`, desde `bdef066`, para el fallo reportado al abrir `http://127.0.0.1:5173/`.

## Diagnóstico y cambio

La portada devolvía HTML 200 y el servicio respondía al health check, pero React no llegaba a montarse: root vacío y tres respuestas **504 Outdated Optimize Dep** para react, react-dom/client y jsx-dev-runtime. La comprobación anterior solo había consultado disponibilidad HTTP; no demostraba que la interfaz se renderizara.

Los verificadores de modelos crean servidores Vite SSR con `configFile:false` y la caché predeterminada. La web abierta también usaba esa caché. El archivo de metadatos esperado en la caché predeterminada no estaba presente al diagnosticar; no se identificó el proceso exacto que la invalidó. Se configuró en `vite.config.ts` una caché dedicada de web, `node_modules/.vite-cai-web-${apiPort}`, separada de esos verificadores y entre entorno habitual/fixtures con distintos puertos de API.

El cambio de configuración reinició internamente Vite. No se detuvo ni reinició la API habitual, no se abrió/migró la base, no se leyeron credenciales ni se borraron datos o cachés manualmente. La web habitual se deja encendida para el usuario. Ante una pestaña aún desactualizada, recargarla para obtener los módulos vigentes.

## Comprobaciones de esta corrección

- Fallo reproducido en un contexto nuevo de Brave: body vacío, tres módulos 504, encabezado sin contenido de aplicación.
- Después del cambio: portada con h1 visible, root montado, sin errores de ejecución ni respuestas fallidas de scripts.
- Modelos Retos: 27 comprobaciones y una igualdad; Community: 29 y cuatro igualdades. Luego se volvió a abrir la web en el mismo servidor que seguía encendido.
- Brave y Opera GX, contextos aislados y sin iniciar sesión: `/`, `/login` y `/admin` renderizan sus encabezados y root con contenido a 375 px, sin errores JavaScript ni módulos fallidos. `/admin` muestra correctamente el formulario anónimo, no datos privados del panel.
- Tipos (`npm.cmd run typecheck`), ESLint sobre `vite.config.ts` y `git diff --check`: correctos. HEAD sin cookies: las 13 rutas privadas del verificador siguen bloqueadas.

No se repitió la suite API ni los recorridos autenticados; no se cambió el código de negocio, acceso o base. No se afirma que health check equivalga a versión de API comprobada o a un recorrido completo con las cuentas del usuario.

## Continuidad

Para dar un enlace de prueba, comprobar siempre que la interfaz se renderiza en un navegador, además del HTTP. Los verificadores SSR no deben compartir la caché de la web abierta. No eliminar `node_modules` ni reiniciar/migrar datos personales para resolver esta incidencia.
