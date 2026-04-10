import { memo, createElement } from "react";
import type { ComponentRendererProps } from "../component-renderer";
import { componentStylesToCSS } from "../component-renderer";

export const LpHeading = memo(function LpHeading({ node }: ComponentRendererProps) {
  const tag = (node.props.level as string) || "h2";
  const text = (node.props.text as string) || "Heading";
  const style = componentStylesToCSS(node.styles);

  return createElement(tag, { style }, text);
});
