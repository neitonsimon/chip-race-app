-- Migration: Create Payment Intents table for Mercado Pago Integration
-- Description: Stores checkout requests and associates them with MP data to track PIX status securely.

CREATE TABLE IF NOT EXISTS public.payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, authorized, approved, cancelled
    gateway_id VARCHAR(255), -- Mercado Pago Payment ID
    qr_code TEXT, -- Copy/paste string
    qr_code_base64 TEXT, -- Image data for qr code
    ticket_url TEXT, -- Link to MP hosted page if needed
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- RLS Policies
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment intents"
    ON public.payment_intents
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment intents"
    ON public.payment_intents
    FOR SELECT
    USING (public.is_admin());

-- Notice: Inserts/Updates should be handled strictly by secure Edge Functions, not directly from the client.
-- Therefore, we do not add INSERT or UPDATE policies for regular users.

-- Create an index to quickly find by mp gateway id during webhooks
CREATE INDEX IF NOT EXISTS idx_payment_intents_gateway_id ON public.payment_intents(gateway_id);
