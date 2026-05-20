# FLEEZ TRUCK — Design Document
**Date :** 2026-05-20
**Statut :** Validé

---

## Contexte

Plateforme de mise en relation logistique pour les transporteurs de Safi (Maroc). Problème principal : beaucoup de propriétaires ont SOIT un camion SOIT une remorque, pas les deux. FLEEZ TRUCK les matche automatiquement pour traiter des charges ensemble.

---

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Hébergement | Vercel (gratuit) |
| Mobile Phase 2 | Capacitor (empaquette le web en app native) |
| Stores | Play Store + App Store (Phase 2) |

---

## Types d'utilisateurs

### Expéditeur
- Publie des charges à transporter
- Reçoit des propositions de transporteurs (individuels ou en paire)
- Choisit la meilleure option

### Transporteur — 3 types de profil

| Type | Description |
|------|-------------|
| A | Camion seul — cherche une remorque partenaire |
| B | Remorque seule — cherche un camion partenaire |
| C | Camion + Remorque — peut accepter seul toute charge |

---

## Algorithme de Matching

```
1. Expéditeur publie charge "Besoin camion + remorque"

2. Système cherche en priorité :
   a) Transporteur Type C disponible dans la même ville
      → Si trouvé : proposé directement à l'expéditeur

   b) Si aucun Type C :
      → Chercher tous les camions (Type A) disponibles
      → Chercher toutes les remorques (Type B) disponibles
      → Créer les paires possibles
      → Notifier les deux transporteurs : "Match trouvé"

3. Les deux transporteurs ouvrent le chat
4. Ils négocient le split de paiement
5. Si accord : les deux acceptent la charge ensemble
6. Si pas d'accord : charge revient libre
```

---

## Écrans (MVP)

### Commun
- `/` — Landing page (choix : Expéditeur / Transporteur)
- `/auth/signup` — Inscription avec choix du rôle
- `/auth/login` — Connexion
- `/profile` — Mon profil + véhicule + score
- `/notifications` — Alertes de matching

### Expéditeur
- `/charges/new` — Publier une charge (type requis : camion / remorque / les deux)
- `/charges` — Voir les propositions reçues
  - Option 1 : Type C (1 transporteur complet)
  - Option 2 : Paire A+B (2 transporteurs matchés ensemble)

### Transporteur Type A (Camion seul)
- `/dashboard` — Charges disponibles + prompt "Cherche une remorque ?"
- `/matching/camion` — Remorques disponibles à matcher
- `/chat/[id]` — Négociation avec propriétaire de remorque

### Transporteur Type B (Remorque seule)
- `/dashboard` — Charges disponibles + prompt "Cherche un camion ?"
- `/matching/remorque` — Camions disponibles à matcher
- `/chat/[id]` — Négociation avec propriétaire de camion

### Transporteur Type C (Camion + Remorque)
- `/dashboard` — Toutes les charges disponibles directement

---

## Base de Données (Supabase / PostgreSQL)

### `users`
```sql
id uuid PRIMARY KEY
email text UNIQUE NOT NULL
role text CHECK (role IN ('expéditeur', 'transporteur'))
ville text
phone text
created_at timestamptz DEFAULT now()
```

### `transporteur_profiles`
```sql
user_id uuid REFERENCES users(id)
type text CHECK (type IN ('A', 'B', 'C'))
description_vehicule text
photo_url text
score int DEFAULT 0
```

### `charges`
```sql
id uuid PRIMARY KEY
expéditeur_id uuid REFERENCES users(id)
type_requis text CHECK (type_requis IN ('camion', 'remorque', 'les_deux'))
ville_depart text
ville_arrivee text
description text
poids_kg int
prix_total_mad int
statut text CHECK (statut IN ('ouverte', 'matchée', 'terminée', 'annulée'))
created_at timestamptz DEFAULT now()
```

### `matchings`
```sql
id uuid PRIMARY KEY
charge_id uuid REFERENCES charges(id)
transporteur_camion_id uuid REFERENCES users(id) -- NULL si Type C
transporteur_remorque_id uuid REFERENCES users(id) -- NULL si Type C
transporteur_complet_id uuid REFERENCES users(id) -- NULL si paire A+B
prix_camion_mad int
prix_remorque_mad int
statut text CHECK (statut IN ('proposé', 'en_négociation', 'accepté', 'refusé'))
created_at timestamptz DEFAULT now()
```

### `messages`
```sql
id uuid PRIMARY KEY
matching_id uuid REFERENCES matchings(id)
sender_id uuid REFERENCES users(id)
contenu text
created_at timestamptz DEFAULT now()
```

### `ratings`
```sql
id uuid PRIMARY KEY
from_user_id uuid REFERENCES users(id)
to_user_id uuid REFERENCES users(id)
charge_id uuid REFERENCES charges(id)
note int CHECK (note BETWEEN 1 AND 5)
commentaire text
created_at timestamptz DEFAULT now()
```

---

## Paiement (MVP)

Le paiement est hors-ligne pour le MVP (cash ou virement). L'app calcule et affiche :

```
Prix total charge : 2000 MAD
Commission Fleez (10%) : 200 MAD
Montant net à partager : 1800 MAD

Split négocié via chat :
  → Camion (Transporteur A) : [X] MAD
  → Remorque (Transporteur B) : [Y] MAD
```

**Phase 2 :** Intégration CMI (Centre Monétique Interbancaire Maroc) ou PayDunya.

---

## Notifications

| Événement | Destinataire |
|-----------|-------------|
| Nouveau match trouvé | Transporteur A + B |
| Partenaire accepte/refuse | Chat alert |
| Charge acceptée | Expéditeur |
| Message dans le chat | Push notification PWA |
| Nouveau rating reçu | Profil |

---

## Système de Pénalité

- Annulation après accord → Score -1
- Score visible sur le profil (public)
- 3 pénalités → suspension temporaire du compte

---

## Edge Cases

1. **Camion accepte, Remorque refuse** → Charge revient libre, Camion cherche autre partenaire
2. **Annulation après accord** → Pénalité (-1 score) appliquée
3. **Pas d'accord sur le split** → Chat reste ouvert, charge reste libre après timeout
4. **Aucun Type C, aucune paire A+B** → "Aucun transporteur disponible, réessayez plus tard"

---

## Phases de Déploiement

### Phase 1 — MVP Web
- Authentification (Supabase Auth)
- Profils transporteur (A/B/C) + expéditeur
- Publication de charges
- Algorithme de matching
- Chat temps réel (Supabase Realtime)
- Système de rating
- PWA (installable sur mobile)

### Phase 2 — Stores
- Capacitor pour empaqueter en app native
- Soumission Play Store (Google)
- Soumission App Store (Apple)
- Push notifications natives

### Phase 3 — Paiement en ligne
- Intégration CMI ou PayDunya
- Wallet transporteur dans l'app
- Historique des paiements
