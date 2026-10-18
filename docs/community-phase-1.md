# CAI Community — Fase 1: base visual y navegación

Implementación limitada a la fase 1, sobre `feat/community`. Referencia: los cinco PNG aprobados de `design-reference/`. No se implementan el hero editorial, las nuevas tarjetas, álbumes ni el sistema de insignias. Las siguientes fases requieren revisión del usuario.

## Arquitectura y cambios

- `CommunityShell` contiene cabecera, aviso compacto, controles de demostración, un único main y footer. Ya no monta una barra lateral ni obliga a usar tres columnas.
- `CommunityNavigation` sustituye a `CommunitySidebar` y presenta exactamente Inicio, Logros, Galería y Retos. La marca permite volver a Inicio.
- `CommunityWorkspace` compone su contenido existente mediante `CommunitySectionLayout`, que admite una columna contextual opcional. Las cuatro secciones mantienen sus vistas actuales. El directorio conservado se presenta sin esa columna.
- `MemberProfileDialog` abre la ficha ficticia de Alex desde el avatar de cabecera. Muestra biografía, puntos e insignia derivados de los datos existentes, sin crear un sistema nuevo. Permite abrir los doce perfiles del directorio anterior. Incluye foco inicial, ciclo Tab/Shift+Tab, Escape y retorno de foco.
- El selector de tema tiene dos botones con nombres accesibles y estado `aria-pressed`. Las variables CSS se heredan únicamente dentro de la comunidad mediante `data-theme`. No se modifica `html`, `body`, los layouts ajenos ni el router.
- Figtree, azul oscuro `#0A1F4D`, azul `#1F56D6`, amarillo `#FFCD1F` y fondo claro `#F4F7FF` se declaran en `communityTheme.module.css`. La interpretación oscura usa fondo `#0B1427`, superficies `#15243E`, texto claro y acentos CAI. Los colores de las tarjetas existentes se adaptan al tema; se conservan su estructura, contenido y geometría de estilos.
- Las opciones Alumno/Moderador, reinicio, enlaces institucional/administración, acceso al directorio y acuerdos de convivencia quedan en el bloque desplegable «Opciones de demostración». El aviso de prototipo sigue visible cuando el bloque está cerrado.
- Cabecera de una fila en escritorio y dos filas hasta 900 px. Las cuatro opciones permanecen visibles en móvil. Contenedores fluidos y columnas apiladas; sin dependencias nuevas.

## Persistencia y aislamiento

Solo se guarda `light` o `dark`, con la clave `cai.community.demo.theme.v1`. El tema inicial sin preferencia es claro. Si localStorage está bloqueado o falla, el selector sigue funcionando durante la visita. «Reiniciar demo» reinicia contenido y puntos, conservando el tema.

Publicaciones, comentarios, perfiles, moderación y resultados continúan como datos ficticios en memoria. No se almacenan formularios ni información de alumnos. No se añade autenticación ni seguridad real.

## Funcionalidad conservada

Quince publicaciones aprobadas y dos pendientes iniciales; avisos fijados y cronología; cuatro filtros; cinco reacciones con cambio/retirada; comentarios y creación de contenido ficticio; validación; aprobación/rechazo; fijación/desfijación; reinicio; carruseles con controles y teclado; retos compartidos y selector de día demo; explicación de aciertos/errores; 5 puntos por participar y 10 adicionales por acertar; límite de una respuesta puntuada por día; reconocimiento por participación; doce perfiles ficticios.

Los archivos de fixtures, tipos, reducer, contexto, provider y componentes de publicaciones, comentarios, formulario, reto, moderación y directorio mantienen su código. El acceso a perfiles ya no es una quinta sección principal.

## Comprobaciones realizadas

