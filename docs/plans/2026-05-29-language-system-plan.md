# Dottruck Language System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add bilingual Darija Arabic/French language system with TTS audio, voice messages in chat, and sound feedback to the Dottruck freight app.

**Architecture:** Custom lightweight i18n using React Context + cookie + Supabase sync. Hybrid TTS with Web Speech API primary and pre-recorded audio fallback. Voice messages via MediaRecorder API stored in Supabase Storage.

**Tech Stack:** React 19 Context API, Web Speech API, MediaRecorder API, Supabase Storage, Next.js 16 cookies

---

### Task 1: Create i18n constants and types

**Files:**
- Create: `src/lib/i18n/constants.ts`

**Step 1: Create the constants file**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/lib/i18n/constants.ts
git commit -m "feat(i18n): add language constants and types"
```

---

### Task 2: Create the translations file

**Files:**
- Create: `src/lib/i18n/translations.ts`

**Step 1: Create translations with all keys**

This file must contain every hardcoded French string from every page. Below is the complete mapping extracted from the codebase. The `ar` values are authentic Moroccan Darija.

```typescript
import type { Language } from './constants'

const translations = {
  // ===== NAVIGATION (BottomNav) =====
  nav_home: { ar: 'الرئيسية', fr: 'Accueil' },
  nav_messages: { ar: 'الرسائل', fr: 'Messages' },
  nav_history: { ar: 'السجل', fr: 'Historique' },
  nav_alerts: { ar: 'التنبيهات', fr: 'Alertes' },
  nav_profile: { ar: 'الحساب', fr: 'Profil' },

  // ===== LANDING PAGE =====
  landing_tagline1: { ar: 'التيليفون\nسالا.', fr: 'Les appels,\nc\'est fini.' },
  landing_tagline2: { ar: 'لقا الشحنة ديالك ب 2 كليكات', fr: 'Trouve ton chargement en 2 clics' },
  landing_subtitle: { ar: 'نقل البضائع فالمغرب', fr: 'Transport de fret au Maroc' },
  landing_benefit1_title: { ar: 'بلا تيليفون', fr: "Pas d'appels" },
  landing_benefit1_desc: { ar: 'كلشي عبر المنصة', fr: 'Tout se fait via la plateforme' },
  landing_benefit2_title: { ar: 'ثمن واضح', fr: 'Prix transparents' },
  landing_benefit2_desc: { ar: 'شوف الثمن قبل ما تقدم', fr: 'Voir le prix avant de postuler' },
  landing_benefit3_title: { ar: 'تواصل مباشر', fr: 'Connexion directe' },
  landing_benefit3_desc: { ar: 'شات فالوقت الحقيقي', fr: 'Chat en temps réel' },
  landing_transporteur: { ar: 'أنا ناقل', fr: 'Je suis Transporteur' },
  landing_expediteur: { ar: 'أنا مرسل', fr: 'Je suis Expediteur' },
  landing_has_account: { ar: 'عندك حساب؟', fr: 'Deja un compte ?' },
  landing_login: { ar: 'دخل', fr: 'Se connecter' },

  // ===== AUTH =====
  auth_welcome: { ar: 'مرحبا', fr: 'Bienvenue' },
  auth_login_subtitle: { ar: 'دخل لحسابك فـ Dottruck', fr: 'Connectez-vous a votre compte Dottruck' },
  auth_email: { ar: 'الإيميل', fr: 'Email' },
  auth_password: { ar: 'كلمة السر', fr: 'Mot de passe' },
  auth_login_btn: { ar: 'دخل', fr: 'Se connecter' },
  auth_no_account: { ar: 'ما عندكش حساب؟', fr: 'Pas encore de compte ?' },
  auth_signup: { ar: 'سجل', fr: "S'inscrire" },
  auth_role_question: { ar: 'شنو الدور ديالك؟', fr: 'Quel est votre role ?' },
  auth_transporteur: { ar: 'ناقل', fr: 'Transporteur' },
  auth_expediteur: { ar: 'مرسل', fr: 'Expediteur' },
  auth_fullname: { ar: 'الاسم الكامل', fr: 'Nom complet' },
  auth_city: { ar: 'المدينة', fr: 'Ville' },
  auth_choose_city: { ar: 'اختار مدينة', fr: 'Choisir une ville' },
  auth_phone: { ar: 'التيليفون', fr: 'Telephone' },
  auth_create_account: { ar: 'فتح الحساب', fr: 'Creer mon compte' },
  auth_has_account: { ar: 'عندك حساب؟', fr: 'Deja un compte ?' },

  // ===== DASHBOARD =====
  dashboard_greeting: { ar: 'سلام،', fr: 'Salut,' },
  dashboard_charges_available: { ar: 'شحنة متوفرة', fr: 'charge disponible' },
  dashboard_charges_available_plural: { ar: 'شحنات متوفرين', fr: 'charges disponibles' },
  dashboard_charges_published: { ar: 'شحنة منشورة', fr: 'charge publiee' },
  dashboard_charges_published_plural: { ar: 'شحنات منشورين', fr: 'charges publiees' },
  dashboard_type_a_info: { ar: 'كاميون بوحدو — قلب على رمورك فـ Matching', fr: "Camion seul — cherchez une remorque via l'onglet Matching" },
  dashboard_type_b_info: { ar: 'رمورك بوحدها — قلب على كاميون فـ Matching', fr: "Remorque seule — cherchez un camion via l'onglet Matching" },
  dashboard_type_c_info: { ar: 'كاميون + رمورك — كل الشحنات باينين ليك', fr: 'Camion + Remorque — toutes les charges sont visibles' },
  dashboard_no_profile: { ar: 'عمر البروفيل ديالك باش تشوف الشحنات.', fr: 'Configurez votre profil pour voir les charges.' },
  dashboard_setup_profile: { ar: 'عمر البروفيل', fr: 'Configurer mon profil' },
  dashboard_my_charges: { ar: 'الشحنات ديالي', fr: 'Mes charges' },
  dashboard_publish: { ar: 'نشر', fr: 'Publier' },
  dashboard_available_charges: { ar: 'الشحنات المتوفرين', fr: 'Charges disponibles' },
  dashboard_no_charges_transporteur: { ar: 'ما كاين حتا شحنة دابا.', fr: 'Aucune charge disponible pour le moment.' },
  dashboard_no_charges_expediteur: { ar: 'ما نشرتي حتا شحنة. كليك على "نشر" باش تبدا.', fr: 'Aucune charge publiee. Cliquez sur "Publier" pour commencer.' },
  dashboard_logout: { ar: 'خرج', fr: 'Deconnexion' },

  // ===== CHARGES =====
  charges_publish_title: { ar: 'نشر شحنة', fr: 'Publier une charge' },
  charges_departure: { ar: 'مدينة الانطلاق', fr: 'Ville de départ' },
  charges_arrival: { ar: 'مدينة الوصول', fr: "Ville d'arrivée" },
  charges_choose: { ar: 'اختار', fr: 'Choisir' },
  charges_vehicle_type: { ar: 'نوع الشاحنة المطلوب', fr: 'Type de véhicule requis' },
  charges_camion: { ar: 'كاميون', fr: 'Camion' },
  charges_remorque: { ar: 'رمورك', fr: 'Remorque' },
  charges_les_deux: { ar: 'كاميون + رمورك', fr: 'Camion + Remorque' },
  charges_weight: { ar: 'الوزن (كيلو)', fr: 'Poids (kg)' },
  charges_weight_optional: { ar: 'اختياري', fr: 'optionnel' },
  charges_price: { ar: 'الثمن الكلي (درهم)', fr: 'Prix total (MAD)' },
  charges_description: { ar: 'الوصف', fr: 'Description' },
  charges_description_optional: { ar: 'اختياري', fr: 'optionnel' },
  charges_publish_btn: { ar: 'نشر الشحنة', fr: 'Publier la charge' },

  // ===== CHARGE CARD =====
  card_just_now: { ar: 'دابا', fr: "A l'instant" },
  card_hours_ago: { ar: 'ساعة', fr: 'h' },
  card_days_ago: { ar: 'نهار', fr: 'j' },
  card_ago_prefix: { ar: 'قبل', fr: 'Il y a' },

  // ===== NOTIFICATIONS =====
  notifications_title: { ar: 'التنبيهات', fr: 'Notifications' },
  notifications_unread: { ar: 'ما مقريش', fr: 'non lu' },
  notifications_unread_plural: { ar: 'ما مقريين', fr: 'non lus' },
  notifications_mark_all_read: { ar: 'قرا كلشي', fr: 'Tout marquer lu' },
  notifications_none: { ar: 'ما كاين حتا تنبيه', fr: 'Aucune notification' },
  notifications_none_desc: { ar: 'غادي نعلموك بالشحنات والرسائل الجداد', fr: 'Vous serez notifie des nouvelles charges et messages' },
  notifications_view: { ar: 'شوف', fr: 'Voir' },
  notifications_mark_read: { ar: 'مقري', fr: 'Marquer lu' },

  // ===== MESSAGES =====
  messages_title: { ar: 'الرسائل', fr: 'Messages' },
  messages_none: { ar: 'ما كاين حتا محادثة', fr: 'Aucune conversation' },
  messages_none_desc: { ar: 'قبل شحنة باش تبدا المفاوضة', fr: 'Acceptez une charge pour commencer a negocier' },
  messages_view_charges: { ar: 'شوف الشحنات', fr: 'Voir les charges' },
  messages_no_message: { ar: 'حتا رسالة', fr: 'Aucun message' },
  messages_you: { ar: 'أنت: ', fr: 'Vous: ' },

  // ===== CHAT =====
  chat_payment_split: { ar: 'تقسيم الخلاص', fr: 'Repartition du paiement' },
  chat_total: { ar: 'المجموع', fr: 'Total' },
  chat_commission: { ar: 'Dottruck 10%', fr: 'Dottruck 10%' },
  chat_net: { ar: 'الصافي', fr: 'Net' },
  chat_no_messages: { ar: 'ما كاين حتا رسالة. اقترح تقسيم الثمن!', fr: 'Pas encore de messages. Proposez un split de prix !' },
  chat_placeholder: { ar: 'الرسالة ديالك...', fr: 'Votre message...' },
  chat_error: { ar: 'خطأ', fr: 'Erreur' },
  chat_today: { ar: 'اليوم', fr: "Aujourd'hui" },
  chat_yesterday: { ar: 'البارح', fr: 'Hier' },

  // ===== HISTORY =====
  history_title: { ar: 'السجل', fr: 'Historique' },
  history_your_charges: { ar: 'الشحنات ديالك', fr: 'Vos charges' },
  history_none: { ar: 'ما كاين حتا سجل دابا', fr: 'Aucun historique pour le moment' },
  history_completed: { ar: 'مكمول', fr: 'Complete' },
  history_cancelled: { ar: 'ملغي', fr: 'Annule' },
  history_pending: { ar: 'في الانتظار', fr: 'En cours' },

  // ===== MATCHING =====
  matching_title: { ar: 'الشركاء', fr: 'Partenaires' },
  matching_find: { ar: 'لقا شريك', fr: 'Trouvez un partenaire' },
  matching_remorques: { ar: 'رموركات متوفرين', fr: 'Remorques disponibles' },
  matching_camions: { ar: 'كاميونات متوفرين', fr: 'Camions disponibles' },
  matching_partners: { ar: 'شركاء متوفرين', fr: 'Partenaires disponibles' },
  matching_nearby: { ar: 'قريبين ليك', fr: 'pres de vous' },
  matching_no_profile: { ar: 'عمر البروفيل ديالك باش تلقا شركاء', fr: 'Configurez votre profil transporteur pour trouver des partenaires' },
  matching_type_c: { ar: 'عندك كاميون + رمورك', fr: 'Vous avez camion + remorque' },
  matching_type_c_desc: { ar: 'ما محتاجش شريك. كل الشحنات باينين ليك.', fr: "Vous n'avez pas besoin de partenaire. Toutes les charges vous sont accessibles." },
  matching_view_charges: { ar: 'شوف الشحنات', fr: 'Voir les charges' },
  matching_no_partners: { ar: 'ما كاين حتا شريك دابا', fr: 'Aucun partenaire disponible pour le moment' },
  matching_available: { ar: 'متوفر', fr: 'Disponible' },
  matching_capacity: { ar: 'السعة', fr: 'Capacite' },
  matching_view_profile: { ar: 'شوف البروفيل', fr: 'Voir profil' },
  matching_contact: { ar: 'تواصل', fr: 'Contacter' },
  matching_reviews: { ar: 'تقييم', fr: 'avis' },

  // ===== PROFILE SETTINGS =====
  profile_title: { ar: 'الحساب ديالي', fr: 'Mon profil' },
  profile_stats: { ar: 'الإحصائيات', fr: 'Statistiques' },
  profile_completed: { ar: 'مكمولين', fr: 'Completees' },
  profile_acceptance: { ar: 'نسبة القبول', fr: 'Acceptation' },
  profile_cancellation: { ar: 'نسبة الإلغاء', fr: 'Annulation' },
  profile_recent_reviews: { ar: 'آخر التقييمات', fr: 'Derniers avis' },
  profile_settings: { ar: 'الإعدادات', fr: 'Parametres' },
  profile_info: { ar: 'معلومات البروفيل', fr: 'Infos profil' },
  profile_notifications: { ar: 'التنبيهات', fr: 'Notifications' },
  profile_payment: { ar: 'الخلاص', fr: 'Paiement' },
  profile_security: { ar: 'الأمان', fr: 'Securite' },
  profile_support: { ar: 'المساعدة', fr: 'Support' },
  profile_terms: { ar: 'شروط الاستخدام', fr: "Conditions d'utilisation" },
  profile_logout: { ar: 'خرج', fr: 'Deconnexion' },
  profile_language: { ar: 'اللغة', fr: 'Langue' },

  // ===== PROFILE SETUP =====
  profile_setup_title: { ar: 'إعداد البروفيل', fr: 'Configuration du profil' },

  // ===== BOOKING CONFIRMED =====
  booking_confirmed: { ar: 'الشحنة مقبولة', fr: 'Charge acceptee' },
  booking_confirmed_desc: { ar: 'الشحنة ديالك مأكدة', fr: 'Votre charge est confirmee' },
  booking_summary: { ar: 'الملخص', fr: 'Resume' },
  booking_charge: { ar: 'الشحنة', fr: 'Charge' },
  booking_route: { ar: 'الطريق', fr: 'Trajet' },
  booking_price: { ar: 'الثمن', fr: 'Prix' },
  booking_partner: { ar: 'الشريك', fr: 'Partenaire' },
  booking_contact_partner: { ar: 'تواصل مع الشريك', fr: 'Contact partenaire' },
  booking_call: { ar: 'عيط', fr: 'Appeler' },
  booking_sms: { ar: 'رسالة', fr: 'SMS' },

  // ===== COMMON =====
  common_back: { ar: 'رجع', fr: 'Retour' },
  common_loading: { ar: 'كيتحمل...', fr: 'Chargement...' },
  common_error: { ar: 'خطأ', fr: 'Erreur' },
  common_mad: { ar: 'درهم', fr: 'MAD' },
  common_kg: { ar: 'كيلو', fr: 'kg' },
  common_listen: { ar: 'سمع', fr: 'Écouter' },

  // ===== CITIES =====
  city_safi: { ar: 'آسفي', fr: 'Safi' },
  city_casablanca: { ar: 'الدار البيضاء', fr: 'Casablanca' },
  city_marrakech: { ar: 'مراكش', fr: 'Marrakech' },
  city_agadir: { ar: 'أكادير', fr: 'Agadir' },
  city_rabat: { ar: 'الرباط', fr: 'Rabat' },
  city_tanger: { ar: 'طنجة', fr: 'Tanger' },
  city_fes: { ar: 'فاس', fr: 'Fès' },
  city_meknes: { ar: 'مكناس', fr: 'Meknès' },
} as const

