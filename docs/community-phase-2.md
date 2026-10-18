# CAI Community — Fase 2: Inicio

Implementación limitada a Inicio, en `feat/community`, a partir del PNG aprobado `design-reference/HOME — DESKTOP.png` (1440 × 1730). Se abrió visualmente antes de implementar y se comparó con capturas de la aplicación real. No se utilizó como fondo ni se accedió a capas de Figma: esta fase toma el PNG local como fuente visual. No se modifica `reference/` ni ninguno de los cinco diseños.

La cabecera de fase 1 mantiene su marca, sus cuatro secciones, su selector de tema y su avatar. Los únicos ajustes compartidos son el aviso/controles demo más compactos, acceso individual a perfiles, acción personal de Alex y los diálogos necesarios para abrir historias desde Inicio. Retos, Galería y Logros conservan sus pantallas anteriores; no se desarrolla su rediseño.

## Arquitectura y datos

- `CommunityWorkspace` delega Inicio a `HomeView`. Las demás secciones siguen usando sus componentes originales.
- `home/home.module.css` encapsula la composición editorial. Reutiliza las variables de fase 1 para superficies, texto, contraste y tema; los bloques de marca conservan azul marino, azul principal y amarillo en ambos modos.
- `HomeHero` divide texto e ilustración en proporción 52.5/47.5, con altura de 384 px en escritorio. Tres diapositivas están declaradas en `home/data.ts`. El campo opcional `image: { src, alt }` permite sustituir las ilustraciones por fotografías autorizadas sin reconstruir Inicio.
- El carrusel avanza cada ocho segundos. Pausa al pasar el cursor, recibir foco, interactuar manualmente u ocultarse la pestaña. Tras un cambio manual requiere reactivación explícita. Movimiento reducido desactiva la rotación; los botones siguen funcionando. Se limpian intervalo y listeners al desmontar.
- `PinnedNotices` presenta un aviso a la vez, con contador, siguiente y apertura del contenido completo. Los fijados no se duplican en el feed. Fijar/desfijar sigue usando el reducer original.
- `EditorialPostCard` utiliza las publicaciones existentes: una destacada, portadas editoriales, fotografías, galerías y texto sin portada. No se crean métricas, autores o testimonios nuevos para imitar la captura.
- Se muestran inicialmente tres historias y se revelan cuatro por acción. Permanecen accesibles las quince publicaciones aprobadas originales: dos avisos más trece historias. Hay dos pendientes adicionales en moderación. Fechas completas del escenario permiten comprender el orden; Más celebradas ordena por reacciones.
- Recientes, Logros y Fotos están visibles; Experiencias y Más celebradas se agrupan en Más. Este último menú funciona con teclado y Escape y devuelve el foco a su disparador.
- `CommunityDialogContext` mantiene únicamente selección de perfil y detalle. No contiene otra copia de publicaciones, reacciones, comentarios ni puntuación. El modelo y sus contratos no cambian.
- `PostDetailDialog` reutiliza `PostCard`, `Comments` y `PostMedia`. Los contadores de las tarjetas se actualizan desde el mismo estado. `StockImage` se reutiliza también en las portadas, incluido su reemplazo textual si la imagen falla.
- `MemberLink` abre nombres y avatares individualmente. `MemberProfileDialog` muestra el perfil elegido. Alex tiene «Ver mi participación», con actividad real de esta sesión ficticia; no se anuncia un destino «Mis logros» que aún no existe. Se conservan los doce perfiles y el componente antiguo de directorio, sin añadir un acceso público a él.
- `useCommunityDialog` comparte apertura, bloqueo de scroll, retorno de foco y ciclo Tab/Shift+Tab. Permite abrir un perfil encima de una historia sin liberar el scroll prematuramente. Escape cierra el diálogo superior.
- `HomeChallengePreview` lee el reto y el intento existentes. Sus opciones son una vista previa explícita; el botón abre Retos para contestar. Al completar aparece «Ver mi resultado» y los puntos ya obtenidos. No contiene un segundo formulario ni duplica intentos o puntuación.
- Bienvenida presenta tres perfiles ficticios individuales. El reconocimiento semanal enlaza a la historia aprobada de un logro; conserva las insignias de muestra existentes y no añade un sistema nuevo ni rankings.
- Creación, validación, estado pendiente, aprobación, rechazo y reinicio reutilizan `Composer`, `MySubmissions`, `ModerationPanel` y el reducer original.

En móvil el orden visual es hero, aviso, cabecera/filtros del feed, historia destacada, reto, historias secundarias, bienvenida, reconocimiento y más historias. En tablet se aprovechan dos columnas para tarjetas pequeñas. La primera historia y el reto no dependen de recorrer las trece publicaciones. «Explorar el feed» enfoca y desplaza el título, incluso cuando los contenedores usan `display: contents` para reordenarse. El orden del DOM conserva regiones semánticas; la redistribución visual debe validarse con lectores de pantalla reales antes de producción.

