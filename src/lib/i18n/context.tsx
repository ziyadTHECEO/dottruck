'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { type Language, DEFAULT_LANGUAGE, LANGUAGE_COOKIE, LANGUAGE_DIR } from './constants'
import { getTranslation, type TranslationKey } from './translations'
import { createClient } from '@/lib/supabase/client'

interface LanguageContextValue {
  lang: Language
  dir: 'rtl' | 'ltr'
  t: (key: TranslationKey) => string
  setLang: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`
}

export function LanguageProvider({ children, initialLang }: { children: ReactNode; initialLang?: Language }) {
  const [lang, setLangState] = useState<Language>(initialLang ?? DEFAULT_LANGUAGE)

  const dir = LANGUAGE_DIR[lang]

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang)
    setCookie(LANGUAGE_COOKIE, newLang)

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('users')
          .update({ preferred_language: newLang })
          .eq('id', user.id)
      }
    })
  }, [])

  const t = useCallback((key: TranslationKey) => {
    return getTranslation(key, lang)
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, dir, t, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
