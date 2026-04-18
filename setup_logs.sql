CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(user_id) NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Turn on RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can heavily read ALL logs across the platform
CREATE POLICY "Admins can view all logs" 
ON public.activity_logs FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Standard users (consumers, vendors, warehouse) can ONLY read logs bound to their own User ID to preserve privacy
CREATE POLICY "Users can view their own logs strictly" 
ON public.activity_logs FOR SELECT 
USING (auth.uid() = user_id);

-- System functions or authorized users can insert logs (Users log their own traces)
CREATE POLICY "Users specify their own tracking logs"
ON public.activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Let's immediately insert an initial tracing log for the current user executing this if they exist
DO $$ 
BEGIN
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.activity_logs (user_id, action, details)
    VALUES (auth.uid(), 'SYSTEM_INIT', 'Auditing subsystem initialized for this account.');
  END IF;
END $$;
