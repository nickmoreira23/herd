export interface KnowledgeFormRow {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  formStatus: string;
  status: string;
  isActive: boolean;
  errorMessage: string | null;
  chunkCount: number;
  thankYouMessage: string | null;
  accessMode: string;
  maxResponses: number | null;
  responseCount: number;
  startsAt: string | null;
  endsAt: string | null;
  templateKey: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface KnowledgeFormStats {
  total: number;
  draft: number;
  active: number;
  closed: number;
  totalResponses: number;
}

export interface KnowledgeFormSectionRow {
  id: string;
  formId: string;
  title: string | null;
  description: string | null;
  sortOrder: number;
  fields: KnowledgeFormFieldRow[];
}

export interface KnowledgeFormFieldRow {
  id: string;
  sectionId: string;
  label: string;
  type: string;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  options: { choices: string[] } | null;
  validation: Record<string, unknown> | null;
  conditionalLogic: { fieldId: string; operator: string; value?: unknown } | null;
  sortOrder: number;
}

export interface KnowledgeFormResponseRow {
  id: string;
  formId: string;
  status: string;
  answers: Record<string, unknown>;
  textContent: string | null;
  chunkCount: number;
  submitterName: string | null;
  submitterEmail: string | null;
  errorMessage: string | null;
  processedAt: string | null;
  submittedAt: string;
}

export interface KnowledgeFormDetail extends KnowledgeFormRow {
  sections: KnowledgeFormSectionRow[];
}
