-- If the warehouse users are getting silently blocked by RLS when trying to update product status, run this function
-- to explicitly grant them an atomic override for approvals.

CREATE OR REPLACE FUNCTION approve_pending_product(p_product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as the database owner, bypassing restrictive RLS
AS $$
BEGIN
    UPDATE public.products
    SET status = 'active',
        updated_at = NOW()
    WHERE id = p_product_id 
      AND status = 'pending_warehouse';
END;
$$;
