import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import AdminLoginPage from "./pages/AdminLoginPage";
import AdminRedirectPage from "./pages/AdminRedirectPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";

import MasterDashboardPage from "./pages/master/MasterDashboardPage";
import MasterMallsPage from "./pages/master/MasterMallsPage";
import MasterCategoriesPage from "./pages/master/MasterCategoriesPage";
import MasterProductsPage from "./pages/master/MasterProductsPage";
import MasterMallAdminsPage from "./pages/master/MasterMallAdminsPage";
import MasterAnalyticsPage from "./pages/master/MasterAnalyticsPage";

import MallDashboardPage from "./pages/mall/MallDashboardPage";
import MallProductsPage from "./pages/mall/MallProductsPage";
import MallBulkUploadPage from "./pages/mall/MallBulkUploadPage";

import NotFound from "./pages/NotFound";
import "./index.css";

const queryClient = new QueryClient();

const App = () => {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />

              <Routes>
                {/* Admin */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin/redirect" element={<AdminRedirectPage />} />
                <Route path="/admin/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/admin/pending" element={<PendingApprovalPage />} />

                {/* Master Admin */}
                <Route path="/admin/master/dashboard" element={<MasterDashboardPage />} />
                <Route path="/admin/master/malls" element={<MasterMallsPage />} />
                <Route path="/admin/master/categories" element={<MasterCategoriesPage />} />
                <Route path="/admin/master/products" element={<MasterProductsPage />} />
                <Route path="/admin/master/mall-admins" element={<MasterMallAdminsPage />} />
                <Route path="/admin/master/analytics" element={<MasterAnalyticsPage />} />

                {/* Mall Admin */}
                <Route path="/admin/mall/dashboard" element={<MallDashboardPage />} />
                <Route path="/admin/mall/products" element={<MallProductsPage />} />
                <Route path="/admin/mall/bulk-upload" element={<MallBulkUploadPage />} />

                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

export default App;
