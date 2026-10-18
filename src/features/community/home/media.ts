import together from '../../../assets/community/home/together.svg?no-inline'
import practice from '../../../assets/community/home/practice.svg?no-inline'
import celebrate from '../../../assets/community/home/celebrate.svg?no-inline'

/** Stable presentation slots. Replace src/alt/credit together when authorized media arrives.
 * Post, event and album photos already share photoLibrary's stable Photo ids in data/fixtures.ts.
 * No copy of those photos or moderation state belongs in this manifest.
 */
export const homeMedia = {
  moments: { id: 'home-hero-community', src: together, alt: 'Collage original: cartel Hello, together, una conversación y un sello de participación.', credit: 'Ilustración original · CAI Community', width: 600, height: 400 },
  practice: { id: 'home-hero-practice', src: practice, alt: 'Ilustración original de una libreta con la frase One word, a new world y unos audífonos.', credit: 'Ilustración original · CAI Community', width: 600, height: 400 },
  celebrate: { id: 'home-hero-progress', src: celebrate, alt: 'Póster original Small steps, big yes, con escalones y una medalla ilustrada.', credit: 'Ilustración original · CAI Community', width: 600, height: 400 },
} as const
