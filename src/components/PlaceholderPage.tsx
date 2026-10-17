import { useEffect, type ReactNode } from 'react'

type PlaceholderPageProps = {
  area: string
  title: string
  description: string
  children: ReactNode
}

export function PlaceholderPage({
  area,
  title,
  description,
  children,
}: PlaceholderPageProps) {
  useEffect(() => {
    document.title = `${title} · CAI · Prototipo`
  }, [title])

  return (
    <section aria-labelledby="page-title" className="space-y-6">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm font-semibold text-slate-600">{area}</p>
        <h1
          id="page-title"
          className="text-3xl leading-tight font-semibold tracking-tight text-slate-950 sm:text-4xl"
        >
          {title}
        </h1>
        <p className="text-base leading-relaxed text-slate-700 sm:text-lg">
          {description}
        </p>
      </header>
      <div className="rounded-lg border border-slate-300 bg-white p-5 sm:p-8">
        {children}
      </div>
      <p className="text-sm text-slate-600">
        Estructura provisional. El diseño y los contenidos definitivos están
        pendientes de validación.
      </p>
    </section>
  )
}
