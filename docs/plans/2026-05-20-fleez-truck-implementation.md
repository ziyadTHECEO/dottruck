# FLEEZ TRUCK — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the FLEEZ TRUCK MVP — une plateforme web de matching camion/remorque pour transporteurs marocains, avec chat temps réel et algorithme de matching Type A+B+C.

**Architecture:** Next.js 16 App Router pour le frontend, Supabase pour la base de données PostgreSQL + Auth + Realtime chat. L'algo de matching est une fonction pure testée en TDD. L'app est déployée sur Vercel et configurée comme PWA.

**Tech Stack:** Next.js 16, Tailwind CSS, Supabase JS v2, Jest (tests unitaires), Vercel (déploiement)

**Design doc :** `docs/plans/2026-05-20-fleez-truck-design.md`

---

## Task 1: Initialisation du projet Next.js

**Files:**
- Create: `package.json` (auto-généré)
- Create: `.env.local`
- Create: `.gitignore`

**Step 1: Créer le projet Next.js**

```bash
cd "/Users/latoufimohamedziyad/Desktop/FLEEZ TRUCK"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Répondre : Yes à tout ce qui est proposé.

**Step 2: Installer les dépendances Supabase + utilitaires**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install --save-dev jest @testing-library/jest-dom @testing-library/react jest-environment-jsdom
```

**Step 3: Créer `.env.local`**

```env
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=VOTRE_ANON_KEY
```

(Remplacer avec les vraies valeurs depuis le dashboard Supabase → Settings → API)

**Step 4: Configurer Jest — créer `jest.config.js`**

```js
const nextJest = require('next/jest')
const createJestConfig = nextJest({ dir: './' })
module.exports = createJestConfig({
  setupFilesAfterFramework: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
})
```

**Step 5: Créer `jest.setup.js`**

```js
import '@testing-library/jest-dom'
```

**Step 6: Ajouter script test dans `package.json`**

Dans la section `"scripts"`, ajouter :
```json
"test": "jest",
"test:watch": "jest --watch"
```

**Step 7: Vérifier que l'app démarre**

```bash
npm run dev
```

Ouvrir http://localhost:3000 — doit afficher la page Next.js par défaut.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with Supabase and Jest

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Schéma de base de données Supabase

**Files:**
- Create: `supabase/schema.sql`

**Step 1: Créer le fichier de schema**

Créer `supabase/schema.sql` :

