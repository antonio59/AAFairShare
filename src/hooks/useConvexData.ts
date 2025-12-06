import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  DEMO_MODE,
  demoUsers,
  demoCategories,
  demoLocations,
  demoExpenses,
  demoMonthData,
  demoRecurring,
  demoSavingsGoals,
  demoSavingsContributions,
  demoSettlements,
  demoReceipts,
  demoAnalytics,
} from "@/lib/demoData";

const noop = async () => {};

// Users hooks
export function useUsers() {
  const data = useQuery(api.users.getAll);
  return DEMO_MODE ? demoUsers : data;
}

export function useCurrentUser() {
  const data = useQuery(api.users.getCurrentUser);
  return DEMO_MODE ? demoUsers[0] : data;
}

export function useStoreUser() {
  const mutate = useMutation(api.users.store);
  return DEMO_MODE ? noop : mutate;
}

// Categories hooks
export function useCategories() {
  const data = useQuery(api.categories.getAll);
  return DEMO_MODE ? demoCategories : data;
}

export function useCreateCategory() {
  const mutate = useMutation(api.categories.create);
  return DEMO_MODE ? noop : mutate;
}

export function useDeleteCategory() {
  const mutate = useMutation(api.categories.remove);
  return DEMO_MODE ? noop : mutate;
}

export function useGetOrCreateCategory() {
  const mutate = useMutation(api.categories.getOrCreate);
  return DEMO_MODE ? async ({ name }: { name: string }) => name : mutate;
}

export function useCategoryUsage(id: Id<"categories"> | undefined) {
  const data = useQuery(api.categories.checkUsage, id ? { id } : "skip");
  return DEMO_MODE ? false : data;
}

// Locations hooks
export function useLocations() {
  const data = useQuery(api.locations.getAll);
  return DEMO_MODE ? demoLocations : data;
}

export function useCreateLocation() {
  const mutate = useMutation(api.locations.create);
  return DEMO_MODE ? noop : mutate;
}

export function useDeleteLocation() {
  const mutate = useMutation(api.locations.remove);
  return DEMO_MODE ? noop : mutate;
}

export function useGetOrCreateLocation() {
  const mutate = useMutation(api.locations.getOrCreate);
  return DEMO_MODE ? async ({ name }: { name: string }) => name : mutate;
}

export function useLocationUsage(id: Id<"locations"> | undefined) {
  const data = useQuery(api.locations.checkUsage, id ? { id } : "skip");
  return DEMO_MODE ? false : data;
}

// Expenses hooks
export function useExpensesByMonth(month: string) {
  const data = useQuery(api.expenses.getByMonth, { month });
  return DEMO_MODE ? demoExpenses : data;
}

export function useCreateExpense() {
  const mutate = useMutation(api.expenses.create);
  return DEMO_MODE ? async () => ({ id: "demo-exp" }) : mutate;
}

export function useAddExpenseWithLookup() {
  const mutate = useMutation(api.expenses.addWithLookup);
  return DEMO_MODE ? async () => ({ id: "demo-exp" }) : mutate;
}

export function useUpdateExpense() {
  const mutate = useMutation(api.expenses.update);
  return DEMO_MODE ? noop : mutate;
}

export function useDeleteExpense() {
  const mutate = useMutation(api.expenses.remove);
  return DEMO_MODE ? noop : mutate;
}

// Month data hook
export function useMonthData(month: string) {
  const data = useQuery(api.monthData.getMonthData, { month });
  return DEMO_MODE ? demoMonthData : data;
}

// Recurring expenses hooks
export function useRecurringExpenses() {
  const data = useQuery(api.recurring.getAll);
  return DEMO_MODE ? demoRecurring : data;
}

export function useCreateRecurringExpense() {
  const mutate = useMutation(api.recurring.create);
  return DEMO_MODE ? noop : mutate;
}

export function useUpdateRecurringExpense() {
  const mutate = useMutation(api.recurring.update);
  return DEMO_MODE ? noop : mutate;
}

export function useDeleteRecurringExpense() {
  const mutate = useMutation(api.recurring.remove);
  return DEMO_MODE ? noop : mutate;
}

export function useGenerateExpenseFromRecurring() {
  const mutate = useMutation(api.recurring.generateExpense);
  return DEMO_MODE ? noop : mutate;
}

// Settlements hooks
export function useSettlementByMonth(month: string) {
  const data = useQuery(api.settlements.getByMonth, { month });
  return DEMO_MODE ? demoSettlements[0] : data;
}

export function useSettlementExists(month: string) {
  const data = useQuery(api.settlements.checkExists, { month });
  return DEMO_MODE ? !!demoSettlements.length : data;
}

