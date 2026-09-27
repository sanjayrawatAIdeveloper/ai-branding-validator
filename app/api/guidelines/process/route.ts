import { NextResponse } from "next/server";
import { createProcessingError, statusForProcessingError } from "@/lib/guidelines/errors";
import { parseJsonGuidelines } from "@/lib/guidelines/parse-json-guidelines";
import { parsePdfGuidelines } from "@/lib/guidelines/parse-pdf-guidelines";
import { validateGuidelineFile } from "@/lib/guidelines/validate-file";
import type {
  GuidelineProcessingError,
  GuidelineProcessingSuccess,
} from "@/types/guideline-processing";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function POST(request: Request) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return jsonError(
        createProcessingError(
          "MALFORMED_REQUEST",
          "The request must include a guideline file.",
        ),
      );
    }

    const validation = await validateGuidelineFile(
      formData.get("sourceType"),
      formData.get("guidelineFile"),
    );

    if (!validation.ok) {
      return jsonError(validation);
    }

    const { sourceType, fileName, fileSize, bytes } = validation.file;

    if (sourceType === "json") {
      const parsed = parseJsonGuidelines(bytes);
      if (!parsed.ok) {
        return jsonError(parsed);
      }

      const body: GuidelineProcessingSuccess = {
        ok: true,
        sourceType,
        fileName,
        fileSize,
        pageCount: null,
        extractedCharacterCount: null,
        organization: parsed.organization,
        rules: parsed.rules,
        warnings: [],
      };

      return NextResponse.json(body);
    }

    const parsed = await parsePdfGuidelines(bytes);
    if (!parsed.ok) {
      return jsonError(parsed);
    }

    const body: GuidelineProcessingSuccess = {
      ok: true,
      sourceType,
      fileName,
      fileSize,
      pageCount: parsed.pageCount,
      extractedCharacterCount: parsed.extractedCharacterCount,
      organization: null,
      rules: parsed.rules,
      warnings: parsed.warnings,
    };

    return NextResponse.json(body);
  } catch {
    return jsonError(
      createProcessingError(
        "UNEXPECTED_ERROR",
        "Guidelines could not be processed. Try again.",
      ),
    );
  }
}

function jsonError(error: GuidelineProcessingError) {
  return NextResponse.json(error, {
    status: statusForProcessingError(error.error.code),
  });
}
