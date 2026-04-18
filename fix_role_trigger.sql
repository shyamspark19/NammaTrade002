-- Run this script in your Supabase Dashboard -> SQL Editor
-- This updates the trigger to read the role you select during sign up instead of defaulting to consumer.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    
    -- Pick up the selected role from metadata, fallback to 'consumer' if none provided
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'consumer')::app_role);
    
    RETURN NEW;
END;
$$;
