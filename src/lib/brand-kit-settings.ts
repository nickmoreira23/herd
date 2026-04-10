// ─── Brand Kit Settings — shared constants, types & utilities ────────────────

// ─── Font Options ────────────────────────────────────────────────────────────

export const FONT_OPTIONS = [
  "Inter",
  "Nunito",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Raleway",
  "Source Sans 3",
  "DM Sans",
  "Plus Jakarta Sans",
  "Outfit",
  "Manrope",
  "Space Grotesk",
];

export const FONT_WEIGHT_OPTIONS = [
  { value: "400", label: "Regular (400)" },
  { value: "500", label: "Medium (500)" },
  { value: "600", label: "Semibold (600)" },
  { value: "700", label: "Bold (700)" },
  { value: "800", label: "Extrabold (800)" },
];

export const FONT_SIZE_OPTIONS = [
  { value: "12", label: "12px" },
  { value: "14", label: "14px" },
  { value: "16", label: "16px" },
  { value: "18", label: "18px" },
  { value: "20", label: "20px" },
  { value: "24", label: "24px" },
  { value: "28", label: "28px" },
  { value: "32", label: "32px" },
  { value: "36", label: "36px" },
  { value: "40", label: "40px" },
  { value: "48", label: "48px" },
];

// ─── Typography Roles ────────────────────────────────────────────────────────

export interface FontRoleConfig {
  family: string;
  size: string;
  weight: string;
  italic: boolean;
}

export const DEFAULT_FONT_ROLES: Record<string, FontRoleConfig> = {
  title: { family: "Inter", size: "36", weight: "700", italic: false },
  subtitle: { family: "Inter", size: "24", weight: "600", italic: false },
  heading: { family: "Inter", size: "20", weight: "600", italic: false },
  subheading: { family: "Inter", size: "16", weight: "600", italic: false },
  body: { family: "Nunito", size: "16", weight: "400", italic: false },
  caption: { family: "Nunito", size: "12", weight: "400", italic: false },
  quote: { family: "Nunito", size: "18", weight: "400", italic: true },
};

export const FONT_ROLE_LABELS: Record<string, string> = {
  title: "Title",
  subtitle: "Subtitle",
  heading: "Heading",
  subheading: "Subheading",
  body: "Body",
  caption: "Caption",
  quote: "Quote",
};

// ─── Image Slots ─────────────────────────────────────────────────────────────

export interface ImageSlot {
  settingKey: string;
  label: string;
  description: string;
}

export const LIGHT_IMAGE_SLOTS: ImageSlot[] = [
  {
    settingKey: "companyIconUrl",
    label: "Logo Icon",
    description: "Square icon used in the sidebar header. Min 64x64px.",
  },
  {
    settingKey: "companyLogoUrl",
    label: "Logo Horizontal",
    description: "Full logo mark used in login page and exports.",
  },
  {
    settingKey: "companyFaviconUrl",
    label: "Favicon",
    description: "Browser tab icon. Recommended 32x32px PNG.",
  },
  {
    settingKey: "companyAgentCircleUrl",
    label: "Agent Circle",
    description: "Circular avatar used for the AI assistant.",
  },
  {
    settingKey: "companyAgentFullUrl",
    label: "Agent Full Body",
    description: "Full body illustration of the AI assistant.",
  },
];

export const DARK_IMAGE_SLOTS: ImageSlot[] = [
  {
    settingKey: "companyDarkIconUrl",
    label: "Logo Icon (Dark)",
    description: "Alternate icon for dark backgrounds.",
  },
  {
    settingKey: "companyDarkLogoUrl",
    label: "Logo Horizontal (Dark)",
    description: "Alternate logo for dark backgrounds.",
  },
];

// ─── Setting Key Groups (for section-level save) ────────────────────────────

export const LOGO_KEYS = [
  "companyIconUrl",
  "companyLogoUrl",
  "companyFaviconUrl",
  "companyAgentCircleUrl",
  "companyAgentFullUrl",
  "companyDarkIconUrl",
  "companyDarkLogoUrl",
];

export const COLOR_KEYS = [
  "brandAccentColor",
  "brandSecondaryColor",
  "brandSuccessColor",
  "brandWarningColor",
  "brandErrorColor",
  "brandDarkPrimaryColor",
  "brandDarkSecondaryColor",
  "brandDarkBgColor",
  "brandDarkSurfaceColor",
];

export const FONT_KEYS = ["brandFontRoles"];

export const BUTTON_KEYS = [
  "brandButtonRadius",
  "brandButtonFontWeight",
  "brandButtonTransform",
];

export const APPEARANCE_KEYS = [
  "brandBorderRadius",
  "brandShadowIntensity",
  "brandContentDensity",
  "brandAnimationSpeed",
];

export const BRAND_VOICE_KEYS = [
  "brandVoiceTone",
  "brandVoiceTraits",
  "brandVoiceFormality",
  "brandVoiceTechLevel",
  "brandVoiceDos",
  "brandVoiceDonts",
  "brandVoiceAudience",
  "brandVoiceSamplePhrases",
  "brandVoicePreferredTerms",
  "brandVoiceAvoidTerms",
];

export const ALL_BRAND_KIT_KEYS = [
  ...LOGO_KEYS,
  ...COLOR_KEYS,
  ...FONT_KEYS,
  ...BUTTON_KEYS,
  ...APPEARANCE_KEYS,
  ...BRAND_VOICE_KEYS,
];

// ─── Brand Voice Tone Presets ────────────────────────────────────────────────

export const VOICE_TONE_OPTIONS = [
  "Professional",
  "Casual",
  "Playful",
  "Authoritative",
  "Friendly",
  "Inspirational",
  "Technical",
  "Witty",
  "Empathetic",
  "Bold",
];

// ─── Color Shade Generation ──────────────────────────────────────────────────

export function generateShades(hex: string): { shade: number; color: string }[] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000].map(
    (shade) => {
      const factor = shade <= 500 ? shade / 500 : 1;
      const darkFactor = shade > 500 ? (shade - 500) / 500 : 0;

      const nr = Math.round(255 - (255 - r) * factor - r * darkFactor * 0.7);
      const ng = Math.round(255 - (255 - g) * factor - g * darkFactor * 0.7);
      const nb = Math.round(255 - (255 - b) * factor - b * darkFactor * 0.7);

      const clamp = (v: number) => Math.max(0, Math.min(255, v));
      const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");

      return {
        shade,
        color: `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`,
      };
    }
  );
}
