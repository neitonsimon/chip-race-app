-- Migration: Implement logic for locking withdrawals based on deposit category
-- Description: Updates the secure_balance_transaction to implement +30 days locks for wallet_deposit, online_credit, recharge.
-- Keeps command_profit and gift free from locks.
-- Also allows service_role to bypass the admin check (for webhooks).

BEGIN;

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
    v_is_service_role BOOLEAN;
    v_is_admin BOOLEAN;
BEGIN
    -- Check roles safely
    -- current_setting defaults to '' if not found, but we need to safely check if it is service_role
    BEGIN
        v_is_service_role := (current_setting('request.jwt.claims', true)::jsonb->>'role') = 'service_role';
    EXCEPTION WHEN OTHERS THEN
        v_is_service_role := FALSE;
    END;
    
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
    ) INTO v_is_admin;

    -- wallet_withdrawal can be initiated by the user for themselves
    IF p_category = 'wallet_withdrawal' THEN
        -- Only the user can withdraw for themselves unless it is admin/service
        IF auth.uid() != p_user_id AND NOT v_is_admin AND NOT v_is_service_role THEN
             RAISE EXCEPTION 'Acesso negado para saque.';
        END IF;
    ELSIF NOT v_is_admin AND NOT v_is_service_role THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores ou sistema podem realizar transações financeiras.';
    END IF;

    -- 1. Round BRL amount to 2 decimal places
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
    IF (v_current_brl + v_rounded_brl < -0.001) OR (v_current_chipz + p_chipz_amount < 0) THEN
        RETURN FALSE;
    END IF;

    -- 4. Determine transaction type
    IF v_rounded_brl > 0 OR p_chipz_amount > 0 THEN
        v_type := 'credit';
    ELSE
        v_type := 'debit';
    END IF;

    -- 5. Apply locking rules + update balance
    IF v_type = 'credit' AND p_category IN ('wallet_deposit', 'recharge', 'online_credit') THEN
        UPDATE public.profiles
        SET 
            balance_brl = balance_brl + v_rounded_brl,
            balance_chipz = balance_chipz + p_chipz_amount,
            locked_balance_brl = COALESCE(locked_balance_brl, 0) + v_rounded_brl,
            balance_unlock_date = NOW() + INTERVAL '30 days'
        WHERE id = p_user_id;
    ELSE
        -- No locking for command_profit, gift, etc., just update balance
        UPDATE public.profiles
        SET 
            balance_brl = balance_brl + v_rounded_brl,
            balance_chipz = balance_chipz + p_chipz_amount
        WHERE id = p_user_id;
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
        IF SQLSTATE = 'P0001' THEN
            RAISE EXCEPTION '%', SQLERRM;
        END IF;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
