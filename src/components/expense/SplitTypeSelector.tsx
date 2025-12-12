import { cn } from "@/lib/utils";
import { Split, User } from "lucide-react";

interface SplitTypeSelectorProps {
  selectedSplitType: string;
  onChange: (splitType: string) => void;
}

const SplitTypeSelector = ({ selectedSplitType, onChange }: SplitTypeSelectorProps) => {
  return (
    <div className="mb-4">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Split Type
      </label>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-md text-sm font-medium transition-colors",
            selectedSplitType === "50/50"
              ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          )}
          onClick={() => onChange("50/50")}
        >
          <Split className="h-4 w-4" />
          <span>50/50</span>
        </button>
        <button
          type="button"
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-md text-sm font-medium transition-colors",
            selectedSplitType === "custom"
              ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          )}
          onClick={() => onChange("custom")}
        >
          <User className="h-4 w-4" />
          <span>100%</span>
        </button>
      </div>
    </div>
  );
};

export default SplitTypeSelector;
