-- SQL Migration: Adicionar campo Open Bar e Renomear Jackpot
-- Data: 2026-02-25

BEGIN;

-- 1. Adicionar coluna cash_game_open_bar à tabela events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS cash_game_open_bar BOOLEAN DEFAULT false;

-- 2. Limpeza de terminologia (opcional, mas bom para consistência se houver metadados)
-- Nota: O Jackpot é apenas uma string de ID no código, mas se houver descrições no banco, podem ser atualizadas.
-- No appConfig.json/content_db já estamos atualizando as labels.

COMMIT;
