import { useState } from "react";
import { format, parse } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCashOutCredit } from "@/hooks/useConvexData";
import { useToast } from "@/hooks/use-toast";
import { errorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/money";
import { Id } from "../../../convex/_generated/dataModel";

export interface CashOutCredit {
  _id: string;
  label: string;
  receivedOn: string;
  remaining: number;
  othersShareRemaining: number;
  holderName: string;
  otherName: string;
}

const monthLabel = (month: string) => {
  try {
    return format(parse(month, "yyyy-MM", new Date()), "MMMM yyyy");
  } catch {
    return month;
  }
};

const CashOutDialog = ({
  credit,
  onOpenChange,
}: {
  credit: CashOutCredit | null;
  onOpenChange: (open: boolean) => void;
}) => (
  <Dialog open={credit !== null} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      {credit && <CashOutForm credit={credit} onDone={() => onOpenChange(false)} />}
    </DialogContent>
  </Dialog>
);

const CashOutForm = ({ credit, onDone }: { credit: CashOutCredit; onDone: () => void }) => {
  const { toast } = useToast();
  const cashOut = useCashOutCredit();
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [saving, setSaving] = useState(false);

  const earliest = credit.receivedOn.slice(0, 7);
  const valid = /^\d{4}-\d{2}$/.test(month) && month >= earliest;

  const handleConfirm = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await cashOut({ id: credit._id as Id<"credits">, month });
      toast({
        title: "Credit cashed out",
        description: `${credit.holderName} owes ${credit.otherName} ${formatCurrency(credit.othersShareRemaining)} more in ${monthLabel(month)}.`,
      });
      onDone();
    } catch (error) {
      toast({
        title: "Could not cash out",
        description: errorMessage(error, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cash out {credit.label}</DialogTitle>
        <DialogDescription>Settle what is left in money instead of using it on bills.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <p className="text-sm">
          {formatCurrency(credit.remaining)} is left. {credit.holderName} pays {credit.otherName}{" "}
          their half, <span className="font-semibold">{formatCurrency(credit.othersShareRemaining)}</span>,
          as part of the chosen month's settlement.
        </p>
        <div>
          <Label htmlFor="cash-out-month" className="text-sm font-medium mb-2 block">
            Settle it in
          </Label>
          <Input
            id="cash-out-month"
            type="month"
            value={month}
            min={earliest}
            onChange={(event) => setMonth(event.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            The month must not be settled yet. A settled month has to be unsettled first.
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={!valid || saving}>
          {saving ? "Cashing out..." : "Cash out"}
        </Button>
      </DialogFooter>
    </>
  );
};

export default CashOutDialog;
