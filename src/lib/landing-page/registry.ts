import type { ComponentDefinition } from "@/types/landing-page";
import { DEFAULT_COMPONENT_STYLES } from "./defaults";

export const componentRegistry: Record<string, ComponentDefinition> = {
  heading: {
    type: "heading",
    label: "Heading",
    icon: "Type",
    category: "content",
    description: "A heading text block (H1–H6)",
    canHaveChildren: false,
    defaultProps: {
      text: "Heading",
      level: "h2",
    },
    defaultStyles: {
      ...DEFAULT_COMPONENT_STYLES,
      fontSize: 32,
      fontWeight: "700",
      width: "100%",
    },
    propsSchema: [
      { key: "text", label: "Text", type: "text", defaultValue: "Heading", group: "content", validation: { required: true } },
      {
        key: "level",
        label: "Level",
        type: "select",
        defaultValue: "h2",
        group: "content",
        options: [
          { label: "H1", value: "h1" },
          { label: "H2", value: "h2" },
          { label: "H3", value: "h3" },
          { label: "H4", value: "h4" },
          { label: "H5", value: "h5" },
          { label: "H6", value: "h6" },
        ],
      },
    ],
  },

  text: {
    type: "text",
    label: "Text",
    icon: "AlignLeft",
    category: "content",
    description: "A paragraph or text block",
    canHaveChildren: false,
    defaultProps: {
      text: "Start typing here...",
      tag: "p",
    },
    defaultStyles: {
      ...DEFAULT_COMPONENT_STYLES,
      fontSize: 16,
      fontWeight: "400",
      lineHeight: 1.6,
      width: "100%",
    },
    propsSchema: [
      { key: "text", label: "Text", type: "textarea", defaultValue: "Start typing here...", group: "content", validation: { required: true } },
      {
        key: "tag",
        label: "Tag",
        type: "select",
        defaultValue: "p",
        group: "advanced",
        options: [
          { label: "Paragraph", value: "p" },
          { label: "Span", value: "span" },
        ],
      },
    ],
  },

  image: {
    type: "image",
    label: "Image",
    icon: "Image",
    category: "media",
    description: "An image with configurable size and fit",
    canHaveChildren: false,
    defaultProps: {
      src: "",
      alt: "Image",
      objectFit: "cover",
    },
    defaultStyles: {
      ...DEFAULT_COMPONENT_STYLES,
      width: "100%",
      height: "auto",
    },
    propsSchema: [
      { key: "src", label: "Image URL", type: "image", defaultValue: "", group: "content", validation: { required: true } },
      { key: "alt", label: "Alt text", type: "text", defaultValue: "Image", group: "content" },
      {
        key: "objectFit",
        label: "Fit",
        type: "select",
        defaultValue: "cover",
        group: "style",
        options: [
          { label: "Cover", value: "cover" },
          { label: "Contain", value: "contain" },
          { label: "Fill", value: "fill" },
          { label: "None", value: "none" },
        ],
      },
    ],
  },

  button: {
    type: "button",
    label: "Button",
    icon: "MousePointerClick",
    category: "interactive",
    description: "A clickable button with link",
    canHaveChildren: false,
    defaultProps: {
      text: "Click me",
      url: "#",
      variant: "primary",
      size: "md",
    },
    defaultStyles: {
      ...DEFAULT_COMPONENT_STYLES,
      padding: { top: 12, right: 24, bottom: 12, left: 24 },
      borderRadius: 8,
      fontSize: 14,
      fontWeight: "600",
    },
    propsSchema: [
      { key: "text", label: "Label", type: "text", defaultValue: "Click me", group: "content", validation: { required: true } },
      { key: "url", label: "Link URL", type: "url", defaultValue: "#", group: "content" },
      {
        key: "variant",
        label: "Variant",
        type: "select",
        defaultValue: "primary",
        group: "style",
        options: [
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
          { label: "Outline", value: "outline" },
          { label: "Ghost", value: "ghost" },
        ],
      },
      {
        key: "size",
        label: "Size",
        type: "select",
        defaultValue: "md",
        group: "style",
        options: [
          { label: "Small", value: "sm" },
          { label: "Medium", value: "md" },
          { label: "Large", value: "lg" },
        ],
      },
    ],
  },

  spacer: {
    type: "spacer",
    label: "Spacer",
    icon: "ArrowUpDown",
    category: "layout",
    description: "Vertical spacing between elements",
    canHaveChildren: false,
    defaultProps: {
      height: 40,
    },
    defaultStyles: {
      ...DEFAULT_COMPONENT_STYLES,
      width: "100%",
    },
    propsSchema: [
      { key: "height", label: "Height (px)", type: "number", defaultValue: 40, group: "content", validation: { min: 1, max: 500 } },
    ],
  },

  divider: {
    type: "divider",
    label: "Divider",
    icon: "Minus",
    category: "layout",
    description: "A horizontal dividing line",
    canHaveChildren: false,
    defaultProps: {
      color: "#e4e4e7",
      thickness: 1,
      style: "solid",
    },
    defaultStyles: {
      ...DEFAULT_COMPONENT_STYLES,
      width: "100%",
      margin: { top: 16, right: 0, bottom: 16, left: 0 },
    },
    propsSchema: [
      { key: "color", label: "Color", type: "color", defaultValue: "#e4e4e7", group: "style" },
      { key: "thickness", label: "Thickness (px)", type: "number", defaultValue: 1, group: "style", validation: { min: 1, max: 10 } },
      {
        key: "style",
        label: "Style",
        type: "select",
        defaultValue: "solid",
        group: "style",
        options: [
          { label: "Solid", value: "solid" },
          { label: "Dashed", value: "dashed" },
          { label: "Dotted", value: "dotted" },
        ],
      },
    ],
  },

  container: {
    type: "container",
    label: "Container",
    icon: "Square",
    category: "layout",
    description: "A flex container that holds other components",
    canHaveChildren: true,
    defaultProps: {},
    defaultStyles: {
      ...DEFAULT_COMPONENT_STYLES,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    },
    propsSchema: [],
  },

  columns: {
    type: "columns",
    label: "Columns",
    icon: "Columns3",
    category: "layout",
    description: "A multi-column layout grid",
    canHaveChildren: true,
    defaultProps: {
      columnCount: 2,
      gap: 24,
    },
    defaultStyles: {
      ...DEFAULT_COMPONENT_STYLES,
      width: "100%",
      display: "grid",
    },
    propsSchema: [
      { key: "columnCount", label: "Columns", type: "number", defaultValue: 2, group: "content", validation: { min: 1, max: 6 } },
      { key: "gap", label: "Gap (px)", type: "number", defaultValue: 24, group: "content", validation: { min: 0, max: 100 } },
    ],
  },

  icon: {
    type: "icon",
    label: "Icon",
    icon: "Shapes",
    category: "media",
    description: "A Lucide icon",
    canHaveChildren: false,
    defaultProps: {
      name: "star",
      size: 24,
      color: "#18181b",
    },
    defaultStyles: {
      ...DEFAULT_COMPONENT_STYLES,
    },
    propsSchema: [
      { key: "name", label: "Icon", type: "icon", defaultValue: "star", group: "content" },
      { key: "size", label: "Size (px)", type: "number", defaultValue: 24, group: "style", validation: { min: 12, max: 120 } },
      { key: "color", label: "Color", type: "color", defaultValue: "#18181b", group: "style" },
    ],
  },

  list: {
    type: "list",
    label: "List",
    icon: "List",
    category: "content",
    description: "An ordered or unordered list",
    canHaveChildren: false,
    defaultProps: {
      items: ["Item one", "Item two", "Item three"],
      listStyle: "bullet",
    },
    defaultStyles: {
      ...DEFAULT_COMPONENT_STYLES,
      fontSize: 16,
      width: "100%",
    },
    propsSchema: [
      {
        key: "listStyle",
        label: "Style",
        type: "select",
        defaultValue: "bullet",
        group: "content",
        options: [
          { label: "Bullet", value: "bullet" },
          { label: "Number", value: "number" },
          { label: "Check", value: "check" },
          { label: "None", value: "none" },
        ],
      },
      {
        key: "items",
        label: "Items",
        type: "items",
        defaultValue: ["Item one", "Item two", "Item three"],
        group: "content",
      },
    ],
  },

  badge: {
    type: "badge",
    label: "Badge",
    icon: "Tag",
    category: "content",
    description: "A small label or tag",
    canHaveChildren: false,
    defaultProps: {
      text: "Badge",
      variant: "default",
    },
    defaultStyles: {
      ...DEFAULT_COMPONENT_STYLES,
    },
    propsSchema: [
      { key: "text", label: "Text", type: "text", defaultValue: "Badge", group: "content", validation: { required: true } },
      {
        key: "variant",
        label: "Variant",
        type: "select",
        defaultValue: "default",
        group: "style",
        options: [
          { label: "Default", value: "default" },
          { label: "Secondary", value: "secondary" },
          { label: "Outline", value: "outline" },
        ],
      },
    ],
  },

  video: {
    type: "video",
    label: "Video",
    icon: "Play",
    category: "media",
    description: "An embedded video (YouTube/Vimeo)",
    canHaveChildren: false,
    defaultProps: {
      url: "",
      autoplay: false,
      controls: true,
    },
    defaultStyles: {
      ...DEFAULT_COMPONENT_STYLES,
      width: "100%",
      height: "auto",
    },
    propsSchema: [
      { key: "url", label: "Video URL", type: "url", defaultValue: "", group: "content", placeholder: "YouTube or Vimeo URL", validation: { required: true } },
      { key: "autoplay", label: "Autoplay", type: "boolean", defaultValue: false, group: "advanced" },
      { key: "controls", label: "Show controls", type: "boolean", defaultValue: true, group: "advanced" },
    ],
  },
};

export function getComponentDefinition(type: string): ComponentDefinition | undefined {
  return componentRegistry[type];
}

export function getComponentsByCategory() {
  const categories: Record<string, ComponentDefinition[]> = {
    layout: [],
    content: [],
    media: [],
    interactive: [],
  };

  for (const def of Object.values(componentRegistry)) {
    categories[def.category]?.push(def);
  }

  return categories;
}
