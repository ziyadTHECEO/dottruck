# Anti-Bypass & Price Negotiation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Block contact info sharing in chat, implement structured price negotiation, and reveal phone numbers only after deal confirmation.

**Architecture:** Messages now route through a Server Action that applies regex-based content filtering before inserting into Supabase. Price proposals use a dedicated table and UI cards in the chat feed. Phone reveal is gated by matching status.

**Tech Stack:** Next.js App Router (Server Actions), Supabase, TypeScript, Tailwind CSS

---

## BEFORE YOU START

Read these files:
- `src/components/ChatRoom.tsx` — current client-side message implementation
- `src/app/chat/[matchingId]/page.tsx` — chat server component
- `src/lib/i18n/translations.ts` — translation system
- `supabase/schema.sql` — current DB schema (messages, matchings tables)
- `docs/plans/2026-05-30-anti-bypass-negotiation-design.md` — design rationale

**Git note:** Normal `git add`/`git commit` may fail with "Stale NFS file handle" on this machine. Use git plumbing commands:
```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK 3"
HASH=$(git hash-object -w <file>)
git update-index --cacheinfo 100644,"$HASH",<file>   # existing files
git update-index --add --cacheinfo 100644,"$HASH",<file>   # new files
TREE=$(git write-tree)
PARENT=$(cat .git/refs/heads/main)
COMMIT=$(git commit-tree "$TREE" -p "$PARENT" -m "message")
echo "$COMMIT" > .git/refs/heads/main
```

---

### Task 1: DB Migration — price_proposals table + prix_final column

**Files:**
- Create: `supabase/migrations/add-negotiation.sql`

**Step 1: Create the migration file**

```sql
-- Add prix_final to matchings
ALTER TABLE public.matchings ADD COLUMN IF NOT EXISTS prix_final INT;

-- Price proposals table
CREATE TABLE IF NOT EXISTS public.price_proposals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  matching_id uuid REFERENCES public.matchings(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.users(id),
  amount_mad int NOT NULL CHECK (amount_mad > 0),
  status text CHECK (status IN ('pending', 'accepted', 'refused', 'counter')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.price_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matching parties can read proposals" ON public.price_proposals
  FOR SELECT USING (
    matching_id IN (
      SELECT m.id FROM public.matchings m
      JOIN public.charges c ON c.id = m.charge_id
      WHERE auth.uid() IN (
        m.transporteur_camion_id,
        m.transporteur_remorque_id,
        m.transporteur_complet_id,
        c.expediteur_id
      )
    )
  );

CREATE POLICY "Matching parties can insert proposals" ON public.price_proposals
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Matching parties can update proposals" ON public.price_proposals
  FOR UPDATE USING (
    matching_id IN (
      SELECT m.id FROM public.matchings m
      JOIN public.charges c ON c.id = m.charge_id
      WHERE auth.uid() IN (
        m.transporteur_camion_id,
        m.transporteur_remorque_id,
        m.transporteur_complet_id,
        c.expediteur_id
      )
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_proposals_matching ON public.price_proposals(matching_id);
```

**Step 2: Commit**

```bash
git hash-object -w supabase/migrations/add-negotiation.sql
# then update-index --add, write-tree, commit-tree
git commit -m "feat(db): add price_proposals table and prix_final column"
```

**Step 3: Run in Supabase SQL Editor**

User must manually paste and execute this SQL in Supabase dashboard.

---

### Task 2: Content Filter Library

**Files:**
- Create: `src/lib/filters/content-filter.ts`

**Step 1: Create the content filter module**

