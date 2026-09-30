import {
  isGuidelineCategory,
  isGuidelineSeverity,
} from "@/lib/guidelines/constants";
import {
  GUIDELINE_PROCESSING_ERROR_CODES,
  type GuidelineProcessingError,
  type GuidelineProcessingErrorCode,
  type GuidelineProcessingResponse,
  type GuidelineProcessingSuccess,
  type NormalizedGuidelineRule,
} from "@/types/guideline-processing";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isErrorCode(value: string): value is GuidelineProcessingErrorCode {
  return (GUIDELINE_PROCESSING_ERROR_CODES as readonly string[]).includes(value);
}

function readRule(value: unknown): NormalizedGuidelineRule | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.category !== "string" ||
    !isGuidelineCategory(value.category) ||
    typeof value.title !== "string" ||
    typeof value.description !== "string" ||
    typeof value.severity !== "string" ||
    !isGuidelineSeverity(value.severity) ||
    typeof value.enabled !== "boolean" ||
    (value.source !== "pdf" && value.source !== "json")
  ) {
    return null;
  }

  return {
    id: value.id,
    category: value.category,
    title: value.title,
    description: value.description,
    severity: value.severity,
    enabled: value.enabled,
    source: value.source,
  };
}

export function readGuidelineProcessingResponse(
  value: unknown,
): GuidelineProcessingResponse | null {
  if (!isRecord(value) || typeof value.ok !== "boolean") {
    return null;
  }

  if (!value.ok) {
    if (!isRecord(value.error) || typeof value.error.message !== "string") {
      return null;
    }

    const code =
      typeof value.error.code === "string" && isErrorCode(value.error.code)
        ? value.error.code
        : "UNEXPECTED_ERROR";

    const error: GuidelineProcessingError["error"] = {
      code,
      message: value.error.message,
    };

    if (Array.isArray(value.error.details)) {
      const details = value.error.details.filter(
        (item): item is string => typeof item === "string",
      );
      if (details.length > 0) {
        error.details = details;
      }
    }

    return { ok: false, error };
  }

  if (
    (value.sourceType !== "pdf" && value.sourceType !== "json") ||
    typeof value.fileName !== "string" ||
    typeof value.fileSize !== "number" ||
    !Array.isArray(value.rules) ||
    !Array.isArray(value.warnings)
  ) {
    return null;
  }

  const rules = value.rules
    .map((rule) => readRule(rule))
    .filter((rule): rule is NormalizedGuidelineRule => rule !== null);

  const success: GuidelineProcessingSuccess = {
    ok: true,
    sourceType: value.sourceType,
    fileName: value.fileName,
    fileSize: value.fileSize,
    pageCount: typeof value.pageCount === "number" ? value.pageCount : null,
    extractedCharacterCount:
      typeof value.extractedCharacterCount === "number"
        ? value.extractedCharacterCount
        : null,
    organization:
      typeof value.organization === "string" ? value.organization : null,
    rules,
    warnings: value.warnings.filter(
      (item): item is string => typeof item === "string",
    ),
  };

  return success;
}
