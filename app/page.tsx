import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { CategoryList } from "@/components/dashboard/category-list";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { ProjectsTable } from "@/components/dashboard/projects-table";
import { WelcomePanel } from "@/components/dashboard/welcome-panel";
import {
  activity,
  categories,
  metrics,
  projects,
  welcome,
} from "@/components/dashboard/data";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <WelcomePanel welcome={welcome} />
      <MetricsGrid metrics={metrics} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CategoryList categories={categories} />
        <ActivityFeed activity={activity} />
      </div>
      <ProjectsTable projects={projects} />
    </div>
  );
}
