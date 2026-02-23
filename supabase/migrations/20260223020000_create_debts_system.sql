-- SQL Migration: Sistema de Pendura (Débitos)
-- Data: 2026-02-23

BEGIN;

-- 1. Alterar tabela profiles para incluir limite de débito
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS debt_limit_brl NUMERIC DEFAULT 0;

-- 2. Alterar tabela commands para registrar valor pendurado no fechamento
ALTER TABLE public.commands 
ADD COLUMN IF NOT EXISTS unpaid_amount_brl NUMERIC DEFAULT 0;

-- 3. Criar tabela de debts (dívidas)
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    command_id UUID REFERENCES public.commands(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    amount_brl NUMERIC NOT NULL CHECK (amount_brl > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (Debts)
-- Jogadores podem ver suas próprias dívidas
CREATE POLICY "Users can view own debts" 
ON public.debts FOR SELECT 
USING (auth.uid() = user_id);

-- Admins podem fazer tudo
CREATE POLICY "Admins have full access to debts" 
ON public.debts FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS debts_user_id_idx ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS debts_status_idx ON public.debts(status);

COMMIT;
