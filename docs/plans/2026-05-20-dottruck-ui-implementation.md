# Dottruck UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebrand FLEEZ TRUCK → Dottruck with full UI redesign (orange → blue/gray palette), mobile-first layout, bottom navigation, and 5 new mock-data pages.

**Architecture:** Hybrid approach — existing Supabase server actions and queries are untouched; only JSX/CSS is replaced. Shared components go in `src/components/ui/`. New pages with mock data added to `src/app/`.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, TypeScript, Inter font (already loaded in layout.tsx)

---

## Brand Tokens Reference

| Name | Hex | Tailwind class (after Task 1) |
|------|-----|-------------------------------|
| Nardo Gray | `#2D2D2D` | `text-nardo`, `bg-nardo` |
| Steel Blue | `#4A6FA5` | `text-accent`, `bg-accent` |
| Surface | `#F5F5F5` | `bg-surface` |
| Border | `#D0D0D0` | `border-border` |
| Success | `#10B981` | `text-success`, `bg-success` |
| Warning | `#F59E0B` | `text-warning` |
| Error | `#EF4444` | `text-error`, `bg-error` |

---

## Task 1: Update globals.css — Dottruck theme tokens

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Replace the entire file**

```css
@import "tailwindcss";

@theme {
  --color-nardo: #2D2D2D;
  --color-accent: #4A6FA5;
  --color-accent-hover: #3A5F95;
  --color-surface: #F5F5F5;
  --color-border: #D0D0D0;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-background: #ffffff;
  --color-foreground: #2D2D2D;
}

body {
  background: #ffffff;
  color: #2D2D2D;
  font-family: 'Inter', sans-serif;
}
```

**Step 2: Verify no build errors**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && npm run build 2>&1 | tail -20
```
Expected: build succeeds (or only pre-existing errors, none new)

**Step 3: Update layout.tsx metadata**

Modify `src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dottruck — Transport intelligent au Maroc',
  description: 'Trouve ta charge en 2 clics. Plateforme de fret pour transporteurs marocains.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

**Step 4: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/app/globals.css src/app/layout.tsx && git commit -m "feat(theme): add Dottruck brand tokens to Tailwind v4 theme"
```

---

## Task 2: Create shared Button component

**Files:**
- Create: `src/components/ui/Button.tsx`

**Step 1: Create the file**

```tsx
import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'text'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent hover:bg-accent-hover text-white font-semibold transition-all duration-200',
  secondary:
    'bg-white border border-border text-nardo hover:bg-surface font-medium transition-all duration-200',
  danger:
    'bg-white border border-error text-error hover:bg-red-50 font-medium transition-all duration-200',
  text:
    'bg-transparent text-accent hover:underline font-medium transition-all duration-200',
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        'min-h-[48px] px-4 rounded-xl text-base',
        fullWidth ? 'w-full' : '',
        variants[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}
```

**Step 2: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/components/ui/Button.tsx && git commit -m "feat(ui): add Button component with primary/secondary/danger/text variants"
```

---

## Task 3: Create shared Input + Label components

**Files:**
- Create: `src/components/ui/Input.tsx`

**Step 1: Create the file**

```tsx
import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const inputBase =
  'w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 bg-white min-h-[48px]'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}
export function Input({ label, id, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-600">
          {label}
        </label>
      )}
      <input id={id} {...props} className={`${inputBase} ${className}`} />
    </div>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  children: React.ReactNode
}
export function Select({ label, id, className = '', children, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-600">
          {label}
        </label>
      )}
      <select
        id={id}
        {...props}
        className={`${inputBase} cursor-pointer ${className}`}
      >
        {children}
      </select>
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}
export function Textarea({ label, id, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-600">
          {label}
        </label>
      )}
      <textarea
        id={id}
        {...props}
        className={`w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 bg-white resize-none ${className}`}
      />
    </div>
  )
}
```

**Step 2: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/components/ui/Input.tsx && git commit -m "feat(ui): add Input/Select/Textarea form components"
```

---

## Task 4: Create TopHeader and BottomNav components

**Files:**
- Create: `src/components/ui/TopHeader.tsx`
- Create: `src/components/ui/BottomNav.tsx`

**Step 1: Create TopHeader**

```tsx
// src/components/ui/TopHeader.tsx
import Link from 'next/link'

interface TopHeaderProps {
  title: string
  backHref?: string
  right?: React.ReactNode
}

export function TopHeader({ title, backHref, right }: TopHeaderProps) {
  return (
    <header className="bg-white border-b border-border px-4 h-14 flex items-center justify-between sticky top-0 z-10">
      <div className="w-10">
        {backHref && (
          <Link
            href={backHref}
            className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-surface transition-colors text-nardo"
            aria-label="Retour"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        )}
      </div>
      <h1 className="text-base font-bold text-nardo tracking-wide uppercase">{title}</h1>
      <div className="w-10 flex justify-end">{right ?? null}</div>
    </header>
  )
}
```

**Step 2: Create BottomNav**

```tsx
// src/components/ui/BottomNav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    href: '/dashboard',
    label: 'Accueil',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'Historique',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: '/notifications',
    label: 'Alertes',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    href: '/profile/settings',
    label: 'Profil',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-10">
      <div className="max-w-lg mx-auto flex">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex-1 flex flex-col items-center justify-center py-2 gap-1 min-h-[56px] transition-colors',
                active ? 'text-accent' : 'text-gray-400 hover:text-gray-600',
              ].join(' ')}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