```typescript
/**
 * Content filter for Dottruck chat messages.
 * Detects and blocks phone numbers, emails, social media handles, and raw amounts.
 */

// Moroccan phone patterns
const PHONE_PATTERNS = [
  /0\s*[67]\s*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d/,  // 06/07 with spaces/dots
  /\+?\s*212\s*[67]\s*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d/,  // +212
  /00\s*212\s*[67]\s*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d/,  // 00212
]

// Text variants of phone prefixes (Moroccan Arabic/French)
const PHONE_TEXT_PATTERNS = [
  /zero\s*si[sx]/i,
  /zero\s*sept/i,
  /z[ée]ro\s*si[sx]/i,
  /z[ée]ro\s*sept/i,
  /sifr\s*sit+a/i,
  /sifr\s*sab[3a]/i,
  /صفر\s*ست[ةه]/,
  /صفر\s*سبع[ةه]/,
]

// Email pattern
const EMAIL_PATTERN = /\S+@\S+\.\S+/

// Social media keywords
const SOCIAL_KEYWORDS = [
  'whatsapp', 'whats app', 'watsap', 'watssap',
  'instagram', 'insta', 'ig',
  'facebook', 'fb',
  'telegram', 'tele', 'tg',
  'signal',
  'viber',
  'snapchat', 'snap',
  'واتساب', 'واتس', 'انستا', 'فيسبوك', 'تيليغرام',
]

// Amount patterns (to force use of price proposal component)
const AMOUNT_PATTERNS = [
  /\d{3,}\s*(dh|mad|درهم|dirham|dr)/i,
  /\d{3,}\s*(د[.]?ه|د[.]?م)/,
]

export type FilterResult = {
  blocked: boolean
  reason?: 'phone' | 'email' | 'social' | 'amount'
}

export function filterMessage(text: string): FilterResult {
  // Normalize: remove diacritics, collapse whitespace
  const normalized = text
    .replace(/[\u0610-\u061A\u064B-\u065F]/g, '') // Arabic diacritics
    .replace(/\s+/g, ' ')
    .trim()

  // Check phone numbers
  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(normalized)) {
      return { blocked: true, reason: 'phone' }
    }
  }

  // Check phone text variants
  for (const pattern of PHONE_TEXT_PATTERNS) {
    if (pattern.test(normalized)) {
      return { blocked: true, reason: 'phone' }
    }
  }

  // Check emails
  if (EMAIL_PATTERN.test(normalized)) {
    return { blocked: true, reason: 'email' }
  }

  // Check social media
  const lowerText = normalized.toLowerCase()
  for (const keyword of SOCIAL_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return { blocked: true, reason: 'social' }
    }
  }

  // Check amounts (force price proposal usage)
  for (const pattern of AMOUNT_PATTERNS) {
    if (pattern.test(normalized)) {
      return { blocked: true, reason: 'amount' }
    }
  }

  return { blocked: false }
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK 3" && npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git commit -m "feat: add content filter library for anti-bypass protection"
```

---

### Task 3: Chat Server Actions

**Files:**
- Create: `src/app/chat/actions.ts`

**Step 1: Create the server actions file**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { filterMessage } from '@/lib/filters/content-filter'

export type SendMessageResult = {
  success: boolean
  error?: string
  errorType?: 'blocked' | 'auth' | 'db'
  message?: {
    id: string
    matching_id: string
    sender_id: string
    contenu: string
    audio_url: string | null
    lu: boolean
    created_at: string
  }
}

export async function sendMessage(
  matchingId: string,
  content: string,
  audioUrl?: string
): Promise<SendMessageResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated', errorType: 'auth' }

  // Filter text content (skip for voice-only messages)
  if (content && content !== '🎤') {
    const filterResult = filterMessage(content)
    if (filterResult.blocked) {
      const errorMessages: Record<string, string> = {
        phone: 'ممنوع مشاركة أرقام الهاتف. تواصلو عبر التطبيق.',
        email: 'ممنوع مشاركة الإيميل.',
        social: 'ممنوع مشاركة حسابات التواصل الاجتماعي.',
        amount: 'استعمل زر "اقترح الثمن" للتفاوض على السعر.',
      }
      return {
        success: false,
        error: errorMessages[filterResult.reason!] ?? 'رسالة ممنوعة',
        errorType: 'blocked',
      }
    }
  }

  const { data: inserted, error } = await supabase
    .from('messages')
    .insert({
      matching_id: matchingId,
      sender_id: user.id,
      contenu: content || null,
      audio_url: audioUrl ?? null,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message, errorType: 'db' }

  return { success: true, message: inserted }
}

export type ProposalResult = {
  success: boolean
  error?: string
  proposal?: {
    id: string
    matching_id: string
    sender_id: string
    amount_mad: number
    status: string
    created_at: string
  }
}

