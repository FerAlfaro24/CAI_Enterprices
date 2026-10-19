# CAI Community — Fase 6.4 final

## 1. Resumen y veredicto

**Aprobada por el usuario y lista para demo controlada con datos ficticios.** La auditoría no confirmó defectos funcionales o visuales que requirieran modificar el producto. Se conserva íntegramente el diseño aprobado de Inicio, Galería, Retos, Mis Logros y La Comunidad.

Pasaron typecheck, lint, build, los cinco modelos y las nueve regresiones existentes. Se añadió una auditoría integral: **273 comprobaciones en Brave y 273 en Opera GX**, con 50 escenarios responsive, 20 recorridos completos por Tab y 572 muestras de contraste por navegador. El recorrido enlaza aprendizaje, concesiones, solicitudes privadas, publicación voluntaria, moderación, fotografías y reinicio.

Este veredicto corresponde al prototipo. La integración posterior con sesión y autorización reales queda pendiente de los contratos y decisiones enumerados abajo. No se implementa esa integración ni se presenta la demo como comunidad operativa.

## 2. Seguridad y base

Antes de escribir archivos se comprobaron rama, estado, historial y carpeta. Rama: `feat/community-visual-polish`. HEAD: `a526ffdec27acf3a3d9c95427411924ef1f8f36f`, respaldo aprobado de 6.3, posterior a Galería `3d1953c` e Inicio `652b146`. Repositorio: `C:\Users\feral\Proyectos\CAI_Enterprices\CAI_Enterprices`.

El estado inicial solo contenía materiales locales no rastreados ya conocidos: `.playwright-mcp/`, `design-reference/` y revisiones anteriores. No había modificaciones rastreadas inesperadas. Se leyeron AGENTS, visión, requisitos, plan del prototipo, contratos funcionales, componentes compartidos y documentación de las fases recientes antes de ampliar las pruebas.

La comparación SHA-256 inicial/final verifica **134 archivos existentes de `src/` y `scripts/` idénticos**, incluidos todos los componentes, estilos, SVG y tests anteriores. Se preservan dependencias y configuraciones. La auditoría se realizó sin staging, commit ni push. Tras la aprobación, el usuario autorizó exclusivamente el commit y respaldo de este informe y del nuevo script en `origin/feat/community-visual-polish`. No se borra material ni se realiza merge, despliegue o cambio de rama.

## 3. Hallazgos y severidad

| Clasificación | Hallazgo | Resolución |
| --- | --- | --- |
| Defecto crítico/alto | Ninguno confirmado en los recorridos comprobados | Sin cambios de arquitectura o reglas |
| Defecto funcional/visual menor | Ninguno confirmado tras revisar los avisos automáticos | Sin cambios de producto o estilos |
| Diagnóstico descartado | Los hijos de un `<details>` cerrado pueden conservar rectángulos de layout aunque no sean visibles ni tabulables | La prueba usa `checkVisibility`, abre «Más filtros» con Enter, recorre sus opciones y comprueba Escape/foco |
| Diagnóstico descartado | Un cálculo que omite el alfa del fondo marca falsamente los rótulos blancos de imágenes como ilegibles | Se compone el fondo y se comprueba la cartela translúcida incluso sobre blanco/negro; contraste final correcto |
| Composición intencional | El disco decorativo de la portada musical sobresale dentro de su marco recortado | El título completo y el acceso alternativo siguen disponibles; no es pérdida de información esencial |
| Usabilidad revisada | Alias en línea menores de 24 px de alto | Tienen acceso equivalente por avatar de 33/44 px, nombre accesible y teclado. No se afirma que todos los enlaces secundarios midan 44 px |
| Diferencia de subpíxeles | En Opera una caja con `min-height:44px` produjo un rectángulo de 43,993057 px, con `devicePixelRatio≈0,9` | Se conservan el rectángulo, la altura mínima CSS y la dimensión nativa de layout en el registro. La comprobación táctil exige 44 px de layout; no se cambia el CSS |
| Registro histórico | Diferencia anterior de 0,03125 px en CTA de Inicio | Se conserva el registro de 6.2 y su comparación con `652b146` recompilado. En esta ejecución la comparación diagnóstica de escritorio/tableta con el JSON histórico no encontró diferencias |
| Limitación de prueba | Ventanas Chromium en segundo plano pueden retrasar fotogramas | Se trabaja en primer plano y se espera al foco de navegación programado en rAF antes de probar el foco independiente del resultado |

