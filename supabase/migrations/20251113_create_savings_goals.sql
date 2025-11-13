-- Create savings_goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  icon TEXT DEFAULT 'target',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create savings_contributions table
CREATE TABLE IF NOT EXISTS savings_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  user1_contribution DECIMAL(10, 2) NOT NULL,
  user2_contribution DECIMAL(10, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_savings_contributions_goal_id ON savings_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_savings_contributions_date ON savings_contributions(date);

-- Enable RLS
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_contributions ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow authenticated users to manage their savings
CREATE POLICY "Allow authenticated users to view savings goals"
  ON savings_goals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create savings goals"
  ON savings_goals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update savings goals"
  ON savings_goals FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete savings goals"
  ON savings_goals FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view contributions"
  ON savings_contributions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create contributions"
  ON savings_contributions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete contributions"
  ON savings_contributions FOR DELETE
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_savings_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_savings_goals_updated_at_trigger
  BEFORE UPDATE ON savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_savings_goals_updated_at();
