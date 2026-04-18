-- Create a wishlist table for consumers to save products
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vendor_inventory_id UUID NOT NULL,
    product_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, vendor_inventory_id)  -- one save per listing per user
);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own wishlist
CREATE POLICY "Users manage own wishlist" ON public.wishlist
    FOR ALL USING (auth.uid() = user_id);
