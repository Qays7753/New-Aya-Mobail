import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FallbackProps } from 'react-error-boundary';

export function ModuleError({ error, resetErrorBoundary }: FallbackProps) {
  const navigate = useNavigate();
  const errorMessage = error instanceof Error ? error.message : String(error);

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[50vh]">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          حدث خطأ غير متوقع في هذه الصفحة
        </h2>
        
        <p className="text-gray-500 mb-6 text-sm">
          يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
        </p>

        {error != null && (
          <div className="w-full bg-gray-50 p-4 rounded-xl text-start font-mono text-xs text-gray-600 overflow-x-auto mb-8 whitespace-pre-wrap shrink-0 max-h-32 overflow-y-auto" dir="ltr">
            {errorMessage}
          </div>
        )}
        
        <div className="flex flex-col gap-3 w-full">
          <button 
            onClick={resetErrorBoundary}
            className="flex items-center justify-center gap-2 w-full bg-[#CF694A] text-white font-bold py-3 rounded-xl transition-colors hover:bg-[#be5f41]"
          >
            <RefreshCw className="w-5 h-5" />
            إعادة المحاولة
          </button>
          
          <button 
            onClick={() => {
              resetErrorBoundary();
              navigate('/');
            }}
            className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-800 font-bold py-3 rounded-xl transition-colors hover:bg-gray-200"
          >
            <Home className="w-5 h-5" />
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
