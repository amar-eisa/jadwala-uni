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
import Dashboard from "./pages/Dashboard";
import RoomsPage from "./pages/RoomsPage";
import ProfessorsPage from "./pages/ProfessorsPage";
import GroupsPage from "./pages/GroupsPage";
import SubjectsPage from "./pages/SubjectsPage";
import TimeSlotsPage from "./pages/TimeSlotsPage";
import TimetablePage from "./pages/TimetablePage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import SettingsPage from "./pages/SettingsPage";
import ReportsPage from "./pages/ReportsPage";
import ActivityLogPage from "./pages/ActivityLogPage";
import NotFound from "./pages/NotFound";
import ManageSubscriptionsPage from "./pages/ManageSubscriptionsPage";
import StudentAuthPage from "./pages/student/StudentAuthPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfilePage from "./pages/student/StudentProfilePage";
import { StudentProtectedRoute } from "./components/student/StudentProtectedRoute";

const queryClient = new QueryClient();

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
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PhonePrompt />
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
              {/* Student Portal */}
              <Route path="/student/auth" element={<StudentAuthPage />} />
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
