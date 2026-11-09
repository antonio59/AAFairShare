import { useState } from "react";
import { format } from "date-fns";
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
import AmountInput from "@/components/expense/AmountInput";
import DateSelector from "@/components/expense/DateSelector";
import UserSelector from "@/components/recurring/UserSelector";
import { useCreateCredit, useUpdateCredit } from "@/hooks/useConvexData";
import { useToast } from "@/hooks/use-toast";
import { errorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/money";
import { Id } from "../../../convex/_generated/dataModel";

export interface EditableCredit {
  _id: string;
  amount: number;
  receivedOn: string;
  holderId: string;
  description: string | null;
}

interface CreditFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credit?: EditableCredit | null;
  defaultHolderId?: string;
}

const CreditFormDialog = ({ open, onOpenChange, credit, defaultHolderId }: CreditFormDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <CreditForm credit={credit} defaultHolderId={defaultHolderId} onDone={() => onOpenChange(false)} />
    </DialogContent>
  </Dialog>
);

const CreditForm = ({
  credit,
  defaultHolderId,
  onDone,
}: {
  credit?: EditableCredit | null;
  defaultHolderId?: string;
  onDone: () => void;
}) => {
  const { toast } = useToast();
  const createCredit = useCreateCredit();
  const updateCredit = useUpdateCredit();
  const [amount, setAmount] = useState(credit ? String(credit.amount) : "");
  const [receivedOn, setReceivedOn] = useState<Date>(
    credit ? new Date(`${credit.receivedOn}T12:00:00`) : new Date(),
  );
  const [holderId, setHolderId] = useState(credit?.holderId ?? defaultHolderId ?? "");
  const [description, setDescription] = useState(credit?.description ?? "");
  const [useOnExisting, setUseOnExisting] = useState(true);
  const [saving, setSaving] = useState(false);
  const editing = Boolean(credit);

  const parsedAmount = parseFloat(amount);
  const valid = Number.isFinite(parsedAmount) && parsedAmount > 0 && holderId !== "";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setSaving(true);
    const fields = {
      amount: parsedAmount,
      receivedOn: format(receivedOn, "yyyy-MM-dd"),
      holderId: holderId as Id<"users">,
      description: description.trim(),
    };
    try {
      if (credit) {
        await updateCredit({ id: credit._id as Id<"credits">, ...fields });
        toast({ title: "Refund credit updated" });
      } else {
        const result = await createCredit({ ...fields, applyToExistingBills: useOnExisting });
        const applied = result && typeof result === "object" ? result.applied : 0;
        toast({
          title: "Refund credit recorded",
          description:
            applied > 0
              ? `${formatCurrency(applied)} went on ${result.bills} household bill${result.bills === 1 ? "" : "s"} already added.`
              : "It will be used on the next household bill.",
        });
      }
      onDone();
    } catch (error) {
      toast({
        title: editing ? "Could not update credit" : "Could not record credit",
        description: errorMessage(error, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit refund credit" : "Record a refund"}</DialogTitle>
        <DialogDescription>
          Money one of you got back on a shared bill. Half of it belongs to each of you, and it
          is used up on household bills, oldest credit first.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <AmountInput value={amount} onChange={setAmount} />
        <DateSelector
          label="Refund received on"
          selectedDate={receivedOn}
          onChange={(date) => date && setReceivedOn(date)}
        />
        <UserSelector label="Who received it" selectedUserId={holderId} onChange={setHolderId} />
        <div>
          <Label htmlFor="credit-description" className="text-sm font-medium mb-2 block">
            What it was for
          </Label>
          <Input
            id="credit-description"
            placeholder="e.g. Octopus Energy refund"
            value={description}
            maxLength={200}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        {!editing && (
          <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary"
              checked={useOnExisting}
              onChange={(event) => setUseOnExisting(event.target.checked)}
            />
            <span>
              <span className="font-medium">Use it on bills already added</span>
              <span className="block text-muted-foreground">
                Covers household bills dated on or after the refund, in months that are not
                settled yet.
              </span>
            </span>
          </label>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!valid || saving}>
          {saving ? "Saving..." : editing ? "Save changes" : "Record refund"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default CreditFormDialog;
