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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { format } from "date-fns";
import {
  Umbrella,
  RefreshCw,
  Building2,
  Trash2,
  Pencil,
  Check,
  X,
  ArrowRightLeft,
  TrendingUp,
  CreditCard,
  CalendarDays,
  MapPin,
  Tag,
  StickyNote,
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
  location: string;
  notes: string;
  localAmount: string;
  localCurrency: string;
}

const Holidays = () => {
  const linkedAccounts = useLinkedBankAccounts();
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [editing, setEditing] = useState<EditingTx | null>(null);

  const bankLinkId = selectedBankId
    ? (selectedBankId as Id<"bankLinks">)
    : undefined;

  const transactions = useHolidayTransactions(bankLinkId);
  const analytics = useHolidayAnalytics(bankLinkId);
  const syncHolidayTransactions = useSyncHolidayTransactions();
  const updateTransaction = useUpdateHolidayTransaction();
  const clearTransactions = useClearHolidayTransactions();

  const selectedAccount = useMemo(
    () => linkedAccounts?.find((a) => a._id === selectedBankId),
    [linkedAccounts, selectedBankId],
  );

  const activeAccounts = useMemo(
    () => linkedAccounts?.filter((a) => a.isActive) || [],
    [linkedAccounts],
  );

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
      location: tx.location || "",
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
        location: editing.location || undefined,
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
          {/* Account selector & sync */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="w-full sm:w-72">
                    <Label htmlFor="bank-select" className="mb-2 block">
                      Bank Account
                    </Label>
                    <Select
                      value={selectedBankId}
                      onValueChange={setSelectedBankId}
                    >
                      <SelectTrigger id="bank-select">
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeAccounts.map((account) => (
                          <SelectItem key={account._id} value={account._id}>
                            {account.institutionName} — {account.accountName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedAccount && (
                    <div className="text-sm text-muted-foreground">
                      Last sync:{" "}
                      {selectedAccount.lastSyncAt
                        ? format(
                            new Date(selectedAccount.lastSyncAt),
                            "dd MMM yyyy HH:mm",
                          )
                        : "Never"}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
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
                    <ArrowRightLeft className="h-3 w-3" />
                    Imported
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
                    {analytics.count} days
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
                  Edit categories, locations, and local currency amounts.
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
                        <TableHead>Location</TableHead>
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
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <Input
                                    className="w-28 h-8 text-xs"
                                    value={editing.location}
                                    onChange={(e) =>
                                      setEditing({
                                        ...editing,
                                        location: e.target.value,
                                      })
                                    }
                                    placeholder="Location"
                                  />
                                </div>
                              ) : tx.location ? (
                                <span className="text-sm">{tx.location}</span>
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
                  <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No transactions yet</h3>
                  <p className="text-muted-foreground max-w-sm mt-2">
                    Sync your bank account to pull in holiday transactions.
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
