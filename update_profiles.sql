-- Adds phone and address to profiles, ensuring they safely skip if they already exist
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;
