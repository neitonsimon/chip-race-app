-- Migration: Security Hardening - RLS & Column Protection
-- Description: Ensures RLS is enabled on all sensitive tables and implements column-level protection via triggers to prevent non-admins from editing financial data.

BEGIN;

-- 🛡️ 1. Ensure RLS is enabled on all sensitive tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.command_items ENABLE ROW LEVEL SECURITY;

-- 🛡️ 2. Clean up existing policies for profiles to ensure no "leaks"
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can view non-sensitive profile data" ON public.profiles;

-- 🛡️ 3. Implement Strict Access Policies for Profiles
-- Anyone can see public profile info
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Admins can do anything
CREATE POLICY "Admins have full access to profiles" 
ON public.profiles FOR ALL 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- 🛡️ 4. Block Column-Level Updates for Non-Admins on Profiles
-- This prevents a user from calling .update({balance_brl: 1000}) in the console.
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- If the caller is NOT an admin, prevent changing sensitive fields
    IF (SELECT role FROM public.profiles WHERE id = auth.uid()) IS DISTINCT FROM 'admin' THEN
        -- Revert sensitive fields to their OLD values
        NEW.balance_brl := OLD.balance_brl;
        NEW.balance_chipz := OLD.balance_chipz;
        NEW.role := OLD.role;
        NEW.debt_limit_brl := OLD.debt_limit_brl;
        NEW.total_pending_debt := OLD.total_pending_debt;
        NEW.email := OLD.email; -- Common safety
        
        -- Special case: if someone tries to change their ID to someone else's
        NEW.id := OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_sensitive_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_sensitive_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_profile_fields();


-- 🛡️ 5. Harden Transactions, Debts, and Commands
-- These tables should be READ-ONLY for users. Only RPCs (Security Definer) or Admins can write.

-- Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to transactions" ON public.transactions;
CREATE POLICY "Admins have full access to transactions" 
ON public.transactions FOR ALL 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Debts
DROP POLICY IF EXISTS "Users can view own debts" ON public.debts;
CREATE POLICY "Users can view own debts" 
ON public.debts FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to debts" ON public.debts;
CREATE POLICY "Admins have full access to debts" 
ON public.debts FOR ALL 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Commands
DROP POLICY IF EXISTS "Users can view own commands" ON public.commands;
CREATE POLICY "Users can view own commands" 
ON public.commands FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to commands" ON public.commands;
CREATE POLICY "Admins have full access to commands" 
ON public.commands FOR ALL 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

COMMIT;
