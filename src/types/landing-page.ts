// ─── Page Styles (LandingPage.pageStyles) ───────────────────────────

export interface PageStylesFonts {
  heading: { family: string; weight: string };
  body: { family: string; weight: string };
}

export interface PageStylesColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
}

export interface PageStylesSpacing {
  sectionGap: number;
  containerMaxWidth: number;
  containerPadding: number;
}

export interface PageStyles {
  fonts: PageStylesFonts;
  colors: PageStylesColors;
  spacing: PageStylesSpacing;
  borderRadius: number;
  customCss?: string;
}

// ─── Section Layout (LandingPageSection.layout) ─────────────────────

export interface SpacingBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface VideoSettings {
  muted: boolean;
  loop: boolean;
  autoplay: boolean;
}

export interface SectionBackground {
  type: "none" | "color" | "gradient" | "image" | "video";
  value: string;
  overlay?: string;
  videoUrl?: string;
  youtubeId?: string;
  posterUrl?: string;
  videoSettings?: VideoSettings;
}

export interface SectionLayout {
  columns: number;
  gap: number;
  padding: SpacingBox;
  alignment: "left" | "center" | "right";
  verticalAlignment: "top" | "center" | "bottom";
  maxWidth: "full" | "container" | number;
  background: SectionBackground;
  minHeight?: number;
}

// ─── Component Styles ───────────────────────────────────────────────

export interface ComponentStyles {
  // Spacing
  margin: SpacingBox;
  padding: SpacingBox;

  // Sizing
  width: string;
  height: string;
  maxWidth?: string;
  minHeight?: string;

  // Typography
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: "left" | "center" | "right";
  color?: string;

  // Borders
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  borderStyle?: string;

  // Background
  backgroundColor?: string;
  backgroundImage?: string;

  // Effects
  opacity?: number;
  boxShadow?: string;

  // Display / Flex
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: number;
}

// ─── Component Node ─────────────────────────────────────────────────

export interface ResponsiveOverrides {
  tablet?: Partial<ComponentStyles> & Record<string, unknown>;
  mobile?: Partial<ComponentStyles> & Record<string, unknown>;
}

export interface ComponentNode {
  id: string;
  type: string;
  props: Record<string, unknown>;
  styles: ComponentStyles;
  children?: ComponentNode[];
  responsiveOverrides?: ResponsiveOverrides;
}

// ─── Page Snapshot (LandingPageVersion.snapshot) ────────────────────

export interface SectionSnapshot {
  id: string;
  sectionType: string;
  name: string | null;
  layout: SectionLayout;
  components: ComponentNode[];
  isVisible: boolean;
  sortOrder: number;
}

export interface PageSnapshot {
  pageStyles: PageStyles;
  sections: SectionSnapshot[];
}

// ─── Component Registry Types ───────────────────────────────────────

export type PropFieldType =
  | "text"
  | "textarea"
  | "number"
  | "color"
  | "select"
  | "boolean"
  | "image"
  | "url"
  | "icon"
  | "richtext"
  | "items";

export interface PropFieldOption {
  label: string;
  value: string;
}

export interface PropFieldValidation {
  min?: number;
  max?: number;
  required?: boolean;
}

export interface PropField {
  key: string;
  label: string;
  type: PropFieldType;
  defaultValue: unknown;
  options?: PropFieldOption[];
  group?: "content" | "style" | "advanced";
  placeholder?: string;
  validation?: PropFieldValidation;
}

export interface ComponentDefinition {
  type: string;
  label: string;
  icon: string;
  category: "layout" | "content" | "media" | "interactive";
  description: string;
  defaultProps: Record<string, unknown>;
  defaultStyles: Partial<ComponentStyles>;
  propsSchema: PropField[];
  canHaveChildren: boolean;
  constraints?: {
    maxPerSection?: number;
    allowedParents?: string[];
  };
}

// ─── Editor Data Types ──────────────────────────────────────────────

export interface LandingPageData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  seoTitle: string | null;
  seoDescription: string | null;
  seoImage: string | null;
  pageStyles: PageStyles;
  publishedVersionId: string | null;
  lastPublishedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SectionData {
  id: string;
  pageId: string;
  sectionType: string;
  name: string | null;
  layout: SectionLayout;
  components: ComponentNode[];
  isVisible: boolean;
  isLocked: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
