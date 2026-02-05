import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import MapPage from "./pages/MapPage";
import ReportsPage from "./pages/ReportsPage";
import ProjectReportPage from "./pages/ProjectReportPage";
import UploadPage from "./pages/UploadPage";
import About from "./pages/About";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import TreeImpactPage from "./pages/TreeImpactPage";
import TreeImpactReportPage from "./pages/TreeImpactReportPage";
import CorridorPlanningPage from "./pages/CorridorPlanningPage";
import TreeDataEntryPage from "./pages/TreeDataEntryPage";
import SecurityAuditPage from "./pages/SecurityAuditPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:projectId/report"
              element={
                <ProtectedRoute>
                  <ProjectReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:projectId/tree-impact"
              element={
                <ProtectedRoute>
                  <TreeImpactPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:projectId/tree-impact-report"
              element={
                <ProtectedRoute>
                  <TreeImpactReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:projectId/corridor-planning"
              element={
                <ProtectedRoute>
                  <CorridorPlanningPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:projectId/tree-data-entry"
              element={
                <ProtectedRoute>
                  <TreeDataEntryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/map"
              element={
                <ProtectedRoute>
                  <MapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/security-audit"
              element={
                <ProtectedRoute>
                  <SecurityAuditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/about"
              element={
                <ProtectedRoute>
                  <About />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
