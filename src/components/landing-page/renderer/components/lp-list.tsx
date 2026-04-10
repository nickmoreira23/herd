import { createElement } from "react";
import type { ComponentRendererProps } from "../component-renderer";
import { componentStylesToCSS } from "../component-renderer";

export function LpList({ node }: ComponentRendererProps) {
  const items = (node.props.items as string[]) || ["Item 1", "Item 2", "Item 3"];
  const listStyle = (node.props.listStyle as string) || "bullet";
  const style = componentStylesToCSS(node.styles);

  if (listStyle === "check") {
    return (
      <ul style={{ ...style, listStyle: "none", padding: 0 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              style={{ flexShrink: 0, marginTop: 2 }}
            >
              <path
                d="M16.667 5L7.5 14.167 3.333 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  const tag = listStyle === "number" ? "ol" : "ul";
  const listStyleType = listStyle === "none" ? "none" : undefined;

  return createElement(
    tag,
    {
      style: {
        ...style,
        paddingLeft: listStyle === "none" ? 0 : (style.padding ? undefined : 24),
        listStyleType,
      },
    },
    items.map((item, i) =>
      createElement("li", { key: i, style: { marginBottom: 4 } }, item)
    )
  );
}