```sql
-- Activer l'extension UUID
create extension if not exists "uuid-ossp";

-- TABLE USERS (complète les données auth de Supabase)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text check (role in ('expéditeur', 'transporteur')) not null,
  ville text,
  phone text,
  nom text,
  created_at timestamptz default now()
);

-- TABLE PROFILS TRANSPORTEUR
create table public.transporteur_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade unique,
  type text check (type in ('A', 'B', 'C')) not null,
  description_vehicule text,
  photo_url text,
  score int default 0,
  penalites int default 0,
  disponible boolean default true
);

-- TABLE CHARGES
create table public.charges (
  id uuid default uuid_generate_v4() primary key,
  expediteur_id uuid references public.users(id) on delete cascade,
  type_requis text check (type_requis in ('camion', 'remorque', 'les_deux')) not null,
  ville_depart text not null,
  ville_arrivee text not null,
  description text,
  poids_kg int,
  prix_total_mad int not null,
  statut text check (statut in ('ouverte', 'matchée', 'terminée', 'annulée')) default 'ouverte',
  created_at timestamptz default now()
);

-- TABLE MATCHINGS
create table public.matchings (
  id uuid default uuid_generate_v4() primary key,
  charge_id uuid references public.charges(id) on delete cascade,
  transporteur_camion_id uuid references public.users(id),
  transporteur_remorque_id uuid references public.users(id),
  transporteur_complet_id uuid references public.users(id),
  prix_camion_mad int,
  prix_remorque_mad int,
  statut text check (statut in ('proposé', 'en_négociation', 'accepté', 'refusé')) default 'proposé',
  created_at timestamptz default now()
);

-- TABLE MESSAGES (chat)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  matching_id uuid references public.matchings(id) on delete cascade,
  sender_id uuid references public.users(id),
  contenu text not null,
  created_at timestamptz default now()
);

-- TABLE RATINGS
create table public.ratings (
  id uuid default uuid_generate_v4() primary key,
  from_user_id uuid references public.users(id),
  to_user_id uuid references public.users(id),
  charge_id uuid references public.charges(id),
  note int check (note between 1 and 5),
  commentaire text,
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table public.users enable row level security;
alter table public.transporteur_profiles enable row level security;
alter table public.charges enable row level security;
alter table public.matchings enable row level security;
alter table public.messages enable row level security;
alter table public.ratings enable row level security;

-- POLICIES : users
create policy "Users can read all users" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- POLICIES : transporteur_profiles
create policy "Public profiles visible" on public.transporteur_profiles for select using (true);
create policy "Own profile editable" on public.transporteur_profiles for all using (auth.uid() = user_id);

-- POLICIES : charges
create policy "All can read open charges" on public.charges for select using (true);
create policy "Expéditeur inserts own charges" on public.charges for insert with check (auth.uid() = expediteur_id);
create policy "Expéditeur updates own charges" on public.charges for update using (auth.uid() = expediteur_id);

-- POLICIES : matchings
create policy "Parties can read their matchings" on public.matchings for select using (
  auth.uid() = transporteur_camion_id or
  auth.uid() = transporteur_remorque_id or
  auth.uid() = transporteur_complet_id or
  auth.uid() = (select expediteur_id from public.charges where id = charge_id)
);
create policy "Transporteurs can create matchings" on public.matchings for insert with check (true);
create policy "Parties can update matchings" on public.matchings for update using (
  auth.uid() = transporteur_camion_id or
  auth.uid() = transporteur_remorque_id or
  auth.uid() = transporteur_complet_id
);

-- POLICIES : messages
create policy "Parties can read messages" on public.messages for select using (true);
create policy "Authenticated users can send messages" on public.messages for insert with check (auth.uid() = sender_id);

-- POLICIES : ratings
create policy "Public ratings" on public.ratings for select using (true);
create policy "Authenticated can rate" on public.ratings for insert with check (auth.uid() = from_user_id);

-- TRIGGER : créer profil user automatiquement après inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role, nom)
  values (new.id, new.email, new.raw_user_meta_data->>'role', new.raw_user_meta_data->>'nom');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Step 2: Exécuter le schema dans Supabase**

1. Ouvrir le dashboard Supabase → SQL Editor
2. Coller le contenu de `supabase/schema.sql`
3. Cliquer "Run"
4. Vérifier dans Table Editor que les 6 tables sont créées

**Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add Supabase database schema with RLS policies

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Client Supabase + Middleware d'authentification

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/middleware.ts`

**Step 1: Créer `src/lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 2: Créer `src/lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

**Step 3: Créer `src/middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const protectedPaths = ['/dashboard', '/charges', '/profile', '/matching', '/chat', '/notifications']
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

**Step 4: Commit**

```bash
git add src/lib/supabase/ src/middleware.ts
git commit -m "feat: add Supabase client helpers and auth middleware

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Algorithme de Matching (TDD)

**Files:**
- Create: `src/lib/matching.ts`
- Create: `src/lib/__tests__/matching.test.ts`

**Step 1: Écrire les tests en premier**

Créer `src/lib/__tests__/matching.test.ts` :

```typescript
import { findMatches } from '../matching'

const makeUser = (id: string, type: 'A' | 'B' | 'C', ville: string) => ({
  id,
  type,
  ville,
  disponible: true,
})

describe('findMatches', () => {
  it('retourne un Type C en priorité si disponible dans la même ville', () => {
    const transporteurs = [
      makeUser('c1', 'C', 'Safi'),
      makeUser('a1', 'A', 'Safi'),
      makeUser('b1', 'B', 'Safi'),
    ]
    const result = findMatches(transporteurs, 'Safi')
    expect(result.type).toBe('complet')
    expect(result.transporteurCompletId).toBe('c1')
  })

  it('retourne une paire A+B si pas de Type C disponible', () => {
    const transporteurs = [
      makeUser('a1', 'A', 'Safi'),
      makeUser('b1', 'B', 'Safi'),
    ]
    const result = findMatches(transporteurs, 'Safi')
    expect(result.type).toBe('paire')
    expect(result.camionId).toBe('a1')
    expect(result.remorqueId).toBe('b1')
  })

  it('retourne null si aucun match possible', () => {
    const transporteurs = [makeUser('a1', 'A', 'Safi')]
    const result = findMatches(transporteurs, 'Safi')
    expect(result).toBeNull()
  })

  it('ignore les transporteurs dans une autre ville', () => {
    const transporteurs = [
      makeUser('c1', 'C', 'Casablanca'),
      makeUser('a1', 'A', 'Safi'),
      makeUser('b1', 'B', 'Safi'),
    ]
    const result = findMatches(transporteurs, 'Safi')
    expect(result.type).toBe('paire')
  })

  it('ignore les transporteurs non disponibles', () => {
    const transporteurs = [
      { id: 'c1', type: 'C' as const, ville: 'Safi', disponible: false },
      makeUser('a1', 'A', 'Safi'),
      makeUser('b1', 'B', 'Safi'),
    ]
    const result = findMatches(transporteurs, 'Safi')
    expect(result.type).toBe('paire')
  })
})
```

