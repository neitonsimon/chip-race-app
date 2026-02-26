-- SQL Migration: Adicionar is_mystery e slots à tabela ecosystem_categories
-- Data: 2026-02-25

BEGIN;

-- 1. Adicionar colunas faltantes à tabela ecosystem_categories
ALTER TABLE public.ecosystem_categories 
ADD COLUMN IF NOT EXISTS is_mystery BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS slots INTEGER DEFAULT 0;

-- 2. Garantir que as colunas básicas existam (caso a tabela tenha sido criada manualmente incompleta)
ALTER TABLE public.ecosystem_categories 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'primary',
ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

COMMIT;
