-- Migration: Fix secure_balance_transaction to allow normal user purchases
-- Description: Updates the secure_balance_transaction RPC to allow normal users to spend their own balance (debit) on categories like 'vip' and 'purchase', while preventing them from crediting themselves or moving other users' funds.

BEGIN;

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
    v_has_deposited BOOLEAN;
    v_bonus_amount NUMERIC := 0;
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

    -- SECURITY CHECK
    IF NOT v_is_admin AND NOT v_is_service_role THEN
        -- Normais não podem mexer na conta dos outros
        IF auth.uid() != p_user_id THEN
            RAISE EXCEPTION 'Acesso negado: Você não pode alterar a carteira de outro usuário.';
        END IF;

        IF p_category = 'wallet_withdrawal' THEN
            -- OK para solicitação de saque
        ELSIF p_category IN ('vip', 'purchase') THEN
            -- Para compras/vip, o usuário só pode usar a função para DEBITAR o próprio saldo
            IF p_brl_amount > 0 OR p_chipz_amount > 0 THEN
                RAISE EXCEPTION 'Acesso negado: Usuários normais não podem gerar este tipo de crédito.';
            END IF;
        ELSE
            RAISE EXCEPTION 'Acesso negado: Apenas administradores podem realizar transações desta categoria.';
        END IF;
    END IF;

    v_rounded_brl := ROUND(p_brl_amount, 2);

    -- Bloqueia a linha para evitar condição de corrida (race conditions)
    SELECT balance_brl, balance_chipz INTO v_current_brl, v_current_chipz
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN RETURN FALSE; END IF;

    -- Checa se o saldo é suficiente apenas para débitos
    IF (v_current_brl + v_rounded_brl < -0.001) OR (v_current_chipz + p_chipz_amount < 0) THEN
        IF NOT v_is_admin THEN
            RAISE EXCEPTION 'Saldo insuficiente.';
        END IF;
        RETURN FALSE;
    END IF;

    IF v_rounded_brl > 0 OR p_chipz_amount > 0 THEN
        v_type := 'credit';
    ELSE
        v_type := 'debit';
    END IF;

    -- REGRA DE PRIMEIRO DEPOSITO COM BÔNUS E BLOQUEIO
    IF v_type = 'credit' AND p_category IN ('wallet_deposit', 'recharge', 'online_credit') THEN
        
        -- Verifica se já existem transações nestas categorias positivas do usuario (primeiro deposito)
        SELECT EXISTS (
            SELECT 1 FROM public.transactions 
            WHERE user_id = p_user_id 
              AND category IN ('wallet_deposit', 'recharge', 'online_credit')
              AND amount_brl > 0
        ) INTO v_has_deposited;

        IF NOT v_has_deposited THEN
            -- Primeiro deposito! Calcula 50% de bonus, maximo R$ 250
            v_bonus_amount := ROUND(v_rounded_brl * 0.5, 2);
            IF v_bonus_amount > 250.00 THEN
                v_bonus_amount := 250.00;
            END IF;

            -- Soma bonus ao montante creditado
            v_rounded_brl := v_rounded_brl + v_bonus_amount;
            
            -- Adiciona tag de bonus na descricao
            p_description := p_description || ' (+ R$ ' || v_bonus_amount || ' Bônus)';

            UPDATE public.profiles
            SET 
                balance_brl = balance_brl + v_rounded_brl,
                balance_chipz = balance_chipz + p_chipz_amount,
                locked_balance_brl = v_rounded_brl,
                balance_unlock_date = NOW() + INTERVAL '30 days'
            WHERE id = p_user_id;

        ELSE
            -- Nao eh primeiro deposito: debita normal sem travar e sem bonus
            UPDATE public.profiles
            SET 
                balance_brl = balance_brl + v_rounded_brl,
                balance_chipz = balance_chipz + p_chipz_amount
            WHERE id = p_user_id;
        END IF;

    ELSE
        -- Debit ou categorias que nao travam
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
