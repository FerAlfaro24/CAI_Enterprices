/** Editorial artwork is illustrative, not a record of real CAI events. */
export interface HeroSlide {
  id: string
  category: string
  title: string
  description: string
  cards: [string, string, string]
  image?: { src: string; alt: string }
}

export const heroSlides: HeroSlide[] = [
  { id: 'moments', category: 'EVENTOS · CAI COMMUNITY', title: 'Momentos para recordar 📸', description: 'Conversaciones, encuentros y pequeños pasos que nos acercan. Así imaginamos nuestra comunidad.', cards: ['HELLO!', 'TOGETHER', 'GOOD VIBES'] },
  { id: 'practice', category: 'APRENDER · A TU RITMO', title: 'Una palabra abre un mundo ✦', description: 'Una canción, un libro, un intento. Encuentra inspiración en las historias de la comunidad.', cards: ['GIVE IT', 'A TRY!', 'YOU CAN'] },
  { id: 'celebrate', category: 'LOGROS · GRANDES INTENTOS', title: 'Aquí celebramos el camino 👏', description: 'No hace falta hacerlo perfecto para compartirlo. Cada pequeño avance merece su momento.', cards: ['FIRST', 'SMALL STEPS', 'BIG SMILES'] },
]

export const homeInitialPostCount = 3
export const homePageSize = 4
