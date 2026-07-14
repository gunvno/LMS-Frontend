"use client";

import { TriangleAlert } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ConfirmationOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warning";
};

type ConfirmationContextValue = {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
};

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const resolverRef = useRef<((result: boolean) => void) | null>(null);
  const [dialog, setDialog] = useState<ConfirmationOptions | null>(null);

  const close = useCallback((result: boolean) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    resolver?.(result);
  }, []);

  const confirm = useCallback((options: ConfirmationOptions) => {
    resolverRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setDialog({ confirmLabel: "Đồng ý", cancelLabel: "Không, quay lại", tone: "danger", ...options });
    });
  }, []);

  useEffect(() => {
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => cancelRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [close, dialog]);

  useEffect(() => () => resolverRef.current?.(false), []);

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {dialog && createPortal(
        <div className="confirmation-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close(false)}>
          <section role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="confirmation-modal">
            <div className={`confirmation-icon ${dialog.tone}`}><TriangleAlert size={24} /></div>
            <div className="confirmation-copy">
              <h2 id={titleId}>{dialog.title}</h2>
              <p id={descriptionId}>{dialog.description}</p>
            </div>
            <div className="confirmation-actions">
              <button ref={cancelRef} type="button" className="confirmation-cancel" onClick={() => close(false)}>{dialog.cancelLabel}</button>
              <button type="button" className={`confirmation-submit ${dialog.tone}`} onClick={() => close(true)}>{dialog.confirmLabel}</button>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) throw new Error("useConfirmation phải được dùng bên trong ConfirmationProvider.");
  return context;
}