export async function sendProposal(
  matchingId: string,
  amountMad: number
): Promise<ProposalResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }
  if (!amountMad || amountMad <= 0) return { success: false, error: 'المبلغ غير صحيح' }

  // Mark any previous pending proposals from this user as 'counter'
  await supabase
    .from('price_proposals')
    .update({ status: 'counter' })
    .eq('matching_id', matchingId)
    .eq('status', 'pending')

  const { data: proposal, error } = await supabase
    .from('price_proposals')
    .insert({
      matching_id: matchingId,
      sender_id: user.id,
      amount_mad: amountMad,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  return { success: true, proposal }
}

export async function respondToProposal(
  proposalId: string,
  response: 'accepted' | 'refused'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }

  // Get the proposal
  const { data: proposal } = await supabase
    .from('price_proposals')
    .select('*, matchings(id, charge_id)')
    .eq('id', proposalId)
    .single()

  if (!proposal) return { success: false, error: 'Proposal not found' }
  if (proposal.sender_id === user.id) return { success: false, error: 'Cannot respond to own proposal' }
  if (proposal.status !== 'pending') return { success: false, error: 'Proposal already responded' }

  // Update proposal status
  await supabase
    .from('price_proposals')
    .update({ status: response })
    .eq('id', proposalId)

  // If accepted, update matching
  if (response === 'accepted') {
    await supabase
      .from('matchings')
      .update({
        prix_final: proposal.amount_mad,
        statut: 'accepté',
      })
      .eq('id', proposal.matching_id)
  }

  return { success: true }
}

export async function revealPhone(
  matchingId: string
): Promise<{ success: boolean; phone?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }

  // Verify matching is accepted
  const { data: matching } = await supabase
    .from('matchings')
    .select('*, charges(expediteur_id)')
    .eq('id', matchingId)
    .single()

  if (!matching) return { success: false, error: 'Matching not found' }
  if (matching.statut !== 'accepté') return { success: false, error: 'الثمن ما زال ما تّافقوش عليه' }

  // Determine other party
  const charge = matching.charges as { expediteur_id: string }
  const transporteurId = matching.transporteur_complet_id ?? matching.transporteur_camion_id ?? matching.transporteur_remorque_id

  let otherUserId: string
  if (user.id === charge.expediteur_id) {
    otherUserId = transporteurId
  } else {
    otherUserId = charge.expediteur_id
  }

  // Fetch phone
  const { data: otherUser } = await supabase
    .from('users')
    .select('phone')
    .eq('id', otherUserId)
    .single()

  if (!otherUser?.phone) return { success: false, error: 'رقم غير متوفر' }

  return { success: true, phone: otherUser.phone }
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK 3" && npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git commit -m "feat(chat): add server actions for filtered messaging and price proposals"
```

---

### Task 4: Add Translation Keys

**Files:**
- Modify: `src/lib/i18n/translations.ts`

**Step 1: Add keys after the `chat_negotiation` key (around line 119)**

```typescript
  // Price negotiation
  chat_propose_price: { ar: 'اقترح الثمن', fr: 'Proposer un prix' },
  chat_send_proposal: { ar: 'أرسل العرض', fr: 'Envoyer la proposition' },
  chat_price_placeholder: { ar: 'الثمن بالدرهم', fr: 'Prix en MAD' },
  chat_accept: { ar: 'قبلت', fr: 'Accepter' },
  chat_counter: { ar: 'عرض مضاد', fr: 'Contre-proposition' },
  chat_refuse: { ar: 'رفضت', fr: 'Refuser' },
  chat_proposal_accepted: { ar: 'تم القبول ✓', fr: 'Accepté ✓' },
  chat_proposal_refused: { ar: 'مرفوض', fr: 'Refusé' },
  chat_proposal_pending: { ar: 'في الانتظار...', fr: 'En attente...' },
  chat_commission_label: { ar: 'عمولة Dottruck 4%', fr: 'Commission Dottruck 4%' },
  chat_phone_revealed: { ar: 'الرقم ديالو:', fr: 'Son numéro :' },
  chat_blocked_message: { ar: 'ممنوع مشاركة أرقام أو وسائل تواصل', fr: 'Interdit de partager des numéros ou contacts' },
  chat_use_price_button: { ar: 'استعمل زر الثمن للتفاوض', fr: 'Utilisez le bouton prix pour négocier' },
  chat_deal_confirmed: { ar: 'تم الاتفاق!', fr: 'Accord confirmé !' },
  chat_price_mad: { ar: 'درهم', fr: 'MAD' },
```

**Step 2: Verify TypeScript compiles**

**Step 3: Commit**

```bash
git commit -m "feat(i18n): add price negotiation and anti-bypass translation keys"
```

---

### Task 5: PriceProposalCard Component

**Files:**
- Create: `src/components/PriceProposalCard.tsx`

**Step 1: Create the component**

```tsx
'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { respondToProposal } from '@/app/chat/actions'

