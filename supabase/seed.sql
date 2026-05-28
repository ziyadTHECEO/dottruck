-- ============================================
-- DOTTRUCK - Seed data pour demo
-- Executer APRES schema.sql
-- NOTE: Les users doivent etre crees via l'auth Supabase
-- Ce seed cree des charges et notifications de demo
-- ============================================

-- Inserer des charges de demo (remplacer expediteur_id par un vrai user id apres inscription)
-- Utiliser: SELECT id FROM auth.users LIMIT 1; pour trouver un id

-- Exemple de charges (a executer apres avoir cree au moins un expediteur)
/*
INSERT INTO public.charges (expediteur_id, type_requis, ville_depart, ville_arrivee, description, poids_kg, prix_total_mad, statut) VALUES
  ('<expediteur_id>', 'les_deux', 'Safi', 'Casablanca', 'Ciment 10T — chargement rapide', 10000, 1600, 'ouverte'),
  ('<expediteur_id>', 'camion', 'Casablanca', 'Marrakech', 'Fruits et legumes frais 5T', 5000, 1200, 'ouverte'),
  ('<expediteur_id>', 'remorque', 'Agadir', 'Rabat', 'Electromenager 3T — fragile', 3000, 2100, 'ouverte'),
  ('<expediteur_id>', 'les_deux', 'Tanger', 'Fes', 'Materiaux de construction 8T', 8000, 1800, 'ouverte'),
  ('<expediteur_id>', 'camion', 'Rabat', 'Safi', 'Produits alimentaires 6T', 6000, 1400, 'ouverte'),
  ('<expediteur_id>', 'les_deux', 'Marrakech', 'Agadir', 'Meubles 4T — attention fragile', 4000, 900, 'ouverte'),
  ('<expediteur_id>', 'remorque', 'Fes', 'Casablanca', 'Textiles 2T', 2000, 800, 'ouverte'),
  ('<expediteur_id>', 'camion', 'Safi', 'Tanger', 'Poisson surgele 7T — camion frigo', 7000, 3200, 'ouverte'),
  ('<expediteur_id>', 'les_deux', 'Casablanca', 'Agadir', 'Materiel informatique 1.5T', 1500, 1100, 'ouverte'),
  ('<expediteur_id>', 'camion', 'Marrakech', 'Rabat', 'Huile d''olive 3T', 3000, 950, 'ouverte');
*/
