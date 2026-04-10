import { z } from "zod";

const MEETING_TYPES = ["VIRTUAL", "IN_PERSON"] as const;
const MEETING_STATUSES = ["SCHEDULED", "RECORDING", "PROCESSING", "READY", "ERROR"] as const;
const MEETING_PLATFORMS = ["GOOGLE_MEET", "ZOOM", "MICROSOFT_TEAMS", "IN_PERSON", "OTHER"] as const;

export const createMeetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  meetingType: z.enum(MEETING_TYPES),
  platform: z.enum(MEETING_PLATFORMS).optional(),
  status: z.enum(MEETING_STATUSES).optional(),
  scheduledAt: z.coerce.date().optional(),
  startedAt: z.coerce.date().optional(),
  endedAt: z.coerce.date().optional(),
  duration: z.coerce.number().nonnegative().optional(),
  audioFileUrl: z.string().optional(),
  audioFileSize: z.coerce.number().int().nonnegative().optional(),
  audioMimeType: z.string().optional(),
  calendarEventId: z.string().optional(),
  meetingUrl: z.string().url().optional().or(z.literal("")),
  participantCount: z.coerce.number().int().nonnegative().optional(),
  participants: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        role: z.string().optional(),
      })
    )
    .optional(),
});

export const updateMeetingSchema = createMeetingSchema.partial().extend({
  transcript: z.string().optional(),
  summary: z.string().optional(),
  actionItems: z
    .array(
      z.object({
        text: z.string(),
        assignee: z.string().optional(),
        dueDate: z.string().optional(),
        completed: z.boolean().optional(),
      })
    )
    .optional(),
  keyTopics: z.array(z.string()).optional(),
  errorMessage: z.string().optional().nullable(),
});
