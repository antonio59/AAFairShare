-- Add completed_at and is_completed fields to savings_goals table
ALTER TABLE savings_goals
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on completed goals
CREATE INDEX IF NOT EXISTS idx_savings_goals_completed ON savings_goals(is_completed, completed_at DESC);

-- Function to mark a goal as complete
CREATE OR REPLACE FUNCTION complete_savings_goal(goal_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE savings_goals
  SET is_completed = TRUE,
      completed_at = NOW()
  WHERE id = goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reopen a completed goal
CREATE OR REPLACE FUNCTION reopen_savings_goal(goal_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE savings_goals
  SET is_completed = FALSE,
      completed_at = NULL
  WHERE id = goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
