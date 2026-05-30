'use client'

import { useTranslation } from '@/lib/i18n/context'
import { LANGUAGE_LABELS } from '@/lib/i18n/constants'
import type { Language } from '@/lib/i18n/constants'

export function LanguageToggle() {
  const { lang, setLang } = useTranslation()

  return (
    <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
      {(['ar', 'fr'] as Language[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            lang === l
              ? 'bg-accent text-white shadow-sm'
              : 'text-muted hover:text-nardo'
          }`}
        >
          {LANGUAGE_LABELS[l]}
        </button>
      ))}
    </div>
  )
}
