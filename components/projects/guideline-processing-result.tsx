import type { RefObject } from "react";
import { formatCount, formatFileSize } from "@/lib/guidelines/format";
import type {
  GuidelineProcessingSuccess,
  NormalizedGuidelineRule,
} from "@/types/guideline-processing";

const severityClassName: Record<NormalizedGuidelineRule["severity"], string> = {
  critical: "bg-critical-soft text-critical",
  warning: "bg-warning-soft text-warning",
  info: "bg-canvas text-ink",
};

export function GuidelineProcessingResult({
  result,
  resultRef,
}: {
  result: GuidelineProcessingSuccess;
  resultRef: RefObject<HTMLDivElement | null>;
}) {
  const sourceLabel = result.sourceType === "pdf" ? "PDF" : "JSON";

  return (
    <section
      ref={resultRef}
      role="status"
      tabIndex={-1}
      aria-labelledby="guideline-processing-heading"
      className="rounded-xl border border-success/20 bg-card p-5 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-6"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-success">
        Success
      </p>
      <h3
        id="guideline-processing-heading"
        className="mt-1 text-base font-semibold text-ink"
      >
        Guidelines processed
      </h3>
      <p className="mt-1 text-sm text-muted">
        Structured rules were extracted from the uploaded file. Nothing was
        saved.
      </p>

      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ResultStat label="Source type" value={sourceLabel} />
        <ResultStat label="File name" value={result.fileName} />
        <ResultStat label="File size" value={formatFileSize(result.fileSize)} />
        <ResultStat
          label="Normalized rules"
          value={formatCount(result.rules.length, "rule", "rules")}
        />
        {result.pageCount !== null ? (
          <ResultStat
            label="PDF page count"
            value={formatCount(result.pageCount, "page", "pages")}
          />
        ) : null}
        {result.extractedCharacterCount !== null ? (
          <ResultStat
            label="Extracted characters"
            value={result.extractedCharacterCount.toLocaleString("en-US")}
          />
        ) : null}
        {result.organization ? (
          <ResultStat label="Organization" value={result.organization} />
        ) : null}
      </dl>

      {result.warnings.length > 0 ? (
        <div className="mt-4 rounded-lg border border-warning/20 bg-warning-soft px-4 py-3">
          <h4 className="text-sm font-semibold text-ink">Warnings</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
            {result.warnings.map((warning) => (
              <li key={warning}>Warning: {warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.rules.length === 0 ? (
        <p className="mt-4 rounded-lg border border-border bg-canvas px-4 py-3 text-sm text-ink">
          No explicit structured rules were found. This is not a failed upload.
        </p>
      ) : (
        <div className="mt-5 min-w-0">
          <h4 className="text-sm font-semibold text-ink">Normalized rules</h4>
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">
                Normalized guideline rules extracted from the uploaded file
              </caption>
              <thead className="bg-canvas text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2.5 whitespace-nowrap">
                    Rule ID
                  </th>
                  <th scope="col" className="px-3 py-2.5 whitespace-nowrap">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-2.5 whitespace-nowrap">
                    Title
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Description
                  </th>
                  <th scope="col" className="px-3 py-2.5 whitespace-nowrap">
                    Severity
                  </th>
                  <th scope="col" className="px-3 py-2.5 whitespace-nowrap">
                    Enabled status
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.rules.map((rule) => (
                  <tr key={rule.id} className="border-t border-border align-top">
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap text-ink">
                      {rule.id}
                    </td>
                    <td className="px-3 py-2.5 capitalize whitespace-nowrap text-ink">
                      {rule.category}
                    </td>
                    <td className="px-3 py-2.5 text-ink">{rule.title}</td>
                    <td className="max-w-md px-3 py-2.5 text-ink">
                      {rule.description}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${severityClassName[rule.severity]}`}
                      >
                        {rule.severity}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-ink">
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-canvas px-3 py-2.5">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}
