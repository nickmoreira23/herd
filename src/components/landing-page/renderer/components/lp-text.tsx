import { memo, createElement } from "react";
import type { ComponentRendererProps } from "../component-renderer";
import { componentStylesToCSS } from "../component-renderer";

export const LpText = memo(function LpText({ node }: ComponentRendererProps) {
  const tag = (node.props.tag as string) || "p";
  const text = (node.props.text as string) || "";
  const style = componentStylesToCSS(node.styles);

  return createElement(tag, { style }, text);
});
