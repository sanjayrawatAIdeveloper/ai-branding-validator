import type { ComplianceCategory } from "@/types/dashboard";

export function CategoryList({ categories }: { categories: ComplianceCategory[] }) {
  return (
    <section
      aria-labelledby="categories-heading"
      className="rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <h2 id="categories-heading" className="text-sm font-semibold text-ink">
        Compliance categories
      </h2>
      <ul className="mt-4 space-y-4">
        {categories.map((category) => (
          <li key={category.id}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-ink">{category.name}</p>
              <p className="text-sm font-semibold text-ink">{category.percent}%</p>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-canvas"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={category.percent}
              aria-label={`${category.name} compliance`}
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${category.percent}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {category.percent}%, {category.passed} of {category.total} checks
              passed
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
