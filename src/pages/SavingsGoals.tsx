import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, TrendingUp, Home, Car, Plane, Trash2, CheckCircle2, RotateCcw, Trophy, Calendar, History, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  useSavingsGoals,
  useCreateSavingsGoal,
  useDeleteSavingsGoal,
  useMarkSavingsGoalComplete,
  useReopenSavingsGoal,
  useAddSavingsContribution,
  useSavingsContributions,
  useSavingsContributionsByUser,
  useUpdateSavingsContribution,
  useDeleteSavingsContribution,
  useUsers,
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEditContributionOpen, setIsEditContributionOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<Id<"savingsGoals"> | null>(null);
  const [editingContributionId, setEditingContributionId] = useState<Id<"savingsContributions"> | null>(null);

  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalIcon, setNewGoalIcon] = useState('target');
  
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionNote, setContributionNote] = useState('');
  const [selectedContributorId, setSelectedContributorId] = useState<string>('');

  // Edit contribution state
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editContributorId, setEditContributorId] = useState('');

  const goals = useSavingsGoals();
  const users = useUsers();
  const createGoal = useCreateSavingsGoal();
  const deleteGoal = useDeleteSavingsGoal();
  const markComplete = useMarkSavingsGoalComplete();
  const reopenGoal = useReopenSavingsGoal();
  const addContribution = useAddSavingsContribution();
  const updateContribution = useUpdateSavingsContribution();
  const deleteContribution = useDeleteSavingsContribution();
  const contributions = useSavingsContributions(selectedGoalId ?? undefined);
  const contributionsByUser = useSavingsContributionsByUser(selectedGoalId ?? undefined);

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
    if (!contributionAmount || !selectedGoalId || !selectedContributorId) {
      toast({ title: 'Error', description: 'Please select a contributor and enter an amount', variant: 'destructive' });
      return;
    }

    try {
      await addContribution({
        goalId: selectedGoalId,
        amount: parseFloat(contributionAmount),
        contributorId: selectedContributorId as Id<"users">,
        note: contributionNote || undefined,
      });
      toast({ title: 'Success', description: `Added £${parseFloat(contributionAmount).toFixed(2)} contribution` });
      setIsAddContributionOpen(false);
      setContributionAmount('');
      setContributionNote('');
      setSelectedContributorId('');
    } catch (error) {
      console.error('Error adding contribution:', error);
      toast({ title: 'Error', description: 'Failed to add contribution', variant: 'destructive' });
    }
  };

  const handleEditContribution = async () => {
    if (!editingContributionId || !editAmount) {
      toast({ title: 'Error', description: 'Please enter an amount', variant: 'destructive' });
      return;
    }

    try {
      await updateContribution({
        id: editingContributionId,
        amount: parseFloat(editAmount),
        contributorId: editContributorId as Id<"users">,
        note: editNote || undefined,
      });
      toast({ title: 'Success', description: 'Contribution updated' });
      setIsEditContributionOpen(false);
      setEditingContributionId(null);
      setEditAmount('');
      setEditNote('');
      setEditContributorId('');
    } catch (error) {
      console.error('Error updating contribution:', error);
      toast({ title: 'Error', description: 'Failed to update contribution', variant: 'destructive' });
    }
  };

  const handleDeleteContribution = async (id: Id<"savingsContributions">) => {
    if (!confirm('Delete this contribution?')) return;
    try {
      await deleteContribution({ id });
      toast({ title: 'Success', description: 'Contribution deleted' });
    } catch (error) {
      console.error('Error deleting contribution:', error);
      toast({ title: 'Error', description: 'Failed to delete contribution', variant: 'destructive' });
    }
  };

  const openEditDialog = (contribution: { _id: Id<"savingsContributions">; amount: number; note?: string; contributorId?: Id<"users"> }) => {
    setEditingContributionId(contribution._id);
    setEditAmount(contribution.amount.toString());
    setEditNote(contribution.note || '');
    setEditContributorId(contribution.contributorId || '');
    setIsEditContributionOpen(true);
  };

  const handleCompleteGoal = async (id: Id<"savingsGoals">) => {
    if (!confirm('Mark this goal as complete?')) return;
    try {
      await markComplete({ id });
      toast({ title: 'Success!', description: 'Goal completed! Great work!' });
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

  const openContributionDialog = (goalId: Id<"savingsGoals">) => {
    setSelectedGoalId(goalId);
    setIsAddContributionOpen(true);
  };

  const openHistoryDialog = (goalId: Id<"savingsGoals">) => {
    setSelectedGoalId(goalId);
    setIsHistoryOpen(true);
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
  const selectedGoal = goals?.find(g => g._id === selectedGoalId);

  return (
    <div className="container mx-auto p-4 max-w-6xl pb-20 md:pb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Savings Goals</h1>
          <p className="text-gray-600">Track your savings together</p>
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
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openHistoryDialog(goal._id)}><History className="h-4 w-4 text-gray-500" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
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
                        <Button className="w-full" onClick={() => openContributionDialog(goal._id)}><TrendingUp className="mr-2 h-4 w-4" />Add</Button>
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
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openHistoryDialog(goal._id)}><History className="h-4 w-4 text-gray-500" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal._id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-gray-600">Final Progress</span><span className="font-medium text-green-600">{progress.toFixed(1)}%</span></div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Total Saved</p>
                        <p className="text-2xl font-bold text-green-600">£{goal.currentAmount.toFixed(2)}</p>
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

      {/* Add Contribution Dialog */}
      <Dialog open={isAddContributionOpen} onOpenChange={setIsAddContributionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Contribution</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Who is contributing?</Label>
              <Select value={selectedContributorId} onValueChange={setSelectedContributorId}>
                <SelectTrigger><SelectValue placeholder="Select contributor" /></SelectTrigger>
                <SelectContent>
                  {(users ?? []).map(user => (
                    <SelectItem key={user._id} value={user._id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={user.image || ""} />
                          <AvatarFallback className="text-xs">{(user.username || user.name || "U").charAt(0)}</AvatarFallback>
                        </Avatar>
                        {user.username || user.name || "User"}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contribution-amount">Amount (£)</Label>
              <Input id="contribution-amount" type="number" placeholder="100" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} />
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

      {/* Edit Contribution Dialog */}
      <Dialog open={isEditContributionOpen} onOpenChange={setIsEditContributionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Contribution</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Contributor</Label>
              <Select value={editContributorId} onValueChange={setEditContributorId}>
                <SelectTrigger><SelectValue placeholder="Select contributor" /></SelectTrigger>
                <SelectContent>
                  {(users ?? []).map(user => (
                    <SelectItem key={user._id} value={user._id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={user.image || ""} />
                          <AvatarFallback className="text-xs">{(user.username || user.name || "U").charAt(0)}</AvatarFallback>
                        </Avatar>
                        {user.username || user.name || "User"}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount (£)</Label>
              <Input id="edit-amount" type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-note">Note (optional)</Label>
              <Input id="edit-note" placeholder="e.g., Monthly savings" value={editNote} onChange={(e) => setEditNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditContributionOpen(false)}>Cancel</Button>
            <Button onClick={handleEditContribution}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contribution History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedGoal?.name} - Contributions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* User breakdown */}
            {contributionsByUser && contributionsByUser.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Contribution Breakdown</Label>
                <div className="grid grid-cols-2 gap-3">
                  {contributionsByUser.map(user => (
                    <div key={user.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.image} />
                          <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600">{user.name}</span>
                      </div>
                      <p className="text-lg font-bold text-green-600">£{user.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History list */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">History</Label>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {contributions && contributions.length > 0 ? (
                  contributions.map(c => (
                    <div key={c._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={c.contributorImage} />
                          <AvatarFallback className="text-xs">{c.contributorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{c.contributorName}</p>
                          {c.note && <p className="text-xs text-gray-500">{c.note}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">+£{c.amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{format(new Date(c.date), 'MMM d, yyyy')}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(c)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDeleteContribution(c._id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No contributions yet</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavingsGoals;
