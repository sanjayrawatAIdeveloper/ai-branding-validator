import {
  GENERIC_MIME_TYPES,
  JSON_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  PDF_MIME_TYPES,
  PDF_SIGNATURE,
  isGuidelineSourceType,
} from "@/lib/guidelines/constants";
import { createProcessingError } from "@/lib/guidelines/errors";
import type {
  GuidelineProcessingError,
  GuidelineSourceType,
} from "@/types/guideline-processing";

export type ValidatedGuidelineFile = {
  sourceType: GuidelineSourceType;
  fileName: string;
  fileSize: number;
  bytes: Uint8Array;
};

export type FileValidationResult =
  | { ok: true; file: ValidatedGuidelineFile }
  | GuidelineProcessingError;

function primaryMimeType(mimeType: string): string {
  return mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
}

function isAllowedMimeType(
  sourceType: GuidelineSourceType,
  mimeType: string,
): boolean {
  if (GENERIC_MIME_TYPES.has(mimeType)) {
    return true;
  }

  return sourceType === "pdf"
    ? PDF_MIME_TYPES.has(mimeType)
    : JSON_MIME_TYPES.has(mimeType);
}

function hasExpectedExtension(
  fileName: string,
  sourceType: GuidelineSourceType,
): boolean {
  const lower = fileName.toLowerCase();
  return sourceType === "pdf" ? lower.endsWith(".pdf") : lower.endsWith(".json");
}

function hasPdfSignature(bytes: Uint8Array): boolean {
  if (bytes.byteLength < PDF_SIGNATURE.length) {
    return false;
  }

  for (let index = 0; index < PDF_SIGNATURE.length; index += 1) {
    if (bytes[index] !== PDF_SIGNATURE.charCodeAt(index)) {
      return false;
    }
  }

  return true;
}

export async function validateGuidelineFile(
  sourceTypeValue: FormDataEntryValue | null,
  fileValue: FormDataEntryValue | null,
): Promise<FileValidationResult> {
  if (typeof sourceTypeValue !== "string" || !isGuidelineSourceType(sourceTypeValue)) {
    return createProcessingError(
      "MALFORMED_REQUEST",
      "Choose a PDF or JSON guideline source.",
    );
  }

  if (!(fileValue instanceof File)) {
    return createProcessingError(
      "MISSING_FILE",
      "Choose a guideline file to process.",
    );
  }

  const fileName = fileValue.name.trim();
  if (fileName === "") {
    return createProcessingError(
      "MALFORMED_REQUEST",
      "Choose a guideline file to process.",
    );
  }

  if (!hasExpectedExtension(fileName, sourceTypeValue)) {
    return createProcessingError(
      "UNSUPPORTED_FILE_TYPE",
      sourceTypeValue === "pdf"
        ? "Upload a .pdf file when PDF is selected."
        : "Upload a .json file when JSON is selected.",
    );
  }

  if (fileValue.size > MAX_FILE_SIZE_BYTES) {
    return createProcessingError(
      "FILE_TOO_LARGE",
      "The guideline file must be 5 MB or smaller.",
    );
  }

  const mimeType = primaryMimeType(fileValue.type);
  if (!isAllowedMimeType(sourceTypeValue, mimeType)) {
    return createProcessingError(
      "UNSUPPORTED_FILE_TYPE",
      sourceTypeValue === "pdf"
        ? "Upload a PDF file."
        : "Upload a JSON file.",
    );
  }

  const bytes = new Uint8Array(await fileValue.arrayBuffer());

  if (bytes.byteLength > MAX_FILE_SIZE_BYTES) {
    return createProcessingError(
      "FILE_TOO_LARGE",
      "The guideline file must be 5 MB or smaller.",
    );
  }

  if (sourceTypeValue === "pdf" && !hasPdfSignature(bytes)) {
    return createProcessingError(
      "INVALID_FILE_SIGNATURE",
      "The file is not a valid PDF. The contents do not match a PDF file.",
    );
  }

  return {
    ok: true,
    file: {
      sourceType: sourceTypeValue,
      fileName,
      fileSize: bytes.byteLength,
      bytes,
    },
  };
}
