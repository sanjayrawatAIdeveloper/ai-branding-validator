import {
  AI_INTERPRETATION_LATER_WARNING,
  NO_EXPLICIT_RULE_IDS_WARNING,
  RULE_DESCRIPTION_MAX_LENGTH,
  RULE_TITLE_MAX_LENGTH,
  categoryFromPdfPrefix,
  severityFromPdfLabel,
} from "@/lib/guidelines/constants";
import type {
  GuidelineSeverity,
  NormalizedGuidelineRule,
} from "@/types/guideline-processing";

export type PdfLayoutTextItem = {
  str: string;
  x: number;
  y: number;
  width: number;
};

type ParsedRow = {
  cells: string[];
  startX: number;
};

type PendingRule = {
  id: string;
  descriptionParts: string[];
  severity: GuidelineSeverity | null;
  startX: number;
};

export type NormalizedPdfRules = {
  rules: NormalizedGuidelineRule[];
  warnings: string[];
};

const RULE_ID_PATTERN = /^[A-Z][A-Z0-9_-]{1,30}-\d{2,4}$/;
const INLINE_RULE_PATTERN =
  /\b([A-Z][A-Z0-9_-]{1,30}-\d{2,4})\s*[:\-–—]\s*(\S.*)$/;
const PAGE_MARKER_PATTERN = /\bpage\s+\d+\s*$/i;
const Y_TOLERANCE = 3;
const COLUMN_GAP = 10;
const HEADING_VALUES = new Set(["rule id", "requirement", "severity"]);

