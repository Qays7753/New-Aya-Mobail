import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUiStore } from '@/stores/ui.store';

export function ProtectedRoute() {
  const { requestPin, isAdminUnlocked } = useUiStore();
  const [isChecking, setIsChecking] = useState(!isAdminUnlocked);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    
    const checkAccess = async () => {
      if (!isAdminUnlocked) {
        const success = await requestPin();
        if (mounted) {
          setIsChecking(false);
        }
      } else {
        if (mounted) {
          setIsChecking(false);
        }
      }
    };

    checkAccess();

    return () => {
      mounted = false;
    };
  }, [isAdminUnlocked, requestPin, location.pathname]);

  if (isChecking) {
    return <div className="flex-1 flex items-center justify-center text-text-secondary h-full">جاري التحقق من الصلاحيات...</div>;
  }

  if (!isAdminUnlocked) {
    return <Navigate to="/pos" replace />;
  }

  return <Outlet />;
}
