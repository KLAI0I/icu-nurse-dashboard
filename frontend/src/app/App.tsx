import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import LoginPage from "../pages/LoginPage";
import AdminDashboard from "../pages/admin/AdminDashboard";
import StaffManagement from "../pages/admin/StaffManagement";
import StaffProfileAdmin from "../pages/admin/StaffProfileAdmin";
import AdminUsers from "../pages/admin/AdminUsers";
import StaffMyProfile from "../pages/staff/StaffMyProfile";
import StaffMyDocuments from "../pages/staff/StaffMyDocuments";
import Layout from "../components/Layout";

function Protected({ children, role }: { children: JSX.Element; role?: "ADMIN" | "STAFF" }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === "ADMIN" ? "/admin" : "/me"} replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <Protected role="ADMIN">
              <Layout />
            </Protected>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="staff/:id" element={<StaffProfileAdmin />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        <Route
          path="/me"
          element={
            <Protected role="STAFF">
              <Layout />
            </Protected>
          }
        >
          <Route index element={<StaffMyProfile />} />
          <Route path="documents" element={<StaffMyDocuments />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
