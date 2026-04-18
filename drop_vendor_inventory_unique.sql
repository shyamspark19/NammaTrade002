-- This drops the unique constraint that prevents the same product
-- from being listed more than once by the same vendor.
-- After running this, vendors can add the same product at different
-- price tiers (discount classifications) as separate listings.

ALTER TABLE public.vendor_inventory
DROP CONSTRAINT IF EXISTS vendor_inventory_vendor_id_product_id_key;