export function useMarkSettlementComplete() {
  const mutate = useMutation(api.settlements.markComplete);
  return DEMO_MODE ? noop : mutate;
}

export function useMarkSettlementUnsettled() {
  const mutate = useMutation(api.settlements.markUnsettled);
  return DEMO_MODE ? noop : mutate;
}

// Savings goals hooks
export function useSavingsGoals() {
  const data = useQuery(api.savingsGoals.getAll);
  return DEMO_MODE ? demoSavingsGoals.map((g) => ({ ...g, _id: g._id || g.id })) : data;
}

export function useCreateSavingsGoal() {
  const mutate = useMutation(api.savingsGoals.create);
  return DEMO_MODE ? async () => "demo-goal" : mutate;
}

export function useUpdateSavingsGoal() {
  const mutate = useMutation(api.savingsGoals.update);
  return DEMO_MODE ? noop : mutate;
}

export function useDeleteSavingsGoal() {
  const mutate = useMutation(api.savingsGoals.remove);
  return DEMO_MODE ? noop : mutate;
}

export function useMarkSavingsGoalComplete() {
  const mutate = useMutation(api.savingsGoals.markComplete);
  return DEMO_MODE ? noop : mutate;
}

export function useReopenSavingsGoal() {
  const mutate = useMutation(api.savingsGoals.reopen);
  return DEMO_MODE ? noop : mutate;
}

export function useAddSavingsContribution() {
  const mutate = useMutation(api.savingsGoals.addContribution);
  return DEMO_MODE ? noop : mutate;
}

export function useSavingsContributions(goalId: Id<"savingsGoals"> | undefined) {
  const data = useQuery(api.savingsGoals.getContributions, goalId ? { goalId } : "skip");
  return DEMO_MODE
    ? demoSavingsContributions
        .filter((c) => c.goalId === (goalId || "goal-1"))
        .map((c) => {
          const user = demoUsers.find((u) => u.id === c.contributorId);
          return {
            ...c,
            contributorName: c.contributorName || user?.username || "User",
            contributorImage: c.contributorImage || user?.avatar || "",
          };
        })
    : data;
}

export function useSavingsContributionsByUser(goalId: Id<"savingsGoals"> | undefined) {
  const data = useQuery(api.savingsGoals.getContributionsByUser, goalId ? { goalId } : "skip");
  return DEMO_MODE
    ? demoUsers.map((u) => ({
        id: u.id,
        name: u.username,
        image: u.avatar || "",
        total: demoSavingsContributions
          .filter((c) => c.goalId === (goalId || "goal-1") && c.contributorId === u.id)
          .reduce((s, c) => s + c.amount, 0),
      }))
    : data;
}

export function useUpdateSavingsContribution() {
  const mutate = useMutation(api.savingsGoals.updateContribution);
  return DEMO_MODE ? noop : mutate;
}

export function useDeleteSavingsContribution() {
  const mutate = useMutation(api.savingsGoals.deleteContribution);
  return DEMO_MODE ? noop : mutate;
}

// Receipt uploads
export function useGenerateUploadUrl() {
  const mutate = useMutation(api.receipts.generateUploadUrl);
  return DEMO_MODE ? async () => "demo-upload-url" : mutate;
}

export function useGetReceiptUrl(storageId: Id<"_storage"> | undefined) {
  const data = useQuery(api.receipts.getReceiptUrl, storageId ? { storageId } : "skip");
  return DEMO_MODE
    ? "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=800&q=80"
    : data;
}

export function useAttachReceipt() {
  const mutate = useMutation(api.receipts.attachReceipt);
  return DEMO_MODE ? noop : mutate;
}

export function useRemoveReceipt() {
  const mutate = useMutation(api.receipts.removeReceipt);
  return DEMO_MODE ? noop : mutate;
}

export function useAllReceipts() {
  const data = useQuery(api.receipts.getAllWithReceipts);
  return DEMO_MODE ? demoReceipts.filter((r) => r.type === "expense") : data;
}

export function useStandaloneReceipts() {
  const data = useQuery(api.receipts.getAllStandalone);
  return DEMO_MODE ? demoReceipts.filter((r) => r.type === "standalone") : data;
}

export function useCreateStandaloneReceipt() {
  const mutate = useMutation(api.receipts.createStandalone);
  return DEMO_MODE ? noop : mutate;
}

export function useUpdateStandaloneReceipt() {
  const mutate = useMutation(api.receipts.updateStandalone);
  return DEMO_MODE ? noop : mutate;
}

export function useDeleteStandaloneReceipt() {
  const mutate = useMutation(api.receipts.deleteStandalone);
  return DEMO_MODE ? noop : mutate;
}
