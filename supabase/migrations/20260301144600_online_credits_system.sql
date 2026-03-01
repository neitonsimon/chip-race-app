-- Adds Suprema Poker details to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suprema_nickname TEXT,
ADD COLUMN IF NOT EXISTS suprema_user_id TEXT;

-- Create online_credit_requests table
CREATE TABLE IF NOT EXISTS public.online_credit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    suprema_nickname TEXT NOT NULL,
    suprema_user_id TEXT NOT NULL,
    amount_brl NUMERIC NOT NULL CHECK (amount_brl > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies
ALTER TABLE public.online_credit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
    ON public.online_credit_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
    ON public.online_credit_requests FOR SELECT
    USING (public.is_admin());

-- No direct INSERT/UPDATE policies for users to prevent bypassing the RPC

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE online_credit_requests;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_modified_column_credit_requests()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_online_credit_requests_modtime
    BEFORE UPDATE ON public.online_credit_requests
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column_credit_requests();

-- RPC for securely requesting credits (deducts BRL immediately)
CREATE OR REPLACE FUNCTION request_online_credits(
    p_amount NUMERIC,
    p_suprema_nickname TEXT,
    p_suprema_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_current_brl NUMERIC;
    v_request_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
         RAISE EXCEPTION 'Não autenticado';
    END IF;

    -- Update profile with latest suprema details if not set or changed
    UPDATE public.profiles
    SET suprema_nickname = p_suprema_nickname,
        suprema_user_id = p_suprema_id
    WHERE id = v_user_id;

    -- Lock the profile row to prevent race conditions
    SELECT balance_brl INTO v_current_brl
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF v_current_brl < p_amount THEN
        RAISE EXCEPTION 'Saldo insuficiente.';
    END IF;

    -- Deduct balance
    UPDATE public.profiles
    SET balance_brl = balance_brl - p_amount
    WHERE id = v_user_id;

    -- Log transaction
    INSERT INTO public.transactions (user_id, amount_brl, amount_chipz, description, category, type)
    VALUES (v_user_id, -p_amount, 0, 'Solicitação de Créditos Online (Suprema Poker)', 'purchase', 'debit');

    -- Create request record
    INSERT INTO public.online_credit_requests (user_id, suprema_nickname, suprema_user_id, amount_brl)
    VALUES (v_user_id, p_suprema_nickname, p_suprema_id, p_amount)
    RETURNING id INTO v_request_id;

    RETURN jsonb_build_object('success', true, 'request_id', v_request_id);
END;
$$;


-- RPC for Admins to process a request
CREATE OR REPLACE FUNCTION process_online_credit_request(
    p_request_id UUID,
    p_action TEXT -- 'complete' or 'cancel'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
    v_is_admin BOOLEAN;
    v_req RECORD;
BEGIN
    v_admin_id := auth.uid();
    
    -- Check admin
    SELECT public.is_admin() INTO v_is_admin;
    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Acesso negado';
    END IF;

    -- Lock the request
    SELECT * INTO v_req
    FROM public.online_credit_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF v_req IS NULL THEN
        RAISE EXCEPTION 'Pedido não encontrado.';
    END IF;

    IF v_req.status != 'pending' THEN
        RAISE EXCEPTION 'Este pedido já foi processado (%).', v_req.status;
    END IF;

    IF p_action = 'complete' THEN
        UPDATE public.online_credit_requests
        SET status = 'completed', updated_at = NOW()
        WHERE id = p_request_id;

        -- Send message to user
        INSERT INTO public.messages (user_id, sender_id, sender, subject, content, category, is_read)
        VALUES (v_req.user_id, v_admin_id, 'Admin', 'Créditos Online Enviados', 
            'Seus créditos no valor de R$ ' || v_req.amount_brl::TEXT || ' foram despachados para sua conta na Suprema Poker (' || v_req.suprema_nickname || '). Boa Sorte!', 
            'system', false);
            
    ELSIF p_action = 'cancel' THEN
        -- Mark as cancelled
        UPDATE public.online_credit_requests
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = p_request_id;

        -- Refund BRL securely
        UPDATE public.profiles
        SET balance_brl = balance_brl + v_req.amount_brl
        WHERE id = v_req.user_id;

        -- Log refund
        INSERT INTO public.transactions (user_id, amount_brl, amount_chipz, description, category, type)
        VALUES (v_req.user_id, v_req.amount_brl, 0, 'Estorno: Solicitação de Créditos Online Cancelada/Recusada', 'wallet_deposit', 'credit');

        -- Send message to user
        INSERT INTO public.messages (user_id, sender_id, sender, subject, content, category, is_read)
        VALUES (v_req.user_id, v_admin_id, 'Admin', 'Pedido de Créditos Recusado', 
            'Seu pedido de créditos na Suprema Poker foi recusado. O valor de R$ ' || v_req.amount_brl::TEXT || ' foi devolvido ao seu saldo.', 
            'system', false);

    ELSE
        RAISE EXCEPTION 'Ação inválida. Use complete ou cancel.';
    END IF;

    RETURN jsonb_build_object('success', true, 'status', p_action);
END;
$$;
