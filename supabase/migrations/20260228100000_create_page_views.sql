-- Tabela de Analytics de Acesso
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    view_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissões
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts to page_views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated inserts to page_views" ON public.page_views FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow admins to view page_views" ON public.page_views FOR SELECT USING (public.is_admin());
