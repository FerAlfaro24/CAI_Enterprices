# CAI — candidata de entrega del25-11-2026

## Estado y base

Rama `release/cai-v1-candidate-2026-11-25`, desde `04bb0df` de la integrada. El cliente aprobó la presentación y el diseño general según lo informado por el titular el25-11. Esto no constituye una prueba de operación con datos reales. La presentación pública continúa en `feat/demo-community-content`/`324b474`/PR#41; no se cambia su alias ni se fusiona su adaptador en la candidata.

La comparación encontró12 commits posteriores a la integrada. Los cambios de publicaciones recientes son contenido ficticio y enlaces exclusivos de presentación. El diseño de comunidad, formularios, moderación, Logros, Retos, visor y administración ya pertenecen a la integrada. Google escolar y correo real también existen: el verificador de Google para la muestra Vercel no sustituye las sesiones y aprobación del backend escolar. No hace falta recrear estas funciones.

La candidata conserva el backend Node/SQLite esquema23 y la interfaz conectada de esa base. No incluye atajos de coordinación, credenciales ficticias, publicaciones de ejemplo, API de presentación ni portadas de referencia añadidas para el cliente. Las fotos públicas anteriores se conservan; las seis fotos privadas requieren instalación privada aparte. Top sigue pendiente de decisión específica; vídeos opcionales.

## Preparar un paquete revisable

Con Git limpio y Node24 >=24.12.0:

```powershell
npm.cmd run release:prepare
```

El comando compila la aplicación conectada y crea una carpeta nueva en `.local/delivery/`, con manifiesto de commit, esquema, archivos y SHA256. No reemplaza entregas anteriores. El directorio y sus rutas son locales/ignorados; Git conserva el procedimiento.

Solo se empaquetan frontend compilado, código necesario del servidor/shared/src, archivos de dependencias y plantillas deploy. El servidor necesita constantes de src; no omitir esa carpeta ni publicarla. Se excluyen tests, .local, .git, reference, node_modules, bases, claves y configuración privada. Solo se copian archivos fuente versionados; el empaquetador rechaza marcadores del modo de presentación en el frontend. INSTALL.md también queda incluido en el inventario. El manifiesto no contiene una base ni garantiza por sí solo una auditoría exhaustiva de secretos.

Instalar dependencias en la máquina de destino con `npm ci --omit=dev`: sharp debe corresponder a Linux y su arquitectura. No trasladar node_modules desde Windows. Node se limita a24 para evitar el salto automático a26 observado al compilar la muestra en Vercel.

## Instalación pendiente en alojamiento aprobado

La propuesta portátil conserva un único servidor Linux: Caddy sirve exclusivamente `/srv/cai/current/dist` y reenvía la API a Node en `127.0.0.1:3100`; ambos procesos están en la misma máquina. Datos separados en `/var/lib/cai`, con una sola instancia y disco persistente apto para SQLite/WAL. El backend ya conserva imágenes en SQLite; los medios oficiales privados usan su carpeta protegida.

`deploy/cai.service.example`, `deploy/cai.env.example` y `deploy/Caddyfile.example` son plantillas, no servicios instalados. Ajustar usuario/permisos, ruta de Node24, dominio y carpetas. Definir CAI_DOMAIN en el proceso de Caddy, coincidente con CAI_PUBLIC_ORIGIN de Node. El proxy sobrescribe Host/protocolo/IP, conserva Origin y rechaza rutas privadas; no colocar otro CDN/proxy delante sin adaptar y comprobar la confianza.

Secuencia para el servidor futuro:

1. Elegir proveedor gratuito apto, comprobar cuotas/disponibilidad, dominio y control de cuenta de CAI. Todavía no se creó ninguna cuenta, servidor, DNS o facturación.
2. Instalar el paquete y las dependencias. Preparar carpetas y permisos privados; configurar servicio/proxy a partir de las plantillas. Validar Caddy con `caddy validate` y la unidad con `systemd-analyze verify` antes de activarlos.
3. Renovar por canal privado la credencial SMTP compartida anteriormente. Preparar mail.json protegido y el ID público de Google; nunca copiar .local ni secretos a Git/dist/variables del frontend.
4. Crear explícitamente una base nueva mediante `production:setup`, con correo de coordinación y contraseña inicial en archivo privado. No usar `local:setup`, muestras previas o datos habituales como base de producción. La preparación se niega a sobrescribir una base existente.
5. Ejecutar `production:check`, comprobar HTTPS real y autorizar el origen definitivo en Google cuando corresponda. El permiso del dominio Vercel ya existe y no se solicita de nuevo.
6. Probar registro/aprobación/acceso por contraseña y Google, activación/recuperación con correo, una publicación/comentario, permisos y fotos desde dispositivos distintos. Esto será una prueba piloto real y acotada.
7. Comprobar reinicio, respaldo/recuperación y custodia fuera del servidor. Mantener copia del código anterior y respaldo previo a cada actualización; cambiar código no revierte esquemas de datos.

## Evidencia y límites de esta candidata

Validación completada sobre código dade9d2: tipos/build conectado y lint correctos; paquete405 archivos con SHA256 verificados, imports privados completos, base nueva esquema23 sin alumnos/publicaciones ficticios, arranque productivo, rechazo de protocolo incorrecto y persistencia al reiniciar. Prueba aislada en .local/tests, cerrada al terminar, sin SMTP/Google externos ni TLS real. No se repiten suites históricas. Las pruebas históricas de la integrada siguen documentadas en INTEGRATED_VERSION; no se vuelven a contar. No se modifica la base habitual ni la muestra pública.

Caddy/systemd/DNS/HTTPS/SMTP/Google reales del destino y dependencias nativas Linux se comprobarán al disponer del servidor. El equipo actual es Windows: revisar una plantilla no equivale a instalarla o verificar su funcionamiento en Linux. La revisión de alojamiento está en [HOSTING_OPTIONS](HOSTING_OPTIONS.md).
