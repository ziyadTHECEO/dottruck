-- ============================================
-- DOTTRUCK - Migration (a executer sur DB existante)
-- Ajoute UNIQUEMENT ce qui manque
-- ============================================

-- 1. Ajouter colonne avatar_url a users si manquante
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Ajouter colonne capacite_tonnes a transporteur_profiles si manquante
ALTER TABLE public.transporteur_profiles ADD COLUMN IF NOT EXISTS capacite_tonnes int;

-- 3. Ajouter colonne lu a messages si manquante
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS lu boolean default false;

-- 4. Mettre a jour le CHECK sur charges.statut pour les nouveaux statuts
-- (on drop et re-cree la contrainte)
ALTER TABLE public.charges DROP CONSTRAINT IF EXISTS charges_statut_check;
ALTER TABLE public.charges ADD CONSTRAINT charges_statut_check
  CHECK (statut IN ('ouverte', 'en_cours', 'completee', 'annulee'));

-- 5. Mettre a jour le CHECK sur matchings.statut pour ajouter 'completé'
ALTER TABLE public.matchings DROP CONSTRAINT IF EXISTS matchings_statut_check;
ALTER TABLE public.matchings ADD CONSTRAINT matchings_statut_check
  CHECK (statut IN ('proposé', 'en_négociation', 'accepté', 'refusé', 'completé'));

-- 6. Creer la table NOTIFICATIONS (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.notifications (
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

-- 7. Index pour notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lue ON public.notifications(lue);

-- 8. RLS pour notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop policies si elles existent deja (pour eviter erreur 42710)
DROP POLICY IF EXISTS "Users see own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System inserts notifications" ON public.notifications;

CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- 9. Policy manquante : messages update (pour marquer lu)
DROP POLICY IF EXISTS "Users can mark messages read" ON public.messages;
CREATE POLICY "Users can mark messages read" ON public.messages FOR UPDATE USING (true);

-- ============================================
-- TRIGGERS (create or replace = safe a re-executer)
-- ============================================

-- Auto-create user profile on signup (avec phone + ville)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, nom, phone, ville)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'transporteur'),
    coalesce(new.raw_user_meta_data->>'nom', 'Utilisateur'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'ville'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Notify expediteur on new matching
CREATE OR REPLACE FUNCTION public.notify_on_matching()
RETURNS trigger AS $$
DECLARE
  charge_record record;
BEGIN
  SELECT * INTO charge_record FROM public.charges WHERE id = new.charge_id;
  INSERT INTO public.notifications (user_id, type, title, body, action_url)
  VALUES (
    charge_record.expediteur_id,
    'matching_accepte',
    'Nouvelle proposition',
    'Un transporteur a accepte votre charge ' || charge_record.ville_depart || ' → ' || charge_record.ville_arrivee,
    '/chat/' || new.id
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_matching_created ON public.matchings;
CREATE TRIGGER on_matching_created
  AFTER INSERT ON public.matchings
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_matching();

-- Notify on new message
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger AS $$
DECLARE
  matching_record record;
  recipient_id uuid;
  charge_record record;
BEGIN
  SELECT * INTO matching_record FROM public.matchings WHERE id = new.matching_id;
  SELECT * INTO charge_record FROM public.charges WHERE id = matching_record.charge_id;

  IF new.sender_id = coalesce(matching_record.transporteur_camion_id, matching_record.transporteur_remorque_id, matching_record.transporteur_complet_id) THEN
    recipient_id := charge_record.expediteur_id;
  ELSE
    recipient_id := coalesce(matching_record.transporteur_camion_id, matching_record.transporteur_remorque_id, matching_record.transporteur_complet_id);
  END IF;

  IF recipient_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, action_url)
    VALUES (recipient_id, 'message_recu', 'Nouveau message', left(new.contenu, 50), '/chat/' || new.matching_id);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- Notify on rating
CREATE OR REPLACE FUNCTION public.notify_on_rating()
RETURNS trigger AS $$
DECLARE
  sender_name text;
BEGIN
  SELECT nom INTO sender_name FROM public.users WHERE id = new.from_user_id;
  INSERT INTO public.notifications (user_id, type, title, body, action_url)
  VALUES (new.to_user_id, 'rating_recu', 'Nouvel avis recu', coalesce(sender_name, 'Quelqu''un') || ' vous a donne ' || new.note || ' etoile(s)', '/profile/settings');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_rating_created ON public.ratings;
CREATE TRIGGER on_rating_created
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_rating();

-- Notify transporteurs on new charge
CREATE OR REPLACE FUNCTION public.notify_on_new_charge()
RETURNS trigger AS $$
DECLARE
  tp record;
BEGIN
  FOR tp IN
    SELECT user_id FROM public.transporteur_profiles
    WHERE
      (new.type_requis = 'les_deux' AND type = 'C')
      OR (new.type_requis = 'camion' AND type IN ('A', 'C'))
      OR (new.type_requis = 'remorque' AND type IN ('B', 'C'))
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, action_url)
    VALUES (tp.user_id, 'nouvelle_charge', 'Nouvelle charge disponible', new.ville_depart || ' → ' || new.ville_arrivee || ' — ' || new.prix_total_mad || ' MAD', '/charges/' || new.id);
  END LOOP;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_charge_created ON public.charges;
CREATE TRIGGER on_charge_created
  AFTER INSERT ON public.charges
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_charge();
