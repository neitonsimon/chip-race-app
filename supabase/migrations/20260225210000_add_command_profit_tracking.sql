-- SQL Migration: Add Cash Out and Profit tracking to Commands
-- Data: 2026-02-25

BEGIN;

-- 1. Alterar tabela commands para registrar Cash Out e Lucro
ALTER TABLE public.commands 
ADD COLUMN IF NOT EXISTS cash_out_brl NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_brl NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_cash_payment_brl NUMERIC DEFAULT 0;

COMMIT;
