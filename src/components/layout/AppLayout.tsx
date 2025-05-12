import { Outlet } from "react-router-dom";
import { useAppAuth } from "@/hooks/auth";
import LoadingScreen from "./LoadingScreen";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const AppLayout = () => {
  const { user, isLoading, loadingText, handleLogout } = useAppAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return <LoadingScreen loadingText={loadingText} />;
  }

  return (
    <div className="flex h-screen">
      {isMobile ? (
        <>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="fixed top-3 left-3 z-50">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-56">
              <Sidebar user={user} onLogout={handleLogout} isMobile={true} />
            </SheetContent>
          </Sheet>
          <div className="flex-1 overflow-auto bg-gray-50 pt-14">
            <Outlet />
          </div>
        </>
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
