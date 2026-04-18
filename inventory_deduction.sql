-- Trigger Function to deduct inventory when an order is placed globally
CREATE OR REPLACE FUNCTION deduct_inventory_on_order()
RETURNS trigger AS $$
BEGIN
  -- We subtract the ordered quantity from the specific warehouse assigned to fulfill it.
  UPDATE public.inventory
  SET quantity = quantity - NEW.quantity,
      updated_at = NOW()
  WHERE product_id = NEW.product_id
    AND warehouse_id = NEW.seller_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it already exists to allow safe re-running
DROP TRIGGER IF EXISTS trigger_deduct_inventory ON public.orders;

-- Create the Trigger on the orders table
CREATE TRIGGER trigger_deduct_inventory
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION deduct_inventory_on_order();
