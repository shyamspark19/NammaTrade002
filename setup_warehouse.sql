-- ========================================================
-- NAMMA TRADE: Phase 2 Warehouse Architecture Setup
-- ========================================================

-- 1. Create the Inventory table
-- Tracks the stock of a specific product held by a specific warehouse staff member
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (warehouse_id, product_id)
);

-- 2. Create the Orders table
-- Unified transaction table for both Wholesale (Warehouse->Vendor) and Retail (Vendor->Consumer)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES public.profiles(user_id) NOT NULL,
    buyer_id UUID REFERENCES public.profiles(user_id) NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    order_type TEXT CHECK (order_type IN ('wholesale', 'retail')),
    quantity NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, shipped, delivered, cancelled
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Auto-update timestamps triggers
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================================
-- SECURITY: Row Level Security (RLS) Policies
-- ========================================================

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- -------------------------
-- INVENTORY POLICIES
-- -------------------------
-- 1. Admins have absolute power over inventory globally
CREATE POLICY "Admins manage all inventory" ON public.inventory FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Warehouse staff can INSERT and UPDATE *their own* inventory only
CREATE POLICY "Warehouse manage own inventory" ON public.inventory FOR ALL 
USING (auth.uid() = warehouse_id AND public.has_role(auth.uid(), 'warehouse'::app_role))
WITH CHECK (auth.uid() = warehouse_id AND public.has_role(auth.uid(), 'warehouse'::app_role));

-- 3. Vendors are allowed to VIEW the inventory of all warehouses to know what they can buy
CREATE POLICY "Vendors view all inventory" ON public.inventory FOR SELECT 
USING (public.has_role(auth.uid(), 'vendor'::app_role) OR auth.uid() = warehouse_id);

-- -------------------------
-- ORDERS POLICIES
-- -------------------------
-- 1. Admins can view/manage all orders globally
CREATE POLICY "Admins manage all orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Users (Buyers or Sellers) can VIEW orders they are a part of
CREATE POLICY "Users view involved orders" ON public.orders FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 3. Buyers can CREATE new orders addressed from themselves
CREATE POLICY "Buyers can open orders" ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

-- 4. Sellers can UPDATE an order's status (e.g. accept, ship)
CREATE POLICY "Sellers can update orders" ON public.orders FOR UPDATE 
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);
