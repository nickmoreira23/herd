"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  emptyContext,
  emptyOutput,
  emptyParticipant,
  emptyPrepPlanSections,
  type MeetingContext,
  type MeetingPrepSession,
  type Participant,
  type PrepPlan,
  type PrepPlanSection,
  type PrepPlanSections,
  type SessionStatus,
  type SpecialistActivation,
  type SpecialistKind,
  type SpecialistOutput,
  type ToneTag,
} from "@/lib/meeting-prep/types";

/**
 * Local-first session store. The Meeting Prep prototype is front-end-only
 * for now — sessions live in localStorage so the wizard's auto-save and
 * "refresh doesn't lose data" requirements work without a backend.
 *
 * When the API lands, swap the persistence layer for an `useEffect`
 * sync to `/api/meeting-sessions/:id` and keep the same store shape.
 */

const STORAGE_KEY = "herd:meeting-prep-sessions";

function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `mp_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newActivationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `act_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
}

interface MeetingPrepState {
  sessions: Record<string, MeetingPrepSession>;
  /** Workspace-level toggle for the "inspired persona" library, per
   *  spec §4.5. Defaults to true; admins can flip it off to fall back
   *  to archetypes-only. Persisted alongside sessions in localStorage. */
  enableInspiredPersonas: boolean;
  /** Activations keyed by sessionId → ordered list. Kept off the session
   *  record so streaming updates don't grow the session blob unnecessarily. */
  activations: Record<string, SpecialistActivation[]>;
  /** Prep plans keyed by sessionId. At most one plan per session — when
   *  the user regenerates the whole thing, we replace in place. */
  prepPlans: Record<string, PrepPlan>;

  createSession: (input?: { title?: string; userId?: string }) => string;
  deleteSession: (id: string) => void;
  getSession: (id: string) => MeetingPrepSession | null;
  listSessions: () => MeetingPrepSession[];

  updateContext: (
    id: string,
    patch: Partial<MeetingContext>,
  ) => void;
  setStatus: (id: string, status: SessionStatus) => void;
  setSummary: (id: string, summary: string) => void;

  // Participants
  addParticipant: (id: string) => void;
  updateParticipant: (
    id: string,
    participantId: string,
    patch: Partial<Participant>,
  ) => void;
  removeParticipant: (id: string, participantId: string) => void;

  // Tone tags toggle
  toggleToneTag: (id: string, tag: ToneTag) => void;

  // Workspace toggle
  setEnableInspiredPersonas: (enabled: boolean) => void;

  // Specialists
  listActivations: (sessionId: string) => SpecialistActivation[];
  addActivation: (
    sessionId: string,
    input: {
      templateId: string | null;
      customDescription: string | null;
      displayName: string;
      kind: SpecialistKind;
    },
  ) => string;
  updateActivationOutput: (
    sessionId: string,
    activationId: string,
    output: SpecialistOutput,
    status?: SpecialistActivation["status"],
  ) => void;
  setActivationStatus: (
    sessionId: string,
    activationId: string,
    status: SpecialistActivation["status"],
  ) => void;
  togglePinned: (sessionId: string, activationId: string) => void;
  removeActivation: (sessionId: string, activationId: string) => void;
  resetActivationOutput: (sessionId: string, activationId: string) => void;

  // Prep plan
  getPlan: (sessionId: string) => PrepPlan | null;
  /** Initialize an empty plan record + signature (used right before
   *  streaming starts). Replaces any existing plan in place. */
  startPlan: (sessionId: string, signature: string) => void;
  setPlanSection: <K extends PrepPlanSection>(
    sessionId: string,
    key: K,
    value: PrepPlanSections[K],
  ) => void;
  setPlanSectionStatus: (
    sessionId: string,
    key: PrepPlanSection,
    streaming: boolean,
  ) => void;
  markPlanEdited: (sessionId: string) => void;
  refreshPlanSignature: (sessionId: string, signature: string) => void;
  clearPlan: (sessionId: string) => void;
}

