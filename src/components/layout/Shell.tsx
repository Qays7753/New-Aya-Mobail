import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { RouteErrorFallback } from './RouteErrorFallback';
import { TopBar } from './TopBar';
import { SideRail } from './SideRail';
import { BottomNav } from './BottomNav';
import { AlertTriangle, X } from 'lucide-react';

import { PWABadge } from '../pwa/PWABadge';

export function Shell() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('opfs_warning_dismissed');
    if (!dismissed) {
      setShowWarning(true);
    }
  }, []);

  const dismissWarning = () => {
    localStorage.setItem('opfs_warning_dismissed', '1');
    setShowWarning(false);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background w-full max-w-[100vw] text-text-primary">
      <TopBar />
      
      {showWarning && (
        <div className="bg-warning-bg/90 border-b border-warning/30 px-4 py-2 flex items-start sm:items-center justify-between gap-3 text-sm z-20 shrink-0">
          <div className="flex items-start sm:items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5 sm:mt-0" />
            <p className="font-medium text-text-primary">
              <strong className="text-warning">تنبيه هام:</strong> يتم حفظ بيانات نقطة البيع في هذا المتصفح فقط. يرجى أخذ نسخ احتياطية منتظمة من الإعدادات لمنع فقدان البيانات.
            </p>
          </div>
          <button onClick={dismissWarning} className="p-1 hover:bg-black/5 rounded-full shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <SideRail className="hidden md:flex" />
        <main className="flex-1 overflow-auto relative bg-background">
          <ErrorBoundary FallbackComponent={RouteErrorFallback}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <BottomNav className="md:hidden" />
      <PWABadge />
    </div>
  );
}
