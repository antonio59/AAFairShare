import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  BarChart2,
  Settings as SettingsIcon,
  Target,
  Calendar,
  FileText,
  Menu,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const leftItems = [{ href: "/dashboard", label: "Home", icon: Home }];

const rightItems = [
  { href: "/settlement", label: "Settlement", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
];

const moreItems = [
  { href: "/savings", label: "Savings", icon: Target, description: "Goals and contributions" },
  { href: "/recurring", label: "Recurring", icon: Calendar, description: "Bills and subscriptions" },
  { href: "/documents", label: "Documents", icon: FileText, description: "Receipts, bills and warranties" },
  { href: "/settings", label: "Settings", icon: SettingsIcon, description: "Profile, theme, bank sync" },
];

const BottomNavigationBar = () => {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = moreItems.some((item) => location.pathname === item.href);

  const renderNavItem = (item: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    const isActive = location.pathname === item.href;
    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          "flex flex-col items-center justify-center py-2 px-3 text-[10px] flex-1 h-full transition-colors",
          "active:bg-accent",
          isActive
            ? "text-primary font-medium"
            : "text-muted-foreground hover:text-primary",
        )}
      >
        <item.icon
          className={cn(
            "h-6 w-6 mb-1 transition-transform",
            isActive && "scale-110",
          )}
        />
        <span className={cn(isActive && "font-semibold")}>{item.label}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg md:hidden z-50">
      <div className="flex justify-around items-center h-16 safe-area-inset-bottom">
        {leftItems.map(renderNavItem)}

        {/* Centre Add Expense button */}
        <div className="flex-1 flex items-center justify-center">
          <Link
            to="/add-expense"
            aria-label="Add expense"
            className={cn(
              "flex items-center justify-center h-12 w-12 -mt-6 rounded-full",
              "bg-primary text-primary-foreground shadow-lg",
              "ring-4 ring-background transition-transform active:scale-95",
              location.pathname.startsWith("/add-expense") && "scale-105",
            )}
          >
            <Plus className="h-6 w-6" />
          </Link>
        </div>

        {rightItems.map(renderNavItem)}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 text-[10px] flex-1 h-full transition-colors",
                "active:bg-accent",
                isMoreActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-primary",
              )}
              aria-label="More pages"
            >
              <Menu
                className={cn(
                  "h-6 w-6 mb-1 transition-transform",
                  isMoreActive && "scale-110",
                )}
              />
              <span className={cn(isMoreActive && "font-semibold")}>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
            <div className="grid gap-1 py-4">
              {moreItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-4 rounded-lg px-4 py-3 transition-colors",
                      isActive
                        ? "bg-accent text-primary font-medium"
                        : "hover:bg-accent text-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default BottomNavigationBar;
