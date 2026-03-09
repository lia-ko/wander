import { create } from "zustand";

export type ToastType = "error" | "success" | "info";

export type Toast = {
  id: number;
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
};

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, action?: Toast["action"]) => void;
  removeToast: (id: number) => void;
}

let nextToastId = 0;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  addToast: (message, type = "error", action) => {
    const id = ++nextToastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, type, action }] }));
    const timeout = action ? 6000 : 4000; // longer for toasts with actions
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, timeout);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience for calling from non-component code */
export const toast = (message: string, type?: ToastType, action?: Toast["action"]) =>
  useToastStore.getState().addToast(message, type, action);
