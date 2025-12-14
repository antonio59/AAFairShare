import { useCategories } from "@/hooks/useConvexData";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
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
} from "lucide-react";

const categoryIcons = [
  { name: "Dining", icon: <Utensils className="h-4 w-4" /> },
  { name: "Entertainment", icon: <Ticket className="h-4 w-4" /> },
  { name: "Gifts", icon: <Gift className="h-4 w-4" /> },
  { name: "Groceries", icon: <ShoppingCart className="h-4 w-4" /> },
  { name: "Health", icon: <Heart className="h-4 w-4" /> },
  { name: "Holidays", icon: <Umbrella className="h-4 w-4" /> },
  { name: "Moving", icon: <Truck className="h-4 w-4" /> },
  { name: "Shopping", icon: <ShoppingBag className="h-4 w-4" /> },
  { name: "Transport", icon: <Train className="h-4 w-4" /> },
  { name: "Utilities", icon: <Zap className="h-4 w-4" /> },
];

interface CategorySelectorProps {
  selectedCategory: string;
  onChange: (category: string) => void;
}

const CategorySelector = ({
  selectedCategory,
  onChange,
}: CategorySelectorProps) => {
  const dbCategories = useCategories();
  const isLoading = dbCategories === undefined;

  const allCategories = [...categoryIcons];
  if (dbCategories) {
    const missingDbCategories = dbCategories
      .filter((cat) => !categoryIcons.some((c) => c.name === cat.name))
      .map((cat) => ({
        name: cat.name,
        icon: <ShoppingBag className="h-4 w-4" />,
      }));

    allCategories.push(...missingDbCategories);
  }

  const sortedCategories = [...allCategories].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  if (isLoading) {
    return (
      <div>
        <label className="text-sm font-medium mb-2 block">Category</label>
        <div className="flex items-center justify-center py-6 border rounded-lg border-dashed">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">Category</label>
      <div className="flex flex-wrap gap-2">
        {sortedCategories.map((category) => (
          <button
            key={category.name}
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors",
              selectedCategory === category.name
                ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
                : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
            )}
            onClick={() => onChange(category.name)}
          >
            {category.icon}
            <span>{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;
