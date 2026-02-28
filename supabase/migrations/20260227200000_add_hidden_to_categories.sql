-- SQL Migration: Adicionar is_hidden à tabela ecosystem_categories
-- Data: 2026-02-27

BEGIN;

ALTER TABLE public.ecosystem_categories 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

COMMIT;
