import { useQuery, useMutation } from "convex/react";
import { useMemo } from "react";
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
  demoDocuments,
} from "@/lib/demoData";

const noop = async () => {};

export function useChangePassword() {
  const mutate = useMutation(api.password.changePassword);
  return DEMO_MODE ? async () => ({ success: true }) : mutate;
}

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

export function useSavingsGoalById(goalId: Id<"savingsGoals"> | undefined) {
  const data = useQuery(
    api.savingsGoals.getById,
    goalId ? { id: goalId } : "skip",
  );
  return DEMO_MODE
    ? demoSavingsGoals.find((g) => g._id === goalId) || null
    : data;
}

export function useSavingsGoalImageUrl(storageId: Id<"_storage"> | undefined) {
  const data = useQuery(
    api.savingsGoals.getGoalImageUrl,
    storageId ? { storageId } : "skip",
  );
  return DEMO_MODE && storageId
    ? "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80"
    : data;
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

export function useLinkExpenseToGoal() {
  const mutate = useMutation(api.expenses.linkToGoal);
  return DEMO_MODE ? async () => ({ success: true }) : mutate;
}

export function useUnlinkExpenseFromGoal() {
  const mutate = useMutation(api.expenses.unlinkFromGoal);
  return DEMO_MODE ? async () => ({ success: true }) : mutate;
}

// Document/attachment hooks
export function useGenerateUploadUrl() {
  const mutate = useMutation(api.documents.generateUploadUrl);
  return DEMO_MODE ? async () => "demo-upload-url" : mutate;
}

export function useGetDocumentUrl(storageId: Id<"_storage"> | undefined) {
  const data = useQuery(
    api.documents.getDocumentUrl,
    storageId ? { storageId } : "skip",
  );
  return DEMO_MODE
    ? "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=800&q=80"
    : data;
}

export function useAllDocuments() {
  const data = useQuery(api.documents.getAll);
  return DEMO_MODE ? demoDocuments : data;
}

export function useDocumentsByType(type: string) {
  const data = useQuery(api.documents.getByType, { type });
  return DEMO_MODE
    ? demoDocuments.filter((d) => d.type === type)
    : data;
}

export function useDocumentsByAddress(addressId: Id<"addresses"> | undefined) {
  const data = useQuery(
    api.documents.getByAddress,
    addressId ? { addressId } : "skip",
  );
  return DEMO_MODE
    ? demoDocuments.filter((d) => d.addressId === addressId)
    : data;
}

export function useCreateDocument() {
  const mutate = useMutation(api.documents.create);
  return DEMO_MODE ? async () => "demo-doc-id" as Id<"documents"> : mutate;
}

export function useUpdateDocument() {
  const mutate = useMutation(api.documents.update);
  return DEMO_MODE ? noop : mutate;
}

export function useDeleteDocument() {
  const mutate = useMutation(api.documents.remove);
  return DEMO_MODE ? noop : mutate;
}

export function useLinkDocumentToExpense() {
  const mutate = useMutation(api.documents.linkToExpense);
  return DEMO_MODE ? async () => ({ success: true }) : mutate;
}

export function useUnlinkDocumentFromExpense() {
  const mutate = useMutation(api.documents.unlinkFromExpense);
  return DEMO_MODE ? async () => ({ success: true }) : mutate;
}

export function useBulkDeleteDocuments() {
  const mutate = useMutation(api.documents.bulkDelete);
  return DEMO_MODE ? async () => ({ deleted: 0 }) : mutate;
}

export function useReplaceDocumentFile() {
  const mutate = useMutation(api.documents.replaceFile);
  return DEMO_MODE ? async () => ({ success: true }) : mutate;
}

export function useLinkDocumentToRecurring() {
  const mutate = useMutation(api.recurring.linkDocument);
  return DEMO_MODE ? async () => ({ success: true }) : mutate;
}

export function useUnlinkDocumentFromRecurring() {
  const mutate = useMutation(api.recurring.unlinkDocument);
  return DEMO_MODE ? async () => ({ success: true }) : mutate;
}

export function useDocumentsByExpense(expenseId: Id<"expenses"> | undefined) {
  const data = useQuery(
    api.documents.getDocumentsByExpense,
    expenseId ? { expenseId } : "skip",
  );
  if (DEMO_MODE) {
    const expense = demoExpenses.find((e) => e.id === expenseId);
    if (!expense?.linkedDocumentIds) return [];
    return demoDocuments.filter((d) =>
      expense.linkedDocumentIds?.includes(d._id),
    );
  }
  return data;
}

export function useDocumentById(documentId: Id<"documents"> | undefined) {
  const data = useQuery(
    api.documents.getById,
    documentId ? { id: documentId } : "skip",
  );
  return DEMO_MODE
    ? demoDocuments.find((d) => d._id === documentId) || null
    : data;
}

export function useExpiringDocuments(days?: number) {
  const data = useQuery(api.documents.getExpiringSoon, { days: days || 30 });
  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (days || 30));
    return d;
  }, [days]);
  return DEMO_MODE
    ? demoDocuments.filter(
        (d) =>
          d.expiryDate &&
          new Date(d.expiryDate) <= cutoff &&
          new Date(d.expiryDate) >= new Date(),
      )
    : data;
}

export function useSearchDocuments(queryStr: string) {
  const data = useQuery(api.documents.search, { query: queryStr });
  return DEMO_MODE
    ? demoDocuments.filter(
        (d) =>
          d.title?.toLowerCase().includes(queryStr.toLowerCase()) ||
          d.notes?.toLowerCase().includes(queryStr.toLowerCase()) ||
          d.type.toLowerCase().includes(queryStr.toLowerCase()),
      )
    : data;
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

// ============ ADDRESSES HOOKS ============

export function useAllAddresses() {
  const data = useQuery(api.addresses.getAll);
  return DEMO_MODE ? [] : data;
}

export function useActiveAddresses() {
  const data = useQuery(api.addresses.getActive);
  return DEMO_MODE ? [] : data;
}

export function useArchivedAddresses() {
  const data = useQuery(api.addresses.getArchived);
  return DEMO_MODE ? [] : data;
}

export function useCreateAddress() {
  const mutate = useMutation(api.addresses.create);
  return DEMO_MODE ? async () => "demo-address-id" as Id<"addresses"> : mutate;
}

export function useUpdateAddress() {
  const mutate = useMutation(api.addresses.update);
  return DEMO_MODE ? noop : mutate;
}

export function useArchiveAddress() {
  const mutate = useMutation(api.addresses.archive);
  return DEMO_MODE ? noop : mutate;
}

export function useUnarchiveAddress() {
  const mutate = useMutation(api.addresses.unarchive);
  return DEMO_MODE ? noop : mutate;
}

export function useDeleteAddress() {
  const mutate = useMutation(api.addresses.remove);
  return DEMO_MODE ? noop : mutate;
}
