import {
  MAX_ORGANIZATION_LENGTH,
  MAX_RULES,
  MAX_VERSION_LENGTH,
  RULE_DESCRIPTION_MAX_LENGTH,
  RULE_DESCRIPTION_MIN_LENGTH,
  RULE_ID_MAX_LENGTH,
  RULE_ID_MIN_LENGTH,
  RULE_TITLE_MAX_LENGTH,
  RULE_TITLE_MIN_LENGTH,
  isGuidelineCategory,
  isGuidelineSeverity,
} from "@/lib/guidelines/constants";
import { createProcessingError } from "@/lib/guidelines/errors";
import type {
  GuidelineCategory,
  GuidelineProcessingError,
  GuidelineSeverity,
  NormalizedGuidelineRule,
} from "@/types/guideline-processing";

export type JsonGuidelineParseResult =
  | {
      ok: true;
      organization: string | null;
      rules: NormalizedGuidelineRule[];
    }
  | GuidelineProcessingError;

const ALLOWED_ROOT_KEYS = new Set(["version", "organization", "rules"]);
const ALLOWED_RULE_KEYS = new Set([
  "id",
  "category",
  "title",
  "description",
  "severity",
  "enabled",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeUtf8(bytes: Uint8Array): string {
  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return decoded.charCodeAt(0) === 0xfeff ? decoded.slice(1) : decoded;
}

function readRequiredString(
  value: unknown,
  field: string,
  minLength: number,
  maxLength: number,
  errors: string[],
): string | null {
  if (typeof value !== "string") {
    errors.push(`${field} must be a string.`);
    return null;
  }

  const trimmed = value.trim();
  if (trimmed === "") {
    errors.push(`${field} is required.`);
    return null;
  }

  if (trimmed.length < minLength || trimmed.length > maxLength) {
    errors.push(
      `${field} must be between ${minLength} and ${maxLength} characters.`,
    );
    return null;
  }

  return trimmed;
}

function rejectUnknownField(
  value: unknown,
  field: string,
  errors: string[],
): void {
  if (value !== null && typeof value === "object") {
    errors.push(`${field}: Unexpected nested content.`);
    return;
  }

  errors.push(`${field}: Unexpected field.`);
}

export function parseJsonGuidelines(
  bytes: Uint8Array,
): JsonGuidelineParseResult {
  let rawText: string;
  try {
    rawText = decodeUtf8(bytes);
  } catch {
    return createProcessingError(
      "MALFORMED_JSON",
      "The JSON file must be valid UTF-8.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText) as unknown;
  } catch {
    return createProcessingError(
      "MALFORMED_JSON",
      "The JSON file is not valid JSON.",
    );
  }

  if (Array.isArray(parsed) || !isRecord(parsed)) {
    return createProcessingError(
      "INVALID_JSON_SCHEMA",
      "The JSON file does not match the canonical guideline schema.",
      ["Root value must be an object with version and rules."],
    );
  }

  const errors: string[] = [];
  let hasDuplicateIds = false;

  for (const key of Object.keys(parsed)) {
    if (!ALLOWED_ROOT_KEYS.has(key)) {
      rejectUnknownField(parsed[key], key, errors);
    }
  }

  readRequiredString(parsed.version, "version", 1, MAX_VERSION_LENGTH, errors);

  let organization: string | null = null;
  if (parsed.organization !== undefined) {
    organization = readRequiredString(
      parsed.organization,
      "organization",
      1,
      MAX_ORGANIZATION_LENGTH,
      errors,
    );
  }

  const rules: NormalizedGuidelineRule[] = [];

  if (!Array.isArray(parsed.rules)) {
    errors.push("rules must be an array.");
  } else if (parsed.rules.length === 0) {
    errors.push("rules must contain at least one rule.");
  } else if (parsed.rules.length > MAX_RULES) {
    errors.push(`rules cannot contain more than ${MAX_RULES} items.`);
  } else {
    const seenIds = new Set<string>();

    parsed.rules.forEach((ruleValue, index) => {
      const parsedRule = parseRule(ruleValue, index, errors, seenIds);
      if (parsedRule.duplicateId) {
        hasDuplicateIds = true;
      }
      if (parsedRule.rule) {
        rules.push(parsedRule.rule);
      }
    });
  }

  if (errors.length > 0) {
    const onlyDuplicates =
      hasDuplicateIds &&
      errors.every((error) => error.includes("Duplicate rule ID"));

    return createProcessingError(
      onlyDuplicates ? "DUPLICATE_RULE_IDS" : "INVALID_JSON_SCHEMA",
      onlyDuplicates
        ? "Guideline rules must use unique IDs."
        : "The JSON file does not match the canonical guideline schema.",
      errors,
    );
  }

  return {
    ok: true,
    organization,
    rules,
  };
}

function parseRule(
  ruleValue: unknown,
  index: number,
  errors: string[],
  seenIds: Set<string>,
): { rule: NormalizedGuidelineRule | null; duplicateId: boolean } {
  const fieldPrefix = `rules[${index}]`;

  if (!isRecord(ruleValue)) {
    errors.push(`${fieldPrefix} must be an object.`);
    return { rule: null, duplicateId: false };
  }

  for (const key of Object.keys(ruleValue)) {
    if (!ALLOWED_RULE_KEYS.has(key)) {
      rejectUnknownField(ruleValue[key], `${fieldPrefix}.${key}`, errors);
    }
  }

  const id = readRequiredString(
    ruleValue.id,
    `${fieldPrefix}.id`,
    RULE_ID_MIN_LENGTH,
    RULE_ID_MAX_LENGTH,
    errors,
  );

  let duplicateId = false;
  if (id !== null) {
    if (seenIds.has(id)) {
      duplicateId = true;
      errors.push(`${fieldPrefix}.id: Duplicate rule ID.`);
    } else {
      seenIds.add(id);
    }
  }

  let category: GuidelineCategory | null = null;
  if (typeof ruleValue.category !== "string") {
    errors.push(`${fieldPrefix}.category must be a string.`);
  } else if (!isGuidelineCategory(ruleValue.category)) {
    errors.push(`${fieldPrefix}.category has an unsupported value.`);
  } else {
    category = ruleValue.category;
  }

  const title = readRequiredString(
    ruleValue.title,
    `${fieldPrefix}.title`,
    RULE_TITLE_MIN_LENGTH,
    RULE_TITLE_MAX_LENGTH,
    errors,
  );

  const description = readRequiredString(
    ruleValue.description,
    `${fieldPrefix}.description`,
    RULE_DESCRIPTION_MIN_LENGTH,
    RULE_DESCRIPTION_MAX_LENGTH,
    errors,
  );

  let severity: GuidelineSeverity | null = null;
  if (typeof ruleValue.severity !== "string") {
    errors.push(`${fieldPrefix}.severity must be a string.`);
  } else if (!isGuidelineSeverity(ruleValue.severity)) {
    errors.push(`${fieldPrefix}.severity has an unsupported value.`);
  } else {
    severity = ruleValue.severity;
  }

  let enabled: boolean | null = null;
  if (typeof ruleValue.enabled !== "boolean") {
    errors.push(`${fieldPrefix}.enabled must be a boolean.`);
  } else {
    enabled = ruleValue.enabled;
  }

  if (
    id === null ||
    duplicateId ||
    category === null ||
    title === null ||
    description === null ||
    severity === null ||
    enabled === null
  ) {
    return { rule: null, duplicateId };
  }

  return {
    duplicateId: false,
    rule: {
      id,
      category,
      title,
      description,
      severity,
      enabled,
      source: "json",
    },
  };
}
