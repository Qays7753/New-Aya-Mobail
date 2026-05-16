import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DailyLockScreen } from './DailyLockScreen';
import { AdminPinDialog } from './AdminPinDialog';
import { ForceChangeDefaultsScreen } from './ForceChangeDefaultsScreen';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isDayUnlocked, pendingAdminAction, clearPendingAdminAction, needsDefaultChange } = useAuth();
  
  if (needsDefaultChange) {
    return <ForceChangeDefaultsScreen />;
  }

  if (!isDayUnlocked) {
    return (
      <div className="h-full relative filter-none">
        <DailyLockScreen />
        <div className="opacity-0 pointer-events-none absolute inset-0">
          {children}
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {pendingAdminAction && (
        <AdminPinDialog
          isOpen={true}
          onClose={() => {
            clearPendingAdminAction();
            window.history.back();
          }}
          onSuccess={() => {
            pendingAdminAction();
            clearPendingAdminAction();
          }}
          title="تأكيد الإجراء"
          description="يرجى إدخال رمز المدير (Admin PIN) للموافقة على هذا الإجراء"
        />
      )}
    </>
  );
}
