/**
 * Serialize a PrepPlan into Markdown for the "Copy as Markdown" action
 * and (eventually) for the export-to-file flow. The shape mirrors the
 * sections defined in 03-prep-plan.md so a copy-paste ends up in a
 * doc that reads like the on-screen rendering.
 */

import type { MeetingContext, PrepPlan } from "./types";

function nonEmpty<T>(arr: T[] | undefined): arr is T[] {
  return Array.isArray(arr) && arr.length > 0;
}

export function planToMarkdown(plan: PrepPlan, ctx: MeetingContext): string {
  const lines: string[] = [];
  const title = ctx.title.trim() || "Untitled meeting";
  lines.push(`# Prep plan — ${title}`, "");
  if (ctx.summary.trim()) {
    lines.push(`_${ctx.summary.trim()}_`, "");
  }

  const s = plan.sections;

  if (s.executiveSummary) {
    lines.push("## Executive summary", "", s.executiveSummary, "");
  }

  if (nonEmpty(s.objectives)) {
    lines.push("## The 3 objectives", "");
    s.objectives.forEach((o, i) => {
      lines.push(`${i + 1}. **${o.text}**`);
      if (o.rationale) lines.push(`   - _Why:_ ${o.rationale}`);
    });
    lines.push("");
  }

  if (nonEmpty(s.counterpartMotives)) {
    lines.push("## What the other side likely wants", "");
    s.counterpartMotives.forEach((m) => lines.push(`- ${m}`));
    lines.push("");
  }

  if (nonEmpty(s.risks)) {
    lines.push("## Risks", "");
    s.risks.forEach((r) => {
      lines.push(`- **${r.text}**`);
      if (r.mitigation) lines.push(`  - _Mitigation:_ ${r.mitigation}`);
    });
    lines.push("");
  }

  if (nonEmpty(s.opportunities)) {
    lines.push("## Opportunities", "");
    s.opportunities.forEach((o) => lines.push(`- ${o}`));
    lines.push("");
  }

  if (nonEmpty(s.anticipatedQuestions)) {
    lines.push("## Questions they'll likely ask", "");
    s.anticipatedQuestions.forEach((q) => {
      lines.push(`- **Q:** ${q.question}`);
      if (q.suggestedAnswer) lines.push(`  - **A:** ${q.suggestedAnswer}`);
    });
    lines.push("");
  }

  if (nonEmpty(s.myQuestions)) {
    lines.push("## Questions YOU should ask", "");
    s.myQuestions.forEach((q) => lines.push(`- ${q}`));
    lines.push("");
  }

  if (nonEmpty(s.objections)) {
    lines.push("## Expected objections", "");
    s.objections.forEach((o) => {
      lines.push(`- **Objection:** ${o.objection}`);
      if (o.reveals) lines.push(`  - _Reveals:_ ${o.reveals}`);
      if (o.response) lines.push(`  - _Response:_ ${o.response}`);
    });
    lines.push("");
  }

  const a = s.anchorPhrases;
  if (a && (a.opening || a.pivot || a.closing)) {
    lines.push("## Anchor phrases", "");
    if (a.opening) lines.push(`- **Opening:** ${a.opening}`);
    if (a.pivot) lines.push(`- **Pivot:** ${a.pivot}`);
    if (a.closing) lines.push(`- **Closing:** ${a.closing}`);
    lines.push("");
  }

  if (s.planB) {
    lines.push("## Plan B", "", s.planB, "");
  }

  if (nonEmpty(s.materialsChecklist)) {
    lines.push("## Materials checklist", "");
    s.materialsChecklist.forEach((m) => lines.push(`- [ ] ${m}`));
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}
