-- Migration: Allow Staff roles and harden Messages RLS
-- Description: Updates RPCs and triggers to include 'staff' role and ensures the messages table is properly secured.

BEGIN;

-- 🛡️ 1. Update Profile Protection Trigger to allow Staff
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_auth_role TEXT;
    v_caller_profile_role TEXT;
BEGIN
    -- Get role from JWT
    v_caller_auth_role := public.get_auth_role();
    
    -- If it's a service role, allow everything
    IF v_caller_auth_role = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- Check if it's an admin or staff via profiles table
    IF auth.uid() IS NOT NULL THEN
        SELECT role INTO v_caller_profile_role FROM public.profiles WHERE id = auth.uid();
        
        -- If the caller is an admin or staff, let them do anything
        IF v_caller_profile_role IN ('admin', 'staff') THEN
            RETURN NEW;
        END IF;

        -- Block sensitive column updates for regular users
        IF (NEW.balance_brl IS DISTINCT FROM OLD.balance_brl) OR
           (NEW.balance_chipz IS DISTINCT FROM OLD.balance_chipz) OR
           (NEW.role IS DISTINCT FROM OLD.role) OR
           (NEW.debt_limit_brl IS DISTINCT FROM OLD.debt_limit_brl) OR
           (NEW.total_pending_debt IS DISTINCT FROM OLD.total_pending_debt) THEN
           
            -- REVERT SENSITIVE FIELDS
            NEW.balance_brl := OLD.balance_brl;
            NEW.balance_chipz := OLD.balance_chipz;
            NEW.role := OLD.role;
            NEW.debt_limit_brl := OLD.debt_limit_brl;
            NEW.total_pending_debt := OLD.total_pending_debt;
        END IF;
    ELSE
        -- No authenticated user? Revert everything just in case.
        NEW.balance_brl := OLD.balance_brl;
        NEW.balance_chipz := OLD.balance_chipz;
        NEW.role := OLD.role;
        NEW.debt_limit_brl := OLD.debt_limit_brl;
    END IF;

    -- Safety: Never let non-admins change their own ID or email accidentally
    IF auth.uid() IS NOT NULL AND v_caller_profile_role NOT IN ('admin', 'staff') THEN
        NEW.id := OLD.id;
        NEW.email := OLD.email;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🛡️ 2. Update Admin RPCs to allow Staff
DROP FUNCTION IF EXISTS public.bulk_add_event_exp(UUID[], INTEGER);
CREATE OR REPLACE FUNCTION public.bulk_add_event_exp(p_user_ids UUID[], p_exp_amount INTEGER)
RETURNS VOID AS $$
BEGIN
    -- 🔒 SECURITY CHECK (Allow admin and staff)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')) THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    UPDATE public.profiles
    SET current_exp = COALESCE(current_exp, 0) + p_exp_amount
    WHERE id = ANY(p_user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.settle_debt_with_balance(UUID, UUID, NUMERIC);
CREATE OR REPLACE FUNCTION public.settle_debt_with_balance(
    p_user_id UUID,
    p_debt_id UUID,
    p_pay_amount NUMERIC
) RETURNS JSONB AS $$
DECLARE
    v_user_balance NUMERIC;
    v_debt_amount NUMERIC;
BEGIN
    -- Security check
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Acesso negado.');
    END IF;

    -- Get user balance
    SELECT balance_brl INTO v_user_balance FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    IF v_user_balance < p_pay_amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Saldo insuficiente.');
    END IF;

    -- Get debt info
    SELECT amount_brl INTO v_debt_amount FROM public.debts WHERE id = p_debt_id FOR UPDATE;
    IF v_debt_amount < p_pay_amount THEN
        RETURN jsonb_build_object('success', false, 'message', 'Valor superior à dívida.');
    END IF;

    -- Perform transaction
    IF NOT public.secure_balance_transaction(
        p_user_id,
        -p_pay_amount,
        0,
        'Liquidação de Pendura via Saldo',
        'debt_payment',
        jsonb_build_object('debt_id', p_debt_id)
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Erro na transação de saldo.');
    END IF;

    -- Update debt
    IF p_pay_amount = v_debt_amount THEN
        UPDATE public.debts SET status = 'paid', paid_at = now() WHERE id = p_debt_id;
    ELSE
        UPDATE public.debts SET amount_brl = amount_brl - p_pay_amount WHERE id = p_debt_id;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.increment_balance_brl(UUID, NUMERIC);
CREATE OR REPLACE FUNCTION public.increment_balance_brl(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    -- 🔒 SECURITY CHECK (Allow admin and staff)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')) THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    UPDATE public.profiles
    SET balance_brl = COALESCE(balance_brl, 0) + ROUND(p_amount, 2)
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.deduct_balance_brl(UUID, NUMERIC);
CREATE OR REPLACE FUNCTION public.deduct_balance_brl(p_user_id UUID, p_amount NUMERIC)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_bal NUMERIC;
    v_amount NUMERIC;
BEGIN
    -- 🔒 SECURITY CHECK (Allow admin and staff)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')) THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

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
        RAISE EXCEPTION 'Saldo insuficiente para realizar a dedução.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.add_chipz_balance(UUID, INTEGER);
CREATE OR REPLACE FUNCTION public.add_chipz_balance(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
    -- 🔒 SECURITY CHECK (Allow admin and staff)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')) THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    UPDATE public.profiles
    SET balance_chipz = COALESCE(balance_chipz, 0) + p_amount
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🛡️ 3. Harden Messages Table RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" 
ON public.messages FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins and staff can manage all messages" ON public.messages;
CREATE POLICY "Admins and staff can manage all messages" 
ON public.messages FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
);

COMMIT;