**Step 2: Lancer les tests — vérifier qu'ils échouent**

```bash
npm test src/lib/__tests__/matching.test.ts
```

Résultat attendu : FAIL — `findMatches` n'existe pas encore.

**Step 3: Implémenter `src/lib/matching.ts`**

```typescript
interface Transporteur {
  id: string
  type: 'A' | 'B' | 'C'
  ville: string
  disponible: boolean
}

interface MatchComplet {
  type: 'complet'
  transporteurCompletId: string
}

interface MatchPaire {
  type: 'paire'
  camionId: string
  remorqueId: string
}

export function findMatches(
  transporteurs: Transporteur[],
  villeDepart: string
): MatchComplet | MatchPaire | null {
  const disponibles = transporteurs.filter(
    t => t.disponible && t.ville === villeDepart
  )

  // Priorité 1 : Type C (camion + remorque complet)
  const typeC = disponibles.find(t => t.type === 'C')
  if (typeC) {
    return { type: 'complet', transporteurCompletId: typeC.id }
  }

  // Priorité 2 : Paire Type A + Type B
  const typeA = disponibles.find(t => t.type === 'A')
  const typeB = disponibles.find(t => t.type === 'B')
  if (typeA && typeB) {
    return { type: 'paire', camionId: typeA.id, remorqueId: typeB.id }
  }

  return null
}
```

**Step 4: Lancer les tests — vérifier qu'ils passent**

```bash
npm test src/lib/__tests__/matching.test.ts
```

Résultat attendu : PASS (5 tests verts)

**Step 5: Commit**

```bash
git add src/lib/matching.ts src/lib/__tests__/matching.test.ts
git commit -m "feat: implement matching algorithm with TDD (Type A+B+C)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Layout général + Landing Page

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/globals.css`

