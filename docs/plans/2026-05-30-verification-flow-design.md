# Verification Flow Redesign

## Goal

Redesign the transporteur verification process end-to-end: admin can request specific document re-uploads with audio/text notes, transporteur is fully blocked until compliance, and resent profiles appear with a badge in admin review.

## Architecture

Server-side blocking via middleware + layout wrapper. Admin actions target specific fields. Notifications carry metadata (targeted fields, audio URL, action URL). Transporteur correction page shows only required fields with visual cues.

## Decisions

- **Transporteur blocking**: Banner on ALL pages + app functionally blocked (no charges, no actions) until docs resent
- **Admin resend UI**: Checkboxes per field + text note + audio recording (existing)
- **Admin review**: Same "En attente" list with a "Modification" badge for resent profiles
- **Button layout**: Verify/Reject side by side + Renvoyer full-width below

---

## Design

### 1. Admin Panel (`AdminVerifyContent`)

**Field selector**: Checkboxes for `photo_carte_grise`, `photo_autorisation`, `photo_vehicule`.

**Note + Audio**: Text input for message + `AdminAudioRecorder` component (uploads to `voice-messages/admin/`).

**Buttons**:
- Row 1: `[Verifier]` `[Refuser]` — side by side, equal width
- Row 2: `[Renvoyer]` — full width below

**Pending list**: Each profile card shows a badge "Modification" (amber) if `verification_status === 'pending'` AND at least one photo field is null (but not all 3).

**Action (`verifyTransporteur` for 'resend')**:
1. Null only the targeted photo fields in `transporteur_profiles`
2. Set `verification_status = 'pending'`
3. Insert notification with `type: 'verification_resend'`, `body`, `audio_url`, `metadata: { targetFields }`, `action_url: '/profile/setup?resend=true&fields=...'`

### 2. Transporteur Blocking

**Implementation**: A `<VerificationBlocker>` client component wrapping page content in the main layout.

**Logic** (server-side data fetch in layout):
- If `role === 'transporteur'` AND `verification_status === 'pending'` AND any targeted photo is null → blocked
- Blocked state: full-screen overlay with red pulsing banner, message explaining what's needed, and CTA button to correction page
- No navigation to charges, chat, or any functional page

**Banner**: Appears on ALL pages (dashboard, charges, history, chat, notifications, profile). Red background, white text, pulsing animation, links to `/profile/setup?resend=true&fields=...`.

### 3. Correction Page (`/profile/setup?resend=true&fields=...`)

**Content**:
- Admin message (text) displayed in a card
- Audio player if `audio_url` exists
- Upload fields ONLY for targeted documents (others hidden)
- Targeted fields have a blinking/pulsing border animation
- Submit button re-uploads only the targeted files

**After submission**:
- Updates `transporteur_profiles` with new photo URLs
- Blocking is automatically lifted (photos no longer null)
- Redirect to dashboard

### 4. Profile Info Page (`/profile/setup` without resend params)

**When transporteur already has a submitted profile**: Shows read-only `TransporteurProfileView` with:
- Verification status badge
- User info card
- Vehicle type
- Document thumbnails
- Warning if some docs are missing

### 5. Data Flow

```
Admin selects fields + writes note + records audio
  → verifyTransporteur('resend', note, audioUrl, targetFields)
  → Nulls targeted fields in transporteur_profiles
  → Inserts notification (type: verification_resend)
  → Transporteur opens app → blocked everywhere
  → Clicks banner or notification → correction page
  → Uploads targeted docs → profile updated
  → App unblocked automatically
  → Admin sees profile in pending list with "Modification" badge
  → Admin verifies or rejects
```

### 6. Database

**Existing columns used**:
- `transporteur_profiles.photo_carte_grise` / `photo_autorisation` / `photo_vehicule` (null = needs resend)
- `transporteur_profiles.verification_status` ('pending' | 'verified' | 'rejected')
- `notifications.body`, `notifications.audio_url`, `notifications.type`

**No new columns needed** — metadata stored in notification body/type, blocking derived from existing null checks.

### 7. Key Files to Modify/Create

- `src/components/AdminVerifyContent.tsx` — button layout, badge in list
- `src/app/profile/actions.ts` — clean up verifyTransporteur
- `src/components/VerificationBlocker.tsx` — NEW: blocking overlay component
- `src/app/(main)/layout.tsx` or equivalent — wrap with blocker
- `src/app/profile/setup/page.tsx` — handle modes cleanly
- `src/components/TransporteurSetupWizard.tsx` — resend mode cleanup
- `src/components/TransporteurProfileView.tsx` — already exists, minor tweaks
- `src/components/DashboardContent.tsx` — remove old banner (replaced by global blocker)
