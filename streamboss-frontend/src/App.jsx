import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/Login";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import Dashboard from "./pages/admin/Dashboard";
import MasterAccounts from "./pages/admin/MasterAccounts";
import ProfileSlots from "./pages/admin/ProfileSlots";
import Subscriptions from "./pages/admin/Subscriptions";
import Requests from "./pages/admin/Requests";
import Reports from "./pages/admin/Reports";
import Users from "./pages/admin/Users";
import MyClients from "./pages/distributor/MyClients";
import RequestAccount from "./pages/distributor/RequestAccount";
import PublicRegister from "./pages/PublicRegister";
import PublicReport from "./pages/PublicReport";

function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
      <div className="main-content">
        <Topbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="page-container animate-fade">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auto-registro" element={<PublicRegister />} />
        <Route path="/reporte-error" element={<PublicReport />} />
        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={
              <AppLayout>
                {isAdmin ? <Dashboard /> : <MyClients />}
              </AppLayout>
            }
          />
          {isAdmin && (
            <>
              <Route path="/master-accounts" element={<AppLayout><MasterAccounts /></AppLayout>} />
              <Route path="/master-accounts/:id/profiles" element={<AppLayout><ProfileSlots /></AppLayout>} />
              <Route path="/subscriptions" element={<AppLayout><Subscriptions /></AppLayout>} />
              <Route path="/requests" element={<AppLayout><Requests /></AppLayout>} />
              <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
              <Route path="/users" element={<AppLayout><Users /></AppLayout>} />
            </>
          )}
          <Route path="/my-clients" element={<AppLayout><MyClients /></AppLayout>} />
          <Route path="/request-account" element={<AppLayout><RequestAccount /></AppLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
