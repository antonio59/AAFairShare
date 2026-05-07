import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Target,
  TrendingUp,
  Home,
  Car,
  Plane,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Trophy,
  Calendar,
  History,
  Pencil,
  Star,
  Sparkles,
  Upload,
  X,
  Link2,
  Unlink,
  Repeat,
  Palette,
  ArrowUpDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  useSavingsGoals,
  useCreateSavingsGoal,
  useUpdateSavingsGoal,
  useDeleteSavingsGoal,
  useMarkSavingsGoalComplete,
  useReopenSavingsGoal,
  useAddSavingsContribution,
  useSavingsContributions,
  useSavingsContributionsByUser,
  useUpdateSavingsContribution,
  useDeleteSavingsContribution,
  useUsers,
  useGenerateUploadUrl,
  useExpensesByMonth,
  useLinkExpenseToGoal,
  useUnlinkExpenseFromGoal,
} from "@/hooks/useConvexData";
import { Id } from "../../convex/_generated/dataModel";

const iconOptions = [
  { value: "home", label: "House", icon: Home },
  { value: "car", label: "Car", icon: Car },
  { value: "plane", label: "Holiday", icon: Plane },
  { value: "target", label: "General", icon: Target },
];

const colorPresets = [
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
];

const frequencyOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const SavingsGoals = () => {
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [isAddContributionOpen, setIsAddContributionOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEditContributionOpen, setIsEditContributionOpen] = useState(false);
  const [isLinkExpensesOpen, setIsLinkExpensesOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] =
    useState<Id<"savingsGoals"> | null>(null);
  const [editingContributionId, setEditingContributionId] =
    useState<Id<"savingsContributions"> | null>(null);

  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalIcon, setNewGoalIcon] = useState("target");
  const [newGoalTargetDate, setNewGoalTargetDate] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [newGoalImagePreview, setNewGoalImagePreview] = useState<string | null>(null);
  const [newGoalImageStorageId, setNewGoalImageStorageId] = useState<Id<"_storage"> | null>(null);
  const [newGoalPriority, setNewGoalPriority] = useState("0");
  const [newGoalColor, setNewGoalColor] = useState(colorPresets[3].value);
  const [newGoalAutoAmount, setNewGoalAutoAmount] = useState("");
  const [newGoalAutoFrequency, setNewGoalAutoFrequency] = useState("monthly");
  const [newGoalAutoNextDate, setNewGoalAutoNextDate] = useState("");
  const [isGoalImageUploading, setIsGoalImageUploading] = useState(false);

  // Edit goal state
  const [editGoalName, setEditGoalName] = useState("");
  const [editGoalTarget, setEditGoalTarget] = useState("");
  const [editGoalIcon, setEditGoalIcon] = useState("target");
  const [editGoalTargetDate, setEditGoalTargetDate] = useState("");
  const [editGoalDescription, setEditGoalDescription] = useState("");
  const [editGoalImagePreview, setEditGoalImagePreview] = useState<string | null>(null);
  const [editGoalImageStorageId, setEditGoalImageStorageId] = useState<Id<"_storage"> | null>(null);
  const [editGoalPriority, setEditGoalPriority] = useState("0");
  const [editGoalColor, setEditGoalColor] = useState(colorPresets[3].value);
  const [editGoalAutoAmount, setEditGoalAutoAmount] = useState("");
  const [editGoalAutoFrequency, setEditGoalAutoFrequency] = useState("monthly");
  const [editGoalAutoNextDate, setEditGoalAutoNextDate] = useState("");

  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionNote, setContributionNote] = useState("");
  const [selectedContributorId, setSelectedContributorId] =
    useState<string>("");

  // Edit contribution state
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editContributorId, setEditContributorId] = useState("");

  const goals = useSavingsGoals();
  const users = useUsers();
  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();
  const deleteGoal = useDeleteSavingsGoal();
  const generateUploadUrl = useGenerateUploadUrl();
  const markComplete = useMarkSavingsGoalComplete();
  const reopenGoal = useReopenSavingsGoal();
  const addContribution = useAddSavingsContribution();
  const updateContribution = useUpdateSavingsContribution();
  const deleteContribution = useDeleteSavingsContribution();
  const linkExpenseToGoal = useLinkExpenseToGoal();
  const unlinkExpenseFromGoal = useUnlinkExpenseFromGoal();
  const contributions = useSavingsContributions(selectedGoalId ?? undefined);
  const contributionsByUser = useSavingsContributionsByUser(
    selectedGoalId ?? undefined,
  );

  const currentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);
  const currentMonthExpenses = useExpensesByMonth(currentMonth);

  const loading = goals === undefined;

  const handleCreateGoal = async () => {
    if (!newGoalName || !newGoalTarget) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await createGoal({
        name: newGoalName,
        targetAmount: parseFloat(newGoalTarget),
        icon: newGoalIcon,
        targetDate: newGoalTargetDate || undefined,
        description: newGoalDescription || undefined,
        imageStorageId: newGoalImageStorageId || undefined,
        priority: parseInt(newGoalPriority, 10) || 0,
        color: newGoalColor || undefined,
        autoContributionAmount: newGoalAutoAmount ? parseFloat(newGoalAutoAmount) : undefined,
        autoContributionFrequency: newGoalAutoAmount ? newGoalAutoFrequency : undefined,
        autoContributionNextDate: newGoalAutoAmount ? newGoalAutoNextDate || undefined : undefined,
      });
      toast({ title: "Success", description: "Savings goal created" });
      setIsAddGoalOpen(false);
      setNewGoalName("");
      setNewGoalTarget("");
      setNewGoalIcon("target");
      setNewGoalTargetDate("");
      setNewGoalDescription("");
      setNewGoalImagePreview(null);
      setNewGoalImageStorageId(null);
      setNewGoalPriority("0");
      setNewGoalColor(colorPresets[3].value);
      setNewGoalAutoAmount("");
      setNewGoalAutoFrequency("monthly");
      setNewGoalAutoNextDate("");
    } catch (error) {
      console.error("Error creating goal:", error);
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive",
      });
    }
  };

  const handleUpdateGoal = async () => {
    if (!selectedGoalId || !editGoalName || !editGoalTarget) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateGoal({
        id: selectedGoalId,
        name: editGoalName,
        targetAmount: parseFloat(editGoalTarget),
        icon: editGoalIcon,
        targetDate: editGoalTargetDate || undefined,
        description: editGoalDescription || undefined,
        imageStorageId: editGoalImageStorageId || undefined,
        priority: parseInt(editGoalPriority, 10) || 0,
        color: editGoalColor || undefined,
        autoContributionAmount: editGoalAutoAmount ? parseFloat(editGoalAutoAmount) : undefined,
        autoContributionFrequency: editGoalAutoAmount ? editGoalAutoFrequency : undefined,
        autoContributionNextDate: editGoalAutoAmount ? editGoalAutoNextDate || undefined : undefined,
      });
      toast({ title: "Success", description: "Savings goal updated" });
      setIsEditGoalOpen(false);
      setSelectedGoalId(null);
    } catch (error) {
      console.error("Error updating goal:", error);
      toast({
        title: "Error",
        description: "Failed to update goal",
        variant: "destructive",
      });
    }
  };

  const handleGoalImageUpload = async (file: File, isEdit: boolean) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    setIsGoalImageUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (isEdit) {
          setEditGoalImagePreview(e.target?.result as string);
        } else {
          setNewGoalImagePreview(e.target?.result as string);
        }
      };
      reader.readAsDataURL(file);

      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Upload failed");
      const { storageId } = await response.json();

      if (isEdit) {
        setEditGoalImageStorageId(storageId as Id<"_storage">);
      } else {
        setNewGoalImageStorageId(storageId as Id<"_storage">);
      }
      toast({ title: "Image uploaded" });
    } catch {
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setIsGoalImageUploading(false);
    }
  };

  const openEditGoalDialog = (goal: {
    _id: Id<"savingsGoals">;
    name: string;
    targetAmount: number;
    icon: string;
    targetDate?: string;
    description?: string;
    imageStorageId?: Id<"_storage">;
    imageUrl?: string | null;
    priority?: number;
    color?: string;
    autoContributionAmount?: number;
    autoContributionFrequency?: string;
    autoContributionNextDate?: string;
  }) => {
    setSelectedGoalId(goal._id);
    setEditGoalName(goal.name);
    setEditGoalTarget(goal.targetAmount.toString());
    setEditGoalIcon(goal.icon);
    setEditGoalTargetDate(goal.targetDate || "");
    setEditGoalDescription(goal.description || "");
    setEditGoalImagePreview(goal.imageUrl || null);
    setEditGoalImageStorageId(goal.imageStorageId || null);
    setEditGoalPriority((goal.priority ?? 0).toString());
    setEditGoalColor(goal.color || colorPresets[3].value);
    setEditGoalAutoAmount(goal.autoContributionAmount ? goal.autoContributionAmount.toString() : "");
    setEditGoalAutoFrequency(goal.autoContributionFrequency || "monthly");
    setEditGoalAutoNextDate(goal.autoContributionNextDate || "");
    setIsEditGoalOpen(true);
  };

  const handleAddContribution = async () => {
    if (!contributionAmount || !selectedGoalId || !selectedContributorId) {
      toast({
        title: "Error",
        description: "Please select a contributor and enter an amount",
        variant: "destructive",
      });
      return;
    }

    const goal = goals?.find((g) => g._id === selectedGoalId);
    const oldProgress = goal
      ? calculateProgress(goal.currentAmount, goal.targetAmount)
      : 0;
    const amount = parseFloat(contributionAmount);

    try {
      await addContribution({
        goalId: selectedGoalId,
        amount,
        contributorId: selectedContributorId as Id<"users">,
        note: contributionNote || undefined,
      });

      // Check for milestone celebrations
      if (goal) {
        const newAmount = goal.currentAmount + amount;
        const newProgress = calculateProgress(newAmount, goal.targetAmount);

        // Check if we crossed a milestone
        const oldMilestones = getMilestones(oldProgress);
        const newMilestones = getMilestones(newProgress);
        const newlyReached = newMilestones.filter(
          (m) => !oldMilestones.includes(m),
        );

        if (newlyReached.length > 0) {
          const highestMilestone = Math.max(...newlyReached);
          const emoji =
            highestMilestone === 100
              ? "🎉"
              : highestMilestone === 75
                ? "🔥"
                : highestMilestone === 50
                  ? "⭐"
                  : "🌟";
          toast({
            title: `${emoji} ${highestMilestone}% Milestone Reached!`,
            description: `Amazing! You've reached ${highestMilestone}% of your "${goal.name}" goal!`,
          });
        } else {
          toast({
            title: "Success",
            description: `Added £${amount.toFixed(2)} contribution`,
          });
        }
      } else {
        toast({
          title: "Success",
          description: `Added £${amount.toFixed(2)} contribution`,
        });
      }

      setIsAddContributionOpen(false);
      setContributionAmount("");
      setContributionNote("");
      setSelectedContributorId("");
    } catch (error) {
      console.error("Error adding contribution:", error);
      toast({
        title: "Error",
        description: "Failed to add contribution",
        variant: "destructive",
      });
    }
  };

  const handleEditContribution = async () => {
    if (!editingContributionId || !editAmount) {
      toast({
        title: "Error",
        description: "Please enter an amount",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateContribution({
        id: editingContributionId,
        amount: parseFloat(editAmount),
        contributorId: editContributorId as Id<"users">,
        note: editNote || undefined,
      });
      toast({ title: "Success", description: "Contribution updated" });
      setIsEditContributionOpen(false);
      setEditingContributionId(null);
      setEditAmount("");
      setEditNote("");
      setEditContributorId("");
    } catch (error) {
      console.error("Error updating contribution:", error);
      toast({
        title: "Error",
        description: "Failed to update contribution",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContribution = async (id: Id<"savingsContributions">) => {
    if (!confirm("Delete this contribution?")) return;
    try {
      await deleteContribution({ id });
      toast({ title: "Success", description: "Contribution deleted" });
    } catch (error) {
      console.error("Error deleting contribution:", error);
      toast({
        title: "Error",
        description: "Failed to delete contribution",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (contribution: {
    _id: Id<"savingsContributions">;
    amount: number;
    note?: string;
    contributorId?: Id<"users">;
  }) => {
    setEditingContributionId(contribution._id);
    setEditAmount(contribution.amount.toString());
    setEditNote(contribution.note || "");
    setEditContributorId(contribution.contributorId || "");
    setIsEditContributionOpen(true);
  };

  const handleCompleteGoal = async (id: Id<"savingsGoals">) => {
    if (!confirm("Mark this goal as complete?")) return;
    try {
      await markComplete({ id });
      toast({ title: "Success!", description: "Goal completed! Great work!" });
    } catch (error) {
      console.error("Error completing goal:", error);
      toast({
        title: "Error",
        description: "Failed to complete goal",
        variant: "destructive",
      });
    }
  };

  const handleReopenGoal = async (id: Id<"savingsGoals">) => {
    if (!confirm("Reopen this goal?")) return;
    try {
      await reopenGoal({ id });
      toast({ title: "Success", description: "Goal reopened" });
    } catch (error) {
      console.error("Error reopening goal:", error);
      toast({
        title: "Error",
        description: "Failed to reopen goal",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGoal = async (id: Id<"savingsGoals">) => {
    if (!confirm("Delete this goal? This cannot be undone.")) return;
    try {
      await deleteGoal({ id });
      toast({ title: "Success", description: "Goal deleted" });
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      });
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

  const openLinkExpensesDialog = (goalId: Id<"savingsGoals">) => {
    setSelectedGoalId(goalId);
    setIsLinkExpensesOpen(true);
  };

  const handleLinkExpense = async (expenseId: Id<"expenses">) => {
    if (!selectedGoalId) return;
    try {
      await linkExpenseToGoal({ expenseId, goalId: selectedGoalId });
      toast({ title: "Success", description: "Expense linked to goal" });
    } catch (error) {
      console.error("Error linking expense:", error);
      toast({ title: "Error", description: "Failed to link expense", variant: "destructive" });
    }
  };

  const handleUnlinkExpense = async (expenseId: Id<"expenses">) => {
    if (!selectedGoalId) return;
    try {
      await unlinkExpenseFromGoal({ expenseId, goalId: selectedGoalId });
      toast({ title: "Success", description: "Expense unlinked from goal" });
    } catch (error) {
      console.error("Error unlinking expense:", error);
      toast({ title: "Error", description: "Failed to unlink expense", variant: "destructive" });
    }
  };

  const contributionChartData = useMemo(() => {
    if (!contributions || contributions.length === 0) return [];
    const sorted = [...contributions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let runningTotal = 0;
    return sorted.map((c) => {
      runningTotal += c.amount;
      return {
        date: format(parseISO(c.date), "MMM d"),
        amount: c.amount,
        total: runningTotal,
      };
    });
  }, [contributions]);

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find((o) => o.value === iconName);
    const IconComponent = option?.icon || Target;
    return <IconComponent className="h-6 w-6" />;
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getMilestones = (progress: number) => {
    const milestones = [];
    if (progress >= 25) milestones.push(25);
    if (progress >= 50) milestones.push(50);
    if (progress >= 75) milestones.push(75);
    if (progress >= 100) milestones.push(100);
    return milestones;
  };

  const _getNextMilestone = (progress: number) => {
    if (progress < 25) return 25;
    if (progress < 50) return 50;
    if (progress < 75) return 75;
    if (progress < 100) return 100;
    return null;
  };

  const calculateMonthlyContribution = (
    remaining: number,
    targetDate: string | undefined,
  ) => {
    if (!targetDate) return null;
    const today = new Date();
    const target = new Date(targetDate);
    const monthsLeft = Math.max(
      1,
      Math.ceil(
        (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30),
      ),
    );
    return remaining / monthsLeft;
  };

  const getMonthsRemaining = (targetDate: string | undefined) => {
    if (!targetDate) return null;
    const today = new Date();
    const target = new Date(targetDate);
    return Math.max(
      0,
      Math.ceil(
        (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30),
      ),
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading savings goals...</p>
        </div>
      </div>
    );
  }

  const activeGoals = (goals ?? [])
    .filter((g) => !g.isCompleted)
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  const completedGoals = (goals ?? [])
    .filter((g) => g.isCompleted)
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  const selectedGoal = goals?.find((g) => g._id === selectedGoalId);

  return (
    <div className="container mx-auto p-4 max-w-6xl pb-20 md:pb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Savings Goals</h1>
          <p className="text-muted-foreground">Track your savings together</p>
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
                <Label>Icon</Label>
                <Select value={newGoalIcon} onValueChange={setNewGoalIcon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => (
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
              <div className="space-y-2">
                <Label htmlFor="goal-target-date">Target Date (optional)</Label>
                <Input
                  id="goal-target-date"
                  type="date"
                  value={newGoalTargetDate}
                  onChange={(e) => setNewGoalTargetDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Set a target date to see suggested monthly savings
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-description">Description (optional)</Label>
                <Input
                  id="goal-description"
                  placeholder="e.g., Summer trip to Japan"
                  value={newGoalDescription}
                  onChange={(e) => setNewGoalDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-priority">Priority</Label>
                  <Input
                    id="goal-priority"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newGoalPriority}
                    onChange={(e) => setNewGoalPriority(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Lower = higher priority</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Palette className="h-3 w-3" />
                    Color
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setNewGoalColor(c.value)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          newGoalColor === c.value ? "border-foreground scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Repeat className="h-4 w-4" />
                  Auto-Recurring Contribution (optional)
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    type="number"
                    placeholder="Amount (£)"
                    value={newGoalAutoAmount}
                    onChange={(e) => setNewGoalAutoAmount(e.target.value)}
                  />
                  <Select value={newGoalAutoFrequency} onValueChange={setNewGoalAutoFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    placeholder="Next date"
                    value={newGoalAutoNextDate}
                    onChange={(e) => setNewGoalAutoNextDate(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatically adds a contribution on the scheduled date
                </p>
              </div>
              <div className="space-y-2">
                <Label>Goal Image (optional)</Label>
                {newGoalImagePreview ? (
                  <div className="relative">
                    <img src={newGoalImagePreview} alt="Goal preview" className="w-full h-32 object-cover rounded-lg" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => { setNewGoalImagePreview(null); setNewGoalImageStorageId(null); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="goal-image-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleGoalImageUpload(file, false);
                      }}
                    />
                    <label htmlFor="goal-image-upload" className="cursor-pointer flex flex-col items-center">
                      {isGoalImageUploading ? (
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-sm text-muted-foreground">Click to upload image</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddGoalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGoal}>Create Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Goal Dialog */}
        <Dialog open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Savings Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-goal-name">Goal Name</Label>
                <Input
                  id="edit-goal-name"
                  value={editGoalName}
                  onChange={(e) => setEditGoalName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-goal-target">Target Amount (£)</Label>
                <Input
                  id="edit-goal-target"
                  type="number"
                  value={editGoalTarget}
                  onChange={(e) => setEditGoalTarget(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={editGoalIcon} onValueChange={setEditGoalIcon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((option) => (
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
              <div className="space-y-2">
                <Label htmlFor="edit-goal-target-date">Target Date (optional)</Label>
                <Input
                  id="edit-goal-target-date"
                  type="date"
                  value={editGoalTargetDate}
                  onChange={(e) => setEditGoalTargetDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-goal-description">Description (optional)</Label>
                <Input
                  id="edit-goal-description"
                  placeholder="e.g., Summer trip to Japan"
                  value={editGoalDescription}
                  onChange={(e) => setEditGoalDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-goal-priority">Priority</Label>
                  <Input
                    id="edit-goal-priority"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={editGoalPriority}
                    onChange={(e) => setEditGoalPriority(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Lower = higher priority</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Palette className="h-3 w-3" />
                    Color
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setEditGoalColor(c.value)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          editGoalColor === c.value ? "border-foreground scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Repeat className="h-4 w-4" />
                  Auto-Recurring Contribution (optional)
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    type="number"
                    placeholder="Amount (£)"
                    value={editGoalAutoAmount}
                    onChange={(e) => setEditGoalAutoAmount(e.target.value)}
                  />
                  <Select value={editGoalAutoFrequency} onValueChange={setEditGoalAutoFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    placeholder="Next date"
                    value={editGoalAutoNextDate}
                    onChange={(e) => setEditGoalAutoNextDate(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatically adds a contribution on the scheduled date
                </p>
              </div>
              <div className="space-y-2">
                <Label>Goal Image (optional)</Label>
                {editGoalImagePreview ? (
                  <div className="relative">
                    <img src={editGoalImagePreview} alt="Goal preview" className="w-full h-32 object-cover rounded-lg" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => { setEditGoalImagePreview(null); setEditGoalImageStorageId(null); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="edit-goal-image-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleGoalImageUpload(file, true);
                      }}
                    />
                    <label htmlFor="edit-goal-image-upload" className="cursor-pointer flex flex-col items-center">
                      {isGoalImageUploading ? (
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-sm text-muted-foreground">Click to upload image</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditGoalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateGoal}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "active" | "completed")}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="active">
            Active Goals ({activeGoals.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            <Trophy className="h-4 w-4 mr-2" />
            Completed ({completedGoals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeGoals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No active savings goals
                </p>
                <Button onClick={() => setIsAddGoalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.map((goal) => {
                const progress = calculateProgress(
                  goal.currentAmount,
                  goal.targetAmount,
                );
                const remaining = goal.targetAmount - goal.currentAmount;
                const monthlyContribution = calculateMonthlyContribution(
                  remaining,
                  goal.targetDate,
                );
                const monthsRemaining = getMonthsRemaining(goal.targetDate);
                return (
                  <Card
                    key={goal._id}
                    className="overflow-hidden"
                    style={{
                      borderLeftWidth: "4px",
                      borderLeftColor: goal.color || "transparent",
                    }}
                  >
                    {goal.imageUrl && (
                      <div className="h-32 w-full overflow-hidden">
                        <img
                          src={goal.imageUrl}
                          alt={goal.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              backgroundColor: goal.color ? `${goal.color}33` : undefined,
                            }}
                          >
                            {getIconComponent(goal.icon)}
                          </div>
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {goal.name}
                              {(goal.priority ?? 0) > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <ArrowUpDown className="h-3 w-3 mr-1" />
                                  P{goal.priority}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>
                              £{goal.currentAmount.toFixed(2)} of £
                              {goal.targetAmount.toFixed(2)}
                            </CardDescription>
                            {goal.autoContributionAmount && goal.autoContributionAmount > 0 && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                <Repeat className="h-3 w-3 mr-1" />
                                £{goal.autoContributionAmount.toFixed(2)} {goal.autoContributionFrequency}
                              </Badge>
                            )}
                            {goal.targetDate && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Target:{" "}
                                {format(
                                  new Date(goal.targetDate),
                                  "MMM d, yyyy",
                                )}
                                {monthsRemaining !== null &&
                                  monthsRemaining > 0 && (
                                    <span className="ml-1">
                                      ({monthsRemaining}{" "}
                                      {monthsRemaining === 1
                                        ? "month"
                                        : "months"}{" "}
                                      left)
                                    </span>
                                  )}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openLinkExpensesDialog(goal._id)}
                            title="Link expenses"
                          >
                            <Link2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditGoalDialog(goal)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openHistoryDialog(goal._id)}
                          >
                            <History className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteGoal(goal._id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {goal.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progress
                          </span>
                          <span className="font-medium">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={progress}
                          className="h-2"
                          indicatorStyle={
                            goal.color ? { backgroundColor: goal.color } : undefined
                          }
                        />
                        <div className="flex gap-1 mt-2">
                          {[25, 50, 75, 100].map((milestone) => (
                            <div
                              key={milestone}
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                progress >= milestone
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {progress >= milestone ? (
                                <Star className="h-3 w-3 fill-current" />
                              ) : (
                                <Star className="h-3 w-3" />
                              )}
                              {milestone}%
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-muted-foreground">Saved</p>
                          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                            £{goal.currentAmount.toFixed(2)}
                          </p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-muted-foreground">Remaining</p>
                          <p className="text-lg font-semibold text-primary dark:text-primary/80">
                            £{remaining.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {monthlyContribution !== null && remaining > 0 && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                              Save{" "}
                              <span className="font-bold">
                                £{monthlyContribution.toFixed(2)}/month
                              </span>{" "}
                              to reach your goal on time
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          className="w-full"
                          onClick={() => openContributionDialog(goal._id)}
                        >
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Add
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleCompleteGoal(goal._id)}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Complete
                        </Button>
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
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  No completed goals yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Complete a goal to see it here!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedGoals.map((goal) => {
                const progress = calculateProgress(
                  goal.currentAmount,
                  goal.targetAmount,
                );
                return (
                  <Card
                    key={goal._id}
                    className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30 overflow-hidden"
                  >
                    {goal.imageUrl && (
                      <div className="h-32 w-full overflow-hidden">
                        <img
                          src={goal.imageUrl}
                          alt={goal.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            {getIconComponent(goal.icon)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle>{goal.name}</CardTitle>
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-700 border-green-300"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            </div>
                            <CardDescription>
                              £{goal.currentAmount.toFixed(2)} of £
                              {goal.targetAmount.toFixed(2)}
                            </CardDescription>
                            {goal.completedAt && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(
                                  new Date(goal.completedAt),
                                  "MMM d, yyyy",
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditGoalDialog(goal)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openHistoryDialog(goal._id)}
                          >
                            <History className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteGoal(goal._id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {goal.description}
                          </p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Final Progress
                          </span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <div className="p-3 bg-card rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-muted-foreground mb-1">
                          Total Saved
                        </p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          £{goal.currentAmount.toFixed(2)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleReopenGoal(goal._id)}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reopen Goal
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Contribution Dialog */}
      <Dialog
        open={isAddContributionOpen}
        onOpenChange={setIsAddContributionOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Who is contributing?</Label>
              <Select
                value={selectedContributorId}
                onValueChange={setSelectedContributorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contributor" />
                </SelectTrigger>
                <SelectContent>
                  {(users ?? []).map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={user.image || ""} />
                          <AvatarFallback className="text-xs">
                            {(user.username || user.name || "U").charAt(0)}
                          </AvatarFallback>
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
              <Input
                id="contribution-amount"
                type="number"
                placeholder="100"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
              />
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
            <Button
              variant="outline"
              onClick={() => setIsAddContributionOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddContribution}>Add Contribution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contribution Dialog */}
      <Dialog
        open={isEditContributionOpen}
        onOpenChange={setIsEditContributionOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Contributor</Label>
              <Select
                value={editContributorId}
                onValueChange={setEditContributorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contributor" />
                </SelectTrigger>
                <SelectContent>
                  {(users ?? []).map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={user.image || ""} />
                          <AvatarFallback className="text-xs">
                            {(user.username || user.name || "U").charAt(0)}
                          </AvatarFallback>
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
              <Input
                id="edit-amount"
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-note">Note (optional)</Label>
              <Input
                id="edit-note"
                placeholder="e.g., Monthly savings"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditContributionOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditContribution}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Expenses Dialog */}
      <Dialog open={isLinkExpensesOpen} onOpenChange={setIsLinkExpensesOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Link Expenses to {selectedGoal?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Link expenses from this month to this savings goal. The expense amount will be added to the goal.
            </p>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {currentMonthExpenses && currentMonthExpenses.length > 0 ? (
                currentMonthExpenses.map((expense) => {
                  const isLinked = expense.linkedGoalIds?.includes(selectedGoalId as string);
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{expense.description || "Expense"}</p>
                        <p className="text-xs text-muted-foreground">
                          £{expense.amount.toFixed(2)} · {format(new Date(expense.date), "MMM d")} · {expense.category}
                        </p>
                      </div>
                      <Button
                        variant={isLinked ? "outline" : "default"}
                        size="sm"
                        onClick={() =>
                          isLinked
                            ? handleUnlinkExpense(expense.id as Id<"expenses">)
                            : handleLinkExpense(expense.id as Id<"expenses">)
                        }
                      >
                        {isLinked ? (
                          <>
                            <Unlink className="h-3 w-3 mr-1" />
                            Unlink
                          </>
                        ) : (
                          <>
                            <Link2 className="h-3 w-3 mr-1" />
                            Link
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No expenses found for this month
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkExpensesOpen(false)}>
              Close
            </Button>
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
                <Label className="text-sm font-medium">
                  Contribution Breakdown
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {contributionsByUser.map((user) => (
                    <div key={user.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.image} />
                          <AvatarFallback className="text-xs">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {user.name}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        £{user.total.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contribution Chart */}
            {contributionChartData.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Contribution Trend</Label>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={contributionChartData}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `£${v}`} />
                      <Tooltip formatter={(value: number) => `£${value.toFixed(2)}`} />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#22c55e"
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* History list */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">History</Label>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {contributions && contributions.length > 0 ? (
                  contributions.map((c) => (
                    <div
                      key={c._id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg group"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={c.contributorImage} />
                          <AvatarFallback className="text-xs">
                            {c.contributorName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {c.contributorName}
                          </p>
                          {c.note && (
                            <p className="text-xs text-muted-foreground">
                              {c.note}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            +£{c.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(c.date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditDialog(c)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500"
                            onClick={() => handleDeleteContribution(c._id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No contributions yet
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavingsGoals;
