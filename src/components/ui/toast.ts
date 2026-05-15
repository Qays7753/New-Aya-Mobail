import { toast } from 'sonner';

export const toastSuccess = (message: string) => {
  toast.success(message, {
    className: 'border-green-500 bg-green-50 text-green-900',
  });
};

export const toastError = (message: string) => {
  toast.error(message, {
    className: 'border-red-500 bg-red-50 text-red-900',
  });
};

export const toastInfo = (message: string) => {
  toast.info(message, {
    className: 'border-blue-500 bg-blue-50 text-blue-900',
  });
};
