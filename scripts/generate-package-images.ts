/**
 * Generates 12 SVG cover image variations per fitness goal
 * Run: npx tsx scripts/generate-package-images.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const OUT_DIR = join(__dirname, "..", "public", "images", "packages");

interface GoalConfig {
  key: string;
  gradients: [string, string][];
  iconPath: string;
}

// Each goal has a base icon SVG path group and 12 gradient variations
const GOALS: GoalConfig[] = [
  {
    key: "weight-loss",
    gradients: [
      ["#FF6B6B", "#EE5A24"], ["#FF8A80", "#FF5252"], ["#E57373", "#C62828"],
      ["#FF7043", "#D84315"], ["#EF5350", "#B71C1C"], ["#FF8A65", "#E64A19"],
      ["#F44336", "#AD1457"], ["#FF6E40", "#DD2C00"], ["#E53935", "#880E4F"],
      ["#FF5722", "#BF360C"], ["#D32F2F", "#6A1B9A"], ["#FF7043", "#F4511E"],
    ],
    iconPath: `<g transform="translate(260, 150)" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
    <line x1="40" y1="0" x2="40" y2="60"/>
    <line x1="10" y1="60" x2="70" y2="60"/>
    <path d="M10 20 L40 0 L70 20"/>
    <path d="M0 20 Q10 40 20 20"/>
    <path d="M60 20 Q70 40 80 20"/>
  </g>`,
  },
  {
    key: "muscle-gain",
    gradients: [
      ["#42A5F5", "#1565C0"], ["#5C6BC0", "#283593"], ["#29B6F6", "#0277BD"],
      ["#66BB6A", "#2E7D32"], ["#26C6DA", "#00838F"], ["#7986CB", "#303F9F"],
      ["#2196F3", "#0D47A1"], ["#039BE5", "#01579B"], ["#1E88E5", "#1565C0"],
      ["#3F51B5", "#1A237E"], ["#0288D1", "#006064"], ["#1976D2", "#0D47A1"],
    ],
    iconPath: `<g transform="translate(255, 150)" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" opacity="0.9">
    <rect x="0" y="25" width="12" height="30" rx="2"/>
    <rect x="68" y="25" width="12" height="30" rx="2"/>
    <line x1="12" y1="40" x2="68" y2="40"/>
    <rect x="15" y="20" width="10" height="40" rx="2"/>
    <rect x="55" y="20" width="10" height="40" rx="2"/>
    <rect x="28" y="30" width="24" height="20" rx="3"/>
  </g>`,
  },
  {
    key: "performance",
    gradients: [
      ["#AB47BC", "#6A1B9A"], ["#7E57C2", "#4527A0"], ["#CE93D8", "#8E24AA"],
      ["#BA68C8", "#7B1FA2"], ["#9C27B0", "#4A148C"], ["#8E24AA", "#311B92"],
      ["#E040FB", "#AA00FF"], ["#D500F9", "#6200EA"], ["#EA80FC", "#D500F9"],
      ["#B388FF", "#651FFF"], ["#7C4DFF", "#304FFE"], ["#9575CD", "#512DA8"],
    ],
    iconPath: `<g transform="translate(265, 148)" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
    <polygon points="35,0 45,25 70,25 50,42 58,70 35,53 12,70 20,42 0,25 25,25"/>
  </g>`,
  },
  {
    key: "endurance",
    gradients: [
      ["#66BB6A", "#2E7D32"], ["#81C784", "#388E3C"], ["#4CAF50", "#1B5E20"],
      ["#00C853", "#00BFA5"], ["#43A047", "#00695C"], ["#69F0AE", "#00C853"],
      ["#26A69A", "#004D40"], ["#009688", "#00695C"], ["#00E676", "#00C853"],
      ["#4DB6AC", "#00796B"], ["#80CBC4", "#00897B"], ["#A5D6A7", "#43A047"],
    ],
    iconPath: `<g transform="translate(260, 150)" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
    <circle cx="40" cy="30" r="28"/>
    <line x1="40" y1="10" x2="40" y2="30"/>
    <line x1="40" y1="30" x2="55" y2="38"/>
    <line x1="40" y1="2" x2="40" y2="6"/>
    <line x1="40" y1="54" x2="40" y2="58"/>
    <line x1="14" y1="30" x2="18" y2="30"/>
    <line x1="62" y1="30" x2="66" y2="30"/>
  </g>`,
  },
  {
    key: "general-wellness",
    gradients: [
      ["#FFB74D", "#F57C00"], ["#FFA726", "#EF6C00"], ["#FFCC02", "#FF8F00"],
      ["#FFD54F", "#FF8F00"], ["#FFB300", "#E65100"], ["#FFC107", "#F57F17"],
      ["#FFAB40", "#FF6D00"], ["#FFD740", "#FFAB00"], ["#FF9800", "#E65100"],
      ["#FFE082", "#FFA000"], ["#FFD600", "#F9A825"], ["#FFC400", "#FF8F00"],
    ],
    iconPath: `<g transform="translate(260, 145)" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
    <path d="M40 65 C40 65 70 45 70 25 C70 10 55 0 40 15 C25 0 10 10 10 25 C10 45 40 65 40 65Z"/>
  </g>`,
  },
  {
    key: "recovery",
    gradients: [
      ["#4DB6AC", "#00695C"], ["#26A69A", "#004D40"], ["#80CBC4", "#00897B"],
      ["#009688", "#004D40"], ["#00BCD4", "#006064"], ["#4DD0E1", "#00838F"],
      ["#26C6DA", "#00695C"], ["#B2DFDB", "#00897B"], ["#00ACC1", "#006064"],
      ["#0097A7", "#004D40"], ["#80DEEA", "#00838F"], ["#4DB6AC", "#00796B"],
    ],
    iconPath: `<g transform="translate(258, 148)" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
    <path d="M10 55 Q10 10 40 10 Q70 10 70 55"/>
    <line x1="10" y1="55" x2="70" y2="55"/>
    <line x1="40" y1="10" x2="40" y2="0"/>
    <circle cx="40" cy="35" r="5"/>
  </g>`,
  },
  {
    key: "strength",
    gradients: [
      ["#FF9800", "#E65100"], ["#F57C00", "#BF360C"], ["#FB8C00", "#D84315"],
      ["#EF6C00", "#BF360C"], ["#FF6D00", "#DD2C00"], ["#FFB74D", "#E65100"],
      ["#FFA726", "#F4511E"], ["#FF8F00", "#D84315"], ["#FFAB40", "#E65100"],
      ["#FF9100", "#BF360C"], ["#FFB300", "#E65100"], ["#FF6F00", "#DD2C00"],
    ],
    iconPath: `<g transform="translate(255, 145)" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
    <path d="M40 5 L40 65"/>
    <path d="M25 5 L55 5"/>
    <path d="M25 65 L55 65"/>
    <path d="M20 15 L20 55"/>
    <path d="M60 15 L60 55"/>
    <path d="M10 20 L10 50"/>
    <path d="M70 20 L70 50"/>
  </g>`,
  },
  {
    key: "body-recomp",
    gradients: [
      ["#00BCD4", "#006064"], ["#0097A7", "#004D40"], ["#00ACC1", "#00695C"],
      ["#26C6DA", "#00838F"], ["#4DD0E1", "#006064"], ["#00B8D4", "#00838F"],
      ["#0091EA", "#006064"], ["#00B0FF", "#00838F"], ["#18FFFF", "#0097A7"],
      ["#84FFFF", "#00ACC1"], ["#40C4FF", "#0277BD"], ["#00E5FF", "#00838F"],
    ],
    iconPath: `<g transform="translate(258, 145)" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
    <path d="M10 55 L25 35 L40 45 L55 15 L70 25"/>
    <polyline points="50,15 55,15 55,20"/>
    <circle cx="40" cy="45" r="3" fill="white"/>
  </g>`,
  },
  {
    key: "custom",
    gradients: [
      ["#78909C", "#37474F"], ["#90A4AE", "#455A64"], ["#607D8B", "#263238"],
      ["#B0BEC5", "#546E7A"], ["#546E7A", "#263238"], ["#78909C", "#37474F"],
      ["#455A64", "#1B2631"], ["#607D8B", "#37474F"], ["#B0BEC5", "#607D8B"],
      ["#90A4AE", "#37474F"], ["#78909C", "#455A64"], ["#546E7A", "#37474F"],
    ],
    iconPath: `<g transform="translate(258, 145)" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
    <path d="M50 10 L65 25 L30 60 L10 65 L15 45 L50 10Z"/>
    <line x1="43" y1="17" x2="58" y2="32"/>
  </g>`,
  },
];

// Decorative elements — vary positions per variant
const CIRCLE_SETS = [
  [{ cx: 480, cy: 80, r: 160 }, { cx: 520, cy: 320, r: 100 }, { cx: 100, cy: 350, r: 80 }],
  [{ cx: 500, cy: 60, r: 140 }, { cx: 80, cy: 300, r: 120 }, { cx: 450, cy: 340, r: 70 }],
  [{ cx: 120, cy: 80, r: 150 }, { cx: 500, cy: 300, r: 110 }, { cx: 300, cy: 350, r: 60 }],
  [{ cx: 450, cy: 100, r: 170 }, { cx: 150, cy: 320, r: 90 }, { cx: 500, cy: 280, r: 75 }],
  [{ cx: 100, cy: 60, r: 130 }, { cx: 480, cy: 280, r: 130 }, { cx: 250, cy: 350, r: 65 }],
  [{ cx: 530, cy: 100, r: 145 }, { cx: 80, cy: 280, r: 100 }, { cx: 400, cy: 350, r: 85 }],
  [{ cx: 300, cy: 50, r: 155 }, { cx: 550, cy: 300, r: 95 }, { cx: 80, cy: 330, r: 70 }],
  [{ cx: 460, cy: 70, r: 135 }, { cx: 100, cy: 310, r: 115 }, { cx: 520, cy: 340, r: 60 }],
  [{ cx: 150, cy: 100, r: 160 }, { cx: 500, cy: 280, r: 85 }, { cx: 350, cy: 330, r: 75 }],
  [{ cx: 520, cy: 90, r: 150 }, { cx: 120, cy: 340, r: 100 }, { cx: 400, cy: 300, r: 70 }],
  [{ cx: 80, cy: 70, r: 140 }, { cx: 480, cy: 320, r: 110 }, { cx: 300, cy: 340, r: 80 }],
  [{ cx: 400, cy: 60, r: 165 }, { cx: 550, cy: 310, r: 90 }, { cx: 100, cy: 320, r: 65 }],
];

const DOT_SETS = [
  [{ cx: 150, cy: 100, r: 4, o: 0.3 }, { cx: 180, cy: 130, r: 3, o: 0.2 }, { cx: 420, cy: 280, r: 5, o: 0.2 }, { cx: 350, cy: 300, r: 3, o: 0.15 }],
  [{ cx: 420, cy: 80, r: 4, o: 0.25 }, { cx: 130, cy: 260, r: 3, o: 0.2 }, { cx: 480, cy: 200, r: 5, o: 0.15 }, { cx: 200, cy: 320, r: 3, o: 0.2 }],
  [{ cx: 200, cy: 90, r: 5, o: 0.2 }, { cx: 450, cy: 150, r: 3, o: 0.25 }, { cx: 100, cy: 250, r: 4, o: 0.15 }, { cx: 500, cy: 330, r: 3, o: 0.2 }],
  [{ cx: 350, cy: 70, r: 3, o: 0.25 }, { cx: 100, cy: 200, r: 4, o: 0.2 }, { cx: 520, cy: 260, r: 5, o: 0.15 }, { cx: 250, cy: 340, r: 3, o: 0.2 }],
  [{ cx: 500, cy: 100, r: 4, o: 0.2 }, { cx: 150, cy: 180, r: 3, o: 0.3 }, { cx: 400, cy: 300, r: 4, o: 0.15 }, { cx: 80, cy: 280, r: 5, o: 0.2 }],
  [{ cx: 250, cy: 80, r: 3, o: 0.25 }, { cx: 480, cy: 180, r: 4, o: 0.2 }, { cx: 120, cy: 300, r: 5, o: 0.15 }, { cx: 380, cy: 330, r: 3, o: 0.2 }],
  [{ cx: 180, cy: 70, r: 4, o: 0.3 }, { cx: 400, cy: 130, r: 3, o: 0.2 }, { cx: 520, cy: 280, r: 4, o: 0.2 }, { cx: 280, cy: 310, r: 5, o: 0.15 }],
  [{ cx: 450, cy: 90, r: 5, o: 0.2 }, { cx: 100, cy: 170, r: 3, o: 0.25 }, { cx: 350, cy: 280, r: 4, o: 0.15 }, { cx: 520, cy: 340, r: 3, o: 0.2 }],
  [{ cx: 300, cy: 80, r: 3, o: 0.3 }, { cx: 500, cy: 200, r: 4, o: 0.2 }, { cx: 80, cy: 300, r: 5, o: 0.15 }, { cx: 420, cy: 320, r: 3, o: 0.25 }],
  [{ cx: 120, cy: 110, r: 4, o: 0.25 }, { cx: 350, cy: 150, r: 3, o: 0.2 }, { cx: 480, cy: 270, r: 5, o: 0.2 }, { cx: 200, cy: 340, r: 4, o: 0.15 }],
  [{ cx: 400, cy: 70, r: 3, o: 0.3 }, { cx: 150, cy: 220, r: 4, o: 0.2 }, { cx: 500, cy: 300, r: 4, o: 0.15 }, { cx: 300, cy: 330, r: 5, o: 0.2 }],
  [{ cx: 200, cy: 100, r: 5, o: 0.2 }, { cx: 430, cy: 160, r: 3, o: 0.25 }, { cx: 100, cy: 280, r: 4, o: 0.2 }, { cx: 520, cy: 310, r: 3, o: 0.15 }],
];

function generateSvg(goal: GoalConfig, variantIndex: number): string {
  const [color1, color2] = goal.gradients[variantIndex];
  const circles = CIRCLE_SETS[variantIndex];
  const dots = DOT_SETS[variantIndex];

  // Alternate gradient direction for variety
  const gradDir = variantIndex % 3 === 0
    ? 'x1="0%" y1="0%" x2="100%" y2="100%"'
    : variantIndex % 3 === 1
      ? 'x1="100%" y1="0%" x2="0%" y2="100%"'
      : 'x1="0%" y1="100%" x2="100%" y2="0%"';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="bg" ${gradDir}>
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.15" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0.02" />
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#bg)" rx="0"/>
${circles.map((c) => `  <circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="url(#accent)"/>`).join("\n")}
  ${goal.iconPath}
${dots.map((d) => `  <circle cx="${d.cx}" cy="${d.cy}" r="${d.r}" fill="white" opacity="${d.o}"/>`).join("\n")}
</svg>
`;
}

// Generate all SVGs
mkdirSync(OUT_DIR, { recursive: true });

let count = 0;
for (const goal of GOALS) {
  for (let i = 0; i < 12; i++) {
    const filename = i === 0 ? `${goal.key}.svg` : `${goal.key}-${i + 1}.svg`;
    const svg = generateSvg(goal, i);
    writeFileSync(join(OUT_DIR, filename), svg);
    count++;
  }
}

console.log(`Generated ${count} SVG files in ${OUT_DIR}`);
