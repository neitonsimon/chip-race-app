-- SQL Migration: Sync Debts with User Totals
-- Data: 2026-02-25

BEGIN;

-- 1. Garantir que a coluna total_pending_debt existe em profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_pending_debt NUMERIC DEFAULT 0;

-- 2. Função para atualizar o total de dívidas pendentes de um usuário
CREATE OR REPLACE FUNCTION public.update_user_total_pending_debt()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE public.profiles
        SET total_pending_debt = (
            SELECT COALESCE(SUM(amount_brl), 0)
            FROM public.debts
            WHERE user_id = NEW.user_id AND status = 'pending'
        )
        WHERE id = NEW.user_id;
        
        -- Se o user_id mudou (raro), atualiza o antigo também
        IF (TG_OP = 'UPDATE' AND OLD.user_id <> NEW.user_id) THEN
            UPDATE public.profiles
            SET total_pending_debt = (
                SELECT COALESCE(SUM(amount_brl), 0)
                FROM public.debts
                WHERE user_id = OLD.user_id AND status = 'pending'
            )
            WHERE id = OLD.user_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles
        SET total_pending_debt = (
            SELECT COALESCE(SUM(amount_brl), 0)
            FROM public.debts
            WHERE user_id = OLD.user_id AND status = 'pending'
        )
        WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar o trigger na tabela debts
DROP TRIGGER IF EXISTS trg_update_debt_total ON public.debts;
CREATE TRIGGER trg_update_debt_total
AFTER INSERT OR UPDATE OR DELETE ON public.debts
FOR EACH ROW EXECUTE FUNCTION public.update_user_total_pending_debt();

-- 4. Sincronização inicial de dados existentes
UPDATE public.profiles p
SET total_pending_debt = (
    SELECT COALESCE(SUM(d.amount_brl), 0)
    FROM public.debts d
    WHERE d.user_id = p.id AND d.status = 'pending'
);

COMMIT;
