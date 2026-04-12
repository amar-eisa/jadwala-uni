import { lazy, Suspense } from "react";
import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { CompleteProfileDialog } from "@/components/CompleteProfileDialog";
import { ErrorFallback } from "@/components/ErrorFallback";
import { Loader2 } from "lucide-react";

// Eagerly loaded (critical path)
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import NotFound from "./pages/NotFound";

// Lazy loaded (non-critical)
const RoomsPage = lazy(() => import("./pages/RoomsPage"));
const ProfessorsPage = lazy(() => import("./pages/ProfessorsPage"));
const GroupsPage = lazy(() => import("./pages/GroupsPage"));
const SubjectsPage = lazy(() => import("./pages/SubjectsPage"));
const TimeSlotsPage = lazy(() => import("./pages/TimeSlotsPage"));
const TimetablePage = lazy(() => import("./pages/TimetablePage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const ActivityLogPage = lazy(() => import("./pages/ActivityLogPage"));
const ManageSubscriptionsPage = lazy(() => import("./pages/ManageSubscriptionsPage"));
const MonitoringPage = lazy(() => import("./pages/MonitoringPage"));
const StudentAuthPage = lazy(() => import("./pages/student/StudentAuthPage"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const StudentProfilePage = lazy(() => import("./pages/student/StudentProfilePage"));

const queryClient = new QueryClient();

function LazyFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function PhonePrompt() {
  const { user, needsPhone, setNeedsPhone } = useAuth();
  if (!user || !needsPhone) return null;
  return (
    <CompleteProfileDialog
      open={needsPhone}
      userId={user.id}
      onComplete={() => setNeedsPhone(false)}
    />
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PhonePrompt />
            <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense fallback={<LazyFallback />}>
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/pending-approval" element={<PendingApprovalPage />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/rooms" element={<ProtectedRoute><RoomsPage /></ProtectedRoute>} />
                <Route path="/professors" element={<ProtectedRoute><ProfessorsPage /></ProtectedRoute>} />
                <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
                <Route path="/subjects" element={<ProtectedRoute><SubjectsPage /></ProtectedRoute>} />
                <Route path="/time-slots" element={<ProtectedRoute><TimeSlotsPage /></ProtectedRoute>} />
                <Route path="/timetable" element={<ProtectedRoute><TimetablePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
                <Route path="/activity-log" element={<ProtectedRoute><ActivityLogPage /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                <Route path="/admin/monitoring" element={<AdminRoute><MonitoringPage /></AdminRoute>} />
                <Route path="/manage-subscriptions" element={<ManageSubscriptionsPage />} />
                {/* Student Portal */}
                <Route path="/student/auth" element={<StudentAuthPage />} />
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </Sentry.ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
