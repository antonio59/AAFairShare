import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { AuthProvider } from "@/providers/NewAuthProvider";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Settlement from "./pages/Settlement";
import Analytics from "./pages/Analytics";
import Recurring from "./pages/Recurring";
import Settings from "./pages/Settings";
import AddExpense from "./pages/AddExpense";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import SavingsGoals from "./pages/SavingsGoals";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function AppContent() {
  const [isOnlineStatus, setIsOnlineStatus] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnlineStatus(true);
    const handleOffline = () => setIsOnlineStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      <Toaster />
      <Sonner />
      <PWAInstallPrompt />
      {!isOnlineStatus && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white p-2 text-center">
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              You are currently offline. Some features may not work properly.
            </AlertDescription>
          </Alert>
        </div>
      )}
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settlement" element={<Settlement />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/recurring" element={<Recurring />} />
            <Route path="/savings" element={<SavingsGoals />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/add-expense" element={<AddExpense />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ConvexAuthProvider client={convex}>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ConvexAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