export type TranslationKey = keyof typeof translations

export function getTranslation(key: TranslationKey, lang: Language): string {
  return translations[key][lang]
}

export default translations
```

**Step 2: Commit**

```bash
git add src/lib/i18n/translations.ts
git commit -m "feat(i18n): add all ar/fr translations (~100 keys)"
```

---

### Task 3: Create the LanguageProvider context

**Files:**
- Create: `src/lib/i18n/context.tsx`

**Step 1: Create the provider**

```tsx
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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const cookie = getCookie(LANGUAGE_COOKIE)
    return (cookie === 'ar' || cookie === 'fr') ? cookie : DEFAULT_LANGUAGE
  })

  const dir = LANGUAGE_DIR[lang]

  // Update HTML attributes when language changes
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang)
    setCookie(LANGUAGE_COOKIE, newLang)

    // Sync to Supabase in background
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
```

**Step 2: Commit**

```bash
git add src/lib/i18n/context.tsx
git commit -m "feat(i18n): add LanguageProvider context and useTranslation hook"
```

---

### Task 4: Create the audio/TTS module

**Files:**
- Create: `src/lib/i18n/audio.ts`

**Step 1: Create the TTS utility**

```typescript
import type { Language } from './constants'

// Check if a voice is available for the given language
function getVoice(lang: Language): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null

  const voices = window.speechSynthesis.getVoices()
  const langCode = lang === 'ar' ? 'ar' : 'fr'

  // Try exact match first (ar-MA, fr-FR), then prefix match
  return (
    voices.find(v => v.lang === (lang === 'ar' ? 'ar-MA' : 'fr-FR')) ??
    voices.find(v => v.lang.startsWith(langCode)) ??
    null
  )
}

