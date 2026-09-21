import Link from "next/link";

const navItems = [
  { id: "dashboard", label: "Dashboard", href: "/" as const },
  { id: "projects", label: "Projects" },
  { id: "new-scan", label: "New Scan" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
] as const;

const navClassName =
  "flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy";

export function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col bg-navy text-white">
      <div className="flex items-center gap-3 px-5 pt-6 pb-5 pr-12 lg:pr-5">
        <BrandLensMark />
        <div>
          <p className="text-sm font-semibold tracking-tight">BrandLens</p>
          <p className="text-xs text-white/65">Compliance AI</p>
        </div>
      </div>
      <nav aria-label="Application" className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          if ("href" in item) {
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current="page"
                className={`${navClassName} bg-white/12 text-white`}
              >
                <NavIcon id={item.id} />
                {item.label}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              className={`${navClassName} text-white/75 hover:bg-white/8 hover:text-white`}
            >
              <NavIcon id={item.id} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-white/10 px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
          Workspace
        </p>
        <p className="mt-1 text-sm font-medium text-white">POC Workspace</p>
      </div>
    </aside>
  );
}

function BrandLensMark() {
  return (
    <span
      aria-hidden="true"
      className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="11" cy="11" r="2.4" fill="currentColor" />
        <path
          d="M15.8 15.8 20 20"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function NavIcon({ id }: { id: (typeof navItems)[number]["id"] }) {
  const iconClass = "mr-3 h-4 w-4 shrink-0";

  switch (id) {
    case "dashboard":
      return (
        <svg viewBox="0 0 16 16" className={iconClass} fill="currentColor" aria-hidden="true">
          <path d="M2 2h5v5H2V2Zm7 0h5v7H9V2ZM2 9h5v5H2V9Zm7 2h5v3H9v-3Z" />
        </svg>
      );
    case "projects":
      return (
        <svg viewBox="0 0 16 16" className={iconClass} fill="currentColor" aria-hidden="true">
          <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2H6l1.2 1.5H12.5A1.5 1.5 0 0 1 14 5v7.5A1.5 1.5 0 0 1 12.5 14h-9A1.5 1.5 0 0 1 2 12.5v-9Z" />
        </svg>
      );
    case "new-scan":
      return (
        <svg viewBox="0 0 16 16" className={iconClass} fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M10.2 10.2 13.5 13.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "reports":
      return (
        <svg viewBox="0 0 16 16" className={iconClass} fill="currentColor" aria-hidden="true">
          <path d="M3 1.5h6.5L13 5v9.5H3v-13Zm6.5 0V5H13" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 16 16" className={iconClass} fill="currentColor" aria-hidden="true">
          <path d="M8 5.2A2.8 2.8 0 1 1 8 10.8 2.8 2.8 0 0 1 8 5.2Zm-6.2 3.3 1.7-.3c.1-.4.3-.7.5-1L3 5.7l1.3-1.3 1.5 1c.3-.2.6-.4 1-.5l.3-1.7h1.8l.3 1.7c.4.1.7.3 1 .5l1.5-1 1.3 1.3-1 1.5c.2.3.4.6.5 1l1.7.3v1.8l-1.7.3c-.1.4-.3.7-.5 1l1 1.5-1.3 1.3-1.5-1c-.3.2-.6.4-1 .5l-.3 1.7H7.1l-.3-1.7c-.4-.1-.7-.3-1-.5l-1.5 1-1.3-1.3 1-1.5c-.2-.3-.4-.6-.5-1l-1.7-.3V8.5Z" />
        </svg>
      );
  }
}
