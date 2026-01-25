import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import RoomsPage from "./pages/RoomsPage";
import ProfessorsPage from "./pages/ProfessorsPage";
import GroupsPage from "./pages/GroupsPage";
import SubjectsPage from "./pages/SubjectsPage";
import TimeSlotsPage from "./pages/TimeSlotsPage";
import TimetablePage from "./pages/TimetablePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/professors" element={<ProfessorsPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/time-slots" element={<TimeSlotsPage />} />
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
