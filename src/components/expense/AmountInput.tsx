
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
}

const AmountInput = ({ value, onChange }: AmountInputProps) => {
  return (
    <>
      <Label htmlFor="amount">Amount</Label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">£</span>
        </div>
        <Input
          type="number"
          id="amount"
          placeholder="0.00"
          className="pl-7 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onWheel={(e) => e.currentTarget.blur()}
        />
      </div>
    </>
  );
};

export default AmountInput;
