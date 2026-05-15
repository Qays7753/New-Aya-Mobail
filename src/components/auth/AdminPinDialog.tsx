import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { verifyCode, getLockoutSecondsRemaining, recordFailedAttempt } from '@/lib/auth';
import { get } from 'idb-keyval';
import { Shield, Clock, X } from 'lucide-react';
import { toastSuccess, toastError } from '@/components/ui/toast';
import { NumPad } from '@/components/ui/NumPad';

interface AdminPinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function AdminPinDialog({ isOpen, onClose, onSuccess, title, description }: AdminPinDialogProps) {
  const { grantAdminAccess } = useAuth();
  const [pin, setPin] = useState('');
  const [lockoutSecs, setLockoutSecs] = useState(0);

  useEffect(() => {
    if (!isOpen) {
        setPin('');
        return;
    }
    
    const checkLockout = async () => {
      const remaining = await getLockoutSecondsRemaining('admin');
      setLockoutSecs(remaining);
    };
    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSubmit = async () => {
    if (lockoutSecs > 0) return;
    
    if (pin.length >= 4) {
      const stored = await get('admin_pin');
      if (stored && await verifyCode(pin, stored)) {
        grantAdminAccess();
        onSuccess();
        toastSuccess("تم تأكيد الصلاحية");
        setPin('');
      } else {
        await recordFailedAttempt('admin');
        setPin('');
        toastError("الرمز غير صحيح");
        const remaining = await getLockoutSecondsRemaining('admin');
        setLockoutSecs(remaining);
      }
    }
  };

  const handleKeyPress = (num: number) => {
    if (pin.length < 6 && lockoutSecs === 0) {
      const nextPin = pin + num;
      setPin(nextPin);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" dir="rtl">
      <div className="bg-surface w-full max-w-sm rounded-[24px] p-6 shadow-xl relative animate-in zoom-in-95 flex flex-col items-center">
        <button 
          onClick={onClose}
          className="absolute top-4 end-4 p-2 text-text-secondary hover:bg-muted rounded-full transition-colors outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-accent/10 border border-accent/20 text-accent rounded-2xl flex items-center justify-center mb-4 mt-2">
          <Shield className="w-7 h-7" />
        </div>
        
        <h2 className="text-xl font-bold mb-1">{title || 'صلاحيات المدير'}</h2>
        <p className="text-sm text-text-secondary text-center">
          {description || 'الرجاء إدخال رمز المدير (Admin PIN) للمتابعة'}
        </p>
        <button 
          onClick={async () => {
            if (confirm("هل أنت متأكد من استعادة الأرقام السرية الافتراضية؟")) {
              (window as any).resetPins();
            }
          }}
          className="text-xs text-text-secondary mt-1 mb-6 underline"
        >
          نسيت كلمة المرور؟
        </button>

        {lockoutSecs > 0 ? (
          <div className="w-full bg-danger/10 text-danger rounded-xl p-4 flex flex-col items-center mb-6">
            <Clock className="w-8 h-8 mb-2 animate-pulse" />
            <span className="font-bold">قفل مؤقت للحماية</span>
            <span className="text-sm opacity-90">{lockoutSecs} ثانية متبقية</span>
          </div>
        ) : (
          <>
            <div className="flex gap-2 w-full justify-center mb-8 h-12" dir="ltr">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                    pin.length > i ? 'border-accent bg-accent text-white scale-110' :
                    i < 4 ? 'border-border bg-muted/50' : 'border-dashed border-border opacity-50 bg-transparent gap-marker'
                  }`}
                >
                  {pin.length > i ? '•' : ''}
                </div>
              ))}
            </div>

            <NumPad
              onDigit={(num) => handleKeyPress(Number(num))}
              onClear={handleBackspace}
              onSubmit={handleSubmit}
              submitDisabled={pin.length < 4}
            />
          </>
        )}
      </div>
    </div>
  );
}
