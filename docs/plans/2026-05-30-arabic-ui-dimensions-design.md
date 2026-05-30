# Design — Arabic UI, Transporter Name, Tonnes, Dimensions

Date: 2026-05-30

## Scope

5 features to implement together:

1. Arabic notification triggers (DB migration only)
2. Negotiation page title in Arabic
3. Transporter name visible to expediteur in chat
4. Weight unit changed from kg to tonnes (display only)
5. Width + height fields on charge form, mandatory for containers

---

## 1. Arabic Notification Triggers

**No code change.** Run `supabase/migrations/arabic-notifications.sql` in Supabase SQL Editor. This replaces French notification titles/bodies with Arabic across all trigger functions (`notify_on_matching`, `notify_on_message`, `notify_on_rating`, `notify_on_new_charge`).

---

## 2. Negotiation Page Title in Arabic

**Problem:** `chat/[matchingId]/page.tsx` is a Server Component and cannot use `useTranslation()`. Title is hardcoded as `"Negociation"`.

**Solution:**
- Add translation key `chat_negotiation: { ar: 'التفاوض', fr: 'Négociation' }` in `translations.ts`
- In `chat/[matchingId]/page.tsx`: import `cookies` from `next/headers`, read the `lang` cookie, call `getTranslation('chat_negotiation', lang)` and pass to `TopHeader`

---

## 3. Transporter Name for Expediteurs

**Problem:** `ChatRoom.tsx` shows messages with no sender label. Expediteurs cannot identify who is writing.

**Solution:**
- In `chat/[matchingId]/page.tsx` (server): after fetching `matching`, determine `transporteurId = transporteur_complet_id ?? transporteur_camion_id ?? transporteur_remorque_id`. If `user.id === charge.expediteur_id`, fetch `nom` from `users` for that transporteurId. Pass as prop `transporteurName?: string` to `ChatRoom`.
- In `ChatRoom.tsx`: accept `transporteurName?: string` prop. When rendering a received message (`!isMine`) and `transporteurName` is set, show a small name label above the bubble.

---

## 4. Weight Unit — kg → Tonnes (Display Only)

**No DB change.** The `poids_kg` column stays as-is. Only labels and display strings change.

Files to update:
- `translations.ts`: `charges_weight` → `{ ar: 'الوزن (طن)', fr: 'Poids (tonnes)' }`
- `ChargeCard.tsx`: `· ${charge.poids_kg} kg` → `· ${charge.poids_kg} T` and audio text
- `charges/[id]/page.tsx`: `${charge.poids_kg} كيلو` → `${charge.poids_kg} طن`
- `NewChargeContent.tsx`: update placeholder from `Ex: 5000` to `Ex: 5`

---

## 5. Width + Height Fields — Optional / Mandatory for Containers

**DB migration** — add to `charges` table:
```sql
ALTER TABLE public.charges ADD COLUMN IF NOT EXISTS is_conteneur BOOLEAN DEFAULT false;
ALTER TABLE public.charges ADD COLUMN IF NOT EXISTS largeur_cm INT;
ALTER TABLE public.charges ADD COLUMN IF NOT EXISTS hauteur_cm INT;
```

**Form (`NewChargeContent.tsx`):**
- Add `useState` for `isConteneur: boolean`
- Add a toggle/checkbox labeled `{ ar: 'هل هي كونتينار؟', fr: 'Conteneur ?' }`
- When checked: show Largeur (cm) and Hauteur (cm) inputs with `required`
- When unchecked: inputs hidden, not submitted

**Server action (`charges/actions.ts`):**
- Read `is_conteneur`, `largeur_cm`, `hauteur_cm` from formData
- Save to DB

**Display (`charges/[id]/page.tsx`):**
- If `is_conteneur`: show a "كونتينار" badge
- Show dimensions grid cell: `{largeur_cm} × {hauteur_cm} cm`

**Translation keys to add:**
- `charges_conteneur`: `{ ar: 'كونتينار', fr: 'Conteneur' }`
- `charges_conteneur_check`: `{ ar: 'هل هي كونتينار؟', fr: 'Est-ce un conteneur ?' }`
- `charges_width`: `{ ar: 'العرض (سم)', fr: 'Largeur (cm)' }`
- `charges_height`: `{ ar: 'الارتفاع (سم)', fr: 'Hauteur (cm)' }`
- `charges_dimensions`: `{ ar: 'الأبعاد', fr: 'Dimensions' }`

---

## Files Affected

| File | Change |
|------|--------|
| `supabase/migrations/arabic-notifications.sql` | Apply to DB (no code edit) |
| `supabase/migrations/add-dimensions.sql` | New — adds 3 columns to charges |
| `src/lib/i18n/translations.ts` | Add 6 keys, update 1 key |
| `src/app/chat/[matchingId]/page.tsx` | Cookie-based lang + transporteur name fetch |
| `src/components/ChatRoom.tsx` | Accept + display `transporteurName` prop |
| `src/components/ChargeCard.tsx` | kg → T in display + audio text |
| `src/app/charges/[id]/page.tsx` | kg → T, show container badge + dimensions |
| `src/components/NewChargeContent.tsx` | Tonnes label, container toggle, dimension fields |
| `src/app/charges/actions.ts` | Save new fields |
