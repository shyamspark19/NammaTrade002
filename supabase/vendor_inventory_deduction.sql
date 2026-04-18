-- Trigger Function to deduct vendor inventory when a consumer order is placed
CREATE OR REPLACE FUNCTION deduct_vendor_inventory_on_order()
RETURNS trigger AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Get the role of the seller
  SELECT role INTO v_role FROM public.user_roles WHERE user_id = NEW.seller_id LIMIT 1;

  -- If the seller is a vendor, deduct from vendor_inventory
  IF v_role = 'vendor' THEN
    UPDATE public.vendor_inventory
    SET stock = stock - NEW.quantity,
        updated_at = NOW()
    WHERE product_id = NEW.product_id
      AND vendor_id = NEW.seller_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the Trigger on the orders table
DROP TRIGGER IF EXISTS trigger_deduct_vendor_inventory ON public.orders;
CREATE TRIGGER trigger_deduct_vendor_inventory
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION deduct_vendor_inventory_on_order();
