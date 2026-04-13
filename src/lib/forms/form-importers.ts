import type { FormFieldType } from "@/lib/validations/knowledge-form";
import type { FormTemplateSection } from "./form-templates";

interface ImportResult {
  name: string;
  description?: string;
  sections: FormTemplateSection[];
}

// ─── Google Forms JSON Import ────────────────────────────────────────────────

interface GoogleFormsItem {
  title?: string;
  description?: string;
  questionItem?: {
    question?: {
      required?: boolean;
      choiceQuestion?: {
        type?: string; // RADIO, CHECKBOX, DROP_DOWN
        options?: Array<{ value: string }>;
      };
      textQuestion?: {
        paragraph?: boolean;
      };
      scaleQuestion?: {
        low?: number;
        high?: number;
      };
      dateQuestion?: Record<string, unknown>;
      timeQuestion?: Record<string, unknown>;
      fileUploadQuestion?: Record<string, unknown>;
    };
  };
  questionGroupItem?: {
    grid?: { columns?: { type?: string } };
    questions?: Array<{ title?: string; required?: boolean }>;
  };
  pageBreakItem?: Record<string, unknown>;
}

interface GoogleFormsData {
  info?: { title?: string; description?: string };
  items?: GoogleFormsItem[];
}

function mapGoogleFieldType(item: GoogleFormsItem): {
  type: FormFieldType;
  options?: { choices: string[] };
  validation?: Record<string, unknown>;
} {
  const q = item.questionItem?.question;
  if (!q) return { type: "TEXT" };

  if (q.choiceQuestion) {
    const choices =
      q.choiceQuestion.options?.map((o) => o.value).filter(Boolean) || [];
    const choiceType = q.choiceQuestion.type;
    if (choiceType === "CHECKBOX") {
      return { type: "MULTI_SELECT", options: { choices } };
    }
    if (choiceType === "DROP_DOWN") {
      return { type: "SELECT", options: { choices } };
    }
    return { type: "RADIO", options: { choices } };
  }

  if (q.scaleQuestion) {
    return {
      type: "RATING",
      validation: { maxRating: q.scaleQuestion.high || 10 },
    };
  }

  if (q.dateQuestion) return { type: "DATE" };
  if (q.timeQuestion) return { type: "TIME" };
  if (q.fileUploadQuestion) return { type: "FILE_UPLOAD" };

  if (q.textQuestion?.paragraph) return { type: "TEXTAREA" };
  return { type: "TEXT" };
}

export function parseGoogleForms(json: unknown): ImportResult {
  const data = json as GoogleFormsData;
  const name = data.info?.title || "Imported Google Form";
  const description = data.info?.description;

  const sections: FormTemplateSection[] = [];
  let currentSection: FormTemplateSection = { fields: [] };

  for (const item of data.items || []) {
    // Page break = new section
    if (item.pageBreakItem) {
      if (currentSection.fields.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        title: item.title || undefined,
        description: item.description || undefined,
        fields: [],
      };
      continue;
    }

    if (item.questionItem) {
      const mapped = mapGoogleFieldType(item);
      currentSection.fields.push({
        label: item.title || "Untitled Question",
        type: mapped.type,
        isRequired: item.questionItem.question?.required ?? false,
        options: mapped.options,
        validation: mapped.validation,
      });
    }
  }

  if (currentSection.fields.length > 0) {
    sections.push(currentSection);
  }

  // Ensure at least one section
  if (sections.length === 0) {
    sections.push({ fields: [] });
  }

  return { name, description, sections };
}

// ─── Typeform JSON Import ────────────────────────────────────────────────────

interface TypeformField {
  title?: string;
  type?: string;
  validations?: { required?: boolean };
  properties?: {
    description?: string;
    choices?: Array<{ label: string }>;
    steps?: number;
  };
}

interface TypeformData {
  title?: string;
  fields?: TypeformField[];
}

const TYPEFORM_TYPE_MAP: Record<string, FormFieldType> = {
  short_text: "TEXT",
  long_text: "TEXTAREA",
  number: "NUMBER",
  email: "EMAIL",
  phone_number: "PHONE",
  date: "DATE",
  multiple_choice: "RADIO",
  dropdown: "SELECT",
  rating: "RATING",
  yes_no: "YES_NO",
  file_upload: "FILE_UPLOAD",
  opinion_scale: "RATING",
  legal: "CHECKBOX",
  signature: "SIGNATURE",
};

export function parseTypeform(json: unknown): ImportResult {
  const data = json as TypeformData;
  const name = data.title || "Imported Typeform";

  const fields = (data.fields || []).map((f) => {
    const type = TYPEFORM_TYPE_MAP[f.type || ""] || "TEXT";
    const choices = f.properties?.choices?.map((c) => c.label).filter(Boolean);

    return {
      label: f.title || "Untitled Question",
      type,
      isRequired: f.validations?.required ?? false,
      helpText: f.properties?.description || undefined,
      options:
        choices && choices.length > 0 ? { choices } : undefined,
      validation:
        type === "RATING" && f.properties?.steps
          ? { maxRating: f.properties.steps }
          : undefined,
    };
  });

  return {
    name,
    sections: [{ fields }],
  };
}

// ─── SurveyMonkey CSV Import ─────────────────────────────────────────────────

export function parseSurveyMonkeyCSV(csvText: string): ImportResult {
  const lines = csvText.split("\n").filter((l) => l.trim());
  if (lines.length === 0) {
    return { name: "Imported Survey", sections: [{ fields: [] }] };
  }

  // First row = headers (question labels)
  const headers = parseCSVLine(lines[0]);

  const fields = headers
    .filter((h) => h.trim())
    .map((header) => ({
      label: header.trim(),
      type: "TEXT" as FormFieldType,
      isRequired: false,
    }));

  return {
    name: "Imported SurveyMonkey Form",
    sections: [{ fields }],
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
