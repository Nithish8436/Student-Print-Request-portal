import React from "react";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PrintProvider } from "./contexts/PrintContext";

// Pages
import Index from "./pages/Index.jsx";
import NotFound from "./pages/NotFound.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";

// Student Pages
import StudentLayout from "./pages/student/StudentLayout.jsx";
import Upload from "./pages/student/Upload.jsx";
import Payment from "./pages/student/Payment.jsx";
import Track from "./pages/student/Track.jsx";
import History from "./pages/student/History.jsx";
import Profile from "./pages/student/Profile.jsx";

// Xerox Pages
import XeroxLayout from "./pages/xerox/XeroxLayout.jsx";
import Orders from "./pages/xerox/Orders.jsx";
import { default as XeroxHistory } from "./pages/xerox/History.jsx";
import Completed from "./pages/xerox/Completed.jsx";
import Inventory from "./pages/xerox/Inventory.jsx";
import Revenue from "./pages/xerox/Revenue.jsx";

// Admin Pages
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import StaffManagement from "./pages/admin/StaffManagement.jsx";
import RevenueAnalytics from "./pages/admin/RevenueAnalytics.jsx";
import InventoryManagement from "./pages/admin/InventoryManagement.jsx";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PrintProvider>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Student Routes */}
            <Route path="/student" element={<StudentLayout />}>
              <Route path="upload" element={<Upload />} />
              <Route path="payment/:orderId" element={<Payment />} />
              <Route path="track" element={<Track />} />
              <Route path="history" element={<History />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Xerox Routes */}
            <Route path="/xerox" element={<XeroxLayout />}>
              <Route path="orders" element={<Orders />} />
              <Route path="history" element={<XeroxHistory />} />
              <Route path="completed" element={<Completed />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="revenue" element={<Revenue />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="staff" element={<StaffManagement />} />
              <Route path="revenue" element={<RevenueAnalytics />} />
              <Route path="inventory" element={<InventoryManagement />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PrintProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
