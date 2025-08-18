-- Fix RLS policies to allow edge function access to clients and invoices tables
-- Update clients table RLS policy to allow service role access
DROP POLICY IF EXISTS "Enable read access for service role" ON public.clients;
CREATE POLICY "Enable read access for service role" ON public.clients
FOR SELECT USING (true);

-- Update invoices table RLS policy to allow service role access  
DROP POLICY IF EXISTS "Enable insert access for service role" ON public.invoices;
CREATE POLICY "Enable insert access for service role" ON public.invoices
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read access for service role" ON public.invoices;
CREATE POLICY "Enable read access for service role" ON public.invoices
FOR SELECT USING (true);