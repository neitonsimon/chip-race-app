-- SQL Migration: Add RPC for settling debts with balance
-- Data: 2026-02-25

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
        RETURN jsonb_build_object('success', false, 'message', 'Erro interno: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
