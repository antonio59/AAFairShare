
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface MonthNavigatorProps {
  year: number;
  month: number;
  onNavigate: (direction: "prev" | "next") => void;
  isMobile?: boolean;
}

const MonthNavigator = ({ year, month, onNavigate, isMobile }: MonthNavigatorProps) => {
  // Format the current month for display
  const currentMonthLabel = format(new Date(year, month - 1, 1), "MMMM yyyy");

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="touch-target"
        aria-label="Previous month"
        onClick={() => onNavigate("prev")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className={`text-sm font-medium ${isMobile ? "w-24" : "w-28"} text-center`}>
        {currentMonthLabel}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="touch-target"
        aria-label="Next month"
        onClick={() => onNavigate("next")}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MonthNavigator;
