-- Add container and dimension fields to charges
ALTER TABLE public.charges ADD COLUMN IF NOT EXISTS is_conteneur BOOLEAN DEFAULT false;
ALTER TABLE public.charges ADD COLUMN IF NOT EXISTS largeur_cm INT;
ALTER TABLE public.charges ADD COLUMN IF NOT EXISTS hauteur_cm INT;
