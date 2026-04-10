import Image from "next/image";
import type { ComponentRendererProps } from "../component-renderer";
import { componentStylesToCSS } from "../component-renderer";

export function LpImage({
  node,
  isEditor,
  isFirstSection,
  componentIndex,
}: ComponentRendererProps) {
  const src = (node.props.src as string) || "";
  const alt = (node.props.alt as string) || "Image";
  const objectFit = (node.props.objectFit as string) || "cover";
  const style = componentStylesToCSS(node.styles);

  if (!src) {
    return (
      <div
        style={{ ...style, minHeight: 120 }}
        className={
          isEditor
            ? "flex items-center justify-center bg-muted rounded text-xs text-muted-foreground"
            : undefined
        }
      >
        {isEditor ? "No image set" : null}
      </div>
    );
  }

  // In editor mode, use plain <img> for flexible preview
  if (isEditor) {
    return (
      <img
        src={src}
        alt={alt}
        style={{
          ...style,
          objectFit: objectFit as React.CSSProperties["objectFit"],
        }}
      />
    );
  }

  // Published mode: use next/image for optimization (AVIF/WebP, lazy loading, srcSet)
  // Mark hero images (first section, first image) as priority for LCP
  const isPriority = isFirstSection && (componentIndex ?? 0) < 2;

  // Determine if we should use fill mode or explicit dimensions
  const hasExplicitDimensions =
    style.width && style.width !== "auto" && style.height && style.height !== "auto";

  if (hasExplicitDimensions) {
    // Parse pixel values for width/height
    const width = parseInt(String(style.width), 10) || 800;
    const height = parseInt(String(style.height), 10) || 600;

    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={isPriority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{
          ...style,
          objectFit: objectFit as React.CSSProperties["objectFit"],
          width: style.width,
          height: style.height,
        }}
      />
    );
  }

  // Fill mode for images without explicit dimensions
  return (
    <div
      style={{
        position: "relative",
        width: style.width || "100%",
        height: style.height || "auto",
        minHeight: style.minHeight || "200px",
        maxWidth: style.maxWidth,
        margin: style.margin,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={isPriority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{
          objectFit: objectFit as React.CSSProperties["objectFit"],
          borderRadius: style.borderRadius,
        }}
      />
    </div>
  );
}