No se modifican las expectativas de ninguna regresión existente. Durante la construcción de la prueba nueva se corrigieron un alias de fixture incorrecto y las condiciones de medición descritas arriba. El enlace de salto visible se recorre con Tab antes de interactuar con controles que quedan detrás de él; no se intenta hacer clic a través de esa superficie enfocada.

## 4. Correcciones y archivos

**No hay correcciones de código funcional ni de estilos:** no se encontraron errores demostrables que justificaran alterar el diseño congelado.

Se añaden únicamente:

- `scripts/check-community-final-audit.browser.mjs`: recorrido integral, controles nombrados, geometría, contraste, teclado, diálogos apilados, consentimiento, restauración del escenario y diagnóstico de recursos. Usa las herramientas de navegador existentes, sin instalar paquetes.
- `docs/community-phase-6-4.md`: este informe único.
- `review/community-phase-6-4/`: cuatro PNG, visor de evidencias y JSON de resultados, métricas y comparación de archivos. Son materiales locales de revisión, separados del producto.

Los registros iniciales de exploración son datos brutos; por ejemplo, el primer barrido de contraste todavía no componía alfa. Los resultados autoritativos son los JSON `auditoria-final-brave.json` y `auditoria-final-opera-gx.json`.

## 5. Resultados exactos

```text
npm.cmd run typecheck     correcto
npm.cmd run lint          correcto, --max-warnings 0
npm.cmd run build         correcto, sin advertencia de tamaño
git diff --check          correcto
```

| Modelo ejecutado con Node | Resultado |
| --- | --- |
| `check-community-model.mjs` | 29 comprobaciones + 4 igualdades |
| `check-community-publication.mjs` | 23 comprobaciones |
| `check-community-challenges.mjs` | 27 comprobaciones + 1 igualdad |
| `check-community-gallery.mjs` | 25 comprobaciones + 4 igualdades |
| `check-community-achievements.mjs` | 51 comprobaciones + 4 igualdades |

| Regresión existente en Brave | Resultado |
| --- | --- |
| `check-community-challenges.browser.mjs` | 30 correctas |
| `check-community-achievements.browser.mjs` | 55 correctas |
| `check-community-composer.browser.mjs` | 19 correctas |
| `check-community-home-premium.browser.mjs` | 141 correctas |
| `check-community-mobile-hero.browser.mjs` | 135 correctas, opciones predeterminadas |
| `check-community-gallery.browser.mjs` | 40 correctas |
| `check-community-gallery-premium.browser.mjs` | 144 correctas |
| `check-community-visual-polish.browser.mjs` | 33 correctas |
| `check-community-learning-premium.browser.mjs` | 173 correctas, con la comparación opcional de métricas de 6.3 |

| Auditoría integral nueva | Brave | Opera GX |
| --- | --- | --- |
| Comprobaciones | **273** | **273** |
| Escenarios de vista/ancho/tema | 50 | 50 |
| Recorridos completos por Tab | 20 | 20 |
| Pulsaciones Tab registradas en esos recorridos | 682 | 685 |
| Muestras de contraste de texto | 572 | 572 |
| Contraste mínimo de las muestras | 4,6299:1 | 4,6299:1 |
| Errores / advertencias inesperados | 0 / 0 | 0 / 0 |
| Métodos de red del recorrido demo | Solo GET | Solo GET |

Las regresiones anteriores cubren también autoavance de ocho segundos, pausa, hover/foco, cambios de movimiento reducido, filtros, reacciones, comentarios, carga/error/vacío, compositor, miniaturas y aprobación de medios. Las solicitudes de recursos que se abortan deliberadamente para probar fallbacks se distinguen de errores inesperados del producto.

La auditoría nueva recorre: Inicio → mismo reto diario → acierto +15 → error +5 → acierto +15 → 35 puntos y dos insignias automáticas → colección sincronizada → solicitud privada rechazada → reintento aprobado con historial → ausencia de publicación implícita → compartir explícitamente → moderación → reconocimiento público sin declaración privada → fotos pendientes/aprobadas → un álbum derivado nuevo → reinicio. Comprueba también el cierre automático de la celebración sin robar el foco y la ausencia de repetición al navegar.

Tras reiniciar se recuperan exactamente seis álbumes, el feed inicial, cero puntos y ninguna solicitud, concesión o publicación propia. Una recarga posterior, con un intento y un rol demo todavía activos, descarta ambos y conserva únicamente la preferencia de tema.

