CREATE TABLE daily_rewards (
  day integer PRIMARY KEY,
  xp integer NOT NULL DEFAULT 0,
  item text
);

-- Enable RLS
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to daily_rewards"
ON daily_rewards FOR SELECT
USING (true);

-- Allow authenticated admins to update/insert/delete
CREATE POLICY "Allow authenticated admins to modify daily_rewards"
ON daily_rewards FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
