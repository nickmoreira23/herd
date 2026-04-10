export interface MeetingParticipantRow {
  id: string;
  meetingId: string;
  name: string;
  email: string | null;
  speakerLabel: string | null;
  role: string | null;
  createdAt: string;
}

export interface ActionItem {
  text: string;
  assignee?: string;
  dueDate?: string;
  completed?: boolean;
}

export interface MeetingRow {
  id: string;
  title: string;
  description: string | null;
  meetingType: "VIRTUAL" | "IN_PERSON";
  platform: "GOOGLE_MEET" | "ZOOM" | "MICROSOFT_TEAMS" | "IN_PERSON" | "OTHER";
  status: "SCHEDULED" | "RECORDING" | "PROCESSING" | "READY" | "ERROR";
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  duration: number | null;
  audioFileUrl: string | null;
  audioFileSize: number | null;
  audioMimeType: string | null;
  transcript: string | null;
  chunkCount: number;
  summary: string | null;
  actionItems: ActionItem[] | null;
  keyTopics: string[];
  calendarEventId: string | null;
  meetingUrl: string | null;
  externalBotId: string | null;
  participantCount: number | null;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  participants: MeetingParticipantRow[];
}
