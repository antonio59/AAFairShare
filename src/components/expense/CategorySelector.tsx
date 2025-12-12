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
  Utensils,
  Ticket,
  Zap
} from "lucide-react";

const categoryIcons = [
  { name: "Dining", icon: <Utensils className="h-4 w-4" /> },
  { name: "Entertainment", icon: <Ticket className="h-4 w-4" /> },
  { name: "Gifts", icon: <Gift className="h-4 w-4" /> },
  { name: "Groceries", icon: <ShoppingCart className="h-4 w-4" /> },
  { name: "Health", icon: <Heart className="h-4 w-4" /> },
  { name: "Holidays", icon: <Umbrella className="h-4 w-4" /> },
  { name: "Shopping", icon: <ShoppingBag className="h-4 w-4" /> },
  { name: "Transport", icon: <Train className="h-4 w-4" /> },
  { name: "Utilities", icon: <Zap className="h-4 w-4" /> },
];

interface CategorySelectorProps {
  selectedCategory: string;
  onChange: (category: string) => void;
}

const CategorySelector = ({ selectedCategory, onChange }: CategorySelectorProps) => {
  const dbCategories = useCategories();
  const isLoading = dbCategories === undefined;

  const allCategories = [...categoryIcons];
  if (dbCategories) {
    const missingDbCategories = dbCategories
      .filter(cat => !categoryIcons.some(c => c.name === cat.name))
      .map(cat => ({ name: cat.name, icon: <ShoppingBag className="h-4 w-4" /> }));

    allCategories.push(...missingDbCategories);
  }

  const sortedCategories = [...allCategories].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  if (isLoading) {
    return (
      <div className="mb-6">
        <label className="text-sm font-medium">Category</label>
        <div className="mt-2 flex items-center justify-center p-8 border rounded-md border-dashed">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-400">Loading categories...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium leading-none">Category</label>
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        {sortedCategories.map((category) => (
          <button
            key={category.name}
            type="button"
            className={cn(
              "px-2 py-2 border rounded-md flex flex-col items-center justify-center gap-1 transition-colors text-center min-h-[52px]",
              selectedCategory === category.name
                ? "border-primary bg-primary/10 text-primary dark:bg-primary/20"
                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
            onClick={() => onChange(category.name)}
          >
            {category.icon}
            <span className="text-[10px] leading-tight whitespace-normal break-words">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;
