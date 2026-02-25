-- SQL Migration: Unicidade de Insígnias (Ícone + Cor)
-- Data: 2026-02-25
-- Esta migração garante que cada combinação de ícone e cor seja única na tabela badge_templates.

BEGIN;

-- 1. Garantir que a coluna color existe (caso não tenha sido criada)
ALTER TABLE public.badge_templates ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#00E5FF';

-- 2. Remover duplicatas existentes antes de aplicar a restrição
-- Se houver insígnias com o mesmo ícone e cor, mantemos apenas a mais recente
DELETE FROM public.badge_templates
WHERE id NOT IN (
    SELECT DISTINCT ON (icon, color) id
    FROM public.badge_templates
    ORDER BY icon, color, created_at DESC
);

-- 3. Adicionar a restrição de unicidade (Unique Constraint)
-- Primeiro removemos caso já exista uma restrição similar
ALTER TABLE public.badge_templates DROP CONSTRAINT IF EXISTS badge_templates_icon_color_key;
ALTER TABLE public.badge_templates ADD CONSTRAINT badge_templates_icon_color_key UNIQUE (icon, color);

COMMIT;