**Step 1: Mettre à jour `src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FLEEZ TRUCK — Transport Safi',
  description: 'Plateforme de matching camion + remorque pour transporteurs marocains',
  manifest: '/manifest.json',
  themeColor: '#f97316',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

**Step 2: Landing page `src/app/page.tsx`**

```typescript
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div>
          <h1 className="text-4xl font-bold text-orange-600">FLEEZ TRUCK</h1>
          <p className="text-gray-600 mt-2">Transport intelligent au Maroc</p>
        </div>

        {/* Choix du rôle */}
        <div className="space-y-4">
          <p className="text-lg font-medium text-gray-800">Qui êtes-vous ?</p>

          <Link href="/auth/signup?role=transporteur"
            className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-xl transition text-lg">
            Je suis Transporteur
            <span className="block text-sm font-normal opacity-80 mt-1">
              J&apos;ai un camion, une remorque, ou les deux
            </span>
          </Link>

          <Link href="/auth/signup?role=expéditeur"
            className="block w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 rounded-xl transition text-lg border-2 border-gray-200">
            Je suis Expéditeur
            <span className="block text-sm font-normal text-gray-500 mt-1">
              J&apos;ai des marchandises à transporter
            </span>
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-orange-600 font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  )
}
```

**Step 3: Vérifier visuellement**

```bash
npm run dev
```

Ouvrir http://localhost:3000 — doit afficher la landing page orange avec les 2 boutons.

**Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "feat: add landing page with role selection

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Authentification — Inscription

**Files:**
- Create: `src/app/auth/signup/page.tsx`
- Create: `src/app/auth/actions.ts`

**Step 1: Server actions d'auth `src/app/auth/actions.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = createClient()

  const role = formData.get('role') as string
  const nom = formData.get('nom') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const phone = formData.get('phone') as string
  const ville = formData.get('ville') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, nom, phone, ville },
    },
  })

  if (error) {
    return redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`)
  }

  // Si transporteur, rediriger vers setup du profil véhicule
  if (role === 'transporteur') {
    return redirect('/profile/setup')
  }

  return redirect('/dashboard')
}

export async function signIn(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
  }

  return redirect('/dashboard')
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  return redirect('/')
}
```

**Step 2: Page inscription `src/app/auth/signup/page.tsx`**

```typescript
import { signUp } from '../actions'

export default function SignUpPage({
  searchParams,
}: {
  searchParams: { role?: string; error?: string }
}) {
  const role = searchParams.role || 'transporteur'
  const error = searchParams.error

  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
          <p className="text-gray-500 mt-1">
            Inscription en tant que{' '}
            <span className="font-semibold text-orange-600 capitalize">{role}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={signUp} className="space-y-4">
          <input type="hidden" name="role" value={role} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet
            </label>
            <input
              name="nom" type="text" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ville
            </label>
            <select
              name="ville" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Choisir une ville</option>
              <option value="Safi">Safi</option>
              <option value="Casablanca">Casablanca</option>
              <option value="Marrakech">Marrakech</option>
              <option value="Agadir">Agadir</option>
              <option value="Rabat">Rabat</option>
              <option value="Tanger">Tanger</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              name="phone" type="tel" required
              placeholder="+212 6XX XXX XXX"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              name="email" type="email" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              name="password" type="password" required minLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition"
          >
            Créer mon compte
          </button>
        </form>
      </div>
    </main>
  )
}
```

**Step 3: Tester l'inscription**

1. Aller sur http://localhost:3000
2. Cliquer "Je suis Transporteur"
3. Remplir le formulaire avec un vrai email
4. Vérifier dans Supabase → Auth → Users que l'utilisateur est créé
5. Vérifier dans Table Editor → users que le profil est créé

**Step 4: Commit**

```bash
git add src/app/auth/
git commit -m "feat: add signup page and server actions

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Page de Connexion

**Files:**
- Create: `src/app/auth/login/page.tsx`

**Step 1: Créer `src/app/auth/login/page.tsx`**

```typescript
import Link from 'next/link'
import { signIn } from '../actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const error = searchParams.error

  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
          <p className="text-gray-500 mt-1">Bienvenue sur FLEEZ TRUCK</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={signIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email" type="email" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              name="password" type="password" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition"
          >
            Se connecter
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center">
          Pas encore de compte ?{' '}
          <Link href="/" className="text-orange-600 font-medium hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </main>
  )
}
```

**Step 2: Tester la connexion**

1. Aller sur http://localhost:3000/auth/login
2. Se connecter avec le compte créé à la Task 6
3. Doit rediriger vers /dashboard (qui n'existe pas encore = 404 normal)

**Step 3: Commit**

```bash
git add src/app/auth/login/
git commit -m "feat: add login page

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Setup Profil Transporteur (Type A/B/C)

**Files:**
- Create: `src/app/profile/setup/page.tsx`
- Create: `src/app/profile/actions.ts`

**Step 1: Créer `src/app/profile/actions.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function setupTransporteurProfile(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const type = formData.get('type') as 'A' | 'B' | 'C'
  const description_vehicule = formData.get('description_vehicule') as string

  const { error } = await supabase.from('transporteur_profiles').upsert({
    user_id: user.id,
    type,
    description_vehicule,
  })

  if (error) {
    return redirect(`/profile/setup?error=${encodeURIComponent(error.message)}`)
  }

  return redirect('/dashboard')
}
```

**Step 2: Créer `src/app/profile/setup/page.tsx`**

```typescript
import { setupTransporteurProfile } from '../actions'

export default function ProfileSetupPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon véhicule</h1>
          <p className="text-gray-500 mt-1">Dites-nous ce que vous avez</p>
        </div>

        {searchParams.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {decodeURIComponent(searchParams.error)}
          </div>
        )}

        <form action={setupTransporteurProfile} className="space-y-6">
          <div className="space-y-3">
            <p className="font-medium text-gray-700">Je possède :</p>

            <label className="flex items-start gap-3 border-2 border-gray-200 hover:border-orange-400 rounded-xl p-4 cursor-pointer has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
              <input type="radio" name="type" value="C" className="mt-1" required />
              <div>
                <p className="font-semibold text-gray-800">Camion + Remorque</p>
                <p className="text-sm text-gray-500">J&apos;ai les deux, je peux accepter toute charge</p>
              </div>
            </label>

            <label className="flex items-start gap-3 border-2 border-gray-200 hover:border-orange-400 rounded-xl p-4 cursor-pointer has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
              <input type="radio" name="type" value="A" className="mt-1" />
              <div>
                <p className="font-semibold text-gray-800">Camion seulement</p>
                <p className="text-sm text-gray-500">Je cherche un partenaire avec une remorque</p>
              </div>
            </label>

            <label className="flex items-start gap-3 border-2 border-gray-200 hover:border-orange-400 rounded-xl p-4 cursor-pointer has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
              <input type="radio" name="type" value="B" className="mt-1" />
              <div>
                <p className="font-semibold text-gray-800">Remorque seulement</p>
                <p className="text-sm text-gray-500">Je cherche un partenaire avec un camion</p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description du véhicule (optionnel)
            </label>
            <textarea
              name="description_vehicule"
              rows={3}
              placeholder="Ex: Camion Mercedes 15 tonnes, immatriculé Safi, disponible weekend..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition"
          >
            Continuer
          </button>
        </form>
      </div>
    </main>
  )
}
```

