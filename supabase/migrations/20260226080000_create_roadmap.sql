-- Create roadmap_milestones table
CREATE TABLE IF NOT EXISTS public.roadmap_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT,
    status TEXT NOT NULL CHECK (status IN ('completed', 'current', 'upcoming')),
    topics TEXT[] DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.roadmap_milestones ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Roadmap is viewable by everyone" 
ON public.roadmap_milestones FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Roadmap is manageable by admins" 
ON public.roadmap_milestones FOR ALL 
TO authenticated 
USING ( (SELECT (role = 'admin' OR role = 'staff') FROM public.profiles WHERE id = auth.uid()) );

-- Seed initial data
INSERT INTO public.roadmap_milestones (version, title, date, status, topics, display_order)
VALUES 
('V 1.0', 'Lançamento Oficial', 'Fevereiro 2026', 'current', ARRAY[
    'Sistema de Comandas Digital Integrado',
    'Carteira Multicurrency (BRL e Chipz)',
    'Gamificação: Níveis, XP e Badges',
    'Rankings Automatizados em Tempo Real',
    'Notificações de Sistema e Eventos'
], 1),
('V 1.1', 'Interatividade & Social', 'Abril 2026', 'upcoming', ARRAY[
    'Chat de Mesa e Mensagens Interativas',
    'Sistema de Missões Diárias (Quests)',
    'Marketplace VIP de Itens Digitais',
    'Relatórios Mensais de Performance'
], 2),
('V 1.5', 'Ecossistema Multi-Clube', 'Junho 2026', 'upcoming', ARRAY[
    'Dashboard Avançado para Proprietários',
    'Rede de Benefícios Compartilhada',
    'Sistema de Staking (Cavalarias)',
    'Torneios Inter-clubes Integrados'
], 3),
('V 2.0', 'Chip Race Web3', 'Novembro 2026', 'upcoming', ARRAY[
    'Lançamento do Token Nativo $CHIPZ',
    'Governança Descentralizada (Voting)',
    'Premiações em Criptoativos',
    'Integração com Realidade Aumentada (AR)'
], 4);
