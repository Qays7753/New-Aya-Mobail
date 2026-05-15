import React from 'react';
import { Delete, Check } from 'lucide-react';

interface NumPadProps {
  onDigit: (digit: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
}

export const NumPad: React.FC<NumPadProps> = ({ onDigit, onClear, onSubmit, submitDisabled = false }) => {
  const Button = ({ children, onClick, className = '', disabled = false }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-20 h-20 rounded-full flex justify-center items-center text-2xl font-bold bg-white border border-gray-200 transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="grid grid-cols-3 gap-6 place-items-center" dir="ltr">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <Button key={num} onClick={() => onDigit(num.toString())}>
          {num}
        </Button>
      ))}
      <Button onClick={onClear} className="text-red-500">
        <Delete className="w-8 h-8" />
      </Button>
      <Button onClick={() => onDigit('0')}>
        0
      </Button>
      <Button 
        onClick={onSubmit} 
        disabled={submitDisabled}
        className="bg-[#CF694A] border-none text-white hover:bg-[#b0583e] active:bg-[#974b34]"
      >
        <Check className="w-8 h-8" />
      </Button>
    </div>
  );
};
