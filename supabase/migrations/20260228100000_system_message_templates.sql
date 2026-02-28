-- Create the system_message_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_message_templates (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'system',
    sender TEXT DEFAULT 'Chip Race',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_message_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Templates are viewable by everyone" 
ON public.system_message_templates FOR SELECT 
USING (true);

CREATE POLICY "Templates are manageable by admins" 
ON public.system_message_templates FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'staff')
  )
);

-- Insert initial templates
INSERT INTO public.system_message_templates (id, subject, content, category, sender)
VALUES 
('daily_login', '⚙️ Sistema', 'Bônus de login diário disponível!', 'system', 'Chip Race'),
('brl_credit', '💰 Crédito Recebido', 'Você recebeu um crédito de R$ {{amount}} em sua carteira.', 'system', 'Chip Race'),
('chipz_credit', '🪙 Chipz Recebidos', 'Você recebeu {{amount}} Chipz em sua carteira.', 'system', 'Chip Race'),
('badge_award', '🏅 Medalha Concedida', 'Você recebeu uma medalha!', 'system', 'Chip Race'),
('welcome', '👋 Bem-vindo ao Chip Race', 'Olá {{name}}! Bem-vindo à nossa plataforma.', 'system', 'Chip Race'),
('payment_confirmed', '✅ Pagamento Confirmado', 'Seu pagamento da comanda do evento {{event_name}} foi processado.', 'system', 'Chip Race'),
('tournament_result', '🏆 Resultado do Torneio', 'Parabéns! Você ficou em {{position}}º lugar no {{tournament_name}}.', 'system', 'Chip Race'),
('tournament_win_1', '🥇 Grande Campeão!', 'Incrível! Você venceu o {{tournament_name}}!', 'system', 'Chip Race'),
('tournament_win_2', '🥈 Vice-Campeão', 'Excelente desempenho! Você foi vice-campeão do {{tournament_name}}.', 'system', 'Chip Race'),
('tournament_win_3', '🥉 Pódio Garantido', 'Bom jogo! Você subiu ao pódio no {{tournament_name}}.', 'system', 'Chip Race')
ON CONFLICT (id) DO UPDATE SET
  subject = EXCLUDED.subject,
  content = EXCLUDED.content;

-- Function to send a message based on a template
CREATE OR REPLACE FUNCTION public.send_templated_message(
    p_template_id TEXT,
    p_user_id UUID,
    p_vars JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_template RECORD;
    v_subject TEXT;
    v_content TEXT;
    v_msg_id UUID;
    v_key TEXT;
    v_val TEXT;
BEGIN
    -- Get template
    SELECT * INTO v_template FROM public.system_message_templates WHERE id = p_template_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    v_subject := v_template.subject;
    v_content := v_template.content;

    -- Basic variable replacement (very simple, just for demonstrations)
    FOR v_key, v_val IN SELECT * FROM jsonb_each_text(p_vars) LOOP
        v_subject := replace(v_subject, '{{' || v_key || '}}', v_val);
        v_content := replace(v_content, '{{' || v_key || '}}', v_val);
    END LOOP;

    -- Insert message
    INSERT INTO public.messages (
        user_id,
        sender,
        subject,
        content,
        category,
        is_read,
        created_at
    ) VALUES (
        p_user_id,
        v_template.sender,
        v_subject,
        v_content,
        v_template.category,
        false,
        now()
    ) RETURNING id INTO v_msg_id;

    RETURN v_msg_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
