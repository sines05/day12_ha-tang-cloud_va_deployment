import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../pages/admin/AdminLayout';
import { AdminMailer } from '../pages/admin/AdminMailer';
import { AdminLogin } from '../pages/admin/AdminLogin';
import { AdminAuthProvider, useAdminAuth } from '../contexts/AdminAuthContext';

const AdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdminAuthenticated } = useAdminAuth();
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

const AdminRoutes: React.FC = () => {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<AdminRouteGuard><AdminLayout /></AdminRouteGuard>}>
          <Route path="mailer" element={<AdminMailer />} />
          <Route index element={<Navigate to="mailer" replace />} />
        </Route>
        <Route path="*" element={<div className="p-6 font-bold uppercase">404 - Admin Space Not Found</div>} />
      </Routes>
    </AdminAuthProvider>
  );
};

export default AdminRoutes;
