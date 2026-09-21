import type { Metric, MetricTone } from "@/types/dashboard";

const toneClass: Record<MetricTone, string> = {
  neutral: "text-muted",
  success: "text-success",
  warning: "text-warning",
  critical: "text-critical",
};

export function MetricsGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <section aria-labelledby="metrics-heading">
      <h2 id="metrics-heading" className="sr-only">
        Key metrics
      </h2>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <li
            key={metric.id}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-sm font-medium text-muted">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              {metric.value}
            </p>
            <p className={`mt-1 text-sm font-medium ${toneClass[metric.tone]}`}>
              {metric.delta}
            </p>
            <p className="mt-1 text-xs text-muted">{metric.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
