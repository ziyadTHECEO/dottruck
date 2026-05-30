# Admin Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full admin dashboard for Dottruck with stats/charts/map, transporteur verification, transaction management, and user management.

**Architecture:** Separate pages under `/admin/*` with a shared layout (`layout.tsx`) providing horizontal tab navigation. Server Components fetch Supabase data, Client Components render Recharts charts and Leaflet map. Admin auth via dedicated `/admin/login` page.

**Tech Stack:** Next.js 16 App Router, Supabase, Tailwind v4, Recharts (charts), Leaflet + react-leaflet (map)

---

### Task 1: DB Migration + Install Dependencies

**Files:**
- Create: `supabase/migrations/add-admin-dashboard.sql`

**Step 1: Create the migration file**

```sql
-- Ban system for users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS banned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason text;

-- Payment tracking for matchings
ALTER TABLE public.matchings
  ADD COLUMN IF NOT EXISTS paid boolean DEFAULT false;
```

**Step 2: Install charting and map dependencies**

Run:
```bash
npm install recharts leaflet react-leaflet @types/leaflet
```

**Step 3: Commit**

```bash
git add supabase/migrations/add-admin-dashboard.sql package.json package-lock.json
git commit -m "feat(admin): add migration + install recharts & leaflet"
```

---

### Task 2: Admin Server Actions

**Files:**
- Create: `src/app/admin/actions.ts`
- Modify: `src/app/auth/actions.ts`

**Step 1: Create admin server actions**

Create `src/app/admin/actions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function adminSignIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return redirect(`/admin/login?error=${encodeURIComponent(error.message)}`)
  }

  // Check admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/admin/login?error=Auth%20failed')

  const { data: profile } = await supabase
    .from('users')
    .select('role, banned, ban_reason')
    .eq('id', user.id)
    .single()

  if (profile?.banned) {
    await supabase.auth.signOut()
    return redirect(`/admin/login?error=${encodeURIComponent('Compte suspendu: ' + (profile.ban_reason ?? ''))}`)
  }

  if (profile?.role !== 'admin') {
    await supabase.auth.signOut()
    return redirect('/admin/login?error=Acc%C3%A8s%20refus%C3%A9')
  }

  return redirect('/admin/stats')
}

export async function banUser(
  userId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Verify admin
  const { data: admin } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (admin?.role !== 'admin') return { success: false, error: 'Not authorized' }

  const { error } = await supabase
    .from('users')
    .update({ banned: true, ban_reason: reason })
    .eq('id', userId)

  if (error) return { success: false, error: error.message }

  // Send notification
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'account_banned',
    title: 'حساب موقوف',
    message: `تم إيقاف حسابك. السبب: ${reason}`,
  })

  return { success: true }
}

export async function unbanUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: admin } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (admin?.role !== 'admin') return { success: false, error: 'Not authorized' }

  const { error } = await supabase
    .from('users')
    .update({ banned: false, ban_reason: null })
    .eq('id', userId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function markAsPaid(
  matchingId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: admin } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (admin?.role !== 'admin') return { success: false, error: 'Not authorized' }

  const { error } = await supabase
    .from('matchings')
    .update({ paid: true })
    .eq('id', matchingId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
```

**Step 2: Add banned check to standard signIn**

In `src/app/auth/actions.ts`, modify the `signIn` function. After the `signInWithPassword` call succeeds and before the redirect, add a banned check:

```typescript
export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
  }

  // Check if user is banned
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('banned, ban_reason')
      .eq('id', user.id)
      .single()

    if (profile?.banned) {
      await supabase.auth.signOut()
      return redirect(`/auth/login?error=${encodeURIComponent('حساب موقوف: ' + (profile.ban_reason ?? ''))}`)
    }
  }

  return redirect('/dashboard')
}
```

**Step 3: Commit**

```bash
git add src/app/admin/actions.ts src/app/auth/actions.ts
git commit -m "feat(admin): add admin server actions + ban enforcement"
```

---

### Task 3: Translation Keys

**Files:**
- Modify: `src/lib/i18n/translations.ts`

**Step 1: Add admin translation keys**

Add these entries to the translations object before the closing `} as const`:

