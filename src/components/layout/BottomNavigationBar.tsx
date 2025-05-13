import { Link, useLocation } from "react-router-dom";
import { Home, Users, Repeat, BarChart2, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/settlement", label: "Settlement", icon: Users },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

const BottomNavigationBar = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-md md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href === "/" && location.pathname.startsWith("/add-expense")); // Dashboard active also for add-expense as it's a primary action related to dashboard
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 text-xs text-muted-foreground hover:text-primary flex-1 h-full",
                isActive && "text-primary"
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-0.5", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigationBar;
