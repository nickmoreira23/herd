interface Section {
  title: string | null;
  fields: Array<{
    id: string;
    label: string;
    type: string;
    options?: { choices: string[] } | null;
  }>;
}

/**
 * Converts structured form response answers into natural-language text
 * suitable for RAG indexing and semantic search.
 */
export function renderFormResponseText(
  formName: string,
  sections: Section[],
  answers: Record<string, unknown>,
  submittedAt: Date
): string {
  const lines: string[] = [];

  lines.push(`Form: ${formName}`);
  lines.push(`Submitted: ${submittedAt.toISOString()}`);
  lines.push("");

  for (const section of sections) {
    if (section.title) {
      lines.push(`## ${section.title}`);
      lines.push("");
    }

    for (const field of section.fields) {
      const rawValue = answers[field.id];
      if (rawValue === undefined || rawValue === null || rawValue === "") continue;

      const displayValue = formatAnswerValue(rawValue, field.type);
      lines.push(`Q: ${field.label}`);
      lines.push(`A: ${displayValue}`);
      lines.push("");
    }
  }

  return lines.join("\n").trim();
}

function formatAnswerValue(value: unknown, type: string): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (type === "YES_NO") {
    return value === true || value === "true" || value === "yes" ? "Yes" : "No";
  }

  if (type === "CHECKBOX") {
    return value === true || value === "true" ? "Yes" : "No";
  }

  if (type === "RATING") {
    return `${value}/10`;
  }

  if (type === "FILE_UPLOAD") {
    if (typeof value === "object" && value !== null && "name" in value) {
      return `[File uploaded: ${(value as { name: string }).name}]`;
    }
    return "[File uploaded]";
  }

  if (type === "SIGNATURE") {
    return "[Signature provided]";
  }

  return String(value);
}
