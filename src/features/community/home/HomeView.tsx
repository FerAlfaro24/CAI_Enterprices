import { useEffect, useState } from 'react'
import { useCommunity } from '../context'
import { useCommunityDialogs } from '../dialogContext'
import { selectFeed } from '../model'
import type { FeedFilter } from '../types'
import { Composer } from '../components/Composer'
import { ModerationPanel, MySubmissions } from '../components/ModerationPanel'
import { CommunityIcon } from '../components/ui'
import { EditorialPostCard } from './EditorialPostCard'
import { HomeHero } from './HomeHero'
import { HomeFeedFilters } from './HomeFeedFilters'
import { HomeChallengePreview, HomeRecognition, HomeWelcome } from './HomeCommunityPanels'
import { PinnedNotices } from './PinnedNotices'
import { homeInitialPostCount, homePageSize } from './data'
import s from './home.module.css'

export function HomeView() {
  const { state, dispatch } = useCommunity()
  const { setDetail } = useCommunityDialogs()
  const [composerOpen, setComposerOpen] = useState(false)
  const [photosOnly, setPhotosOnly] = useState(false)
  const [visibleCount, setVisibleCount] = useState(homeInitialPostCount)
  const posts = selectFeed(state).filter((post) => post.pinOrder === null && (!photosOnly || post.photos.length > 0))
  const showing = posts.slice(0, visibleCount)
  useEffect(() => {
    const postId = state.focusedPostId
    if (!postId) return
    const frame = requestAnimationFrame(() => setDetail({ postId, comments: false }))
    return () => cancelAnimationFrame(frame)
  }, [state.focusRequest, state.focusedPostId, setDetail])

  const filter = (next: FeedFilter, photos = false) => {
    dispatch({ type: 'filter', filter: next })
    setPhotosOnly(photos)
    setVisibleCount(homeInitialPostCount)
  }

  const loadMore = () => {
    const next = posts[visibleCount]
    setVisibleCount((current) => current + homePageSize)
    requestAnimationFrame(() => {
      if (next) document.getElementById(`editorial-${next.id}`)?.querySelector<HTMLButtonElement>('h3 button')?.focus()
    })
  }

  return <div className={s.home}>
    <HomeHero />
    <div className={s.homeGrid}>
      <div className={s.notices}><PinnedNotices /></div>
      <div className={s.challengeArea}><HomeChallengePreview /></div>
      <section className={s.feedArea} aria-labelledby="home-feed-title" id="home-feed" tabIndex={-1}>
        <header className={s.feedHeading}><div><h2 id="home-feed-title" tabIndex={-1}>Lo que se vive en la comunidad</h2><p>Historias, avances y momentos que merecen compartirse.</p></div><HomeFeedFilters photosOnly={photosOnly} onChange={filter} /></header>
        <div className={s.homeModeration}><ModerationPanel /><MySubmissions /></div>
        <div className={s.feedMeta}><span>{posts.length} historias · {state.filter === 'celebrated' ? 'Por celebraciones' : 'De más reciente a más antigua'}</span><button type="button" onClick={() => setComposerOpen(true)}><CommunityIcon name="plus" size={15} /> Compartir algo</button></div>
        <div className={s.editorialGrid} aria-label="Feed de publicaciones ficticias">{showing.map((post, index) => <EditorialPostCard key={post.id} post={post} featured={index === 0} />)}</div>
        {!posts.length && <p className={s.empty}>Todavía no hay historias de este tipo en la demo. Puedes compartir la primera.</p>}
        <div className={s.feedBottom}>{visibleCount < posts.length ? <button type="button" className={s.loadMore} onClick={loadMore}>Ver más historias <span>{showing.length} de {posts.length}</span><CommunityIcon name="arrow" size={16} /></button> : <p>Ya conoces todas estas historias de muestra. Gracias por celebrar el camino.</p>}</div>
      </section>
      <div className={s.welcomeArea}><HomeWelcome /></div>
      <div className={s.recognitionArea}><HomeRecognition /></div>
    </div>
    {composerOpen && <Composer onClose={() => setComposerOpen(false)} />}
  </div>
}
