import { useState, useEffect } from 'react';
import { useUiStore } from '@/stores/ui.store';
import { checkPin } from '@/lib/pin';
import { cn } from '@/lib/utils';
import { X, Delete } from 'lucide-react';

export function PinDialog() {
  const { isPinOpen, resolvePin } = useUiStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  useEffect(() => {
    if (isPinOpen) {
      setPin('');
      setError(false);
    }
  }, [isPinOpen]);

  if (!isPinOpen) return null;

  const handleInput = (num: string) => {
    if (lockedUntil && Date.now() < lockedUntil) return;
    
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const verifyPin = async (currentPin: string) => {
    const isValid = await checkPin(currentPin);
    if (isValid) {
      setAttempts(0);
      resolvePin(true);
    } else {
      setError(true);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      // Lock for 2 mins after 5 attempts
      if (newAttempts >= 5) {
        setLockedUntil(Date.now() + 2 * 60 * 1000); 
        setAttempts(0);
      }
      
      setTimeout(() => setPin(''), 500);
    }
  };

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-sm rounded-[24px] md:rounded-2xl p-6 shadow-md animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">أدخل رمز المتجر</h2>
          <button onClick={() => resolvePin(false)} className="p-2 hover:bg-muted rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {isLocked ? (
           <div className="text-center text-danger font-medium py-8 bg-danger-bg rounded-lg">
             تم قفل النظام مؤقتاً.<br/>الرجاء المحاولة لاحقاً.
           </div>
        ) : (
          <>
            <div className="flex justify-center gap-4 mb-8">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-4 h-4 rounded-full transition-colors",
                    pin.length > i ? "bg-text-primary" : "bg-border",
                    error && "bg-danger"
                  )}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-[260px] mx-auto dir-ltr">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleInput(num.toString())}
                  className="h-14 rounded-full bg-muted text-xl font-numeric hover:bg-accent hover:text-white transition-colors flex items-center justify-center"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleInput('0')}
                className="h-14 rounded-full bg-muted text-xl font-numeric hover:bg-accent hover:text-white transition-colors flex items-center justify-center"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="h-14 rounded-full bg-muted text-text-secondary hover:bg-danger hover:text-white transition-colors flex items-center justify-center"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
