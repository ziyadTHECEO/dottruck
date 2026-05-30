# Arabic UI, Transporter Name, Tonnes & Dimensions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Arabic notifications, translated negotiation title, transporter name in chat, tonnes unit, and container dimensions on charge form.

**Architecture:** All changes are UI/display layer except the container dimensions which require a DB migration. Language is read from the `lang` cookie (name: `'lang'`). Server components read it via `cookies()` from `next/headers`. The i18n system exports `getTranslation(key, lang)` from `src/lib/i18n/translations.ts`.

**Tech Stack:** Next.js App Router, Supabase, TypeScript, Tailwind CSS, custom i18n with cookie + context

---

## BEFORE YOU START

Read these files first:
- `src/lib/i18n/translations.ts` — where all translation keys live
- `src/lib/i18n/constants.ts` — `LANGUAGE_COOKIE = 'lang'`
- `src/app/chat/[matchingId]/page.tsx` — server component for chat
- `src/components/ChatRoom.tsx` — client component for message display
- `src/components/NewChargeContent.tsx` — client component for charge form
- `src/app/charges/actions.ts` — server action for form submission
- `docs/plans/2026-05-30-arabic-ui-dimensions-design.md` — full design rationale

---

### Task 1: Apply Arabic notification triggers to Supabase

**Files:**
- Run: `supabase/migrations/arabic-notifications.sql` (already exists — do NOT edit)

**Step 1: Open Supabase SQL Editor**

Go to your Supabase project dashboard → SQL Editor.

**Step 2: Paste and run the file**

Copy the full contents of `supabase/migrations/arabic-notifications.sql` and execute it.

**Step 3: Verify**

In SQL Editor run:
```sql
SELECT proname FROM pg_proc WHERE proname LIKE 'notify_%';
```
Expected: `notify_on_matching`, `notify_on_message`, `notify_on_rating`, `notify_on_new_charge` all present.

Then trigger a test notification from the app (e.g. send a message) and check the notifications table:
```sql
SELECT title, body FROM public.notifications ORDER BY created_at DESC LIMIT 5;
```
Expected: titles and bodies in Arabic.

**Step 4: Commit**

```bash
git add supabase/migrations/arabic-notifications.sql
git commit -m "feat(db): apply arabic notification triggers"
```

---

### Task 2: Add translation keys for negotiation title and container dimensions

**Files:**
- Modify: `src/lib/i18n/translations.ts`

**Step 1: Open translations.ts and find the chat section (around line 105)**

Add `chat_negotiation` right after `chat_yesterday`:

```typescript
chat_negotiation: { ar: 'التفاوض', fr: 'Négociation' },
```

**Step 2: Find the charges section (around line 63) and update `charges_weight`**

Replace:
```typescript
charges_weight: { ar: 'الوزن (كيلو)', fr: 'Poids (kg)' },
```
With:
```typescript
charges_weight: { ar: 'الوزن (طن)', fr: 'Poids (tonnes)' },
```

**Step 3: Add container/dimension keys after `charges_description_optional`**

```typescript
charges_conteneur: { ar: 'كونتينار', fr: 'Conteneur' },
charges_conteneur_check: { ar: 'هل هي كونتينار؟', fr: 'Est-ce un conteneur ?' },
charges_width: { ar: 'العرض (سم)', fr: 'Largeur (cm)' },
charges_height: { ar: 'الارتفاع (سم)', fr: 'Hauteur (cm)' },
charges_dimensions: { ar: 'الأبعاد', fr: 'Dimensions' },
```

**Step 4: Verify TypeScript compiles**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK 3" && npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors related to new keys.

**Step 5: Commit**

```bash
git add src/lib/i18n/translations.ts
git commit -m "feat(i18n): add negotiation, tonnes, and container translation keys"
```

---

### Task 3: Fix negotiation page title (Server Component)

**Files:**
- Modify: `src/app/chat/[matchingId]/page.tsx`

