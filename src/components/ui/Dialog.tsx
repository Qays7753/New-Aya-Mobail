import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useEscKey } from '@/hooks/useEscKey';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  useEscKey(onClose, isOpen);
  const trapRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shared-dialog-title"
        className="bg-surface rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] shadow-xl"
      >
        <div className="flex justify-between items-center p-4 border-b border-border shrink-0">
          <h2 id="shared-dialog-title" className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center hover:bg-muted rounded-full"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