**Step 3: Tester le setup profil**

1. S'inscrire comme Transporteur
2. Doit rediriger vers /profile/setup
3. Choisir "Camion seulement" + description
4. Vérifier dans Supabase → transporteur_profiles que le profil est créé

**Step 4: Commit**

```bash
git add src/app/profile/
git commit -m "feat: add transporteur profile setup (Type A/B/C selection)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Dashboard Transporteur

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/ChargeCard.tsx`

**Step 1: Créer `src/components/ChargeCard.tsx`**

```typescript
interface Charge {
  id: string
  ville_depart: string
  ville_arrivee: string
  type_requis: string
  poids_kg: number
  prix_total_mad: number
  statut: string
}

export function ChargeCard({ charge }: { charge: Charge }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-gray-900">
            {charge.ville_depart} → {charge.ville_arrivee}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {charge.poids_kg} kg · {charge.type_requis}
          </p>
        </div>
        <span className="text-orange-600 font-bold text-lg">
          {charge.prix_total_mad} MAD
        </span>
      </div>
      <a
        href={`/charges/${charge.id}`}
        className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition"
      >
        Voir détails
      </a>
    </div>
  )
}
```

**Step 2: Créer `src/app/dashboard/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChargeCard } from '@/components/ChargeCard'
import { signOut } from '@/app/auth/actions'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  // Récupérer le profil user
  const { data: userProfile } = await supabase
    .from('users')
    .select('*, transporteur_profiles(*)')
    .eq('id', user.id)
    .single()

  // Récupérer les charges ouvertes
  const { data: charges } = await supabase
    .from('charges')
    .select('*')
    .eq('statut', 'ouverte')
    .order('created_at', { ascending: false })

  const transporteurProfile = userProfile?.transporteur_profiles

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-orange-600">FLEEZ TRUCK</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{userProfile?.nom}</span>
          <form action={signOut}>
            <button type="submit" className="text-sm text-gray-500 hover:text-red-500">
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Bannière profil transporteur */}
        {transporteurProfile && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            {transporteurProfile.type === 'A' && (
              <div>
                <p className="font-semibold text-orange-800">Vous avez un camion</p>
                <p className="text-sm text-orange-600 mt-1">
                  Cherchez une remorque partenaire pour accepter plus de charges
                </p>
                <a href="/matching/remorque"
                  className="inline-block mt-2 bg-orange-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-600 transition">
                  Trouver une remorque
                </a>
              </div>
            )}
            {transporteurProfile.type === 'B' && (
              <div>
                <p className="font-semibold text-orange-800">Vous avez une remorque</p>
                <p className="text-sm text-orange-600 mt-1">
                  Cherchez un camion partenaire pour accepter des charges ensemble
                </p>
                <a href="/matching/camion"
                  className="inline-block mt-2 bg-orange-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-600 transition">
                  Trouver un camion
                </a>
              </div>
            )}
            {transporteurProfile.type === 'C' && (
              <p className="font-semibold text-orange-800">
                Camion + Remorque · Vous pouvez accepter toutes les charges
              </p>
            )}
          </div>
        )}

        {/* Liste des charges */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Charges disponibles ({charges?.length || 0})
          </h2>
          {charges && charges.length > 0 ? (
            <div className="space-y-3">
              {charges.map(charge => (
                <ChargeCard key={charge.id} charge={charge} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Aucune charge disponible pour le moment
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
```

**Step 3: Tester le dashboard**

1. Se connecter avec un compte Transporteur
2. Doit voir le dashboard avec la bannière selon le type (A/B/C)
3. Créer une charge manuellement dans Supabase → Table Editor → charges
4. Vérifier qu'elle apparaît dans le dashboard

