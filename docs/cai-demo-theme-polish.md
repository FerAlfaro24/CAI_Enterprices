# CAI — Tema global, navegación institucional y reto de Inicio

Fecha: 19 de octubre de 2026. Trabajo exclusivo en `.worktrees/cai-demo`, rama `integration/cai-demo`. Se conservaron los cambios de integración existentes en el índice. Sin commits, push, merge, despliegue ni dependencias nuevas.

## Tema y navegación

`ThemeProvider`, montado sobre ambos proveedores de contenido, mantiene una sola preferencia React para toda la SPA. `html[data-theme]` es el único atributo de tema. El selector aprobado de Comunidad conserva sus botones, iconos, estilos y animación; su hook ahora consume ese contexto. Landing y Login usan el mismo selector compartido.

La clave canónica es `cai.demo.theme.v1`. Cuando no existe, se recupera la selección histórica `cai.community.demo.theme.v1` y se migra a la clave canónica. Solo sin una selección válida se consulta el tema del sistema al iniciar. La preferencia manual prevalece al recargar. Si el almacenamiento no está disponible, el selector funciona en memoria.

Los tokens globales proporcionan canvas claro `#F4F7FF`, fondo secundario `#EAF0FA`, tarjetas blancas y texto `#0A1F4D`, además de sus equivalentes oscuros. Landing, Login, Registro y Administración adaptan sus colores. Comunidad conserva su paleta aprobada. Las imágenes y SVG no se invierten; las composiciones de marca, el hero fotográfico y el ejemplo ilustrado de plataforma conservan su paleta propia.

Landing empieza directamente en el header: se retiraron el aviso superior y la barra «Recorre las áreas del prototipo». Los avisos de material ficticio siguen en sus secciones; los avisos de Registro y Administración continúan visibles. El acceso institucional dice «Iniciar sesión / Registrarse» y navega a `/login`, también desde el menú móvil. Ambos accesos demo y «Solicita tu acceso» siguen funcionando.

## Investigación del reto de Inicio

**No se reprodujo un fallo de sincronización, puntuación o navegación en el código recibido.** Antes de modificarlo, el CTA de Inicio abrió correctamente Retos y la regresión existente de Retos pasó sus 30 comprobaciones contra la versión integrada anterior. No se atribuye el reporte a un supuesto error del reducer ni al modo oscuro forzado del navegador.

La causa observable de confusión es que `HomeChallengePreview` presenta las tres opciones con aspecto de respuestas, pero son elementos `li` de una lista: no son radios ni botones para contestar. El componente está diseñado como vista previa. El CTA ya despachaba `section: 'challenges'` correctamente. La descripción anterior no explicaba que se responde en otra sección ni identificaba el día simulado.

La corrección mínima cambia únicamente ese texto por «Día N · Responde esta pregunta en Retos». Conserva pregunta, opciones, CTA, estilos y disposición. Al completar un intento, siguen mostrándose la opción elegida, «Reto completado» y «Ver mi resultado». No se añadió un formulario ni un sistema de preguntas alternativo a Inicio.

Ambas vistas siguen leyendo `challengeId` y `attempts` del mismo `CommunityProvider`, montado a nivel aplicación. Retos utiliza `useChallengeAnswer`; la validación y concesión de puntos permanecen en el reducer existente. Cada intento concede +5 y un acierto añade +10. El reducer rechaza un segundo intento sobre el mismo identificador. Las rachas e insignias se derivan de esos intentos; no se modificaron sus reglas.

El progreso dura durante esta visita y se conserva al navegar internamente entre áreas. Una recarga completa reinicia el contenido simulado, conforme al contrato previo; únicamente el tema persiste en almacenamiento. «Reiniciar demo» limpia los intentos, día seleccionado e insignias sin modificar el tema.

Si el fallo original corresponde a otro escenario, queda pendiente disponer de sus pasos exactos: esta entrega no afirma haber reparado un defecto de negocio que no se pudo reproducir.

## Prueba de regresión específica

`scripts/check-home-challenge-regression.browser.mjs` añade 199 comprobaciones por navegador en ambos temas, a 1440, 375 y 320 px. Cubre:

