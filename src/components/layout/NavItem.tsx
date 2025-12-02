
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, shortcut }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        )
      }
    >
      <div className="flex items-center gap-3 flex-1">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      {shortcut && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sidebar-accent text-sidebar-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity">
          {shortcut}
        </span>
      )}
    </NavLink>
  );
};

export default NavItem;
