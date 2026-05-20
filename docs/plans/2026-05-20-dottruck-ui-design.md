# Dottruck UI — Design Document
Date: 2026-05-20

## Overview

Complete UI redesign of the FLEEZ TRUCK codebase into Dottruck — a mobile-first freight matching platform for Morocco. The existing Supabase backend, server actions, and data models are preserved. Only the visual layer is replaced, and 5 new UI-only pages are added with mock data.

---

## Branding

| Token | Value |
|-------|-------|
| Primary (Nardo Gray) | `#2D2D2D` |
| Accent (Steel Blue) | `#4A6FA5` |
| Background | `#FFFFFF` |
| Surface | `#F5F5F5` |
| Border | `#D0D0D0` |
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |
| Font | Inter (bold headings, regular body) |

---

## Constraints

- Mobile-first: primary target 375–425px
- Responsive up to 1920px (2–3 col grid on desktop)
- Touch targets: minimum 48px height
- Body font: minimum 16px
- Contrast ratio: ≥ 4.5:1

---

## Architecture

### Approach: Hybrid Redesign

- **Existing pages (9)**: Redesign UI layer; keep all Supabase server actions, queries, and auth untouched.
- **New pages (5)**: Create with realistic mock data; backend integration deferred.
- **Component layer**: Build shared reusable components consumed by all pages.

---

## Pages

### Existing Pages (redesigned)

| # | Page | Route | Notes |
|---|------|-------|-------|
| 1 | Landing / Onboarding | `/` | Two-column desktop, single-column mobile |
| 2 | Sign Up | `/auth/signup` | Role toggle (Transporteur / Expéditeur), keep server action |
| 2b | Login | `/auth/login` | Minimal form, keep server action |
| 3 | Profile Setup | `/profile/setup` | Checkbox vehicle type, dropdown city, keep server action |
| 4 | Dashboard | `/dashboard` | Charge cards list, bottom nav, keep Supabase query |
| 5 | Charge Detail | `/charges/[id]` | All info sections, accept button, keep matching creation |
| 5b | New Charge | `/charges/new` | Form redesign, keep server action |
| 7 | Chat | `/chat/[matchingId]` | Bubble redesign, keep realtime logic |
| - | Rating | `/charges/[id]/rate` | Star rating redesign, keep server action |

### New Pages (mock data)

| # | Page | Route |
|---|------|-------|
| 6 | Matching Pairs | `/matching` |
| 8 | Booking Confirmed | `/booking/confirmed` |
| 9 | Profile / Settings | `/profile/settings` |
| 10 | Historique | `/history` |
| 11 | Notifications | `/notifications` |

---

## Components

### Shared UI Components (`src/components/ui/`)

| Component | Variants |
|-----------|----------|
| `Button` | primary, secondary, danger, text-link |
| `Input` | text, password (show/hide), select/dropdown |
| `Card` | charge-card, profile-card |
| `Badge` | success, warning, error, pending |
| `TopHeader` | back button + title + optional icon(s) |
| `BottomNav` | home, history, profile tabs with active state |

### Feature Components (redesigned)

| Component | File |
|-----------|------|
| `ChargeCard` | `src/components/ChargeCard.tsx` |
| `ChatRoom` | `src/components/ChatRoom.tsx` |
| `NotificationBar` | `src/components/NotificationBar.tsx` |

---

## UX Flows

### Flow 1: Transporteur → First Charge
Landing → Sign Up → Profile Setup → Dashboard → Charge Detail → Accept → Chat → Booking Confirmed

### Flow 2: Find Partner (Type A + Type B)
Dashboard → Matching Pairs → Partner Profile → Chat → Booking Confirmed

---

## Interaction Patterns

- **Mobile**: Swipe gestures (if added), tap cards, pull to refresh (future)
- **Desktop**: Hover state (background `#F5F5F5`), smooth transitions 200ms
- **Animations**: `transition-all duration-200` on interactive elements
- **States**: loading skeletons, empty states, error messages

---

## Tailwind Strategy

Use Tailwind v4 utility classes. Define brand colors in `globals.css` as CSS custom properties:

```css
:root {
  --color-primary: #2D2D2D;
  --color-accent: #4A6FA5;
  --color-surface: #F5F5F5;
  --color-border: #D0D0D0;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
}
```

---

## Out of Scope

- Dark mode (optional, deferred)
- Push notifications (backend)
- Map/GPS integration
- Payment processing
