import React from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AdminGate } from '@/components/auth/AdminGate';

export function ProtectedRoute() {
  const navigate = useNavigate();

  return (
    <AdminGate 
      onCancel={() => navigate('/pos')}
      title="صلاحيات المدير مطلوبة"
      description="يرجى إدخال رمز المدير (Admin PIN) للوصول إلى هذه الصفحة"
    >
      <Outlet />
    </AdminGate>
  );
}
