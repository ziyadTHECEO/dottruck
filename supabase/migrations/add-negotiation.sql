-- Add prix_final to matchings
ALTER TABLE public.matchings ADD COLUMN IF NOT EXISTS prix_final INT;

-- Price proposals table
CREATE TABLE IF NOT EXISTS public.price_proposals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  matching_id uuid REFERENCES public.matchings(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.users(id),
  amount_mad int NOT NULL CHECK (amount_mad > 0),
  status text CHECK (status IN ('pending', 'accepted', 'refused', 'counter')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.price_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matching parties can read proposals" ON public.price_proposals
  FOR SELECT USING (
    matching_id IN (
      SELECT m.id FROM public.matchings m
      JOIN public.charges c ON c.id = m.charge_id
      WHERE auth.uid() IN (
        m.transporteur_camion_id,
        m.transporteur_remorque_id,
        m.transporteur_complet_id,
        c.expediteur_id
      )
    )
  );

CREATE POLICY "Matching parties can insert proposals" ON public.price_proposals
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Matching parties can update proposals" ON public.price_proposals
  FOR UPDATE USING (
    matching_id IN (
      SELECT m.id FROM public.matchings m
      JOIN public.charges c ON c.id = m.charge_id
      WHERE auth.uid() IN (
        m.transporteur_camion_id,
        m.transporteur_remorque_id,
        m.transporteur_complet_id,
        c.expediteur_id
      )
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_proposals_matching ON public.price_proposals(matching_id);
