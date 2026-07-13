"use client";

import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { ReactNode, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ActionMenuItem = {
  label: string;
  icon?: ReactNode;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

const VIEWPORT_PADDING = 8;
const MENU_GAP = 8;

export function ActionMenu({ items }: { items: ActionMenuItem[] }) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuWidth = menuRef.current?.offsetWidth ?? 190;
    const menuHeight = menuRef.current?.offsetHeight ?? items.length * 40 + 12;
    const left = Math.min(
      Math.max(VIEWPORT_PADDING, triggerRect.right - menuWidth),
      Math.max(VIEWPORT_PADDING, window.innerWidth - menuWidth - VIEWPORT_PADDING),
    );
    const below = triggerRect.bottom + MENU_GAP;
    const top = below + menuHeight <= window.innerHeight - VIEWPORT_PADDING
      ? below
      : Math.max(VIEWPORT_PADDING, triggerRect.top - menuHeight - MENU_GAP);

    setPosition({ top, left });
  }, [items.length]);

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const closeOnViewportChange = () => setOpen(false);

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [open]);

  return (
    <span className="student-action-menu" onClick={(event) => event.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        className="student-action-trigger"
        aria-label="Mở menu thao tác"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreVertical size={18} />
      </button>

      {open && createPortal(
        <div ref={menuRef} id={menuId} role="menu" className="student-action-menu-content" style={position}>
          {items.map((item) => {
            const className = `student-action-menu-item${item.danger ? " danger" : ""}`;
            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  role="menuitem"
                  className={className}
                  aria-disabled={item.disabled}
                  onClick={(event) => {
                    if (item.disabled) {
                      event.preventDefault();
                      return;
                    }
                    setOpen(false);
                  }}
                >
                  {item.icon}<span>{item.label}</span>
                </Link>
              );
            }
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={className}
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
              >
                {item.icon}<span>{item.label}</span>
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </span>
  );
}
