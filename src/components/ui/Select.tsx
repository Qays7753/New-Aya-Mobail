import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'flex h-[44px] w-full appearance-none rounded-[10px] border border-[#E8E6E1] bg-white px-3 py-2 pe-10 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CF694A]/20 focus-visible:border-[#CF694A] disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500 bg-red-50 text-red-900 focus-visible:ring-red-500/20 focus-visible:border-red-500',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-gray-500">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
