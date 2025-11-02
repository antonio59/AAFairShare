import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  show?: boolean;
}

const FloatingActionButton = ({ show = true }: FloatingActionButtonProps) => {
  if (!show) return null;

  return (
    <Link to="/add-expense">
      <Button
        size="lg"
        className={cn(
          "fixed right-4 bottom-20 z-40 h-14 w-14 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "transition-all duration-200 hover:scale-110 active:scale-95",
          "md:hidden" // Only show on mobile
        )}
        aria-label="Add Expense"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </Link>
  );
};

export default FloatingActionButton;
