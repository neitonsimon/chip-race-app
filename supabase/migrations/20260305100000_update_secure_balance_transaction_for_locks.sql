-- Migration: Implement logic for locking withdrawals based on deposit category
-- Description: Updates the secure_balance_transaction to implement +30 days locks for wallet_deposit, online_credit, recharge.
-- Keeps command_profit and gift free from locks.

BEGIN;

-- DERRUBAR AS FUNCOES ANTIGAS CONFLITANTES PARA NAO HAVER AMBIGUIDADE!
DROP FUNCTION IF EXISTS public.secure_balance_transaction(uuid, numeric, integer, text, text, jsonb, boolean);
DROP FUNCTION IF EXISTS public.secure_balance_transaction(uuid, numeric, integer, text, text, jsonb, boolean, boolean);
DROP FUNCTION IF EXISTS public.secure_balance_transaction(uuid, numeric, integer, text, text, jsonb);

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
    BEGIN
        v_is_service_role := (current_setting('request.jwt.claims', true)::jsonb->>'role') = 'service_role';
    EXCEPTION WHEN OTHERS THEN
        v_is_service_role := FALSE;
    END;
    
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
    ) INTO v_is_admin;

    -- Apenas o PIX ou o próprio usuário efetuando saque que recebem passe sem ser admin:
    IF p_category = 'wallet_withdrawal' THEN
        IF auth.uid() != p_user_id AND NOT v_is_admin AND NOT v_is_service_role THEN
             RAISE EXCEPTION 'Acesso negado para saque.';
        END IF;
    ELSIF NOT v_is_admin AND NOT v_is_service_role THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores ou sistema podem realizar transações financeiras.';
    END IF;

    v_rounded_brl := ROUND(p_brl_amount, 2);

    SELECT balance_brl, balance_chipz INTO v_current_brl, v_current_chipz
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN RETURN FALSE; END IF;

    IF (v_current_brl + v_rounded_brl < -0.001) OR (v_current_chipz + p_chipz_amount < 0) THEN
        RETURN FALSE;
    END IF;

    IF v_rounded_brl > 0 OR p_chipz_amount > 0 THEN
        v_type := 'credit';
    ELSE
        v_type := 'debit';
    END IF;

    -- REGRA DE BLOQUEIO ENTRA AQUI!
    IF v_type = 'credit' AND p_category IN ('wallet_deposit', 'recharge', 'online_credit') THEN
        UPDATE public.profiles
        SET 
            balance_brl = balance_brl + v_rounded_brl,
            balance_chipz = balance_chipz + p_chipz_amount,
            locked_balance_brl = COALESCE(locked_balance_brl, 0) + v_rounded_brl,
            balance_unlock_date = NOW() + INTERVAL '30 days'
        WHERE id = p_user_id;
    ELSE
        -- Nao bloqueia e nao soma: Command_profit (Comanda), Gift (Premio), Refund e demais
        UPDATE public.profiles
        SET 
            balance_brl = balance_brl + v_rounded_brl,
            balance_chipz = balance_chipz + p_chipz_amount
        WHERE id = p_user_id;
    END IF;

    INSERT INTO public.transactions (
        user_id, amount_brl, amount_chipz, description, category, type, metadata, created_at
    ) VALUES (
        p_user_id, v_rounded_brl, p_chipz_amount, p_description, p_category, v_type, p_metadata, NOW()
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
