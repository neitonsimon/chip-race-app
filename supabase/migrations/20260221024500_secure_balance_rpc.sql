-- Function to securely deduct BRL balance
CREATE OR REPLACE FUNCTION deduct_brl_balance(user_id UUID, amount NUMERIC)
RETURNS boolean AS $$
DECLARE
    current_balance NUMERIC;
BEGIN
    -- Check current balance and lock row
    SELECT balance_brl INTO current_balance
    FROM public.profiles
    WHERE id = user_id FOR UPDATE;

    IF current_balance >= amount THEN
        UPDATE public.profiles
        SET balance_brl = balance_brl - amount
        WHERE id = user_id;
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to securely deduct CHIPZ balance
CREATE OR REPLACE FUNCTION deduct_chipz_balance(user_id UUID, amount INTEGER)
RETURNS boolean AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- Check current balance and lock row
    SELECT balance_chipz INTO current_balance
    FROM public.profiles
    WHERE id = user_id FOR UPDATE;

    IF current_balance >= amount THEN
        UPDATE public.profiles
        SET balance_chipz = balance_chipz - amount
        WHERE id = user_id;
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to securely add BRL balance
CREATE OR REPLACE FUNCTION add_brl_balance(user_id UUID, amount NUMERIC)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET balance_brl = balance_brl + amount
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to securely add CHIPZ balance
CREATE OR REPLACE FUNCTION add_chipz_balance(user_id UUID, amount INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET balance_chipz = balance_chipz + amount
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
