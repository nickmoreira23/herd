import type { ComponentNode, ComponentStyles, SectionData, SectionLayout } from "@/types/landing-page";
import { DEFAULT_SECTION_LAYOUT, DEFAULT_COMPONENT_STYLES } from "./defaults";
import { getComponentDefinition } from "./registry";

export function generateId(): string {
  return crypto.randomUUID();
}

export function createComponentNode(
  type: string,
  overrides?: Partial<{ props: Record<string, unknown>; styles: Partial<ComponentStyles> }>
): ComponentNode {
  const definition = getComponentDefinition(type);

  return {
    id: generateId(),
    type,
    props: { ...definition?.defaultProps, ...overrides?.props },
    styles: {
      ...DEFAULT_COMPONENT_STYLES,
      ...definition?.defaultStyles,
      ...overrides?.styles,
    } as ComponentStyles,
  };
}

export function createSectionData(
  pageId: string,
  sectionType: string,
  sortOrder: number,
  overrides?: Partial<{ name: string; layout: Partial<SectionLayout>; components: ComponentNode[] }>
): SectionData {
  return {
    id: generateId(),
    pageId,
    sectionType,
    name: overrides?.name ?? null,
    layout: { ...DEFAULT_SECTION_LAYOUT, ...overrides?.layout },
    components: overrides?.components ?? [],
    isVisible: true,
    isLocked: false,
    sortOrder,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Section Templates ──────────────────────────────────────────────

export interface SectionTemplate {
  id: string;
  name: string;
  icon: string;
  sectionType: string;
  layout?: Partial<SectionLayout>;
  components: Array<{ type: string; props?: Record<string, unknown> }>;
}

export const sectionTemplates: SectionTemplate[] = [
  {
    id: "hero",
    name: "Hero",
    icon: "Sparkles",
    sectionType: "hero",
    layout: { padding: { top: 80, right: 24, bottom: 80, left: 24 }, alignment: "center" },
    components: [
      { type: "heading", props: { text: "Welcome to our site", level: "h1" } },
      { type: "text", props: { text: "A brief description of what makes us special. Edit this text to tell your story." } },
      { type: "button", props: { text: "Get Started", url: "#", variant: "primary", size: "lg" } },
    ],
  },
  {
    id: "features",
    name: "Features",
    icon: "LayoutGrid",
    sectionType: "features",
    layout: { padding: { top: 64, right: 24, bottom: 64, left: 24 } },
    components: [
      { type: "heading", props: { text: "Features", level: "h2" } },
      { type: "text", props: { text: "Everything you need to succeed." } },
    ],
  },
  {
    id: "cta",
    name: "Call to Action",
    icon: "Megaphone",
    sectionType: "cta",
    layout: { padding: { top: 64, right: 24, bottom: 64, left: 24 }, alignment: "center" },
    components: [
      { type: "heading", props: { text: "Ready to get started?", level: "h2" } },
      { type: "text", props: { text: "Join thousands of others who have already made the switch." } },
      { type: "button", props: { text: "Sign Up Now", url: "#", variant: "primary", size: "lg" } },
    ],
  },
  {
    id: "testimonials",
    name: "Testimonials",
    icon: "Quote",
    sectionType: "testimonials",
    layout: { padding: { top: 64, right: 24, bottom: 64, left: 24 } },
    components: [
      { type: "heading", props: { text: "What people are saying", level: "h2" } },
      { type: "text", props: { text: '"This product changed everything for us. Highly recommended!"' } },
    ],
  },
  {
    id: "footer",
    name: "Footer",
    icon: "PanelBottom",
    sectionType: "footer",
    layout: { padding: { top: 32, right: 24, bottom: 32, left: 24 }, background: { type: "color", value: "#18181b" } },
    components: [
      { type: "text", props: { text: "© 2026 Your Company. All rights reserved." } },
    ],
  },
  {
    id: "blank",
    name: "Blank Section",
    icon: "Plus",
    sectionType: "custom",
    components: [],
  },
];
