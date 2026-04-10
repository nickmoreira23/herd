import type { ComponentRendererProps } from "../component-renderer";
import { componentStylesToCSS } from "../component-renderer";

const variantStyles: Record<string, React.CSSProperties> = {
  default: {
    backgroundColor: "#18181b",
    color: "#ffffff",
  },
  secondary: {
    backgroundColor: "#f4f4f5",
    color: "#18181b",
  },
  outline: {
    backgroundColor: "transparent",
    color: "#18181b",
    border: "1px solid #e4e4e7",
  },
};

export function LpBadge({ node }: ComponentRendererProps) {
  const text = (node.props.text as string) || "Badge";
  const variant = (node.props.variant as string) || "default";
  const style = componentStylesToCSS(node.styles);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 9999,
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {text}
    </span>
  );
}
