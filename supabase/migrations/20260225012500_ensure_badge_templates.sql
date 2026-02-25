-- SQL Migration: Create badge_templates table
-- Data: 2026-02-25

BEGIN;

CREATE TABLE IF NOT EXISTS public.badge_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'stars',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.badge_templates ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
DROP POLICY IF EXISTS "Enable read access for all users" ON public.badge_templates;
CREATE POLICY "Enable read access for all users" ON public.badge_templates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for admins only" ON public.badge_templates;
CREATE POLICY "Enable insert for admins only" ON public.badge_templates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

COMMIT;
