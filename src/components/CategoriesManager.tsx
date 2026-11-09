import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useSetCategoryGroup,
} from "@/hooks/useConvexData";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { HOUSEHOLD_BILLS_GROUP } from "../../convex/utils/credit";
import { Id } from "../../convex/_generated/dataModel";
import {
  Heart,
  ShoppingBag,
  Gift,
  ShoppingCart,
  Umbrella,
  Train,
  Truck,
  Utensils,
  Ticket,
  Zap,
  Plus,
  Trash,
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  Dining: <Utensils className="h-4 w-4" />,
  Entertainment: <Ticket className="h-4 w-4" />,
  Gifts: <Gift className="h-4 w-4" />,
  Groceries: <ShoppingCart className="h-4 w-4" />,
  Health: <Heart className="h-4 w-4" />,
  Holidays: <Umbrella className="h-4 w-4" />,
  Moving: <Truck className="h-4 w-4" />,
  Shopping: <ShoppingBag className="h-4 w-4" />,
  Transport: <Train className="h-4 w-4" />,
  Utilities: <Zap className="h-4 w-4" />,
  Default: <ShoppingBag className="h-4 w-4" />,
};

const CategoriesManager = () => {
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deleteCategoryId, setDeleteCategoryId] =
    useState<Id<"categories"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const setCategoryGroup = useSetCategoryGroup();
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null);

  const isLoading = categories === undefined;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;

    const alreadyExists = categories?.some(
      (cat) => cat.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (alreadyExists) {
      toast({
        title: "Duplicate Category",
        description: `"${trimmedName}" already exists.`,
      });
      return;
    }

    try {
      await createCategory({ name: trimmedName });
      setNewCategoryName("");
      toast({
        title: "Category created",
        description: "New category has been added.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to create category.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryId) return;
    setIsDeleting(true);
    try {
      await deleteCategory({ id: deleteCategoryId });
      toast({
        title: "Category deleted",
        description: "Category has been removed.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete category.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteCategoryId(null);
    }
  };

  const toggleHouseholdBill = async (id: Id<"categories">, name: string, isBill: boolean) => {
    setSavingGroupId(id);
    try {
      await setCategoryGroup({ id, group: isBill ? undefined : HOUSEHOLD_BILLS_GROUP });
      toast({
        title: isBill ? "No longer a household bill" : "Marked as a household bill",
        description: isBill
          ? `New ${name} expenses will not use refund credit.`
          : `50/50 ${name} expenses can now use refund credit.`,
      });
    } catch (error) {
      toast({
        title: "Could not change category",
        description: errorMessage(error, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setSavingGroupId(null);
    }
  };

  const getCategoryIcon = (name: string) =>
    categoryIcons[name] || categoryIcons["Default"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Categories</CardTitle>
        <CardDescription>
          Mark the categories that are household bills, such as energy or water. Only 50/50
          expenses in those categories can use a shared refund credit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddCategory} className="mb-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <ShoppingBag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={!newCategoryName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </form>

        <div className="space-y-1 mt-2">
          {isLoading ? (
            <div className="text-center py-4">Loading categories...</div>
          ) : categories && categories.length > 0 ? (
            categories.map((category) => {
              const isBill = category.group === HOUSEHOLD_BILLS_GROUP;
              return (
                <div
                  key={category._id}
                  className="flex items-center justify-between gap-2 p-3 rounded hover:bg-muted"
                >
                  <div className="flex items-center min-w-0">
                    <div className="mr-3 text-muted-foreground">
                      {getCategoryIcon(category.name)}
                    </div>
                    <span className="truncate">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-pressed={isBill}
                      disabled={savingGroupId === category._id}
                      onClick={() => toggleHouseholdBill(category._id, category.name, isBill)}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-50",
                        isBill
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {isBill ? "Household bill" : "Not a bill"}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-500/10"
                      onClick={() => setDeleteCategoryId(category._id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No categories found
            </div>
          )}
        </div>

        <AlertDialog
          open={!!deleteCategoryId}
          onOpenChange={() => setDeleteCategoryId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this category.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCategory}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default CategoriesManager;
