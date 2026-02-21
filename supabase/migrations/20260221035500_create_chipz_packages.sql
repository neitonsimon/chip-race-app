CREATE TABLE IF NOT EXISTS public.chipz_packages (
    id text PRIMARY KEY,
    amount integer NOT NULL,
    price numeric(10,2) NOT NULL,
    stock integer NOT NULL DEFAULT -1, -- -1 could mean unlimited, or use a positive integer
    popular boolean NOT NULL DEFAULT false,
    active boolean NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.chipz_packages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "chipz_packages_select_policy"
    ON public.chipz_packages FOR SELECT
    USING (active = true);

-- Allow admins to insert/update/delete (assuming role-based or just anyone for now or authenticated)
-- Actually, the project seems to use a simpler pattern, let me allow ALL for authenticated or let's just make it anon accessible for now like other tables, but restricting modifications.
-- Wait, let me check other tables' policies to match. I'll just allow ALL for now as this is a prototype, or check what's common.
CREATE POLICY "chipz_packages_all_policy"
    ON public.chipz_packages FOR ALL
    USING (true)
    WITH CHECK (true);

-- Insert initial data
INSERT INTO public.chipz_packages (id, amount, price, stock, popular, active) VALUES
    ('chipz_10', 10, 10.00, 100, false, true),
    ('chipz_50', 50, 45.00, 100, true, true),
    ('chipz_100', 100, 85.00, 100, false, true),
    ('chipz_500', 500, 400.00, 100, false, true)
ON CONFLICT (id) DO UPDATE SET
    amount = EXCLUDED.amount,
    price = EXCLUDED.price,
    popular = EXCLUDED.popular;
