-- Add internal_notes column to laundry_requests table
-- Run this in the Supabase SQL editor

ALTER TABLE public.laundry_requests 
ADD COLUMN IF NOT EXISTS internal_notes text;

-- Add index for better performance on status filtering
CREATE INDEX IF NOT EXISTS idx_laundry_requests_pickup_date ON public.laundry_requests(pickup_date);
CREATE INDEX IF NOT EXISTS idx_laundry_requests_customer_name ON public.laundry_requests(customer_name);
CREATE INDEX IF NOT EXISTS idx_laundry_requests_created_at ON public.laundry_requests(created_at);

-- Update RLS policies to allow admin operations on internal_notes
-- (These should already exist from previous setup, but adding for completeness)
DROP POLICY IF EXISTS "Public can create requests" ON public.laundry_requests;
DROP POLICY IF EXISTS "Public can read requests" ON public.laundry_requests;
DROP POLICY IF EXISTS "Public can update requests" ON public.laundry_requests;
DROP POLICY IF EXISTS "Public can delete requests" ON public.laundry_requests;

CREATE POLICY "Public can create requests" ON public.laundry_requests
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Public can read requests" ON public.laundry_requests
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Public can update requests" ON public.laundry_requests
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete requests" ON public.laundry_requests
  FOR DELETE TO anon
  USING (true);
