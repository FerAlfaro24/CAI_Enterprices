# Panel de administración

## Alcance

Implementa P3 (`prototype-plan.md`) y RF-04, RF-05 y RF-07 (`requirements.md`) como prototipo navegable: Resumen, Solicitudes de ingreso, Publicaciones, Alumnos y Configuración.

Todo funciona con datos ficticios en memoria. No hay autenticación, backend ni persistencia; el rol de administrador es simulado.

## Referencias de diseño

Se tomaron como inspiración dos plantillas de Framer, sin copiar código ni recursos:

- **Scalvix** (`scalvixx.framer.ai`): estructura de menú lateral con ítem activo sólido, fila de indicadores con mini barras y cuadrícula de tarjetas con gráficas y listas con estado.
- **Saatosa** (`saatosa.framer.website`): gráfica de dona con cifra central y mensaje de estado, etiquetas de categoría con color.

Colores, tipografía (Figtree) y radios provienen de la landing de CAI (`landing.module.css`), no de las plantillas.

## Rutas

| Ruta | Vista |
| --- | --- |
| `/admin` | Resumen: indicadores, actividad semanal, estado de solicitudes, solicitudes pendientes y publicaciones en cola. |
| `/admin/solicitudes` | Tabla filtrable por estado y búsqueda; detalle en diálogo; aprobar, rechazar y deshacer. |
| `/admin/publicaciones` | Cola de moderación en tarjetas, filtros por estado y tipo; revisión en diálogo con motivo obligatorio para rechazar. |
| `/admin/alumnos` | Directorio con filtros por estado, programa y búsqueda; ficha con suspensión y reactivación. |
| `/admin/configuracion` | Reglas de privacidad y participación con vista previa en la comunidad; equipo administrador. |
| `/admin/*` | Redirige a `/admin`. |

## Estructura

```text
src/
├── layouts/AdminLayout.tsx          # Menú lateral, barra superior, estado compartido y región aria-live
├── pages/
│   ├── AdminPage.tsx                # Resumen
│   ├── AdminRequestsPage.tsx        # Solicitudes de ingreso
│   ├── AdminPostsPage.tsx           # Publicaciones
│   ├── AdminStudentsPage.tsx        # Alumnos
│   └── AdminSettingsPage.tsx        # Configuración
└── features/admin/
    ├── admin.module.css             # Estilos y tokens del panel
    ├── state.ts                     # Reducer, contexto (useAdmin) y utilidades
    ├── data/mockData.ts             # Datos ficticios
    └── components/
        ├── ui.tsx                   # Icon, Avatar (iniciales), StatusBadge, TypeTag, Switch
        ├── charts.tsx               # KpiCard, LineChart, Donut, Legend (SVG propio)
        ├── RequestActions.tsx       # Aprobar / Rechazar / Deshacer solicitudes
        ├── RequestDialog.tsx        # Detalle de solicitud (<dialog> nativo)
        ├── posts.tsx                # PostCard y PostDialog (moderación)
        └── StudentDialog.tsx        # Ficha de alumno
```

## Decisiones

- **Estado:** `useReducer` en `AdminLayout`, compartido con las vistas mediante el contexto de `<Outlet>`. Las decisiones se mantienen al navegar entre vistas y se pierden al recargar. «Reiniciar demo» (Resumen) restaura todos los datos.
- **Secciones conectadas:** aprobar una solicitud agrega al alumno al directorio con la etiqueta «Nuevo»; los indicadores del Resumen y los contadores del menú se calculan a partir del estado.
- **Moderación:** rechazar exige elegir un motivo. Las publicaciones que muestran a otras personas o incluyen enlaces exigen confirmar la verificación antes de publicarse y no ofrecen publicación rápida desde la tarjeta.
- **Menores de edad (RNF-02):** una solicitud de un menor no puede aprobarse sin la autorización del tutor. Sus perfiles son privados mientras la opción correspondiente esté activa. «Exigir autorización del tutor» y «Revisar todas las publicaciones» aparecen como obligatorias y no se pueden desactivar.
- **Imágenes:** no se usan fotografías de alumnos; los avatares muestran iniciales y las imágenes de publicaciones son marcadores ilustrativos.
- **Cifras:** el directorio tiene 19 alumnos de muestra (15 base más las solicitudes aprobadas), una muestra reducida frente a los 30–100 alumnos previstos en `vision.md`. Los indicadores se calculan sobre esa muestra para que sean coherentes entre vistas.
- **Gráficas:** SVG hecho a mano para no añadir dependencias. La gráfica de línea incluye una tabla equivalente oculta para lectores de pantalla.
- **Accesibilidad:** enlace para saltar al contenido, navegación con `aria-current`, filtros con `aria-pressed`, interruptores con `role="switch"`, anuncios de cada decisión en una región `aria-live` y textos ocultos que identifican a quién afecta cada botón.
- **Responsive:** menú lateral fijo desde 1024 px; por debajo se convierte en panel deslizable (se cierra con Escape, el fondo o al navegar). Bajo 760 px las tablas se muestran como tarjetas.

## Verificación

- `npm run typecheck`, `npm run lint` y `npm run build`: correctos.
- Chrome, escritorio: aprobación de solicitudes, filtros, diálogos y cierre con Escape; moderación con verificación obligatoria y error al rechazar sin motivo; directorio con altas desde solicitudes; interruptores que actualizan la vista previa.
- Chrome, 375 px (iframes): las cinco vistas sin desbordamiento horizontal; menú deslizable funcional.

## Pendiente

- Validar con el cliente textos, programas, motivos de rechazo y las reglas de autorización de tutores.
- Decidir comentarios y reacciones (RF-09); las opciones existen solo como interruptores de demostración.
- Conectar con la vista de Comunidad cuando exista, para que lo publicado aparezca en el feed.

## Revisión guiada de solicitudes — UX-01

El inicio de la fase de entrega local se detalla en [el plan de tres semanas](local-delivery-plan.md). Para facilitar el uso por coordinación, Resumen y Solicitudes muestran una sola acción principal por registro: «Revisar solicitud»; las solicitudes resueltas ofrecen «Ver decisión». La ayuda visible indica si falta confirmar la autorización de un tutor.

Las decisiones se toman dentro del detalle, después de consultar los datos y una guía breve. Cerrar el detalle no modifica el estado; se conservan aprobar, rechazar, devolver a pendiente y la restricción de autorización para menores. Los escenarios, datos en memoria y avisos de demostración permanecen vigentes.

Archivos: `RequestReview.tsx`, `RequestDialog.tsx`, `AdminPage.tsx`, `AdminRequestsPage.tsx` y estilos del panel. La prueba de integración existente se adapta al recorrido guiado e incluye cerrar sin decidir y el requisito visible del tutor.

Validación de UX-01: lint, typecheck y build correctos; permanece el aviso conocido del bundle principal superior a 500 kB. La prueba de integración adaptada pasó 77 comprobaciones en Brave y 77 en Opera GX sobre el build local, con nueve rutas a 1440, 768, 375 y 320 px y sin errores ni advertencias de consola. Se comprobó además en Brave abrir desde Resumen con Enter, cerrar con Escape y recuperar el foco, rechazar y deshacer, y el bloqueo por autorización pendiente. Los diálogos a 375 y 320 px no desbordan horizontalmente y sus acciones son alcanzables mediante desplazamiento. Se inspeccionaron capturas de escritorio y móvil. No se probó con dispositivos físicos ni lectores de pantalla.
