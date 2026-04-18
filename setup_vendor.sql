-- ========================================================
-- NAMMA TRADE: Vendor Architecture Setup
-- ========================================================

-- Create the Vendor Inventory table
-- Tracks the specific stock and retail prices set by Vendors
CREATE TABLE IF NOT EXISTS public.vendor_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    retail_price NUMERIC(10, 2) NOT NULL,
    stock NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (vendor_id, product_id)
);

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER update_vendor_inventory_updated_at
    BEFORE UPDATE ON public.vendor_inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.vendor_inventory ENABLE ROW LEVEL SECURITY;

-- -------------------------
-- VENDOR INVENTORY POLICIES
-- -------------------------

-- 1. Admins have absolute power over vendor inventory
CREATE POLICY "Admins manage all vendor inventory" ON public.vendor_inventory FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Vendors can INSERT, UPDATE, and DELETE *their own* inventory only
CREATE POLICY "Vendors manage own inventory" ON public.vendor_inventory FOR ALL 
USING (auth.uid() = vendor_id AND public.has_role(auth.uid(), 'vendor'::app_role))
WITH CHECK (auth.uid() = vendor_id AND public.has_role(auth.uid(), 'vendor'::app_role));

-- 3. Consumers and everyone else can VIEW active vendor inventory to shop
CREATE POLICY "Anyone can view vendor inventory" ON public.vendor_inventory FOR SELECT 
USING (true);
