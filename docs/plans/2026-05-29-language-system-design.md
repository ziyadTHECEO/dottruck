# Dottruck Language System Design

**Date:** 2026-05-29
**Status:** Approved

## Overview

Add a bilingual language system (Moroccan Darija Arabic + French) with audio/TTS capabilities to the Dottruck freight marketplace app. Darija is the default language. The system includes text-to-speech, voice messages in chat, and sound feedback.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| i18n approach | Custom lightweight (Context + hook) | Only 2 languages, no need for routing-based i18n |
| TTS engine | Hybrid: Web Speech API + pre-recorded fallback | Free, works offline, fallback ensures ar-MA coverage |
| Language storage | Cookie + Supabase sync | SSR needs cookie, cross-device needs DB |
| Autoplay audio | No autoplay, play buttons everywhere | Respects browser policies, user controls audio |
| Chat voice messages | Record & send audio only (no STT) | Simpler, no external service needed |

## Architecture

### New Files

```
src/lib/i18n/
  translations.ts    # All ar/fr translation strings (~100+ keys)
  context.tsx         # LanguageProvider + useTranslation hook
  audio.ts            # TTS functions (Web Speech API + audio fallback)
  constants.ts        # Types, supported languages
```

### LanguageProvider

- Wraps app in `layout.tsx` as Client Component
- Default language: `ar`
- Reads language from `lang` cookie on mount
- Syncs to Supabase `profiles.preferred_language` on change
- Exports `useTranslation()` hook: `{ t, lang, setLang, dir }`
- Server helper: `getServerLang()` reads cookie for SSR

### RTL Support

- Dynamic `<html dir={dir} lang={lang}>`
- Tailwind `rtl:` utilities for directional layouts

## Audio System

### TTS (Text-to-Speech)

- Primary: `speechSynthesis` API with `ar-MA` voice (fallback `ar-SA`)
- Rate: 0.8 (slow and clear)
- Fallback: pre-recorded MP3 files in `/public/audio/ar/`
- Reusable `AudioButton` component ("سمع" button)

### Audio Button Placement

- Page titles: play button next to each title
- ChargeCard: reads "شحنة من [city] إلى [city]، الثمن [price] درهم، الوزن [weight]"
- Notifications: play button on each notification
- Chat: mic button for voice message recording

### Voice Messages (Chat)

- `MediaRecorder API` for audio capture
- Upload to Supabase Storage
- Store URL in `messages.audio_url` column
- `AudioPlayer` component for playback

### Sound Feedback

- Success sound: confirmation actions (accept, confirm)
- Error sound: error states
- Notification sound: new notifications + `navigator.vibrate`
- Files: `/public/sounds/` (small MP3s)

## Database Changes

```sql
ALTER TABLE profiles ADD COLUMN preferred_language TEXT DEFAULT 'ar';
ALTER TABLE messages ADD COLUMN audio_url TEXT;
```

## Translation Coverage

The `translations.ts` file covers:
- All button labels
- All form labels
- All error/success messages
- All page titles
- All notifications text
- Navigation items
- City names in Arabic
- Status labels (accepted, refused, pending, completed)
- Vehicle types and descriptions

## Settings Integration

- New language toggle in profile/settings page
- Switch between "العربية" and "Français"
- Immediate re-render on language change
- Cookie + Supabase sync on toggle
