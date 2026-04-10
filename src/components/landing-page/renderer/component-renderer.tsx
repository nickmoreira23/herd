import type { ComponentNode, ComponentStyles, SpacingBox } from "@/types/landing-page";
import { LpHeading } from "./components/lp-heading";
import { LpText } from "./components/lp-text";
import { LpImage } from "./components/lp-image";
import { LpButton } from "./components/lp-button";
import { LpSpacer } from "./components/lp-spacer";
import { LpDivider } from "./components/lp-divider";
import { LpVideo } from "./components/lp-video";
import { LpContainer } from "./components/lp-container";
import { LpColumns } from "./components/lp-columns";
import { LpIcon } from "./components/lp-icon";
import { LpList } from "./components/lp-list";
import { LpBadge } from "./components/lp-badge";

export interface ComponentRendererProps {
  node: ComponentNode;
  isEditor?: boolean;
  /** Whether this component is in the first section (for hero image priority) */
  isFirstSection?: boolean;
  /** Index of this component within its section */
  componentIndex?: number;
}

const renderers: Record<
  string,
  React.ComponentType<ComponentRendererProps>
> = {
  heading: LpHeading,
  text: LpText,
  image: LpImage,
  button: LpButton,
  spacer: LpSpacer,
  divider: LpDivider,
  video: LpVideo,
  container: LpContainer,
  columns: LpColumns,
  icon: LpIcon,
  list: LpList,
  badge: LpBadge,
};

export function ComponentRenderer(props: ComponentRendererProps) {
  const { node, isEditor } = props;
  const Renderer = renderers[node.type];

  if (!Renderer) {
    if (isEditor) {
      return (
        <div className="border border-dashed border-destructive/50 rounded p-2 text-xs text-destructive">
          Unknown component: {node.type}
        </div>
      );
    }
    return null;
  }

  return <Renderer {...props} />;
}

// ─── Style conversion helper ────────────────────────────────────────

function spacingToString(box: SpacingBox | undefined): string | undefined {
  if (!box) return undefined;
  return `${box.top}px ${box.right}px ${box.bottom}px ${box.left}px`;
}

export function componentStylesToCSS(styles: ComponentStyles): React.CSSProperties {
  const css: React.CSSProperties = {};

  // Spacing
  if (styles.margin) {
    const m = spacingToString(styles.margin);
    if (m && m !== "0px 0px 0px 0px") css.margin = m;
  }
  if (styles.padding) {
    const p = spacingToString(styles.padding);
    if (p && p !== "0px 0px 0px 0px") css.padding = p;
  }

  // Sizing
  if (styles.width && styles.width !== "auto") css.width = styles.width;
  if (styles.height && styles.height !== "auto") css.height = styles.height;
  if (styles.maxWidth) css.maxWidth = styles.maxWidth;
  if (styles.minHeight) css.minHeight = styles.minHeight;

  // Typography
  if (styles.fontSize) css.fontSize = styles.fontSize;
  if (styles.fontWeight) css.fontWeight = styles.fontWeight;
  if (styles.fontFamily) css.fontFamily = styles.fontFamily;
  if (styles.lineHeight) css.lineHeight = styles.lineHeight;
  if (styles.letterSpacing) css.letterSpacing = styles.letterSpacing;
  if (styles.textAlign) css.textAlign = styles.textAlign;
  if (styles.color) css.color = styles.color;

  // Borders
  if (styles.borderWidth) css.borderWidth = styles.borderWidth;
  if (styles.borderColor) css.borderColor = styles.borderColor;
  if (styles.borderRadius) css.borderRadius = styles.borderRadius;
  if (styles.borderStyle) css.borderStyle = styles.borderStyle as React.CSSProperties["borderStyle"];

  // Background
  if (styles.backgroundColor) css.backgroundColor = styles.backgroundColor;
  if (styles.backgroundImage) css.backgroundImage = styles.backgroundImage;

  // Effects
  if (styles.opacity !== undefined && styles.opacity !== 1) css.opacity = styles.opacity;
  if (styles.boxShadow) css.boxShadow = styles.boxShadow;

  // Display / Flex
  if (styles.display) css.display = styles.display;
  if (styles.flexDirection) css.flexDirection = styles.flexDirection as React.CSSProperties["flexDirection"];
  if (styles.justifyContent) css.justifyContent = styles.justifyContent;
  if (styles.alignItems) css.alignItems = styles.alignItems;
  if (styles.gap) css.gap = styles.gap;

  return css;
}
