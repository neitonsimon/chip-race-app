-- Migration: Add Indexes for Performance & Scalability
-- Description: Creates B-Tree indexes on frequently queried foreign keys to prevent Sequential Scans and drastically reduce CPU load on the database.

BEGIN;

-- 1. Messages (Heavy filtering by user_id in AppContext)
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

-- 2. Commands & Command Items (Critical for Bar, PlayerProfile and Admin Panel)
CREATE INDEX IF NOT EXISTS idx_commands_user_id ON public.commands(user_id);
CREATE INDEX IF NOT EXISTS idx_commands_event_id ON public.commands(event_id);
CREATE INDEX IF NOT EXISTS idx_command_items_command_id ON public.command_items(command_id);

-- 3. Debts (Frequent sum queries per user and reporting)
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);

-- 4. Transactions (Wallet history load)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);

-- 5. User Badges (Load on every profile view)
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);

COMMIT;