**Step 3: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/components/ui/ && git commit -m "feat(ui): add TopHeader and BottomNav layout components"
```

---

## Task 5: Create StatusBadge component

**Files:**
- Create: `src/components/ui/StatusBadge.tsx`

**Step 1: Create the file**

```tsx
// src/components/ui/StatusBadge.tsx
type Status = 'success' | 'warning' | 'error' | 'pending'

interface StatusBadgeProps {
  status: Status
  label?: string
}

const config: Record<Status, { icon: string; classes: string }> = {
  success: { icon: '✓', classes: 'bg-green-50 text-success border-green-200' },
  warning: { icon: '⚠', classes: 'bg-amber-50 text-warning border-amber-200' },
  error:   { icon: '✗', classes: 'bg-red-50 text-error border-red-200' },
  pending: { icon: '⏳', classes: 'bg-gray-50 text-gray-500 border-gray-200' },
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { icon, classes } = config[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${classes}`}>
      {icon} {label}
    </span>
  )
}
```

**Step 2: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/components/ui/StatusBadge.tsx && git commit -m "feat(ui): add StatusBadge component"
```

---

## Task 6: Redesign Landing page (`/`)

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Replace entire file**

```tsx
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface flex flex-col">
      {/* Mobile layout */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full space-y-10">

        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-nardo tracking-tight">Dottruck</h1>
          <p className="text-gray-500 text-base">Transport intelligent au Maroc</p>
        </div>

        {/* Headline */}
        <div className="text-center space-y-3">
          <p className="text-3xl font-bold text-nardo leading-tight">
            Les appels,<br />c&apos;est fini.
          </p>
          <p className="text-gray-500 text-base">
            Trouve ton chargement en 2 clics
          </p>
        </div>

        {/* Benefits */}
        <ul className="space-y-3 w-full">
          {[
            'Pas d\'appels téléphoniques',
            'Transparent sur les prix',
            'Connexion directe',
          ].map((benefit) => (
            <li key={benefit} className="flex items-center gap-3 text-gray-600 text-base">
              <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold shrink-0">✓</span>
              {benefit}
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="w-full space-y-3">
          <Link
            href="/auth/signup?role=transporteur"
            className="flex items-center justify-center w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all duration-200 text-base"
          >
            Je suis Transporteur
          </Link>
          <Link
            href="/auth/signup?role=expéditeur"
            className="flex items-center justify-center w-full min-h-[52px] bg-white border border-border text-nardo font-semibold rounded-xl hover:bg-surface transition-all duration-200 text-base"
          >
            Je suis Expéditeur
          </Link>
          <p className="text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-accent font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
```

**Step 2: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/app/page.tsx && git commit -m "feat(landing): rebrand to Dottruck, apply blue/gray palette"
```

---

## Task 7: Redesign Login page (`/auth/login`)

**Files:**
- Modify: `src/app/auth/login/page.tsx`

**Step 1: Replace entire file**

```tsx
import Link from 'next/link'
import { signIn } from '../actions'
import { TopHeader } from '@/components/ui/TopHeader'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params.error

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Connexion" backHref="/" />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-nardo">Bienvenue</h2>
            <p className="text-gray-500 mt-1 text-base">Connectez-vous à votre compte Dottruck</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-error rounded-xl p-4 text-sm">
              {decodeURIComponent(error)}
            </div>
          )}

          <form action={signIn} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input
                name="email" type="email" required
                className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 bg-white min-h-[48px]"
                placeholder="exemple@email.com"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600">Mot de passe</label>
              <input
                name="password" type="password" required
                className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 bg-white min-h-[48px]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all duration-200 text-base"
            >
              Se connecter
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center">
            Pas encore de compte ?{' '}
            <Link href="/" className="text-accent font-medium hover:underline">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
```

**Step 2: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/app/auth/login/page.tsx && git commit -m "feat(auth): redesign login page with Dottruck branding"
```

---

## Task 8: Redesign Sign Up page (`/auth/signup`)

**Files:**
- Modify: `src/app/auth/signup/page.tsx`

**Step 1: Replace entire file**

```tsx
import Link from 'next/link'
import { signUp } from '../actions'
import { TopHeader } from '@/components/ui/TopHeader'

const VILLES = ['Safi', 'Casablanca', 'Marrakech', 'Agadir', 'Rabat', 'Tanger', 'Fès', 'Meknès']

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string }>
}) {
  const params = await searchParams
  const role = params.role || 'transporteur'
  const error = params.error
  const isTransporteur = role === 'transporteur'

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Inscription" backHref="/" />

      <main className="flex-1 p-6 max-w-md mx-auto w-full space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-nardo">Qui êtes-vous ?</h2>
        </div>

        {/* Role toggle */}
        <div className="flex gap-2 bg-white border border-border rounded-xl p-1">
          <Link
            href="/auth/signup?role=transporteur"
            className={[
              'flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
              isTransporteur
                ? 'bg-accent text-white shadow-sm'
                : 'text-gray-500 hover:text-nardo',
            ].join(' ')}
          >
            Transporteur
          </Link>
          <Link
            href="/auth/signup?role=expéditeur"
            className={[
              'flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
              !isTransporteur
                ? 'bg-accent text-white shadow-sm'
                : 'text-gray-500 hover:text-nardo',
            ].join(' ')}
          >
            Expéditeur
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-error rounded-xl p-4 text-sm">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={signUp} className="space-y-4">
          <input type="hidden" name="role" value={role} />

          {(['Nom complet', 'Téléphone', 'Email', 'Mot de passe'] as const).map(() => null)}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">Nom complet</label>
            <input name="nom" type="text" required placeholder="Hamza Ben Ali"
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]" />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">Ville</label>
            <select name="ville" required
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]">
              <option value="">Choisir une ville</option>
              {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">Téléphone</label>
            <input name="phone" type="tel" required placeholder="+212 6XX XXX XXX"
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]" />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <input name="email" type="email" required placeholder="exemple@email.com"
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]" />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">Mot de passe</label>
            <input name="password" type="password" required minLength={6} placeholder="••••••••"
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]" />
          </div>

          <button type="submit"
            className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all duration-200 text-base mt-2">
            Créer mon compte
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center pb-6">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-accent font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </main>
    </div>
  )
}
```

**Step 2: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/app/auth/signup/page.tsx && git commit -m "feat(auth): redesign signup page with role toggle and Dottruck branding"
```

