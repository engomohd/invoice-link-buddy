-- Update RLS policies to work with proper Supabase authentication

-- Drop existing policies for clients table
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view their own data" ON public.clients;

-- Create new policies for clients table that work with Supabase Auth
CREATE POLICY "Admins can view all clients" 
ON public.clients 
FOR SELECT 
USING (
  (auth.jwt() ->> 'email'::text) = 'admin@invoices.com'::text OR
  (auth.uid())::text = (id)::text
);

CREATE POLICY "Admins can insert clients" 
ON public.clients 
FOR INSERT 
WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@invoices.com'::text);

CREATE POLICY "Admins can update clients" 
ON public.clients 
FOR UPDATE 
USING ((auth.jwt() ->> 'email'::text) = 'admin@invoices.com'::text);

-- Drop existing policies for invoices table
DROP POLICY IF EXISTS "Admins can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Clients can view their own invoices" ON public.invoices;

-- Create new policies for invoices table
CREATE POLICY "Admins can view all invoices" 
ON public.invoices 
FOR SELECT 
USING ((auth.jwt() ->> 'email'::text) = 'admin@invoices.com'::text);

CREATE POLICY "Admins can insert invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@invoices.com'::text);

CREATE POLICY "Admins can update invoices" 
ON public.invoices 
FOR UPDATE 
USING ((auth.jwt() ->> 'email'::text) = 'admin@invoices.com'::text);

CREATE POLICY "Clients can view their own invoices" 
ON public.invoices 
FOR SELECT 
USING ((client_id)::text = (auth.uid())::text);