```typescript
  // ===== ADMIN DASHBOARD =====
  admin_title: { ar: 'لوحة التحكم', fr: 'Tableau de bord' },
  admin_stats: { ar: 'الإحصائيات', fr: 'Statistiques' },
  admin_transporteurs: { ar: 'الناقلين', fr: 'Transporteurs' },
  admin_transactions: { ar: 'المعاملات', fr: 'Transactions' },
  admin_users: { ar: 'المستخدمين', fr: 'Utilisateurs' },
  admin_login_title: { ar: 'دخول الإدارة', fr: 'Connexion admin' },
  admin_login_btn: { ar: 'دخل', fr: 'Se connecter' },
  admin_access_denied: { ar: 'ممنوع الدخول', fr: 'Accès refusé' },

  // Stats
  stats_transactions_month: { ar: 'معاملات هاد الشهر', fr: 'Transactions ce mois' },
  stats_revenue: { ar: 'العمولات', fr: 'Commissions' },
  stats_active_transporteurs: { ar: 'ناقلين نشطين', fr: 'Transporteurs actifs' },
  stats_active_cities: { ar: 'مدن نشطة', fr: 'Villes actives' },
  stats_weekly: { ar: 'أسبوعي', fr: 'Hebdo' },
  stats_monthly: { ar: 'شهري', fr: 'Mensuel' },
  stats_by_city: { ar: 'حسب المدينة', fr: 'Par ville' },
  stats_by_vehicle: { ar: 'حسب الشاحنة', fr: 'Par véhicule' },

  // Transactions
  trans_all: { ar: 'الكل', fr: 'Tous' },
  trans_in_progress: { ar: 'جاري', fr: 'En cours' },
  trans_confirmed: { ar: 'مؤكد', fr: 'Confirmé' },
  trans_completed: { ar: 'مكمول', fr: 'Complété' },
  trans_refused: { ar: 'مرفوض', fr: 'Refusé' },
  trans_mark_paid: { ar: 'خلّص', fr: 'Marquer payé' },
  trans_paid: { ar: 'مخلّص', fr: 'Payé' },
  trans_view_chat: { ar: 'شوف الشات', fr: 'Voir le chat' },
  trans_commission: { ar: 'العمولة', fr: 'Commission' },

  // Users
  users_search: { ar: 'قلّب على مستخدم...', fr: 'Rechercher un utilisateur...' },
  users_ban: { ar: 'وقف الحساب', fr: 'Bannir' },
  users_unban: { ar: 'فعّل الحساب', fr: 'Débannir' },
  users_banned: { ar: 'موقوف', fr: 'Banni' },
  users_active: { ar: 'نشط', fr: 'Actif' },
  users_ban_reason: { ar: 'سبب الإيقاف...', fr: 'Raison du bannissement...' },
  users_history: { ar: 'السجل', fr: 'Historique' },

  // Map
  map_filter_city: { ar: 'فلتر المدينة', fr: 'Filtrer par ville' },
  map_all_cities: { ar: 'كل المدن', fr: 'Toutes les villes' },
  map_transporteurs_count: { ar: 'ناقل', fr: 'transporteur(s)' },

  // Transporteur tabs
  admin_pending: { ar: 'في الانتظار', fr: 'En attente' },
  admin_verified: { ar: 'متحققين', fr: 'Vérifiés' },
  admin_rejected: { ar: 'مرفوضين', fr: 'Rejetés' },
```

**Step 2: Commit**

```bash
git add src/lib/i18n/translations.ts
git commit -m "feat(admin): add admin dashboard translation keys"
```

---

### Task 4: Admin Login Page + Layout + Redirect

**Files:**
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin/AdminTabs.tsx`

**Step 1: Create admin login page**

Create `src/app/admin/login/page.tsx`:

```tsx
import { adminSignIn } from '@/app/admin/actions'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-border p-6 w-full max-w-sm">
        <h1 className="text-xl font-bold text-nardo text-center mb-1">Dottruck Admin</h1>
        <p className="text-sm text-muted text-center mb-6">لوحة التحكم</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-error rounded-xl p-3 text-sm mb-4 text-center">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={adminSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-nardo mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent"
              placeholder="admin@dottruck.ma"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-nardo mb-1">Mot de passe</label>
            <input
              name="password"
              type="password"
              required
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="w-full min-h-[48px] bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-colors text-sm cursor-pointer"
          >
            دخل
          </button>
        </form>
      </div>
    </div>
  )
}
```

**Step 2: Create admin layout with auth check + tabs**

Create `src/components/admin/AdminTabs.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin/stats', label: 'الإحصائيات', icon: 'stats' },
  { href: '/admin/transporteurs', label: 'الناقلين', icon: 'truck' },
  { href: '/admin/transactions', label: 'المعاملات', icon: 'money' },
  { href: '/admin/users', label: 'المستخدمين', icon: 'users' },
]

function TabIcon({ type, active }: { type: string; active: boolean }) {
  const color = active ? 'currentColor' : '#9CA3AF'
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (type) {
    case 'stats': return <svg {...props}><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
    case 'truck': return <svg {...props}><rect x="1" y="3" width="15" height="13" rx="2" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
    case 'money': return <svg {...props}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
    case 'users': return <svg {...props}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
    default: return null
  }
}

