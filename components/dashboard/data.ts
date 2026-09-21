import type { ActivityItem, ComplianceCategory, Metric, WelcomeState } from "@/types/dashboard";
import type { Project } from "@/types/project";

export const welcome: WelcomeState = {
  heading: "Good afternoon.",
  description: "Here is the compliance health across your active brand projects.",
  status: "All systems operational",
};

export const metrics: Metric[] = [
  {
    id: "overall-compliance",
    label: "Overall compliance",
    value: "84.6%",
    delta: "+3.2%",
    detail: "Across 3 active projects",
    tone: "success",
  },
  {
    id: "pages-scanned",
    label: "Pages scanned",
    value: "47",
    delta: "+12 this week",
    detail: "Last scan 18 minutes ago",
    tone: "success",
  },
  {
    id: "critical-issues",
    label: "Critical issues",
    value: "4",
    delta: "Needs attention",
    detail: "2 colors, 1 logo, 1 contrast",
    tone: "critical",
  },
  {
    id: "warnings",
    label: "Warnings",
    value: "17",
    delta: "6 resolved",
    detail: "Mostly typography and spacing",
    tone: "warning",
  },
];

export const categories: ComplianceCategory[] = [
  {
    id: "brand-colors",
    name: "Brand colors",
    percent: 90,
    passed: 36,
    total: 40,
  },
  {
    id: "typography",
    name: "Typography",
    percent: 81,
    passed: 29,
    total: 36,
  },
  {
    id: "components",
    name: "Components",
    percent: 75,
    passed: 24,
    total: 32,
  },
  {
    id: "accessibility",
    name: "Accessibility",
    percent: 93,
    passed: 43,
    total: 46,
  },
];

export const activity: ActivityItem[] = [
  {
    id: "acme-scan",
    title: "Acme website scan completed",
    timestamp: "18 minutes ago",
    detail: "10 pages · 82%",
  },
  {
    id: "acme-rules",
    title: "Brand rules updated",
    timestamp: "Yesterday",
    detail: "Acme Corporation",
  },
  {
    id: "northstar-critical",
    title: "Four critical issues detected",
    timestamp: "September 19",
    detail: "Northstar Digital",
  },
];

export const projects: Project[] = [
  {
    id: "acme",
    name: "Acme Corporation",
    domain: "acme.com",
    lastScan: "18 minutes ago",
    pages: 10,
    score: 82,
    status: "Review",
  },
  {
    id: "northstar",
    name: "Northstar Digital",
    domain: "northstar.design",
    lastScan: "2 days ago",
    pages: 22,
    score: 94,
    status: "Good",
  },
  {
    id: "orbit",
    name: "Orbit Finance",
    domain: "orbit.money",
    lastScan: "5 days ago",
    pages: 15,
    score: 67,
    status: "Failed",
  },
];
