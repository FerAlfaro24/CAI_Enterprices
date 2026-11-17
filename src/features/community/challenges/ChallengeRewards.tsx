import type { Attempt } from '../types'
import { CommunityIcon } from '../components/ui'
import { MotionFeedback } from '../components/CommunityMotion'
import { BadgeArtwork } from '../achievements/BadgeArtwork'
import type { ChallengeBadge } from './progress'
import s from './challenges.module.css'
import { useCommunity } from '../context'
import type { ChallengeProgress } from '../../../../server/contracts'

export function ConnectedChallengeRewards({progress}:{progress:ChallengeProgress}){
 const {connection,dispatch}=useCommunity()
 const badges=connection?.badges.catalog.filter(b=>b.mode==='automatic')??[]
 return <aside className={s.rewards} aria-label="Mi progreso de aprendizaje"><section className={s.rewardCard}><span className={s.eyebrow}><CommunityIcon name="spark" size={15}/> CADA INTENTO CUENTA</span><h2>Practicar también<br/>es avanzar.</h2><p>+5 puntos por responder y +10 más si aciertas. Hasta 45 al día, sin perder puntos por equivocarte.</p><MotionFeedback className={s.rewardStrip} key={progress.points}>{progress.points} puntos acumulados</MotionFeedback></section><section className={s.learnCard}><h2>Tu recorrido, en privado</h2><p><b>{progress.answered}</b> preguntas practicadas<br/><b>{progress.correct}</b> respuestas correctas<br/><b>{progress.participatedDays}</b> días en los que participaste</p><p>Lee la explicación y prueba a crear una frase propia. Aprender vale más que responder rápido.</p></section><section className={s.collection} aria-label="Mis insignias de Retos"><h2>Tu pequeña colección</h2><ul className={s.badges}>{badges.map(b=>{const grant=connection?.badges.grants.find(g=>g.badge.id===b.id);return <li className={[s.badge,grant?.status==='active'?s.earned:''].join(' ')} key={b.id}><BadgeArtwork badgeId={b.id} symbol={b.symbol} className={s.badgeArtwork}/><strong>{b.title}</strong><small>{grant?.status==='active'?'✓ Conseguida':grant?.status==='revoked'?'Retirada':`${b.progress}/${b.target} · En progreso`}</small></li>})}</ul><button type="button" className={s.textButton} onClick={()=>dispatch({type:'section',section:'achievements'})}>Ver mis insignias →</button></section></aside>
}

export function ChallengeRewards({ attempt, badges }: { attempt: Attempt | undefined; badges: ChallengeBadge[] }) {
  return <aside className={s.rewards} aria-label="Recompensas e insignias de retos">
    <section className={s.rewardCard} aria-labelledby="challenge-reward-title">
      <span className={s.eyebrow}><CommunityIcon name="award" size={15} /> TU RECOMPENSA</span>
      <BadgeArtwork badgeId="first-answer" symbol="" className={s.rewardArtwork} />
      <h2 id="challenge-reward-title">¡Cada intento<br /> cuenta!</h2>
      <p>Participar vale +5 puntos. Si aciertas, sumas 10 más.</p>
      <MotionFeedback key={attempt?.points ?? 'available'} className={s.rewardStrip}><CommunityIcon name="spark" size={17} /> {attempt ? `+${attempt.points} puntos obtenidos hoy` : '+5 por participar al comprobar'}</MotionFeedback>
    </section>
    <section className={s.collection} aria-labelledby="challenge-collection-title">
      <h2 id="challenge-collection-title">Tu pequeña colección <CommunityIcon name="award" size={18} /></h2>
      <ul className={s.badges}>{badges.map((badge) => <li className={[s.badge, badge.earned ? s.earned : '', s[badge.id]].join(' ')} key={badge.id} aria-label={`${badge.title}: ${badge.earned ? 'conseguida' : 'por ganar'}, ${badge.progress} de ${badge.target}. ${badge.description}`}>
        <BadgeArtwork badgeId={badge.id} symbol={badge.symbol} className={s.badgeArtwork} /><strong>{badge.title}</strong><small>{badge.earned ? '✓ Conseguida' : `${badge.progress}/${badge.target} · Por ganar`}</small>
      </li>)}</ul>
      <details className={s.badgeRules}><summary>Cómo ganar las insignias</summary><ul>{badges.map((badge) => <li key={badge.id}><strong>{badge.title}.</strong> {badge.description}</li>)}</ul><p>Automáticas y ficticias. Se reinician con la demostración.</p></details>
    </section>
    <section className={s.learnCard} aria-labelledby="challenge-together-title"><h2 id="challenge-together-title"><CommunityIcon name="comment" size={21} /> Aprender juntos</h2><p>La pregunta es la misma para todos, porque compartir también es aprender.</p></section>
  </aside>
}