**Step 4: Commit**

```bash
git add src/app/dashboard/ src/components/
git commit -m "feat: add transporteur dashboard with charge list and type banner

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Publication de Charge (Expéditeur)

**Files:**
- Create: `src/app/charges/new/page.tsx`
- Create: `src/app/charges/actions.ts`

**Step 1: Créer `src/app/charges/actions.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { findMatches } from '@/lib/matching'

export async function publishCharge(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const type_requis = formData.get('type_requis') as string
  const ville_depart = formData.get('ville_depart') as string
  const ville_arrivee = formData.get('ville_arrivee') as string
  const description = formData.get('description') as string
  const poids_kg = parseInt(formData.get('poids_kg') as string)
  const prix_total_mad = parseInt(formData.get('prix_total_mad') as string)

  // Créer la charge
  const { data: charge, error } = await supabase.from('charges').insert({
    expediteur_id: user.id,
    type_requis,
    ville_depart,
    ville_arrivee,
    description,
    poids_kg,
    prix_total_mad,
  }).select().single()

  if (error) {
    return redirect(`/charges/new?error=${encodeURIComponent(error.message)}`)
  }

  // Si charge nécessite camion + remorque, lancer le matching
  if (type_requis === 'les_deux') {
    const { data: transporteurs } = await supabase
      .from('transporteur_profiles')
      .select('user_id, type, disponible, users(ville)')
      .eq('disponible', true)

    const formatted = (transporteurs || []).map(t => ({
      id: t.user_id,
      type: t.type as 'A' | 'B' | 'C',
      ville: (t.users as any)?.ville || '',
      disponible: t.disponible,
    }))

    const match = findMatches(formatted, ville_depart)

    if (match) {
      if (match.type === 'complet') {
        await supabase.from('matchings').insert({
          charge_id: charge.id,
          transporteur_complet_id: match.transporteurCompletId,
        })
      } else {
        await supabase.from('matchings').insert({
          charge_id: charge.id,
          transporteur_camion_id: match.camionId,
          transporteur_remorque_id: match.remorqueId,
        })
      }

      await supabase.from('charges').update({ statut: 'matchée' }).eq('id', charge.id)
    }
  }

  return redirect('/charges')
}
```

**Step 2: Créer `src/app/charges/new/page.tsx`**

```typescript
import { publishCharge } from '../actions'

const villes = ['Safi', 'Casablanca', 'Marrakech', 'Agadir', 'Rabat', 'Tanger', 'Fès', 'Meknès']

export default function NewChargePage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Publier une charge</h1>

        {searchParams.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {decodeURIComponent(searchParams.error)}
          </div>
        )}

        <form action={publishCharge} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de transport</label>
            <select name="type_requis" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="les_deux">Camion + Remorque</option>
              <option value="camion">Camion seul</option>
              <option value="remorque">Remorque seule</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Départ</label>
              <select name="ville_depart" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                {villes.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arrivée</label>
              <select name="ville_arrivee" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                {villes.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" rows={2}
              placeholder="Type de marchandise, conditions particulières..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poids (kg)</label>
              <input name="poids_kg" type="number" required min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix (MAD)</label>
              <input name="prix_total_mad" type="number" required min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <button type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition">
            Publier la charge
          </button>
        </form>
      </div>
    </main>
  )
}
```

**Step 3: Tester le matching end-to-end**

1. Créer 2 comptes transporteur : un Type A (Safi), un Type B (Safi)
2. Créer un compte expéditeur
3. Publier une charge "Camion + Remorque" depuis Safi
4. Vérifier dans Supabase → matchings qu'un matching a été créé avec camion_id + remorque_id
5. Vérifier que la charge est passée en statut "matchée"

**Step 4: Commit**

```bash
git add src/app/charges/
git commit -m "feat: add charge publication with automatic matching trigger

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 11: Chat en temps réel (Supabase Realtime)

**Files:**
- Create: `src/app/chat/[matchingId]/page.tsx`
- Create: `src/components/ChatRoom.tsx`

**Step 1: Créer le composant client `src/components/ChatRoom.tsx`**

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  contenu: string
  sender_id: string
  created_at: string
  sender_nom?: string
}

interface ChatRoomProps {
  matchingId: string
  currentUserId: string
  prixTotal: number
}

