import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, TrendingUp, Home, Car, Plane, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { getSupabase } from '@/integrations/supabase/client';

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  icon: string;
  created_at: string;
}

interface Contribution {
  id: string;
  goal_id: string;
  amount: number;
  user1_contribution: number;
  user2_contribution: number;
  date: string;
  note?: string;
}

const iconOptions = [
  { value: 'home', label: 'House', icon: Home },
  { value: 'car', label: 'Car', icon: Car },
  { value: 'plane', label: 'Holiday', icon: Plane },
  { value: 'target', label: 'General', icon: Target },
];

const SavingsGoals = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddContributionOpen, setIsAddContributionOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Form states
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalIcon, setNewGoalIcon] = useState('target');
  
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionNote, setContributionNote] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load savings goals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async () => {
    if (!newGoalName || !newGoalTarget) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from('savings_goals')
        .insert({
          name: newGoalName,
          target_amount: parseFloat(newGoalTarget),
          current_amount: 0,
          icon: newGoalIcon,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Savings goal created',
      });

      setIsAddGoalOpen(false);
      setNewGoalName('');
      setNewGoalTarget('');
      setNewGoalIcon('target');
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal',
        variant: 'destructive',
      });
    }
  };

  const addContribution = async () => {
    if (!contributionAmount || !selectedGoalId) {
      toast({
        title: 'Error',
        description: 'Please enter an amount',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(contributionAmount);
    const halfAmount = amount / 2; // 50/50 split

    try {
      const supabase = await getSupabase();
      
      // Add contribution record
      const { error: contributionError } = await supabase
        .from('savings_contributions')
        .insert({
          goal_id: selectedGoalId,
          amount: amount,
          user1_contribution: halfAmount,
          user2_contribution: halfAmount,
          date: new Date().toISOString(),
          note: contributionNote || null,
        });

      if (contributionError) throw contributionError;

      // Update goal current_amount
      const goal = goals.find(g => g.id === selectedGoalId);
      if (goal) {
        const { error: updateError } = await supabase
          .from('savings_goals')
          .update({ current_amount: goal.current_amount + amount })
          .eq('id', selectedGoalId);

        if (updateError) throw updateError;
      }

      toast({
        title: 'Success',
        description: `Added £${amount.toFixed(2)} to goal`,
      });

      setIsAddContributionOpen(false);
      setContributionAmount('');
      setContributionNote('');
      setSelectedGoalId('');
      fetchGoals();
    } catch (error) {
      console.error('Error adding contribution:', error);
      toast({
        title: 'Error',
        description: 'Failed to add contribution',
        variant: 'destructive',
      });
    }
  };

  const deleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Goal deleted',
      });

      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete goal',
        variant: 'destructive',
      });
    }
  };

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find(o => o.value === iconName);
    const IconComponent = option?.icon || Target;
    return <IconComponent className="h-6 w-6" />;
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading savings goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Savings Goals</h1>
          <p className="text-gray-600">Track your 50/50 savings pots</p>
        </div>
        
        <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                  id="goal-name"
                  placeholder="e.g., House Deposit"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-target">Target Amount (£)</Label>
                <Input
                  id="goal-target"
                  type="number"
                  placeholder="10000"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-icon">Icon</Label>
                <Select value={newGoalIcon} onValueChange={setNewGoalIcon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddGoalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createGoal}>Create Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No savings goals yet</p>
            <Button onClick={() => setIsAddGoalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const progress = calculateProgress(goal.current_amount, goal.target_amount);
            const remaining = goal.target_amount - goal.current_amount;

            return (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getIconComponent(goal.icon)}
                      </div>
                      <div>
                        <CardTitle>{goal.name}</CardTitle>
                        <CardDescription>
                          £{goal.current_amount.toFixed(2)} of £{goal.target_amount.toFixed(2)}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">Saved</p>
                      <p className="text-lg font-semibold text-green-600">
                        £{goal.current_amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">Remaining</p>
                      <p className="text-lg font-semibold text-blue-600">
                        £{remaining.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      setSelectedGoalId(goal.id);
                      setIsAddContributionOpen(true);
                    }}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Add Contribution
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Contribution Dialog */}
      <Dialog open={isAddContributionOpen} onOpenChange={setIsAddContributionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contribution-amount">Amount (£)</Label>
              <Input
                id="contribution-amount"
                type="number"
                placeholder="100"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Split 50/50: £{(parseFloat(contributionAmount) / 2 || 0).toFixed(2)} each
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contribution-note">Note (optional)</Label>
              <Input
                id="contribution-note"
                placeholder="e.g., Monthly savings"
                value={contributionNote}
                onChange={(e) => setContributionNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddContributionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addContribution}>Add Contribution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavingsGoals;
