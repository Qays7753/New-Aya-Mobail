import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { isStoragePersisted, ensurePersistence } from '@/lib/storage';

export function PersistenceBanner() {
  const [persisted, setPersisted] = useState(true);

  useEffect(() => {
    const checkPersistence = async () => {
      let isPersisted = await isStoragePersisted();
      if (!isPersisted) {
        isPersisted = await ensurePersistence();
      }
      setPersisted(isPersisted);
    };
    checkPersistence();
  }, []);

  if (persisted) return null;

  return (
    <div className="bg-[#FEF1F1] border-b border-red-200 text-red-800 text-sm px-4 py-2 flex items-center gap-3 shrink-0 relative z-30">
      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
      <p>
        التخزين غير مضمون — قد تُحذف بياناتك. ثبّت التطبيق على الشاشة الرئيسية لضمان الحفظ.
      </p>
    </div>
  );
}
