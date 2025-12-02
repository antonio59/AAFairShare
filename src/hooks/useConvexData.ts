import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Users hooks
export function useUsers() {
  return useQuery(api.users.getAll);
}

export function useCurrentUser() {
  return useQuery(api.users.getCurrentUser);
}

export function useStoreUser() {
  return useMutation(api.users.store);
}

// Categories hooks
export function useCategories() {
  return useQuery(api.categories.getAll);
}

export function useCreateCategory() {
  return useMutation(api.categories.create);
}

export function useDeleteCategory() {
  return useMutation(api.categories.remove);
}

export function useGetOrCreateCategory() {
  return useMutation(api.categories.getOrCreate);
}

export function useCategoryUsage(id: Id<"categories"> | undefined) {
  return useQuery(api.categories.checkUsage, id ? { id } : "skip");
}

// Locations hooks
export function useLocations() {
  return useQuery(api.locations.getAll);
}

export function useCreateLocation() {
  return useMutation(api.locations.create);
}

export function useDeleteLocation() {
  return useMutation(api.locations.remove);
}

export function useGetOrCreateLocation() {
  return useMutation(api.locations.getOrCreate);
}

export function useLocationUsage(id: Id<"locations"> | undefined) {
  return useQuery(api.locations.checkUsage, id ? { id } : "skip");
}

// Expenses hooks
export function useExpensesByMonth(month: string) {
  return useQuery(api.expenses.getByMonth, { month });
}

export function useCreateExpense() {
  return useMutation(api.expenses.create);
}

export function useAddExpenseWithLookup() {
  return useMutation(api.expenses.addWithLookup);
}

export function useUpdateExpense() {
  return useMutation(api.expenses.update);
}

export function useDeleteExpense() {
  return useMutation(api.expenses.remove);
}

// Month data hook
export function useMonthData(month: string) {
  return useQuery(api.monthData.getMonthData, { month });
}

// Recurring expenses hooks
export function useRecurringExpenses() {
  return useQuery(api.recurring.getAll);
}

export function useCreateRecurringExpense() {
  return useMutation(api.recurring.create);
}

export function useUpdateRecurringExpense() {
  return useMutation(api.recurring.update);
}

export function useDeleteRecurringExpense() {
  return useMutation(api.recurring.remove);
}

export function useGenerateExpenseFromRecurring() {
  return useMutation(api.recurring.generateExpense);
}

// Settlements hooks
export function useSettlementByMonth(month: string) {
  return useQuery(api.settlements.getByMonth, { month });
}

export function useSettlementExists(month: string) {
  return useQuery(api.settlements.checkExists, { month });
}

export function useMarkSettlementComplete() {
  return useMutation(api.settlements.markComplete);
}

export function useMarkSettlementUnsettled() {
  return useMutation(api.settlements.markUnsettled);
}

// Savings goals hooks
export function useSavingsGoals() {
  return useQuery(api.savingsGoals.getAll);
}

export function useCreateSavingsGoal() {
  return useMutation(api.savingsGoals.create);
}

export function useUpdateSavingsGoal() {
  return useMutation(api.savingsGoals.update);
}

export function useDeleteSavingsGoal() {
  return useMutation(api.savingsGoals.remove);
}

export function useMarkSavingsGoalComplete() {
  return useMutation(api.savingsGoals.markComplete);
}

export function useReopenSavingsGoal() {
  return useMutation(api.savingsGoals.reopen);
}

export function useAddSavingsContribution() {
  return useMutation(api.savingsGoals.addContribution);
}

export function useSavingsContributions(goalId: Id<"savingsGoals"> | undefined) {
  return useQuery(api.savingsGoals.getContributions, goalId ? { goalId } : "skip");
}