## Archivos de esta fase

Rutas relativas a `src/features/community/`, salvo indicación contraria. Se distingue el cambio de esta fase del trabajo de fase 1 que ya estaba sin commit.

| Creado | Responsabilidad |
| --- | --- |
| `home/HomeView.tsx` | Composición exclusiva de Inicio, filtros, revelado progresivo y creación. |
| `home/HomeHero.tsx` | Hero y carrusel accesible con pausas y movimiento reducido. |
| `home/EditorialPostCard.tsx` | Formatos de resumen y selector de cinco reacciones. |
| `home/HomeFeedFilters.tsx` | Filtros y menú adicional con manejo de foco. |
| `home/HomeCommunityPanels.tsx` | Avance del reto, bienvenida y reconocimiento. |
| `home/PinnedNotices.tsx` | Avisos compactos, rotación manual y acceso al detalle. |
| `home/data.ts` | Diapositivas tipadas y tamaños del revelado de historias. |
| `home/home.module.css` | Estilos y composición responsive de Inicio. |
| `dialogContext.ts` | Estado de selección de diálogos. |
| `useCommunityDialog.ts` | Ciclo de foco y scroll de los diálogos. |
| `components/MemberLink.tsx` | Acceso reutilizable a perfiles ficticios. |
| `components/PostDetailDialog.tsx` | Historia completa reutilizando PostCard. |
| `docs/community-phase-2.md` | Este documento. |
| `review/community-phase-2/` | Capturas, comparativa, inventario e índice HTML independiente. |

| Modificado | Cambio |
| --- | --- |
| `CommunityProvider.tsx` | Añade el contexto de diálogos junto al estado original. |
| `CommunityWorkspace.tsx` | Separa Inicio; mantiene las otras pantallas. |
| `community.module.css` | Compacta controles demo; estilos de detalle y acceso a perfiles. |
| `components/CommunityShell.tsx` | Mantiene cabecera; pliega demo y monta diálogos dentro del tema. |
| `components/MemberProfileDialog.tsx` | Perfil elegido, acción personal y foco compartido. |
| `components/PostCard.tsx` | Apertura opcional de comentarios y autores enlazados a perfil. |
| `components/Comments.tsx` | Autores/avatares enlazados a perfil. |
| `components/PostMedia.tsx` | Exporta StockImage para reutilizar su fallback. |
| `components/RecognitionPanels.tsx` | Accesos individuales a perfiles; conserva los demás módulos. |
| `components/ModerationPanel.tsx` | Aclara dónde fijar/desfijar avisos en el flujo actual. |
| `docs/community-implementation.md` | Enlace y estado de la fase actual; conserva la documentación histórica. |

No se modifican modelo, tipos, fixtures, retos, tema, navegación de fase 1, rutas, layouts, dependencias, landing ni administrador. La comparación SHA-256 con 77 archivos al comenzar confirma que los cambios de fuente se limitan a `src/features/community/`; `reference/`, `design-reference/`, manifiestos y el resto de `src` conservan sus hashes.

## Comparación y refinamiento visual

Se conservaron las capturas `00-primera-comparacion-*` para contrastar la primera implementación con las finales. Se inspeccionaron escritorio claro/oscuro, 375 y 320 px. Cinco diferencias principales y correcciones:

1. **Hero: texto demasiado bajo.** Se sustituyó centrado vertical por alineación superior con 44 px de margen interior; el título recupera el arranque y las dos líneas del PNG.
2. **Ilustración: tarjetas inclinadas y fondo degradado.** Se cambió a paneles planos azules y tres bloques redondeados superpuestos en posiciones próximas al PNG. Se mantienen palabras y símbolos ilustrativos para no entregar rectángulos vacíos. Flechas blancas y cartela inferior acompañan los bloques.
3. **Feed: comienzo demasiado bajo y titular pequeño.** Se redujeron márgenes y la fila auxiliar y se aumentó el encabezado; la acción de compartir permanece compacta y funcional.
4. **Portadas: sangrado completo.** Se añadieron margen interior de 18 px y esquinas redondeadas. Una segunda revisión corrigió palabras partidas en tablet mediante una composición de portada con título independiente de los adornos.
5. **Móvil: módulos antes de cualquier historia.** Se adelantaron cabecera del feed e historia destacada, se intercaló el reto y se conservaron bienvenida y reconocimiento después de las tarjetas iniciales. También se corrigió el reparto de columnas a 768 px tras revisar su captura.

