import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Homepage } from "./pages/Homepage";
import Dashboard from "./pages/Dashboard";
import Predictor from "./pages/Predictor";
import PickTeam from "@/pages/PickTeam";
import MyTeam from "@/pages/MyTeam";
import Fixtures from "./pages/Fixtures";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "@/components/system/ErrorBoundary";
import { AutoFPLReconnection } from "@/components/system/AutoFPLReconnection";
import { Login } from "./pages/Login";
import { Profile } from "./pages/Profile";
import { HelpCenter } from "./pages/HelpCenter";
import { Documentation } from "./pages/Documentation";
import { Company } from "./pages/Company";
import { AboutUs } from "./pages/AboutUs";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfService } from "./pages/TermsOfService";
import { Contact } from "./pages/Contact";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AutoFPLReconnection />
        <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Homepage />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="predictor" element={<Predictor />} />
              <Route path="/pick-team" element={<ProtectedRoute><PickTeam /></ProtectedRoute>} />
              <Route path="/my-team" element={<ProtectedRoute><MyTeam /></ProtectedRoute>} />
              <Route path="fixtures" element={<Fixtures />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/company" element={<Company />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/contact" element={<Contact />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
