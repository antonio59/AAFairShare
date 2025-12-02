import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthContext";
import LoadingScreen from "./LoadingScreen";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { LogOut, Moon, Sun } from "lucide-react";
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
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AppLayout = () => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  useKeyboardShortcuts();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
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
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                  {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                  <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                    {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
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
