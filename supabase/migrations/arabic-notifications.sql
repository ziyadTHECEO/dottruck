-- Update notification triggers to Arabic

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
    'عرض جديد',
    'ناقل قبل شحنتك ' || charge_record.ville_depart || ' → ' || charge_record.ville_arrivee,
    '/chat/' || new.id
  );
  return new;
end;
$$ language plpgsql security definer;

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
    values (recipient_id, 'message_recu', 'رسالة جديدة', left(new.contenu, 50), '/chat/' || new.matching_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Notify on rating
create or replace function public.notify_on_rating()
returns trigger as $$
declare
  sender_name text;
begin
  select nom into sender_name from public.users where id = new.from_user_id;
  insert into public.notifications (user_id, type, title, body, action_url)
  values (new.to_user_id, 'rating_recu', 'تقييم جديد', coalesce(sender_name, 'شخص') || ' عطاك ' || new.note || ' نجمة', '/profile/settings');
  return new;
end;
$$ language plpgsql security definer;

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
    values (tp.user_id, 'nouvelle_charge', 'شحنة جديدة متوفرة', new.ville_depart || ' → ' || new.ville_arrivee || ' — ' || new.prix_total_mad || ' درهم', '/charges/' || new.id);
  end loop;
  return new;
end;
$$ language plpgsql security definer;