function hasMeaningfulText(value: string): boolean {
  return value.trim().length >= 2 && /[\p{L}\p{N}]/u.test(value);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isRuleId(value: string): boolean {
  return RULE_ID_PATTERN.test(value.trim());
}

function prefixFromRuleId(id: string): string {
  const separator = id.lastIndexOf("-");
  return separator === -1 ? id : id.slice(0, separator);
}

function deriveTitle(description: string): string {
  const trimmed = description.trim();
  const sentenceMatch = trimmed.match(/^(.+?[.!?])(?:\s|$)/);
  const rawTitle = (sentenceMatch?.[1] ?? trimmed).replace(/[.!?]+$/, "").trim();
  const title = rawTitle.length >= 2 ? rawTitle : trimmed;

  if (title.length <= RULE_TITLE_MAX_LENGTH) {
    return title;
  }

  const truncated = title.slice(0, RULE_TITLE_MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace >= 2 ? truncated.slice(0, lastSpace) : truncated).trim();
}

function clipDescription(description: string): string {
  if (description.length <= RULE_DESCRIPTION_MAX_LENGTH) {
    return description;
  }

  return description.slice(0, RULE_DESCRIPTION_MAX_LENGTH).trimEnd();
}

function isHeadingText(value: string): boolean {
  const normalized = normalizeWhitespace(value).toLowerCase();
  if (HEADING_VALUES.has(normalized) || normalized === "rule id requirement severity") {
    return true;
  }

  const tokens = normalized.split(" ");
  return (
    tokens.length > 0 &&
    tokens.every(
      (token) => token === "rule" || token === "id" || HEADING_VALUES.has(token),
    )
  );
}

function isHeaderOrFooter(value: string): boolean {
  const normalized = normalizeWhitespace(value);
  if (normalized === "") {
    return false;
  }

  if (/^page\s+\d+$/i.test(normalized)) {
    return true;
  }

  return PAGE_MARKER_PATTERN.test(normalized) && !RULE_ID_PATTERN.test(normalized);
}

function peelTrailingSeverity(value: string): {
  text: string;
  severity: GuidelineSeverity | null;
} {
  const normalized = normalizeWhitespace(value);
  if (normalized === "") {
    return { text: "", severity: null };
  }

  const tokens = normalized.split(" ");
  const last = tokens[tokens.length - 1];
  if (!last) {
    return { text: normalized, severity: null };
  }

  const severity = severityFromPdfLabel(last.replace(/[.,;:]+$/, ""));
  if (!severity || tokens.length < 2) {
    return { text: normalized, severity: null };
  }

  return {
    text: tokens.slice(0, -1).join(" "),
    severity,
  };
}

function cellsFromPlainLine(line: string): string[] {
  if (line.includes("\t")) {
    return line
      .split("\t")
      .map((cell) => normalizeWhitespace(cell))
      .filter(Boolean);
  }

  const repeatedSpaceCells = line
    .split(/\s{2,}/)
    .map((cell) => normalizeWhitespace(cell))
    .filter(Boolean);

  if (repeatedSpaceCells.length >= 2) {
    return repeatedSpaceCells;
  }

  const trimmed = normalizeWhitespace(line);
  return trimmed === "" ? [] : [trimmed];
}

function splitLeadingRuleId(value: string): { id: string | null; rest: string } {
  const match = value.match(/^([A-Z][A-Z0-9_-]{1,30}-\d{2,4})(?:\s+|$)(.*)$/);
  const id = match?.[1];
  if (!id || !isRuleId(id)) {
    return { id: null, rest: value };
  }

  return { id, rest: normalizeWhitespace(match[2] ?? "") };
}

function cellsFromLayoutItems(items: PdfLayoutTextItem[]): string[] {
  const sorted = [...items].sort((left, right) => left.x - right.x);
  if (sorted.length === 0) {
    return [];
  }

  const cells: string[] = [];
  let current = sorted[0]?.str.trim() ?? "";
  let previous = sorted[0];

  for (let index = 1; index < sorted.length; index += 1) {
    const item = sorted[index];
    if (!item || !previous) {
      continue;
    }

    const previousRight = previous.x + Math.max(previous.width, 0);
    const gap = item.x - previousRight;
    const split =
      previous.width > 0 ? gap > COLUMN_GAP : item.x - previous.x > 20;

    if (split) {
      if (current.trim() !== "") {
        cells.push(normalizeWhitespace(current));
      }
      current = item.str.trim();
    } else {
      current = `${current} ${item.str.trim()}`;
    }

    previous = item;
  }

  if (current.trim() !== "") {
    cells.push(normalizeWhitespace(current));
  }

  return cells;
}

function reconstructPdfLayoutRows(
  pages: PdfLayoutTextItem[][],
): ParsedRow[] {
  const rows: ParsedRow[] = [];

  for (const pageItems of pages) {
    const usable = pageItems.filter((item) => item.str.trim() !== "");
    const sorted = [...usable].sort((left, right) => {
      if (Math.abs(left.y - right.y) > Y_TOLERANCE) {
        return right.y - left.y;
      }
      return left.x - right.x;
    });

    const clusters: PdfLayoutTextItem[][] = [];
    for (const item of sorted) {
      const currentCluster = clusters[clusters.length - 1];
      const clusterY = currentCluster?.[0]?.y;
      if (
        currentCluster &&
        clusterY !== undefined &&
        Math.abs(clusterY - item.y) <= Y_TOLERANCE
      ) {
        currentCluster.push(item);
      } else {
        clusters.push([item]);
      }
    }

    for (const cluster of clusters) {
      const ordered = [...cluster].sort((left, right) => left.x - right.x);
      const cells = cellsFromLayoutItems(ordered);
      const startX = ordered[0]?.x ?? 0;
      if (cells.length > 0) {
        rows.push({ cells, startX });
      }
    }
  }

  return rows;
}

function toNormalizedRule(
  id: string,
  description: string,
  severity: GuidelineSeverity | null,
): NormalizedGuidelineRule | null {
  const cleanDescription = clipDescription(normalizeWhitespace(description));
  if (!hasMeaningfulText(cleanDescription)) {
    return null;
  }

  return {
    id,
    category: categoryFromPdfPrefix(prefixFromRuleId(id)),
    title: deriveTitle(cleanDescription),
    description: cleanDescription,
    severity: severity ?? "warning",
    enabled: true,
    source: "pdf",
  };
}

function addRule(
  rules: NormalizedGuidelineRule[],
  seenIds: Set<string>,
  pending: PendingRule | null,
): void {
  if (!pending) {
    return;
  }

  const rule = toNormalizedRule(
    pending.id,
    pending.descriptionParts.join(" "),
    pending.severity,
  );
  if (!rule || seenIds.has(rule.id)) {
    return;
  }

  seenIds.add(rule.id);
  rules.push(rule);
}

function isContinuationRow(row: ParsedRow, pending: PendingRule): boolean {
  const line = normalizeWhitespace(row.cells.join(" "));
  if (line === "") {
    return false;
  }

  if (severityFromPdfLabel(line) && row.cells.length === 1) {
    return true;
  }

  if (row.startX > pending.startX + 8) {
    return true;
  }

  return /^[a-z0-9#([{]/.test(line);
}

function consumeRow(
  row: ParsedRow,
  rules: NormalizedGuidelineRule[],
  seenIds: Set<string>,
  pending: PendingRule | null,
): PendingRule | null {
  const cells = row.cells;
  const line = cells.join(" ");
  if (cells.length === 0 || isHeadingText(line) || isHeaderOrFooter(line)) {
    if (pending && isHeadingText(line)) {
      addRule(rules, seenIds, pending);
      return null;
    }
    return pending;
  }

  if (cells.every((cell) => HEADING_VALUES.has(cell.toLowerCase()))) {
    addRule(rules, seenIds, pending);
    return null;
  }

  const firstCell = cells[0];
  if (!firstCell) {
    return pending;
  }

  let id: string | null = null;
  let remainderCells: string[] = [];

  if (isRuleId(firstCell)) {
    id = firstCell;
    remainderCells = cells.slice(1);
  } else if (cells.length === 1) {
    const split = splitLeadingRuleId(firstCell);
    id = split.id;
    remainderCells = split.rest === "" ? [] : [split.rest];
  }

  if (!id && pending) {
    if (!isContinuationRow(row, pending)) {
      addRule(rules, seenIds, pending);
      return consumeRow(row, rules, seenIds, null);
    }

    if (cells.length === 1) {
      const onlySeverity = severityFromPdfLabel(firstCell);
      if (onlySeverity) {
        pending.severity = pending.severity ?? onlySeverity;
        addRule(rules, seenIds, pending);
        return null;
      }
    }

    const lastCell = cells[cells.length - 1];
    const trailing = lastCell ? severityFromPdfLabel(lastCell) : null;
    const descriptionCells =
      trailing && cells.length > 1 ? cells.slice(0, -1) : cells;

    for (const cell of descriptionCells) {
      const peeled = peelTrailingSeverity(cell);
      if (peeled.severity && !pending.severity) {
        pending.severity = peeled.severity;
      }
      if (peeled.text !== "" && !isHeadingText(peeled.text)) {
        pending.descriptionParts.push(peeled.text);
      }
    }

    if (trailing) {
      pending.severity = pending.severity ?? trailing;
    }

    return pending;
  }

  if (!id) {
    return pending;
  }

  addRule(rules, seenIds, pending);

  if (seenIds.has(id)) {
    return null;
  }

  let severity: GuidelineSeverity | null = null;
  const descriptionParts: string[] = [];
  const lastCell = remainderCells[remainderCells.length - 1];
  const lastSeverity = lastCell ? severityFromPdfLabel(lastCell) : null;

  if (lastSeverity && remainderCells.length > 0) {
    severity = lastSeverity;
    remainderCells = remainderCells.slice(0, -1);
  }

  for (const cell of remainderCells) {
    const peeled = peelTrailingSeverity(cell);
    if (peeled.severity && !severity) {
      severity = peeled.severity;
    }
    if (peeled.text !== "") {
      descriptionParts.push(peeled.text);
    }
  }

  return {
    id,
    descriptionParts,
    severity,
    startX: row.startX,
  };
}

function collectRulesFromRows(rows: ParsedRow[]): NormalizedGuidelineRule[] {
  const rules: NormalizedGuidelineRule[] = [];
  const seenIds = new Set<string>();
  let pending: PendingRule | null = null;

  for (const row of rows) {
    pending = consumeRow(row, rules, seenIds, pending);
  }

  addRule(rules, seenIds, pending);
  return rules;
}

function collectInlineRules(
  text: string,
  seenIds: Set<string>,
): NormalizedGuidelineRule[] {
  const rules: NormalizedGuidelineRule[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || isHeadingText(line) || isHeaderOrFooter(line)) {
      continue;
    }

    const match = line.match(INLINE_RULE_PATTERN);
    const id = match?.[1];
    const description = match?.[2];
    if (!id || !isRuleId(id) || !description) {
      continue;
    }

    const peeled = peelTrailingSeverity(description);
    const rule = toNormalizedRule(id, peeled.text, peeled.severity);
    if (!rule || seenIds.has(rule.id)) {
      continue;
    }

    seenIds.add(rule.id);
    rules.push(rule);
  }

  return rules;
}

export function normalizePdfRules(
  text: string,
  layoutItems?: PdfLayoutTextItem[][],
): NormalizedPdfRules {
  const warnings: string[] = [];
  const rules: NormalizedGuidelineRule[] = [];
  const seenIds = new Set<string>();

  const layoutRows =
    layoutItems && layoutItems.length > 0
      ? reconstructPdfLayoutRows(layoutItems)
      : [];
  const layoutRules = collectRulesFromRows(layoutRows);
  for (const rule of layoutRules) {
    if (seenIds.has(rule.id)) {
      continue;
    }
    seenIds.add(rule.id);
    rules.push(rule);
  }

  const textRows = text.split(/\r?\n/).map((line) => ({
    cells: cellsFromPlainLine(line),
    startX: 0,
  }));
  const textRules = collectRulesFromRows(textRows);
  for (const rule of textRules) {
    if (seenIds.has(rule.id)) {
      continue;
    }
    seenIds.add(rule.id);
    rules.push(rule);
  }

  const inlineRules = collectInlineRules(text, seenIds);
  rules.push(...inlineRules);

  if (rules.length === 0) {
    warnings.push(NO_EXPLICIT_RULE_IDS_WARNING);
    warnings.push(AI_INTERPRETATION_LATER_WARNING);
  }

  return { rules, warnings };
}
