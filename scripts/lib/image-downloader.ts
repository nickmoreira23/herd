import * as fs from "fs";
import * as path from "path";

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const LOGOS_DIR = path.join(PUBLIC_DIR, "partners", "logos");
const HEROES_DIR = path.join(PUBLIC_DIR, "partners", "heroes");

function ensureDirs() {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
  fs.mkdirSync(HEROES_DIR, { recursive: true });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function downloadImage(
  imageUrl: string,
  partnerName: string,
  type: "logo" | "hero"
): Promise<string | null> {
  ensureDirs();

  try {
    const url = new URL(imageUrl);
    const ext = path.extname(url.pathname).split("?")[0] || ".png";
    const slug = slugify(partnerName);
    const filename = `${slug}${ext}`;
    const dir = type === "logo" ? LOGOS_DIR : HEROES_DIR;
    const filePath = path.join(dir, filename);

    // Skip if already downloaded
    if (fs.existsSync(filePath)) {
      return `/partners/${type === "logo" ? "logos" : "heroes"}/${filename}`;
    }

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "image/*,*/*",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      console.warn(`  Failed to download ${type} for ${partnerName}: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const publicPath = `/partners/${type === "logo" ? "logos" : "heroes"}/${filename}`;
    console.log(`  Downloaded ${type}: ${publicPath} (${(buffer.length / 1024).toFixed(1)}KB)`);
    return publicPath;
  } catch (error) {
    console.warn(`  Error downloading ${type} for ${partnerName}:`, error instanceof Error ? error.message : error);
    return null;
  }
}
