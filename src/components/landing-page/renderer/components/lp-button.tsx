import { memo } from "react";
import type { ComponentRendererProps } from "../component-renderer";
import { componentStylesToCSS } from "../component-renderer";

const variantStyles: Record<string, React.CSSProperties> = {
  primary: { backgroundColor: "#18181b", color: "#ffffff" },
  secondary: { backgroundColor: "#f4f4f5", color: "#18181b" },
  outline: { backgroundColor: "transparent", color: "#18181b", border: "1px solid #e4e4e7" },
  ghost: { backgroundColor: "transparent", color: "#18181b" },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: "8px 16px", fontSize: 13 },
  md: { padding: "12px 24px", fontSize: 14 },
  lg: { padding: "16px 32px", fontSize: 16 },
};

export const LpButton = memo(function LpButton({ node, isEditor }: ComponentRendererProps) {
  const text = (node.props.text as string) || "Button";
  const url = (node.props.url as string) || "#";
  const variant = (node.props.variant as string) || "primary";
  const size = (node.props.size as string) || "md";
  const style = componentStylesToCSS(node.styles);

  const combinedStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    textDecoration: "none",
    fontWeight: 600,
    borderRadius: style.borderRadius ?? 8,
    transition: "opacity 0.15s",
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  };

  if (isEditor) {
    return <span style={combinedStyle}>{text}</span>;
  }

  return (
    <a href={url} style={combinedStyle}>
      {text}
    </a>
  );
});
