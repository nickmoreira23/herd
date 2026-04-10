import Anthropic from "@anthropic-ai/sdk";
import { resolveAnthropicKey } from "@/lib/integrations";

interface MeetingSummaryResult {
  summary: string;
  actionItems: Array<{
    text: string;
    assignee?: string;
    dueDate?: string;
    completed: boolean;
  }>;
  keyTopics: string[];
}

interface MeetingInsightsResult {
  nextSteps: string[];
  suggestions: string[];
}

/**
 * Summarize a meeting transcript using Claude.
 *
 * Extracts a concise summary, action items with assignees (parsed from
 * speaker attribution), and key topics discussed.
 */
export async function summarizeMeeting(
  transcript: string,
  meetingTitle: string
): Promise<MeetingSummaryResult> {
  const apiKey = await resolveAnthropicKey();
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are analyzing a meeting transcript. The meeting is titled "${meetingTitle}".

Here is the transcript:

<transcript>
${transcript}
</transcript>

Analyze this transcript and return a JSON object with exactly this structure:
{
  "summary": "A concise 2-5 paragraph summary of what was discussed, decisions made, and key outcomes.",
  "actionItems": [
    {
      "text": "Description of the action item",
      "assignee": "Name of the person responsible (from speaker labels, or null if unclear)",
      "dueDate": "Any mentioned deadline (or null)",
      "completed": false
    }
  ],
  "keyTopics": ["topic1", "topic2", "topic3"]
}

Rules:
- The summary should capture the most important points and decisions
- Extract ALL action items, tasks, follow-ups, and commitments mentioned
- For assignees, use the speaker label names from the transcript (e.g. "Speaker 1")
- Key topics should be 3-8 short phrases describing the main themes discussed
- Return ONLY the JSON object, no other text`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from the response (handle cases where it may be wrapped in markdown)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse summary from AI response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as MeetingSummaryResult;

  return {
    summary: parsed.summary || "",
    actionItems: (parsed.actionItems || []).map((item) => ({
      text: item.text || "",
      assignee: item.assignee || undefined,
      dueDate: item.dueDate || undefined,
      completed: false,
    })),
    keyTopics: parsed.keyTopics || [],
  };
}

/**
 * Generate next steps and strategic suggestions from a meeting transcript and summary.
 * Goes beyond action items to provide proactive recommendations.
 */
export async function generateMeetingInsights(
  transcript: string,
  summary: string,
  meetingTitle: string,
  options: {
    generateNextSteps?: boolean;
    generateSuggestions?: boolean;
  } = {}
): Promise<MeetingInsightsResult> {
  const apiKey = await resolveAnthropicKey();
  const client = new Anthropic({ apiKey });

  const sections: string[] = [];
  if (options.generateNextSteps !== false) {
    sections.push(
      `"nextSteps": ["Specific recommended next steps based on the meeting discussion. These go beyond explicit action items to include strategic recommendations, follow-up meetings to schedule, research to conduct, etc. Include 3-6 steps."]`
    );
  }
  if (options.generateSuggestions !== false) {
    sections.push(
      `"suggestions": ["Strategic observations and suggestions. For example: topics that were discussed multiple times without resolution, potential risks mentioned but not addressed, opportunities identified, process improvements, etc. Include 2-5 suggestions."]`
    );
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a strategic meeting analyst. Analyze this meeting and provide insights beyond what was explicitly discussed.

Meeting: "${meetingTitle}"

Summary:
${summary}

Transcript excerpt (last portion):
${transcript.slice(-3000)}

Return a JSON object:
{
  ${sections.join(",\n  ")}
}

Rules:
- Next steps should be actionable and specific
- Suggestions should be strategic and forward-looking
- Focus on value-add insights the participants might not have considered
- Be concise — each item should be 1-2 sentences
- Return ONLY the JSON object, no other text`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { nextSteps: [], suggestions: [] };
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    nextSteps: parsed.nextSteps || [],
    suggestions: parsed.suggestions || [],
  };
}

/**
 * Generate a pre-meeting briefing based on past meetings with the same attendees.
 */
export async function generateMeetingBriefing(
  upcomingMeetingTitle: string,
  attendeeEmails: string[],
  pastMeetingContext: Array<{
    title: string;
    summary: string;
    actionItems: Array<{ text: string; completed?: boolean }>;
    date: string;
  }>
): Promise<string> {
  const apiKey = await resolveAnthropicKey();
  if (pastMeetingContext.length === 0) {
    return "No previous meetings with these attendees found.";
  }

  const client = new Anthropic({ apiKey });

  const pastMeetingsText = pastMeetingContext
    .map(
      (m) =>
        `- "${m.title}" (${m.date}):\n  Summary: ${m.summary?.slice(0, 200) || "No summary"}\n  Open action items: ${
          m.actionItems
            ?.filter((a) => !a.completed)
            .map((a) => a.text)
            .join("; ") || "None"
        }`
    )
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a brief pre-meeting briefing for the upcoming meeting: "${upcomingMeetingTitle}"

Attendees include: ${attendeeEmails.join(", ")}

Previous meetings with these attendees:
${pastMeetingsText}

Write a 3-5 sentence briefing that:
1. Summarizes key topics from previous meetings
2. Highlights any unresolved action items
3. Suggests what might be discussed in this upcoming meeting
4. Notes any patterns or recurring themes

Be concise and actionable.`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}