// Speak text using Web Speech API
export function speak(text: string, lang: Language): { cancel: () => void } {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return { cancel: () => {} }
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  const voice = getVoice(lang)

  if (voice) {
    utterance.voice = voice
  }

  utterance.lang = lang === 'ar' ? 'ar-MA' : 'fr-FR'
  utterance.rate = 0.8
  utterance.pitch = 1

  window.speechSynthesis.speak(utterance)

  return {
    cancel: () => window.speechSynthesis.cancel(),
  }
}

// Check if TTS is supported for the given language
export function isTTSSupported(lang: Language): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  return getVoice(lang) !== null
}

// Play a pre-recorded audio fallback
export function playAudioFile(path: string): { cancel: () => void } {
  const audio = new Audio(path)
  audio.play().catch(() => {
    // Silently fail if audio can't play
  })
  return {
    cancel: () => {
      audio.pause()
      audio.currentTime = 0
    },
  }
}

// Play sound effect (success, error, notification)
export function playSoundEffect(type: 'success' | 'error' | 'notification') {
  const paths: Record<string, string> = {
    success: '/sounds/success.mp3',
    error: '/sounds/error.mp3',
    notification: '/sounds/notification.mp3',
  }
  playAudioFile(paths[type])

  // Vibrate on notification if supported
  if (type === 'notification' && navigator.vibrate) {
    navigator.vibrate(200)
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/i18n/audio.ts
git commit -m "feat(i18n): add TTS and audio utility functions"
```

---

### Task 5: Create the AudioButton component

**Files:**
- Create: `src/components/ui/AudioButton.tsx`

**Step 1: Create the component**

```tsx
'use client'

import { useState, useRef } from 'react'
import { speak, isTTSSupported, playAudioFile } from '@/lib/i18n/audio'
import { useTranslation } from '@/lib/i18n/context'

interface AudioButtonProps {
  text: string
  audioFallback?: string // path to fallback audio file
  size?: 'sm' | 'md'
  className?: string
}

export function AudioButton({ text, audioFallback, size = 'sm', className = '' }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false)
  const cancelRef = useRef<(() => void) | null>(null)
  const { lang } = useTranslation()

  const handlePlay = () => {
    if (playing) {
      cancelRef.current?.()
      setPlaying(false)
      return
    }

    setPlaying(true)

    if (isTTSSupported(lang)) {
      const { cancel } = speak(text, lang)
      cancelRef.current = cancel

      // Listen for end of speech
      const checkInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setPlaying(false)
          clearInterval(checkInterval)
        }
      }, 200)
    } else if (audioFallback) {
      const { cancel } = playAudioFile(audioFallback)
      cancelRef.current = cancel
      // Reset after a reasonable time
      setTimeout(() => setPlaying(false), 3000)
    } else {
      // Try TTS anyway as a fallback
      const { cancel } = speak(text, lang)
      cancelRef.current = cancel
      setTimeout(() => setPlaying(false), 3000)
    }
  }

  const iconSize = size === 'sm' ? 14 : 18
  const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'

  return (
    <button
      type="button"
      onClick={handlePlay}
      className={`${btnSize} rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
        playing
          ? 'bg-accent text-white'
          : 'bg-accent/10 text-accent hover:bg-accent/20'
      } ${className}`}
      aria-label={playing ? 'إيقاف' : 'سمع'}
      title="سمع"
    >
      {playing ? (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
      ) : (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 010 7.07" />
          <path d="M19.07 4.93a10 10 0 010 14.14" />
        </svg>
      )}
    </button>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ui/AudioButton.tsx
git commit -m "feat(i18n): add AudioButton component for TTS playback"
```

---

### Task 6: Create the VoiceRecorder component (chat)

**Files:**
- Create: `src/components/ui/VoiceRecorder.tsx`

**Step 1: Create the component**

```tsx
'use client'

import { useState, useRef } from 'react'

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  disabled?: boolean
}

