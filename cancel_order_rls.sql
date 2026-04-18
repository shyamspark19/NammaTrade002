-- Allow buyers to cancel their own pending/processing orders
-- Run this in your Supabase SQL Editor

-- Drop first so it can be re-run safely
DROP POLICY IF EXISTS "Buyers can cancel own orders" ON public.orders;

CREATE POLICY "Buyers can cancel own orders"
  ON public.orders
  FOR UPDATE
  USING (
    auth.uid() = buyer_id
    AND status IN ('pending', 'processing')
  )
  WITH CHECK (
    auth.uid() = buyer_id
  );
