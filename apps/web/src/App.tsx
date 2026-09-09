import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/i18n/I18nProvider";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import TourDetail from "./pages/TourDetail";
import Reels from "./pages/Reels";
import Auth from "./pages/Auth";
import Partner from "./pages/Partner";
import NotFound from "./pages/NotFound";
import AdminIndex from "./pages/admin/AdminIndex";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminTours from "./pages/admin/AdminTours";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPartners from "./pages/admin/AdminPartners";
import AdminOrg from "./pages/admin/AdminOrg";
import Legal from "./pages/Legal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
    <TooltipProvider>
      <AuthProvider>
        <AppProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/tour/:id" element={<TourDetail />} />
            <Route path="/reels" element={<Reels />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/partner" element={<Partner />} />
            {/* обязательны для интернет-эквайринга: банк проверяет их наличие (YAV-21) */}
            <Route path="/offer" element={<Legal doc="offer" />} />
            <Route path="/privacy" element={<Legal doc="privacy" />} />

            {/* Панель управления: свой макет, разделы — отдельные адреса (YAV-26) */}
            <Route path="/admin" element={<AdminIndex />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/tours" element={<AdminTours />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/partners" element={<AdminPartners />} />
            <Route path="/admin/org" element={<AdminOrg />} />
            {/* старые ссылки и закладки на бэкофис продолжают работать */}
            <Route path="/backoffice" element={<Navigate to="/admin" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