export function ChatRoom({ matchingId, currentUserId, prixTotal }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const commission = Math.round(prixTotal * 0.1)
  const netAPayer = prixTotal - commission

  useEffect(() => {
    // Charger messages existants
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('matching_id', matchingId)
        .order('created_at', { ascending: true })
      setMessages(data || [])
    }
    loadMessages()

    // Écouter nouveaux messages en temps réel
    const channel = supabase
      .channel(`chat:${matchingId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `matching_id=eq.${matchingId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchingId, supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    await supabase.from('messages').insert({
      matching_id: matchingId,
      sender_id: currentUserId,
      contenu: newMessage.trim(),
    })

    setNewMessage('')
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Résumé paiement */}
      <div className="bg-orange-50 border-b border-orange-200 p-4">
        <p className="text-sm text-gray-700 font-medium">Répartition du paiement</p>
        <div className="flex justify-between mt-1 text-sm">
          <span>Prix total : <strong>{prixTotal} MAD</strong></span>
          <span>Fleez (10%) : <strong>{commission} MAD</strong></span>
          <span>Net à partager : <strong className="text-orange-600">{netAPayer} MAD</strong></span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
              msg.sender_id === currentUserId
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-gray-200 text-gray-800'
            }`}>
              {msg.contenu}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4 flex gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Votre message ou proposition de prix..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          onClick={sendMessage}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl font-medium transition"
        >
          Envoyer
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Créer `src/app/chat/[matchingId]/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatRoom } from '@/components/ChatRoom'

export default async function ChatPage({
  params,
}: {
  params: { matchingId: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const { data: matching } = await supabase
    .from('matchings')
    .select('*, charges(*)')
    .eq('id', params.matchingId)
    .single()

  if (!matching) return redirect('/dashboard')

  const charge = matching.charges as any

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <a href="/dashboard" className="text-gray-500 hover:text-gray-800">← Retour</a>
        <div>
          <p className="font-semibold text-gray-900">
            {charge.ville_depart} → {charge.ville_arrivee}
          </p>
          <p className="text-sm text-gray-500">Négociation en cours</p>
        </div>
      </header>

      <ChatRoom
        matchingId={params.matchingId}
        currentUserId={user.id}
        prixTotal={charge.prix_total_mad}
      />
    </div>
  )
}
```

**Step 3: Tester le chat**

1. Connecter 2 comptes transporteurs dans 2 onglets/navigateurs différents
2. Naviguer vers `/chat/[matching_id]` (copier l'ID depuis Supabase → matchings)
3. Envoyer un message → doit apparaître en temps réel dans l'autre onglet
4. Vérifier le calcul de commission affiché

**Step 4: Commit**

```bash
git add src/app/chat/ src/components/ChatRoom.tsx
git commit -m "feat: add realtime chat with Supabase Realtime and price split display

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 12: Système de Rating

**Files:**
- Create: `src/app/charges/[id]/rate/page.tsx`
- Modify: `src/app/charges/actions.ts`

**Step 1: Ajouter l'action rate dans `src/app/charges/actions.ts`**

Ajouter à la fin du fichier existant :

```typescript
export async function submitRating(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const to_user_id = formData.get('to_user_id') as string
  const charge_id = formData.get('charge_id') as string
  const note = parseInt(formData.get('note') as string)
  const commentaire = formData.get('commentaire') as string

  await supabase.from('ratings').insert({
    from_user_id: user.id,
    to_user_id,
    charge_id,
    note,
    commentaire,
  })

  // Recalculer le score moyen du transporteur noté
  const { data: allRatings } = await supabase
    .from('ratings')
    .select('note')
    .eq('to_user_id', to_user_id)

  if (allRatings && allRatings.length > 0) {
    const avg = Math.round(allRatings.reduce((sum, r) => sum + r.note, 0) / allRatings.length)
    await supabase
      .from('transporteur_profiles')
      .update({ score: avg })
      .eq('user_id', to_user_id)
  }

  return redirect('/dashboard')
}
```

**Step 2: Créer `src/app/charges/[id]/rate/page.tsx`**

```typescript
import { submitRating } from '../../actions'

export default function RatePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { userId?: string; nom?: string }
}) {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Évaluer le transporteur</h1>
          <p className="text-gray-500 mt-1">{searchParams.nom}</p>
        </div>

        <form action={submitRating} className="space-y-5">
          <input type="hidden" name="charge_id" value={params.id} />
          <input type="hidden" name="to_user_id" value={searchParams.userId} />

          <div>
            <p className="font-medium text-gray-700 mb-3">Note globale</p>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map(n => (
                <label key={n} className="flex-1">
                  <input type="radio" name="note" value={n} required className="sr-only" />
                  <span className="block text-center text-2xl cursor-pointer hover:scale-110 transition">
                    {n <= 3 ? '⭐' : n === 4 ? '⭐' : '⭐'}
                    <span className="block text-xs text-gray-500">{n}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commentaire (optionnel)
            </label>
            <textarea
              name="commentaire" rows={3}
              placeholder="À l'heure ? Professionnel ? Recommandé ?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition">
            Envoyer l&apos;évaluation
          </button>
        </form>
      </div>
    </main>
  )
}
```

**Step 3: Commit**

```bash
git add src/app/charges/
git commit -m "feat: add rating system with automatic score recalculation

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 13: PWA Setup (installable sur mobile)

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Modify: `src/app/layout.tsx`

**Step 1: Créer `public/manifest.json`**

```json
{
  "name": "FLEEZ TRUCK",
  "short_name": "Fleez",
  "description": "Matching camion + remorque au Maroc",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fff7ed",
  "theme_color": "#f97316",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Step 2: Créer `public/sw.js` (service worker minimal)**

```javascript
const CACHE_NAME = 'fleez-v1'
const STATIC = ['/', '/auth/login', '/dashboard']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC)))
})

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  )
})
```

**Step 3: Ajouter le script SW dans `src/app/layout.tsx`**

Ajouter avant la fermeture de `<body>` :

```typescript
<script dangerouslySetInnerHTML={{
  __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js') }`
}} />
```

**Step 4: Créer des icônes placeholder**

Créer des images 192x192 et 512x512 orange avec "FT" pour le logo et les placer dans `/public/`.
(Utiliser un outil comme Canva ou Figma pour créer les icônes réelles)

**Step 5: Vérifier l'installabilité**

1. Ouvrir Chrome DevTools → Application → Manifest
2. Doit afficher le manifest sans erreurs
3. Sur mobile, Chrome doit proposer "Ajouter à l'écran d'accueil"

**Step 6: Commit**

```bash
git add public/
git commit -m "feat: add PWA manifest and service worker for mobile installation

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 14: Déploiement sur Vercel

**Step 1: Créer un compte Vercel**

Aller sur vercel.com → Sign up with GitHub

**Step 2: Pusher le code sur GitHub**

```bash
# Créer un repo GitHub nommé "fleez-truck" depuis github.com
git remote add origin https://github.com/VOTRE_USERNAME/fleez-truck.git
git push -u origin main
```

**Step 3: Connecter Vercel au repo GitHub**

1. Vercel dashboard → New Project
2. Sélectionner le repo `fleez-truck`
3. Dans "Environment Variables", ajouter :
   - `NEXT_PUBLIC_SUPABASE_URL` = votre URL Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = votre clé Supabase
4. Cliquer Deploy

**Step 4: Vérifier le déploiement**

1. Vercel donnera une URL : `https://fleez-truck.vercel.app`
2. Tester l'inscription + connexion sur l'URL de prod
3. Tester la publication d'une charge
4. Vérifier le chat en temps réel

**Step 5: Configurer le domaine (optionnel)**

Dans Vercel → Settings → Domains, ajouter un domaine personnalisé si disponible.

**Step 6: Commit final**

```bash
git add .
git commit -m "chore: production deployment to Vercel complete

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Résumé des tâches

| # | Tâche | Statut |
|---|-------|--------|
| 1 | Init projet Next.js | ⬜ |
| 2 | Schema Supabase | ⬜ |
| 3 | Client Supabase + Middleware | ⬜ |
| 4 | Algorithme matching (TDD) | ⬜ |
| 5 | Landing page | ⬜ |
| 6 | Inscription | ⬜ |
| 7 | Connexion | ⬜ |
| 8 | Setup profil transporteur | ⬜ |
| 9 | Dashboard transporteur | ⬜ |
| 10 | Publication charge | ⬜ |
| 11 | Chat temps réel | ⬜ |
| 12 | Rating | ⬜ |
| 13 | PWA | ⬜ |
| 14 | Déploiement Vercel | ⬜ |

---

## Phase 2 — Après validation du MVP

Une fois le MVP live et validé avec les premiers users :
- Intégration Capacitor pour empaqueter l'app → Play Store + App Store
- Push notifications natives
- Paiement en ligne (CMI / PayDunya)
- Wallet transporteur
