import { extractText, extractTextItems, getDocumentProxy } from "unpdf";
import {
  MAX_EXTRACTED_TEXT_LENGTH,
  MAX_PDF_PAGES,
  PDF_MAX_IMAGE_SIZE,
  PDF_PROCESSING_TIMEOUT_MS,
} from "@/lib/guidelines/constants";
import { createProcessingError } from "@/lib/guidelines/errors";
import {
  normalizePdfRules,
  type PdfLayoutTextItem,
} from "@/lib/guidelines/normalize-pdf-rules";
import type {
  GuidelineProcessingError,
  NormalizedGuidelineRule,
} from "@/types/guideline-processing";

export type PdfGuidelineParseResult =
  | {
      ok: true;
      pageCount: number;
      extractedCharacterCount: number;
      rules: NormalizedGuidelineRule[];
      warnings: string[];
    }
  | GuidelineProcessingError;

class PdfTimeoutError extends Error {
  constructor() {
    super("PDF processing timed out.");
    this.name = "PdfTimeoutError";
  }
}

class PdfPageLimitError extends Error {
  constructor() {
    super(`PDFs cannot exceed ${MAX_PDF_PAGES} pages.`);
    this.name = "PdfPageLimitError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function errorName(error: unknown): string {
  if (isRecord(error) && typeof error.name === "string") {
    return error.name;
  }

  if (error instanceof Error) {
    return error.name;
  }

  return "";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (isRecord(error) && typeof error.message === "string") {
    return error.message;
  }

  return "";
}

function isEncryptedOrCorrupt(error: unknown): boolean {
  const name = errorName(error).toLowerCase();
  const message = errorMessage(error).toLowerCase();

  return (
    name.includes("password") ||
    name.includes("invalidpdf") ||
    name.includes("formaterror") ||
    name.includes("missingpdf") ||
    name.includes("unexpectedresponse") ||
    message.includes("password") ||
    message.includes("encrypt") ||
    message.includes("invalid pdf") ||
    message.includes("corrupt")
  );
}

function hasMeaningfulText(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new PdfTimeoutError());
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

async function extractPdfContents(bytes: Uint8Array): Promise<{
  pageCount: number;
  text: string;
  layoutItems: PdfLayoutTextItem[][];
}> {
  const pdf = await getDocumentProxy(bytes, {
    maxImageSize: PDF_MAX_IMAGE_SIZE,
    stopAtErrors: true,
    disableFontFace: true,
    verbosity: 0,
  });

  try {
    if (pdf.numPages > MAX_PDF_PAGES) {
      throw new PdfPageLimitError();
    }

    const { totalPages, text } = await extractText(pdf, { mergePages: true });
    const layoutItems = await readLayoutItems(pdf);

    return { pageCount: totalPages, text, layoutItems };
  } finally {
    await pdf.loadingTask.destroy();
  }
}

async function readLayoutItems(
  pdf: Awaited<ReturnType<typeof getDocumentProxy>>,
): Promise<PdfLayoutTextItem[][]> {
  try {
    const { items } = await extractTextItems(pdf);
    return items.map((pageItems) =>
      pageItems.map((item) => ({
        str: item.str,
        x: item.x,
        y: item.y,
        width: item.width,
      })),
    );
  } catch {
    return [];
  }
}

export async function parsePdfGuidelines(
  bytes: Uint8Array,
): Promise<PdfGuidelineParseResult> {
  let extracted: {
    pageCount: number;
    text: string;
    layoutItems: PdfLayoutTextItem[][];
  };

  try {
    extracted = await withTimeout(
      extractPdfContents(bytes),
      PDF_PROCESSING_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof PdfTimeoutError) {
      return createProcessingError(
        "PDF_TIMEOUT",
        "PDF processing timed out. Try a smaller or simpler PDF.",
      );
    }

    if (error instanceof PdfPageLimitError) {
      return createProcessingError("PDF_PAGE_LIMIT", error.message);
    }

    if (isEncryptedOrCorrupt(error)) {
      return createProcessingError(
        "PDF_ENCRYPTED_OR_CORRUPT",
        "The PDF is encrypted, corrupted, or unreadable.",
      );
    }

    throw error;
  }

  if (!hasMeaningfulText(extracted.text)) {
    return createProcessingError(
      "PDF_IMAGE_ONLY",
      "No extractable text was found. Scanned or image-only PDFs require OCR, which is not supported in this phase.",
    );
  }

  if (extracted.text.length > MAX_EXTRACTED_TEXT_LENGTH) {
    return createProcessingError(
      "PDF_TEXT_LIMIT",
      "The extracted PDF text exceeds the 100,000 character limit.",
    );
  }

  const normalized = normalizePdfRules(extracted.text, extracted.layoutItems);

  return {
    ok: true,
    pageCount: extracted.pageCount,
    extractedCharacterCount: extracted.text.length,
    rules: normalized.rules,
    warnings: normalized.warnings,
  };
}
