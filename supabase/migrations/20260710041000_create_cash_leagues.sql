-- Migration: Create Cash Leagues table, configure RLS, and seed initial leagues & home category
-- Date: 2026-07-10 04:10:00

BEGIN;

-- 1. Create cash_leagues table
CREATE TABLE IF NOT EXISTS public.cash_leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    modality TEXT NOT NULL,
    blind TEXT NOT NULL,
    buyin NUMERIC NOT NULL,
    max_players INTEGER NOT NULL DEFAULT 10,
    rounds JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'finished'
    prize TEXT NOT NULL,
    participants JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of player objects/names
    results JSONB NOT NULL DEFAULT '{}'::jsonb, -- dynamic results structure
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.cash_leagues ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "Everyone can view cash leagues" ON public.cash_leagues;
CREATE POLICY "Everyone can view cash leagues"
ON public.cash_leagues FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins and staff can manage cash leagues" ON public.cash_leagues;
CREATE POLICY "Admins and staff can manage cash leagues"
ON public.cash_leagues FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
);

-- 4. Seed the 10 initial leagues
INSERT INTO public.cash_leagues (name, modality, blind, buyin, max_players, rounds, status, prize, participants, results)
VALUES
    (
        '⚒️ Liga Ferro', 'Hold''em', '0,10 / 0,20', 20.00, 10,
        '[{"number": 1, "date": "", "time": "20:00", "status": "pending"}, {"number": 2, "date": "", "time": "20:00", "status": "pending"}, {"number": 3, "date": "", "time": "20:00", "status": "pending"}, {"number": 4, "date": "", "time": "20:00", "status": "pending"}]'::jsonb,
        'active', 'Vaga The Chosen 30K + Troféu', '[]'::jsonb, '{}'::jsonb
    ),
    (
        '🥉 Liga Bronze', 'Hold''em', '0,20 / 0,40', 40.00, 10,
        '[{"number": 1, "date": "", "time": "20:00", "status": "pending"}, {"number": 2, "date": "", "time": "20:00", "status": "pending"}, {"number": 3, "date": "", "time": "20:00", "status": "pending"}, {"number": 4, "date": "", "time": "20:00", "status": "pending"}]'::jsonb,
        'active', 'Vaga The Chosen 30K + Troféu', '[]'::jsonb, '{}'::jsonb
    ),
    (
        '🥈 Liga Prata', 'Hold''em', '0,30 / 0,60', 60.00, 10,
        '[{"number": 1, "date": "", "time": "20:00", "status": "pending"}, {"number": 2, "date": "", "time": "20:00", "status": "pending"}, {"number": 3, "date": "", "time": "20:00", "status": "pending"}, {"number": 4, "date": "", "time": "20:00", "status": "pending"}]'::jsonb,
        'active', 'Vaga The Chosen 30K + Troféu', '[]'::jsonb, '{}'::jsonb
    ),
    (
        '🥇 Liga Ouro', 'Hold''em', '0,50 / 1,00', 100.00, 10,
        '[{"number": 1, "date": "", "time": "20:00", "status": "pending"}, {"number": 2, "date": "", "time": "20:00", "status": "pending"}, {"number": 3, "date": "", "time": "20:00", "status": "pending"}, {"number": 4, "date": "", "time": "20:00", "status": "pending"}]'::jsonb,
        'active', 'Vaga The Chosen 30K + Troféu', '[]'::jsonb, '{}'::jsonb
    ),
    (
        '💠 Liga Platina', 'Hold''em', '1 / 2', 200.00, 10,
        '[{"number": 1, "date": "", "time": "20:00", "status": "pending"}, {"number": 2, "date": "", "time": "20:00", "status": "pending"}, {"number": 3, "date": "", "time": "20:00", "status": "pending"}, {"number": 4, "date": "", "time": "20:00", "status": "pending"}]'::jsonb,
        'active', 'Vaga The Chosen 30K + Troféu', '[]'::jsonb, '{}'::jsonb
    ),
    (
        '🌪️ Liga Omaha Sonic', 'Omaha', '0,50 / 1,00', 100.00, 10,
        '[{"number": 1, "date": "", "time": "20:00", "status": "pending"}, {"number": 2, "date": "", "time": "20:00", "status": "pending"}, {"number": 3, "date": "", "time": "20:00", "status": "pending"}, {"number": 4, "date": "", "time": "20:00", "status": "pending"}]'::jsonb,
        'active', 'Vaga The Chosen 30K + Troféu', '[]'::jsonb, '{}'::jsonb
    ),
    (
        '🌊 Liga Omaha Shark', 'Omaha', '1 / 2', 200.00, 10,
        '[{"number": 1, "date": "", "time": "20:00", "status": "pending"}, {"number": 2, "date": "", "time": "20:00", "status": "pending"}, {"number": 3, "date": "", "time": "20:00", "status": "pending"}, {"number": 4, "date": "", "time": "20:00", "status": "pending"}]'::jsonb,
        'active', 'Vaga The Chosen 30K + Troféu', '[]'::jsonb, '{}'::jsonb
    ),
    (
        '⚡ Liga Omaha Thunder', 'Omaha', '2 / 4', 400.00, 10,
        '[{"number": 1, "date": "", "time": "20:00", "status": "pending"}, {"number": 2, "date": "", "time": "20:00", "status": "pending"}, {"number": 3, "date": "", "time": "20:00", "status": "pending"}, {"number": 4, "date": "", "time": "20:00", "status": "pending"}]'::jsonb,
        'active', 'Vaga The Chosen 30K + Troféu', '[]'::jsonb, '{}'::jsonb
    ),
    (
        '💎 Liga Diamante', 'Hold''em', '2 / 4', 400.00, 10,
        '[{"number": 1, "date": "", "time": "20:00", "status": "pending"}, {"number": 2, "date": "", "time": "20:00", "status": "pending"}, {"number": 3, "date": "", "time": "20:00", "status": "pending"}, {"number": 4, "date": "", "time": "20:00", "status": "pending"}]'::jsonb,
        'active', 'Vaga The Chosen 30K + Troféu', '[]'::jsonb, '{}'::jsonb
    ),
    (
        '👑 Liga Elite Dealer Choice', 'Dealer Choice', '3 / 6', 600.00, 10,
        '[{"number": 1, "date": "", "time": "20:00", "status": "pending"}, {"number": 2, "date": "", "time": "20:00", "status": "pending"}, {"number": 3, "date": "", "time": "20:00", "status": "pending"}, {"number": 4, "date": "", "time": "20:00", "status": "pending"}]'::jsonb,
        'active', 'Vaga The Chosen 30K + Troféu', '[]'::jsonb, '{}'::jsonb
    )
ON CONFLICT DO NOTHING;

-- 5. Insert category card into ecosystem_categories
INSERT INTO public.ecosystem_categories (id, title, description, icon, color, "order", col_span, row_span, target_view, button_text, is_mystery, is_hidden, slots)
VALUES (
    'cash-league',
    'Chip Race Cash League',
    'Escolha sua liga, dispute quatro rodadas de Cash Game e conquiste sua vaga para o The Chosen 30K.',
    'casino',
    'emerald',
    7, -- Order to position it well
    2, -- col_span
    1, -- row_span
    'cash-league',
    'JOGAR',
    false,
    false,
    0
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    target_view = EXCLUDED.target_view,
    button_text = EXCLUDED.button_text,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon;

COMMIT;
