-- Create a Secure View combining Profiles and Roles for the Admin Dashboard
-- This View automatically inherits the Row Level Security of the underlying tables!
-- Since public.profiles has an RLS policy for 'admin' users, only admins will see all rows.

DROP VIEW IF EXISTS public.admin_user_view;

CREATE VIEW public.admin_user_view WITH (security_invoker = on) AS
SELECT 
    p.user_id as id,
    p.full_name as name,
    p.email as email,
    COALESCE(r.role::text, 'consumer') as role,
    p.created_at as joined
FROM public.profiles p
LEFT JOIN public.user_roles r ON p.user_id = r.user_id;
