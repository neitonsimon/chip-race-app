-- Migration: Update Cash Leagues table with Aporte, Resgate, Weekday and Bomb Pot columns
-- Date: 2026-07-10 04:38:00

BEGIN;

-- 1. Add new columns to cash_leagues
ALTER TABLE public.cash_leagues
ADD COLUMN IF NOT EXISTS aporte_inicial NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_resgate NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_date TEXT NOT NULL DEFAULT 'Pendente',
ADD COLUMN IF NOT EXISTS weekday TEXT NOT NULL DEFAULT 'Pendente',
ADD COLUMN IF NOT EXISTS bomb_pot_every INTEGER NOT NULL DEFAULT 0;

-- 2. Update existing leagues with reasonable defaults
UPDATE public.cash_leagues SET aporte_inicial = 100, bonus_resgate = 10, weekday = 'Segunda-feira', bomb_pot_every = 30 WHERE name = '⚒️ Liga Ferro';
UPDATE public.cash_leagues SET aporte_inicial = 200, bonus_resgate = 20, weekday = 'Terça-feira', bomb_pot_every = 25 WHERE name = '🥉 Liga Bronze';
UPDATE public.cash_leagues SET aporte_inicial = 300, bonus_resgate = 30, weekday = 'Quarta-feira', bomb_pot_every = 20 WHERE name = '🥈 Liga Prata';
UPDATE public.cash_leagues SET aporte_inicial = 500, bonus_resgate = 50, weekday = 'Quinta-feira', bomb_pot_every = 20 WHERE name = '🥇 Liga Ouro';
UPDATE public.cash_leagues SET aporte_inicial = 1000, bonus_resgate = 100, weekday = 'Sexta-feira', bomb_pot_every = 15 WHERE name = '💠 Liga Platina';
UPDATE public.cash_leagues SET aporte_inicial = 500, bonus_resgate = 50, weekday = 'Sábado', bomb_pot_every = 15 WHERE name = '🌪️ Liga Omaha Sonic';
UPDATE public.cash_leagues SET aporte_inicial = 1000, bonus_resgate = 100, weekday = 'Domingo', bomb_pot_every = 15 WHERE name = '🌊 Liga Omaha Shark';
UPDATE public.cash_leagues SET aporte_inicial = 2000, bonus_resgate = 200, weekday = 'Segunda-feira', bomb_pot_every = 10 WHERE name = '⚡ Liga Omaha Thunder';
UPDATE public.cash_leagues SET aporte_inicial = 2000, bonus_resgate = 200, weekday = 'Quarta-feira', bomb_pot_every = 15 WHERE name = '💎 Liga Diamante';
UPDATE public.cash_leagues SET aporte_inicial = 3000, bonus_resgate = 300, weekday = 'Quinta-feira', bomb_pot_every = 15 WHERE name = '👑 Liga Elite Dealer Choice';

COMMIT;
