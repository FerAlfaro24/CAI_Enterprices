# Solicitud de acceso de alumnos (`/registro`)

**Estado:** prototipo · simulado · pendiente de validación con CAI

La comunidad es privada y participan menores, así que no hay registro abierto: el alumno **solicita** acceso y la coordinación lo aprueba desde `/admin/solicitudes` (RF-03, RF-04, RNF-02).

## Flujo
| Paso | Contenido | Reglas |
|---|---|---|
| 1. Alumno | Quién llena (alumno o tutor), nombre, apellidos, fecha de nacimiento, programa, grupo, matrícula opcional, correo y contraseña | Menores de 13 años: la llena su madre, padre o tutor. Mayores de 18 la llenan ellos mismos. Contraseña de 8+ caracteres con letra y número. |
| 2. Tutor | Nombre, parentesco, contacto y autorización | Solo para menores de 18; para adultos aparece como «No aplica» y se omite. |
| 3. Perfil | Nombre visible, color de avatar, visibilidad, mensaje opcional | Sin fotografía. Menores: sin nombre completo y perfil solo visible para su grupo. |
| 4. Enviar | Resumen editable, normas de la comunidad, aviso de privacidad | Ambas casillas son obligatorias. |

Al enviar se crea una solicitud `CAI-0143`, `CAI-0144`… con origen «Formulario web». Los menores llegan con autorización **pendiente**: el panel no permite aprobarlos hasta pulsar «Registrar autorización recibida (simulado)» en el detalle de la solicitud.

## Arquitectura
- `src/app/DemoStoreProvider.tsx` y `src/app/demoStore.ts`: el estado del panel (`adminReducer`) ahora vive a nivel de aplicación para que `/registro` y `/admin` compartan solicitudes. Sigue en memoria y se pierde al recargar.
- `src/features/admin/state.ts`: acciones nuevas `submit` y `consent`, y `nextRequestId()`. El directorio usa el grupo y la visibilidad elegidos en el registro.
- `src/features/admin/data/mockData.ts`: tipo `Applicant` opcional dentro de `AccessRequest`.
- `src/features/signup/`: formulario por pasos (`SignupForm.tsx`), opciones y validaciones (`options.ts`) y estilos.
- `src/pages/SignupPage.tsx`: página de dos columnas; en móvil el panel lateral se reduce a un encabezado.
- Accesos: enlaces «Solicita tu acceso» en la landing (contacto, plataforma y menú móvil) y botón en `/community`.

## Accesibilidad
Etiquetas visibles, errores asociados con `aria-describedby` y `aria-invalid`, foco en el primer campo con error, foco en el título al cambiar de paso, pasos anunciados con `aria-current="step"`, opciones como `radio` nativos.

## Limitaciones (no es seguridad real)
- La contraseña no se guarda ni se transmite; no existen sesiones ni cuentas.
- Edad, matrícula y autorización del tutor no se verifican. En producción deben validarse en servidor y la autorización debe recabarse de forma verificable.
- No se envían correos. Textos de normas y aviso de privacidad son de muestra.

## Pendiente de validar con CAI
Edad mínima para llenar la solicitud sin tutor (se propone 13), si se usa matrícula, quién confirma la autorización del tutor, textos legales y si existirá un código de invitación como alternativa.
