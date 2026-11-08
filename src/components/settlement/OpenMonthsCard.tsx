import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parse } from "date-fns";
import { formatCurrency } from "@/lib/money";

interface OpenMonth {
  month: string;
  amount: number;
  direction: "owes" | "owed" | "even";
  headline: string;
}

interface HeldCredit {
  creditId: string;
  description: string | null;
  holderName: string;
  otherName: string;
  remaining: number;
  othersShare: number;
  closed: boolean;
}

interface OpenBalances {
  headline: string;
  netAmount: number;
  netDirection: "owes" | "owed" | "even";
  months: OpenMonth[];
  heldCredits?: HeldCredit[];
}

const formatMonthLabel = (month: string) => {
  try {
    return format(parse(month, "yyyy-MM", new Date()), "MMMM yyyy");
  } catch {
    return month;
  }
};

const OpenMonthsCard = ({ balances }: { balances: OpenBalances | null | undefined }) => {
  if (!balances) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unsettled months</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {balances.months.length === 0 ? (
          <p className="text-sm text-muted-foreground">Every month with expenses is settled.</p>
        ) : (
          <>
            <p className="text-lg font-semibold">
              {balances.netDirection === "even" ? "All square" : balances.headline}
              {balances.months.length > 1 && (
                <span className="block text-sm font-normal text-muted-foreground">
                  Across {balances.months.length} open months
                </span>
              )}
            </p>
            <ul className="space-y-2">
              {balances.months.map((month) => (
                <li key={month.month} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{formatMonthLabel(month.month)}</span>
                  <span className="font-medium text-right">{month.headline}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {(balances.heldCredits?.length ?? 0) > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm font-semibold">Unused refund credit</p>
            <p className="text-xs text-muted-foreground">Not part of the amount above.</p>
            <ul className="mt-2 space-y-2">
              {balances.heldCredits!.map((credit) => (
                <li key={credit.creditId} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {credit.description?.trim() || "Refund credit"}
                    {credit.closed ? " (not in use)" : ""}
                  </span>
                  <span className="text-right font-medium">
                    {credit.holderName} holds {formatCurrency(credit.remaining)}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {formatCurrency(credit.othersShare)} of it is {credit.otherName}'s
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OpenMonthsCard;
