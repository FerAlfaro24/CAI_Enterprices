# Herramientas y alertas: punto 4

**Revisión completada el 12 de noviembre de 2026; la corrección de diez alertas sigue pendiente de una versión compatible.** Rama `chore/v1-tooling-audit`, base `c712abb`. Esta entrega documenta evidencia actual y decisión técnica; no cambia dependencias, configuración de ESLint, código de aplicación o datos.

## Resultado comprobado

| Comprobación actual | Resultado |
| --- | --- |
| `npm audit --json` | 10 avisos moderados, ninguno alto/crítico. Son propagaciones del mismo advisory de minimatch en diez paquetes de desarrollo, no diez fallos independientes del producto. |
| `npm audit --omit=dev --json` | 0 avisos reportados en dependencias de ejecución. No es una garantía general de seguridad. |
| `npm ls minimatch eslint typescript-eslint --all` | ESLint 10.13.0 y typescript-eslint 8.71.2 comparten minimatch 10.2.6. |
| Entorno observado | Node 24.22.0 y npm 11.19.1; dentro de los requisitos existentes del proyecto. |
| Cambios de paquetes | Ninguno. `package.json` y `package-lock.json` permanecen idénticos a la base. |

Aviso [GHSA-g3hv-75wg-m249 / CVE-2026-118764](https://github.com/advisories/GHSA-g3hv-75wg-m249): afecta minimatch `>=7.0.0 <11.0.1`; el arreglo publicado empieza en 11.0.1. El registro consultado ofrece 11.0.8 como última versión. El advisory describe amplificación de patrones con `optimizationLevel >= 2`, que puede consumir CPU/memoria excesivas.

## Por qué no se cambia una versión a ciegas

Metadatos actuales consultados directamente en el registro de npm:

| Paquete | Última versión estable consultada | Dependencia o requisito relevante |
| --- | --- | --- |
| ESLint | 10.14.0 | `minimatch ^10.2.6`; también config-array `^0.23.5`. |
| @eslint/config-array | 0.23.5 | `minimatch ^10.2.4`. |
| typescript-eslint | 8.72.2 | Su conjunto de parser/plugin/estree queda alineado en 8.72.2. Admite ESLint 8/9/10 y TypeScript `>=4.8.4 <6.1.0`. |
| @typescript-eslint/typescript-estree | 8.72.2 | `minimatch ^10.2.2`. |
| minimatch | 11.0.8 | Está fuera de los rangos `^10` anteriores. |

Actualizar solo ESLint/typescript-eslint a esas versiones seguiría incluyendo la rama afectada. No resolvería el aviso. Forzar minimatch 11 mediante override ignoraría los rangos declarados por tres consumidores; no se hace ni se presenta como una actualización compatible.

Las propuestas de `npm audit` tampoco constituyen una corrección validada: sugieren ESLint/@eslint/js 9.39.5 y typescript-eslint 8.36.0. Se comprobó el paquete histórico: typescript-eslint 8.36.0 requiere ESLint 8/9 y TypeScript `<5.9.0`, frente a ESLint 10 y TypeScript 6.0.3 instalados. Además, estree 8.36.0 usa minimatch `^9.0.4`, una rama incluida en el rango afectado del advisory. No se ejecuta esa propuesta automática, `--force`, ni una migración descendente del conjunto de herramientas para ocultar alertas.

La compatibilidad actual se contrastó también con [las versiones soportadas de typescript-eslint](https://typescript-eslint.io/users/dependency-versions/) y [la guía de ESLint 10](https://eslint.org/docs/latest/use/migrate-to-10.0.0). No se afirma que todas las versiones futuras estén bloqueadas: esta es la evidencia de la revisión indicada.

## Alcance observado y límite de la revisión

El árbol instalado sitúa minimatch en ESLint/config-array y typescript-estree, herramientas de desarrollo. La búsqueda en `src` y `server` no encontró uso de minimatch ni `optimizationLevel`; `dev:local` inicia Vite/API, no ESLint. En las opciones inspeccionadas de ESLint/config-array no se habilita nivel 2; minimatch tiene nivel 1 como valor predeterminado. Los patrones vienen de archivos/configuración de desarrollo.

**Inferencia limitada:** la exposición observada corresponde a trabajo de desarrollo y no se identificó una ruta de la API que reciba patrones para minimatch. Esto no demuestra que la versión sea inexplotable en todos sus consumidores/opciones ni elimina la alerta. No se ejecutó una prueba de agotamiento de recursos, se modificó node_modules o se desactivó la auditoría.

## Decisión y criterio de cierre real

La investigación del punto 4 está completa; **el arreglo de las alertas no lo está**. Se registra como dependencia externa de mantenimiento, sin impedir el punto 5 de revisión final local.

Para resolverlo debe publicarse una actualización de los consumidores que acepte una rama corregida compatible, o acordarse una migración específica de herramientas. Entonces:

1. Revisar versiones/requisitos y actualizar solo el conjunto necesario en otra rama.
2. Comprobar instalación reproducible y árbol sin rangos inválidos.
3. Ejecutar lint, typecheck y build; volver a auditar todo y ejecución por separado.
4. Confirmar que desaparece el advisory sin supresiones ni excepciones. Repetir pruebas de aplicación si también cambian dependencias de ejecución o se detectan problemas de compilación.

Esta tarea no programa revisiones automáticas ni instala herramientas nuevas. Volver a consultar al actualizar dependencias y antes de publicar. No considerar diez alertas corregidas por haber documentado su origen.

## Verificaciones y archivos

Se ejecutaron `npm audit` completo y sin desarrollo, consultas `npm view` de versiones/dependencias/engines/peers, `npm ls`, inspección acotada de los consumidores instalados y comprobación de que no cambiaron manifiesto/lockfile. La auditoría completa devuelve código 1 por los avisos, resultado esperado y registrado; la de ejecución devuelve 0.

No se repitieron pruebas de API/navegador, lint o build: el cambio es documental. Los resultados anteriores del punto 3 permanecen históricos, no se presentan como nuevos. Archivos de esta entrega: este informe, PROJECT_STATE, AGENTS, README y notas de continuidad de estabilización/expediente. Sin cambio visual, migración, cuenta, contraseña o despliegue.

Siguiente: **punto 5, revisión final** de recorridos, permisos, errores, móvil y guías en el estado acumulado. Permanecen para el final correo/Google reales, cambio verificado de correo, responsables/contenidos/autorizaciones, presupuesto y alojamiento.
