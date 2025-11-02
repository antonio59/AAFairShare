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
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg md:hidden z-50">
      <div className="flex justify-around items-center h-16 safe-area-inset-bottom">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href === "/" && location.pathname.startsWith("/add-expense"));
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 text-[10px] flex-1 h-full transition-colors",
                "active:bg-accent",
                isActive 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <item.icon className={cn(
                "h-6 w-6 mb-1 transition-transform",
                isActive && "scale-110"
              )} />
              <span className={cn(isActive && "font-semibold")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigationBar;
