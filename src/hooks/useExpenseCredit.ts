import { useState } from "react";
import { useCoverExpenseWithCredit, useReleaseCreditAllocation } from "@/hooks/useConvexData";
import { useToast } from "@/hooks/use-toast";
import { errorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/money";
import { Expense } from "@/types";
import { Id } from "../../convex/_generated/dataModel";

/** Menu actions for refund credit on one bill. */
export function useExpenseCredit(expense: Expense) {
  const { toast } = useToast();
  const cover = useCoverExpenseWithCredit();
  const release = useReleaseCreditAllocation();
  const [busy, setBusy] = useState(false);

  const uses = expense.creditUses ?? [];
  const canUse = Boolean(expense.creditAvailable) && !expense.monthSettled;
  const canRelease = uses.length > 0 && !expense.monthSettled;

  const applyCredit = async () => {
    setBusy(true);
    try {
      const result = await cover({ expenseId: expense.id as Id<"expenses"> });
      toast({
        title: "Refund credit used",
        description: result?.applied ? `${formatCurrency(result.applied)} now covered by credit.` : undefined,
      });
    } catch (error) {
      toast({ title: "Could not use credit", description: errorMessage(error, "Please try again."), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const releaseCredit = async () => {
    setBusy(true);
    try {
      for (const use of uses) {
        await release({ id: use.allocationId as Id<"creditAllocations"> });
      }
      toast({
        title: "Credit taken off this bill",
        description: "It is back on the credit's balance and will not return to this bill on its own.",
      });
    } catch (error) {
      toast({ title: "Could not release credit", description: errorMessage(error, "Please try again."), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return { canUse, canRelease, busy, applyCredit, releaseCredit };
}
