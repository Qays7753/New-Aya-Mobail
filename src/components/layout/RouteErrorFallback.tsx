import { AlertTriangle, RefreshCw } from 'lucide-react';
import { FallbackProps } from 'react-error-boundary';

export function RouteErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in fade-in zoom-in-95">
      <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">عذراً، حدث خطأ ما</h2>
      <p className="text-text-secondary max-w-md mb-6 leading-relaxed">
        يبدو أن هناك مشكلة أثناء عرض هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة في وقت لاحق.
      </p>
      
      {error != null && (
        <div className="bg-surface border border-border p-4 rounded-xl text-start text-sm text-text-secondary font-mono mb-8 w-full max-w-md overflow-x-auto" dir="ltr">
          {error instanceof Error ? error.message : String(error)}
        </div>
      )}

      <button 
        onClick={resetErrorBoundary}
        className="h-12 px-8 bg-accent text-white font-bold rounded-xl hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        <RefreshCw className="w-5 h-5" />
        إعادة المحاولة
      </button>
    </div>
  );
}
