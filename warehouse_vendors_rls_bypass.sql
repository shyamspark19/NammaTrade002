-- The profiles table is strictly locked to Admins via RLS.
-- This function allows Warehouse users to securely list Vendor profiles without exposing Admin profiles.

CREATE OR REPLACE FUNCTION get_warehouse_vendors()
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    role TEXT,
    joined TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER -- Essential RLS Bypass
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.user_id as id,
        p.full_name as name,
        p.email as email,
        r.role as role,
        p.created_at as joined
    FROM public.profiles p
    JOIN public.user_roles r ON p.user_id = r.user_id
    WHERE r.role = 'vendor';
END;
$$;
