import { useState, useEffect } from 'react';
import { MoreVertical, PlusSquare, Smartphone } from 'lucide-react';

export function AddToHomeScreen() {
  const [isStandalone, setIsStandalone] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkStandalone = () => window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone === true);
    setIsStandalone(checkStandalone());
    
    if (sessionStorage.getItem('AddToHomeScreenDismissed')) {
      setDismissed(true);
    }
  }, []);

  if (isStandalone || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem('AddToHomeScreenDismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#F9F8F5]">
      <div className="max-w-md w-full flex flex-col items-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center text-balance">
          ثبّت التطبيق للحصول على أفضل تجربة
        </h1>
        
        <div className="w-full space-y-4 mb-10">
          <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-[#CF694A]/10">
              <MoreVertical className="w-6 h-6 text-[#CF694A]" />
            </div>
            <p className="font-medium text-gray-800">
              اضغط قائمة المتصفح (⋮) أعلى الشاشة
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-[#CF694A]/10">
              <PlusSquare className="w-6 h-6 text-[#CF694A]" />
            </div>
            <p className="font-medium text-gray-800">
              اختر "إضافة إلى الشاشة الرئيسية"
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-[#CF694A]/10">
              <Smartphone className="w-6 h-6 text-[#CF694A]" />
            </div>
            <p className="font-medium text-gray-800">
              افتح التطبيق من أيقونته الجديدة
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full font-bold py-4 rounded-xl text-white transition-opacity hover:opacity-90 active:scale-95 bg-[#CF694A]"
        >
          متابعة بدون تثبيت
        </button>
      </div>
    </div>
  );
}
