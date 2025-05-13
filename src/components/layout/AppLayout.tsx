import { Outlet, Link } from "react-router-dom";
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
  const { user, loading, logout } = useAppAuth();
  const isMobile = useIsMobile();

  if (loading) {
    return <LoadingScreen loadingText={undefined} />;
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
                <DropdownMenuItem onClick={() => {
                  console.log("[AppLayout] Mobile Logout DropdownMenuItem clicked. Type of logout:", typeof logout);
                  if (typeof logout === 'function') {
                    logout();
                  } else {
                    console.error("[AppLayout] Mobile logout is not a function!");
                  }
                }} className="cursor-pointer">
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
          <Sidebar user={user} isMobile={false} />
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
                  <DropdownMenuItem onClick={() => {
                    console.log("[AppLayout] Desktop Logout DropdownMenuItem clicked. Type of logout:", typeof logout);
                    if (typeof logout === 'function') {
                      logout();
                    } else {
                      console.error("[AppLayout] Desktop logout is not a function!");
                    }
                  }} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>
            <main className="flex-1 overflow-auto bg-gray-50 p-6">
              <Outlet />
            </main>
          </div>
        </>
      )}
    </div>
  );
};

export default AppLayout;
