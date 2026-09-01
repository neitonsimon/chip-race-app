-- Migration: Add min_players to cash_leagues table
-- Date: 2026-07-20 01:16:45

BEGIN;

ALTER TABLE public.cash_leagues
ADD COLUMN IF NOT EXISTS min_players INTEGER NOT NULL DEFAULT 5;

COMMIT;
