import firstAnswer from '../../../assets/community/badges/first-answer.svg'
import threeConsecutive from '../../../assets/community/badges/three-consecutive.svg'
import fiveDays from '../../../assets/community/badges/five-days.svg?no-inline'
import movie from '../../../assets/community/badges/movie-explorer.svg?no-inline'
import music from '../../../assets/community/badges/music-catcher.svg?no-inline'
import book from '../../../assets/community/badges/book-buddy.svg?no-inline'
import speaking from '../../../assets/community/badges/speaking-confidence.svg?no-inline'
import companion from '../../../assets/community/badges/good-companion.svg?no-inline'
import consistency from '../../../assets/community/badges/cai-consistency.svg?no-inline'

// Presentation only. Retos remains the owner of definitions, progress and awards.
const prototypes: Readonly<Record<string, string>> = { 'first-answer': firstAnswer, 'three-consecutive': threeConsecutive, 'five-days': fiveDays, 'movie-explorer': movie, 'music-catcher': music, 'book-buddy': book, 'speaking-confidence': speaking, 'good-companion': companion, 'cai-consistency': consistency }

export function BadgeArtwork({ badgeId, symbol, className }: { badgeId: string; symbol: string; className?: string }) {
  const artwork = prototypes[badgeId]
  return <span className={className} aria-hidden="true" data-illustrated={artwork ? badgeId : undefined}>{artwork ? <img src={artwork} width="96" height="96" alt="" draggable={false} /> : symbol}</span>
}
