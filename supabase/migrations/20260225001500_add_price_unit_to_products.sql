-- SQL Migration: Add price_unit column to products
-- Data: 2026-02-25

BEGIN;

-- Adicionar a coluna price_unit se ela não existir
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS price_unit TEXT;

COMMIT;
