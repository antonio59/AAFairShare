import { Outlet, Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthContext";
import LoadingScreen from "./LoadingScreen";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { LogOut, Moon, Sun, Calendar, Receipt, Contrast } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNavigationBar from "./BottomNavigationBar";
import FloatingActionButton from "./FloatingActionButton";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTheme } from "@/providers/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AppLayout = () => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useKeyboardShortcuts();

  const cycleTheme = () => {
    const themes = ["light", "dark", "high-contrast"] as const;
    const currentIndex = themes.indexOf(theme as typeof themes[number]);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    if (theme === "dark") return <Sun className="h-5 w-5" />;
    if (theme === "high-contrast") return <Moon className="h-5 w-5" />;
    return <Moon className="h-5 w-5" />;
  };

  const showFAB = isMobile && location.pathname !== '/add-expense' && location.pathname !== '/analytics';

  if (isLoading) {
    return <LoadingScreen loadingText={undefined} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen">
      {isMobile ? (
        <div className="flex flex-col w-full">
          <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-40 flex items-center justify-between px-4">
            <Link to="/">
              <h1 className="text-lg font-bold text-primary hover:text-primary-dark transition-colors">AAFairShare</h1>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={cycleTheme} className="h-9 w-9" title={`Current: ${theme}`}>
                {getThemeIcon()}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.avatar || undefined} alt={user?.username || "User"} />
                      <AvatarFallback>{user?.username?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Quick Access</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate('/recurring')} className="cursor-pointer">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Recurring Expenses</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/receipts')} className="cursor-pointer">
                    <Receipt className="mr-2 h-4 w-4" />
                    <span>Receipts</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Theme</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light{theme === "light" ? " (active)" : ""}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark{theme === "dark" ? " (active)" : ""}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("high-contrast")} className="cursor-pointer">
                    <Contrast className="mr-2 h-4 w-4" />
                    <span>High Contrast{theme === "high-contrast" ? " (active)" : ""}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background pt-14 pb-16">
            <Outlet />
          </main>
          <FloatingActionButton show={showFAB} />
          <BottomNavigationBar />
        </div>
      ) : (
        <>
          <Sidebar user={user ? { id: user.id, username: user.username, email: user.email, avatar: user.avatar } : null} isMobile={false} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-14 bg-background border-b border-border z-30 flex items-center justify-end px-6 sticky top-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.avatar || undefined} alt={user?.username || "User"} />
                      <AvatarFallback>{user?.username?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Theme</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light{theme === "light" ? " (active)" : ""}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark{theme === "dark" ? " (active)" : ""}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("high-contrast")} className="cursor-pointer">
                    <Contrast className="mr-2 h-4 w-4" />
                    <span>High Contrast{theme === "high-contrast" ? " (active)" : ""}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>
            <main className="flex-1 overflow-auto bg-background p-6">
              <Outlet />
            </main>
          </div>
        </>
      )}
    </div>
  );
};

export default AppLayout;
