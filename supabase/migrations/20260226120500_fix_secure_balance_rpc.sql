-- Migration: Fix secure_balance_transaction RPC and handle floating point precision
-- Description: Ensures the transactions table exists and creates a robust secure_balance_transaction RPC.
-- This fix rounds the BRL amount to 2 decimal places to avoid floating point precision issues that were causing transactions to fail incorrectly.

BEGIN;

-- 1. Ensure transactions table exists with correct schema
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_brl NUMERIC NOT NULL DEFAULT 0,
    amount_chipz INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    category TEXT,
    type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add column type if it doesn't exist (used for credit/debit distinction)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'transactions' AND COLUMN_NAME = 'type') THEN
        ALTER TABLE public.transactions ADD COLUMN type TEXT;
    END IF;
END $$;

-- 2. Ensure indexes for performance
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON public.transactions(created_at);

-- 3. Define the main secure_balance_transaction function
CREATE OR REPLACE FUNCTION public.secure_balance_transaction(
    p_user_id UUID,
    p_brl_amount NUMERIC,
    p_chipz_amount INTEGER DEFAULT 0,
    p_description TEXT DEFAULT '',
    p_category TEXT DEFAULT 'system',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_brl NUMERIC;
    v_current_chipz INTEGER;
    v_type TEXT;
    v_rounded_brl NUMERIC;
BEGIN
    -- 1. Round BRL amount to 2 decimal places to prevent floating point mismatch (JS vs Postgres NUMERIC(10,2))
    v_rounded_brl := ROUND(p_brl_amount, 2);

    -- 2. Lock the profile row for update
    SELECT balance_brl, balance_chipz INTO v_current_brl, v_current_chipz
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- 3. Validate sufficient balance
    -- Check if new balance would be negative (with a tiny epsilon for safety)
    IF (v_current_brl + v_rounded_brl < -0.001) OR (v_current_chipz + p_chipz_amount < 0) THEN
        RETURN FALSE;
    END IF;

    -- 4. Update public.profiles
    UPDATE public.profiles
    SET 
        balance_brl = balance_brl + v_rounded_brl,
        balance_chipz = balance_chipz + p_chipz_amount
    WHERE id = p_user_id;

    -- 5. Determine transaction type
    IF v_rounded_brl > 0 OR p_chipz_amount > 0 THEN
        v_type := 'credit';
    ELSE
        v_type := 'debit';
    END IF;

    -- 6. Insert log record
    INSERT INTO public.transactions (
        user_id,
        amount_brl,
        amount_chipz,
        description,
        category,
        type,
        metadata,
        created_at
    ) VALUES (
        p_user_id,
        v_rounded_brl,
        p_chipz_amount,
        p_description,
        p_category,
        v_type,
        p_metadata,
        NOW()
    );

    RETURN TRUE;

EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
