import type { Project, ProjectStatus } from "@/types/project";

const statusClass: Record<ProjectStatus, string> = {
  Review: "bg-warning-soft text-warning",
  Good: "bg-success-soft text-success",
  Failed: "bg-critical-soft text-critical",
};

export function ProjectsTable({ projects }: { projects: Project[] }) {
  return (
    <section
      aria-labelledby="projects-heading"
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="px-5 py-4">
        <h2 id="projects-heading" className="text-sm font-semibold text-ink">
          Projects
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[40rem] w-full text-left text-sm">
          <thead className="border-y border-border bg-canvas/80 text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-5 py-2.5 font-semibold">
                Organization
              </th>
              <th scope="col" className="px-5 py-2.5 font-semibold">
                Domain
              </th>
              <th scope="col" className="px-5 py-2.5 font-semibold">
                Last scan
              </th>
              <th scope="col" className="px-5 py-2.5 font-semibold">
                Pages
              </th>
              <th scope="col" className="px-5 py-2.5 font-semibold">
                Score
              </th>
              <th scope="col" className="px-5 py-2.5 font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-border last:border-b-0">
                <th scope="row" className="px-5 py-3 font-medium text-ink">
                  {project.name}
                </th>
                <td className="px-5 py-3 text-muted">{project.domain}</td>
                <td className="px-5 py-3 text-muted">{project.lastScan}</td>
                <td className="px-5 py-3 text-muted">{project.pages} pages</td>
                <td className="px-5 py-3 font-medium text-ink">{project.score}%</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass[project.status]}`}
                  >
                    {project.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
