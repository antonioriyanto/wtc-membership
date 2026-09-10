import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, X } from 'lucide-react';

interface DialogOptions {
  title?: string;
  message: string;
  type?: 'success' | 'warning' | 'info' | 'error' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

interface DialogContextType {
  showAlert: (message: string, title?: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  showConfirm: (message: string, title?: string, onConfirm?: () => void, confirmText?: string, cancelText?: string) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const CustomDialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<DialogOptions & { isConfirm: boolean }>({
    message: '',
    title: '',
    type: 'info',
    isConfirm: false,
    confirmText: 'OK',
    cancelText: 'Batal',
  });

  const showAlert = (message: string, title = 'Informasi', type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    setDialogConfig({
      message,
      title,
      type,
      isConfirm: false,
      confirmText: 'OK',
    });
    setIsOpen(true);
  };

  const showConfirm = (
    message: string,
    title = 'Konfirmasi',
    onConfirm?: () => void,
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal'
  ) => {
    setDialogConfig({
      message,
      title,
      type: 'confirm',
      isConfirm: true,
      confirmText,
      cancelText,
      onConfirm,
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleConfirmAction = () => {
    if (dialogConfig.onConfirm) {
      dialogConfig.onConfirm();
    }
    setIsOpen(false);
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[99999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 transform transition-all scale-100 animate-scaleUp overflow-hidden">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                dialogConfig.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                dialogConfig.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                dialogConfig.type === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                'bg-blue-50 text-blue-600 border border-blue-100'
              }`}>
                {dialogConfig.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
                 dialogConfig.type === 'error' ? <AlertCircle className="w-6 h-6" /> :
                 dialogConfig.type === 'warning' ? <AlertCircle className="w-6 h-6" /> :
                 <HelpCircle className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{dialogConfig.title}</h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{dialogConfig.message}</p>
              </div>
              <button 
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              {dialogConfig.isConfirm ? (
                <>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    {dialogConfig.cancelText || 'Batal'}
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
                  >
                    {dialogConfig.confirmText || 'Ya, Lanjutkan'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer w-full sm:w-auto"
                >
                  {dialogConfig.confirmText || 'OK'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

export const useCustomDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useCustomDialog must be used within a CustomDialogProvider');
  }
  return context;
};
