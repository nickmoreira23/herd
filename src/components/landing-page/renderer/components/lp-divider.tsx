import { memo } from "react";
import type { ComponentRendererProps } from "../component-renderer";
import { componentStylesToCSS } from "../component-renderer";

export const LpDivider = memo(function LpDivider({ node }: ComponentRendererProps) {
  const color = (node.props.color as string) || "#e4e4e7";
  const thickness = (node.props.thickness as number) || 1;
  const borderStyle = (node.props.style as string) || "solid";
  const style = componentStylesToCSS(node.styles);

  return (
    <hr
      style={{
        ...style,
        borderTop: `${thickness}px ${borderStyle} ${color}`,
        borderBottom: "none",
        borderLeft: "none",
        borderRight: "none",
      }}
    />
  );
});
