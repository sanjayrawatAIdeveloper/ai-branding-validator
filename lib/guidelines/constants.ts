import {
  GUIDELINE_CATEGORIES,
  GUIDELINE_SEVERITIES,
  type GuidelineCategory,
  type GuidelineSeverity,
  type GuidelineSourceType,
} from "@/types/guideline-processing";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_PAGES = 50;
export const MAX_EXTRACTED_TEXT_LENGTH = 100_000;
export const PDF_PROCESSING_TIMEOUT_MS = 10_000;
export const PDF_MAX_IMAGE_SIZE = 16_777_216;
export const PDF_SIGNATURE = "%PDF-";

export const MAX_RULES = 200;
export const MAX_VERSION_LENGTH = 32;
export const MAX_ORGANIZATION_LENGTH = 200;
export const RULE_ID_MIN_LENGTH = 2;
export const RULE_ID_MAX_LENGTH = 50;
export const RULE_TITLE_MIN_LENGTH = 2;
export const RULE_TITLE_MAX_LENGTH = 120;
export const RULE_DESCRIPTION_MIN_LENGTH = 2;
export const RULE_DESCRIPTION_MAX_LENGTH = 1000;

export const GENERIC_MIME_TYPES = new Set([
  "",
  "application/octet-stream",
  "binary/octet-stream",
]);

export const PDF_MIME_TYPES = new Set(["application/pdf"]);
export const JSON_MIME_TYPES = new Set([
  "application/json",
  "text/json",
  "text/plain",
]);

export const GUIDELINE_CATEGORY_SET = new Set<string>(GUIDELINE_CATEGORIES);
export const GUIDELINE_SEVERITY_SET = new Set<string>(GUIDELINE_SEVERITIES);

export const PDF_PREFIX_CATEGORY_MAP: Readonly<Record<string, GuidelineCategory>> =
  {
    COLOR: "color",
    TYPE: "typography",
    TYPOGRAPHY: "typography",
    FONT: "typography",
    LOGO: "logo",
    COMPONENT: "component",
    BUTTON: "component",
    SPACING: "spacing",
    SPACE: "spacing",
    LAYOUT: "spacing",
    ACCESSIBILITY: "accessibility",
    A11Y: "accessibility",
    WCAG: "accessibility",
    CONTRAST: "accessibility",
    NAVIGATION: "navigation",
    HEADER: "navigation",
    FOOTER: "navigation",
    CONTENT: "content",
    VOICE: "content",
    TONE: "content",
  };

export const NO_EXPLICIT_RULE_IDS_WARNING =
  "Text was extracted, but no explicit structured rule IDs were found.";

export const AI_INTERPRETATION_LATER_WARNING =
  "AI-assisted interpretation will be added in a later phase.";

export function isGuidelineCategory(
  value: string,
): value is GuidelineCategory {
  return GUIDELINE_CATEGORY_SET.has(value);
}

export function isGuidelineSeverity(
  value: string,
): value is GuidelineSeverity {
  return GUIDELINE_SEVERITY_SET.has(value);
}

export function isGuidelineSourceType(
  value: string,
): value is GuidelineSourceType {
  return value === "pdf" || value === "json";
}

export function categoryFromPdfPrefix(prefix: string): GuidelineCategory {
  return PDF_PREFIX_CATEGORY_MAP[prefix] ?? "other";
}

export const PDF_SEVERITY_LABEL_MAP: Readonly<
  Record<string, GuidelineSeverity>
> = {
  critical: "critical",
  high: "critical",
  medium: "warning",
  low: "info",
  info: "info",
};

export function severityFromPdfLabel(value: string): GuidelineSeverity | null {
  const mapped = PDF_SEVERITY_LABEL_MAP[value.trim().toLowerCase()];
  return mapped ?? null;
}
