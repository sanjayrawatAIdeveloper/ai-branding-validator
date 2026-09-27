export const GUIDELINE_SOURCE_TYPES = ["pdf", "json"] as const;

export type GuidelineSourceType = (typeof GUIDELINE_SOURCE_TYPES)[number];

export const GUIDELINE_CATEGORIES = [
  "color",
  "typography",
  "logo",
  "component",
  "spacing",
  "accessibility",
  "navigation",
  "content",
  "other",
] as const;

export type GuidelineCategory = (typeof GUIDELINE_CATEGORIES)[number];

export const GUIDELINE_SEVERITIES = ["critical", "warning", "info"] as const;

export type GuidelineSeverity = (typeof GUIDELINE_SEVERITIES)[number];

export interface NormalizedGuidelineRule {
  id: string;
  category: GuidelineCategory;
  title: string;
  description: string;
  severity: GuidelineSeverity;
  enabled: boolean;
  source: GuidelineSourceType;
}

export const GUIDELINE_PROCESSING_ERROR_CODES = [
  "MALFORMED_REQUEST",
  "MISSING_FILE",
  "FILE_TOO_LARGE",
  "UNSUPPORTED_FILE_TYPE",
  "INVALID_FILE_SIGNATURE",
  "MALFORMED_JSON",
  "INVALID_JSON_SCHEMA",
  "DUPLICATE_RULE_IDS",
  "PDF_ENCRYPTED_OR_CORRUPT",
  "PDF_PAGE_LIMIT",
  "PDF_TEXT_LIMIT",
  "PDF_TIMEOUT",
  "PDF_IMAGE_ONLY",
  "UNEXPECTED_ERROR",
] as const;

export type GuidelineProcessingErrorCode =
  (typeof GUIDELINE_PROCESSING_ERROR_CODES)[number];

export interface GuidelineProcessingErrorBody {
  code: GuidelineProcessingErrorCode;
  message: string;
  details?: string[];
}

export interface GuidelineProcessingSuccess {
  ok: true;
  sourceType: GuidelineSourceType;
  fileName: string;
  fileSize: number;
  pageCount: number | null;
  extractedCharacterCount: number | null;
  organization: string | null;
  rules: NormalizedGuidelineRule[];
  warnings: string[];
}

export interface GuidelineProcessingError {
  ok: false;
  error: GuidelineProcessingErrorBody;
}

export type GuidelineProcessingResponse =
  | GuidelineProcessingSuccess
  | GuidelineProcessingError;
