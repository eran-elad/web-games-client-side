import { useState, useEffect, useCallback } from 'react';
import './Toast.css';

export type ToastMessage = {
  id: number;
  text: string;
  duration?: number;
};

let toastId = 0;
const listeners: Array<(msg: ToastMessage) => void> = [];

export function showToast(text: string, duration = 3000): void {
  const id = ++toastId;
  listeners.forEach((fn) => fn({ id, text, duration }));
}

export function useToast(): (text: string, duration?: number) => void {
  return useCallback((text: string, duration?: number) => {
    showToast(text, duration);
  }, []);
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

function ToastItem({
  message,
  onDismiss,
}: {
  message: ToastMessage;
  onDismiss: () => void;
}) {
  const duration = message.duration ?? 3000;

  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div className="toast-item" role="status" aria-live="polite">
      {message.text}
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map((msg) => (
        <ToastItem
          key={msg.id}
          message={msg}
          onDismiss={() => onDismiss(msg.id)}
        />
      ))}
    </div>
  );
}

export function useToastState() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg]);
    };
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, dismiss };
}
