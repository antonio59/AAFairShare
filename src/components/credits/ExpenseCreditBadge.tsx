import { formatCurrency } from "@/lib/money";
import { Expense } from "@/types";
import { BadgePercent } from "lucide-react";

const ExpenseCreditBadge = ({ expense }: { expense: Expense }) => {
  if (!expense.creditApplied) return null;
  const labels = [...new Set((expense.creditUses ?? []).map((use) => use.label))].join(", ");
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
      title={`${formatCurrency(expense.creditApplied)} covered by refund credit${labels ? ` (${labels})` : ""}`}
    >
      <BadgePercent className="h-3 w-3" />
      Credit {formatCurrency(expense.creditApplied)}
    </span>
  );
};

export default ExpenseCreditBadge;
