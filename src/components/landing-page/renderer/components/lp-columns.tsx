import type { ComponentRendererProps } from "../component-renderer";
import { ComponentRenderer, componentStylesToCSS } from "../component-renderer";

export function LpColumns({ node, isEditor }: ComponentRendererProps) {
  const columnCount = (node.props.columnCount as number) || 2;
  const gap = (node.props.gap as number) ?? 24;
  const style = componentStylesToCSS(node.styles);

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
    gap,
    ...style,
  };

  if (!node.children?.length && isEditor) {
    return (
      <div
        style={gridStyle}
        className="border-2 border-dashed border-muted-foreground/20 rounded-lg min-h-[60px] flex items-center justify-center"
      >
        <span className="text-xs text-muted-foreground">Empty columns</span>
      </div>
    );
  }

  return (
    <div style={gridStyle}>
      {node.children?.map((child) => (
        <ComponentRenderer key={child.id} node={child} isEditor={isEditor} />
      ))}
    </div>
  );
}
