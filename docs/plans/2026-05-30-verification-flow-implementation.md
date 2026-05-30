# Verification Flow Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the transporteur verification process so the app is fully blocked when documents need resending, admin sees a "Modification" badge for resent profiles, and button layout is clean (Verify/Reject side by side, Renvoyer full-width below).

**Architecture:** A shared `VerificationBlocker` client component wraps all main app pages. It receives blocking state from server-side data passed as props. Admin panel gets updated button layout and badge. Correction page is the existing resend mode of `TransporteurSetupWizard`.

**Tech Stack:** Next.js 16 (App Router, Server Components), React 19, Supabase, Tailwind CSS, TypeScript

---

### Task 1: Create the `VerificationBlocker` component

**Files:**
- Create: `src/components/VerificationBlocker.tsx`

**Step 1: Create the blocking overlay component**

```tsx
'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/context'

interface VerificationBlockerProps {
  blocked: boolean
  resendFields: string[]
  children: React.ReactNode
}

export function VerificationBlocker({ blocked, resendFields, children }: VerificationBlockerProps) {
  const { t } = useTranslation()

  if (!blocked) return <>{children}</>

  const resendUrl = `/profile/setup?resend=true&fields=${resendFields.join(',')}`

  return (
    <div className="relative min-h-screen">
      {/* Blocking overlay */}
      <div className="fixed inset-0 z-50 bg-white/95 flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="max-w-sm w-full text-center space-y-6">
          {/* Warning icon */}
          <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-nardo">يجب إعادة إرسال الوثائق</h1>

          {/* Description */}
          <p className="text-sm text-muted leading-relaxed">
            الأدمين طلب منك تعاود ترسل بعض الوثائق باش تكمل التحقق من حسابك. ما تقدرش تستعمل التطبيق حتى تصيفط الوثائق.
          </p>

          {/* CTA Button */}
          <Link
            href={resendUrl}
            className="block w-full py-3.5 bg-red-600 text-white font-semibold rounded-xl text-center animate-pulse"
          >
            إعادة إرسال الوثائق
          </Link>
        </div>
      </div>

      {/* Content behind (blurred, non-interactive) */}
      <div className="pointer-events-none blur-sm opacity-30">
        {children}
      </div>
    </div>
  )
}
```

**Step 2: Verify the component compiles**

Run: `npx next build --no-lint 2>&1 | head -20`
Expected: No TypeScript errors related to `VerificationBlocker`

**Step 3: Commit**

```bash
git add src/components/VerificationBlocker.tsx
git commit -m "feat: add VerificationBlocker overlay component"
```

---

### Task 2: Create a shared server-side helper to detect blocking state

**Files:**
- Create: `src/lib/verification.ts`

**Step 1: Create the helper function**

This function fetches the transporteur's verification state and returns whether they're blocked + which fields need resending. Used by all page server components.

```ts
import { createClient } from '@/lib/supabase/server'

export interface VerificationState {
  blocked: boolean
  resendFields: string[]
}

export async function getVerificationState(userId: string, role?: string): Promise<VerificationState> {
  if (role !== 'transporteur') return { blocked: false, resendFields: [] }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('transporteur_profiles')
    .select('verification_status, photo_carte_grise, photo_autorisation, photo_vehicule')
    .eq('user_id', userId)
    .single()

  if (!profile || profile.verification_status !== 'pending') {
    return { blocked: false, resendFields: [] }
  }

  const fields: string[] = []
  if (!profile.photo_carte_grise) fields.push('photo_carte_grise')
  if (!profile.photo_autorisation) fields.push('photo_autorisation')
  if (!profile.photo_vehicule) fields.push('photo_vehicule')

  // Blocked only if SOME fields are missing (not all 3 — that's a new submission)
  const blocked = fields.length > 0 && fields.length < 3

  return { blocked, resendFields: fields }
}
```

**Step 2: Commit**

```bash
git add src/lib/verification.ts
git commit -m "feat: add getVerificationState server helper"
```

---

### Task 3: Integrate `VerificationBlocker` into the Dashboard page

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/components/DashboardContent.tsx`

**Step 1: Update `src/app/dashboard/page.tsx`**

Replace the `resendRequired` / `resendFields` logic (lines 30-41) with the shared helper, and wrap the return with `VerificationBlocker`.

At the top, add import:
```ts
import { getVerificationState } from '@/lib/verification'
import { VerificationBlocker } from '@/components/VerificationBlocker'
```

Replace lines 30-41 (the manual resend detection) with:
```ts
  const { blocked, resendFields } = await getVerificationState(user.id, userProfile?.role)
```

Replace the return (lines 79-95) with:
```tsx
  return (
    <>
      {showOnboarding && (
        <OnboardingTutorial role={role} />
      )}
      <VerificationBlocker blocked={blocked} resendFields={resendFields}>
        <DashboardContent
          charges={charges}
          userProfile={userProfile}
          transporteurProfile={transporteurProfile}
          isTransporteur={isTransporteur}
          userId={user.id}
          userName={userName}
        />
      </VerificationBlocker>
    </>
  )
