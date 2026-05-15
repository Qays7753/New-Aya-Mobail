/// <reference types="vite-plugin-pwa/client" />
import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, X } from 'lucide-react';
import { useCartStore } from '@/stores/cart.store';
import { toast } from 'sonner';

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

  useEffect(() => {
    if (needRefresh) {
      if (cart.length > 0) {
        toast('تحديث متوفر — أتمم البيع الحالي ثم اضغط هنا للتحديث', {
          duration: Infinity,
          action: {
            label: 'تحديث',
            onClick: () => updateServiceWorker(true)
          },
          onDismiss: () => setNeedRefresh(false)
        });
      } else {
        toast('تحديث متوفر — اضغط للتحديث', {
          duration: Infinity,
          action: {
            label: 'تحديث',
            onClick: () => updateServiceWorker(true)
          },
          onDismiss: () => setNeedRefresh(false)
        });
      }
    }
  }, [needRefresh]);

  // A2HS (Add to Home Screen) install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

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
