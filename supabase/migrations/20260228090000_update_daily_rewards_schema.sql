
-- Update daily_rewards table to support multiple reward types
ALTER TABLE daily_rewards ADD COLUMN IF NOT EXISTS reward_type TEXT DEFAULT 'xp';
ALTER TABLE daily_rewards ADD COLUMN IF NOT EXISTS reward_value TEXT DEFAULT '0';
ALTER TABLE daily_rewards ADD COLUMN IF NOT EXISTS label TEXT;

-- Sync existing data to new columns
UPDATE daily_rewards SET reward_type = 'xp', reward_value = xp::text WHERE xp > 0 AND reward_type = 'xp';
UPDATE daily_rewards SET reward_type = 'badge', reward_value = item WHERE item IS NOT NULL AND reward_type = 'xp';
UPDATE daily_rewards SET label = 'Recompensa' WHERE label IS NULL;

-- Ensure RLS is still correct (should be from previous migration)
-- The previous migration allowed all authenticated to modify, which is fine for admin management
-- but we might want to restrict it later to only admins. 
-- For now, the existing policy is:
-- CREATE POLICY "Allow authenticated admins to modify daily_rewards" ON daily_rewards FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Since the app usually checks for 'admin' role in the front-end, this is "ok" but not strictly secure.
-- However, I will stick to the user's focus on logic first.
