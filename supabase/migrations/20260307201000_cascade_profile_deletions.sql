-- Migration: Fix profile deletions (ON DELETE CASCADE)
-- Description: Updates the foreign key constraints that point to the profiles table to automatically delete or detach related records when a profile is deleted, resolving the foreign key constraint errors.

-- 1. Messages table
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_user_id_fkey,
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Tournament Reservations table
ALTER TABLE public.tournament_reservations
  DROP CONSTRAINT IF EXISTS tournament_reservations_user_id_fkey;

ALTER TABLE public.tournament_reservations
  ADD CONSTRAINT tournament_reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Online Credit Requests
ALTER TABLE public.online_credit_requests
  DROP CONSTRAINT IF EXISTS online_credit_requests_user_id_fkey;

ALTER TABLE public.online_credit_requests
  ADD CONSTRAINT online_credit_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. Debts table
ALTER TABLE public.debts
  DROP CONSTRAINT IF EXISTS debts_user_id_fkey;

ALTER TABLE public.debts
  ADD CONSTRAINT debts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. Transactions table
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 6. Commands table
ALTER TABLE public.commands
  DROP CONSTRAINT IF EXISTS commands_user_id_fkey;

ALTER TABLE public.commands
  ADD CONSTRAINT commands_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Note: We only add CASCADE on the main referenced tables to allow users/ghosts to be hard deleted.
