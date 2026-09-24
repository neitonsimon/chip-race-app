-- Create poker_business_leads table for the 1º Poker Business event
CREATE TABLE IF NOT EXISTS public.poker_business_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    company TEXT,
    whatsapp TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT,
    segment TEXT,
    referral_source TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'contatado', 'confirmado', 'cancelado')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.poker_business_leads ENABLE ROW LEVEL SECURITY;

-- Policies: anyone can register/apply, only admins can view or update
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'poker_business_leads' AND policyname = 'Anyone can insert leads'
    ) THEN
        CREATE POLICY  Anyone can insert leads
            ON public.poker_business_leads FOR INSERT
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'poker_business_leads' AND policyname = 'Admins can view leads'
    ) THEN
        CREATE POLICY Admins can view leads
            ON public.poker_business_leads FOR SELECT
            USING (public.is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'poker_business_leads' AND policyname = 'Admins can update leads'
    ) THEN
        CREATE POLICY Admins can update leads
            ON public.poker_business_leads FOR UPDATE
            USING (public.is_admin())
            WITH CHECK (public.is_admin());
    END IF;
END $$;