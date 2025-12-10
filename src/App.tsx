import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { AuthProvider } from "@/providers/NewAuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import AppLayout from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, Loader2 } from "lucide-react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settlement = lazy(() => import("./pages/Settlement"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Recurring = lazy(() => import("./pages/Recurring"));
const Settings = lazy(() => import("./pages/Settings"));
const AddExpense = lazy(() => import("./pages/AddExpense"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SavingsGoals = lazy(() => import("./pages/SavingsGoals"));
const Receipts = lazy(() => import("./pages/Receipts"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const convexEnvUrl = import.meta.env.VITE_CONVEX_URL || "http://localhost:8187";

const convex = new ConvexReactClient(convexEnvUrl);

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
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        }>
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
              <Route path="/receipts" element={<Receipts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/add-expense" element={<AddExpense />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="aafairshare-theme">
        <TooltipProvider>
          <ConvexAuthProvider client={convex}>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </ConvexAuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