Se volvieron a capturar y revisar ambos temas y ambos móviles. El resultado comparte la estructura, las proporciones principales, las superficies y la jerarquía del diseño, pero no es una reproducción píxel a píxel. La referencia de escritorio incluye Alumnos; se conserva la cabecera de cuatro secciones ya aprobada. Cambian nombres/textos/fechas/cifras porque se conservan los fixtures; la destacada inicial es Luna y las secundarias Dani/Nico. La fotografía ilustrativa existente y la portada editorial sustituyen las portadas ficticias del PNG. El reto muestra la pregunta real del estado y un botón de acceso, sin marcar anticipadamente una opción correcta. El botón de más historias, las acciones sociales, controles accesibles y aviso demo añaden contenido funcional. Footer y longitudes de tarjetas conservan pequeñas diferencias. El modo oscuro y las adaptaciones móviles no tienen un PNG aprobado propio.

## Validación realizada

Navegador principal: Brave con perfil de automatización. Compatibilidad básica: Opera GX, también aislado. Las capturas provienen de la aplicación real.

| Comprobación | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Correcto. |
| `npm.cmd run lint` | Correcto, sin advertencias. |
| `npm.cmd run build` | Correcto. |
| `node scripts/check-community-model.mjs` | 29 comprobaciones y cuatro comparaciones de igualdad correctas. |
| Cuatro secciones | Inicio, Logros, Galería y Retos accesibles; también en 375/320. |
| Feed y filtros | Trece no fijadas accesibles, dos fijadas separadas; Recientes, Logros, Fotos, Experiencias y Más celebradas comprobados. Revelado mueve el foco a la primera historia nueva. |
| Reacciones | Añadir, cambiar y retirar mantiene total 86 → 87 → 87 → 86 en Luna; cinco opciones disponibles, también en detalle. |
| Comentarios | Comentario ficticio añadido desde detalle, lista y recuento actualizados en tarjeta. Probado también en móvil. |
| Galería | Siguiente/anterior y flechas de teclado cambian imagen sin perder historia. |
| Crear y moderar | Validación de formulario vacío, pendiente fuera del feed, aprobación visible como primera historia, rechazo y desfijación devuelven el contenido al lugar correcto. Reinicio correcto. |
| Reto compartido | Acierto de 15, error de 5, tercer día de 15: 35 puntos e insignia existentes. Volver desde Inicio no permite puntuar el mismo día otra vez. |
| Carrusel | Tres posiciones, vuelta circular, flechas, indicadores, autoavance tras ocho segundos, pausa manual, por cursor y por foco; sin autoavance con movimiento reducido. |
| Tema | Claro/oscuro en escritorio y móvil; persistencia tras recarga. Solo tema en localStorage, datos comunitarios en memoria. |
| Foco | Tab/Shift+Tab en formulario, perfil y detalle; Escape, regreso al disparador y perfil sobre historia con scroll bloqueado hasta cerrar ambos. |
| Responsive | Sin overflow horizontal a 1440, 1024, 768, 375 y 320; temas claro/oscuro, filtros largos y diálogos móviles comprobados. |
| Áreas externas | Carga de `/`, `/admin` y 404; no reciben el contenedor de tema comunitario. Hashes de sus fuentes intactos. |
| Opera GX | Cuatro enlaces, navegación a Retos/regreso, tema, perfil/Escape y 375 sin overflow ni errores de ejecución. |
| Consola | Sin errores ni advertencias relevantes en los recorridos finales. |

Las capturas completas de Brave pueden excluir los 15 px de la barra de desplazamiento de Windows (por ejemplo, 1425 de un viewport de 1440). Los primeros pantallazos conservan las dimensiones completas del viewport. El inventario registra las dimensiones de los PNG y el viewport utilizado para evitar confusiones.

## Revisión y límites

Abrir `review/community-phase-2/index.html` directamente desde el Explorador. Incluye comparación lado a lado con el PNG local aprobado, capturas iniciales y finales, escritorio/móvil, comentarios, carrusel y estados de creación/moderación. Las imágenes se pueden abrir a tamaño completo.

Para ejecutar:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Visitar `http://127.0.0.1:5173/community`. Probar compartir, comentarios y reacciones; desplegar Opciones de demostración para moderar o reiniciar. Los cambios ficticios desaparecen al recargar. «Mi participación» refleja solamente la visita actual.

No hay autenticación, autorización de servidor, carga de fotos personales, persistencia editorial ni notificaciones reales. Las fotografías de stock conservan las fuentes y leyendas existentes; no representan alumnos ni instalaciones de CAI y requieren conectividad. Figtree usa los recursos/configuración previos. No se han probado dispositivos físicos, Safari, Firefox ni una auditoría completa con lectores de pantalla. Las fechas siguen siendo el escenario ficticio de octubre de 2026.

Esta fase termina con la revisión visual de Inicio. No se continúa con el rediseño de Retos, Galería, Logros, álbumes ni un sistema completo de insignias sin aprobación. No se realiza commit, push, merge ni despliegue.
