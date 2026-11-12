# Visión del producto — CAI
> Antecedente de producto. Leer `PROJECT_STATE.md` para inventario real, base oficial y secuencia vigente. El calendario posterior acordado es de tres semanas; las estimaciones iniciales de este documento son históricas.
**Estado:** Borrador v0.1 · pendiente de validación con el cliente

## Contexto
CAI es el Centro de Asesorías Integrales, una empresa que ofrece enseñanza de inglés. Existe una propuesta de diseño institucional previa, mantenida como referencia externa. Este repositorio inicia el nuevo proyecto desde cero.

## Problema
CAI necesita comunicar sus servicios a nuevos interesados y ofrecer a sus alumnos un espacio privado donde reconocer avances y fortalecer el sentido de pertenencia.

## Propuesta
Un producto web integrado con tres experiencias:
1. **Sitio público:** identidad, programas, metodología, testimonios autorizados, precios/información y contacto.
2. **Comunidad privada:** feed de logros, reseñas, fotografías y eventualmente videos, con publicación controlada.
3. **Administración:** gestión de solicitudes de registro, acceso de alumnos y revisión de publicaciones.

## Perfiles
- Visitante: consulta información pública.
- Alumno: consulta la comunidad y solicita publicar contenido.
- Administrador: autoriza accesos, gestiona miembros y modera publicaciones.
El administrador no será necesariamente el profesor.

## Restricciones
- Dos desarrolladores; duración prevista: 1–2 meses.
- Prototipo presentable al cliente en pocos días.
- Aproximadamente 30–100 alumnos.
- Hay menores de edad: privacidad, consentimiento y moderación son requisitos críticos.
- La versión final debe poder funcionar en internet con usuarios reales; el prototipo NO.

## Estrategia
**Fase A — prototipo de alta fidelidad:** navegación y acciones simuladas con datos ficticios. Se usa para recopilar retroalimentación y definir requisitos.
**Fase B — producto real:** autenticación segura, autorización en servidor, almacenamiento privado, políticas de privacidad, moderación persistente, pruebas y despliegue.

## No objetivos para la primera demostración
Autenticación real, pagos, mensajería privada, subida pública de videos, notificaciones y acceso de estudiantes reales.

## Indicadores de validación
- El cliente entiende claramente las tres experiencias.
- Puede recorrer un flujo de solicitud, aprobación y publicación simulada.
- Puede indicar qué elementos faltan, sobran o requieren cambios.

## Cuestiones pendientes
Contenido institucional confirmado; precios; permisos de interacción; política de uso de fotos/videos; consentimiento de tutores; quién administra; identidad visual definitiva y prioridades de la siguiente fase.