**Step 1: Add imports at the top of the file**

After the existing imports, add:
```typescript
import { cookies } from 'next/headers'
import { getTranslation } from '@/lib/i18n/translations'
import type { Language } from '@/lib/i18n/constants'
```

**Step 2: Inside the `ChatPage` function, before the return statement, read the language cookie**

Add after the `if (!matching) return notFound()` line:
```typescript
const cookieStore = await cookies()
const lang = (cookieStore.get('lang')?.value ?? 'ar') as Language
```

**Step 3: Replace the hardcoded title**

Replace:
```typescript
<TopHeader title="Negociation" backHref="/messages" />
```
With:
```typescript
<TopHeader title={getTranslation('chat_negotiation', lang)} backHref="/messages" />
```

**Step 4: Verify TypeScript compiles**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK 3" && npx tsc --noEmit 2>&1 | head -20
```

**Step 5: Test in browser**

Navigate to a chat page. The header should show "التفاوض" in Arabic or "Négociation" in French depending on the `lang` cookie.

**Step 6: Commit**

```bash
git add src/app/chat/\[matchingId\]/page.tsx
git commit -m "feat(chat): translate negotiation page title from server component"
```

---

### Task 4: Show transporter name to expediteur in chat

**Files:**
- Modify: `src/app/chat/[matchingId]/page.tsx`
- Modify: `src/components/ChatRoom.tsx`

**Step 1: In the server component, fetch the transporter's name**

In `chat/[matchingId]/page.tsx`, after fetching `matching`, add:

```typescript
// Determine if current user is expediteur and find transporteur name
const transporteurId =
  matching.transporteur_complet_id ??
  matching.transporteur_camion_id ??
  matching.transporteur_remorque_id ?? null

let transporteurName: string | undefined = undefined
if (transporteurId && user.id === charge.expediteur_id) {
  const { data: tp } = await supabase
    .from('users')
    .select('nom')
    .eq('id', transporteurId)
    .single()
  transporteurName = tp?.nom ?? undefined
}
```

Note: `charge.expediteur_id` is available because the matching query uses `.select('*, charges(*)')`. You may need to cast:
```typescript
const charge = matching.charges as {
  id: string
  ville_depart: string
  ville_arrivee: string
  prix_total_mad: number
  expediteur_id: string  // add this field
}
```

**Step 2: Pass the prop to ChatRoom**

Update the `<ChatRoom>` JSX:
```typescript
<ChatRoom
  matchingId={matchingId}
  currentUserId={user.id}
  prixTotal={charge.prix_total_mad}
  transporteurName={transporteurName}
