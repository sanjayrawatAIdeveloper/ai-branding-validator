export type SystemStatus = "All systems operational";

export type WelcomeState = {
  heading: string;
  description: string;
  status: SystemStatus;
};

export type MetricTone = "neutral" | "success" | "warning" | "critical";

export type Metric = {
  id: string;
  label: string;
  value: string;
  delta: string;
  detail: string;
  tone: MetricTone;
};

export type ComplianceCategory = {
  id: string;
  name: string;
  percent: number;
  passed: number;
  total: number;
};

export type ActivityItem = {
  id: string;
  title: string;
  timestamp: string;
  detail: string;
};
