-- SQL Migration: Corrigir esquema da tabela events
-- Data: 2026-02-25
-- Esta migração garante que todas as colunas usadas no código existam no banco de dados.

BEGIN;

-- 1. Garantir que todas as colunas necessárias existam na tabela public.events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS game_mode TEXT DEFAULT 'tournament',
ADD COLUMN IF NOT EXISTS cash_game_type TEXT,
ADD COLUMN IF NOT EXISTS cash_game_blinds TEXT,
ADD COLUMN IF NOT EXISTS cash_game_capacity TEXT,
ADD COLUMN IF NOT EXISTS cash_game_min_max TEXT,
ADD COLUMN IF NOT EXISTS cash_game_dinner BOOLEAN DEFAULT false,
-- cash_game_open_bar já deve existir da migração anterior, mas garantimos aqui
ADD COLUMN IF NOT EXISTS cash_game_open_bar BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cash_game_notes TEXT,
ADD COLUMN IF NOT EXISTS staff_expenses_brl NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS prize_payout_brl NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS results JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS total_rebuys INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_addons INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_prize NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS ranking_type TEXT DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS included_rankings TEXT[] DEFAULT '{annual, quarterly, legacy}',
ADD COLUMN IF NOT EXISTS parallel_products TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS scoring_schema_id UUID,
ADD COLUMN IF NOT EXISTS stack TEXT,
ADD COLUMN IF NOT EXISTS blinds TEXT,
ADD COLUMN IF NOT EXISTS late_reg TEXT,
ADD COLUMN IF NOT EXISTS rebuy_value TEXT,
ADD COLUMN IF NOT EXISTS rebuy_chips TEXT,
ADD COLUMN IF NOT EXISTS addon_value TEXT,
ADD COLUMN IF NOT EXISTS addon_chips TEXT,
ADD COLUMN IF NOT EXISTS staff_bonus_value TEXT,
ADD COLUMN IF NOT EXISTS staff_bonus_chips TEXT,
ADD COLUMN IF NOT EXISTS time_chip_value TEXT,
ADD COLUMN IF NOT EXISTS time_chip_chips TEXT,
ADD COLUMN IF NOT EXISTS flyer_url TEXT,
ADD COLUMN IF NOT EXISTS double_rebuy_value TEXT,
ADD COLUMN IF NOT EXISTS double_rebuy_chips TEXT,
ADD COLUMN IF NOT EXISTS double_addon_value TEXT,
ADD COLUMN IF NOT EXISTS double_addon_chips TEXT;

-- 2. Configurar RLS (Row Level Security)
-- Garantir que RLS está habilitado
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Política para Leitura: Todos podem ver eventos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Public can view events') THEN
        CREATE POLICY "Public can view events" ON public.events FOR SELECT USING (true);
    END IF;
END $$;

-- Política para Gerenciamento: Apenas Admins e Staff podem criar/editar/deletar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Admins can manage events') THEN
        CREATE POLICY "Admins can manage events" ON public.events
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'admin' OR profiles.role = 'staff')
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'admin' OR profiles.role = 'staff')
          )
        );
    END IF;
END $$;

COMMIT;
