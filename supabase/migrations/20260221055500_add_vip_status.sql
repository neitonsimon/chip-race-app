-- Adicionar colunas de status VIP na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS vip_status text DEFAULT 'nao_vip' CHECK (vip_status IN ('nao_vip', 'trimestral', 'anual', 'master')),
ADD COLUMN IF NOT EXISTS vip_expires_at timestamp with time zone;