| Comprobación | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Correcto. |
| `npm.cmd run lint` | Correcto, sin advertencias. |
| `npm.cmd run build` | Correcto, sin publicación. |
| `node scripts/check-community-model.mjs` | 29 comprobaciones y 4 comparaciones de igualdad correctas. |
| Brave: cuatro secciones × dos temas × cinco anchos | 40 combinaciones a 1440, 1024, 768, 375 y 320 px, sin desbordamiento horizontal y con los botones de navegación dentro del viewport. |
| Persistencia | Modo oscuro conservado al recargar y al salir/regresar a `/community`. |
| Almacenamiento bloqueado | Lectura y escritura forzadas a fallar en una pestaña aislada; el selector siguió funcionando. |
| Perfil | Doce perfiles conservados; puntos e insignia actualizados tras retos; foco inicial, ciclo Tab/Shift+Tab, Escape y retorno comprobados. |
| Feed | Filtros con 15/3/4/15 resultados; añadir/retirar reacción; comentario nuevo visible. |
| Galería existente | Avance por botón y flecha de teclado. |
| Retos existentes | Acierto, error, explicación y 35 puntos tras tres días de muestra. |
| Publicaciones y moderación | Validación → pendiente fuera del feed → aprobar → 16 publicaciones; rechazo, fijar/desfijar y reinicio correctos. |
| Rutas | `/`, `/community`, `/admin` y 404 abren; tema limitado a la comunidad. |
| Opera GX | Cuatro secciones a 1440, 375 y 320 px; selector, persistencia y Escape del perfil correctos. |
| Consola | Cero errores y advertencias registrados en los recorridos de Brave y Opera GX. |
| Integridad | Comparación SHA-256 de 73 archivos existentes: solo cambian los cinco archivos originales de comunidad previstos (incluida la sustitución de Sidebar); referencia, PNG, landing, administrador, router y datos conservados. |

Las pruebas se realizaron con Vite local y perfiles de automatización aislados. No equivalen a una auditoría WCAG completa ni a pruebas en dispositivos físicos. Las fechas y resultados son ficticios.

## Revisión visual

Abrir [la página de revisión](../review/community-phase-1/index.html) para ver las capturas reales de Brave, sin necesitar el servidor.

| Captura | Estado |
| --- | --- |
| `01-escritorio-claro.png` | Inicio, 1440 × 900, tema claro, datos iniciales. |
| `02-escritorio-oscuro.png` | Inicio, 1440 × 900, tema oscuro, datos iniciales. |
| `03-movil-claro.png` | Inicio, 375 × 812, tema claro. |
| `04-movil-oscuro.png` | Inicio, 375 × 812, tema oscuro. |
| `05-perfil-movil-oscuro.png` | Perfil de Alex abierto en modo oscuro, 375 × 812. |
| `06-movil-320-oscuro.png` | Inicio en modo oscuro a 320 × 812. |
| `07-opciones-demo-oscuro.png` | Opciones secundarias abiertas, 1440 × 900. |
| `cabecera-escritorio-claro.png` / `cabecera-escritorio-oscuro.png` | Recortes de la cabecera real en ambos temas. |
| `cabecera-movil-claro.png` / `cabecera-movil-oscuro.png` | Recortes de cabecera real a 375 px, en ambos temas. |

Los recortes de elemento excluyen la barra de desplazamiento; las imágenes de viewport conservan las dimensiones indicadas. Las once imágenes están en `review/community-phase-1/`.

## Diferencias pendientes frente a Figma

- Los PNG muestran cinco enlaces; esta fase aplica la instrucción posterior de conservar solo cuatro y desplazar perfiles a accesos secundarios.
- La cabecera, la marca y la base cromática ya siguen la referencia. El tema oscuro es una interpretación autorizada, sin PNG oscuro aprobado.
- Se mantienen el encabezado sencillo, feed, tarjetas, cuestionario y galerías anteriores. El hero dividido, composición editorial, álbumes y dos pestañas de Logros todavía no se implementan.
- El aviso explícito de prototipo y las opciones demo se mantienen para demostrar las funciones existentes. En móvil se adapta la cabecera porque las referencias entregadas solo cubren escritorio.
- El reconocimiento actual cuenta participación en tres días, no una racha consecutiva. Esa regla no se cambia en esta fase.

## Cómo revisar

Ejecutar `npm.cmd run dev` y abrir `/community` en la URL indicada por Vite. Cambiar de tema, recargar y abrir el perfil. Expandir «Opciones de demostración» para revisar el rol, reinicio y navegación entre áreas. Los enlaces de cabecera permiten comprobar las cuatro secciones.

No se realizan commit, push, merge ni despliegue. `reference/`, los cinco PNG, la landing y administración permanecen intactos. No se continúa a la fase 2 sin aprobación.
