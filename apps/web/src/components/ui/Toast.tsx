import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertTriangle, X, Info, AlertCircle } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const success = useCallback((message: string, duration?: number) => toast(message, "success", duration), [toast]);
  const error = useCallback((message: string, duration?: number) => toast(message, "error", duration), [toast]);
  const warning = useCallback((message: string, duration?: number) => toast(message, "warning", duration), [toast]);
  const info = useCallback((message: string, duration?: number) => toast(message, "info", duration), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, removeToast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      {/* Embedded Animations Style */}
      <style>{`
        @keyframes toast-slide-in {
          0% {
            transform: translateX(120%) scale(0.9);
            opacity: 0;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        .toast-animate-in {
          animation: toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
};

const ToastCard: React.FC<{ item: ToastItem; onClose: () => void }> = ({ item, onClose }) => {
  const { id, message, type, duration = 4000 } = item;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Styling maps based on ToastType using variables matching tokens.css
  const styles = {
    success: {
      bg: "bg-surface-overlay/80 border-[hsl(var(--accent-success)/0.25)] bg-[linear-gradient(to_bottom_right,hsl(var(--surface-overlay)/0.8),hsl(var(--accent-success)/0.04))]",
      icon: <CheckCircle2 className="w-5 h-5 text-[hsl(var(--accent-success))]" />,
      title: "Success",
      glow: "shadow-[0_8px_32px_rgba(16,185,129,0.08)]",
    },
    error: {
      bg: "bg-surface-overlay/80 border-[hsl(var(--accent-danger)/0.25)] bg-[linear-gradient(to_bottom_right,hsl(var(--surface-overlay)/0.8),hsl(var(--accent-danger)/0.04))]",
      icon: <AlertCircle className="w-5 h-5 text-[hsl(var(--accent-danger))]" />,
      title: "Error",
      glow: "shadow-[0_8px_32px_rgba(239,68,68,0.08)]",
    },
    warning: {
      bg: "bg-surface-overlay/80 border-[hsl(var(--accent-warning)/0.25)] bg-[linear-gradient(to_bottom_right,hsl(var(--surface-overlay)/0.8),hsl(var(--accent-warning)/0.04))]",
      icon: <AlertTriangle className="w-5 h-5 text-[hsl(var(--accent-warning))]" />,
      title: "Warning",
      glow: "shadow-[0_8px_32px_rgba(245,158,11,0.08)]",
    },
    info: {
      bg: "bg-surface-overlay/80 border-[hsl(var(--accent-primary)/0.25)] bg-[linear-gradient(to_bottom_right,hsl(var(--surface-overlay)/0.8),hsl(var(--accent-primary)/0.04))]",
      icon: <Info className="w-5 h-5 text-[hsl(var(--accent-primary))]" />,
      title: "Info",
      glow: "shadow-[0_8px_32px_rgba(139,92,246,0.08)]",
    },
  }[type];

  return (
    <div
      className={`toast-animate-in pointer-events-auto rounded-2xl border p-4 flex items-start gap-3 backdrop-blur-xl ${styles.bg} ${styles.glow} transition-all duration-300 hover:scale-[1.01]`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
      <div className="flex-grow min-w-0">
        <div className="text-body-sm font-bold text-text-primary leading-none mb-1">
          {styles.title}
        </div>
        <div className="text-body-sm text-text-secondary leading-normal break-words font-sans">
          {message}
        </div>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-text-subtle hover:text-text-primary p-0.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
