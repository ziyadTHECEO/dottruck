-- ============================================
-- DOTTRUCK - Schema SQL complet pour Supabase
-- Executer dans l'editeur SQL de Supabase
-- ============================================

create extension if not exists "uuid-ossp";

-- 1. TABLE USERS
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text check (role in ('expéditeur', 'transporteur')) not null,
  ville text,
  phone text,
  nom text,
  avatar_url text,
  preferred_language text default 'ar',
  created_at timestamptz default now()
);

-- 2. TABLE TRANSPORTEUR_PROFILES
create table if not exists public.transporteur_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade unique,
  type text check (type in ('A', 'B', 'C')) not null,
  description_vehicule text,
  photo_url text,
  score int default 0,
  penalites int default 0,
  disponible boolean default true,
  capacite_tonnes int
);

-- 3. TABLE CHARGES
create table if not exists public.charges (
  id uuid default uuid_generate_v4() primary key,
  expediteur_id uuid references public.users(id) on delete cascade,
  type_requis text check (type_requis in ('camion', 'remorque', 'les_deux')) not null,
  ville_depart text not null,
  ville_arrivee text not null,
  description text,
  poids_kg int,
  prix_total_mad int not null,
  statut text check (statut in ('ouverte', 'en_cours', 'completee', 'annulee')) default 'ouverte',
  created_at timestamptz default now()
);

-- 4. TABLE MATCHINGS
create table if not exists public.matchings (
  id uuid default uuid_generate_v4() primary key,
  charge_id uuid references public.charges(id) on delete cascade,
  transporteur_camion_id uuid references public.users(id),
  transporteur_remorque_id uuid references public.users(id),
  transporteur_complet_id uuid references public.users(id),
  prix_camion_mad int,
  prix_remorque_mad int,
  statut text check (statut in ('proposé', 'en_négociation', 'accepté', 'refusé', 'completé')) default 'proposé',
  created_at timestamptz default now()
);

-- 5. TABLE MESSAGES
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  matching_id uuid references public.matchings(id) on delete cascade,
  sender_id uuid references public.users(id),
  contenu text,
  lu boolean default false,
  audio_url text,
  created_at timestamptz default now()
);

-- 6. TABLE RATINGS
create table if not exists public.ratings (
  id uuid default uuid_generate_v4() primary key,
  from_user_id uuid references public.users(id),
  to_user_id uuid references public.users(id),
  charge_id uuid references public.charges(id),
  note int check (note between 1 and 5),
  commentaire text,
  created_at timestamptz default now()
);

-- 7. TABLE NOTIFICATIONS
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade,
  type text not null check (type in ('nouvelle_charge', 'message_recu', 'matching_accepte', 'matching_refuse', 'charge_completee', 'rating_recu', 'partenaire_trouve')),
  title text not null,
  body text not null,
  lue boolean default false,
  action_url text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================
