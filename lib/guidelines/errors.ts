import type {
  GuidelineProcessingError,
  GuidelineProcessingErrorBody,
  GuidelineProcessingErrorCode,
} from "@/types/guideline-processing";

export function createProcessingError(
  code: GuidelineProcessingErrorCode,
  message: string,
  details?: string[],
): GuidelineProcessingError {
  const error: GuidelineProcessingErrorBody = { code, message };

  if (details && details.length > 0) {
    error.details = details;
  }

  return { ok: false, error };
}

export function statusForProcessingError(
  code: GuidelineProcessingErrorCode,
): number {
  switch (code) {
    case "MALFORMED_REQUEST":
    case "MISSING_FILE":
      return 400;
    case "FILE_TOO_LARGE":
      return 413;
    case "UNSUPPORTED_FILE_TYPE":
    case "INVALID_FILE_SIGNATURE":
      return 415;
    case "MALFORMED_JSON":
    case "INVALID_JSON_SCHEMA":
    case "DUPLICATE_RULE_IDS":
    case "PDF_ENCRYPTED_OR_CORRUPT":
    case "PDF_PAGE_LIMIT":
    case "PDF_TEXT_LIMIT":
    case "PDF_TIMEOUT":
    case "PDF_IMAGE_ONLY":
      return 422;
    default:
      return 500;
  }
}
