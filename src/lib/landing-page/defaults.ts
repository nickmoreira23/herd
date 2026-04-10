import type { PageStyles, SectionLayout, ComponentStyles, SpacingBox } from "@/types/landing-page";

export const DEFAULT_SPACING_BOX: SpacingBox = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export const DEFAULT_PAGE_STYLES: PageStyles = {
  fonts: {
    heading: { family: "Inter", weight: "700" },
    body: { family: "Inter", weight: "400" },
  },
  colors: {
    primary: "#18181b",
    secondary: "#f4f4f5",
    accent: "#2563eb",
    background: "#ffffff",
    text: "#18181b",
    muted: "#71717a",
  },
  spacing: {
    sectionGap: 0,
    containerMaxWidth: 1200,
    containerPadding: 24,
  },
  borderRadius: 8,
};

export const DEFAULT_SECTION_LAYOUT: SectionLayout = {
  columns: 1,
  gap: 16,
  padding: { top: 64, right: 24, bottom: 64, left: 24 },
  alignment: "center",
  verticalAlignment: "top",
  maxWidth: "container",
  background: { type: "none", value: "" },
};

export const DEFAULT_COMPONENT_STYLES: ComponentStyles = {
  margin: { ...DEFAULT_SPACING_BOX },
  padding: { ...DEFAULT_SPACING_BOX },
  width: "auto",
  height: "auto",
};