/>
```

**Step 3: Update ChatRoom to accept and display the prop**

In `src/components/ChatRoom.tsx`:

Update the `ChatRoomProps` interface:
```typescript
interface ChatRoomProps {
  matchingId: string
  currentUserId: string
  prixTotal: number
  transporteurName?: string
}
```

Update the function signature:
```typescript
export function ChatRoom({ matchingId, currentUserId, prixTotal, transporteurName }: ChatRoomProps) {
```

In the message rendering section, find the `<div key={msg.id}>` block and add a name label above received messages. After `{showDate && (...)}` and before the `<div className={flex ...}>` bubble wrapper, insert:

```typescript
{!isMine && transporteurName && (
  <p className="text-[10px] text-muted px-1 mb-0.5">{transporteurName}</p>
)}
```

**Step 4: Verify TypeScript compiles**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK 3" && npx tsc --noEmit 2>&1 | head -20
```

**Step 5: Test**

Open a chat as an expediteur. The transporter's name should appear in small text above each of their message bubbles. Open the same chat as a transporteur — no name should appear.

**Step 6: Commit**

```bash
git add src/app/chat/\[matchingId\]/page.tsx src/components/ChatRoom.tsx
git commit -m "feat(chat): show transporter name to expediteur above messages"
```

---

### Task 5: Change weight unit from kg to tonnes in display

**Files:**
- Modify: `src/components/ChargeCard.tsx`
- Modify: `src/app/charges/[id]/page.tsx`
- Modify: `src/components/NewChargeContent.tsx`

**Step 1: Update ChargeCard.tsx**

Find line 37-38 (audio text) and replace `كيلو` and `kg`:
```typescript
const audioText = lang === 'ar'
  ? `شحنة من ${charge.ville_depart} إلى ${charge.ville_arrivee}، الثمن ${charge.prix_total_mad} درهم${charge.poids_kg ? `، الوزن ${charge.poids_kg} طن` : ''}`
  : `Charge de ${charge.ville_depart} à ${charge.ville_arrivee}, prix ${charge.prix_total_mad} MAD${charge.poids_kg ? `, poids ${charge.poids_kg} T` : ''}`
```

Find line 55 and replace `kg` with `T`:
```typescript
{charge.poids_kg ? ` · ${charge.poids_kg} T` : ''}
```

**Step 2: Update charges/[id]/page.tsx**

Find the line (around line 175):
```typescript
{charge.poids_kg ? `${charge.poids_kg} كيلو` : '—'}
```
Replace with:
```typescript
{charge.poids_kg ? `${charge.poids_kg} طن` : '—'}
```

**Step 3: Update NewChargeContent.tsx**

Find the `poids_kg` input placeholder `"Ex: 5000"` and change to `"Ex: 5"`. The label already uses the `charges_weight` translation key which was updated in Task 2 to say "tonnes".

**Step 4: Verify TypeScript compiles**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK 3" && npx tsc --noEmit 2>&1 | head -20
```

**Step 5: Test**

Check dashboard charge cards — weight should show `· 5 T`. Check charge detail page — weight should show `5 طن`. Check new charge form — label should say "الوزن (طن)".

**Step 6: Commit**

```bash
git add src/components/ChargeCard.tsx src/app/charges/\[id\]/page.tsx src/components/NewChargeContent.tsx
git commit -m "feat(display): change weight unit from kg to tonnes across UI"
```

---

### Task 6: DB migration — add container columns

**Files:**
- Create: `supabase/migrations/add-dimensions.sql`

**Step 1: Create the migration file**

```sql
-- Add container and dimension fields to charges
ALTER TABLE public.charges ADD COLUMN IF NOT EXISTS is_conteneur BOOLEAN DEFAULT false;
ALTER TABLE public.charges ADD COLUMN IF NOT EXISTS largeur_cm INT;
ALTER TABLE public.charges ADD COLUMN IF NOT EXISTS hauteur_cm INT;
```

**Step 2: Run it in Supabase SQL Editor**

Paste and execute.

**Step 3: Verify**

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'charges' AND column_name IN ('is_conteneur', 'largeur_cm', 'hauteur_cm');
```
Expected: 3 rows returned.

**Step 4: Commit**

```bash
git add supabase/migrations/add-dimensions.sql
git commit -m "feat(db): add is_conteneur, largeur_cm, hauteur_cm to charges"
```

---

### Task 7: Container toggle + dimension fields in charge form

**Files:**
- Modify: `src/components/NewChargeContent.tsx`
- Modify: `src/app/charges/actions.ts`

**Step 1: Add `isConteneur` state to NewChargeContent**

At the top of the component function, after `const { t } = useTranslation()`:
```typescript
const [isConteneur, setIsConteneur] = useState(false)
```

Add the import at the top of the file:
```typescript
import { useState } from 'react'
```

**Step 2: Add the container toggle after the description field and before the submit button**

```tsx
<div className="space-y-1">
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      name="is_conteneur"
      value="true"
      checked={isConteneur}
      onChange={e => setIsConteneur(e.target.checked)}
      className="w-5 h-5 rounded border-border accent-accent cursor-pointer"
    />
    <span className="text-sm font-medium text-gray-600">{t('charges_conteneur_check')}</span>
  </label>
</div>

{isConteneur && (
  <div className="grid grid-cols-2 gap-3">
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-600">{t('charges_width')}</label>
      <input
        name="largeur_cm"
        type="number"
        min="1"
        required
        placeholder="Ex: 235"
        className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]"
      />
    </div>
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-600">{t('charges_height')}</label>
      <input
        name="hauteur_cm"
        type="number"
        min="1"
        required
        placeholder="Ex: 269"
        className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]"
      />
    </div>
  </div>
)}
```

**Step 3: Update the server action to save new fields**

In `src/app/charges/actions.ts`, after the `poids_kg` line:
```typescript
const is_conteneur = formData.get('is_conteneur') === 'true'
const largeur_cm = is_conteneur && formData.get('largeur_cm') ? parseInt(formData.get('largeur_cm') as string) : null
const hauteur_cm = is_conteneur && formData.get('hauteur_cm') ? parseInt(formData.get('hauteur_cm') as string) : null
```

Add to the `supabase.from('charges').insert({...})` object:
```typescript
is_conteneur,
largeur_cm,
hauteur_cm,
```

**Step 4: Verify TypeScript compiles**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK 3" && npx tsc --noEmit 2>&1 | head -20
```

**Step 5: Test the form**

- Open new charge form
- Without checking "conteneur": submit → no dimension fields sent
- Check "conteneur": dimension fields appear, both required
- Try submitting without dimensions: browser validation blocks it
- Fill dimensions and submit: charge created with container data

**Step 6: Commit**

```bash
git add src/components/NewChargeContent.tsx src/app/charges/actions.ts
git commit -m "feat(charges): add container toggle with required width/height fields"
```

---

### Task 8: Display container badge and dimensions on charge detail page

**Files:**
- Modify: `src/app/charges/[id]/page.tsx`

**Step 1: Find the query at the top of the file that fetches the charge**

It will have `.select(...)` — add `is_conteneur`, `largeur_cm`, `hauteur_cm` to the select. Check the existing select query and add these fields. Also add them to the TypeScript type cast for `charge`.

**Step 2: In the cargo info section (around line 169), add a container badge**

After the existing `<div className="grid grid-cols-2 gap-3">`, add a new grid item for container status:

```tsx
{charge.is_conteneur && (
  <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center gap-2">
    <span className="text-xs font-semibold text-accent">📦 كونتينار</span>
    {charge.largeur_cm && charge.hauteur_cm && (
      <span className="text-xs text-muted">{charge.largeur_cm} × {charge.hauteur_cm} سم</span>
    )}
  </div>
)}
```

**Step 3: Update the TypeScript type cast for charge to include new fields**

Find the `charge` type definition in the file and add:
```typescript
is_conteneur: boolean
largeur_cm: number | null
hauteur_cm: number | null
```

**Step 4: Verify TypeScript compiles**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK 3" && npx tsc --noEmit 2>&1 | head -20
```

**Step 5: Test**

Open a container charge detail page. A blue badge showing "📦 كونتينار" and the dimensions should appear in the cargo section.

**Step 6: Final build check**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK 3" && npm run build 2>&1 | tail -20
```
Expected: build succeeds with no errors.

**Step 7: Commit**

```bash
git add src/app/charges/\[id\]/page.tsx
git commit -m "feat(charges): display container badge and dimensions on charge detail"
```

---

## Done

All 5 features implemented. Summary of commits:
1. `feat(db): apply arabic notification triggers`
2. `feat(i18n): add negotiation, tonnes, and container translation keys`
3. `feat(chat): translate negotiation page title from server component`
4. `feat(chat): show transporter name to expediteur above messages`
5. `feat(display): change weight unit from kg to tonnes across UI`
6. `feat(db): add is_conteneur, largeur_cm, hauteur_cm to charges`
7. `feat(charges): add container toggle with required width/height fields`
8. `feat(charges): display container badge and dimensions on charge detail`