```

**Step 2: Remove `resendRequired` and `resendFields` props from `DashboardContent`**

In `src/components/DashboardContent.tsx`:
- Remove `resendRequired?: boolean` and `resendFields?: string[]` from `DashboardContentProps` interface
- Remove `resendRequired = false` and `resendFields = []` from destructured props
- Remove the entire banner block (the `{resendRequired && (...)}` JSX, approximately lines 91-113)

**Step 3: Build to verify**

Run: `npx next build --no-lint 2>&1 | tail -10`
Expected: Compiles successfully

**Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx src/components/DashboardContent.tsx
git commit -m "feat: integrate VerificationBlocker into dashboard, remove old banner"
```

---

### Task 4: Add `VerificationBlocker` to all other main pages

**Files:**
- Modify: `src/app/charges/new/page.tsx`
- Modify: `src/app/history/page.tsx`
- Modify: `src/app/chat/page.tsx`
- Modify: `src/app/matching/page.tsx`
- Modify: `src/app/notifications/page.tsx`

**Step 1: For each page listed above, apply the same pattern:**

Add imports at top:
```ts
import { getVerificationState } from '@/lib/verification'
import { VerificationBlocker } from '@/components/VerificationBlocker'
```

After fetching the user and userProfile, add:
```ts
const { blocked, resendFields } = await getVerificationState(user.id, userProfile?.role)
```

Wrap the returned JSX:
```tsx
return (
  <VerificationBlocker blocked={blocked} resendFields={resendFields}>
    {/* existing page content */}
  </VerificationBlocker>
)
```

Note: Some pages may not fetch `userProfile` — for those, fetch it or pass `role` from the user query. Adapt as needed. If the page doesn't have user/role context, add a minimal query:
```ts
const { data: userProfile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single()
```

**Step 2: Build to verify**

Run: `npx next build --no-lint 2>&1 | tail -10`
Expected: Compiles successfully

**Step 3: Commit**

```bash
git add src/app/charges/new/page.tsx src/app/history/page.tsx src/app/chat/page.tsx src/app/matching/page.tsx src/app/notifications/page.tsx
git commit -m "feat: add VerificationBlocker to all main app pages"
```

---

### Task 5: Update admin button layout (Verify/Reject side by side, Renvoyer full-width below)

**Files:**
- Modify: `src/components/AdminVerifyContent.tsx` (lines ~435-459)

**Step 1: Replace the three-button layout with the new design**

Find the current button group (3 buttons: verify, reject, resend) and replace with:

```tsx
{/* Action buttons - only show when expanded and no sub-action selected */}
{expandedId === p.user_id && !rejectId && resendId !== p.user_id && (
  <div className="space-y-2 mt-3">
    {/* Row 1: Verify + Reject side by side */}
    <div className="flex gap-2">
      <button
        onClick={() => handleVerify(p.user_id)}
        disabled={loading === p.user_id}
        className="flex-1 py-2.5 bg-success text-white text-sm font-semibold rounded-xl disabled:opacity-50"
      >
        {loading === p.user_id ? '...' : 'Vérifier ✓'}
      </button>
      <button
        onClick={() => setRejectId(p.user_id)}
        className="flex-1 py-2.5 bg-red-50 text-error text-sm font-semibold rounded-xl border border-red-200"
      >
        Refuser ✗
      </button>
    </div>
    {/* Row 2: Renvoyer full width */}
    <button
      onClick={() => setResendId(p.user_id)}
      className="w-full py-2.5 bg-amber-50 text-amber-700 text-sm font-semibold rounded-xl border border-amber-300"
    >
      Renvoyer la requête ↩
    </button>
  </div>
)}
```

**Step 2: Build to verify**

Run: `npx next build --no-lint 2>&1 | tail -5`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/AdminVerifyContent.tsx
git commit -m "feat: update admin button layout - verify/reject side by side, renvoyer below"
```

---

### Task 6: Add "Modification" badge for resent profiles in admin pending list

**Files:**
- Modify: `src/components/AdminVerifyContent.tsx`

**Step 1: Detect resent profiles and show badge**

In the pending profiles list rendering (where each profile card is mapped), add a badge after the profile name. A profile is "resent" if `verification_status === 'pending'` AND at least one photo field is null but not all 3.

Find the profile summary row (showing name/ville) and add the badge conditionally:

```tsx
{/* Badge for resent profiles */}
{(() => {
  const missingCount = [p.photo_carte_grise, p.photo_autorisation, p.photo_vehicule].filter(x => !x).length
  const isResent = missingCount > 0 && missingCount < 3
  return isResent ? (
    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-300">
      Modification
    </span>
  ) : null
})()}
```

Place this right after the profile name in the summary row.

**Step 2: Ensure the profile data includes photo fields**

Check that the Supabase query fetching pending profiles includes `photo_carte_grise, photo_autorisation, photo_vehicule` in the select. If not, add them.

The profiles query should be:
```ts
.select('user_id, vehicle_type, verification_status, photo_carte_grise, photo_autorisation, photo_vehicule, users(nom, ville, avatar_url)')
```

Update the profile interface/type to include these fields.

**Step 3: Build to verify**

Run: `npx next build --no-lint 2>&1 | tail -5`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/AdminVerifyContent.tsx
git commit -m "feat: add Modification badge for resent profiles in admin pending list"
```

