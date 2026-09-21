export type ProjectStatus = "Review" | "Good" | "Failed";

export type Project = {
  id: string;
  name: string;
  domain: string;
  lastScan: string;
  pages: number;
  score: number;
  status: ProjectStatus;
};
