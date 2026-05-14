/// <reference types="vite-plugin-pwa/client" />
import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Download, X } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';

export function PWABadge() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const cart = useCartStore(state => state.items);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // A2HS (Add to Home Screen) install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const hasActiveCart = cart.length > 0;

  const handleUpdate = () => {
    if (hasActiveCart) {
      if (!confirm('لديك سلة مبيعات نشطة. هل أنت متأكد من رغبتك في تحديث التطبيق الآن (قد تفقد بيانات السلة الحالية)؟')) {
        return;
      }
    }
    updateServiceWorker(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 start-4 end-4 sm:start-auto sm:end-auto sm:w-80 flex flex-col gap-2 z-50">
      {needRefresh && (
        <div className="bg-surface border border-accent shadow-lg rounded-2xl p-4 animate-in slide-in-from-bottom flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-accent flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin-slow" /> 
              تحديث الكاشير متاح
            </h3>
            <button onClick={() => setNeedRefresh(false)} className="p-1 hover:bg-muted rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-text-secondary">
            يتوفر إصدار جديد من النظام. {hasActiveCart && <strong className="text-warning">يرجى إنهاء بيع السلة الحالية أولاً لضمان عدم فقدانها.</strong>}
          </p>
          <button 
            onClick={handleUpdate}
            className="w-full h-10 bg-accent text-white font-bold rounded-lg hover:bg-accent-hover transition-colors"
          >
            تحديث وإعادة التحميل الآن
          </button>
        </div>
      )}

      {deferredPrompt && (
        <div className="bg-surface border border-accent shadow-lg rounded-2xl p-4 animate-in slide-in-from-bottom flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Download className="w-4 h-4" /> 
              تثبيت التطبيق 
            </h3>
            <button onClick={() => setDeferredPrompt(null)} className="p-1 hover:bg-muted rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-text-secondary">
            قم بتثبيت التطبيق على جهازك للوصول السريع والعمل بدون إنترنت بشكل أفضل.
          </p>
          <button 
            onClick={handleInstall}
            className="w-full h-10 border-2 border-accent text-accent font-bold rounded-lg hover:bg-accent/5 transition-colors"
          >
            تثبيت التطبيق
          </button>
        </div>
      )}
    </div>
  );
}
