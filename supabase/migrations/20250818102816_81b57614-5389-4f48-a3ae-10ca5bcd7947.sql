-- Disable email confirmation for admin user and create initial data
-- Insert admin user directly (bypassing email confirmation for demo)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'eb47a13a-edd1-45b7-aad0-23a2f0056aa0',
  'authenticated',
  'authenticated',
  'admin@invoices.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email_confirmed_at = NOW(),
  encrypted_password = crypt('admin123', gen_salt('bf'));

-- Create sample client data
INSERT INTO public.clients (id, username, password, name, email, phone, company, created_at) VALUES 
('11111111-1111-1111-1111-111111111111', 'john_doe', 'password123', 'John Doe', 'john@example.com', '+1234567890', 'ABC Corp', NOW()),
('22222222-2222-2222-2222-222222222222', 'jane_smith', 'password456', 'Jane Smith', 'jane@example.com', '+0987654321', 'XYZ Ltd', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create their auth users too
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES 
(
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'john@example.com',
  crypt('client123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}'
),
(
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'jane@example.com',
  crypt('client123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}'
) ON CONFLICT (id) DO NOTHING;

-- Create sample invoices
INSERT INTO public.invoices (
  id, client_id, invoice_number, description, amount, currency, due_date, status, created_at
) VALUES 
(
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'INV-001',
  'Website Development Services',
  1500.00,
  'KWD',
  '2024-12-31',
  'pending',
  NOW()
),
(
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'INV-002',
  'Mobile App Development',
  2500.00,
  'KWD',
  '2024-12-31',
  'paid',
  NOW()
) ON CONFLICT (id) DO NOTHING;