---

## Task 9: Redesign Profile Setup page (`/profile/setup`)

**Files:**
- Modify: `src/app/profile/setup/page.tsx`

**Step 1: Replace entire file**

```tsx
import Link from 'next/link'
import { setupTransporteurProfile } from '../actions'
import { TopHeader } from '@/components/ui/TopHeader'

const vehicleOptions = [
  {
    value: 'C',
    label: 'Camion + Remorque',
    desc: "J'ai les deux, je peux accepter toute charge",
  },
  {
    value: 'A',
    label: 'Camion seul',
    desc: 'Je cherche un partenaire avec une remorque',
  },
  {
    value: 'B',
    label: 'Remorque seule',
    desc: 'Je cherche un partenaire avec un camion',
  },
]

export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Ton profil" backHref="/dashboard" />

      <main className="flex-1 p-6 max-w-md mx-auto w-full space-y-6">
        <div>
          <h2 className="text-xl font-bold text-nardo">Type de véhicule</h2>
          <p className="text-gray-500 mt-1 text-base">Dites-nous ce que vous avez</p>
        </div>

        {params.error && (
          <div className="bg-red-50 border border-red-200 text-error rounded-xl p-4 text-sm">
            {decodeURIComponent(params.error)}
          </div>
        )}

        <form action={setupTransporteurProfile} className="space-y-4">
          {vehicleOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex items-start gap-4 border-2 border-border rounded-xl p-4 cursor-pointer hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent/5 transition-all duration-200 bg-white"
            >
              <input type="radio" name="type" value={opt.value} required className="mt-0.5 accent-[#4A6FA5]" />
              <div>
                <p className="font-semibold text-nardo text-base">{opt.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
            </label>
          ))}

          <div className="space-y-1 pt-2">
            <label className="block text-sm font-medium text-gray-600">
              Description du véhicule <span className="text-gray-400">(optionnel)</span>
            </label>
            <textarea
              name="description_vehicule"
              rows={3}
              placeholder="Ex: Mercedes 15T, Safi, disponible weekend..."
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all duration-200 text-base"
          >
            Continuer
          </button>
        </form>

        <p className="text-center">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-accent">
            Passer cette étape
          </Link>
        </p>
      </main>
    </div>
  )
}
```

**Step 2: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/app/profile/setup/page.tsx && git commit -m "feat(profile): redesign profile setup with Dottruck branding"
```

---

## Task 10: Redesign ChargeCard component

**Files:**
- Modify: `src/components/ChargeCard.tsx`

**Step 1: Replace entire file**

```tsx
interface Charge {
  id: string
  ville_depart: string
  ville_arrivee: string
  type_requis: string
  poids_kg: number | null
  prix_total_mad: number
  statut: string
  created_at: string
}

const typeLabel: Record<string, string> = {
  camion: 'Camion',
  remorque: 'Remorque',
  les_deux: 'Camion + Remorque',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'À l\'instant'
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h / 24)}j`
}

export function ChargeCard({ charge }: { charge: Charge }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 space-y-3 hover:border-accent/50 transition-all duration-200 hover:shadow-sm">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-nardo text-base truncate">
            {charge.ville_depart} → {charge.ville_arrivee}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {typeLabel[charge.type_requis] ?? charge.type_requis}
            {charge.poids_kg ? ` · ${charge.poids_kg} kg` : ''}
          </p>
          <p className="text-xs text-gray-400 mt-1">{timeAgo(charge.created_at)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-nardo text-lg">{charge.prix_total_mad.toLocaleString()}</p>
          <p className="text-xs text-gray-500">MAD</p>
        </div>
      </div>
      <a
        href={`/charges/${charge.id}`}
        className="flex items-center justify-center w-full min-h-[44px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all duration-200 text-sm"
      >
        Accepter
      </a>
    </div>
  )
}
```

