export type GuidelineSource = "pdf" | "json";

export type ProjectSetupField = "organizationName" | "homepageUrl" | "file";

export type ProjectSetupErrors = Partial<Record<ProjectSetupField, string>>;
