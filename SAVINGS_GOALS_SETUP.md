# Savings Goals Feature Setup

## ✅ What's Been Added

### 1. New Page: Savings Goals (`/savings`)
- Track big purchases (house deposit, car, holidays, etc.)
- Visualize progress toward goals with progress bars
- Add 50/50 contributions
- See how much you've saved vs target

### 2. UI Components
- Card-based goal display
- Progress bars showing percentage complete
- Icons for different goal types (house, car, plane, target)
- Add contribution dialog with 50/50 split calculation
- Quick stats: Saved amount vs Remaining amount

### 3. Navigation
- Added "Savings Goals" to sidebar menu
- Keyboard shortcut: `⌘G` (Cmd+G or Ctrl+G)
- Icon: Target symbol

### 4. Login Page Update
- Email/password fields **HIDDEN by default**
- Only "Continue with Google" button shows
- Matches your Supabase auth configuration (Google OAuth only)
- Can be enabled by changing `emailPasswordEnabled = true` if needed

---

## 📋 Database Setup Required

You need to run this SQL in your Supabase database to create the tables.

### Option 1: Via Supabase Dashboard (Easiest)

1. **Go to Supabase SQL Editor**: https://app.supabase.com/project/gsvyxsddmddipeoduyys/sql/new

2. **Copy and paste this SQL**:

```sql
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
```

3. **Click "Run"** (bottom right)

4. **Verify success**: Should see "Success. No rows returned"

### Option 2: Via Supabase CLI (If you have DB password)

```bash
cd /Users/antoniosmith/Projects/AAFairShare
npx supabase db push
```

Enter your database password when prompted.

---

## 🎯 How to Use the Feature

### Create a Savings Goal

1. **Navigate to**: Savings Goals page (click "Savings Goals" in sidebar or press `⌘G`)

2. **Click**: "New Goal" button

3. **Fill in**:
   - **Goal Name**: e.g., "House Deposit", "New Car", "Italy Holiday"
   - **Target Amount**: e.g., £50000 for house, £15000 for car
   - **Icon**: Choose house, car, plane, or target

4. **Click**: "Create Goal"

### Add Contribution

1. **Click**: "Add Contribution" button on a goal card

2. **Enter amount**: e.g., £1000

3. **See 50/50 split**: Shows "£500 each" automatically

4. **Add note** (optional): e.g., "Monthly savings December"

5. **Click**: "Add Contribution"

6. **Progress updates**: Bar fills, amounts update, percentage increases

### Track Progress

Each goal card shows:
- **Progress bar**: Visual representation of goal completion
- **Percentage**: e.g., "45.2%" 
- **Saved**: Current amount contributed (green)
- **Remaining**: How much more needed (blue)
- **Icon**: Visual identifier for goal type

---

## 💡 Example Use Cases

### House Deposit
```
Name: House Deposit
Target: £50,000
Icon: House
Contributions:
  - £5,000 (Dec 2024) - Savings pot transfer
  - £2,500 (Jan 2025) - Monthly savings
  - £3,000 (Feb 2025) - Bonus money
Current: £10,500 / £50,000 (21%)
```

### Car Purchase
```
Name: New Car
Target: £15,000
Icon: Car
Contributions:
  - £2,000 (Nov 2024) - Initial deposit
  - £1,500 (Dec 2024) - Monthly savings
Current: £3,500 / £15,000 (23.3%)
```

### Holiday Fund
```
Name: Italy Summer Holiday
Target: £5,000
Icon: Plane
Contributions:
  - £500 (Oct 2024) - Start fund
  - £500 (Nov 2024) - Monthly savings
  - £500 (Dec 2024) - Monthly savings
Current: £1,500 / £5,000 (30%)
```

---

## 🔧 Configuration

### Enable Email/Password Login (Optional)

If you want to re-enable email/password fields:

**File**: `src/components/auth/LoginForm.tsx`

**Change line 30**:
```typescript
// Change from:
const emailPasswordEnabled = false;

// To:
const emailPasswordEnabled = true;
```

Then commit and push.

### Change Currency Symbol

If you want to change from £ to € or $:

**File**: `src/pages/SavingsGoals.tsx`

Find and replace all `£` with your currency symbol:
- Line 175: `£{goal.current_amount.toFixed(2)}`
- Line 198: `£{goal.current_amount.toFixed(2)}`
- Line 203: `£{remaining.toFixed(2)}`
- Line 132: `£${amount.toFixed(2)}`
- Line 262: `Split 50/50: £{...}`

---

## 📊 Data Structure

### savings_goals table
- `id`: UUID (primary key)
- `name`: Text (goal name)
- `target_amount`: Decimal (target amount)
- `current_amount`: Decimal (current saved amount)
- `icon`: Text (icon name: 'home', 'car', 'plane', 'target')
- `created_at`: Timestamp
- `updated_at`: Timestamp (auto-updated)

### savings_contributions table
- `id`: UUID (primary key)
- `goal_id`: UUID (foreign key → savings_goals)
- `amount`: Decimal (total contribution)
- `user1_contribution`: Decimal (user 1's half)
- `user2_contribution`: Decimal (user 2's half)
- `date`: Timestamp
- `note`: Text (optional)
- `created_at`: Timestamp

---

## 🎨 Features

### Current Features
✅ Create multiple savings goals  
✅ Track progress with visual bars  
✅ Add 50/50 contributions  
✅ View saved vs remaining amounts  
✅ Delete goals  
✅ Icon selection for goal types  
✅ Notes for each contribution  

### Future Enhancements (Ideas)
- View contribution history per goal
- Charts showing savings over time
- Export goal reports
- Set target dates for goals
- Notifications when goal reached
- Custom split ratios (not just 50/50)
- Withdraw from goals
- Goal categories/tags

---

## 🧪 Testing

After database migration:

1. **Visit**: https://aafairshare.online/savings

2. **Create a test goal**:
   - Name: Test Goal
   - Target: £1000
   - Icon: Target

3. **Add a contribution**:
   - Amount: £200
   - Note: Test contribution

4. **Verify**:
   - Progress bar shows 20%
   - Saved: £200
   - Remaining: £800

5. **Delete test goal** when done

---

## 🚀 Deployment Status

- ✅ Code deployed to Netlify
- ✅ UI components ready
- ✅ Navigation updated
- ❌ Database migration needs to be run (see above)
- ⏳ Waiting for Netlify deployment to complete

**Once database migration is complete, the feature will be live!**

---

## 📝 Summary

**What changed:**
1. Email/password fields hidden (only Google OAuth shows)
2. New "Savings Goals" page added
3. Track big purchases with 50/50 contributions
4. Progress visualization with bars and percentages
5. Database tables for goals and contributions

**What you need to do:**
1. Run the SQL migration in Supabase dashboard (see Option 1 above)
2. Configure Google OAuth in Google Console (see `GOOGLE_OAUTH_SETUP.md`)
3. Enable Google provider in Supabase
4. Test the savings goals feature

**Your site will be fully functional once Google OAuth is configured!** 🎉
