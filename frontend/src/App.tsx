import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import RoleSelect from "./pages/RoleSelect";
import Dashboard from "./pages/Dashboard";
import ProfileCompletion from "./pages/ProfileCompletion";
import ClientProfileCompletion from "./pages/ClientProfileCompletion";
import FreelancerProfileView from "./pages/FreelancerProfileView";
import ReadOnlyProfilePage from "./pages/ReadOnlyProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/role-select" element={<RoleSelect />} />
              <Route path="/profile" element={<FreelancerProfileView />} />
              <Route path="/profile/:userId" element={<ReadOnlyProfilePage />} />
              <Route path="/profile-completion" element={<ProfileCompletion />} />
              <Route path="/client-profile-completion" element={<ClientProfileCompletion />} />
              <Route path="/dashboard/*" element={<Dashboard />} />
              <Route path="/client-dashboard/*" element={<Dashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
