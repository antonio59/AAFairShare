import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface FrequencySelectorProps {
  selectedFrequency: string;
  onChange: (frequency: string) => void;
}

const frequencies = [
  { value: "monthly", label: "Monthly" },
];

const FrequencySelector = ({
  selectedFrequency,
  onChange,
}: FrequencySelectorProps) => {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Frequency</Label>
      <div className="grid grid-cols-1 gap-3 max-w-xs">
        {frequencies.map((freq) => (
          <button
            key={freq.value}
            type="button"
            className={cn(
              "p-3 border rounded-lg text-center transition-colors",
              selectedFrequency === freq.value
                ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
                : "border-border bg-background hover:bg-muted text-foreground",
            )}
            onClick={() => onChange(freq.value)}
          >
            <span className="font-medium text-sm">{freq.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FrequencySelector;
