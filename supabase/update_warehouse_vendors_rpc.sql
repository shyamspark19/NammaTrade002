-- Update the get_warehouse_vendors RPC to include phone numbers 
-- and more metadata for the Warehouse portal.

DROP FUNCTION IF EXISTS get_warehouse_vendors();

CREATE OR REPLACE FUNCTION get_warehouse_vendors()
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT,
    joined TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.user_id as id,
        p.full_name as name,
        p.email as email,
        p.phone as phone,
        r.role::text as role,
        p.created_at as joined
    FROM public.profiles p
    JOIN public.user_roles r ON p.user_id = r.user_id
    WHERE r.role = 'vendor';
END;
$$;
