"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

type MobileNavProps = {
  sidebar: ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function MobileNav({ sidebar }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const panel = panelRef.current;
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab" || !panel) {
        return;
      }

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    const desktop = window.matchMedia("(min-width: 1024px)");
    function onViewportChange() {
      if (desktop.matches) {
        close();
      }
    }
    desktop.addEventListener("change", onViewportChange);

    const openButton = openButtonRef.current;

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onViewportChange);
      document.body.style.overflow = "";
      openButton?.focus();
    };
  }, [close, open]);

  return (
    <>
      <button
        ref={openButtonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-ink shadow-sm hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={() => setOpen(true)}
      >
        <span className="sr-only">Open navigation</span>
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M3.5 5.5h13v1.5h-13V5.5Zm0 3.75h13v1.5h-13v-1.5Zm0 3.75h13V14.5h-13v-1.5Z" />
        </svg>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close navigation"
            className="absolute inset-0 bg-navy/50"
            onClick={close}
          />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Application"
            className="absolute inset-y-0 left-0 flex w-64 flex-col bg-navy shadow-xl"
          >
            <div className="absolute top-3 right-3 z-10">
              <button
                ref={closeButtonRef}
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                onClick={close}
              >
                <span className="sr-only">Close navigation</span>
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M5.3 5.3 10 10l4.7-4.7 1 1L11 11l4.7 4.7-1 1L10 12l-4.7 4.7-1-1L9 11 4.3 6.3l1-1Z" />
                </svg>
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      ) : null}
    </>
  );
}
