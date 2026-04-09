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
  return DEMO_MODE
    ? demoSavingsGoals.map((g) => ({ ...g, _id: g._id || g.id }))
    : data;
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

export function useSavingsContributions(
  goalId: Id<"savingsGoals"> | undefined,
) {
  const data = useQuery(
    api.savingsGoals.getContributions,
    goalId ? { goalId } : "skip",
  );
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

export function useSavingsContributionsByUser(
  goalId: Id<"savingsGoals"> | undefined,
) {
  const data = useQuery(
    api.savingsGoals.getContributionsByUser,
    goalId ? { goalId } : "skip",
  );
  return DEMO_MODE
    ? demoUsers.map((u) => ({
        id: u.id,
        name: u.username,
        image: u.avatar || "",
        total: demoSavingsContributions
          .filter(
            (c) =>
              c.goalId === (goalId || "goal-1") && c.contributorId === u.id,
          )
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
  const data = useQuery(
    api.receipts.getReceiptUrl,
    storageId ? { storageId } : "skip",
  );
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

// Pending transactions hooks
export function usePendingTransactions() {
  const data = useQuery(api.pendingTransactions.getPending);
  return DEMO_MODE ? [] : data;
}

export function usePendingTransactionStats() {
  const data = useQuery(api.pendingTransactions.getStats);
  return DEMO_MODE ? { count: 0, totalAmount: 0 } : data;
}

export function useApprovePendingTransaction() {
  const mutate = useMutation(api.pendingTransactions.approve);
  return DEMO_MODE ? noop : mutate;
}

export function useDismissPendingTransaction() {
  const mutate = useMutation(api.pendingTransactions.dismiss);
  return DEMO_MODE ? noop : mutate;
}

export function useApproveAllPendingTransactions() {
  const mutate = useMutation(api.pendingTransactions.approveAll);
  return DEMO_MODE ? async () => ({ approved: 0, skipped: 0 }) : mutate;
}

export function useDismissAllPendingTransactions() {
  const mutate = useMutation(api.pendingTransactions.dismissAll);
  return DEMO_MODE ? async () => 0 : mutate;
}

// Merchant mappings hooks
export function useMerchantMappings() {
  const data = useQuery(api.merchantMappings.getAll);
  return DEMO_MODE ? [] : data;
}

export function useCreateMerchantMapping() {
  const mutate = useMutation(api.merchantMappings.create);
  return DEMO_MODE ? noop : mutate;
}

export function useDeleteMerchantMapping() {
  const mutate = useMutation(api.merchantMappings.remove);
  return DEMO_MODE ? noop : mutate;
}

export function useSeedUtilityMappings() {
  const mutate = useMutation(api.merchantMappings.seedUtilityMappings);
  return DEMO_MODE ? async () => ({ created: 0 }) : mutate;
}

// Banking hooks
export function useBankingConfig() {
  const data = useQuery(api.banking.getConfig);
  return DEMO_MODE ? { isConfigured: false, environment: "sandbox" } : data;
}

export function useBankAuthLink() {
  const data = useQuery(api.banking.generateAuthLink);
  return DEMO_MODE ? { authUrl: null, error: "Demo mode" } : data;
}

export function useLinkedBankAccounts() {
  const data = useQuery(api.banking.getLinkedAccounts);
  return DEMO_MODE ? [] : data;
}

export function useDisconnectBankAccount() {
  const mutate = useMutation(api.banking.disconnectAccount);
  return DEMO_MODE ? noop : mutate;
}

export function useDeleteBankAccount() {
  const mutate = useMutation(api.banking.deleteAccount);
  return DEMO_MODE ? noop : mutate;
}

// ============ BILLS & ADDRESSES HOOKS ============

export function useAllAddresses() {
  const data = useQuery(api.bills.getAllAddresses);
  return DEMO_MODE ? [] : data;
}

export function useActiveAddresses() {
  const data = useQuery(api.bills.getActiveAddresses);
  return DEMO_MODE ? [] : data;
}

export function useArchivedAddresses() {
  const data = useQuery(api.bills.getArchivedAddresses);
  return DEMO_MODE ? [] : data;
}

export function useCreateAddress() {
  const mutate = useMutation(api.bills.createAddress);
  return DEMO_MODE ? async () => ("demo-address-id" as Id<"addresses">) : mutate;
}

export function useUpdateAddress() {
  const mutate = useMutation(api.bills.updateAddress);
  return DEMO_MODE ? noop : mutate;
}

export function useArchiveAddress() {
  const mutate = useMutation(api.bills.archiveAddress);
  return DEMO_MODE ? noop : mutate;
}

export function useUnarchiveAddress() {
  const mutate = useMutation(api.bills.unarchiveAddress);
  return DEMO_MODE ? noop : mutate;
}

export function useDeleteAddress() {
  const mutate = useMutation(api.bills.deleteAddress);
  return DEMO_MODE ? noop : mutate;
}

export function useAllBills() {
  const data = useQuery(api.bills.getAllBills);
  return DEMO_MODE ? [] : data;
}

export function useBillsByAddress(addressId: Id<"addresses"> | undefined) {
  const data = useQuery(
    api.bills.getBillsByAddress,
    addressId ? { addressId } : "skip"
  );
  return DEMO_MODE ? [] : data;
}

export function useRecentBills(limit?: number) {
  const data = useQuery(api.bills.getRecentBills, { limit });
  return DEMO_MODE ? [] : data;
}

export function useBillWithExpenses(billId: Id<"bills"> | undefined) {
  const data = useQuery(
    api.bills.getBillWithExpenses,
    billId ? { billId } : "skip"
  );
  return DEMO_MODE ? null : data;
}

export function useBillByExpense(expenseId: Id<"expenses"> | undefined) {
  const data = useQuery(
    api.bills.getBillByExpense,
    expenseId ? { expenseId } : "skip"
  );
  return DEMO_MODE ? null : data;
}

export function useUnlinkedBills(addressId?: Id<"addresses">, billType?: string) {
  const data = useQuery(
    api.bills.getUnlinkedBills,
    { addressId, billType }
  );
  return DEMO_MODE ? [] : data;
}

export function useGenerateBillUploadUrl() {
  const mutate = useMutation(api.bills.generateUploadUrl);
  return DEMO_MODE ? async () => "demo-upload-url" : mutate;
}

export function useCreateBill() {
  const mutate = useMutation(api.bills.createBill);
  return DEMO_MODE ? async () => ("demo-bill-id" as Id<"bills">) : mutate;
}

export function useUpdateBill() {
  const mutate = useMutation(api.bills.updateBill);
  return DEMO_MODE ? noop : mutate;
}

export function useDeleteBill() {
  const mutate = useMutation(api.bills.deleteBill);
  return DEMO_MODE ? noop : mutate;
}

export function useLinkBillToExpense() {
  const mutate = useMutation(api.bills.linkBillToExpense);
  return DEMO_MODE ? async () => ({ success: true }) : mutate;
}

export function useUnlinkBillFromExpense() {
  const mutate = useMutation(api.bills.unlinkBillFromExpense);
  return DEMO_MODE ? async () => ({ success: true }) : mutate;
}