interface Proposal {
  id: string
  sender_id: string
  amount_mad: number
  status: string
  created_at: string
}

interface PriceProposalCardProps {
  proposal: Proposal
  currentUserId: string
  onCounterPropose: (amount: number) => void
  onStatusChange: () => void
}

export function PriceProposalCard({
  proposal,
  currentUserId,
  onCounterPropose,
  onStatusChange,
}: PriceProposalCardProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const isMine = proposal.sender_id === currentUserId
  const isPending = proposal.status === 'pending'

  const handleResponse = async (response: 'accepted' | 'refused') => {
    setLoading(true)
    const result = await respondToProposal(proposal.id, response)
    if (result.success) {
      onStatusChange()
    }
    setLoading(false)
  }

  const statusBadge = () => {
    switch (proposal.status) {
      case 'accepted': return <span className="text-xs font-semibold text-success">{t('chat_proposal_accepted')}</span>
      case 'refused': return <span className="text-xs font-semibold text-error">{t('chat_proposal_refused')}</span>
      case 'pending': return <span className="text-xs font-semibold text-warning">{t('chat_proposal_pending')}</span>
      case 'counter': return <span className="text-xs font-semibold text-muted">—</span>
      default: return null
    }
  }

  return (
    <div className={`mx-auto max-w-[85%] rounded-xl border-2 p-4 ${
      proposal.status === 'accepted'
        ? 'border-success/40 bg-green-50'
        : proposal.status === 'refused'
        ? 'border-error/20 bg-red-50/50'
        : 'border-accent/30 bg-accent/5'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted">{isMine ? 'عرضك' : 'عرض'}</span>
        {statusBadge()}
      </div>

      <p className="text-2xl font-bold text-nardo text-center">
        {proposal.amount_mad.toLocaleString()} <span className="text-sm font-normal text-muted">{t('chat_price_mad')}</span>
      </p>

      {proposal.status === 'accepted' && (
        <p className="text-xs text-success text-center mt-2 font-medium">
          {t('chat_commission_label')}: {Math.round(proposal.amount_mad * 0.04).toLocaleString()} {t('chat_price_mad')}
        </p>
      )}

      {/* Action buttons — only for the OTHER party, only if pending */}
      {!isMine && isPending && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => handleResponse('accepted')}
            disabled={loading}
            className="flex-1 min-h-[36px] bg-success text-white text-sm font-semibold rounded-lg transition-colors hover:bg-success/90 disabled:opacity-50 cursor-pointer"
          >
            {t('chat_accept')}
          </button>
          <button
            onClick={() => onCounterPropose(proposal.amount_mad)}
            disabled={loading}
            className="flex-1 min-h-[36px] bg-accent/10 text-accent text-sm font-semibold rounded-lg transition-colors hover:bg-accent/20 disabled:opacity-50 cursor-pointer"
          >
            {t('chat_counter')}
          </button>
          <button
            onClick={() => handleResponse('refused')}
            disabled={loading}
            className="flex-1 min-h-[36px] bg-red-50 text-error text-sm font-semibold rounded-lg transition-colors hover:bg-red-100 disabled:opacity-50 cursor-pointer"
          >
            {t('chat_refuse')}
          </button>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

**Step 3: Commit**

```bash
git commit -m "feat(chat): add PriceProposalCard component"
```

---

### Task 6: PriceInput Component

**Files:**
- Create: `src/components/PriceInput.tsx`

**Step 1: Create the component**

```tsx
'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/context'

interface PriceInputProps {
  onSubmit: (amount: number) => Promise<void>
  disabled?: boolean
  prefillAmount?: number
}

export function PriceInput({ onSubmit, disabled, prefillAmount }: PriceInputProps) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState(prefillAmount?.toString() ?? '')
  const [sending, setSending] = useState(false)
  const [expanded, setExpanded] = useState(!!prefillAmount)

  const handleSubmit = async () => {
    const num = parseInt(amount)
    if (!num || num <= 0) return
    setSending(true)
    await onSubmit(num)
    setAmount('')
    setExpanded(false)
    setSending(false)
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 bg-accent/10 text-accent text-xs font-semibold rounded-lg hover:bg-accent/20 transition-colors cursor-pointer disabled:opacity-50"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
        {t('chat_propose_price')}
      </button>
    )
  }

  return (
    <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-accent">{t('chat_propose_price')}</p>
      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          placeholder={t('chat_price_placeholder')}
          disabled={sending || disabled}
          className="flex-1 border border-border rounded-lg px-3 py-2 text-base text-nardo focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-white min-h-[40px] disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={sending || disabled || !amount || parseInt(amount) <= 0}
          className="px-4 min-h-[40px] bg-accent text-white text-sm font-semibold rounded-lg transition-colors hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
        >
          {sending ? '...' : t('chat_send_proposal')}
        </button>
      </div>
      <button
        onClick={() => { setExpanded(false); setAmount('') }}
        className="text-xs text-muted hover:text-nardo cursor-pointer"
      >
        ✕
      </button>
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

**Step 3: Commit**

```bash
git commit -m "feat(chat): add PriceInput component for price proposals"
```

---

### Task 7: Refactor ChatRoom — Server Action + Proposals

**Files:**
- Modify: `src/components/ChatRoom.tsx`
- Modify: `src/app/chat/[matchingId]/page.tsx`

This is the largest task. The ChatRoom must:
1. Replace direct `.insert()` with `sendMessage()` server action
2. Fetch and display price proposals inline
3. Show PriceInput panel
4. Handle deal confirmation (phone reveal)

**Step 1: Update the chat server component to pass proposals**

In `src/app/chat/[matchingId]/page.tsx`, after fetching the matching and before the return:

```typescript
// Fetch price proposals for this matching
const { data: proposals } = await supabase
  .from('price_proposals')
  .select('*')
  .eq('matching_id', matchingId)
  .order('created_at', { ascending: true })
```

Update the `charge` type cast to include `expediteur_id` (already done in previous task). Pass proposals to ChatRoom:

```typescript
<ChatRoom
  matchingId={matchingId}
  currentUserId={user.id}
  prixTotal={charge.prix_total_mad}
  transporteurName={transporteurName}
  initialProposals={proposals ?? []}
  matchingStatut={matching.statut}
/>
```

**Step 2: Rewrite ChatRoom to use server actions**

The full updated `ChatRoom.tsx` should:
- Import `sendMessage`, `sendProposal` from `@/app/chat/actions`
- Import `PriceProposalCard` and `PriceInput`
- Accept `initialProposals` and `matchingStatut` props
- Replace `sendMessage` function body: call server action instead of direct insert
- On error with `errorType: 'blocked'`, show the error message to user
- Add proposals state, merge proposals with messages by timestamp for display
- Show `PriceInput` above the text input
- When a proposal is accepted and `matchingStatut` becomes 'accepté', show deal confirmation banner

**Key changes to `sendMessage` function in ChatRoom:**

```typescript
const handleSendMessage = async () => {
  const text = newMessage.trim()
  if (!text || sending) return
  setSending(true)
  setSendError(null)
  setNewMessage('')

  const result = await sendMessage(matchingId, text)

  if (!result.success) {
    setSendError(result.error ?? 'خطأ')
    if (result.errorType !== 'blocked') {
      setNewMessage(text) // restore text only if not a content violation
    }
  } else if (result.message) {
    setMessages(prev => [...prev, result.message!])
  }
  setSending(false)
}
```

**Key changes for proposals display — in the messages map, merge proposals by timestamp:**

```typescript
// Combine messages and proposals into a single timeline
type TimelineItem =
  | { type: 'message'; data: Message; timestamp: string }
  | { type: 'proposal'; data: Proposal; timestamp: string }

const timeline: TimelineItem[] = [
  ...messages.map(m => ({ type: 'message' as const, data: m, timestamp: m.created_at })),
  ...proposals.map(p => ({ type: 'proposal' as const, data: p, timestamp: p.created_at })),
].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
```

Then render based on `item.type`:
- `'message'` → existing message bubble
- `'proposal'` → `<PriceProposalCard />`

**Step 3: Update ChatRoomProps interface**

```typescript
interface Proposal {
  id: string
  matching_id: string
  sender_id: string
  amount_mad: number
  status: string
  created_at: string
}

interface ChatRoomProps {
  matchingId: string
  currentUserId: string
  prixTotal: number
  transporteurName?: string
  initialProposals: Proposal[]
  matchingStatut: string
}
```

**Step 4: Verify TypeScript compiles**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK 3" && npx tsc --noEmit 2>&1 | head -20
```

**Step 5: Test in browser**

- Send a normal message → should work
- Send "0612345678" → should be blocked with Arabic error
- Send "whatsapp" → should be blocked
- Send "1500 dh" → should be blocked with "use price button" message
- Use price input to propose → card appears in chat
- Other party accepts → status changes

**Step 6: Commit**

```bash
git commit -m "feat(chat): refactor ChatRoom to use server actions with content filtering and price proposals"
```

---

### Task 8: Phone Reveal After Deal

**Files:**
- Modify: `src/components/ChatRoom.tsx` (or create `src/components/PhoneReveal.tsx`)

**Step 1: Add phone reveal component to ChatRoom**

When `matchingStatut === 'accepté'` (or when proposals state has an accepted proposal), show a banner at the top of the chat:

```tsx
{matchingStatut === 'accepté' && (
  <PhoneRevealBanner matchingId={matchingId} />
)}
```

Create a small `PhoneRevealBanner` component (can be inline in ChatRoom or separate file):

```tsx
function PhoneRevealBanner({ matchingId }: { matchingId: string }) {
  const { t } = useTranslation()
  const [phone, setPhone] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleReveal = async () => {
    setLoading(true)
    const result = await revealPhone(matchingId)
    if (result.success && result.phone) {
      setPhone(result.phone)
    }
    setLoading(false)
  }

  return (
    <div className="bg-green-50 border-b border-success/20 px-4 py-3 text-center">
      <p className="text-sm font-semibold text-success">{t('chat_deal_confirmed')}</p>
      {phone ? (
        <p className="text-base font-bold text-nardo mt-1" dir="ltr">{phone}</p>
      ) : (
        <button
          onClick={handleReveal}
          disabled={loading}
          className="mt-1 px-4 py-1.5 bg-success text-white text-sm font-semibold rounded-lg cursor-pointer disabled:opacity-50"
        >
          {loading ? '...' : t('chat_phone_revealed')}
        </button>
      )}
    </div>
  )
}
```

**Step 2: Import `revealPhone` from actions**

**Step 3: Verify TypeScript compiles**

**Step 4: Test**

- With matching not accepted: no banner shown
- Accept a proposal → banner appears
- Click reveal → phone number displayed

**Step 5: Commit**

```bash
git commit -m "feat(chat): add phone reveal banner after deal confirmation"
```

---

### Task 9: Final Build Check + Voice Message Filter

**Files:**
- Modify: `src/components/ChatRoom.tsx` — update `sendVoiceMessage` to use server action

**Step 1: Update voice message sending**

Replace the direct Supabase insert in `sendVoiceMessage` with the server action:

```typescript
const sendVoiceMessage = async (blob: Blob) => {
  setSending(true)
  setSendError(null)
  const filename = `${matchingId}/${Date.now()}.webm`
  const { error: uploadError } = await supabase.storage
    .from('voice-messages')
    .upload(filename, blob, { contentType: 'audio/webm' })

  if (uploadError) {
    setSendError(uploadError.message)
    setSending(false)
    return
  }

  const publicUrl = supabase.storage
    .from('voice-messages')
    .getPublicUrl(filename).data.publicUrl

  const result = await sendMessage(matchingId, '🎤', publicUrl)
  if (!result.success) {
    setSendError(result.error ?? 'خطأ')
  } else if (result.message) {
    setMessages(prev => [...prev, result.message!])
  }
  setSending(false)
}
```

**Step 2: Run full build**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK 3" && npm run build 2>&1 | tail -30
```

**Step 3: Fix any build errors**

**Step 4: Commit**

```bash
git commit -m "feat(chat): route voice messages through server action"
```

---

## Done

All features implemented:
1. `feat(db): add price_proposals table and prix_final column`
2. `feat: add content filter library for anti-bypass protection`
3. `feat(chat): add server actions for filtered messaging and price proposals`
4. `feat(i18n): add price negotiation and anti-bypass translation keys`
5. `feat(chat): add PriceProposalCard component`
6. `feat(chat): add PriceInput component for price proposals`
7. `feat(chat): refactor ChatRoom to use server actions with content filtering and price proposals`
8. `feat(chat): add phone reveal banner after deal confirmation`
9. `feat(chat): route voice messages through server action`

**User must manually run in Supabase SQL Editor:**
- `supabase/migrations/add-negotiation.sql`
