import Link from 'next/link'

interface TopHeaderProps {
  title: string
  backHref?: string
  right?: React.ReactNode
}

export function TopHeader({ title, backHref, right }: TopHeaderProps) {
  return (
    <header className="bg-white border-b border-border px-4 h-14 flex items-center justify-between sticky top-0 z-10">
      <div className="w-10">
        {backHref && (
          <Link
            href={backHref}
            className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-surface transition-colors text-nardo"
            aria-label="Retour"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        )}
      </div>
      <h1 className="text-base font-bold text-nardo tracking-wide uppercase">{title}</h1>
      <div className="w-10 flex justify-end">{right ?? null}</div>
    </header>
  )
}
