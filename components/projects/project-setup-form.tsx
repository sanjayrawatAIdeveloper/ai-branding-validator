"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { GuidelineProcessingResult } from "@/components/projects/guideline-processing-result";
import { MAX_FILE_SIZE_BYTES } from "@/lib/guidelines/constants";
import { formatFileSize } from "@/lib/guidelines/format";
import { readGuidelineProcessingResponse } from "@/lib/guidelines/read-response";
import type {
  GuidelineProcessingErrorBody,
  GuidelineProcessingSuccess,
} from "@/types/guideline-processing";
import type {
  GuidelineSource,
  ProjectSetupErrors,
} from "@/types/project-setup";

const inputClassName =
  "mt-2 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-ink shadow-sm outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const errorClassName = "mt-2 text-sm text-critical";

const unexpectedError: GuidelineProcessingErrorBody = {
  code: "UNEXPECTED_ERROR",
  message: "Guidelines could not be processed. Try again.",
};

export function ProjectSetupForm() {
  const [organizationName, setOrganizationName] = useState("");
  const [homepageUrl, setHomepageUrl] = useState("");
  const [guidelineSource, setGuidelineSource] = useState<GuidelineSource>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<ProjectSetupErrors>({});
  const [serverError, setServerError] = useState<GuidelineProcessingErrorBody | null>(
    null,
  );
  const [result, setResult] = useState<GuidelineProcessingSuccess | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const organizationRef = useRef<HTMLInputElement>(null);
  const homepageRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const processingRequestId = useRef(0);
  const inFlightRef = useRef(false);

  const organizationErrorId = useId();
  const homepageErrorId = useId();
  const fileErrorId = useId();
  const fileHelpId = useId();
  const serverErrorHeadingId = useId();

  useEffect(() => {
    if (serverError) {
      errorRef.current?.focus();
    }
  }, [serverError]);

  useEffect(() => {
    if (result) {
      resultRef.current?.focus();
    }
  }, [result]);

  function clearProcessingOutcome() {
    processingRequestId.current += 1;
    inFlightRef.current = false;
    setResult(null);
    setServerError(null);
    setIsProcessing(false);
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSourceChange(source: GuidelineSource) {
    setGuidelineSource(source);
    clearFile();
    setErrors((current) => ({ ...current, file: undefined }));
    clearProcessingOutcome();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlightRef.current || isProcessing) {
      return;
    }

    const nextErrors = validateProjectSetup({
      organizationName,
      homepageUrl,
      guidelineSource,
      file,
    });

    setErrors(nextErrors);

    if (nextErrors.organizationName) {
      clearProcessingOutcome();
      organizationRef.current?.focus();
      return;
    }

    if (nextErrors.homepageUrl) {
      clearProcessingOutcome();
      homepageRef.current?.focus();
      return;
    }

    if (nextErrors.file || !file) {
      clearProcessingOutcome();
      fileInputRef.current?.focus();
      return;
    }

    const selectedFile = file;
    const requestId = processingRequestId.current + 1;
    processingRequestId.current = requestId;
    inFlightRef.current = true;

    setOrganizationName(organizationName.trim());
    setHomepageUrl(homepageUrl.trim());
    setServerError(null);
    setResult(null);
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("sourceType", guidelineSource);
    formData.append("guidelineFile", selectedFile);

    try {
      const response = await fetch("/api/guidelines/process", {
        method: "POST",
        body: formData,
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (processingRequestId.current !== requestId) {
        return;
      }

      const parsed = readGuidelineProcessingResponse(payload);
      if (parsed?.ok) {
        setServerError(null);
        setResult(parsed);
        return;
      }

      setResult(null);
      setServerError(parsed?.error ?? unexpectedError);
    } catch {
      if (processingRequestId.current !== requestId) {
        return;
      }

      setResult(null);
      setServerError({
        code: "UNEXPECTED_ERROR",
        message:
          "Guidelines could not be processed. Check your connection and try again.",
      });
    } finally {
      if (processingRequestId.current === requestId) {
        inFlightRef.current = false;
        setIsProcessing(false);
      }
    }
  }

  const accept = guidelineSource === "pdf" ? ".pdf,application/pdf" : ".json,application/json";
  const fileTypeLabel = guidelineSource === "pdf" ? "PDF" : "JSON";

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {serverError ? (
        <div
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          aria-labelledby={serverErrorHeadingId}
          className="rounded-xl border border-critical/20 bg-critical-soft px-4 py-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <h3 id={serverErrorHeadingId} className="font-semibold text-critical">
            Guidelines could not be processed
          </h3>
          <p className="mt-1">Error: {serverError.message}</p>
          {serverError.details && serverError.details.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {serverError.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h3 className="text-sm font-semibold text-ink">Project details</h3>
        <p className="mt-1 text-sm text-muted">
          Upload a PDF or JSON guideline file to extract structured rules. The
          file is processed in memory and is not stored.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="organization-name" className="text-sm font-medium text-ink">
              Organization name{" "}
              <span aria-hidden="true" className="text-critical">
                *
              </span>
              <span className="sr-only">required</span>
            </label>
            <input
              ref={organizationRef}
              id="organization-name"
              name="organizationName"
              type="text"
              autoComplete="organization"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.organizationName)}
              aria-describedby={
                errors.organizationName ? organizationErrorId : undefined
              }
              value={organizationName}
              onChange={(event) => {
                setOrganizationName(event.target.value);
                clearProcessingOutcome();
              }}
              className={inputClassName}
            />
            {errors.organizationName ? (
              <p id={organizationErrorId} className={errorClassName}>
                Error: {errors.organizationName}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="homepage-url" className="text-sm font-medium text-ink">
              Public website homepage URL{" "}
              <span aria-hidden="true" className="text-critical">
                *
              </span>
              <span className="sr-only">required</span>
            </label>
            <input
              ref={homepageRef}
              id="homepage-url"
              name="homepageUrl"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://example.com"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.homepageUrl)}
              aria-describedby={errors.homepageUrl ? homepageErrorId : undefined}
              value={homepageUrl}
              onChange={(event) => {
                setHomepageUrl(event.target.value);
                clearProcessingOutcome();
              }}
              className={inputClassName}
            />
            {errors.homepageUrl ? (
              <p id={homepageErrorId} className={errorClassName}>
                Error: {errors.homepageUrl}
              </p>
            ) : null}
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-ink">
              Branding guideline source{" "}
              <span aria-hidden="true" className="text-critical">
                *
              </span>
              <span className="sr-only">required</span>
            </legend>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SourceOption
                label="PDF document"
                value="pdf"
                checked={guidelineSource === "pdf"}
                onChange={handleSourceChange}
              />
              <SourceOption
                label="Structured JSON"
                value="json"
                checked={guidelineSource === "json"}
                onChange={handleSourceChange}
              />
            </div>
          </fieldset>

          <div>
            <label htmlFor="guideline-file" className="text-sm font-medium text-ink">
              Guideline file{" "}
              <span aria-hidden="true" className="text-critical">
                *
              </span>
              <span className="sr-only">required</span>
            </label>
            <input
              ref={fileInputRef}
              id="guideline-file"
              name="guidelineFile"
              type="file"
              accept={accept}
              required
              aria-required="true"
              aria-invalid={Boolean(errors.file)}
              aria-describedby={
                errors.file ? `${fileHelpId} ${fileErrorId}` : fileHelpId
              }
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
                setErrors((current) => ({ ...current, file: undefined }));
                clearProcessingOutcome();
              }}
              className="mt-2 w-full text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
            <p id={fileHelpId} className="mt-2 text-xs text-muted">
              Accepts {fileTypeLabel} files up to 5 MB. The file is processed in
              memory and is not stored.
            </p>
            {file ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-canvas px-3 py-2.5">
                <p className="min-w-0 text-sm text-ink">
                  <span className="font-medium">{file.name}</span>
                  <span className="text-muted"> · {formatFileSize(file.size)}</span>
                </p>
                <button
                  type="button"
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-ink hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  onClick={() => {
                    clearFile();
                    setErrors((current) => ({ ...current, file: undefined }));
                    clearProcessingOutcome();
                    fileInputRef.current?.focus();
                  }}
                >
                  Remove file
                </button>
              </div>
            ) : null}
            {errors.file ? (
              <p id={fileErrorId} className={errorClassName}>
                Error: {errors.file}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {isProcessing ? (
        <p role="status" className="text-sm text-muted">
          Processing guidelines…
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-ink shadow-sm transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isProcessing}
          aria-busy={isProcessing}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessing ? "Processing..." : "Continue"}
        </button>
      </div>

      {result ? (
        <GuidelineProcessingResult result={result} resultRef={resultRef} />
      ) : null}
    </form>
  );
}

function SourceOption({
  label,
  value,
  checked,
  onChange,
}: {
  label: string;
  value: GuidelineSource;
  checked: boolean;
  onChange: (value: GuidelineSource) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm font-medium text-ink ${
        checked ? "border-primary bg-card" : "border-border bg-canvas"
      }`}
    >
      <input
        type="radio"
        name="guidelineSource"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="h-4 w-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />
      {label}
    </label>
  );
}

function validateProjectSetup({
  organizationName,
  homepageUrl,
  guidelineSource,
  file,
}: {
  organizationName: string;
  homepageUrl: string;
  guidelineSource: GuidelineSource;
  file: File | null;
}): ProjectSetupErrors {
  const nextErrors: ProjectSetupErrors = {};

  if (organizationName.trim() === "") {
    nextErrors.organizationName = "Enter an organization name.";
  }

  const trimmedUrl = homepageUrl.trim();
  if (trimmedUrl === "") {
    nextErrors.homepageUrl = "Enter a website homepage URL.";
  } else {
    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        nextErrors.homepageUrl = "Only http:// and https:// URLs are allowed.";
      }
    } catch {
      nextErrors.homepageUrl = "Enter a valid website URL.";
    }
  }

  if (!file) {
    nextErrors.file = `Choose a ${guidelineSource === "pdf" ? ".pdf" : ".json"} file.`;
  } else if (!fileNameMatchesSource(file.name, guidelineSource)) {
    nextErrors.file =
      guidelineSource === "pdf"
        ? "Choose a .pdf file."
        : "Choose a .json file.";
  } else if (file.size > MAX_FILE_SIZE_BYTES) {
    nextErrors.file = "The guideline file must be 5 MB or smaller.";
  }

  return nextErrors;
}

function fileNameMatchesSource(fileName: string, source: GuidelineSource): boolean {
  const lower = fileName.toLowerCase();
  return source === "pdf" ? lower.endsWith(".pdf") : lower.endsWith(".json");
}
