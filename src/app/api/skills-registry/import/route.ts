import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

interface SkillDownloadFile {
  path: string;
  content: string;
}

interface SkillDownloadResponse {
  files: SkillDownloadFile[];
  skillsComputedHash: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, skillId, source } = body as {
      agentId: string;
      skillId: string;
      source: string; // e.g. "supabase/agent-skills"
    };

    if (!agentId || !skillId || !source) {
      return apiError("agentId, skillId, and source are required", 400);
    }

    // Verify agent exists
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return apiError("Agent not found", 404);
    }

    // Check for duplicate
    const existing = await prisma.agentSkill.findUnique({
      where: { agentId_key: { agentId, key: skillId } },
    });
    if (existing) {
      return apiError("Skill already installed on this agent", 409);
    }

    // Fetch skill content from skills.sh download API
    const [owner, repo] = source.split("/");
    const downloadUrl = `https://skills.sh/api/download/${owner}/${repo}/${skillId}`;

    let promptFragment = "";
    let description = "";
    let name = skillId
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    try {
      const res = await fetch(downloadUrl, {
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const data = (await res.json()) as SkillDownloadResponse;
        // Find the SKILL.md file
        const skillFile = data.files?.find(
          (f) => f.path.endsWith("SKILL.md") || f.path.endsWith("skill.md")
        );

        if (skillFile?.content) {
          // Parse frontmatter
          const fmMatch = skillFile.content.match(
            /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
          );
          if (fmMatch) {
            const frontmatter = fmMatch[1];
            promptFragment = fmMatch[2].trim();

            // Extract name from frontmatter
            const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
            if (nameMatch) {
              name = nameMatch[1]
                .trim()
                .replace(/^["']|["']$/g, "")
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
            }

            // Extract description
            const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
            if (descMatch) {
              description = descMatch[1].trim().replace(/^["']|["']$/g, "");
            }
          } else {
            // No frontmatter, entire content is the prompt
            promptFragment = skillFile.content.trim();
          }
        }
      }
    } catch {
      // If download fails, create with minimal data
    }

    // Fallback: try fetching from GitHub directly if no content yet
    if (!promptFragment) {
      try {
        const ghUrl = `https://raw.githubusercontent.com/${source}/main/${skillId}/SKILL.md`;
        const ghRes = await fetch(ghUrl);
        if (ghRes.ok) {
          const content = await ghRes.text();
          const fmMatch = content.match(
            /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
          );
          if (fmMatch) {
            promptFragment = fmMatch[2].trim();
            const descMatch = fmMatch[1].match(/^description:\s*(.+)$/m);
            if (descMatch) {
              description = descMatch[1].trim().replace(/^["']|["']$/g, "");
            }
          } else {
            promptFragment = content.trim();
          }
        }
      } catch {
        // Create with empty prompt
      }
    }

    // Create the skill
    const skill = await prisma.agentSkill.create({
      data: {
        agentId,
        name,
        key: skillId,
        description: description || `Imported from ${source}`,
        promptFragment,
        isEnabled: true,
        category: "imported",
        sortOrder: 0,
      },
    });

    return apiSuccess(skill, 201);
  } catch (e) {
    console.error("Skill import error:", e);
    return apiError("Failed to import skill", 500);
  }
}
