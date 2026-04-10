import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source") || "";
  const skillId = request.nextUrl.searchParams.get("skillId") || "";

  if (!source || !skillId) {
    return NextResponse.json(
      { error: "source and skillId are required" },
      { status: 400 }
    );
  }

  const [owner, repo] = source.split("/");
  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Invalid source format (expected owner/repo)" },
      { status: 400 }
    );
  }

  let name = skillId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  let description = "";
  let content = "";

  try {
    // Try skills.sh download API first
    const downloadUrl = `https://skills.sh/api/download/${owner}/${repo}/${skillId}`;
    const res = await fetch(downloadUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const data = await res.json();
      const skillFile = data.files?.find(
        (f: { path: string }) =>
          f.path.endsWith("SKILL.md") || f.path.endsWith("skill.md")
      );

      if (skillFile?.content) {
        const fmMatch = skillFile.content.match(
          /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
        );
        if (fmMatch) {
          const frontmatter = fmMatch[1];
          content = fmMatch[2].trim();

          const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
          if (nameMatch) {
            name = nameMatch[1]
              .trim()
              .replace(/^["']|["']$/g, "")
              .split("-")
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");
          }

          const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
          if (descMatch) {
            description = descMatch[1].trim().replace(/^["']|["']$/g, "");
          }
        } else {
          content = skillFile.content.trim();
        }
      }
    }
  } catch {
    // Fall through to GitHub fallback
  }

  // Fallback: try GitHub raw content
  if (!content) {
    try {
      const ghUrl = `https://raw.githubusercontent.com/${source}/main/${skillId}/SKILL.md`;
      const ghRes = await fetch(ghUrl, { next: { revalidate: 300 } });
      if (ghRes.ok) {
        const raw = await ghRes.text();
        const fmMatch = raw.match(
          /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
        );
        if (fmMatch) {
          content = fmMatch[2].trim();
          const descMatch = fmMatch[1].match(/^description:\s*(.+)$/m);
          if (descMatch) {
            description = descMatch[1].trim().replace(/^["']|["']$/g, "");
          }
        } else {
          content = raw.trim();
        }
      }
    } catch {
      // No content available
    }
  }

  return NextResponse.json({
    skillId,
    source,
    name,
    description,
    content,
  });
}
