import type { ComponentRendererProps } from "../component-renderer";
import { ComponentRenderer, componentStylesToCSS } from "../component-renderer";

export function LpContainer({ node, isEditor }: ComponentRendererProps) {
  const style = componentStylesToCSS(node.styles);

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: (node.props.direction as React.CSSProperties["flexDirection"]) || "column",
    gap: (node.props.gap as number) ?? 16,
    alignItems: (node.props.alignItems as string) || undefined,
    justifyContent: (node.props.justifyContent as string) || undefined,
    ...style,
  };

  if (!node.children?.length && isEditor) {
    return (
      <div
        style={containerStyle}
        className="border-2 border-dashed border-muted-foreground/20 rounded-lg min-h-[60px] flex items-center justify-center"
      >
        <span className="text-xs text-muted-foreground">Empty container</span>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {node.children?.map((child) => (
        <ComponentRenderer key={child.id} node={child} isEditor={isEditor} />
      ))}
    </div>
  );
}
