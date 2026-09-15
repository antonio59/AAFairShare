import {
  Outlet,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "@/providers/AuthContext";
import LoadingScreen from "./LoadingScreen";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { LogOut, Moon, Sun, Calendar, FileText, Contrast } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNavigationBar from "./BottomNavigationBar";

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
import type { AppUser } from "@/providers/AuthContext";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "high-contrast", label: "High Contrast", icon: Contrast },
] as const;

const UserMenu = ({
  user,
  showQuickAccess,
}: {
  user: AppUser | null;
  showQuickAccess?: boolean;
}) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user?.avatar || undefined}
              alt={user?.username || "User"}
            />
            <AvatarFallback>
              {user?.username?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {showQuickAccess && (
          <>
            <DropdownMenuLabel>Quick Access</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigate("/recurring")}
              className="cursor-pointer"
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span>Recurring Expenses</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/documents")}
              className="cursor-pointer"
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Documents</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="cursor-pointer"
          >
            <Icon className="mr-2 h-4 w-4" />
            <span>
              {label}
              {theme === value ? " (active)" : ""}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const AppLayout = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();

  useKeyboardShortcuts();

  const cycleTheme = () => {
    const currentIndex = THEME_OPTIONS.findIndex((t) => t.value === theme);
    setTheme(THEME_OPTIONS[(currentIndex + 1) % THEME_OPTIONS.length].value);
  };

  // FAB removed - Add buttons are now contextual per page

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
            <Link to="/dashboard">
              <h1 className="text-lg font-bold text-primary hover:text-primary-dark transition-colors">
                AAFairShare
              </h1>
            </Link>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={cycleTheme}
                className="touch-target h-9 w-9"
                aria-label={`Switch theme (current: ${theme})`}
                title={`Current: ${theme}`}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              <UserMenu user={user} showQuickAccess />
            </div>
          </header>
          {/* pb-36 clears the floating action button + bottom nav on mobile */}
          <main className="flex-1 overflow-auto bg-background pt-14 pb-36">
            <Outlet />
          </main>

          <BottomNavigationBar />
        </div>
      ) : (
        <>
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-14 bg-background border-b border-border z-30 flex items-center justify-end px-6 sticky top-0">
              <UserMenu user={user} />
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
