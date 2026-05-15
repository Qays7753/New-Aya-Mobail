import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { getBackupInfo, performBackup } from '@/lib/backup';
import { toast } from 'sonner';

export function BackupReminderBanner() {
  const [isOverdue, setIsOverdue] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const checkBackupStatus = () => {
      const { isOverdue } = getBackupInfo();
      setIsOverdue(isOverdue);
    };

    checkBackupStatus();
    const interval = setInterval(checkBackupStatus, 1000 * 60 * 15); // Check every 15 minutes

    return () => clearInterval(interval);
  }, []);

  const handleBackupNow = async () => {
    try {
      await performBackup();
      toast.success('تم أخذ نسخة احتياطية بنجاح');
      setIsOverdue(false);
    } catch (e: any) {
      toast.error('فشل في أخذ النسخة: ' + e.message);
    }
  };

  if (!isOverdue || isHidden) return null;

  return (
    <div className="bg-gradient-to-r from-[#D4AF37] to-amber-600 border-b border-amber-700/50 text-white shadow-[0_2px_10px_rgba(212,175,55,0.3)] shrink-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-base">تنبيه أمان البيانات!</h3>
            <p className="text-white/90 text-xs md:text-sm">لقد مرت أكثر من ٢٤ ساعة على آخر نسخة احتياطية للبيانات. يرجى أخذ نسخة الآن.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleBackupNow}
            className="bg-white text-[#D4AF37] hover:bg-white/90 font-bold px-4 py-2 rounded-lg text-sm shadow-sm transition-colors active:scale-95"
          >
            تنزيل نسخة الآن
          </button>
          <button 
            onClick={() => setIsHidden(true)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors ms-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
