import { useState } from "react";
import { format } from "date-fns";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthContext";
import { useUsers, useCategories, useLocations } from "@/hooks/useConvexData";
import CategorySelector from "@/components/expense/CategorySelector";
import LocationSelector from "@/components/expense/LocationSelector";
import SplitTypeSelector from "@/components/expense/SplitTypeSelector";
import {
  Check,
  X,
  Zap,
  CreditCard,
  Building2,
  Smartphone,
  Inbox,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

const sourceIcons: Record<string, React.ReactNode> = {
  applepay: <Smartphone className="h-4 w-4" />,
  googlepay: <Smartphone className="h-4 w-4" />,
  truelayer: <Building2 className="h-4 w-4" />,
  plaid: <Building2 className="h-4 w-4" />,
  ifttt: <Zap className="h-4 w-4" />,
  webhook: <CreditCard className="h-4 w-4" />,
};

const sourceLabels: Record<string, string> = {
  applepay: "Apple Pay",
  googlepay: "Google Pay",
  truelayer: "Bank",
  plaid: "Bank",
  ifttt: "IFTTT",
  webhook: "External",
};

const PendingTransactions = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const users = useUsers();
  const categories = useCategories();
  const locations = useLocations();

  const pendingTxs = useQuery(api.pendingTransactions.getPending);
  const stats = useQuery(api.pendingTransactions.getStats);
  const approveMutation = useMutation(api.pendingTransactions.approve);
  const dismissMutation = useMutation(api.pendingTransactions.dismiss);
  const approveAllMutation = useMutation(api.pendingTransactions.approveAll);
  const dismissAllMutation = useMutation(api.pendingTransactions.dismissAll);

  const [selectedTx, setSelectedTx] = useState<typeof pendingTxs extends (infer T)[] | undefined ? T : never | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    date: "",
    category: "",
    location: "",
    paidBy: "",
    split: "50/50",
    description: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const openApproveDialog = (tx: NonNullable<typeof pendingTxs>[0]) => {
    setSelectedTx(tx);
    setEditForm({
      amount: tx.amount.toString(),
      date: tx.date,
      category: tx.suggestedCategory || "",
      location: tx.suggestedLocation || "",
      paidBy: tx.suggestedPaidById || currentUser?._id || "",
      split: "50/50",
      description: tx.description || tx.merchantName,
    });
  };

  const handleApprove = async () => {
    if (!selectedTx || !editForm.category || !editForm.paidBy) {
      toast({
        title: "Missing fields",
        description: "Please select a category and who paid.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Find category and location IDs
      const category = categories?.find((c) => c.name === editForm.category);
      const location = locations?.find((l) => l.name === editForm.location) || locations?.[0];

      if (!category || !location) {
        throw new Error("Category or location not found");
      }

      await approveMutation({
        id: selectedTx._id,
        amount: parseFloat(editForm.amount),
        date: editForm.date,
        categoryId: category._id,
        locationId: location._id,
        paidById: editForm.paidBy as Id<"users">,
        splitType: editForm.split,
        description: editForm.description,
      });

      toast({ title: "Expense logged", description: `£${editForm.amount} added.` });
      setSelectedTx(null);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to approve transaction.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = async (id: Id<"pendingTransactions">) => {
    try {
      await dismissMutation({ id });
      toast({ title: "Dismissed", description: "Transaction removed from queue." });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to dismiss.", variant: "destructive" });
    }
  };

  const handleApproveAll = async () => {
    if (!currentUser?._id) return;

    setIsProcessing(true);
    try {
      const result = await approveAllMutation({
        paidById: currentUser._id,
        splitType: "50/50",
      });
      toast({
        title: "Bulk approved",
        description: `${result.approved} expenses logged, ${result.skipped} skipped (missing category).`,
      });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to approve all.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismissAll = async () => {
    setIsProcessing(true);
    try {
      const count = await dismissAllMutation({});
      toast({ title: "All dismissed", description: `${count} transactions removed.` });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to dismiss all.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!pendingTxs) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="h-6 w-6" />
            Pending Transactions
          </h1>
          <p className="text-muted-foreground">
            Review and approve transactions from your connected sources
          </p>
        </div>

        {stats && stats.count > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {stats.count} pending
            </Badge>
            <Badge variant="outline" className="text-lg px-3 py-1">
              £{stats.totalAmount.toFixed(2)} total
            </Badge>
          </div>
        )}
      </div>

      {pendingTxs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCheck className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">All caught up!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              No pending transactions. Use Apple Pay, Google Pay, or connect your bank
              to automatically detect new expenses.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Bulk actions */}
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleApproveAll}
              disabled={isProcessing}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Approve All (as me, 50/50)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismissAll}
              disabled={isProcessing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Dismiss All
            </Button>
          </div>

          {/* Transaction list */}
          <div className="space-y-3">
            {pendingTxs.map((tx) => (
              <Card key={tx._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-full bg-muted">
                        {sourceIcons[tx.source] || <CreditCard className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{tx.merchantName}</span>
                          <Badge variant="outline" className="text-xs">
                            {sourceLabels[tx.source] || tx.source}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {tx.description !== tx.merchantName && tx.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(tx.date), "d MMM yyyy")}
                          {tx.suggestedCategory && (
                            <span className="ml-2">• {tx.suggestedCategory}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg whitespace-nowrap">
                        £{tx.amount.toFixed(2)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => openApproveDialog(tx)}
                      >
                        <Check className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDismiss(tx._id)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Approve Dialog */}
      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Transaction</DialogTitle>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedTx.merchantName}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedTx.date), "d MMMM yyyy")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  />
                </div>
              </div>

              <CategorySelector
                selectedCategory={editForm.category}
                onChange={(cat) => setEditForm({ ...editForm, category: cat })}
              />

              <LocationSelector
                selectedLocation={editForm.location}
                onChange={(loc) => setEditForm({ ...editForm, location: loc })}
              />

              <div>
                <Label>Paid By</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={editForm.paidBy}
                  onChange={(e) => setEditForm({ ...editForm, paidBy: e.target.value })}
                >
                  <option value="">Select...</option>
                  {users?.map((u) => (
                    <option key={u._id || u.id} value={u._id || u.id}>
                      {u.name || u.username || u.email}
                    </option>
                  ))}
                </select>
              </div>

              <SplitTypeSelector
                selectedSplitType={editForm.split}
                onChange={(split) => setEditForm({ ...editForm, split })}
              />

              <div>
                <Label>Description</Label>
                <Input
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTx(null)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? "Saving..." : "Log Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Setup instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connect Your Payment Sources</CardTitle>
          <CardDescription>
            Set up automations to automatically detect expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <span className="font-medium">Apple Pay (iOS)</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Create an iOS Shortcut that triggers after every Apple Pay transaction.
              </p>
              <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                {window.location.origin}/quick-add?source=applepay&amount=&#123;amount&#125;
              </code>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <span className="font-medium">IFTTT / Zapier</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Send a POST request to the webhook endpoint when transactions occur.
              </p>
              <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                POST {window.location.origin.replace("localhost:8080", "YOUR_CONVEX_URL")}/api/webhook/transaction
              </code>
            </div>

            <div className="p-4 border rounded-lg md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">Bank Connection (TrueLayer)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Connect your UK bank account to automatically import transactions.
                Go to Settings to link your accounts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingTransactions;
