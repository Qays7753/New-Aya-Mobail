import { useState, useEffect, useRef } from 'react';
import { Settings, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function TopBar() {
  const navigate = useNavigate();
  const today = format(new Date(), 'dd/MM/yyyy');
  const { isAdminPinValidUntil } = useAuth();
  const [remaining, setRemaining] = useState(0);
  const prevRemainingRef = useRef(0);

  useEffect(() => {
    const update = () => {
      const secs = isAdminPinValidUntil && Date.now() < isAdminPinValidUntil
        ? Math.ceil((isAdminPinValidUntil - Date.now()) / 1000)
        : 0;
      setRemaining(secs);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [isAdminPinValidUntil]);

  useEffect(() => {
    if (prevRemainingRef.current > 0 && remaining === 0) {
      toast('انتهت جلسة المشرف', {
        description: 'أعد إدخال رمز المشرف عند الحاجة',
        icon: '🔒',
        duration: 4000,
      });
    }
    prevRemainingRef.current = remaining;
  }, [remaining]);

  const formatRemaining = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-[56px] border-b border-border bg-surface flex items-center justify-between px-4 sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg text-accent" style={{ fontFamily: 'Tajawal, sans-serif' }}>POS الذكي</span>
      </div>

      <div className="flex items-center gap-2">
        {remaining > 0 && (
          <div className="flex items-center gap-1.5 bg-accent/10 text-accent px-2.5 py-1 rounded-full text-xs font-bold animate-in fade-in">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span className="numeric">{formatRemaining(remaining)}</span>
          </div>
        )}
        <div className="hidden md:block text-text-secondary text-sm font-medium numeric">{today}</div>
        <button
          onClick={() => navigate('/settings')}
          title="الإعدادات"
          className="p-2 hover:bg-muted rounded-full text-text-secondary transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
