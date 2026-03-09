"use client";

import { useToastStore, type ToastType } from "@/store/toastStore";

const ICON: Record<ToastType, string> = {
  error: "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

const COLORS: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  error:   { bg: "bg-red-50",    border: "border-red-200",   text: "text-red-800",    icon: "text-red-500" },
  success: { bg: "bg-green-50",  border: "border-green-200", text: "text-green-800",  icon: "text-green-500" },
  info:    { bg: "bg-blue-50",   border: "border-blue-200",  text: "text-blue-800",   icon: "text-blue-500" },
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm" role="status" aria-live="polite">
      {toasts.map((t) => {
        const c = COLORS[t.type];
        return (
          <div
            key={t.id}
            className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border shadow-lg backdrop-blur-sm animate-toast-in ${c.bg} ${c.border}`}
          >
            <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${c.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICON[t.type]} />
            </svg>
            <span className={`text-sm font-medium flex-1 ${c.text}`}>{t.message}</span>
            {t.action && (
              <button
                onClick={() => { t.action!.onClick(); removeToast(t.id); }}
                className={`flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-bold ${c.text} hover:opacity-80`}
                style={{ backgroundColor: `${c.border.includes("blue") ? "#3B82F6" : c.border.includes("green") ? "#22C55E" : "#6B7280"}18` }}
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => removeToast(t.id)}
              className={`flex-shrink-0 mt-0.5 ${c.icon} hover:opacity-70`}
              aria-label="Dismiss notification"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