## 6. Accesibilidad

- Un H1 por vista, IDs sin duplicados y campos/botones con nombre en las 50 combinaciones.
- Enlace de salto al `main`; navegación por Enter con foco en el encabezado. Recorrido Tab completo de cada vista a 1440/320, en claro/oscuro. Se respeta el grupo nativo de radios y la pestaña activa de Logros.
- Foco visible en controles recorridos, navegación nativa de radios y filtros adicionales con Enter/Tab/Escape.
- Perfil, visor, historia y compositor con nombre accesible, bloqueo del fondo y contención Tab/Shift+Tab. Se prueban **tres diálogos apilados** a 320 en ambos temas: álbum → historia → perfil; cada Escape devuelve el foco al disparador correspondiente y el cierre final desbloquea el scroll.
- Diálogo de solicitud, validación, devolución de foco y estados pendientes/rechazados/aprobados cubiertos por las regresiones de Logros y aprendizaje premium.
- Resultados de Retos con explicación, puntos y mensajes textuales; no dependen solo del color. Las celebraciones no publican, no duplican concesiones y no toman el foco.
- Acciones principales con al menos 44×44 px de layout. No se atribuye ese tamaño a todos los alias en línea.
- Contraste muestreado en encabezados, ayudas, botones, estados, rótulos y cartelas. Se excluyen texto oculto, controles deshabilitados y fondos que el cálculo no puede resolver; los fondos semitransparentes se componen. No es una certificación completa de contraste de todos los píxeles de fotografías/SVG.
- Movimiento reducido y lectura sin autoavance cubiertos por las pruebas existentes; la arquitectura Motion y los SVG se conservan.

**No se utilizó un lector de pantalla real.** No se certifica conformidad WCAG completa ni uso en dispositivos táctiles físicos.

## 7. Responsive y estabilidad visual

Se comprobaron Inicio, Galería, Retos, Mis Logros y La Comunidad a **1440, 1024, 768, 375 y 320 px**, en claro y oscuro: **50 escenarios por navegador**. No hubo desbordamiento horizontal de página, IDs duplicados ni controles principales sin nombre o demasiado pequeños según la medición de layout.

Se conservan la franja horizontal intencional de reconocimientos V2 y los desplazamientos internos accesibles de filtros/visores. Las miniaturas y fotografías mantienen `object-fit`; las ilustraciones móviles conservan las proporciones aprobadas. Los modales largos tienen scroll interno y cierre accesible; no se confunde ese comportamiento con texto perdido.

La prueba de hero verifica textos/CTA completos, controles sin superposición y altura estable entre escenas. La regresión de 6.3 verifica selección de respuestas sin desplazar opciones/CTA. No se fuerza una reducción adicional de altura ni se cambia el orden visual aprobado.

Las cuatro capturas finales son de viewport real: Inicio 1440 claro, visor 320 oscuro con cierre visible, colección sincronizada 375 y reconocimiento público voluntario. No se ensancha el layout ni se amplía artificialmente la altura de la ventana para capturar componentes largos.

## 8. Compatibilidad y rendimiento

| Entorno real | Comprobación |
| --- | --- |
| Brave, Chromium 155.0.8059.85, Windows | Nueve regresiones existentes y auditoría integral completa |
| Opera GX, Chromium 153.0.8010.55 / OPR 137, Windows | Auditoría integral completa; se conserva la cuantización de subpíxeles en el registro |
| Firefox | No disponible en PATH ni en las ubicaciones estándar comprobadas; no probado |
| Safari | No disponible en el entorno Windows comprobado; no probado |

Ambos navegadores probados pertenecen a Chromium. No representan cobertura de motores Gecko o WebKit.

Build de la aplicación completa, no solo Comunidad:

| Artefacto | Bytes | Gzip, bytes |
| --- | --- | --- |
| `index-DwfjvnLH.js` | 497557 | 155052 |
| `motionFeatures-w6sHCmQE.js` | 46654 | 17828 |
| `index-Bx5dHigG.css` | 203114 | 37002 |

Se conserva la carga diferida de `domAnimation` mediante LazyMotion. Las rutas se importan actualmente en el bundle común; el principal está cerca del aviso de 500 kB de Vite. No hay una advertencia actual ni una regresión de tamaño en 6.4. No se cambia el límite ni se introducen divisiones especulativas de código. Conviene volver a medir cuando se integren las otras ramas.

