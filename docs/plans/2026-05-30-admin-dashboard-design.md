# Admin Dashboard Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Full admin dashboard for Dottruck with stats, charts, map, transporteur verification, transaction management, and user management.

**Architecture:** Pages separees under `/admin/*` with shared layout + horizontal tabs. Server Components fetch data, Client Components render charts/map. Leaflet for map, Recharts for charts.

---

## Decisions

- **Auth:** Separate `/admin/login` page, verifies `role = 'admin'`
- **Commission:** 4% of `prix_final` on accepted/completed matchings
- **Ban:** Block login + notification with reason
- **Map:** City-based markers (hardcoded coords), GPS phase 2
- **Architecture:** Separate pages with shared layout (Approach B)

---

## Routes

```
/admin/login          → Separate admin login (email + password)
/admin                → Redirect to /admin/stats
/admin/stats          → Global stats + charts + map
/admin/transporteurs  → Verification management (migrated from /admin/verify)
/admin/transactions   → Matchings list + payment tracking
/admin/users          → User list + ban/unban
/admin/layout.tsx     → Shared layout: header + horizontal tabs
```

---

## DB Migration

```sql
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS banned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason text;

ALTER TABLE public.matchings
  ADD COLUMN IF NOT EXISTS paid boolean DEFAULT false;
```

---

## Section 1: Auth & Layout

### Admin Login (`/admin/login`)
- Minimal UI: email + password fields
- Server action `adminSignIn`: authenticates then checks `users.role = 'admin'`
- If not admin → error "Acces refuse"
- Success → redirect `/admin/stats`

### Layout (`/admin/layout.tsx`)
- Checks auth + admin role (redirect to `/admin/login` if not)
- TopHeader with "Dottruck Admin"
- Horizontal tabs: Stats | Transporteurs | Transactions | Users
- Active tab highlighted

### Ban enforcement
- In standard login flow (`signIn` action): check `banned = true` → return error with `ban_reason`
- In admin login: same check

---

## Section 2: Stats Page (`/admin/stats`)

### Stat Cards (top row, 2x2 grid mobile)
1. **Transactions ce mois**: COUNT matchings where statut IN ('accepte','complete') AND created_at this month
2. **Revenue commissions**: SUM(prix_final * 0.04) on accepted/completed matchings
3. **Transporteurs actifs**: COUNT transporteur_profiles where verification_status = 'verified'
4. **Villes actives**: COUNT(DISTINCT ville) from users

### Charts (Recharts)
1. **Line chart**: Commission revenue per week (last 4 weeks) or month (last 6 months). Toggle button.
2. **Bar chart**: Transaction count per city (ville_depart from charges)
3. **Pie chart**: Distribution by vehicle_type from transporteur_profiles

Data fetched server-side, passed as props to client chart components.

### Map (Leaflet)
- Morocco-centered, appropriate zoom
- Hardcoded coordinates for 8 cities: Safi, Casablanca, Marrakech, Agadir, Rabat, Tanger, Fes, Meknes
- Circle markers sized by transporteur count per city
- Click marker → popup with transporteur list
- City filter dropdown above map
- Phase 2: add lat/lng columns to users for GPS tracking

---

## Section 3: Transporteurs (`/admin/transporteurs`)

Migrated from existing `/admin/verify`.

### Tabs
- En attente (pending)
- Verifies (verified)
- Rejetes (rejected) — NEW tab

### Each card
- Avatar, name, city, vehicle type
- Expandable: documents (carte grise, autorisation, photo vehicule)
- Validate / Reject buttons (reject requires reason textarea)
- Auto notification on decision (already implemented in `verifyTransporteur`)

---

## Section 4: Transactions (`/admin/transactions`)

### List
- Mobile cards (not table)
- Each card: route (depart → arrivee), transporteur name, prix_final, commission (4%), status badge, date
- Filters: status (all/accepted/completed/in-progress), city

### Status mapping
- propose/en_negociation → "En cours" (amber badge)
- accepte → "Confirme" (blue badge)
- complete → "Complete" (green badge)
- refuse → "Refuse" (red badge)

### Actions
- "Marquer comme paye" button on completed transactions → sets `paid = true`
- "Voir le chat" link → `/chat/[matchingId]`

---

## Section 5: Users (`/admin/users`)

### List
- All users (transporteurs + expediteurs)
- Search by name
- Filter by role, city
- Each row: avatar, name, email, city, role, signup date, status (active/banned)

### Actions
- **Ban**: modal with required reason → sets `banned = true`, `ban_reason`, inserts notification
- **Unban**: simple button → sets `banned = false`, clears `ban_reason`
- **View history**: expandable section showing user's charges/matchings

---

## Dependencies to Install

```bash
npm install recharts leaflet react-leaflet @types/leaflet
```

---

## Files to Create/Modify

### New files:
- `src/app/admin/login/page.tsx` — Admin login page
- `src/app/admin/layout.tsx` — Shared admin layout with tabs
- `src/app/admin/page.tsx` — Redirect to /admin/stats
- `src/app/admin/stats/page.tsx` — Stats server component
- `src/app/admin/transporteurs/page.tsx` — Transporteur verification
- `src/app/admin/transactions/page.tsx` — Transaction list
- `src/app/admin/users/page.tsx` — User management
- `src/components/admin/AdminLayout.tsx` — Client layout with tabs
- `src/components/admin/StatsCards.tsx` — Stat cards
- `src/components/admin/RevenueChart.tsx` — Line chart
- `src/components/admin/CityTransactionsChart.tsx` — Bar chart
- `src/components/admin/VehicleTypeChart.tsx` — Pie chart
- `src/components/admin/TransporteurMap.tsx` — Leaflet map
- `src/components/admin/TransactionCard.tsx` — Transaction card
- `src/components/admin/UserCard.tsx` — User card with ban/unban
- `src/app/admin/actions.ts` — Admin server actions (ban, unban, mark paid, admin signin)
- `supabase/migrations/add-admin-dashboard.sql` — DB migration

### Modified files:
- `src/app/auth/actions.ts` — Add banned check to signIn
- `src/lib/i18n/translations.ts` — Admin translation keys
- `src/app/admin/verify/page.tsx` — Remove (migrated)
- `src/components/AdminVerifyContent.tsx` — Move to admin/ subfolder

---

## Translation Keys Needed

Admin section (Arabic/French):
- admin_title, admin_stats, admin_transporteurs, admin_transactions, admin_users
- admin_login_title, admin_email, admin_password, admin_login_btn, admin_access_denied
- stats_transactions_month, stats_revenue, stats_active_transporteurs, stats_active_cities
- stats_weekly, stats_monthly, stats_by_city, stats_by_vehicle
- trans_all, trans_in_progress, trans_confirmed, trans_completed, trans_refused
- trans_mark_paid, trans_paid, trans_view_chat, trans_commission
- users_search, users_ban, users_unban, users_banned, users_active, users_ban_reason, users_history
- map_filter_city, map_all_cities, map_transporteurs_count