---

### Task 7: Clean up `verifyTransporteur` action for robustness

**Files:**
- Modify: `src/app/profile/actions.ts` (lines 79-111)

**Step 1: Ensure the resend path is clean and complete**

Review and update the resend decision path in `verifyTransporteur`:

```ts
if (decision === 'resend') {
  const fields = targetFields ?? []
  if (fields.length === 0) return { success: false, error: 'No fields specified' }

  // Only null the targeted fields
  const updatePayload: Record<string, unknown> = { verification_status: 'pending' }
  for (const f of fields) {
    updatePayload[f] = null
  }

  const adminClient = createAdminClient()
  const { error: updateError } = await adminClient
    .from('transporteur_profiles')
    .update(updatePayload)
    .eq('user_id', userId)

  if (updateError) return { success: false, error: updateError.message }

  // Build action URL
  const actionUrl = `/profile/setup?resend=true&fields=${fields.join(',')}`

  // Build notification body
  const body = reason?.trim()
    ? reason.trim()
    : `يجب إعادة إرسال: ${fields.map(f => f === 'photo_carte_grise' ? 'البطاقة الرمادية' : f === 'photo_autorisation' ? 'الإذن' : 'صورة المركبة').join('، ')}`

  // Insert notification
  const { error: notifError } = await adminClient
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'verification_resend',
      body,
      audio_url: audioUrl ?? null,
      action_url: actionUrl,
    })

  if (notifError) return { success: false, error: notifError.message }
  return { success: true }
}
```

**Step 2: Build to verify**

Run: `npx next build --no-lint 2>&1 | tail -5`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/profile/actions.ts
git commit -m "refactor: clean up verifyTransporteur resend path"
```

---

### Task 8: Ensure correction page (resend mode) works correctly end-to-end

**Files:**
- Modify: `src/app/profile/setup/page.tsx` (verify logic)
- Modify: `src/components/TransporteurSetupWizard.tsx` (verify resend submit redirects correctly)

**Step 1: Verify `/profile/setup` page handles resend mode correctly**

The page should:
1. Check `searchParams.resend === 'true'` and `searchParams.fields`
2. Fetch the latest `verification_resend` notification for context
3. Render `TransporteurSetupWizard` with `resendMode` prop

Confirm this logic exists and is correct (it should be from prior work). If any issues exist, fix them.

**Step 2: Verify the wizard's resend submit updates fields correctly**

In `TransporteurSetupWizard`, the `handleSubmit` in resend mode should:
1. Upload only targeted files to Supabase storage
2. Update `transporteur_profiles` with new URLs for those fields
3. Redirect to `/dashboard`

After successful re-upload, the `VerificationBlocker` will automatically stop blocking because the fields are no longer null.

**Step 3: Build to verify**

Run: `npx next build --no-lint 2>&1 | tail -5`
Expected: No errors

**Step 4: Commit (only if changes were needed)**

```bash
git add src/app/profile/setup/page.tsx src/components/TransporteurSetupWizard.tsx
git commit -m "fix: ensure correction page resend flow works end-to-end"
```

---

### Task 9: Final integration test and cleanup

**Files:**
- Verify all modified files compile
- Remove any dead code

**Step 1: Full build**

Run: `npx next build --no-lint`
Expected: Build succeeds with no TypeScript errors

**Step 2: Check for unused imports or dead code**

Specifically:
- `DashboardContent` no longer receives `resendRequired`/`resendFields` — confirm dashboard page doesn't pass them
- `dashboard/page.tsx` no longer needs the manual resend detection block (lines 30-41 from old code)
- No stale references to old banner logic

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: cleanup dead code from verification flow redesign"
```

---

## Summary of Changes

| Component | Change |
|-----------|--------|
| `VerificationBlocker` (NEW) | Full-screen blocking overlay when docs needed |
| `src/lib/verification.ts` (NEW) | Shared server helper for blocking state |
| Dashboard page | Uses helper + wraps with blocker, removes old banner |
| DashboardContent | Removes `resendRequired`/`resendFields` props and banner JSX |
| All main pages | Wrapped with `VerificationBlocker` |
| AdminVerifyContent | New button layout + "Modification" badge |
| profile/actions.ts | Cleaned up resend path |
| profile/setup + wizard | Verified end-to-end (existing code) |
