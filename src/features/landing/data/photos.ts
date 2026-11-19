import materials from '../../../assets/official/materiales.webp'
import classroom from '../../../assets/official/aula.webp'
import online from '../../../assets/official/practica-online.webp'
import activity from '../../../assets/official/actividad-aula.webp'

/** Solo material autorizado para la página pública; las convivencias son privadas. */
export const photos = { hero: materials, meeting: classroom, online }
export const caiLife = [
  { title: 'Nuestro espacio de aprendizaje', text: 'Un vistazo al trabajo en el aula de CAI.', image: classroom, alt: 'Personas trabajando en sus materiales en el aula de CAI.', width: 1080, height: 720 },
  { title: 'Práctica en línea', text: 'Materiales y una videollamada durante una práctica de inglés.', image: online, alt: 'Persona frente a una computadora con una videollamada y materiales de estudio.', width: 972, height: 720 },
  { title: 'Actividades en el aula', text: 'El pizarrón, los materiales y la participación forman parte del día a día.', image: activity, alt: 'Persona junto al pizarrón y la pantalla del aula, con materiales sobre la mesa.', width: 1080, height: 950 },
]
