import { Outlet } from "react-router-dom";
import { useAppAuth } from "@/hooks/auth";
import LoadingScreen from "./LoadingScreen";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNavigationBar from "./BottomNavigationBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AppLayout = () => {
  const { user, isLoading, loadingText, handleLogout } = useAppAuth();
  const isMobile = useIsMobile();

  if (isLoading) {
    return <LoadingScreen loadingText={loadingText} />;
  }

  return (
    <div className="flex h-screen">
      {isMobile ? (
        <div className="flex flex-col w-full">
          <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-40 flex items-center justify-end px-4">
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
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 overflow-auto bg-gray-50 pt-14 pb-16">
            <Outlet />
          </main>
          <BottomNavigationBar />
        </div>
      ) : (
        <>
          <Sidebar user={user} onLogout={handleLogout} isMobile={false} />
          <div className="flex-1 overflow-auto bg-gray-50">
            <Outlet />
          </div>
        </>
      )}
    </div>
  );
};

export default AppLayout;
