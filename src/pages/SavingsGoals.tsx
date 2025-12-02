import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, TrendingUp, Home, Car, Plane, Trash2, CheckCircle2, RotateCcw, Trophy, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  useSavingsGoals,
  useCreateSavingsGoal,
  useDeleteSavingsGoal,
  useMarkSavingsGoalComplete,
  useReopenSavingsGoal,
  useAddSavingsContribution,
} from '@/hooks/useConvexData';
import { Id } from '../../convex/_generated/dataModel';

const iconOptions = [
  { value: 'home', label: 'House', icon: Home },
  { value: 'car', label: 'Car', icon: Car },
  { value: 'plane', label: 'Holiday', icon: Plane },
  { value: 'target', label: 'General', icon: Target },
];

const SavingsGoals = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddContributionOpen, setIsAddContributionOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<Id<"savingsGoals"> | null>(null);

  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalIcon, setNewGoalIcon] = useState('target');
  
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionNote, setContributionNote] = useState('');

  const goals = useSavingsGoals();
  const createGoal = useCreateSavingsGoal();
  const deleteGoal = useDeleteSavingsGoal();
  const markComplete = useMarkSavingsGoalComplete();
  const reopenGoal = useReopenSavingsGoal();
  const addContribution = useAddSavingsContribution();

  const loading = goals === undefined;

  const handleCreateGoal = async () => {
    if (!newGoalName || !newGoalTarget) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    try {
      await createGoal({
        name: newGoalName,
        targetAmount: parseFloat(newGoalTarget),
        icon: newGoalIcon,
      });
      toast({ title: 'Success', description: 'Savings goal created' });
      setIsAddGoalOpen(false);
      setNewGoalName('');
      setNewGoalTarget('');
      setNewGoalIcon('target');
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({ title: 'Error', description: 'Failed to create goal', variant: 'destructive' });
    }
  };

  const handleAddContribution = async () => {
    if (!contributionAmount || !selectedGoalId) {
      toast({ title: 'Error', description: 'Please enter an amount', variant: 'destructive' });
      return;
    }

    try {
      await addContribution({
        goalId: selectedGoalId,
        amount: parseFloat(contributionAmount),
        note: contributionNote || undefined,
      });
      toast({ title: 'Success', description: `Added £${parseFloat(contributionAmount).toFixed(2)} to goal` });
      setIsAddContributionOpen(false);
      setContributionAmount('');
      setContributionNote('');
      setSelectedGoalId(null);
    } catch (error) {
      console.error('Error adding contribution:', error);
      toast({ title: 'Error', description: 'Failed to add contribution', variant: 'destructive' });
    }
  };

  const handleCompleteGoal = async (id: Id<"savingsGoals">) => {
    if (!confirm('Mark this goal as complete?')) return;
    try {
      await markComplete({ id });
      toast({ title: 'Success!', description: 'Goal completed! Great work together!' });
    } catch (error) {
      console.error('Error completing goal:', error);
      toast({ title: 'Error', description: 'Failed to complete goal', variant: 'destructive' });
    }
  };

  const handleReopenGoal = async (id: Id<"savingsGoals">) => {
    if (!confirm('Reopen this goal?')) return;
    try {
      await reopenGoal({ id });
      toast({ title: 'Success', description: 'Goal reopened' });
    } catch (error) {
      console.error('Error reopening goal:', error);
      toast({ title: 'Error', description: 'Failed to reopen goal', variant: 'destructive' });
    }
  };

  const handleDeleteGoal = async (id: Id<"savingsGoals">) => {
    if (!confirm('Delete this goal? This cannot be undone.')) return;
    try {
      await deleteGoal({ id });
      toast({ title: 'Success', description: 'Goal deleted' });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({ title: 'Error', description: 'Failed to delete goal', variant: 'destructive' });
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

  const activeGoals = (goals ?? []).filter(g => !g.isCompleted);
  const completedGoals = (goals ?? []).filter(g => g.isCompleted);

  return (
    <div className="container mx-auto p-4 max-w-6xl pb-20 md:pb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Savings Goals</h1>
          <p className="text-gray-600">Track your 50/50 savings pots</p>
        </div>
        
        <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Savings Goal</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input id="goal-name" placeholder="e.g., House Deposit" value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-target">Target Amount (£)</Label>
                <Input id="goal-target" type="number" placeholder="10000" value={newGoalTarget} onChange={(e) => setNewGoalTarget(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={newGoalIcon} onValueChange={setNewGoalIcon}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2"><option.icon className="h-4 w-4" />{option.label}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddGoalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateGoal}>Create Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'completed')} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="active">Active Goals ({activeGoals.length})</TabsTrigger>
          <TabsTrigger value="completed"><Trophy className="h-4 w-4 mr-2" />Completed ({completedGoals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeGoals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No active savings goals</p>
                <Button onClick={() => setIsAddGoalOpen(true)}><Plus className="mr-2 h-4 w-4" />Create Your First Goal</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.map(goal => {
                const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
                const remaining = goal.targetAmount - goal.currentAmount;
                return (
                  <Card key={goal._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">{getIconComponent(goal.icon)}</div>
                          <div>
                            <CardTitle>{goal.name}</CardTitle>
                            <CardDescription>£{goal.currentAmount.toFixed(2)} of £{goal.targetAmount.toFixed(2)}</CardDescription>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-gray-600">Progress</span><span className="font-medium">{progress.toFixed(1)}%</span></div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-gray-50 rounded-lg"><p className="text-gray-600">Saved</p><p className="text-lg font-semibold text-green-600">£{goal.currentAmount.toFixed(2)}</p></div>
                        <div className="p-3 bg-gray-50 rounded-lg"><p className="text-gray-600">Remaining</p><p className="text-lg font-semibold text-blue-600">£{remaining.toFixed(2)}</p></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button className="w-full" onClick={() => { setSelectedGoalId(goal._id); setIsAddContributionOpen(true); }}><TrendingUp className="mr-2 h-4 w-4" />Add</Button>
                        <Button variant="outline" className="w-full" onClick={() => handleCompleteGoal(goal._id)}><CheckCircle2 className="mr-2 h-4 w-4" />Complete</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedGoals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">No completed goals yet</p>
                <p className="text-sm text-gray-500">Complete a goal to see it here!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedGoals.map(goal => {
                const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
                return (
                  <Card key={goal._id} className="border-green-200 bg-green-50/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">{getIconComponent(goal.icon)}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle>{goal.name}</CardTitle>
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>
                            </div>
                            <CardDescription>£{goal.currentAmount.toFixed(2)} of £{goal.targetAmount.toFixed(2)}</CardDescription>
                            {goal.completedAt && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(goal.completedAt), 'MMM d, yyyy')}</p>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-gray-600">Final Progress</span><span className="font-medium text-green-600">{progress.toFixed(1)}%</span></div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Total Saved Together</p>
                        <p className="text-2xl font-bold text-green-600">£{goal.currentAmount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">£{(goal.currentAmount / 2).toFixed(2)} each (50/50)</p>
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => handleReopenGoal(goal._id)}><RotateCcw className="mr-2 h-4 w-4" />Reopen Goal</Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddContributionOpen} onOpenChange={setIsAddContributionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Contribution</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contribution-amount">Amount (£)</Label>
              <Input id="contribution-amount" type="number" placeholder="100" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} />
              <p className="text-xs text-gray-500">Split 50/50: £{(parseFloat(contributionAmount) / 2 || 0).toFixed(2)} each</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contribution-note">Note (optional)</Label>
              <Input id="contribution-note" placeholder="e.g., Monthly savings" value={contributionNote} onChange={(e) => setContributionNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddContributionOpen(false)}>Cancel</Button>
            <Button onClick={handleAddContribution}>Add Contribution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavingsGoals;
