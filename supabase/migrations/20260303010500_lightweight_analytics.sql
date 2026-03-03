-- Migration: Lightweight Page Analytics
-- Descrição: Substitui o log de cada clique por um contador por página para economizar recursos e melhorar a performance.

-- 1. Cria a tabela leve de contadores
CREATE TABLE IF NOT EXISTS public.page_stats (
    view_name TEXT PRIMARY KEY,
    count BIGINT DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Popula com os dados atuais (se houver migração prévia)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'page_views') THEN
        INSERT INTO public.page_stats (view_name, count)
        SELECT view_name, COUNT(*)
        FROM public.page_views
        GROUP BY view_name
        ON CONFLICT (view_name) DO UPDATE SET count = page_stats.count + EXCLUDED.count;
    END IF;
END $$;

-- 3. Função para incremento atômico (Thread-safe)
CREATE OR REPLACE FUNCTION public.increment_page_view(p_view_name TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.page_stats (view_name, count, last_updated)
    VALUES (p_view_name, 1, NOW())
    ON CONFLICT (view_name) DO UPDATE SET 
        count = page_stats.count + 1,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Permissões de Leitura
ALTER TABLE public.page_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública de estatísticas" ON public.page_stats FOR SELECT TO public USING (true);

-- 5. Garante execução da função para todos
GRANT EXECUTE ON FUNCTION public.increment_page_view(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_page_view(TEXT) TO authenticated;