Las fotos tienen dimensiones declaradas y carga diferida; el hero solicita su ilustración prioritaria. Se verificaron SVG cargados y fallbacks de medios en las regresiones. Figtree depende de Google Fonts y las fotos de Unsplash: conexión y sustitución por medios autorizados siguen siendo factores de la demo. No se añaden importaciones al producto ni dependencias.

La muestra inicial tranquila de desplazamientos de layout fue **0** en ambos navegadores finales; la secuencia final completa también registró 0. Las duraciones y recursos locales están en los JSON. Estos datos proceden de una máquina local con caché y no equivalen a Lighthouse, CrUX, red móvil ni una medición de producción. Una pasada con capturas/ventanas en segundo plano acumuló 1,6905 en toda la secuencia artificial; esa suma entre redimensionados, scroll y cambios de vista **no es CLS**. Se separaron los diagnósticos de la secuencia y de la carga tranquila, sin optimizar el producto a partir de esa suma.

## 9. Riesgos y puntos concretos de integración

No se inventan endpoints ni un contrato de API de producción. Los contratos siguientes son los que existen hoy en código y requieren coordinación posterior:

| Punto | Contrato actual | Trabajo posterior acordable |
| --- | --- | --- |
| Rutas | `src/app/router.tsx`: `/`, `/community`, `/admin`; las secciones de Comunidad son estado interno | Decidir protección de `/community` y si habrá URLs profundas. Hoy recargar vuelve a Inicio; no hay `/community/gallery` contratado |
| Proveedores | `CommunityLayout` monta estado, diálogos y shell; Motion y tokens están dentro del shell | Mantener esos proveedores o definir un adaptador al integrar. `CommunityWorkspace` no es una pantalla independiente sin contexto |
| Identidad | `DemoMode` alumno/moderador; Alex fijo en acciones, perfil y selectores | Sustituir la identidad de muestra por sesión confiable; nunca tratar el selector de rol como autorización |
| Estado | Reducer en memoria; desmontar la ruta o recargar descarta contenido. Solo `cai.community.demo.theme.v1` persiste | Definir carga, errores, caducidad y persistencia real con los responsables de autenticación/datos |
| Publicaciones | `Post`: `authorId`, categoría, medios, estado `pending/approved/rejected`, reacciones y comentarios | Autoridad de servidor para escritura, lectura y moderación; conservar separación entre borrador privado y contenido aprobado |
| Validación | Título 4–100, cuerpo 10–1200, comentario hasta 400; Galería exige medios de la biblioteca demo | Compartir las reglas acordadas con servidor y validar también allí; los tipos/guardias frontend no son seguridad |
| Retos | Intento por ID, +5/+10, racha y concesiones derivadas por `selectChallengeProgress` | Definir día real/zona horaria e idempotencia en el servicio futuro sin mantener dos contadores paralelos |
| Insignias | Definición, `BadgeRequest`, `BadgeGrant` y `PublicRecognition` separados. Declaración 20–600; motivo de revisión 8–280 | Mantener solicitud e historial privados. Aprobar concede; publicar exige acción del alumno y moderación separada |
| Galería | `deriveAlbums` proyecta publicaciones con fotos; `selectAlbums` excluye pendientes/rechazadas | Evitar una segunda fuente de aprobación o álbumes duplicados al conectar administración |
| Medios | `Photo` contiene `id/src/alt/caption`; `homeMedia`, `galleryCoverSlots` y créditos identifican SVG/stock | Acordar almacenamiento privado, permisos y consentimiento. Al sustituir fotos, actualizar también la procedencia: `deriveAlbums` aún identifica las fotos demo como Unsplash |
| Administración | `ModerationPanel` y `BadgeReviewPanel` despachan decisiones locales | Coordinar permisos, auditoría persistente y respuestas de servidor; estos paneles no son el administrador real de otra rama |
| Fechas y muestras | `DEMO_DATE`, secuencia local y zona `America/Mexico_City`; perfiles/biografías ficticios | Sustituir la fuente temporal y los fixtures cuando exista el contrato real, sin mezclar muestras con estudiantes |
| Estilos/dependencias | CSS Modules y tokens bajo el contenedor de tema; Tailwind/base y Figtree viven en la aplicación | Revisar resets, versiones/lockfile y carga de fuente al integrar. Evitar duplicar React/Motion o trasladar tokens de Comunidad a `:root` sin acuerdo |

