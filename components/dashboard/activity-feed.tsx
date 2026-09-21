import type { ActivityItem } from "@/types/dashboard";

export function ActivityFeed({ activity }: { activity: ActivityItem[] }) {
  return (
    <section
      aria-labelledby="activity-heading"
      className="rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <h2 id="activity-heading" className="text-sm font-semibold text-ink">
        Recent activity
      </h2>
      <ol className="mt-4 space-y-4">
        {activity.map((item) => (
          <li key={item.id} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted">
                {item.timestamp}
                <span aria-hidden="true"> · </span>
                {item.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
