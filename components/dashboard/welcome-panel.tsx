import type { WelcomeState } from "@/types/dashboard";

export function WelcomePanel({ welcome }: { welcome: WelcomeState }) {
  return (
    <section
      aria-labelledby="welcome-heading"
      className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="welcome-heading" className="text-lg font-semibold tracking-tight text-ink">
            {welcome.heading}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">{welcome.description}</p>
        </div>
        <p className="inline-flex items-center gap-2 self-start rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          {welcome.status}
        </p>
      </div>
    </section>
  );
}
