-- Admin RLS policies
-- Run this if you prefer RLS-based access instead of the service role client approach.
-- These policies allow users with role='admin' to read/update all rows.

-- transporteur_profiles: admin read
DROP POLICY IF EXISTS "Admins can view all transporteur profiles" ON public.transporteur_profiles;
CREATE POLICY "Admins can view all transporteur profiles"
  ON public.transporteur_profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- transporteur_profiles: admin update (verification)
DROP POLICY IF EXISTS "Admins can update any transporteur profile" ON public.transporteur_profiles;
CREATE POLICY "Admins can update any transporteur profile"
  ON public.transporteur_profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- users: admin can read all accounts
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- users: admin can update any account (banning)
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- matchings: admin read all
DROP POLICY IF EXISTS "Admins can view all matchings" ON public.matchings;
CREATE POLICY "Admins can view all matchings"
  ON public.matchings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- charges: admin read all
DROP POLICY IF EXISTS "Admins can view all charges" ON public.charges;
CREATE POLICY "Admins can view all charges"
  ON public.charges FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
