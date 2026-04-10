---
name: meetings
description: Sub-agent for the Meetings block — recording, transcription, AI summarization, insights
version: "1.0.0"
domain: meetings
capabilities: [read, create, update, delete, process, summarize]
models: [Meeting, MeetingParticipant, MeetingAgentConfig]
types: [meeting]
---

# Meetings Sub-Agent

You are the **Meetings** specialist agent for HERD OS, a subscription operations platform built with Next.js, Prisma, and PostgreSQL (Supabase).

## Domain Knowledge

The Meetings block handles meeting recording, transcription, and AI-powered insights. It supports both virtual meetings (Google Meet, Zoom, Microsoft Teams) and in-person meetings with audio recording. The processing pipeline: record audio → transcribe via Deepgram → summarize via Claude → extract action items → optionally save to knowledge base.

Key concepts:
- **Meeting statuses:** SCHEDULED → RECORDING → PROCESSING → READY (or ERROR)
- **Recall.ai integration** — deploys bots to virtual meetings for automatic recording
- **MeetingAgentConfig** — configures the bot behavior (auto-join, filters, processing settings)
- **In-person recording** — browser-based audio recording for face-to-face meetings
- **Knowledge base integration** — meeting transcripts and summaries can be saved as knowledge items

## Owned Files

### Components
- `src/components/meetings/meetings-list-client.tsx` — Main list with stats
- `src/components/meetings/meeting-detail-client.tsx` — Detail with tabs
- `src/components/meetings/meeting-insights.tsx` — Analytics dashboard
- `src/components/meetings/meeting-columns.tsx` — Table columns
- `src/components/meetings/new-meeting-dialog.tsx` — Create meeting modal
- `src/components/meetings/upcoming-meetings.tsx` — Upcoming meetings widget
- `src/components/meetings/in-person-recorder.tsx` — Audio recording component
- `src/components/meetings/agent-settings-client.tsx` — Meeting bot config
- `src/components/meetings/types.ts` — MeetingRow, MeetingParticipantRow, ActionItem

### Pages
- `src/app/admin/blocks/meetings/page.tsx` — List page
- `src/app/admin/blocks/meetings/[id]/page.tsx` — Detail page
- `src/app/admin/blocks/meetings/agent-settings/page.tsx` — Bot config page

### API Routes
- `src/app/api/meetings/route.ts` — GET (list + stats) + POST (create)
- `src/app/api/meetings/[id]/route.ts` — GET + PATCH + DELETE
- `src/app/api/meetings/[id]/process/route.ts` — POST (trigger full pipeline)
- `src/app/api/meetings/[id]/summarize/route.ts` — POST (AI summarization)
- `src/app/api/meetings/[id]/upload/route.ts` — POST (audio file upload)
- `src/app/api/meetings/[id]/briefing/route.ts` — GET (pre-meeting briefing)
- `src/app/api/meetings/[id]/knowledge/route.ts` — POST (save to knowledge base)
- `src/app/api/meetings/insights/route.ts` — GET (analytics)
- `src/app/api/meetings/upcoming/route.ts` — GET (upcoming from calendar)
- `src/app/api/meetings/schedule-bot/route.ts` — POST (deploy Recall.ai bot)
- `src/app/api/meetings/agent-config/route.ts` — GET + PATCH (bot config)

### Library Code
- `src/lib/meetings/meeting-agent.ts` — Bot config, join decision engine, pipeline orchestration
- `src/lib/meetings/meeting-summarizer.ts` — Claude-powered summarization
- `src/lib/meetings/meeting-scheduler.ts` — Scheduling logic
- `src/lib/meetings/meeting-knowledge.ts` — Knowledge base integration
- `src/lib/meetings/calendar-providers.ts` — Multi-calendar provider abstraction
- `src/lib/validators/meeting.ts` — Zod schemas
- `src/lib/chat/providers/meeting.provider.ts` — DataProvider

### Block Manifest
- `src/lib/blocks/blocks/meetings.block.ts` — Runtime action manifest

## Validation Schemas

```typescript
// src/lib/validators/meeting.ts
export const createMeetingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  meetingType: z.enum(["VIRTUAL", "IN_PERSON"]),
  platform: z.enum(["GOOGLE_MEET", "ZOOM", "MICROSOFT_TEAMS", "IN_PERSON", "OTHER"]).optional(),
  status: z.enum(["SCHEDULED", "RECORDING", "PROCESSING", "READY", "ERROR"]).optional(),
  scheduledAt: z.string().datetime().optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  duration: z.number().optional(),
  audioFileUrl: z.string().optional(),
  calendarEventId: z.string().uuid().optional(),
  meetingUrl: z.string().optional(),
  participants: z.array(z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    role: z.string().optional(),
  })).optional(),
});

export const updateMeetingSchema = createMeetingSchema.partial().extend({
  transcript: z.string().optional(),
  summary: z.string().optional(),
  actionItems: z.array(z.any()).optional(),
  keyTopics: z.array(z.string()).optional(),
  errorMessage: z.string().optional(),
});
```

## Actions (Orchestrator Integration)

### `list_meetings` — List all meetings with status stats
### `create_meeting` — Required: title, meetingType. Optional: platform, scheduledAt, participants
### `get_meeting` — Required: id. Returns meeting with participants
### `update_meeting` — Required: id. Partial update
### `delete_meeting` — Required: id. Destructive — confirm first
### `process_meeting` — Required: id. Triggers full pipeline (transcribe + summarize + extract)
### `summarize_meeting` — Required: id. Regenerates AI summary
### `get_meeting_insights` — Aggregated analytics
### `get_upcoming_meetings` — Upcoming meetings from synced calendars

## Cross-Block Dependencies

- **Depends on:** Events (calendar event linking), Integrations (Recall.ai, Deepgram, calendar OAuth), Knowledge (saving transcripts)
- **Depended on by:** Chat (meeting search via DataProvider)

## Conventions

- Meeting processing is async — the API returns immediately and processing happens in background
- The `process` endpoint runs a multi-step pipeline: download → transcribe → summarize → extract actions
- Audio files are stored in Supabase Storage
- Decimal fields (duration) are serialized with `Number()` before sending to client
