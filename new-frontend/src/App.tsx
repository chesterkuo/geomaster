import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Tracking from "./pages/Tracking";
import Optimization from "./pages/Optimization";
import AISearch from "./pages/AISearch";
import Analytics from "./pages/Analytics";
import Research from "./pages/Research";
import Reporting from "./pages/Reporting";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Alerts from "./pages/Alerts";
import InviteAccept from "./pages/InviteAccept";
import NotFound from "./pages/NotFound";
import { I18nDemo } from "./components/demo/I18nDemo";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="dark">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Tracking />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/optimization" element={<Optimization />} />
            <Route path="/ai-search" element={<AISearch />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/research" element={<Research />} />
            <Route path="/reporting" element={<Reporting />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/i18n-demo" element={<I18nDemo />} />
            <Route path="/invite/:token" element={<InviteAccept />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
