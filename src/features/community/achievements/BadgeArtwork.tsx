import firstAnswer from '../../../assets/community/badges/first-answer.svg'
import threeConsecutive from '../../../assets/community/badges/three-consecutive.svg'

// Presentation only. Retos remains the owner of definitions, progress and awards.
const prototypes: Readonly<Record<string, string>> = { 'first-answer': firstAnswer, 'three-consecutive': threeConsecutive }

export function BadgeArtwork({ badgeId, symbol, className }: { badgeId: string; symbol: string; className: string }) {
  const artwork = prototypes[badgeId]
  return <span className={className} aria-hidden="true" data-illustrated={artwork ? badgeId : undefined}>{artwork ? <img src={artwork} width="96" height="96" alt="" draggable={false} /> : symbol}</span>
}
