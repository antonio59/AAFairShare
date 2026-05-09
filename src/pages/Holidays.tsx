import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  Umbrella,
  RefreshCw,
  Building2,
  Trash2,
  Pencil,
  Check,
  X,
  TrendingUp,
  CreditCard,
  CalendarDays,
  Tag,
  StickyNote,
  Settings2,
  Plus,
  Plane,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  useLinkedBankAccounts,
  useHolidayTransactions,
  useHolidayAnalytics,
  useSyncHolidayTransactions,
  useUpdateHolidayTransaction,
  useClearHolidayTransactions,
  useHolidayCategories,
  useCreateHolidayCategory,
  useUpdateHolidayCategory,
  useDeleteHolidayCategory,
  useSeedHolidayCategories,
} from "@/hooks/useConvexData";
import { Id } from "../../convex/_generated/dataModel";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface EditingTx {
  id: Id<"holidayTransactions">;
  category: string;
  notes: string;
  localAmount: string;
  localCurrency: string;
}

type DateRangePreset = "this-month" | "last-month" | "all" | "custom";

const Holidays = () => {
  const linkedAccounts = useLinkedBankAccounts();
  const [datePreset, setDatePreset] = useState<DateRangePreset>("this-month");
  const [fromDate, setFromDate] = useState<string>(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState<string>(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [isSyncing, setIsSyncing] = useState(false);
  const [editing, setEditing] = useState<EditingTx | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryPatterns, setNewCategoryPatterns] = useState("");
  const [editingCategory, setEditingCategory] = useState<{ id: Id<"holidayCategories">; name: string; patterns: string } | null>(null);

  const categories = useHolidayCategories();
  const seedCategories = useSeedHolidayCategories();
  const createCategory = useCreateHolidayCategory();
  const updateCategory = useUpdateHolidayCategory();
  const deleteCategory = useDeleteHolidayCategory();

  // Auto-select the only linked account
  const activeAccounts = useMemo(
    () => linkedAccounts?.filter((a) => a.isActive) || [],
    [linkedAccounts],
  );
  const selectedBankId = useMemo(() => {
    if (activeAccounts.length === 1) return activeAccounts[0]._id;
    return undefined;
  }, [activeAccounts]);

  const bankLinkId = selectedBankId as Id<"bankLinks"> | undefined;

  const transactions = useHolidayTransactions(bankLinkId, fromDate, toDate);
  const analytics = useHolidayAnalytics(bankLinkId, fromDate, toDate);
  const syncHolidayTransactions = useSyncHolidayTransactions();
  const updateTransaction = useUpdateHolidayTransaction();
  const clearTransactions = useClearHolidayTransactions();

  // Seed default categories if none exist
  useEffect(() => {
    if (categories && categories.length === 0) {
      seedCategories();
    }
  }, [categories, seedCategories]);

  const selectedAccount = useMemo(
    () => activeAccounts.find((a) => a._id === selectedBankId),
    [activeAccounts, selectedBankId],
  );

  const applyPreset = (preset: DateRangePreset) => {
    setDatePreset(preset);
    const now = new Date();
    switch (preset) {
      case "this-month":
        setFromDate(format(startOfMonth(now), "yyyy-MM-dd"));
        setToDate(format(endOfMonth(now), "yyyy-MM-dd"));
        break;
      case "last-month":
        setFromDate(format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd"));
        setToDate(format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd"));
        break;
      case "all":
        setFromDate("");
        setToDate("");
        break;
    }
  };

  const handleSync = async () => {
    if (!bankLinkId) return;
    setIsSyncing(true);
    try {
      const result = await syncHolidayTransactions({ bankLinkId, daysBack: 90 });
      toast({
        title: "Sync complete",
        description: `Imported ${result.imported}, skipped ${result.skipped} of ${result.total} transactions.`,
      });
    } catch (err) {
      toast({
        title: "Sync failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClear = async () => {
    if (!bankLinkId) return;
    if (!confirm("Delete all holiday transactions for this account?")) return;
    try {
      await clearTransactions({ bankLinkId });
      toast({ title: "Cleared", description: "All holiday transactions removed." });
    } catch (err) {
      toast({
        title: "Clear failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const startEditing = (tx: NonNullable<typeof transactions>[number]) => {
    setEditing({
      id: tx._id,
      category: tx.category || "",
      notes: tx.notes || "",
      localAmount: tx.localAmount?.toString() || "",
      localCurrency: tx.localCurrency || "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateTransaction({
        id: editing.id,
        category: editing.category || undefined,
        notes: editing.notes || undefined,
        localAmount: editing.localAmount ? parseFloat(editing.localAmount) : undefined,
        localCurrency: editing.localCurrency || undefined,
      });
      setEditing(null);
      toast({ title: "Updated", description: "Transaction details saved." });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => setEditing(null);

  const categoryData = useMemo(() => {
    if (!analytics?.byCategory) return [];
    return analytics.byCategory.map((c) => ({
      name: c.name,
      amount: c.amount,
    }));
  }, [analytics]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const patterns = newCategoryPatterns.split(",").map((p) => p.trim()).filter(Boolean);
    try {
      await createCategory({ name: newCategoryName.trim(), patterns });
      setNewCategoryName("");
      setNewCategoryPatterns("");
      toast({ title: "Category created" });
    } catch (err) {
      toast({
        title: "Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    const patterns = editingCategory.patterns.split(",").map((p) => p.trim()).filter(Boolean);
    try {
      await updateCategory({
        id: editingCategory.id,
        name: editingCategory.name,
        patterns,
      });
      setEditingCategory(null);
      toast({ title: "Category updated" });
    } catch (err) {
      toast({
        title: "Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: Id<"holidayCategories">) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory({ id });
      toast({ title: "Category deleted" });
    } catch (err) {
      toast({
        title: "Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Umbrella className="h-8 w-8 text-primary" />
            Holidays
          </h1>
          <p className="text-muted-foreground mt-1">
            Track joint spending from your linked bank account.
          </p>
        </div>
        {activeAccounts.length === 1 && selectedAccount && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            {selectedAccount.institutionName} — {selectedAccount.accountName}
          </div>
        )}
      </div>

      {/* No accounts prompt */}
      {activeAccounts.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No bank account linked</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                Link a joint bank account in Settings &rarr; Open Banking to start
                tracking holiday expenses.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeAccounts.length > 0 && (
        <>
          {/* Date range & sync controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="flex gap-1">
                    {(["this-month", "last-month", "all"] as DateRangePreset[]).map((p) => (
                      <Button
                        key={p}
                        variant={datePreset === p ? "default" : "outline"}
                        size="sm"
                        onClick={() => applyPreset(p)}
                      >
                        {p === "this-month" ? "This Month" : p === "last-month" ? "Last Month" : "All Time"}
                      </Button>
                    ))}
                    <Button
                      variant={datePreset === "custom" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDatePreset("custom")}
                    >
                      Custom
                    </Button>
                  </div>
                  {datePreset === "custom" && (
                    <div className="flex gap-2 items-center">
                      <Input
                        type="date"
                        className="w-36 h-8 text-xs"
                        value={fromDate}
                        onChange={(e) => {
                          setFromDate(e.target.value);
                          setDatePreset("custom");
                        }}
                      />
                      <span className="text-muted-foreground text-xs">to</span>
                      <Input
                        type="date"
                        className="w-36 h-8 text-xs"
                        value={toDate}
                        onChange={(e) => {
                          setToDate(e.target.value);
                          setDatePreset("custom");
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings2 className="h-4 w-4 mr-1" />
                        Categories
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Holiday Categories</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            New transactions are auto-tagged based on description patterns.
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Category name (e.g. Travel)"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                            <Input
                              placeholder="Patterns: iberia, british airways"
                              value={newCategoryPatterns}
                              onChange={(e) => setNewCategoryPatterns(e.target.value)}
                            />
                            <Button size="sm" onClick={handleCreateCategory}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {categories?.map((cat) => (
                            <div key={cat._id} className="flex items-center justify-between p-2 border rounded-lg">
                              {editingCategory?.id === cat._id ? (
                                <div className="flex gap-2 flex-1">
                                  <Input
                                    className="h-8 text-sm"
                                    value={editingCategory.name}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                  />
                                  <Input
                                    className="h-8 text-sm flex-1"
                                    value={editingCategory.patterns}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, patterns: e.target.value })}
                                  />
                                  <Button size="icon" className="h-8 w-8" variant="ghost" onClick={handleUpdateCategory}>
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button size="icon" className="h-8 w-8" variant="ghost" onClick={() => setEditingCategory(null)}>
                                    <X className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <Plane className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm font-medium">{cat.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {cat.patterns.join(", ")}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() =>
                                        setEditingCategory({
                                          id: cat._id,
                                          name: cat.name,
                                          patterns: cat.patterns.join(", "),
                                        })
                                      }
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-red-500"
                                      onClick={() => handleDeleteCategory(cat._id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    disabled={!bankLinkId || (transactions?.length || 0) === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSync}
                    disabled={!bankLinkId || isSyncing}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-1 ${isSyncing ? "animate-spin" : ""}`}
                    />
                    {isSyncing ? "Syncing…" : "Sync"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics */}
          {analytics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Spent</CardDescription>
                  <CardTitle className="text-2xl">
                    {analytics.total.toLocaleString("en-GB", {
                      style: "currency",
                      currency: "GBP",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Base currency
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Transactions</CardDescription>
                  <CardTitle className="text-2xl">{analytics.count}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    In period
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Daily Average</CardDescription>
                  <CardTitle className="text-2xl">
                    {analytics.dailyAverage.toLocaleString("en-GB", {
                      style: "currency",
                      currency: "GBP",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Per day
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Date Range</CardDescription>
                  <CardTitle className="text-lg">
                    {analytics.dateRange.from && analytics.dateRange.to
                      ? `${format(
                          new Date(analytics.dateRange.from),
                          "dd MMM",
                        )} – ${format(
                          new Date(analytics.dateRange.to),
                          "dd MMM yyyy",
                        )}`
                      : "—"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {Math.max(1, Math.ceil((new Date(analytics.dateRange.to).getTime() - new Date(analytics.dateRange.from).getTime()) / (1000 * 60 * 60 * 24)))} days
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Category chart */}
          {categoryData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `£${v}`} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value: number) =>
                          value.toLocaleString("en-GB", {
                            style: "currency",
                            currency: "GBP",
                          })
                        }
                      />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                        {categoryData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transactions table */}
          {transactions && transactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transactions</CardTitle>
                <CardDescription>
                  Edit categories, notes, and local currency amounts.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => {
                        const isEditing = editing?.id === tx._id;
                        return (
                          <TableRow key={tx._id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(tx.date), "dd MMM yyyy")}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {tx.description}
                            </TableCell>
                            <TableCell className="whitespace-nowrap font-medium">
                              {tx.amount.toLocaleString("en-GB", {
                                style: "currency",
                                currency: tx.currency || "GBP",
                              })}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="w-20 h-8 text-xs"
                                    value={editing.localAmount}
                                    onChange={(e) =>
                                      setEditing({
                                        ...editing,
                                        localAmount: e.target.value,
                                      })
                                    }
                                    placeholder="Amt"
                                  />
                                  <Input
                                    className="w-16 h-8 text-xs"
                                    value={editing.localCurrency}
                                    onChange={(e) =>
                                      setEditing({
                                        ...editing,
                                        localCurrency: e.target.value,
                                      })
                                    }
                                    placeholder="EUR"
                                  />
                                </div>
                              ) : tx.localAmount ? (
                                <span className="text-sm">
                                  {tx.localAmount.toLocaleString("en-GB", {
                                    style: "currency",
                                    currency: tx.localCurrency || "GBP",
                                  })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <Tag className="h-3 w-3 text-muted-foreground" />
                                  <Input
                                    className="w-28 h-8 text-xs"
                                    value={editing.category}
                                    onChange={(e) =>
                                      setEditing({
                                        ...editing,
                                        category: e.target.value,
                                      })
                                    }
                                    placeholder="Category"
                                  />
                                </div>
                              ) : tx.category ? (
                                <Badge variant="secondary">{tx.category}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <StickyNote className="h-3 w-3 text-muted-foreground" />
                                  <Input
                                    className="w-32 h-8 text-xs"
                                    value={editing.notes}
                                    onChange={(e) =>
                                      setEditing({
                                        ...editing,
                                        notes: e.target.value,
                                      })
                                    }
                                    placeholder="Notes"
                                  />
                                </div>
                              ) : tx.notes ? (
                                <span className="text-sm max-w-[120px] truncate block">
                                  {tx.notes}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={saveEdit}
                                  >
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={cancelEdit}
                                  >
                                    <X className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => startEditing(tx)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {transactions && transactions.length === 0 && bankLinkId && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center py-8">
                  <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No transactions for this period</h3>
                  <p className="text-muted-foreground max-w-sm mt-2">
                    Try changing the date range or sync your bank account.
                  </p>
                  <Button className="mt-4" onClick={handleSync} disabled={isSyncing}>
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
                    />
                    {isSyncing ? "Syncing…" : "Sync Now"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Holidays;
