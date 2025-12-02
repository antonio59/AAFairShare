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
  { name: "Dining", icon: <Utensils className="h-6 w-6" /> },
  { name: "Entertainment", icon: <Ticket className="h-6 w-6" /> },
  { name: "Gifts", icon: <Gift className="h-6 w-6" /> },
  { name: "Groceries", icon: <ShoppingCart className="h-6 w-6" /> },
  { name: "Health", icon: <Heart className="h-6 w-6" /> },
  { name: "Holidays", icon: <Umbrella className="h-6 w-6" /> },
  { name: "Shopping", icon: <ShoppingBag className="h-6 w-6" /> },
  { name: "Transport", icon: <Train className="h-6 w-6" /> },
  { name: "Utilities", icon: <Zap className="h-6 w-6" /> },
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
      .map(cat => ({ name: cat.name, icon: <ShoppingBag className="h-6 w-6" /> }));

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
    <div className="mb-6">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Category</label>
      <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {sortedCategories.map((category) => (
          <button
            key={category.name}
            type="button"
            className={cn(
              "p-4 border rounded-md flex flex-col items-center justify-center gap-2 transition-colors",
              selectedCategory === category.name
                ? "border-primary bg-primary/10"
                : "border-gray-200 hover:border-gray-300"
            )}
            onClick={() => onChange(category.name)}
          >
            {category.icon}
            <span className="text-xs whitespace-normal break-words">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;
