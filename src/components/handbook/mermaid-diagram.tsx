"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  chart: string;
  id?: string;
}

export function MermaidDiagram({ chart, id }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const diagramId = useRef(id ?? `mermaid-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        const isDark =
          typeof document !== "undefined" &&
          document.documentElement.classList.contains("dark");
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "neutral",
          securityLevel: "loose",
          fontFamily: "inherit",
        });
        const result = await mermaid.render(diagramId.current, chart);
        if (!cancelled) {
          setSvg(result.svg);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erro ao renderizar diagrama");
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="my-4 p-4 border border-destructive/30 bg-destructive/5 rounded-md not-prose">
        <p className="text-sm text-destructive font-medium mb-2">
          Erro ao renderizar diagrama Mermaid
        </p>
        <p className="text-xs text-muted-foreground mb-3">{error}</p>
        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-4 p-4 border border-border bg-muted/30 rounded-md not-prose">
        <p className="text-sm text-muted-foreground">Renderizando diagrama…</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 flex justify-center not-prose [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
