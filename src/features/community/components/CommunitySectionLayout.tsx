import type { ReactNode } from 'react'
import s from '../community.module.css'

// Each view owns its composition; the shell only supplies the page container.
export function CommunitySectionLayout({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className={aside ? s.sectionWithAside : s.sectionLayout}>
      <div className={s.mainColumn}>{children}</div>
      {aside}
    </div>
  )
}
