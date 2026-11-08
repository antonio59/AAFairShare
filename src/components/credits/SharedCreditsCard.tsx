import { useState } from "react";
import { format, parse } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useApplyCreditToOpenBills,
  useCategories,
  useCloseCredit,
  useCredits,
  useCurrentUser,
  useReleaseCreditAllocation,
  useRemoveCredit,
  useReopenCredit,
} from "@/hooks/useConvexData";
import { useToast } from "@/hooks/use-toast";
import { errorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/money";
import { Id } from "../../../convex/_generated/dataModel";
import { HOUSEHOLD_BILLS_GROUP } from "../../../convex/utils/credit";
import CreditFormDialog, { type EditableCredit } from "./CreditFormDialog";
import CashOutDialog, { type CashOutCredit } from "./CashOutDialog";
import { ChevronDown, ChevronUp, Lock, MoreVertical, Plus, Undo2 } from "lucide-react";

type CreditRow = NonNullable<ReturnType<typeof useCredits>>[number];

const dayLabel = (date: string) => format(new Date(`${date}T12:00:00`), "d MMM yyyy");
const monthLabel = (month: string) => {
  try {
    return format(parse(month, "yyyy-MM", new Date()), "MMM yyyy");
  } catch {
    return month;
  }
};

const creditTitle = (credit: { description: string | null }) =>
  credit.description?.trim() || "Refund credit";

function statusOf(credit: CreditRow): { label: string; variant: "default" | "secondary" | "outline" } {
  if (credit.remaining <= 0) return { label: "Used up", variant: "secondary" };
  if (credit.closed) return { label: "Not in use", variant: "outline" };
  return { label: "In use", variant: "default" };
}

const SharedCreditsCard = () => {
  const { toast } = useToast();
  const credits = useCredits();
  const categories = useCategories();
  const currentUser = useCurrentUser();
  const closeCredit = useCloseCredit();
  const reopenCredit = useReopenCredit();
  const removeCredit = useRemoveCredit();
  const applyToOpenBills = useApplyCreditToOpenBills();
  const releaseAllocation = useReleaseCreditAllocation();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EditableCredit | null>(null);
  const [cashingOut, setCashingOut] = useState<CashOutCredit | null>(null);
  const [removing, setRemoving] = useState<CreditRow | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const hasBillCategories = (categories ?? []).some(
    (category) => (category as { group?: string }).group === HOUSEHOLD_BILLS_GROUP,
  );
  const newestFirst = [...(credits ?? [])].sort((a, b) =>
    a.receivedOn < b.receivedOn ? 1 : a.receivedOn > b.receivedOn ? -1 : 0,
  );

  const run = async (action: () => Promise<unknown>, success: string, failure: string) => {
    setBusy(true);
    try {
      await action();
      toast({ title: success });
    } catch (error) {
      toast({ title: failure, description: errorMessage(error, "Please try again."), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const spread = async (credit: CreditRow) => {
    setBusy(true);
    try {
      const result = await applyToOpenBills({ id: credit._id as Id<"credits"> });
      toast({
        title: result.applied > 0 ? "Credit used on open bills" : "Nothing to cover",
        description:
          result.applied > 0
            ? `${formatCurrency(result.applied)} went on ${result.bills} bill${result.bills === 1 ? "" : "s"}.`
            : "No unsettled household bill since the refund can take more of this credit.",
      });
    } catch (error) {
      toast({ title: "Could not use credit", description: errorMessage(error, "Please try again."), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Shared refund credits</CardTitle>
          <CardDescription>
            Refunds on shared bills. New household bills use them automatically, oldest credit
            first. What is left stays separate from what is owed.
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Record refund
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories !== undefined && !hasBillCategories && (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            No category is marked as a household bill yet, so credit cannot be used. Mark your bill
            categories in Settings, under Categories.
          </p>
        )}

        {credits === undefined ? (
          <p className="text-sm text-muted-foreground">Loading credits...</p>
        ) : newestFirst.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No refunds recorded. When one of you is refunded for a shared bill, record it here and
            the other person's half comes off future household bills.
          </p>
        ) : (
          <ul className="space-y-3">
            {newestFirst.map((credit) => {
              const status = statusOf(credit);
              const open = expanded.has(credit._id);
              const usedInSettled = credit.allocations.some((allocation) => allocation.settled);
              return (
                <li key={credit._id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{creditTitle(credit)}</span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {credit.holderName} received {formatCurrency(credit.amount)} on{" "}
                        {dayLabel(credit.receivedOn)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Actions for ${creditTitle(credit)}`} disabled={busy}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!credit.closed && credit.remaining > 0 && (
                          <DropdownMenuItem onClick={() => spread(credit)}>Use on open bills</DropdownMenuItem>
                        )}
                        {credit.remaining > 0 && (
                          <DropdownMenuItem
                            onClick={() =>
                              setCashingOut({
                                _id: credit._id,
                                label: creditTitle(credit),
                                receivedOn: credit.receivedOn,
                                remaining: credit.remaining,
                                othersShareRemaining: credit.othersShareRemaining,
                                holderName: credit.holderName,
                                otherName: credit.otherName,
                              })
                            }
                          >
                            Cash out what is left
                          </DropdownMenuItem>
                        )}
                        {credit.closed ? (
                          <DropdownMenuItem
                            onClick={() =>
                              run(() => reopenCredit({ id: credit._id as Id<"credits"> }), "Credit back in use", "Could not reopen credit")
                            }
                          >
                            Use again on new bills
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              run(() => closeCredit({ id: credit._id as Id<"credits"> }), "Credit no longer used", "Could not stop credit")
                            }
                          >
                            Stop using on new bills
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing({
                              _id: credit._id,
                              amount: credit.amount,
                              receivedOn: credit.receivedOn,
                              holderId: credit.holderId,
                              description: credit.description,
                            });
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500"
                          disabled={usedInSettled}
                          onClick={() => setRemoving(credit)}
                        >
                          {usedInSettled ? "Remove (used in a settled month)" : "Remove"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Used</dt>
                      <dd className="font-medium">{formatCurrency(credit.allocated)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Left</dt>
                      <dd className="font-medium">{formatCurrency(credit.remaining)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{credit.otherName}'s half of what is left</dt>
                      <dd className="font-medium">{formatCurrency(credit.othersShareRemaining)}</dd>
                    </div>
                  </dl>
                  {credit.closed && credit.remaining > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Not used on new bills. {credit.holderName} still holds {formatCurrency(credit.remaining)} until it is
                      cashed out or used again.
                    </p>
                  )}

                  {credit.allocations.length > 0 && (
                    <div className="mt-3">
                      <button
                        type="button"
                        className="flex items-center gap-1 text-sm font-medium text-primary"
                        aria-expanded={open}
                        onClick={() => toggle(credit._id)}
                      >
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        History ({credit.allocations.length})
                      </button>
                      {open && (
                        <ul className="mt-2 divide-y rounded-md border text-sm">
                          {credit.allocations.map((allocation) => (
                            <li key={allocation._id} className="flex items-center justify-between gap-3 px-3 py-2">
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {allocation.kind === "payout"
                                    ? `Cashed out in ${monthLabel(allocation.month)}`
                                    : `${allocation.expenseDescription || "Bill"} · ${monthLabel(allocation.month)}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(allocation.amount)} used, so {credit.holderName} owes {credit.otherName}{" "}
                                  {formatCurrency(allocation.adjustment)} more
                                  {allocation.automatic ? " · automatic" : ""}
                                </p>
                              </div>
                              {allocation.settled ? (
                                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground" title="Unsettle the month to change this">
                                  <Lock className="h-3 w-3" /> Settled
                                </span>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="shrink-0"
                                  disabled={busy}
                                  onClick={() =>
                                    run(
                                      () => releaseAllocation({ id: allocation._id as Id<"creditAllocations"> }),
                                      allocation.kind === "payout" ? "Cash-out undone" : "Credit taken off the bill",
                                      "Could not release credit",
                                    )
                                  }
                                >
                                  <Undo2 className="h-4 w-4 mr-1" />
                                  {allocation.kind === "payout" ? "Undo" : "Release"}
                                </Button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      {open && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Released credit goes back on the balance. It is not put back on that bill
                          automatically; use the bill's menu to add it again.
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <CreditFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        credit={editing}
        defaultHolderId={currentUser?._id}
      />
      <CashOutDialog credit={cashingOut} onOpenChange={(next) => !next && setCashingOut(null)} />
      <AlertDialog open={removing !== null} onOpenChange={(next) => !next && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing ? creditTitle(removing) : "credit"}?</AlertDialogTitle>
            <AlertDialogDescription>
              The credit and every use of it come off the bills, and open months go back to what
              they were without it. Use this for a refund recorded by mistake.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                const target = removing;
                setRemoving(null);
                if (target) {
                  run(() => removeCredit({ id: target._id as Id<"credits"> }), "Credit removed", "Could not remove credit");
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default SharedCreditsCard;
