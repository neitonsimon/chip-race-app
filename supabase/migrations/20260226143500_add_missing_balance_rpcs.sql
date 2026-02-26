-- Migration: Add missing balance and exp RPC functions
-- Description: Creates the missing increment_balance_brl, deduct_balance_brl, and bulk_add_event_exp functions required by the admin panel.

BEGIN;

-- 1. increment_balance_brl: Adds BRL to a user's profile
CREATE OR REPLACE FUNCTION public.increment_balance_brl(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET balance_brl = COALESCE(balance_brl, 0) + ROUND(p_amount, 2)
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. deduct_balance_brl: Safely removes BRL from a user's profile if they have enough balance
CREATE OR REPLACE FUNCTION public.deduct_balance_brl(p_user_id UUID, p_amount NUMERIC)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_bal NUMERIC;
    v_amount NUMERIC;
BEGIN
    v_amount := ROUND(p_amount, 2);
    
    -- Lock row for update
    SELECT balance_brl INTO v_current_bal 
    FROM public.profiles 
    WHERE id = p_user_id 
    FOR UPDATE;
    
    IF v_current_bal >= v_amount THEN
        UPDATE public.profiles 
        SET balance_brl = balance_brl - v_amount 
        WHERE id = p_user_id;
        RETURN TRUE;
    ELSE
        -- We return false, but also we can check in JS. 
        -- To be extremely safe with current JS code:
        RAISE EXCEPTION 'Saldo insuficiente para realizar a dedução.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. bulk_add_event_exp: Adds XP to multiple users at once
CREATE OR REPLACE FUNCTION public.bulk_add_event_exp(p_user_ids UUID[], p_exp_amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET current_exp = COALESCE(current_exp, 0) + p_exp_amount
    WHERE id = ANY(p_user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. add_chipz_balance: Ensure it exists with consistent logic
CREATE OR REPLACE FUNCTION public.add_chipz_balance(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET balance_chipz = COALESCE(balance_chipz, 0) + amount
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
