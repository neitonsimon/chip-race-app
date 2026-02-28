-- Migration: Blind RPCs with security checks
-- Description: Adds a check to critical RPC functions to ensure they can only be called by users with the 'admin' role.

BEGIN;

-- 🛠️ 1. Secure secure_balance_transaction
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
    -- 🔒 SECURITY CHECK: Only Admins can call this
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores podem realizar transações financeiras.';
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
        -- If it was a security exception, re-raise it
        IF SQLSTATE = 'P0001' THEN
            RAISE EXCEPTION '%', SQLERRM;
        END IF;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 🛠️ 2. Secure settle_debt_with_balance
CREATE OR REPLACE FUNCTION public.settle_debt_with_balance(
    p_user_id UUID,
    p_debt_id UUID,
    p_pay_amount NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_current_balance NUMERIC;
    v_debt_amount NUMERIC;
    v_debt_status TEXT;
    v_command_id UUID;
    v_is_partial BOOLEAN;
BEGIN
    -- 🔒 SECURITY CHECK: Only Admins can call this
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores podem baixar pendências.';
    END IF;

    -- 1. Get debt info and lock it
    SELECT amount_brl, status, command_id INTO v_debt_amount, v_debt_status, v_command_id
    FROM public.debts
    WHERE id = p_debt_id AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pendência não encontrada.');
    END IF;

    IF v_debt_status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Esta pendência já foi baixada ou cancelada.');
    END IF;

    IF p_pay_amount <= 0 OR p_pay_amount > v_debt_amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Valor de pagamento inválido.');
    END IF;

    -- 2. Get user balance and lock it
    SELECT balance_brl INTO v_current_balance
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_current_balance < p_pay_amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Saldo insuficiente no aplicativo.');
    END IF;

    -- 3. Execute deduction
    UPDATE public.profiles
    SET balance_brl = balance_brl - p_pay_amount
    WHERE id = p_user_id;

    -- 4. Update debt
    v_is_partial := p_pay_amount < v_debt_amount;
    
    IF v_is_partial THEN
        UPDATE public.debts
        SET amount_brl = amount_brl - p_pay_amount
        WHERE id = p_debt_id;
    ELSE
        UPDATE public.debts
        SET status = 'paid', paid_at = NOW()
        WHERE id = p_debt_id;
    END IF;

    -- 5. Log transaction
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
        -p_pay_amount,
        0,
        CASE WHEN v_is_partial THEN 'Pagamento parcial de pendura' ELSE 'Quitação de pendura' END || ' (Comanda ' || COALESCE(substring(v_command_id::text from 1 for 8), 'N/A') || ')',
        'purchase',
        'debit',
        jsonb_build_object('debt_id', p_debt_id, 'command_id', v_command_id, 'is_partial', v_is_partial),
        NOW()
    );

    RETURN jsonb_build_object('success', true, 'message', 'Pagamento realizado com sucesso!');
EXCEPTION
    WHEN OTHERS THEN
        -- If it was a security exception, re-raise it
        IF SQLSTATE = 'P0001' THEN
            RAISE EXCEPTION '%', SQLERRM;
        END IF;
        RETURN jsonb_build_object('success', false, 'message', 'Erro interno: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 🛠️ 3. Secure increment_balance_brl
CREATE OR REPLACE FUNCTION public.increment_balance_brl(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    -- 🔒 SECURITY CHECK
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    UPDATE public.profiles
    SET balance_brl = COALESCE(balance_brl, 0) + ROUND(p_amount, 2)
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 🛠️ 4. Secure deduct_balance_brl
CREATE OR REPLACE FUNCTION public.deduct_balance_brl(p_user_id UUID, p_amount NUMERIC)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_bal NUMERIC;
    v_amount NUMERIC;
BEGIN
    -- 🔒 SECURITY CHECK
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    v_amount := ROUND(p_amount, 2);
    
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
        RAISE EXCEPTION 'Saldo insuficiente para realizar a dedução.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 🛠️ 5. Secure bulk_add_event_exp
CREATE OR REPLACE FUNCTION public.bulk_add_event_exp(p_user_ids UUID[], p_exp_amount INTEGER)
RETURNS VOID AS $$
BEGIN
    -- 🔒 SECURITY CHECK
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    UPDATE public.profiles
    SET current_exp = COALESCE(current_exp, 0) + p_exp_amount
    WHERE id = ANY(p_user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 🛠️ 6. Secure add_chipz_balance
CREATE OR REPLACE FUNCTION public.add_chipz_balance(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
    -- 🔒 SECURITY CHECK
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    UPDATE public.profiles
    SET balance_chipz = COALESCE(balance_chipz, 0) + amount
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
