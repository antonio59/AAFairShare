import { cn } from "@/lib/utils";

interface SplitTypeSelectorProps {
  selectedSplitType: string;
  onChange: (splitType: string) => void;
}

const SplitTypeSelector = ({ selectedSplitType, onChange }: SplitTypeSelectorProps) => {
  return (
    <div>
      <label className="text-sm font-medium leading-none">Split</label>
      <div className="mt-1.5 inline-flex rounded-md border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-100/50 dark:bg-gray-800/50">
        <button
          type="button"
          className={cn(
            "px-3 py-1 text-sm font-medium rounded transition-colors",
            selectedSplitType === "50/50"
              ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          )}
          onClick={() => onChange("50/50")}
        >
          50/50
        </button>
        <button
          type="button"
          className={cn(
            "px-3 py-1 text-sm font-medium rounded transition-colors",
            selectedSplitType === "custom"
              ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          )}
          onClick={() => onChange("custom")}
        >
          100%
        </button>
      </div>
    </div>
  );
};

export default SplitTypeSelector;
