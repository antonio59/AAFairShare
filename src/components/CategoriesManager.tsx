import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getCategories, createCategory, deleteCategory, checkCategoryUsage } from "@/services/expenseService";
import { 
  Heart, 
  ShoppingBag, 
  Gift, 
  ShoppingCart, 
  Umbrella, 
  Train, 
  Utensils, 
  Ticket, 
  Zap,
  Plus, 
  Trash
} from "lucide-react";

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
  "Dining": <Utensils className="h-4 w-4" />,
  "Entertainment": <Ticket className="h-4 w-4" />,
  "Gifts": <Gift className="h-4 w-4" />,
  "Groceries": <ShoppingCart className="h-4 w-4" />,
  "Health": <Heart className="h-4 w-4" />,
  "Holidays": <Umbrella className="h-4 w-4" />,
  "Shopping": <ShoppingBag className="h-4 w-4" />,
  "Transport": <Train className="h-4 w-4" />,
  "Utilities": <Zap className="h-4 w-4" />,
  "Default": <ShoppingBag className="h-4 w-4" />
};

const CategoriesManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [isCheckingUsage, setIsCheckingUsage] = useState(false); 
  const [isCategoryInUse, setIsCategoryInUse] = useState(false); 

  // Fetch categories
  const { data: categories = [], isLoading, error } = useQuery<{ id: string; name: string; color?: string; icon?: string }[]>({ 
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => createCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewCategoryName("");
      toast({
        title: "Category created",
        description: "New category has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteCategoryId(null);
      toast({
        title: "Category deleted",
        description: "Category has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete category. It may be in use or another error occurred.",
        variant: "destructive",
      });
    }
  });

  // --- Duplicate Check --- 
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;

    // Check for duplicates (case-insensitive)
    const alreadyExists = categories.some(
      cat => cat.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (alreadyExists) {
      toast({
        title: "Duplicate Category",
        description: `A category named "${trimmedName}" already exists.`,
        variant: "default",
      });
      return; // Prevent mutation call
    }
    
    createCategoryMutation.mutate(trimmedName);
  };

  // Updated confirm delete function
  const confirmDeleteCategory = async (id: string, name: string) => {
    setIsCheckingUsage(true);
    try {
      const isInUse = await checkCategoryUsage(name); // Call service function with name
      setIsCategoryInUse(isInUse);
      setDeleteCategoryId(id); 
    } catch (err) {
       console.error("Error during usage check:", err);
       toast({ title: "Error", description: "Could not check if category is in use.", variant: "destructive" });
       setDeleteCategoryId(null); 
    } finally {
      setIsCheckingUsage(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryId || isCategoryInUse || isCheckingUsage) return; // Prevent delete
    
    deleteCategoryMutation.mutate(deleteCategoryId);
  };

  const getCategoryIcon = (categoryName: string) => {
    return categoryIcons[categoryName] || categoryIcons["Default"];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add new category form */}
        <form onSubmit={handleAddCategory} className="mb-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <ShoppingBag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                type="text"
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              type="submit" 
              disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </form>

        {/* Categories list */}
        <div className="space-y-1 mt-2">
          {isLoading ? (
            <div className="text-center py-4">Loading categories...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">Error loading categories</div>
          ) : categories && categories.length > 0 ? (
            categories.map((category) => (
              <div 
                key={category.id}
                className="flex items-center justify-between p-3 rounded hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="mr-3 text-gray-500">
                    {getCategoryIcon(category.name)}
                  </div>
                  <span>{category.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => confirmDeleteCategory(category.id, category.name)} // Pass name here
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">No categories found</div>
          )}
        </div>

        {/* Delete confirmation dialog */}
        <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {isCheckingUsage 
                  ? "Checking if category is in use..."
                  : isCategoryInUse
                  ? "This category cannot be deleted because it is currently assigned to one or more expenses."
                  : "This will permanently delete this category. This action cannot be undone."
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteCategory}
                disabled={isCategoryInUse || isCheckingUsage || deleteCategoryMutation.isPending} // Disable if used or checking
                className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteCategoryMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default CategoriesManager;
