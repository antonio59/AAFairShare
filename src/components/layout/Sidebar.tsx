import { BarChart3, Calendar, Home, PiggyBank, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { User } from "@/types"; // Assuming User type might still be needed for props
import NavItem from "./NavItem";
// UserProfile import is removed

interface SidebarProps {
  user: User | null; // Keep if NavItems or other parts of Sidebar need it
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ user, isMobile }) => { // Pass user if still needed
  return (
    <div className={`bg-white app-sidebar flex flex-col justify-between ${isMobile ? "w-full h-full" : "w-56"}`}>
      <div>
        <div className="p-4 border-b">
          <Link to="/">
            <h1 className="text-lg font-bold text-primary hover:text-primary-dark transition-colors">AAFairShare</h1>
          </Link>
        </div>
        <nav className="p-2">
          <NavItem to="/" icon={<Home className="w-5 h-5" />} label="Dashboard" />
          <NavItem to="/settlement" icon={<PiggyBank className="w-5 h-5" />} label="Settlement" />
          <NavItem to="/analytics" icon={<BarChart3 className="w-5 h-5" />} label="Analytics" />
          <NavItem to="/recurring" icon={<Calendar className="w-5 h-5" />} label="Recurring" />
          <NavItem to="/settings" icon={<SettingsIcon className="w-5 h-5" />} label="Settings" />
        </nav>
      </div>
      
      {/* UserProfile component and its container are fully removed */}
    </div>
  );
};

export default Sidebar;