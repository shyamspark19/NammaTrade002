-- Logic to safely approve orders as a Warehouse member
-- This function handles the stock transfer to vendors (if procurement) 
-- and updates order status atomically, bypassing client-side RLS issues.

CREATE OR REPLACE FUNCTION public.process_order_approval(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS to allow Warehouse staff to update vendor stock during procurement
AS $$
DECLARE
    v_order RECORD;
    v_vendor_exists BOOLEAN;
BEGIN
    -- 1. Fetch order details
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.status != 'pending' THEN
        RAISE EXCEPTION 'Order is already processed or cancelled';
    END IF;

    -- 2. Handle Wholesale (Procurement) transfers
    -- For retail orders, stock is already deducted from warehouse by trigger on placement,
    -- so we only need to handle the vendor inventory logic for wholesale here.
    IF v_order.order_type = 'wholesale' THEN
        -- Verify the buyer is indeed a vendor
        SELECT EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = v_order.buyer_id AND role = 'vendor'
        ) INTO v_vendor_exists;

        IF NOT v_vendor_exists THEN
            RAISE EXCEPTION 'Wholesale orders can only be approved for registered vendors';
        END IF;

        -- Upsert Vendor Inventory (add the procured stock to the vendor's listing)
        INSERT INTO public.vendor_inventory (vendor_id, product_id, stock, retail_price)
        VALUES (
            v_order.buyer_id, 
            v_order.product_id, 
            v_order.quantity, 
            COALESCE((SELECT retail_mop FROM public.products WHERE id = v_order.product_id), 0)
        )
        ON CONFLICT (vendor_id, product_id) 
        DO UPDATE SET 
            stock = public.vendor_inventory.stock + EXCLUDED.stock,
            updated_at = NOW();
    END IF;

    -- 3. Mark the order as delivered/completed
    UPDATE public.orders
    SET status = 'delivered',
        updated_at = NOW()
    WHERE id = p_order_id;
END;
$$;
