import type { Attempt } from '../types'
import { CommunityIcon } from '../components/ui'
import type { ChallengeBadge } from './progress'
import s from './challenges.module.css'

export function ChallengeRewards({ attempt, badges }: { attempt: Attempt | undefined; badges: ChallengeBadge[] }) {
  return <aside className={s.rewards} aria-label="Recompensas e insignias de retos">
    <section className={s.rewardCard} aria-labelledby="challenge-reward-title">
      <span className={s.eyebrow}><CommunityIcon name="award" size={15} /> TU RECOMPENSA</span>
      <h2 id="challenge-reward-title">¡Cada intento<br /> cuenta!</h2>
      <p>Participar vale +5 puntos. Si aciertas, sumas 10 más.</p>
      <div className={s.rewardStrip}><span aria-hidden="true">✦</span> {attempt ? `+${attempt.points} puntos obtenidos hoy` : '+5 por participar al comprobar'}</div>
    </section>
    <section className={s.collection} aria-labelledby="challenge-collection-title">
      <h2 id="challenge-collection-title">Tu pequeña colección <span aria-hidden="true">✨</span></h2>
      <ul className={s.badges}>{badges.map((badge) => <li className={[s.badge, badge.earned ? s.earned : '', s[badge.id]].join(' ')} key={badge.id} aria-label={`${badge.title}: ${badge.earned ? 'conseguida' : 'por ganar'}, ${badge.progress} de ${badge.target}. ${badge.description}`}>
        <span aria-hidden="true">{badge.symbol}</span><strong>{badge.title}</strong><small>{badge.earned ? '✓ Conseguida' : `${badge.progress}/${badge.target} · Por ganar`}</small>
      </li>)}</ul>
      <details className={s.badgeRules}><summary>Cómo ganar las insignias</summary><ul>{badges.map((badge) => <li key={badge.id}><strong>{badge.title}.</strong> {badge.description}</li>)}</ul><p>Automáticas y ficticias. Se reinician con la demostración.</p></details>
    </section>
    <section className={s.learnCard} aria-labelledby="challenge-together-title"><h2 id="challenge-together-title"><CommunityIcon name="comment" size={21} /> Aprender juntos</h2><p>La pregunta es la misma para todos, porque compartir también es aprender.</p></section>
  </aside>
}
