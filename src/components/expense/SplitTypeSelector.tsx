import { cn } from "@/lib/utils";

interface SplitTypeSelectorProps {
  selectedSplitType: string;
  onChange: (splitType: string) => void;
}

const SplitTypeSelector = ({ selectedSplitType, onChange }: SplitTypeSelectorProps) => {
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
        >
          100% Mine
        </button>
      </div>
    </div>
  );
};

export default SplitTypeSelector;
