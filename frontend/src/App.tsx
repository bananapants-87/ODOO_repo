import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FleetProvider, useFleet } from "@/lib/fleet-store";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Trips from "./pages/Trips";
import Drivers from "./pages/Drivers";
import Maintenance from "./pages/Maintenance";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useFleet();
  if (!currentUser) return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  const { currentUser } = useFleet();
  return (
    <Routes>
      <Route path="/" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
      <Route path="/trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} />
      <Route path="/drivers" element={<ProtectedRoute><Drivers /></ProtectedRoute>} />
      <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <FleetProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </FleetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