1. Inicio pendiente → CTA → misma pregunta en Retos, con validación sin selección.
2. Respuesta correcta → +15 → Inicio completado y opción registrada.
3. Día 2 incorrecto → +5 adicionales → Inicio y Retos coherentes.
4. Volver desde Inicio y desde Retos → opciones deshabilitadas, sin nuevo envío ni puntos adicionales. El modelo existente verifica también el rechazo idempotente de intentos repetidos.
5. Cambiar día → misma pregunta y día en Inicio y Retos.
6. Primera respuesta y racha de tres días → insignias automáticas en Logros.
7. Landing → Login → Comunidad → mismo día, intento y puntuación.
8. Reinicio → día 1 pendiente, cero puntos, sin respuestas ni insignias.
9. Sin desbordamiento en Inicio y Retos en todos los tamaños y temas anteriores.

No se cambiaron los estilos de Inicio ni Retos, su formulario o la lógica del reto. La tarjeta de Inicio a 1440 px conserva las métricas registradas antes del cambio: x=934, y=815.328125, ancho=419 y alto=558.125 px, en ambos temas. Se revisaron capturas de escritorio y móvil. No se realizó una comparación automática de píxeles.

## Validación ejecutada

- `npm.cmd run typecheck`, `npm.cmd run lint` y `npm.cmd run build`: correctos.
- `git diff --check`: correcto; Git muestra avisos de normalización LF/CRLF, sin errores de espacios.
- Cinco scripts de modelo de Comunidad: 155 comprobaciones y 13 comparaciones de igualdad correctas.
- Brave aislado como navegador principal y Opera GX aislado para compatibilidad, contra el build local servido en `http://127.0.0.1:4191`.

| Prueba de navegador | Brave | Opera GX |
| --- | ---: | ---: |
| Nueva regresión de Inicio/Retos | 199 | 199 |
| Nueva prueba de tema y navegación | 196 | 196 |
| Integración existente, con selectores de acceso actualizados | 73 | 73 |
| Retos existente | 30 | — |
| Logros existente | 55 | — |
| Auditoría integral existente | 273 | — |

La prueba de tema cubre migración histórica, preferencia explícita frente al sistema, recarga, sincronización entre selectores, desplegable y acceso móvil, header sin barras, ausencia de filtros sobre imágenes y 72 combinaciones por navegador: nueve rutas × cuatro anchos (1440, 768, 375, 320) × dos temas. Sin errores de consola en los recorridos nuevos. La integración y auditoría existentes también verifican ausencia de advertencias de consola. Se comprobaron adicionalmente anchos de header 1101, 1200, 1240 y 1280 sin desbordamiento ni cruce entre navegación y acciones.

El build conserva el aviso preexistente de Vite por el chunk principal superior a 500 kB: aproximadamente 596.74 kB minificado / 180.51 kB gzip. No se modificó el umbral.

No se probaron dispositivos físicos, lectores de pantalla, Firefox ni Safari. Brave y Opera GX comparten Chromium. Las pruebas se ejecutan con la herramienta `browser_run_code_unsafe` existente, envolviendo la función del archivo y pasando `baseURL`; no se instaló Playwright en el proyecto.

## Archivos de esta tarea

| Responsabilidad | Archivos |
| --- | --- |
| Contexto y preferencia global | `src/app/theme.ts`, `src/app/ThemeProvider.tsx`, `src/app/App.tsx`, `src/styles/index.css` |
| Selector compartido | `src/components/ThemeSelector.tsx`, `src/components/themeSelector.module.css` |
| Conexión con Comunidad | `src/features/community/useCommunityTheme.ts`, `src/features/community/components/CommunityShell.tsx`, `src/features/community/communityTheme.module.css` |
| Aclaración del reto | `src/features/community/home/HomeCommunityPanels.tsx` |
| Landing | `src/layouts/LandingLayout.tsx`, `src/features/landing/components/LandingHeader.tsx`, `src/features/landing/landing.module.css` |
| Colores y selector de acceso | `src/pages/LoginPage.tsx`, `src/features/login/login.module.css`, `src/features/signup/signup.module.css`, `src/features/admin/admin.module.css` |
| Regresiones | `scripts/check-home-challenge-regression.browser.mjs`, `scripts/check-cai-demo-theme.browser.mjs`, `scripts/check-cai-demo-integration.browser.mjs` |
| Documentación | Este archivo, `docs/cai-demo-integration.md`, `docs/landing-implementation.md` |
| Evidencias nuevas | `review/cai-demo-theme-polish/` |

[Resultados detallados](../review/cai-demo-theme-polish/resultados.json) · [Capturas para revisión](../review/cai-demo-theme-polish/README.md).