-- INDEX
-- ============================================
create index if not exists idx_charges_statut on public.charges(statut);
create index if not exists idx_charges_expediteur on public.charges(expediteur_id);
create index if not exists idx_matchings_charge on public.matchings(charge_id);
create index if not exists idx_messages_matching on public.messages(matching_id);
create index if not exists idx_messages_created on public.messages(created_at);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_lue on public.notifications(lue);
create index if not exists idx_ratings_to_user on public.ratings(to_user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.users enable row level security;
alter table public.transporteur_profiles enable row level security;
alter table public.charges enable row level security;
alter table public.matchings enable row level security;
alter table public.messages enable row level security;
alter table public.ratings enable row level security;
alter table public.notifications enable row level security;

-- USERS
create policy "Users can read all users" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- TRANSPORTEUR_PROFILES
create policy "Public profiles visible" on public.transporteur_profiles for select using (true);
create policy "Own profile insert" on public.transporteur_profiles for insert with check (auth.uid() = user_id);
create policy "Own profile update" on public.transporteur_profiles for update using (auth.uid() = user_id);
create policy "Own profile delete" on public.transporteur_profiles for delete using (auth.uid() = user_id);

-- CHARGES
create policy "All can read charges" on public.charges for select using (true);
create policy "Expediteur inserts charges" on public.charges for insert with check (auth.uid() = expediteur_id);
create policy "Expediteur updates charges" on public.charges for update using (auth.uid() = expediteur_id);

-- MATCHINGS
create policy "Parties can read matchings" on public.matchings for select using (
  auth.uid() = transporteur_camion_id or
  auth.uid() = transporteur_remorque_id or
  auth.uid() = transporteur_complet_id or
  auth.uid() = (select expediteur_id from public.charges where id = charge_id)
);
create policy "Users can create matchings" on public.matchings for insert with check (true);
create policy "Parties can update matchings" on public.matchings for update using (
  auth.uid() = transporteur_camion_id or
  auth.uid() = transporteur_remorque_id or
  auth.uid() = transporteur_complet_id or
  auth.uid() = (select expediteur_id from public.charges where id = charge_id)
);

-- MESSAGES
create policy "Parties can read messages" on public.messages for select using (true);
create policy "Users can send messages" on public.messages for insert with check (auth.uid() = sender_id);
create policy "Users can mark messages read" on public.messages for update using (true);

-- RATINGS
create policy "Public ratings" on public.ratings for select using (true);
create policy "Users can rate" on public.ratings for insert with check (auth.uid() = from_user_id);

-- NOTIFICATIONS
create policy "Users see own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "System inserts notifications" on public.notifications for insert with check (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role, nom, phone, ville)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'transporteur'),
    coalesce(new.raw_user_meta_data->>'nom', 'Utilisateur'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'ville'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Notify expediteur on new matching
create or replace function public.notify_on_matching()
returns trigger as $$
declare
  charge_record record;
begin
  select * into charge_record from public.charges where id = new.charge_id;
  insert into public.notifications (user_id, type, title, body, action_url)
  values (
    charge_record.expediteur_id,
    'matching_accepte',
    'Nouvelle proposition',
    'Un transporteur a accepte votre charge ' || charge_record.ville_depart || ' → ' || charge_record.ville_arrivee,
    '/chat/' || new.id
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_matching_created on public.matchings;
create trigger on_matching_created
  after insert on public.matchings
  for each row execute function public.notify_on_matching();

-- Notify on new message
create or replace function public.notify_on_message()
returns trigger as $$
declare
  matching_record record;
  recipient_id uuid;
  charge_record record;
begin
  select * into matching_record from public.matchings where id = new.matching_id;
  select * into charge_record from public.charges where id = matching_record.charge_id;

  if new.sender_id = coalesce(matching_record.transporteur_camion_id, matching_record.transporteur_remorque_id, matching_record.transporteur_complet_id) then
    recipient_id := charge_record.expediteur_id;
  else
    recipient_id := coalesce(matching_record.transporteur_camion_id, matching_record.transporteur_remorque_id, matching_record.transporteur_complet_id);
  end if;

  if recipient_id is not null then
    insert into public.notifications (user_id, type, title, body, action_url)
    values (recipient_id, 'message_recu', 'Nouveau message', left(new.contenu, 50), '/chat/' || new.matching_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages
  for each row execute function public.notify_on_message();

-- Notify on rating
create or replace function public.notify_on_rating()
returns trigger as $$
declare
  sender_name text;
begin
  select nom into sender_name from public.users where id = new.from_user_id;
  insert into public.notifications (user_id, type, title, body, action_url)
  values (new.to_user_id, 'rating_recu', 'Nouvel avis recu', coalesce(sender_name, 'Quelqu''un') || ' vous a donne ' || new.note || ' etoile(s)', '/profile/settings');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_rating_created on public.ratings;
create trigger on_rating_created
  after insert on public.ratings
  for each row execute function public.notify_on_rating();

-- Notify transporteurs on new charge
create or replace function public.notify_on_new_charge()
returns trigger as $$
declare
  tp record;
begin
  for tp in
    select user_id from public.transporteur_profiles
    where
      (new.type_requis = 'les_deux' and type = 'C')
      or (new.type_requis = 'camion' and type in ('A', 'C'))
      or (new.type_requis = 'remorque' and type in ('B', 'C'))
  loop
    insert into public.notifications (user_id, type, title, body, action_url)
    values (tp.user_id, 'nouvelle_charge', 'Nouvelle charge disponible', new.ville_depart || ' → ' || new.ville_arrivee || ' — ' || new.prix_total_mad || ' MAD', '/charges/' || new.id);
  end loop;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_charge_created on public.charges;
create trigger on_charge_created
  after insert on public.charges
  for each row execute function public.notify_on_new_charge();

-- ============================================
-- Enable Realtime
-- ============================================
-- Run these separately if they fail:
-- alter publication supabase_realtime add table public.messages;
-- alter publication supabase_realtime add table public.notifications;
