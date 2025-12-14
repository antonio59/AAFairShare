import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthNavigatorProps {
  currentMonthLabel: string;
  onNavigateMonth: (direction: "prev" | "next") => void;
}

const MonthNavigator = ({
  currentMonthLabel,
  onNavigateMonth,
}: MonthNavigatorProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onNavigateMonth("prev")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium w-28 text-center">
        {currentMonthLabel}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onNavigateMonth("next")}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MonthNavigator;
