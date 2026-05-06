/**
 * Front-end-only types for the Meeting Prep prototype. No Prisma yet —
 * these are the shapes the wizard, store, and (mocked) LLM helpers agree on.
 * When the backend lands these will be re-derived from the schema.
 */

export type MeetingType =
  | "one_on_one"
  | "commercial"
  | "board"
  | "hr_feedback"
  | "negotiation"
  | "interview"
  | "kickoff"
  | "partnership"
  | "investor"
  | "other";

export const MEETING_TYPES: MeetingType[] = [
  "one_on_one",
  "commercial",
  "board",
  "hr_feedback",
  "negotiation",
  "interview",
  "kickoff",
  "partnership",
  "investor",
  "other",
];

export type ParticipantRelationship =
  | "subordinate"
  | "peer"
  | "superior"
  | "client"
  | "supplier"
  | "partner"
  | "unknown";

export const PARTICIPANT_RELATIONSHIPS: ParticipantRelationship[] = [
  "subordinate",
  "peer",
  "superior",
  "client",
  "supplier",
  "partner",
  "unknown",
];

export type ToneTag =
  | "formal"
  | "consultive"
  | "assertive"
  | "collaborative"
  | "empathetic"
  | "direct";

export const TONE_TAGS: ToneTag[] = [
  "formal",
  "consultive",
  "assertive",
  "collaborative",
  "empathetic",
  "direct",
];

export interface Participant {
  id: string;
  name: string;
  role: string;
  organization: string;
  relationship: ParticipantRelationship | null;
  profileNotes: string;
}

export type SessionStatus =
  | "draft"
  | "briefed"
  | "specialists_ready"
  | "plan_ready"
  | "rehearsed"
  | "closed";

export interface MeetingContext {
  // Identification
  title: string;
  meetingType: MeetingType | null;
  scheduledAt: string | null;
  durationMin: number;

  // Objective
  objective: string;

  // Participants
  participants: Participant[];

  // Desired outcome
  desiredOutcome: string;
  batna: string;

  // Additional context
  historyNotes: string;
  constraints: string;
  toneTags: ToneTag[];

  // Generated
  summary: string;
}

export interface ValidationGap {
  field: string;
  /** A user-facing translation key suffix (joined to `meeting_prep.validation.`) */
  messageKey: string;
}

export interface ValidationResult {
  ok: boolean;
  missing: ValidationGap[];
  suggestions: ValidationGap[];
}

export interface MeetingPrepSession {
  id: string;
  userId: string;
  title: string;
  status: SessionStatus;
  context: MeetingContext;
  createdAt: string;
  updatedAt: string;
}

// ─── Specialists ────────────────────────────────────────────────────

export type SpecialistKind = "archetype" | "inspired" | "custom";

export interface SpecialistTemplate {
  id: string; // e.g. "archetype.negotiator-hardball" | "inspired.steve-jobs-style"
  kind: Exclude<SpecialistKind, "custom">;
  /** Display name as shown on cards. For "inspired" the runtime UI MUST
   *  prefix this with "Estilo de…" / "Style of…" — never use the raw
   *  person's name as if speaking on their behalf. */
  name: string;
  shortDescription: string;
  lens: string;
  /** Lucide icon name (string) — kept generic; rendered via TOOL_ICON_MAP. */
  icon: string;
  /** Hex color used for the card accent / avatar tile. */
  color: string;
  /** Voice hints used by the mock generator to shape outputs. */
  voiceHints: {
    situationStarter: string;
    priorityStarter: string;
    avoidStarter: string;
    questionStarter: string;
    anchorTemplate: string;
  };
  /** Required for `inspired` templates — public sources the persona is
   *  modeled on. Never empty for inspired. */
  publicSources?: string[];
  /** Documented thinking principles, used in the system prompt. */
  thinkingPrinciples?: string[];
  enabled: boolean;
}

export interface SpecialistOutput {
  situationRead: string;
  priorities: string[];
  avoid: string[];
  provocativeQuestion: string;
  anchorPhrase: string;
}

export interface SpecialistActivation {
  id: string;
  sessionId: string;
  /** Null when this is a "custom" activation (free-text descriptor). */
  templateId: string | null;
  /** Null when activation references a template. */
  customDescription: string | null;
  /** Snapshot of the template's display name at activation time, so the UI
   *  can render labels even if the library shifts later. */
  displayName: string;
  kind: SpecialistKind;
  status: "queued" | "streaming" | "complete" | "error";
  output: SpecialistOutput;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export function emptyOutput(): SpecialistOutput {
  return {
    situationRead: "",
    priorities: [],
    avoid: [],
    provocativeQuestion: "",
    anchorPhrase: "",
  };
}

export const MAX_ACTIVATIONS_PER_SESSION = 5;

// ─── Prep plan ──────────────────────────────────────────────────────

export interface ObjectiveItem {
  text: string;
  rationale: string;
}
export interface RiskItem {
  text: string;
  mitigation: string;
}
export interface AnticipatedQuestion {
  question: string;
  suggestedAnswer: string;
}
export interface ObjectionItem {
  objection: string;
  reveals: string;
  response: string;
}
export interface AnchorPhrases {
  opening: string;
  pivot: string;
  closing: string;
}

export interface PrepPlanSections {
  executiveSummary: string;
  objectives: ObjectiveItem[];
  counterpartMotives: string[];
  risks: RiskItem[];
  opportunities: string[];
  anticipatedQuestions: AnticipatedQuestion[];
  myQuestions: string[];
  objections: ObjectionItem[];
  anchorPhrases: AnchorPhrases;
  planB: string;
  materialsChecklist: string[];
}

/** Section keys in display order — also used by streamer phases. */
export const PREP_PLAN_SECTION_KEYS = [
  "executiveSummary",
  "objectives",
  "counterpartMotives",
  "risks",
  "opportunities",
  "anticipatedQuestions",
  "myQuestions",
  "objections",
  "anchorPhrases",
  "planB",
  "materialsChecklist",
] as const;

export type PrepPlanSection = (typeof PREP_PLAN_SECTION_KEYS)[number];

export interface PrepPlan {
  sessionId: string;
  sections: PrepPlanSections;
  /** Per-section state — lets the UI flag in-progress regeneration of a
   *  single section without disturbing the rest. */
  sectionStatus: Partial<Record<PrepPlanSection, "streaming">>;
  generatedAt: string;
  editedAt: string | null;
  /** Cheap fingerprint of the inputs (context + activation pins/IDs)
   *  taken at generation time. The UI compares it to the current
   *  fingerprint to flag staleness — no server round-trip needed. */
  inputsSignature: string;
}

export function emptyPrepPlanSections(): PrepPlanSections {
  return {
    executiveSummary: "",
    objectives: [],
    counterpartMotives: [],
    risks: [],
    opportunities: [],
    anticipatedQuestions: [],
    myQuestions: [],
    objections: [],
    anchorPhrases: { opening: "", pivot: "", closing: "" },
    planB: "",
    materialsChecklist: [],
  };
}

export const DEFAULT_DURATION_MIN = 30;

export function emptyContext(): MeetingContext {
  return {
    title: "",
    meetingType: null,
    scheduledAt: null,
    durationMin: DEFAULT_DURATION_MIN,
    objective: "",
    participants: [],
    desiredOutcome: "",
    batna: "",
    historyNotes: "",
    constraints: "",
    toneTags: [],
    summary: "",
  };
}

export function emptyParticipant(): Participant {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    name: "",
    role: "",
    organization: "",
    relationship: null,
    profileNotes: "",
  };
}