**Step 2: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/components/ChargeCard.tsx && git commit -m "feat(components): redesign ChargeCard with Dottruck branding and timeAgo"
```

---

## Task 11: Redesign Dashboard page (`/dashboard`)

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Replace entire file**

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChargeCard } from '@/components/ChargeCard'
import { NotificationBar } from '@/components/NotificationBar'
import { signOut } from '@/app/auth/actions'
import { getVisibleChargeTypes } from '@/lib/matching'
import { BottomNav } from '@/components/ui/BottomNav'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('*, transporteur_profiles(*)')
    .eq('id', user.id)
    .single()

  const rawProfiles = userProfile?.transporteur_profiles
  const transporteurProfile = (Array.isArray(rawProfiles) ? rawProfiles[0] : rawProfiles) as {
    type: 'A' | 'B' | 'C'
    description_vehicule: string | null
    score: number
  } | null | undefined ?? null

  let charges: Array<{
    id: string
    ville_depart: string
    ville_arrivee: string
    type_requis: string
    poids_kg: number | null
    prix_total_mad: number
    statut: string
    created_at: string
  }> = []

  if (userProfile?.role === 'transporteur' && transporteurProfile) {
    const visibleTypes = getVisibleChargeTypes(transporteurProfile.type)
    const { data } = await supabase
      .from('charges')
      .select('*')
      .eq('statut', 'ouverte')
      .in('type_requis', visibleTypes)
      .order('created_at', { ascending: false })
    charges = data ?? []
  } else if (userProfile?.role === 'expéditeur') {
    const { data } = await supabase
      .from('charges')
      .select('*')
      .eq('expediteur_id', user.id)
      .order('created_at', { ascending: false })
    charges = data ?? []
  }

  const isTransporteur = userProfile?.role === 'transporteur'

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Notification bar */}
      <NotificationBar userId={user.id} />

      {/* Top header */}
      <header className="bg-white border-b border-border px-4 h-14 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-bold text-nardo">Dottruck</h1>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface text-gray-500 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-sm text-gray-500 hover:text-error transition-colors font-medium">
              Déco
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 pb-24 max-w-lg mx-auto w-full space-y-5">
        {/* Greeting */}
        <div>
          <p className="text-lg font-bold text-nardo">Salut, {userProfile?.nom?.split(' ')[0]} 👋</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {isTransporteur
              ? `${charges.length} charge${charges.length !== 1 ? 's' : ''} disponible${charges.length !== 1 ? 's' : ''}`
              : `${charges.length} charge${charges.length !== 1 ? 's' : ''} publiée${charges.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Transporteur type banner */}
        {transporteurProfile && (
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
            <p className="text-sm font-medium text-accent">
              {transporteurProfile.type === 'A' && 'Camion seul — cherchez une remorque via l\'onglet Matching'}
              {transporteurProfile.type === 'B' && 'Remorque seule — cherchez un camion via l\'onglet Matching'}
              {transporteurProfile.type === 'C' && 'Camion + Remorque — toutes les charges sont visibles'}
            </p>
          </div>
        )}

        {/* Expéditeur actions */}
        {!isTransporteur && (
          <div className="flex justify-between items-center">
            <p className="text-base font-bold text-nardo">Mes charges</p>
            <Link
              href="/charges/new"
              className="flex items-center gap-1 bg-accent text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-accent-hover transition-all"
            >
              + Publier
            </Link>
          </div>
        )}

        {/* Section label */}
        {isTransporteur && charges.length > 0 && (
          <p className="text-sm font-bold text-nardo uppercase tracking-wide">Charges près de toi</p>
        )}

        {/* Content */}
        {isTransporteur && !transporteurProfile ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-gray-500">Configurez votre profil pour voir les charges.</p>
            <Link
              href="/profile/setup"
              className="inline-flex items-center justify-center min-h-[48px] px-6 bg-accent text-white font-semibold rounded-xl"
            >
              Configurer mon profil
            </Link>
          </div>
        ) : charges.length > 0 ? (
          <div className="space-y-3">
            {charges.map(charge => (
              <ChargeCard key={charge.id} charge={charge} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            {isTransporteur
              ? 'Aucune charge disponible pour le moment.'
              : 'Aucune charge publiée. Cliquez sur "+ Publier" pour commencer.'}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
```

**Step 2: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/app/dashboard/page.tsx && git commit -m "feat(dashboard): redesign with greeting, bottom nav, and Dottruck branding"
```

---

## Task 12: Redesign Charge Detail page (`/charges/[id]`)

**Files:**
- Read and modify: `src/app/charges/[id]/page.tsx`

**Step 1: Read existing file first**

```bash
cat "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK/src/app/charges/[id]/page.tsx"
```

**Step 2: Keep all Supabase logic, replace JSX with this template**

The new JSX structure (preserve all existing data fetching and server actions at top, replace `return (...)` only):

```tsx
// At the top of the return statement — replace everything after the data-fetching logic:
return (
  <div className="min-h-screen bg-surface flex flex-col">
    <TopHeader title="Détails charge" backHref="/dashboard" />

    <main className="flex-1 pb-24 max-w-lg mx-auto w-full">
      {/* Hero section */}
      <div className="bg-white px-4 py-5 border-b border-border">
        <h2 className="text-2xl font-bold text-nardo">{charge.description ?? `${charge.ville_depart} → ${charge.ville_arrivee}`}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-yellow-400 text-sm">★</span>
          <span className="text-sm text-gray-500">Expéditeur fiable</span>
        </div>
      </div>

      {/* Sections */}
      <div className="divide-y divide-border">

        {/* Route */}
        <section className="bg-white px-4 py-4 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Trajet</p>
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center pt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
              <span className="w-px h-8 bg-border my-1"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-nardo"></span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-nardo text-base">{charge.ville_depart}</p>
                <p className="text-xs text-gray-400">Départ</p>
              </div>
              <div>
                <p className="font-semibold text-nardo text-base">{charge.ville_arrivee}</p>
                <p className="text-xs text-gray-400">Arrivée</p>
              </div>
            </div>
          </div>
        </section>

        {/* Cargo */}
        <section className="bg-white px-4 py-4 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Charge</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface rounded-xl p-3">
              <p className="text-xs text-gray-400">Poids</p>
              <p className="font-semibold text-nardo mt-0.5">{charge.poids_kg ? `${charge.poids_kg} kg` : '—'}</p>
            </div>
            <div className="bg-surface rounded-xl p-3">
              <p className="text-xs text-gray-400">Type requis</p>
              <p className="font-semibold text-nardo mt-0.5 capitalize">{charge.type_requis.replace('_', ' ')}</p>
            </div>
          </div>
        </section>

        {/* Price */}
        <section className="bg-white px-4 py-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Prix proposé</p>
          <p className="text-3xl font-bold text-nardo mt-1">{charge.prix_total_mad.toLocaleString()} <span className="text-lg font-normal text-gray-500">MAD</span></p>
          <p className="text-xs text-gray-400 mt-1">Négociable via le chat</p>
        </section>
      </div>
    </main>

    {/* Sticky CTA */}
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 max-w-lg mx-auto">
      <form action={createMatching}>
        <input type="hidden" name="chargeId" value={charge.id} />
        <button
          type="submit"
          className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-all duration-200 text-base"
        >
          Accepter cette charge
        </button>
      </form>
    </div>
  </div>
)
```

Note: Add `import { TopHeader } from '@/components/ui/TopHeader'` at the top.

**Step 3: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add "src/app/charges/[id]/page.tsx" && git commit -m "feat(charges): redesign charge detail page with section layout"
```

---

## Task 13: Redesign New Charge page (`/charges/new`)

**Files:**
- Read and modify: `src/app/charges/new/page.tsx`

**Step 1: Read existing file first**

```bash
cat "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK/src/app/charges/new/page.tsx"
```

**Step 2: Keep all server actions, replace JSX**

The replacement return value (keep all imports and server action refs at top):

```tsx
const VILLES = ['Safi', 'Casablanca', 'Marrakech', 'Agadir', 'Rabat', 'Tanger', 'Fès', 'Meknès']
// Add to imports: import { TopHeader } from '@/components/ui/TopHeader'

return (
  <div className="min-h-screen bg-surface flex flex-col">
    <TopHeader title="Publier une charge" backHref="/dashboard" />

    <main className="flex-1 p-4 max-w-lg mx-auto w-full pb-10">
      <form action={publishCharge} className="space-y-4 mt-4">

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-600">Ville de départ</label>
          <select name="ville_depart" required
            className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]">
            <option value="">Choisir</option>
            {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-600">Ville d&apos;arrivée</label>
          <select name="ville_arrivee" required
            className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]">
            <option value="">Choisir</option>
            {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-600">Type de véhicule requis</label>
          <select name="type_requis" required
            className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]">
            <option value="">Choisir</option>
            <option value="camion">Camion</option>
            <option value="remorque">Remorque</option>
            <option value="les_deux">Camion + Remorque</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-600">Poids (kg) <span className="text-gray-400">— optionnel</span></label>
          <input name="poids_kg" type="number" min="1" placeholder="Ex: 5000"
            className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]" />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-600">Prix total (MAD)</label>
          <input name="prix_total_mad" type="number" min="1" required placeholder="Ex: 1600"
            className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white min-h-[48px]" />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-600">Description <span className="text-gray-400">— optionnel</span></label>
          <textarea name="description" rows={3} placeholder="Ex: Sacs de ciment, chargement rapide..."
            className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white resize-none" />
        </div>

        <button type="submit"
          className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-all duration-200 text-base mt-2">
          Publier la charge
        </button>
      </form>
    </main>
  </div>
)
```

**Step 3: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/app/charges/new/page.tsx && git commit -m "feat(charges): redesign new charge form with Dottruck branding"
```

---

## Task 14: Redesign ChatRoom component + NotificationBar

**Files:**
- Modify: `src/components/ChatRoom.tsx`
- Modify: `src/components/NotificationBar.tsx`

**Step 1: Read both files**

```bash
cat "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK/src/components/ChatRoom.tsx"
cat "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK/src/components/NotificationBar.tsx"
```

**Step 2: In ChatRoom.tsx — keep all logic, update message bubble styles**

Find the JSX return. Replace the message bubbles section. Key style changes:
- Received messages (left): `bg-gray-100 text-nardo rounded-2xl rounded-tl-sm`
- Sent messages (right): `bg-accent text-white rounded-2xl rounded-tr-sm`
- Input: `border border-border rounded-xl px-4 py-3 focus:border-accent`
- Send button: `bg-accent hover:bg-accent-hover text-white rounded-xl px-4 min-h-[48px]`
- Header name: `font-semibold text-nardo`

**Step 3: In NotificationBar.tsx — keep logic, update styles**

Replace orange banner with accent blue:
- Container: `bg-accent text-white`
- Badge: `bg-white text-accent text-xs font-bold rounded-full`

**Step 4: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/components/ChatRoom.tsx src/components/NotificationBar.tsx && git commit -m "feat(components): redesign ChatRoom and NotificationBar with Dottruck branding"
```

---

## Task 15: Redesign Rating page (`/charges/[id]/rate`)

**Files:**
- Read and modify: `src/app/charges/[id]/rate/page.tsx`

**Step 1: Read existing file**

```bash
cat "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK/src/app/charges/[id]/rate/page.tsx"
```

**Step 2: Keep server action, replace JSX with star-rating UI**

```tsx
// Add to imports: import { TopHeader } from '@/components/ui/TopHeader'

return (
  <div className="min-h-screen bg-surface flex flex-col">
    <TopHeader title="Évaluation" backHref="/dashboard" />

    <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
      <div className="text-center space-y-2 mb-8">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
          <span className="text-2xl">⭐</span>
        </div>
        <h2 className="text-xl font-bold text-nardo">Évaluez {nom}</h2>
        <p className="text-gray-500 text-sm">Votre avis aide la communauté Dottruck</p>
      </div>

      <form action={submitRating} className="w-full space-y-6">
        <input type="hidden" name="chargeId" value={chargeId} />
        <input type="hidden" name="toUserId" value={userId} />

        {/* Star rating — CSS radio trick */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600 text-center">Note</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <label key={star} className="cursor-pointer">
                <input type="radio" name="note" value={star} required className="sr-only" />
                <span className="text-4xl text-gray-300 hover:text-yellow-400 transition-colors has-[:checked]:text-yellow-400">★</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-600">Commentaire <span className="text-gray-400">— optionnel</span></label>
          <textarea name="commentaire" rows={3} placeholder="Ex: Ponctuel, professionnel..."
            className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white resize-none" />
        </div>

        <button type="submit"
          className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-all duration-200 text-base">
          Envoyer l&apos;évaluation
        </button>
      </form>
    </main>
  </div>
)
```

**Step 3: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add "src/app/charges/[id]/rate/page.tsx" && git commit -m "feat(rating): redesign rating page with star UI and Dottruck branding"
```

---

## Task 16: Create Matching Pairs page — mock data (`/matching`)

**Files:**
- Create: `src/app/matching/page.tsx`

**Step 1: Create the file**

```tsx
import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'

const mockPartners = [
  { id: '1', name: "Mohamed's Remorque", capacity: 15, available: 'Maintenant', rating: 4.7, reviews: 34, type: 'B' },
  { id: '2', name: "Hassan's Remorque",  capacity: 12, available: 'Demain matin', rating: 4.5, reviews: 21, type: 'B' },
  { id: '3', name: "Rachid Transport",   capacity: 20, available: 'Dans 2 jours',  rating: 4.9, reviews: 67, type: 'B' },
]

export default function MatchingPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Cherche partenaire" backHref="/dashboard" />

      <main className="flex-1 px-4 pt-5 pb-24 max-w-lg mx-auto w-full space-y-5">
        <div>
          <h2 className="text-xl font-bold text-nardo">Vous avez un camion ?</h2>
          <p className="text-gray-500 text-sm mt-1">Trouvez une remorque disponible près de vous</p>
        </div>

        <div className="space-y-3">
          {mockPartners.map((partner) => (
            <div key={partner.id} className="bg-white rounded-xl border border-border p-4 space-y-3 hover:border-accent/40 transition-all duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-nardo text-base">{partner.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">Capacité: {partner.capacity}T</p>
                  <p className="text-xs text-gray-400 mt-1">
                    <span className={partner.available === 'Maintenant' ? 'text-success font-medium' : ''}>
                      {partner.available === 'Maintenant' ? '● ' : '○ '}
                      {partner.available}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-nardo flex items-center gap-1 justify-end">
                    <span className="text-yellow-400">★</span> {partner.rating}
                  </p>
                  <p className="text-xs text-gray-400">{partner.reviews} avis</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 min-h-[44px] bg-white border border-border text-nardo text-sm font-semibold rounded-xl hover:bg-surface transition-all duration-200">
                  Voir profil
                </button>
                <button className="flex-1 min-h-[44px] bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-all duration-200">
                  Contacter
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-accent font-medium cursor-pointer hover:underline">
          Voir plus de partenaires
        </p>
      </main>

      <BottomNav />
    </div>
  )
}
```

**Step 2: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/app/matching/ && git commit -m "feat(matching): create matching pairs page with mock data"
```

---

## Task 17: Create Booking Confirmed page — mock (`/booking/confirmed`)

**Files:**
- Create: `src/app/booking/confirmed/page.tsx`

**Step 1: Create the file**

```tsx
import Link from 'next/link'

export default function BookingConfirmedPage() {
  // In production: read query params for charge/partner details
  const mock = {
    cargo: 'Ciment 10T',
    route: 'Safi → Casa',
    price: 1600,
    partner: 'Mohamed (Remorque)',
    rating: 4.7,
    departure: "Aujourd'hui 14h",
    phone: '+212 6 XX XX XX XX',
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-start px-6 pt-16 pb-10 max-w-md mx-auto">

      {/* Success icon */}
      <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-nardo text-center">Charge acceptée !</h1>
      <p className="text-gray-500 text-base text-center mt-2">Votre charge est confirmée</p>

      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-border p-5 mt-8 w-full space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Résumé</p>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Charge</span>
            <span className="font-semibold text-nardo text-sm">{mock.cargo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Trajet</span>
            <span className="font-semibold text-nardo text-sm">{mock.route}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Prix</span>
            <span className="font-bold text-nardo text-sm">{mock.price.toLocaleString()} MAD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Partenaire</span>
            <div className="text-right">
              <p className="font-semibold text-nardo text-sm">{mock.partner}</p>
              <p className="text-xs text-gray-400">★ {mock.rating}</p>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Départ</span>
            <span className="font-semibold text-nardo text-sm">{mock.departure}</span>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl border border-border p-5 mt-4 w-full space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Contact partenaire</p>
        <p className="font-semibold text-nardo">{mock.phone}</p>
        <div className="flex gap-2">
          <a href={`tel:${mock.phone}`}
            className="flex-1 min-h-[48px] flex items-center justify-center bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all text-sm">
            Appeler
          </a>
          <a href={`sms:${mock.phone}`}
            className="flex-1 min-h-[48px] flex items-center justify-center bg-white border border-border text-nardo font-semibold rounded-xl hover:bg-surface transition-all text-sm">
            SMS
          </a>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-8 w-full">
        <Link href="/history"
          className="flex-1 min-h-[48px] flex items-center justify-center bg-white border border-border text-nardo font-semibold rounded-xl hover:bg-surface transition-all text-sm">
          Historique
        </Link>
        <Link href="/dashboard"
          className="flex-1 min-h-[48px] flex items-center justify-center bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all text-sm">
          Accueil
        </Link>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/app/booking/ && git commit -m "feat(booking): create booking confirmed page with mock data"
```

---

## Task 18: Create Profile / Settings page — mock (`/profile/settings`)

**Files:**
- Create: `src/app/profile/settings/page.tsx`

**Step 1: Create the file**

```tsx
import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'
import { signOut } from '@/app/auth/actions'

const settingsItems = [
  { icon: '⚙️', label: 'Infos profil', href: '/profile/setup' },
  { icon: '🔔', label: 'Notifications', href: '/notifications' },
  { icon: '💳', label: 'Paiement', href: '#' },
  { icon: '🔐', label: 'Sécurité', href: '#' },
  { icon: '❓', label: 'Support', href: '#' },
  { icon: '📋', label: 'Conditions d\'utilisation', href: '#' },
]

const mockUser = {
  name: 'Hamza Ben Ali',
  email: 'hamza@example.com',
  rating: 4.8,
  reviews: 45,
  quote: 'Fiable et rapide',
  stats: { completed: 45, acceptance: '98%', cancellation: '2%' },
}

export default function ProfileSettingsPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Mon profil" backHref="/dashboard" />

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full">

        {/* Profile header */}
        <div className="bg-white px-4 py-6 flex flex-col items-center text-center border-b border-border">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-3">
            <span className="text-3xl font-bold text-accent">{mockUser.name[0]}</span>
          </div>
          <h2 className="text-lg font-bold text-nardo">{mockUser.name}</h2>
          <p className="text-gray-400 text-sm">{mockUser.email}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-yellow-400">★</span>
            <span className="font-semibold text-nardo text-sm">{mockUser.rating}</span>
            <span className="text-gray-400 text-sm">({mockUser.reviews} avis)</span>
          </div>
          <p className="text-sm text-gray-500 italic mt-1">&quot;{mockUser.quote}&quot;</p>
        </div>

        {/* Stats */}
        <div className="bg-white px-4 py-4 border-b border-border">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Mes stats</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xl font-bold text-nardo">{mockUser.stats.completed}</p>
              <p className="text-xs text-gray-500 mt-0.5">Complétées</p>
            </div>
            <div className="text-center border-x border-border">
              <p className="text-xl font-bold text-success">{mockUser.stats.acceptance}</p>
              <p className="text-xs text-gray-500 mt-0.5">Acceptation</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-error">{mockUser.stats.cancellation}</p>
              <p className="text-xs text-gray-500 mt-0.5">Annulation</p>
            </div>
          </div>
        </div>

        {/* Settings list */}
        <div className="bg-white mt-3 divide-y divide-border">
          <p className="px-4 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wide">Paramètres</p>
          {settingsItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center justify-between px-4 py-4 hover:bg-surface transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-base text-nardo font-medium">{item.label}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D0D0D0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </a>
          ))}
        </div>

        {/* Sign out */}
        <div className="px-4 mt-6 pb-6">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full min-h-[48px] bg-white border border-error text-error font-semibold rounded-xl hover:bg-red-50 transition-all duration-200 text-base"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
```

**Step 2: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/app/profile/settings/ && git commit -m "feat(profile): create profile/settings page with stats and settings list"
```

---

## Task 19: Create History page — mock (`/history`)

**Files:**
- Create: `src/app/history/page.tsx`

**Step 1: Create the file**

```tsx
import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'
import { StatusBadge } from '@/components/ui/StatusBadge'

const mockHistory = [
  {
    date: "Aujourd'hui",
    items: [
      { id: '1', cargo: 'Ciment 10T', route: 'Safi → Casa', price: 1600, time: '14:30', status: 'success' as const },
    ],
  },
  {
    date: 'Hier',
    items: [
      { id: '2', cargo: 'Fruits 5T', route: 'Safi → Marrakech', price: 1200, time: '09:15', status: 'success' as const },
      { id: '3', cargo: 'Électro 3T', route: 'Safi → Agadir', price: 900, time: '16:45', status: 'error' as const },
    ],
  },
  {
    date: 'Il y a 2 jours',
    items: [
      { id: '4', cargo: 'Ciment 8T', route: 'Safi → Rabat', price: 2100, time: '11:00', status: 'success' as const },
    ],
  },
]

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Historique" />

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full px-4 pt-4 space-y-5">

        {/* Filter */}
        <div>
          <select className="border border-border rounded-xl px-4 py-2.5 text-sm text-nardo bg-white focus:outline-none focus:border-accent transition-all">
            <option>Tous</option>
            <option>Acceptées</option>
            <option>Annulées</option>
          </select>
        </div>

        {/* History groups */}
        {mockHistory.map((group) => (
          <div key={group.date} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">📅 {group.date}</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {group.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-border px-4 py-3 flex items-center justify-between hover:border-accent/30 transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-nardo text-sm truncate">{item.cargo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.route}</p>
                  <p className="text-xs font-bold text-nardo mt-1">{item.price.toLocaleString()} MAD</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 ml-3 shrink-0">
                  <StatusBadge
                    status={item.status}
                    label={item.status === 'success' ? 'Complété' : 'Annulé'}
                  />
                  <p className="text-xs text-gray-400">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        ))}

        <button className="w-full text-center text-sm text-accent font-medium py-3 hover:underline">
          Charger plus
        </button>
      </main>

      <BottomNav />
    </div>
  )
}
```

**Step 2: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/app/history/ && git commit -m "feat(history): create history page with grouped mock transactions"
```

---

## Task 20: Create Notifications page — mock (`/notifications`)

**Files:**
- Create: `src/app/notifications/page.tsx`

**Step 1: Create the file**

```tsx
import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'
import Link from 'next/link'

const mockNotifs = [
  {
    id: '1',
    icon: '🚛',
    title: 'Nouvelle charge disponible',
    body: 'Ciment 10T — 1 600 MAD',
    time: '11:30',
    unread: true,
    action: { label: 'Voir', href: '/dashboard' },
  },
  {
    id: '2',
    icon: '💬',
    title: 'Mohamed a répondu',
    body: '"D\'accord pour 1 600 MAD"',
    time: '10:45',
    unread: true,
    action: { label: 'Voir chat', href: '/dashboard' },
  },
  {
    id: '3',
    icon: '⭐',
    title: 'Vous avez reçu un avis 5 étoiles',
    body: '"Super transporteur, ponctuel!"',
    time: '09:20',
    unread: false,
    action: null,
  },
  {
    id: '4',
    icon: '✅',
    title: 'Charge complétée',
    body: 'Fruits 5T — Safi → Marrakech',
    time: 'Hier 16:00',
    unread: false,
    action: { label: 'Évaluer', href: '/dashboard' },
  },
]

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Notifications" backHref="/dashboard" />

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full">

        {/* Mark all read */}
        <div className="px-4 py-3 border-b border-border bg-white">
          <button className="text-sm text-accent font-medium hover:underline">
            Marquer tout comme lu
          </button>
        </div>

        {/* Unread indicator */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-error"></span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Non lus ({mockNotifs.filter(n => n.unread).length})
            </span>
          </div>
        </div>

        {/* Notification list */}
        <div className="px-4 space-y-3 pb-4">
          {mockNotifs.map((notif) => (
            <div
              key={notif.id}
              className={[
                'bg-white rounded-xl border p-4 space-y-2 transition-all duration-200',
                notif.unread ? 'border-accent/30 shadow-sm' : 'border-border',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{notif.icon}</span>
                  <div>
                    <p className="font-semibold text-nardo text-sm">{notif.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{notif.body}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {notif.unread && (
                    <span className="w-2 h-2 rounded-full bg-accent"></span>
                  )}
                  <span className="text-xs text-gray-400">{notif.time}</span>
                </div>
              </div>
              {notif.action && (
                <Link
                  href={notif.action.href}
                  className="inline-flex items-center justify-center min-h-[36px] px-4 bg-surface border border-border text-nardo text-xs font-semibold rounded-lg hover:border-accent/40 transition-all"
                >
                  {notif.action.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
```

**Step 2: Commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add src/app/notifications/ && git commit -m "feat(notifications): create notifications page with unread indicators"
```

---

## Task 21: Update chat page to use TopHeader + final build check

**Files:**
- Read and modify: `src/app/chat/[matchingId]/page.tsx`

**Step 1: Read existing file**

```bash
cat "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK/src/app/chat/[matchingId]/page.tsx"
```

**Step 2: Add TopHeader import and replace header JSX**

Add `import { TopHeader } from '@/components/ui/TopHeader'` to imports.

Replace the existing header/navigation element at top of the return with:
```tsx
<TopHeader title="Négociation" backHref="/dashboard" />
```

**Step 3: Run final build**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && npm run build 2>&1 | tail -30
```

Expected: Build succeeds. If errors, fix TypeScript issues (check imports, undefined vars).

**Step 4: Final commit**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK" && git add "src/app/chat/[matchingId]/page.tsx" && git commit -m "feat(chat): add TopHeader to chat page, complete Dottruck UI redesign"
```

---

## Summary of all files changed

### Modified (existing logic preserved)
- `src/app/globals.css` — brand tokens
- `src/app/layout.tsx` — metadata
- `src/app/page.tsx` — landing
- `src/app/auth/login/page.tsx`
- `src/app/auth/signup/page.tsx`
- `src/app/profile/setup/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/charges/[id]/page.tsx`
- `src/app/charges/new/page.tsx`
- `src/app/charges/[id]/rate/page.tsx`
- `src/app/chat/[matchingId]/page.tsx`
- `src/components/ChargeCard.tsx`
- `src/components/ChatRoom.tsx`
- `src/components/NotificationBar.tsx`

### Created (new)
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/TopHeader.tsx`
- `src/components/ui/BottomNav.tsx`
- `src/components/ui/StatusBadge.tsx`
- `src/app/matching/page.tsx`
- `src/app/booking/confirmed/page.tsx`
- `src/app/profile/settings/page.tsx`
- `src/app/history/page.tsx`
- `src/app/notifications/page.tsx`