export default function AdminTabs() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-border">
      <div className="flex max-w-4xl mx-auto">
        {TABS.map(tab => {
          const active = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                active ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-nardo'
              }`}
            >
              <TabIcon type={tab.icon} active={active} />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

Create `src/app/admin/layout.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminTabs from '@/components/admin/AdminTabs'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/admin/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return redirect('/admin/login')

  return (
    <div className="min-h-screen bg-surface flex flex-col" dir="rtl">
      <header className="bg-white border-b border-border px-4 h-14 flex items-center justify-center sticky top-0 z-20">
        <h1 className="text-base font-bold text-nardo">Dottruck Admin</h1>
      </header>
      <AdminTabs />
      <main className="flex-1 pb-8 max-w-4xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
```

Create `src/app/admin/page.tsx`:

```tsx
import { redirect } from 'next/navigation'

export default function AdminPage() {
  return redirect('/admin/stats')
}
```

**Step 3: Remove old /admin/verify (will be replaced by /admin/transporteurs)**

Delete `src/app/admin/verify/page.tsx` (the functionality moves to `/admin/transporteurs` in Task 6).

**Step 4: Commit**

```bash
git add src/app/admin/login/page.tsx src/app/admin/layout.tsx src/app/admin/page.tsx src/components/admin/AdminTabs.tsx
git rm src/app/admin/verify/page.tsx
git commit -m "feat(admin): add login page, layout with tabs, redirect"
```

---

### Task 5: Stats Page with Cards + Charts

**Files:**
- Create: `src/app/admin/stats/page.tsx`
- Create: `src/components/admin/StatsCards.tsx`
- Create: `src/components/admin/RevenueChart.tsx`
- Create: `src/components/admin/CityTransactionsChart.tsx`
- Create: `src/components/admin/VehicleTypeChart.tsx`

**Step 1: Create stat cards component**

Create `src/components/admin/StatsCards.tsx`:

```tsx
interface StatCard {
  label: string
  value: string | number
  color: string
}

export default function StatsCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-white rounded-xl border border-border p-4">
          <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
          <p className="text-xs text-muted mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Create revenue line chart**

Create `src/components/admin/RevenueChart.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DataPoint {
  label: string
  value: number
}

interface Props {
  weeklyData: DataPoint[]
  monthlyData: DataPoint[]
}

export default function RevenueChart({ weeklyData, monthlyData }: Props) {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly')
  const data = view === 'weekly' ? weeklyData : monthlyData

  return (
    <div className="bg-white rounded-xl border border-border p-4 mx-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-nardo">العمولات</p>
        <div className="flex gap-1">
          <button
            onClick={() => setView('weekly')}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
              view === 'weekly' ? 'bg-accent text-white' : 'text-muted bg-surface'
            }`}
          >
            أسبوعي
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
              view === 'monthly' ? 'bg-accent text-white' : 'text-muted bg-surface'
            }`}
          >
            شهري
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => [`${v} MAD`, 'العمولة']} />
          <Line type="monotone" dataKey="value" stroke="#1D4ED8" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

**Step 3: Create city bar chart**

Create `src/components/admin/CityTransactionsChart.tsx`:

```tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DataPoint {
  city: string
  count: number
}

export default function CityTransactionsChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 mx-4">
      <p className="text-sm font-semibold text-nardo mb-4">المعاملات حسب المدينة</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="city" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

**Step 4: Create vehicle type pie chart**

Create `src/components/admin/VehicleTypeChart.tsx`:

```tsx
'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'

interface DataPoint {
  name: string
  value: number
}

const COLORS = ['#1D4ED8', '#059669', '#D97706', '#DC2626', '#7C3AED']

export default function VehicleTypeChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 mx-4">
      <p className="text-sm font-semibold text-nardo mb-4">أنواع الشاحنات</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

**Step 5: Create stats server page**

Create `src/app/admin/stats/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import StatsCards from '@/components/admin/StatsCards'
import RevenueChart from '@/components/admin/RevenueChart'
import CityTransactionsChart from '@/components/admin/CityTransactionsChart'
import VehicleTypeChart from '@/components/admin/VehicleTypeChart'

const VEHICLE_LABELS: Record<string, string> = {
  camion_seul: 'كاميون',
  plateau_barres: 'بلاطو بالبار',
  plateau: 'بلاطو',
  frigorifique: 'فريكو',
  benne: 'بين',
}

export default async function AdminStatsPage() {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Stat 1: Transactions this month
  const { count: transactionsThisMonth } = await supabase
    .from('matchings')
    .select('*', { count: 'exact', head: true })
    .in('statut', ['accepté', 'completé'])
    .gte('created_at', startOfMonth)

  // Stat 2: Total commission revenue
  const { data: acceptedMatchings } = await supabase
    .from('matchings')
    .select('prix_final')
    .in('statut', ['accepté', 'completé'])
    .not('prix_final', 'is', null)

  const totalRevenue = (acceptedMatchings ?? []).reduce(
    (sum, m) => sum + Math.round((m.prix_final ?? 0) * 0.04),
    0
  )

  // Stat 3: Active transporteurs
  const { count: activeTransporteurs } = await supabase
    .from('transporteur_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'verified')

  // Stat 4: Active cities
  const { data: cityData } = await supabase
    .from('users')
    .select('ville')
    .not('ville', 'is', null)

  const activeCities = new Set((cityData ?? []).map(u => u.ville)).size

  // Revenue chart data — weekly (last 4 weeks)
  const weeklyData = []
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (i + 1) * 7)
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() - i * 7)

    const { data: weekMatchings } = await supabase
      .from('matchings')
      .select('prix_final')
      .in('statut', ['accepté', 'completé'])
      .not('prix_final', 'is', null)
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString())

    const weekRevenue = (weekMatchings ?? []).reduce(
      (sum, m) => sum + Math.round((m.prix_final ?? 0) * 0.04),
      0
    )
    weeklyData.push({ label: `S-${i}`, value: weekRevenue })
  }

  // Revenue chart data — monthly (last 6 months)
  const monthlyData = []
  const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر']
  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

    const { data: monthMatchings } = await supabase
      .from('matchings')
      .select('prix_final')
      .in('statut', ['accepté', 'completé'])
      .not('prix_final', 'is', null)
      .gte('created_at', mStart.toISOString())
      .lt('created_at', mEnd.toISOString())

    const monthRevenue = (monthMatchings ?? []).reduce(
      (sum, m) => sum + Math.round((m.prix_final ?? 0) * 0.04),
      0
    )
    monthlyData.push({ label: MONTH_NAMES[mStart.getMonth()], value: monthRevenue })
  }

  // City transactions chart
  const { data: chargesWithCity } = await supabase
    .from('charges')
    .select('ville_depart, matchings(id)')
    .not('ville_depart', 'is', null)

  const cityCountMap: Record<string, number> = {}
  for (const c of chargesWithCity ?? []) {
    const city = c.ville_depart ?? 'Autre'
    const matchCount = Array.isArray(c.matchings) ? c.matchings.length : 0
    cityCountMap[city] = (cityCountMap[city] ?? 0) + matchCount
  }
  const cityChartData = Object.entries(cityCountMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Vehicle type pie chart
  const { data: vehicleTypes } = await supabase
    .from('transporteur_profiles')
    .select('vehicle_type')
    .eq('verification_status', 'verified')
    .not('vehicle_type', 'is', null)

  const vehicleCountMap: Record<string, number> = {}
  for (const v of vehicleTypes ?? []) {
    const vt = v.vehicle_type ?? 'unknown'
    vehicleCountMap[vt] = (vehicleCountMap[vt] ?? 0) + 1
  }
  const vehicleChartData = Object.entries(vehicleCountMap).map(([key, value]) => ({
    name: VEHICLE_LABELS[key] ?? key,
    value,
  }))

  const statCards = [
    { label: 'معاملات هاد الشهر', value: transactionsThisMonth ?? 0, color: '#1D4ED8' },
    { label: 'العمولات (MAD)', value: `${totalRevenue}`, color: '#059669' },
    { label: 'ناقلين نشطين', value: activeTransporteurs ?? 0, color: '#D97706' },
    { label: 'مدن نشطة', value: activeCities, color: '#7C3AED' },
  ]

  return (
    <div className="space-y-4 pb-8">
      <StatsCards cards={statCards} />
      <RevenueChart weeklyData={weeklyData} monthlyData={monthlyData} />
      <CityTransactionsChart data={cityChartData} />
      <VehicleTypeChart data={vehicleChartData} />
    </div>
  )
}
```

**Step 6: Commit**

```bash
git add src/app/admin/stats/page.tsx src/components/admin/StatsCards.tsx src/components/admin/RevenueChart.tsx src/components/admin/CityTransactionsChart.tsx src/components/admin/VehicleTypeChart.tsx
git commit -m "feat(admin): add stats page with cards + recharts"
```

---

### Task 6: Transporteur Map (Leaflet)

**Files:**
- Create: `src/components/admin/TransporteurMap.tsx`
- Modify: `src/app/admin/stats/page.tsx` (add map data + import)

**Step 1: Create the map component**

Create `src/components/admin/TransporteurMap.tsx`:

```tsx
'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'

