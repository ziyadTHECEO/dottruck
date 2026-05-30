# Anti-Bypass & Price Negotiation System Design

Date: 2026-05-30

## Goal

Prevent users from exchanging contact information outside the app and implement a structured price negotiation system that ensures Dottruck collects its 4% commission on every deal.

## Architecture

Two interconnected systems:
1. **Content filtering** via Server Action (replaces direct client→Supabase message inserts)
2. **Structured price negotiation** via dedicated `price_proposals` table and UI components

Phone numbers are revealed only when both parties agree on a price (matching.statut = 'accepte').

---

## 1. Message Filtering (Server Action)

**Current state:** Messages go directly from ChatRoom client component to Supabase via `.insert()`. No server-side validation exists.

**New state:** A Server Action `sendMessage` in `src/app/chat/actions.ts` validates content before inserting.

### Detection Patterns

| Category | Patterns Blocked |
|----------|-----------------|
| Phone numbers | `0[67]\d{8}`, `\+212[67]\d{8}`, `00212[67]\d{8}`, spaced variants `0 6 \d{2}...` |
| Phone text variants | "zero six", "zero sept", "sifr", "صفر ستة", "صفر سبعة" |
| Emails | anything matching `\S+@\S+\.\S+` |
| Social media | whatsapp, insta, instagram, facebook, fb, telegram, signal, viber, snapchat |
| Amounts in text | `\d{3,}\s*(dh\|mad\|درهم\|dirham)` — forces use of price proposal component |

### Behavior

- Message is **rejected** (not inserted) if any pattern matches
- Client receives error: "ممنوع مشاركة أرقام أو وسائل تواصل. استعمل زر الثمن للتفاوض"
- No content replacement — full block

### Voice Messages

- Voice messages (audio_url) are allowed without text filtering for v1
- Future: transcription-based filtering (not in scope)

---

## 2. Phone Number Masking

- The `phone` column is NEVER returned to the client in any `.select()` query
- Profile displays show: `+212 6•• ••• ••••` (masked format)
- A server-side endpoint reveals the full number ONLY when `matching.statut = 'accepte'`
- Implementation: Server Action `revealPhone(matchingId)` that:
  1. Verifies user is participant of this matching
  2. Verifies matching.statut = 'accepte'
  3. Returns the other party's phone number

---

## 3. Price Negotiation System

### Database

**New table: `price_proposals`**
```sql
create table public.price_proposals (
  id uuid primary key default uuid_generate_v4(),
  matching_id uuid references matchings(id) on delete cascade,
  sender_id uuid references users(id),
  amount_mad int not null check (amount_mad > 0),
  status text check (status in ('pending', 'accepted', 'refused', 'counter')) default 'pending',
  created_at timestamptz default now()
);
```

**New column on matchings:**
```sql
ALTER TABLE public.matchings ADD COLUMN IF NOT EXISTS prix_final INT;
```

### UI Components

**PriceInput** — Below the chat input area:
- Collapsible panel with "اقترح الثمن" toggle
- Numeric-only input field (MAD)
- "أرسل العرض" button
- Sends via Server Action `sendProposal(matchingId, amount)`

**PriceProposalCard** — Displayed inline in chat feed:
- Shows amount in a visually distinct card (green border, price in bold)
- Shows sender name and timestamp
- For the OTHER party, shows 3 action buttons:
  - ✅ قبلت (Accept)
  - 💬 عرض مضاد (Counter-propose)
  - ❌ رفضت (Refuse)
- For the sender, shows status badge (pending/accepted/refused)

### Flow

1. User A sends proposal (1500 MAD) → inserted in `price_proposals` as 'pending'
2. User B sees the card with action buttons
3. If User B accepts:
   - Proposal status → 'accepted'
   - `matchings.prix_final` = 1500
   - `matchings.statut` = 'accepte'
   - Both parties' phone numbers are revealed
   - Commission displayed: 1500 × 4% = 60 MAD
4. If User B counter-proposes:
   - Original proposal status → 'counter'
   - New proposal created with User B's amount
5. If User B refuses:
   - Proposal status → 'refused'
   - Negotiation continues

### Server Actions

```typescript
// src/app/chat/actions.ts
sendMessage(matchingId, content) → filters content, inserts if clean
sendProposal(matchingId, amount) → creates price_proposal
respondToProposal(proposalId, response: 'accepted'|'refused'|'counter', counterAmount?) → updates status
revealPhone(matchingId) → returns phone if matching is accepted
```

---

## 4. Anti-Bypass Strategy Summary

| Vector | Protection | Bypass Difficulty |
|--------|-----------|-------------------|
| Phone in text | Server-side regex rejection | Hard (server enforced) |
| Phone in voice | Not filtered v1 | Easy (accepted risk) |
| Email | Server-side regex rejection | Hard |
| Social media handles | Keyword detection | Medium (creative spelling) |
| Amounts in text | Pattern detection + "use price button" message | Hard |
| Spaced numbers | Regex normalizes whitespace before check | Hard |
| Number in description field | Only expediteur sees descriptions, not critical | Low risk |

---

## 5. Files Affected

| File | Action |
|------|--------|
| `src/app/chat/actions.ts` | CREATE — Server Actions for sendMessage, sendProposal, respondToProposal, revealPhone |
| `src/lib/filters/content-filter.ts` | CREATE — Regex patterns and detection logic |
| `src/components/ChatRoom.tsx` | MODIFY — Replace direct insert with Server Action calls, add proposals display |
| `src/components/PriceInput.tsx` | CREATE — Numeric input + send proposal button |
| `src/components/PriceProposalCard.tsx` | CREATE — Visual card with accept/counter/refuse |
| `src/lib/i18n/translations.ts` | MODIFY — Add ~15 translation keys |
| `supabase/migrations/add-negotiation.sql` | CREATE — prix_final column + price_proposals table + RLS |
| `src/app/chat/[matchingId]/page.tsx` | MODIFY — Fetch proposals, pass to ChatRoom |

---

## 6. Translation Keys Needed

- `chat_propose_price` — اقترح الثمن
- `chat_send_proposal` — أرسل العرض
- `chat_price_placeholder` — الثمن بالدرهم
- `chat_accept` — قبلت
- `chat_counter` — عرض مضاد
- `chat_refuse` — رفضت
- `chat_proposal_accepted` — تم القبول
- `chat_proposal_refused` — مرفوض
- `chat_proposal_pending` — في الانتظار
- `chat_commission_label` — عمولة Dottruck
- `chat_phone_revealed` — الرقم ديالو
- `chat_blocked_message` — ممنوع مشاركة أرقام أو وسائل تواصل
- `chat_use_price_button` — استعمل زر الثمن للتفاوض
- `chat_deal_confirmed` — تم الاتفاق
