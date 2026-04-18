
-- Update handle_new_user to NOT auto-assign consumer role
-- Let users choose their role on the selection page
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    
    -- No default role - user will choose on role selection page
    RETURN NEW;
END;
$$;