export function VoiceRecorder({ onRecordingComplete, disabled }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      setDuration(0)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onRecordingComplete(blob)
        stream.getTracks().forEach(track => track.stop())
        if (timerRef.current) clearInterval(timerRef.current)
      }

      mediaRecorder.start()
      setRecording(true)

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1)
      }, 1000)
    } catch {
      // Microphone permission denied or not available
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
    setDuration(0)
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <button
      type="button"
      onClick={recording ? stopRecording : startRecording}
      disabled={disabled}
      className={`min-h-[48px] rounded-xl px-3 flex items-center justify-center gap-2 transition-all cursor-pointer ${
        recording
          ? 'bg-error text-white min-w-[80px]'
          : 'bg-surface text-muted hover:text-accent hover:bg-accent/10'
      } disabled:opacity-50`}
      aria-label={recording ? 'إيقاف التسجيل' : 'تسجيل رسالة صوتية'}
    >
      {recording ? (
        <>
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-mono font-semibold">{formatDuration(duration)}</span>
        </>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
          <path d="M19 10v2a7 7 0 01-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )}
    </button>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ui/VoiceRecorder.tsx
git commit -m "feat(chat): add VoiceRecorder component for audio messages"
```

---

### Task 7: Create the AudioPlayer component (chat)

**Files:**
- Create: `src/components/ui/AudioPlayer.tsx`

**Step 1: Create the component**

```tsx
'use client'

import { useState, useRef } from 'react'

interface AudioPlayerProps {
  src: string
  isMine?: boolean
}

export function AudioPlayer({ src, isMine }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const toggle = () => {
    if (!audioRef.current) {
      const audio = new Audio(src)
      audioRef.current = audio

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100)
        }
      }
      audio.onended = () => {
        setPlaying(false)
        setProgress(0)
      }
    }

    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  return (
    <div className={`flex items-center gap-2 min-w-[140px] ${isMine ? 'flex-row-reverse' : ''}`}>
      <button
        type="button"
        onClick={toggle}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
          isMine ? 'bg-white/20 text-white' : 'bg-accent/10 text-accent'
        }`}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>
      <div className="flex-1 h-1 rounded-full bg-current/20 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isMine ? 'bg-white/60' : 'bg-accent'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/ui/AudioPlayer.tsx
git commit -m "feat(chat): add AudioPlayer component for voice message playback"
```

---

### Task 8: Create the LanguageToggle component

**Files:**
- Create: `src/components/ui/LanguageToggle.tsx`

**Step 1: Create the component**

```tsx
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
```

**Step 2: Commit**

```bash
git add src/components/ui/LanguageToggle.tsx
git commit -m "feat(i18n): add LanguageToggle component"
```

---

### Task 9: Wrap the app with LanguageProvider

**Files:**
- Modify: `src/app/layout.tsx:1-18`

**Step 1: Update layout.tsx**

Replace the entire file with:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/lib/i18n/context'

const inter = Inter({ subsets: ['latin', 'latin-ext'] })

export const metadata: Metadata = {
  title: 'Dottruck — Transport intelligent au Maroc',
  description: 'Trouve ta charge en 2 clics. Plateforme de fret pour transporteurs marocains.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  )
}
```

**Step 2: Add RTL support to globals.css**

Append to `src/app/globals.css`:

```css
/* RTL support */
[dir="rtl"] {
  text-align: right;
}

[dir="ltr"] {
  text-align: left;
}
```

**Step 3: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat(i18n): wrap app with LanguageProvider, add RTL support"
```

---

### Task 10: Translate the BottomNav component

**Files:**
- Modify: `src/components/ui/BottomNav.tsx`

**Step 1: Convert to use translations**

The BottomNav is already a client component. Replace the hardcoded `navItems` labels with translation keys. The `label` field changes to a translation key, and the component calls `useTranslation()` to get the translated text.

Key changes:
- Import `useTranslation` from `@/lib/i18n/context`
- Change navItems to use `labelKey` of type `TranslationKey`
- Call `t(item.labelKey)` in the render

The navItems array becomes:
```typescript
{ href: '/dashboard', labelKey: 'nav_home' as const, icon: ... },
{ href: '/messages', labelKey: 'nav_messages' as const, icon: ... },
{ href: '/history', labelKey: 'nav_history' as const, icon: ... },
{ href: '/notifications', labelKey: 'nav_alerts' as const, icon: ... },
{ href: '/profile/settings', labelKey: 'nav_profile' as const, icon: ... },
```

And in the render: `<span ...>{t(item.labelKey)}</span>`

**Step 2: Commit**

```bash
git add src/components/ui/BottomNav.tsx
git commit -m "feat(i18n): translate BottomNav labels"
```

---

### Task 11: Translate the TopHeader component

**Files:**
- Modify: `src/components/ui/TopHeader.tsx`

**Step 1: Update TopHeader**

The TopHeader receives `title` as a prop — this stays as-is since the parent page passes the translated title. However, update the `aria-label` from "Retour" to use the proper language.

Convert to client component, add `useTranslation`, change aria-label to `t('common_back')`.

Also flip the back arrow SVG direction when in RTL mode using the `dir` from context.

**Step 2: Commit**

```bash
git add src/components/ui/TopHeader.tsx
git commit -m "feat(i18n): add RTL support to TopHeader"
```

---

### Task 12: Translate the Landing Page

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Convert to client component and use translations**

Add `'use client'` directive, import `useTranslation`, replace all hardcoded French strings with `t()` calls:

- `"Les appels, c'est fini."` → `t('landing_tagline1')`
- `"Trouve ton chargement en 2 clics"` → `t('landing_tagline2')`
- `"Transport de fret au Maroc"` → `t('landing_subtitle')`
- All benefit texts → corresponding `t('landing_benefit1_title')`, etc.
- CTA buttons → `t('landing_transporteur')`, `t('landing_expediteur')`
- `"Deja un compte ?"` → `t('landing_has_account')`
- `"Se connecter"` → `t('landing_login')`

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(i18n): translate landing page to ar/fr"
```

---

### Task 13: Translate the Login Page

**Files:**
- Modify: `src/app/auth/login/page.tsx`

**Step 1: Convert to client component and translate**

Add `'use client'`, import `useTranslation`. Replace:
- `"Bienvenue"` → `t('auth_welcome')`
- `"Connectez-vous a votre compte Dottruck"` → `t('auth_login_subtitle')`
- `"Email"` → `t('auth_email')`
- `"Mot de passe"` → `t('auth_password')`
- `"Se connecter"` → `t('auth_login_btn')`
- `"Pas encore de compte ?"` → `t('auth_no_account')`
- `"S'inscrire"` → `t('auth_signup')`

Note: Since this page uses `searchParams` which requires server component, wrap the page content in a client component and keep the page as a server component that passes props. Alternative: read searchParams via `useSearchParams()` hook in the client component.

**Step 2: Commit**

```bash
git add src/app/auth/login/page.tsx
git commit -m "feat(i18n): translate login page"
```

---

### Task 14: Translate the Signup Page

**Files:**
- Modify: `src/app/auth/signup/page.tsx`

**Step 1: Convert and translate**

Same pattern as login. Replace all hardcoded French labels with `t()` calls. The form uses a server action which remains unchanged.

Key translations:
- Role question, city label, phone label, name label
- CTA button text
- Tab labels (Transporteur/Expediteur)

**Step 2: Commit**

```bash
git add src/app/auth/signup/page.tsx
git commit -m "feat(i18n): translate signup page"
```

---

### Task 15: Translate the Dashboard Page

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Extract client component**

The dashboard is a server component with Supabase queries. Create a new client component `DashboardContent` that receives props (charges, userProfile, etc.) and handles the translations. Keep the data fetching in the server component.

Create `src/components/DashboardContent.tsx` as a `'use client'` component.

Move all the JSX from the server component into this new client component. The server component only fetches data and passes it as props.

Replace all French strings with `t()` calls:
- `"Salut,"` → `t('dashboard_greeting')`
- Charge count text → `t('dashboard_charges_available')` / plural
- Type info messages → `t('dashboard_type_a_info')`, etc.
- All button labels, empty states
- Add `AudioButton` next to the greeting and charge info

**Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx src/components/DashboardContent.tsx
git commit -m "feat(i18n): translate dashboard, add audio buttons"
```

---

### Task 16: Translate the ChargeCard component and add audio

**Files:**
- Modify: `src/components/ChargeCard.tsx`

**Step 1: Convert to client component and translate**

Add `'use client'`, import `useTranslation` and `AudioButton`.

Translate:
- Type labels: `{ camion: t('charges_camion'), remorque: t('charges_remorque'), les_deux: t('charges_les_deux') }`
- Time ago strings: use translated versions

Add `AudioButton` that reads: `"شحنة من [ville_depart] إلى [ville_arrivee]، الثمن [prix] درهم"` (using the correct language).

**Step 2: Commit**

```bash
git add src/components/ChargeCard.tsx
git commit -m "feat(i18n): translate ChargeCard, add audio button"
```

---

### Task 17: Translate the Notifications Page

**Files:**
- Modify: `src/app/notifications/page.tsx`

**Step 1: Extract client content and translate**

Same pattern: create `NotificationsContent` client component. Server component fetches data, client component renders with translations.

Replace all French strings. Add `AudioButton` on each notification card.

**Step 2: Commit**

```bash
git add src/app/notifications/page.tsx src/components/NotificationsContent.tsx
git commit -m "feat(i18n): translate notifications page, add audio"
```

---

### Task 18: Translate the Messages Page

**Files:**
- Modify: `src/app/messages/page.tsx`

**Step 1: Extract client content and translate**

Create `MessagesContent` client component. Translate all strings including:
- Title, empty state, "Vous:" prefix, "Aucun message"

**Step 2: Commit**

```bash
git add src/app/messages/page.tsx src/components/MessagesContent.tsx
git commit -m "feat(i18n): translate messages page"
```

---

### Task 19: Translate the ChatRoom and add voice messages

**Files:**
- Modify: `src/components/ChatRoom.tsx`

**Step 1: Add translations and voice recording**

The ChatRoom is already a `'use client'` component. Add:
- Import `useTranslation`, `VoiceRecorder`, `AudioPlayer`
- Translate all strings (payment split labels, placeholders, date labels, error)
- Add `VoiceRecorder` button next to the text input
- Handle voice message: upload blob to Supabase Storage, insert message with `audio_url`
- Render `AudioPlayer` for messages that have `audio_url`
- Update `Message` interface to include optional `audio_url: string | null`

**Step 2: Commit**

```bash
git add src/components/ChatRoom.tsx
git commit -m "feat(i18n): translate chat, add voice message support"
```

---

### Task 20: Translate the History Page

**Files:**
- Modify: `src/app/history/page.tsx`

**Step 1: Extract client content and translate**

Create `HistoryContent` client component. Translate:
- Title, status labels, empty state, date labels, "Vos charges"

**Step 2: Commit**

```bash
git add src/app/history/page.tsx src/components/HistoryContent.tsx
git commit -m "feat(i18n): translate history page"
```

---

### Task 21: Translate the Matching Page

**Files:**
- Modify: `src/app/matching/page.tsx`

**Step 1: Extract client content and translate**

Create `MatchingContent` client component. Translate all partner discovery strings, buttons, empty states.

**Step 2: Commit**

```bash
git add src/app/matching/page.tsx src/components/MatchingContent.tsx
git commit -m "feat(i18n): translate matching page"
```

---

### Task 22: Translate the Profile Settings Page and add language toggle

**Files:**
- Modify: `src/app/profile/settings/page.tsx`

**Step 1: Extract client content, translate, and add language toggle**

Create `ProfileSettingsContent` client component. Translate all labels. Add the `LanguageToggle` component in the settings list, between the avatar section and the stats section (or as a prominent new settings item).

Add a new settings item with a globe icon:
```typescript
{ iconType: 'globe', label: t('profile_language'), component: <LanguageToggle /> }
```

**Step 2: Commit**

```bash
git add src/app/profile/settings/page.tsx src/components/ProfileSettingsContent.tsx
git commit -m "feat(i18n): translate profile settings, add language toggle"
```

---

### Task 23: Translate the Charges/New Page

**Files:**
- Modify: `src/app/charges/new/page.tsx`

**Step 1: Extract client content and translate**

Translate all form labels, placeholders, the submit button, and city names in the dropdown (show translated city names using the city translation keys).

**Step 2: Commit**

```bash
git add src/app/charges/new/page.tsx src/components/NewChargeContent.tsx
git commit -m "feat(i18n): translate new charge form"
```

---

### Task 24: Translate the Booking Confirmed Page

**Files:**
- Modify: `src/app/booking/confirmed/page.tsx`

**Step 1: Extract client content and translate**

Translate success message, summary labels, contact buttons, navigation buttons.

**Step 2: Commit**

```bash
git add src/app/booking/confirmed/page.tsx src/components/BookingConfirmedContent.tsx
git commit -m "feat(i18n): translate booking confirmed page"
```

---

### Task 25: Add sound effect files

**Files:**
- Create: `public/sounds/success.mp3`
- Create: `public/sounds/error.mp3`
- Create: `public/sounds/notification.mp3`

**Step 1: Generate minimal sound effect files**

Use short, simple audio tones. These can be generated programmatically or sourced from free sound libraries. For now, create placeholder files that will be replaced with actual sounds.

As a practical approach: use the Web Audio API to generate tones at runtime instead of MP3 files. Update `src/lib/i18n/audio.ts`:

Add a `generateTone` function:
```typescript
export function playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.value = 0.3
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.stop(ctx.currentTime + duration)
}
```

Update `playSoundEffect` to use generated tones:
```typescript
export function playSoundEffect(type: 'success' | 'error' | 'notification') {
  switch (type) {
    case 'success':
      playTone(523, 0.15) // C5
      setTimeout(() => playTone(659, 0.15), 150) // E5
      setTimeout(() => playTone(784, 0.3), 300) // G5
      break
    case 'error':
      playTone(200, 0.3, 'square')
      break
    case 'notification':
      playTone(880, 0.1) // A5
      setTimeout(() => playTone(1047, 0.2), 120) // C6
      break
  }

  if (type === 'notification' && navigator.vibrate) {
    navigator.vibrate(200)
  }
}
```

This removes the need for external MP3 files entirely.

**Step 2: Commit**

```bash
git add src/lib/i18n/audio.ts
git commit -m "feat(audio): add generated sound effects for success/error/notification"
```

---

### Task 26: Database migration for language preference

**Files:**
- Modify: `supabase/schema.sql`
- Create: `supabase/migrations/add-language-and-audio.sql`

**Step 1: Create the migration file**

```sql
-- Add language preference to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'ar';

-- Add audio_url to messages table for voice messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Make contenu nullable (voice-only messages may not have text)
ALTER TABLE public.messages ALTER COLUMN contenu DROP NOT NULL;
```

**Step 2: Update schema.sql**

Add `preferred_language text default 'ar'` to the users table definition.
Add `audio_url text` to the messages table definition.
Change `contenu text not null` to `contenu text` in the messages table.

**Step 3: Commit**

```bash
git add supabase/schema.sql supabase/migrations/add-language-and-audio.sql
git commit -m "feat(db): add preferred_language and audio_url columns"
```

---

### Task 27: Create Supabase Storage bucket for voice messages

**Files:**
- Create: `supabase/migrations/create-audio-bucket.sql`

**Step 1: Create the migration**

```sql
-- Create storage bucket for voice messages
-- Run this in Supabase SQL editor or via CLI
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', true)
ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Users can upload voice messages"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-messages' AND auth.role() = 'authenticated');

-- Allow anyone to read voice messages
CREATE POLICY "Public voice message access"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-messages');
```

**Step 2: Commit**

```bash
git add supabase/migrations/create-audio-bucket.sql
git commit -m "feat(db): add Supabase Storage bucket for voice messages"
```

---

### Task 28: Final integration test and verification

**Step 1: Run the build**

```bash
npm run build
```

Fix any TypeScript errors that arise.

**Step 2: Verify all pages render**

Start dev server and manually verify:
- Landing page shows in Darija by default
- Language toggle in settings switches to French
- Audio buttons appear and play TTS
- Chat voice recorder works
- RTL layout is correct for Arabic
- LTR layout is correct for French

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(i18n): complete language system with Darija/French + audio"
```

---

## Task Dependency Graph

```
Task 1 (constants) ──┐
                      ├── Task 3 (context) ──┐
Task 2 (translations)┘                      │
                                             ├── Task 9 (layout wrap)
Task 4 (audio) ──── Task 5 (AudioButton)     │
                                             ├── Tasks 10-24 (translate all pages)
Task 6 (VoiceRecorder) ─┐                   │
Task 7 (AudioPlayer) ───┼── Task 19 (chat)  │
                         │                   │
Task 8 (LanguageToggle) ─┼── Task 22 (settings)
                         │
Task 25 (sounds) ────────┘
Task 26-27 (DB migrations) ── independent, run anytime
Task 28 (verify) ── last
```

Tasks 1-8 can be done first (foundation). Task 9 enables all page translations. Tasks 10-24 are independent of each other. Tasks 26-27 are independent. Task 28 is last.
