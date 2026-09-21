import { ProjectSetupForm } from "@/components/projects/project-setup-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New project",
};

export default function NewProjectPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        NEW PROJECT
      </p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        Create a project
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
        Enter the organization, public homepage, and branding guideline file.
      </p>
      <div className="mt-6">
        <ProjectSetupForm />
      </div>
    </div>
  );
}
