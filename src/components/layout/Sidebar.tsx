import { BarChart3, Calendar, Home, PiggyBank, Settings as SettingsIcon, Plus, Keyboard, Target } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { User } from "@/types";
import NavItem from "./NavItem";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  user: User | null;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ user, isMobile }) => {
  const navigate = useNavigate();
  
  const showShortcutsHelp = () => {
    const shortcuts = [
      { keys: 'Cmd/Ctrl + N', action: 'New Expense' },
      { keys: 'Cmd/Ctrl + H', action: 'Home/Dashboard' },
      { keys: 'Cmd/Ctrl + S', action: 'Settlement' },
      { keys: 'Cmd/Ctrl + A', action: 'Analytics' },
      { keys: 'Cmd/Ctrl + R', action: 'Recurring' },
      { keys: 'Cmd/Ctrl + G', action: 'Savings Goals' },
      { keys: 'Cmd/Ctrl + ,', action: 'Settings' },
    ];

    const message = shortcuts
      .map((s) => `${s.keys}: ${s.action}`)
      .join('\n');

    alert(`Keyboard Shortcuts:\n\n${message}`);
  };

  return (
    <div className={`bg-gradient-to-b from-gray-50 to-white app-sidebar flex flex-col justify-between border-r ${isMobile ? "w-full h-full" : "w-64"}`}>
      <div className="flex flex-col h-full">
        <div className="p-6 border-b bg-white">
          <Link to="/" className="block">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent hover:from-blue-600 hover:to-primary transition-all">
              AAFairShare
            </h1>
            <p className="text-xs text-gray-500 mt-1">Household Expenses</p>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <nav className="p-3 space-y-1">
            <NavItem to="/" icon={<Home className="w-5 h-5" />} label="Dashboard" shortcut="⌘H" />
            <NavItem to="/settlement" icon={<PiggyBank className="w-5 h-5" />} label="Settlement" shortcut="⌘S" />
            <NavItem to="/analytics" icon={<BarChart3 className="w-5 h-5" />} label="Analytics" shortcut="⌘A" />
            <NavItem to="/recurring" icon={<Calendar className="w-5 h-5" />} label="Recurring" shortcut="⌘R" />
            <NavItem to="/savings" icon={<Target className="w-5 h-5" />} label="Savings Goals" shortcut="⌘G" />
            <NavItem to="/settings" icon={<SettingsIcon className="w-5 h-5" />} label="Settings" shortcut="⌘," />
          </nav>
          
          <div className="p-3 mt-2 border-t">
            <Button 
              onClick={() => navigate('/add-expense')} 
              className="w-full gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              New Expense
            </Button>
          </div>
        </div>
        
        <div className="p-3 border-t bg-gray-50/50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={showShortcutsHelp}
                  className="w-full justify-start gap-2 text-xs text-gray-600 hover:text-gray-900"
                >
                  <Keyboard className="w-4 h-4" />
                  Keyboard Shortcuts
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Press ? to see all shortcuts</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;