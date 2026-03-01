-- Create tournament_reservations table
CREATE TABLE IF NOT EXISTS public.tournament_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'confirmed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_id, user_id)
);

-- RLS policies
ALTER TABLE public.tournament_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reservations"
    ON public.tournament_reservations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can make reservations"
    ON public.tournament_reservations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own reservations"
    ON public.tournament_reservations FOR UPDATE
    USING (auth.uid() = user_id AND status = 'reserved')
    WITH CHECK (auth.uid() = user_id AND status IN ('cancelled'));

CREATE POLICY "Admins can view all reservations"
    ON public.tournament_reservations FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can update all reservations"
    ON public.tournament_reservations FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_reservations;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_modified_column_reservations()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tournament_reservations_modtime
    BEFORE UPDATE ON public.tournament_reservations
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column_reservations();
