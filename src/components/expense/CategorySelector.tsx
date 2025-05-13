import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/services/expenseService";
import { cn } from "@/lib/utils";
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
  // Fetch categories from the database
  const { data: dbCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Combine hardcoded categories with those from the database
  const allCategories = [...categoryIcons];
  if (dbCategories) {
    const dbCategoryNames = new Set(dbCategories.map(cat => cat.name));
    const missingDbCategories = dbCategories
      .filter(cat => !categoryIcons.some(c => c.name === cat.name))
      .map(cat => ({ name: cat.name, icon: <ShoppingBag className="h-6 w-6" /> }));
    
    allCategories.push(...missingDbCategories);
  }
  
  // Sort categories alphabetically by name
  const sortedCategories = [...allCategories].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="mb-6">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Category</label>
      {/* Changed grid columns to be responsive */}
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
            {/* Added whitespace-normal and break-words for text wrapping */}
            <span className="text-xs whitespace-normal break-words">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;
