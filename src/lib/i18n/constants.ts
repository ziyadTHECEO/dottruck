export const SUPPORTED_LANGUAGES = ['ar', 'fr'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]
export const DEFAULT_LANGUAGE: Language = 'ar'
export const LANGUAGE_COOKIE = 'lang'

export const LANGUAGE_LABELS: Record<Language, string> = {
  ar: 'العربية',
  fr: 'Français',
}

export const LANGUAGE_DIR: Record<Language, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  fr: 'ltr',
}
