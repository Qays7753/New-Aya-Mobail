import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-surface w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in zoom-in-95 flex flex-col items-center gap-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${danger ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
          <AlertTriangle className="w-7 h-7" />
        </div>

        {title && (
          <h2 className="text-lg font-bold text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {title}
          </h2>
        )}

        <p className="text-sm text-text-secondary text-center leading-relaxed" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          {message}
        </p>

        <div className="flex gap-3 w-full pt-1">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-border bg-muted text-text-primary font-bold hover:bg-border transition-colors"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-11 rounded-xl font-bold text-white transition-colors ${danger ? 'bg-danger hover:opacity-90' : 'bg-accent hover:bg-accent-hover'}`}
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
