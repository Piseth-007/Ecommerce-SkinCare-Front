import { createContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

export const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-[0_4px_12px_rgba(33,31,27,0.08)] text-[13.5px] font-medium animate-[slideIn_0.2s_ease-out] ${
              toast.type === "error"
                ? "bg-clay-tint border-clay/20 text-clay"
                : "bg-surface border-hairline text-ink"
            }`}
          >
            {toast.type === "error" ? (
              <XCircle size={16} className="text-clay shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="text-moss shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="ml-1 text-stone hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
