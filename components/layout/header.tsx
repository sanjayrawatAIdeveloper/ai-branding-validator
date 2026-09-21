import type { ReactNode } from "react";
import Link from "next/link";

type HeaderProps = {
  navigationToggle: ReactNode;
};

export function Header({ navigationToggle }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="pt-0.5 lg:hidden">{navigationToggle}</div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              OVERVIEW
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              Brand compliance
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
              Monitor branding and accessibility across active website
              projects.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-ink shadow-sm transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
              <path
                d="M10 3.5A4.5 4.5 0 0 0 5.5 8v2.2c0 .5-.2 1-.5 1.4L4 13h12l-1-1.4a2 2 0 0 1-.5-1.4V8A4.5 4.5 0 0 0 10 3.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M8.2 15.2a1.8 1.8 0 0 0 3.6 0"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <Link
            href="/projects/new"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            New Project
          </Link>
        </div>
      </div>
    </header>
  );
}