Comprobación limitada de aislamiento: `/` y `/admin` montaron un `main`, sin contenedor de tema comunitario ni token `--canvas` en `body`; `/community` montó su contenedor. Se leyeron sus rutas, no se modificaron esos módulos ni se realizó una regresión completa de sus funciones. No se inspeccionaron ni integraron otras ramas.

## 10. Transparencia y límites pendientes

El aviso de entrada sigue indicando perfiles/interacciones ficticios y ausencia de autenticación/envíos reales. Las opciones de demostración y paneles explican el rol simulado; compositor e historial diferencian solicitud privada y publicación. El visor conserva autoría de Unsplash y la aclaración de que las imágenes no representan alumnos ni instalaciones de CAI. Las portadas originales están identificadas como ilustraciones.

Quedan pendientes: pruebas con lector de pantalla/dispositivos físicos, motores Firefox/Safari cuando estén disponibles, fotografías oficiales y autorizaciones, definición del backend y políticas de acceso/consentimiento. No son funciones añadidas en 6.4 ni se simula haberlas resuelto. La aprobación final del usuario ya fue recibida.

## 11. Checklist para la demostración al cliente

- [ ] Servir el build local: `npm.cmd run build` y `npm.cmd run preview -- --host 127.0.0.1 --port 4173`.
- [ ] Abrir `/community`, confirmar fuente/fotos y elegir claro/oscuro. Si falla Internet, reconocer el fallback; no llamar «oficial» al stock.
- [ ] Mostrar el aviso de prototipo y usar exclusivamente contenido ficticio. Mantener las ventanas de prueba en primer plano.
- [ ] Reiniciar demo antes del recorrido. Solo el tema se conserva; no salir a otra área a mitad de una historia que se quiera mantener.
- [ ] Inicio: carrusel, pausa, filtro, reacción y comentario.
- [ ] Galería: destacado, filtro vacío, miniaturas y Escape. Mostrar la procedencia de las fotografías.
- [ ] Retos: acierto/error, puntos, cambio de día ficticio y racha; no presentar los cinco días como días reales transcurridos.
- [ ] Logros: colección, solicitud privada, rechazo/reintento y aprobación. Mostrar que todavía no apareció un reconocimiento público.
- [ ] Compartir explícitamente el logro y aprobar la publicación demo; comprobar que no contiene la declaración privada.
- [ ] Reiniciar al finalizar y confirmar ausencia de datos residuales. No usar cuentas, nombres ni material reales de alumnos.

## 12. Evidencias y cierre

**[Abrir las cuatro evidencias](../review/community-phase-6-4/index.html)** · [Resumen exacto de pruebas](../review/community-phase-6-4/resultados.json) · [Brave](../review/community-phase-6-4/auditoria-final-brave.json) · [Opera GX](../review/community-phase-6-4/auditoria-final-opera-gx.json) · [Auditoría de archivos](../review/community-phase-6-4/source-comparison.json).

La discrepancia histórica y la comparación con la base recompilada permanecen en [fase 6.2](community-phase-6-2.md); la [comparación diagnóstica actual](../review/community-phase-6-4/comparacion-subpixel-inicio.json) no altera sus registros.

El cierre parte del HEAD aprobado `a526ffdec27acf3a3d9c95427411924ef1f8f36f`. El respaldo autorizado incluye únicamente `docs/community-phase-6-4.md` y `scripts/check-community-final-audit.browser.mjs`; las evidencias enlazadas en este informe permanecen locales y se excluyen del commit, al igual que capturas, resultados temporales y referencias.

Antes del respaldo se repitieron correctamente typecheck, lint, build, los cinco modelos, las nueve regresiones existentes con los mismos recuentos de la sección 5 y la auditoría integral de 273 comprobaciones en cada navegador, sin errores ni advertencias inesperados. Se verificaron nuevamente los 134 archivos originales mediante SHA-256 y el staging limitado a los dos archivos autorizados. No se alteraron pruebas ni el registro histórico de subpíxeles.

**CAI Community queda terminada y congelada funcional y visualmente para una demostración controlada.** No se modifica el producto ni se realiza merge, despliegue o cambio de rama. Cualquier cambio posterior deberá responder a un problema real de integración o a una solicitud explícita del cliente. El hash final y la coincidencia local/remota se comunican al completar el respaldo.
