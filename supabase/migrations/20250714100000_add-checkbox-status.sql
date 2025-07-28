-- Voeg status-checkbox kolommen toe aan documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS afgehandeld BOOLEAN DEFAULT false;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS openstaand BOOLEAN DEFAULT false;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS urgent BOOLEAN DEFAULT false;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS in_behandeling BOOLEAN DEFAULT false;

-- Voeg extra kolommen toe voor aanvullende documentinformatie
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS zorgverlener TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS verzekeraar TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS opmerking TEXT; 