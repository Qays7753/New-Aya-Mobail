import { Outlet, useNavigate } from 'react-router-dom';
import { AdminGate } from '@/components/auth/AdminGate';
import { toast } from 'sonner';

export function ProtectedRoute() {
  const navigate = useNavigate();

  const handleCancel = () => {
    toast.info('صلاحية المشرف مطلوبة للوصول لهذه الصفحة');
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/pos');
    }
  };

  return (
    <AdminGate
      onCancel={handleCancel}
      title="صلاحيات المدير مطلوبة"
      description="يرجى إدخال رمز المدير (Admin PIN) للوصول إلى هذه الصفحة"
    >
      <Outlet />
    </AdminGate>
  );
}
