import { cn } from "@/lib/utils";
import { useCurrentUser, useUsers } from "@/hooks/useConvexData";
import { splitTypeSelectorLabel } from "@/lib/splitType";

interface SplitTypeSelectorProps {
  selectedSplitType: string;
  onChange: (splitType: "50/50" | "custom") => void;
}

const SplitTypeSelector = ({ selectedSplitType, onChange }: SplitTypeSelectorProps) => {
  const users = useUsers();
  const currentUser = useCurrentUser();
  const otherUser = users?.find((u) => u._id !== currentUser?._id);
  const otherName =
    (otherUser && ("username" in otherUser ? otherUser.username : undefined)) ||
    (otherUser && ("name" in otherUser ? otherUser.name : undefined)) ||
    undefined;
  const owedLabel = splitTypeSelectorLabel(otherName ?? undefined);

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">Split Type</label>
      <div className="inline-flex rounded-lg border border-border p-1 bg-muted dark:bg-muted/50">
        <button
          type="button"
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
            selectedSplitType === "50/50"
              ? "bg-background dark:bg-muted text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onChange("50/50")}
        >
          50/50
        </button>
        <button
          type="button"
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
            selectedSplitType === "custom"
              ? "bg-background dark:bg-muted text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onChange("custom")}
          title="You paid 100% — the other person owes you the full amount"
        >
          {owedLabel}
        </button>
      </div>
    </div>
  );
};

export default SplitTypeSelector;