export const useMeetingPrepStore = create<MeetingPrepState>()(
  persist(
    (set, get) => ({
      sessions: {},
      enableInspiredPersonas: true,
      activations: {},
      prepPlans: {},

      createSession: ({ title = "", userId = "local-user" } = {}) => {
        const id = newSessionId();
        const session: MeetingPrepSession = {
          id,
          userId,
          title,
          status: "draft",
          context: { ...emptyContext(), title },
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set((s) => ({ sessions: { ...s.sessions, [id]: session } }));
        return id;
      },

      deleteSession: (id) => {
        set((s) => {
          const next = { ...s.sessions };
          delete next[id];
          return { sessions: next };
        });
      },

      getSession: (id) => get().sessions[id] ?? null,

      listSessions: () =>
        Object.values(get().sessions).sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),

      updateContext: (id, patch) => {
        set((s) => {
          const session = s.sessions[id];
          if (!session) return s;
          const nextContext = { ...session.context, ...patch };
          // Mirror title to the top-level so list views can read it cheaply.
          const nextTitle =
            patch.title !== undefined ? patch.title : session.title;
          return {
            sessions: {
              ...s.sessions,
              [id]: {
                ...session,
                title: nextTitle,
                context: nextContext,
                updatedAt: nowIso(),
              },
            },
          };
        });
      },

      setStatus: (id, status) => {
        set((s) => {
          const session = s.sessions[id];
          if (!session) return s;
          return {
            sessions: {
              ...s.sessions,
              [id]: { ...session, status, updatedAt: nowIso() },
            },
          };
        });
      },

      setSummary: (id, summary) => {
        set((s) => {
          const session = s.sessions[id];
          if (!session) return s;
          return {
            sessions: {
              ...s.sessions,
              [id]: {
                ...session,
                context: { ...session.context, summary },
                updatedAt: nowIso(),
              },
            },
          };
        });
      },

      addParticipant: (id) => {
        set((s) => {
          const session = s.sessions[id];
          if (!session) return s;
          const next = [...session.context.participants, emptyParticipant()];
          return {
            sessions: {
              ...s.sessions,
              [id]: {
                ...session,
                context: { ...session.context, participants: next },
                updatedAt: nowIso(),
              },
            },
          };
        });
      },

      updateParticipant: (id, participantId, patch) => {
        set((s) => {
          const session = s.sessions[id];
          if (!session) return s;
          const next = session.context.participants.map((p) =>
            p.id === participantId ? { ...p, ...patch } : p,
          );
          return {
            sessions: {
              ...s.sessions,
              [id]: {
                ...session,
                context: { ...session.context, participants: next },
                updatedAt: nowIso(),
              },
            },
          };
        });
      },

      removeParticipant: (id, participantId) => {
        set((s) => {
          const session = s.sessions[id];
          if (!session) return s;
          const next = session.context.participants.filter(
            (p) => p.id !== participantId,
          );
          return {
            sessions: {
              ...s.sessions,
              [id]: {
                ...session,
                context: { ...session.context, participants: next },
                updatedAt: nowIso(),
              },
            },
          };
        });
      },

      toggleToneTag: (id, tag) => {
        set((s) => {
          const session = s.sessions[id];
          if (!session) return s;
          const has = session.context.toneTags.includes(tag);
          const next = has
            ? session.context.toneTags.filter((t) => t !== tag)
            : [...session.context.toneTags, tag];
          return {
            sessions: {
              ...s.sessions,
              [id]: {
                ...session,
                context: { ...session.context, toneTags: next },
                updatedAt: nowIso(),
              },
            },
          };
        });
      },

      setEnableInspiredPersonas: (enabled) => {
        set({ enableInspiredPersonas: enabled });
      },

      listActivations: (sessionId) => get().activations[sessionId] ?? [],

      addActivation: (sessionId, input) => {
        const id = newActivationId();
        const activation: SpecialistActivation = {
          id,
          sessionId,
          templateId: input.templateId,
          customDescription: input.customDescription,
          displayName: input.displayName,
          kind: input.kind,
          status: "queued",
          output: emptyOutput(),
          pinned: false,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set((s) => ({
          activations: {
            ...s.activations,
            [sessionId]: [...(s.activations[sessionId] ?? []), activation],
          },
        }));
        return id;
      },

      updateActivationOutput: (sessionId, activationId, output, status) => {
        set((s) => {
          const list = s.activations[sessionId];
          if (!list) return s;
          const next = list.map((a) =>
            a.id === activationId
              ? {
                  ...a,
                  output: { ...a.output, ...output },
                  status: status ?? a.status,
                  updatedAt: nowIso(),
                }
              : a,
          );
          return {
            activations: { ...s.activations, [sessionId]: next },
          };
        });
      },

      setActivationStatus: (sessionId, activationId, status) => {
        set((s) => {
          const list = s.activations[sessionId];
          if (!list) return s;
          const next = list.map((a) =>
            a.id === activationId
              ? { ...a, status, updatedAt: nowIso() }
              : a,
          );
          return {
            activations: { ...s.activations, [sessionId]: next },
          };
        });
      },

      togglePinned: (sessionId, activationId) => {
        set((s) => {
          const list = s.activations[sessionId];
          if (!list) return s;
          const next = list.map((a) =>
            a.id === activationId
              ? { ...a, pinned: !a.pinned, updatedAt: nowIso() }
              : a,
          );
          return {
            activations: { ...s.activations, [sessionId]: next },
          };
        });
      },

      removeActivation: (sessionId, activationId) => {
        set((s) => {
          const list = s.activations[sessionId];
          if (!list) return s;
          return {
            activations: {
              ...s.activations,
              [sessionId]: list.filter((a) => a.id !== activationId),
            },
          };
        });
      },

      resetActivationOutput: (sessionId, activationId) => {
        set((s) => {
          const list = s.activations[sessionId];
          if (!list) return s;
          const next = list.map((a) =>
            a.id === activationId
              ? {
                  ...a,
                  output: emptyOutput(),
                  status: "queued" as const,
                  updatedAt: nowIso(),
                }
              : a,
          );
          return {
            activations: { ...s.activations, [sessionId]: next },
          };
        });
      },

      // ─── Prep plan ──────────────────────────────────────────────

      getPlan: (sessionId) => get().prepPlans[sessionId] ?? null,

      startPlan: (sessionId, signature) => {
        set((s) => ({
          prepPlans: {
            ...s.prepPlans,
            [sessionId]: {
              sessionId,
              sections: emptyPrepPlanSections(),
              sectionStatus: {},
              generatedAt: nowIso(),
              editedAt: null,
              inputsSignature: signature,
            },
          },
        }));
      },

      setPlanSection: (sessionId, key, value) => {
        set((s) => {
          const plan = s.prepPlans[sessionId];
          if (!plan) return s;
          const nextStatus = { ...plan.sectionStatus };
          delete nextStatus[key];
          return {
            prepPlans: {
              ...s.prepPlans,
              [sessionId]: {
                ...plan,
                sections: { ...plan.sections, [key]: value },
                sectionStatus: nextStatus,
              },
            },
          };
        });
      },

      setPlanSectionStatus: (sessionId, key, streaming) => {
        set((s) => {
          const plan = s.prepPlans[sessionId];
          if (!plan) return s;
          const nextStatus = { ...plan.sectionStatus };
          if (streaming) nextStatus[key] = "streaming";
          else delete nextStatus[key];
          return {
            prepPlans: {
              ...s.prepPlans,
              [sessionId]: { ...plan, sectionStatus: nextStatus },
            },
          };
        });
      },

      markPlanEdited: (sessionId) => {
        set((s) => {
          const plan = s.prepPlans[sessionId];
          if (!plan) return s;
          return {
            prepPlans: {
              ...s.prepPlans,
              [sessionId]: { ...plan, editedAt: nowIso() },
            },
          };
        });
      },

      refreshPlanSignature: (sessionId, signature) => {
        set((s) => {
          const plan = s.prepPlans[sessionId];
          if (!plan) return s;
          return {
            prepPlans: {
              ...s.prepPlans,
              [sessionId]: { ...plan, inputsSignature: signature },
            },
          };
        });
      },

      clearPlan: (sessionId) => {
        set((s) => {
          const next = { ...s.prepPlans };
          delete next[sessionId];
          return { prepPlans: next };
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
