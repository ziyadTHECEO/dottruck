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
