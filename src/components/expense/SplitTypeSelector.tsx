import { cn } from "@/lib/utils";

interface SplitTypeSelectorProps {
  selectedSplitType: string;
  onChange: (splitType: string) => void;
}

const SplitTypeSelector = ({ selectedSplitType, onChange }: SplitTypeSelectorProps) => {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">Split Type</label>
      <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800/50">
        <button
          type="button"
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
            selectedSplitType === "50/50"
              ? "bg-white dark:bg-gray-700 text-foreground shadow-sm"
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
              ? "bg-white dark:bg-gray-700 text-foreground shadow-sm"
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
