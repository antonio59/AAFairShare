import { useState } from "react";
import { Plus, Coffee, ShoppingCart, Utensils, Car, Home, Zap, X, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthContext";
import { useAddExpenseWithLookup } from "@/hooks/useConvexData";
import { format } from "date-fns";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

const presets = [
  { icon: Coffee, label: "Coffee", category: "Food & Drink", location: "Cafe", color: "bg-amber-500" },
  { icon: ShoppingCart, label: "Groceries", category: "Groceries", location: "Supermarket", color: "bg-green-500" },
  { icon: Utensils, label: "Dining", category: "Food & Drink", location: "Restaurant", color: "bg-orange-500" },
  { icon: Car, label: "Transport", category: "Transport", location: "Travel", color: "bg-blue-500" },
  { icon: Home, label: "Bills", category: "Bills", location: "Home", color: "bg-purple-500" },
  { icon: Zap, label: "Other", category: "Other", location: "Other", color: "bg-gray-500" },
];

interface FloatingActionButtonProps {
  show?: boolean;
}

const FloatingActionButton = ({ show = true }: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAmountDialogOpen, setIsAmountDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<typeof presets[0] | null>(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const addExpense = useAddExpenseWithLookup();

  if (!show) return null;

  const handlePresetClick = (preset: typeof presets[0]) => {
    setSelectedPreset(preset);
    setAmount("");
    setIsOpen(false);
    setIsAmountDialogOpen(true);
  };

  const handleQuickAdd = async () => {
    if (!amount || !selectedPreset || !user?._id) {
      toast({ title: "Error", description: "Please enter an amount", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await addExpense({
        amount: parseFloat(amount),
        date: format(new Date(), "yyyy-MM-dd"),
        categoryName: selectedPreset.category,
        locationName: selectedPreset.location,
        paidById: user._id as Id<"users">,
        splitType: "50/50",
      });

      toast({ 
        title: "Expense added!", 
        description: `£${parseFloat(amount).toFixed(2)} for ${selectedPreset.label}` 
      });
      
      setIsAmountDialogOpen(false);
      setAmount("");
      setSelectedPreset(null);
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({ title: "Error", description: "Failed to add expense", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-50 md:hidden">
        <Button
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            isOpen && "rotate-45"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>

        {/* Quick Add Menu */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 bg-card border rounded-lg shadow-xl p-3 w-64 animate-in slide-in-from-bottom-2 duration-200">
            <p className="text-sm font-medium text-muted-foreground mb-3">Quick Add</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className={`p-2 rounded-full ${preset.color}`}>
                    <preset.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs">{preset.label}</span>
                </button>
              ))}
            </div>
            <Link to="/add-expense" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Full Form
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Amount Entry Dialog */}
      <Dialog open={isAmountDialogOpen} onOpenChange={setIsAmountDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPreset && (
                <>
                  <div className={`p-2 rounded-full ${selectedPreset.color}`}>
                    <selectedPreset.icon className="h-4 w-4 text-white" />
                  </div>
                  {selectedPreset.label}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="quick-amount">Amount (£)</Label>
            <Input
              id="quick-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-2xl h-14 mt-2"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2">
              {selectedPreset?.category} • {selectedPreset?.location} • Today
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAmountDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleQuickAdd} disabled={isLoading || !amount}>
              {isLoading ? "Adding..." : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Click away overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default FloatingActionButton;
