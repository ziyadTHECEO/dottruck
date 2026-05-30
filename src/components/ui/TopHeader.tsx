'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'

interface TopHeaderProps {
  title: string
  backHref?: string
  right?: React.ReactNode
}

export function TopHeader({ title, backHref, right }: TopHeaderProps) {
  const { t, dir } = useTranslation()

  return (
    <header className="bg-white border-b border-border px-4 h-14 flex items-center justify-between sticky top-0 z-10">
      <div className="w-10">
        {backHref && (
          <Link
            href={backHref}
            className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-surface transition-colors text-nardo"
            aria-label={t('common_back')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={dir === 'rtl' ? "M9 18l6-6-6 6" : "M15 18l-6-6 6-6"} />
            </svg>
          </Link>
        )}
      </div>
      <h1 className="text-base font-semibold text-nardo">{title}</h1>
      <div className="w-10 flex justify-end">{right ?? null}</div>
    </header>
  )
}
