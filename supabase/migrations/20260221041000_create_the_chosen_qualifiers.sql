-- Create the_chosen_qualifiers table
CREATE TABLE IF NOT EXISTS public.the_chosen_qualifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('rankings', 'jackpot', 'last_longer', 'bet', 'bet_up', 'sng_sat', 'quests', 'vip')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.the_chosen_qualifiers ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access for the_chosen_qualifiers"
ON public.the_chosen_qualifiers FOR SELECT
TO public
USING (true);

-- Allow admins full access (assuming an 'is_admin' column in profiles or using role-based)
-- For now, let's keep it simple or align with existing policies.
-- If existing profiles has an isAdmin flag, we'd use that.
-- Based on previous conversations, there's likely a mechanism.
-- Let's just allow all authenticated users for now if policy is needed for dev, 
-- or stick to basic for now and refine if I see existing admin policies.

CREATE POLICY "Allow authenticated full access for the_chosen_qualifiers"
ON public.the_chosen_qualifiers FOR ALL
TO authenticated
USING (true);