// Leaflet must be imported dynamically (no SSR)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })

const CITY_COORDS: Record<string, [number, number]> = {
  'آسفي': [32.2994, -9.2372],
  'Safi': [32.2994, -9.2372],
  'الدار البيضاء': [33.5731, -7.5898],
  'Casablanca': [33.5731, -7.5898],
  'مراكش': [31.6295, -7.9811],
  'Marrakech': [31.6295, -7.9811],
  'أكادير': [30.4278, -9.5981],
  'Agadir': [30.4278, -9.5981],
  'الرباط': [34.0209, -6.8416],
  'Rabat': [34.0209, -6.8416],
  'طنجة': [35.7595, -5.8340],
  'Tanger': [35.7595, -5.8340],
  'فاس': [34.0331, -5.0003],
  'Fès': [34.0331, -5.0003],
  'Fes': [34.0331, -5.0003],
  'مكناس': [33.8935, -5.5473],
  'Meknès': [33.8935, -5.5473],
  'Meknes': [33.8935, -5.5473],
}

interface CityData {
  city: string
  count: number
  transporteurs: { nom: string; vehicle_type: string | null }[]
}

interface Props {
  cityData: CityData[]
}

export default function TransporteurMap({ cityData }: Props) {
  const [filterCity, setFilterCity] = useState<string>('all')
  const [mounted, setMounted] = useState(false)

  const filteredData = useMemo(() => {
    if (filterCity === 'all') return cityData
    return cityData.filter(c => c.city === filterCity)
  }, [cityData, filterCity])

  // Import leaflet CSS on mount
  if (typeof window !== 'undefined' && !mounted) {
    import('leaflet/dist/leaflet.css')
    setMounted(true)
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4 mx-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-nardo">خريطة الناقلين</p>
        <select
          value={filterCity}
          onChange={e => setFilterCity(e.target.value)}
          className="border border-border rounded-lg px-2 py-1 text-xs text-nardo"
        >
          <option value="all">كل المدن</option>
          {cityData.map(c => (
            <option key={c.city} value={c.city}>{c.city}</option>
          ))}
        </select>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ height: 300 }}>
        {typeof window !== 'undefined' && (
          <MapContainer
            center={[32.0, -6.8]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredData.map(city => {
              const coords = CITY_COORDS[city.city]
              if (!coords) return null
              return (
                <CircleMarker
                  key={city.city}
                  center={coords}
                  radius={Math.min(8 + city.count * 3, 25)}
                  pathOptions={{ color: '#1D4ED8', fillColor: '#1D4ED8', fillOpacity: 0.6 }}
                >
                  <Popup>
                    <div className="text-xs" dir="rtl">
                      <p className="font-bold">{city.city} — {city.count} ناقل</p>
                      <ul className="mt-1 space-y-0.5">
                        {city.transporteurs.slice(0, 5).map((t, i) => (
                          <li key={i}>{t.nom}</li>
                        ))}
                        {city.count > 5 && <li className="text-muted">+{city.count - 5} آخرين</li>}
                      </ul>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Add map data to stats page**

In `src/app/admin/stats/page.tsx`, add the following import at the top:

```tsx
import TransporteurMap from '@/components/admin/TransporteurMap'
```

Before the `return` statement, add the map data query:

```tsx
  // Map data: transporteurs grouped by city
  const { data: transporteursWithCity } = await supabase
    .from('transporteur_profiles')
    .select('vehicle_type, users(nom, ville)')
    .eq('verification_status', 'verified')

  const mapCityMap: Record<string, { count: number; transporteurs: { nom: string; vehicle_type: string | null }[] }> = {}
  for (const tp of transporteursWithCity ?? []) {
    const user = tp.users as unknown as { nom: string; ville: string } | null
    if (!user?.ville) continue
    if (!mapCityMap[user.ville]) {
      mapCityMap[user.ville] = { count: 0, transporteurs: [] }
    }
    mapCityMap[user.ville].count++
    mapCityMap[user.ville].transporteurs.push({ nom: user.nom, vehicle_type: tp.vehicle_type })
  }
  const mapData = Object.entries(mapCityMap).map(([city, data]) => ({ city, ...data }))
```

In the JSX return, add after `<VehicleTypeChart />`:

```tsx
      <TransporteurMap cityData={mapData} />
```

**Step 3: Commit**

```bash
git add src/components/admin/TransporteurMap.tsx src/app/admin/stats/page.tsx
git commit -m "feat(admin): add transporteur map with Leaflet"
```

---

### Task 7: Transporteurs Page (migrated from /admin/verify)

**Files:**
- Create: `src/app/admin/transporteurs/page.tsx`
- Move: `src/components/AdminVerifyContent.tsx` → keep in place but update import

**Step 1: Create transporteurs page**

Create `src/app/admin/transporteurs/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import AdminVerifyContent from '@/components/AdminVerifyContent'

export default async function AdminTransporteursPage() {
  const supabase = await createClient()

  // Fetch pending/rejected
  const { data: pendingProfiles } = await supabase
    .from('transporteur_profiles')
    .select('*, users(id, nom, email, phone, ville, avatar_url)')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true })

  // Fetch verified
  const { data: verifiedProfiles } = await supabase
    .from('transporteur_profiles')
    .select('*, users(id, nom, email, phone, ville, avatar_url)')
    .eq('verification_status', 'verified')
    .order('created_at', { ascending: false })

  // Fetch rejected
  const { data: rejectedProfiles } = await supabase
    .from('transporteur_profiles')
    .select('*, users(id, nom, email, phone, ville, avatar_url)')
    .eq('verification_status', 'rejected')
    .order('created_at', { ascending: false })

  return (
    <AdminVerifyContent
      pendingProfiles={pendingProfiles ?? []}
      verifiedProfiles={verifiedProfiles ?? []}
      rejectedProfiles={rejectedProfiles ?? []}
    />
  )
}
```

**Step 2: Update AdminVerifyContent to support 3 tabs (add rejected tab)**

Modify `src/components/AdminVerifyContent.tsx` to add a third tab for rejected profiles. The key changes:

1. Add `rejectedProfiles` to the Props interface (with a default of `[]`).
2. Add a third tab state value `'rejected'`.
3. Show rejected profiles with rejection reason displayed.

The component update:
- Props: add `rejectedProfiles?: TransporteurProfile[]`
- Tab state type: `'pending' | 'verified' | 'rejected'`
- Add third tab button for rejected
- `displayProfiles` checks all three states
- In the rejected tab, show `profile.rejection_reason` if present

**Step 3: Commit**

```bash
git add src/app/admin/transporteurs/page.tsx src/components/AdminVerifyContent.tsx
git commit -m "feat(admin): migrate transporteurs page with rejected tab"
```

---

### Task 8: Transactions Page

**Files:**
- Create: `src/app/admin/transactions/page.tsx`
- Create: `src/components/admin/TransactionsContent.tsx`

**Step 1: Create the transactions client component**

Create `src/components/admin/TransactionsContent.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { markAsPaid } from '@/app/admin/actions'

interface Matching {
  id: string
  statut: string
  prix_final: number | null
  paid: boolean
  created_at: string
  charge: {
    ville_depart: string
    ville_arrivee: string
  } | null
  transporteur_nom: string | null
}

interface Props {
  matchings: Matching[]
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  'proposé': { label: 'جاري', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'en_négociation': { label: 'جاري', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'accepté': { label: 'مؤكد', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'completé': { label: 'مكمول', color: 'bg-green-50 text-success border-green-200' },
  'refusé': { label: 'مرفوض', color: 'bg-red-50 text-error border-red-200' },
}

export default function TransactionsContent({ matchings: initial }: Props) {
  const [matchings, setMatchings] = useState(initial)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = filter === 'all'
    ? matchings
    : matchings.filter(m => {
        if (filter === 'in_progress') return ['proposé', 'en_négociation'].includes(m.statut)
        if (filter === 'confirmed') return m.statut === 'accepté'
        if (filter === 'completed') return m.statut === 'completé'
        if (filter === 'refused') return m.statut === 'refusé'
        return true
      })

  const handleMarkPaid = async (id: string) => {
    setLoading(id)
    const result = await markAsPaid(id)
    if (result.success) {
      setMatchings(prev => prev.map(m => m.id === id ? { ...m, paid: true } : m))
    }
    setLoading(null)
  }

  const FILTERS = [
    { key: 'all', label: 'الكل' },
    { key: 'in_progress', label: 'جاري' },
    { key: 'confirmed', label: 'مؤكد' },
    { key: 'completed', label: 'مكمول' },
    { key: 'refused', label: 'مرفوض' },
  ]

  return (
    <div dir="rtl">
      {/* Filters */}
      <div className="flex gap-1.5 p-4 overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
              filter === f.key ? 'bg-accent text-white' : 'bg-white text-muted border border-border'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-muted text-sm py-8">ما كاين حتا معاملة</p>
        )}
        {filtered.map(m => {
          const status = STATUS_MAP[m.statut] ?? STATUS_MAP['proposé']
          const commission = m.prix_final ? Math.round(m.prix_final * 0.04) : 0
          const date = new Date(m.created_at).toLocaleDateString('fr-MA')

          return (
            <div key={m.id} className="bg-white rounded-xl border border-border p-4 space-y-3">
              {/* Route */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-nardo">
                  {m.charge?.ville_depart ?? '—'} → {m.charge?.ville_arrivee ?? '—'}
                </div>
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted">الناقل</p>
                  <p className="text-nardo font-medium">{m.transporteur_nom ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted">التاريخ</p>
                  <p className="text-nardo font-medium">{date}</p>
                </div>
                {m.prix_final && (
                  <>
                    <div>
                      <p className="text-muted">الثمن النهائي</p>
                      <p className="text-nardo font-medium">{m.prix_final} MAD</p>
                    </div>
                    <div>
                      <p className="text-muted">العمولة 4%</p>
                      <p className="text-success font-medium">{commission} MAD</p>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {m.statut === 'completé' && !m.paid && (
                  <button
                    onClick={() => handleMarkPaid(m.id)}
                    disabled={loading === m.id}
                    className="flex-1 min-h-[36px] bg-success text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    {loading === m.id ? '...' : 'خلّص ✓'}
                  </button>
                )}
                {m.paid && (
                  <span className="flex-1 min-h-[36px] flex items-center justify-center bg-green-50 text-success text-xs font-semibold rounded-lg border border-green-200">
                    مخلّص ✓
                  </span>
                )}
                <Link
                  href={`/chat/${m.id}`}
                  className="px-4 min-h-[36px] flex items-center border border-border text-muted text-xs rounded-lg hover:bg-surface"
                >
                  شوف الشات
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 2: Create transactions server page**

Create `src/app/admin/transactions/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import TransactionsContent from '@/components/admin/TransactionsContent'

export default async function AdminTransactionsPage() {
  const supabase = await createClient()

  const { data: matchings } = await supabase
    .from('matchings')
    .select(`
      id, statut, prix_final, paid, created_at, charge_id,
      charges(ville_depart, ville_arrivee),
      transporteur_complet_id, transporteur_camion_id
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  // Get transporteur names
  const transporteurIds = (matchings ?? [])
    .map(m => m.transporteur_complet_id ?? m.transporteur_camion_id)
    .filter(Boolean) as string[]

  const { data: transporteurs } = transporteurIds.length > 0
    ? await supabase
        .from('users')
        .select('id, nom')
        .in('id', transporteurIds)
    : { data: [] }

  const nameMap = new Map((transporteurs ?? []).map(t => [t.id, t.nom]))

  const formatted = (matchings ?? []).map(m => ({
    id: m.id,
    statut: m.statut,
    prix_final: m.prix_final,
    paid: m.paid ?? false,
    created_at: m.created_at,
    charge: m.charges as { ville_depart: string; ville_arrivee: string } | null,
    transporteur_nom: nameMap.get(m.transporteur_complet_id ?? m.transporteur_camion_id ?? '') ?? null,
  }))

  return <TransactionsContent matchings={formatted} />
}
```

**Step 3: Commit**

```bash
git add src/app/admin/transactions/page.tsx src/components/admin/TransactionsContent.tsx
git commit -m "feat(admin): add transactions page with filters + mark paid"
```

---

### Task 9: Users Page

**Files:**
- Create: `src/app/admin/users/page.tsx`
- Create: `src/components/admin/UsersContent.tsx`

**Step 1: Create users client component**

Create `src/components/admin/UsersContent.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { banUser, unbanUser } from '@/app/admin/actions'

interface User {
  id: string
  nom: string
  email: string
  ville: string | null
  role: string
  banned: boolean
  ban_reason: string | null
  avatar_url: string | null
  created_at: string
  charges_count: number
  matchings_count: number
}

interface Props {
  users: User[]
}

export default function UsersContent({ users: initial }: Props) {
  const [users, setUsers] = useState(initial)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [banModal, setBanModal] = useState<string | null>(null)
  const [banReason, setBanReason] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = users.filter(u => {
    if (search && !u.nom.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    return true
  })

  const handleBan = async (userId: string) => {
    if (!banReason.trim()) return
    setLoading(userId)
    const result = await banUser(userId, banReason)
    if (result.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: true, ban_reason: banReason } : u))
      setBanModal(null)
      setBanReason('')
    }
    setLoading(null)
  }

  const handleUnban = async (userId: string) => {
    setLoading(userId)
    const result = await unbanUser(userId)
    if (result.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: false, ban_reason: null } : u))
    }
    setLoading(null)
  }

  return (
    <div dir="rtl">
      {/* Search + filters */}
      <div className="p-4 space-y-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="قلّب على مستخدم..."
          className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent"
        />
        <div className="flex gap-1.5">
          {[
            { key: 'all', label: 'الكل' },
            { key: 'transporteur', label: 'ناقلين' },
            { key: 'expéditeur', label: 'مرسلين' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                roleFilter === f.key ? 'bg-accent text-white' : 'bg-white text-muted border border-border'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* User list */}
      <div className="px-4 space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-muted text-sm py-8">ما كاين حتا مستخدم</p>
        )}
        {filtered.map(user => (
          <div key={user.id} className="bg-white rounded-xl border border-border">
            {/* User row */}
            <button
              onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
              className="w-full flex items-center gap-3 p-4 cursor-pointer hover:bg-surface/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.nom} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-accent">{user.nom?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 text-right">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-nardo text-sm">{user.nom}</p>
                  {user.banned && (
                    <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-error text-[10px] font-medium border border-red-200">
                      موقوف
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted">{user.email} — {user.role === 'transporteur' ? 'ناقل' : 'مرسل'} — {user.ville ?? '—'}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-muted transition-transform ${expandedId === user.id ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Expanded */}
            {expandedId === user.id && (
              <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-surface rounded-lg p-2">
                    <p className="text-lg font-bold text-nardo">{user.charges_count}</p>
                    <p className="text-muted">شحنات</p>
                  </div>
                  <div className="bg-surface rounded-lg p-2">
                    <p className="text-lg font-bold text-nardo">{user.matchings_count}</p>
                    <p className="text-muted">معاملات</p>
                  </div>
                  <div className="bg-surface rounded-lg p-2">
                    <p className="text-lg font-bold text-nardo">{new Date(user.created_at).toLocaleDateString('fr-MA')}</p>
                    <p className="text-muted">التسجيل</p>
                  </div>
                </div>

                {user.banned && user.ban_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-error">
                    السبب: {user.ban_reason}
                  </div>
                )}

                {/* Ban modal */}
                {banModal === user.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={banReason}
                      onChange={e => setBanReason(e.target.value)}
                      placeholder="سبب الإيقاف..."
                      rows={2}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBan(user.id)}
                        disabled={loading === user.id || !banReason.trim()}
                        className="flex-1 min-h-[36px] bg-error text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                      >
                        أكد الإيقاف
                      </button>
                      <button
                        onClick={() => { setBanModal(null); setBanReason('') }}
                        className="px-4 min-h-[36px] border border-border text-muted text-xs rounded-lg cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {user.banned ? (
                      <button
                        onClick={() => handleUnban(user.id)}
                        disabled={loading === user.id}
                        className="flex-1 min-h-[36px] bg-success text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
                      >
                        {loading === user.id ? '...' : 'فعّل الحساب'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setBanModal(user.id)}
                        className="flex-1 min-h-[36px] bg-red-50 text-error text-xs font-semibold rounded-lg border border-red-200 cursor-pointer"
                      >
                        وقف الحساب
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Create users server page**

Create `src/app/admin/users/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import UsersContent from '@/components/admin/UsersContent'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('users')
    .select('id, nom, email, ville, role, banned, ban_reason, avatar_url, created_at')
    .neq('role', 'admin')
    .order('created_at', { ascending: false })

  // Get charges count per user
  const userIds = (users ?? []).map(u => u.id)

  // Count charges for expediteurs
  const { data: chargesCounts } = await supabase
    .from('charges')
    .select('expediteur_id')
    .in('expediteur_id', userIds)

  const chargesMap: Record<string, number> = {}
  for (const c of chargesCounts ?? []) {
    chargesMap[c.expediteur_id] = (chargesMap[c.expediteur_id] ?? 0) + 1
  }

  // Count matchings for transporteurs
  const { data: matchingsCounts } = await supabase
    .from('matchings')
    .select('transporteur_complet_id, transporteur_camion_id, transporteur_remorque_id')

  const matchingsMap: Record<string, number> = {}
  for (const m of matchingsCounts ?? []) {
    for (const id of [m.transporteur_complet_id, m.transporteur_camion_id, m.transporteur_remorque_id]) {
      if (id) matchingsMap[id] = (matchingsMap[id] ?? 0) + 1
    }
  }

  const formatted = (users ?? []).map(u => ({
    ...u,
    banned: u.banned ?? false,
    charges_count: chargesMap[u.id] ?? 0,
    matchings_count: matchingsMap[u.id] ?? 0,
  }))

  return <UsersContent users={formatted} />
}
```

**Step 3: Commit**

```bash
git add src/app/admin/users/page.tsx src/components/admin/UsersContent.tsx
git commit -m "feat(admin): add users page with ban/unban + search"
```

---

### Task 10: Update AdminVerifyContent + Build Check

**Files:**
- Modify: `src/components/AdminVerifyContent.tsx`

**Step 1: Add rejected tab to AdminVerifyContent**

Update the component to accept `rejectedProfiles` prop and add a third tab. Key changes:

1. Add to Props: `rejectedProfiles?: TransporteurProfile[]`
2. Change tab state type to `'pending' | 'verified' | 'rejected'`
3. Add third tab button
4. Update `displayProfiles` logic
5. Show rejection_reason for rejected profiles

**Step 2: Run build**

```bash
npm run build
```

Fix any TypeScript or build errors.

**Step 3: Commit**

```bash
git add src/components/AdminVerifyContent.tsx
git commit -m "feat(admin): add rejected tab to transporteur verification"
```

---

### Task 11: Final Build + Integration Test

**Step 1: Run full build**

```bash
npm run build
```

All routes should compile:
```
/admin                → redirect
/admin/login          → static
/admin/stats          → dynamic
/admin/transporteurs  → dynamic
/admin/transactions   → dynamic
/admin/users          → dynamic
```

**Step 2: Fix any errors**

Address TypeScript errors, missing imports, or Leaflet SSR issues.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(admin): complete admin dashboard with stats, charts, map, transactions, users"
```

---

## Summary of all commits:

1. `feat(admin): add migration + install recharts & leaflet`
2. `feat(admin): add admin server actions + ban enforcement`
3. `feat(admin): add admin dashboard translation keys`
4. `feat(admin): add login page, layout with tabs, redirect`
5. `feat(admin): add stats page with cards + recharts`
6. `feat(admin): add transporteur map with Leaflet`
7. `feat(admin): migrate transporteurs page with rejected tab`
8. `feat(admin): add transactions page with filters + mark paid`
9. `feat(admin): add users page with ban/unban + search`
10. `feat(admin): add rejected tab to transporteur verification`
11. `feat(admin): complete admin dashboard — final build check`

## Post-implementation:

- Run `supabase/migrations/add-admin-dashboard.sql` in Supabase SQL Editor
- Create an admin user: `UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com'`
