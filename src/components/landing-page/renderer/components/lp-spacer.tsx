import { memo } from "react";
import type { ComponentRendererProps } from "../component-renderer";
import { componentStylesToCSS } from "../component-renderer";

export const LpSpacer = memo(function LpSpacer({ node, isEditor }: ComponentRendererProps) {
  const height = (node.props.height as number) || 40;
  const cssStyles = componentStylesToCSS(node.styles);

  return (
    <div
      style={{ ...cssStyles, height, width: cssStyles.width || "100%" }}
      className={isEditor ? "bg-muted/30 border border-dashed border-muted-foreground/10 rounded" : undefined}
    />
  );
});
