import { Label } from "@/components/ui/label";

interface FrequencySelectorProps {
  selectedFrequency: string;
  onChange?: (frequency: string) => void;
}

const FrequencySelector = ({
  selectedFrequency,
}: FrequencySelectorProps) => {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Frequency</Label>
      <p className="text-sm text-muted-foreground capitalize">
        {selectedFrequency || "Monthly"}
      </p>
      <input type="hidden" name="frequency" value={selectedFrequency || "monthly"} />
    </div>
  );
};

export default FrequencySelector;
