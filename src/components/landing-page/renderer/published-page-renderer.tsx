import type {
  PageStyles,
  SectionLayout,
  ComponentNode,
} from "@/types/landing-page";
import { ComponentRenderer, componentStylesToCSS } from "./component-renderer";
import { DEFAULT_PAGE_STYLES } from "@/lib/landing-page/defaults";
import { sectionBackgroundStyles, alignmentToFlex } from "@/lib/landing-page/section-styles";
import { VideoBackground } from "../shared/video-background";

interface PublishedSectionData {
  id: string;
  sectionType: string;
  name: string | null;
  layout: SectionLayout;
  components: ComponentNode[];
  isVisible: boolean;
  sortOrder: number;
}

interface PublishedPageRendererProps {
  pageStyles: PageStyles;
  sections: PublishedSectionData[];
}

function generatePageCSSVars(ps: PageStyles): string {
  return `
    :root {
      --lp-color-primary: ${ps.colors.primary};
      --lp-color-secondary: ${ps.colors.secondary};
      --lp-color-accent: ${ps.colors.accent};
      --lp-color-background: ${ps.colors.background};
      --lp-color-text: ${ps.colors.text};
      --lp-color-muted: ${ps.colors.muted};
      --lp-font-heading: ${ps.fonts.heading.family}, sans-serif;
      --lp-font-body: ${ps.fonts.body.family}, sans-serif;
      --lp-font-heading-weight: ${ps.fonts.heading.weight};
      --lp-font-body-weight: ${ps.fonts.body.weight};
      --lp-border-radius: ${ps.borderRadius}px;
      --lp-container-max-width: ${ps.spacing.containerMaxWidth}px;
      --lp-container-padding: ${ps.spacing.containerPadding}px;
      --lp-section-gap: ${ps.spacing.sectionGap}px;
    }
    body {
      font-family: var(--lp-font-body);
      font-weight: var(--lp-font-body-weight);
      color: var(--lp-color-text);
      background-color: var(--lp-color-background);
    }
  `;
}

function PublishedSection({
  section,
  pageStyles,
}: {
  section: PublishedSectionData;
  pageStyles: PageStyles;
}) {
  const layout = section.layout;
  const containerMaxWidth =
    layout.maxWidth === "full"
      ? "100%"
      : layout.maxWidth === "container"
        ? `${pageStyles.spacing.containerMaxWidth}px`
        : `${layout.maxWidth}px`;

  const bgStyles = sectionBackgroundStyles(layout.background);

  return (
    <section
      style={{
        ...bgStyles,
        position:
          layout.background.type === "image" || layout.background.type === "video"
            ? "relative"
            : undefined,
      }}
    >
      {/* Video background layer */}
      {layout.background.type === "video" && (
        <VideoBackground background={layout.background} isEditor={false} />
      )}

      {/* Overlay for image/video backgrounds */}
      {(layout.background.type === "image" || layout.background.type === "video") &&
        layout.background.overlay && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: layout.background.overlay,
              zIndex: 1,
            }}
          />
        )}
      <div
        style={{
          maxWidth: containerMaxWidth,
          marginLeft: "auto",
          marginRight: "auto",
          paddingTop: layout.padding.top,
          paddingRight: layout.padding.right,
          paddingBottom: layout.padding.bottom,
          paddingLeft: layout.padding.left,
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: alignmentToFlex(layout.alignment),
          justifyContent: alignmentToFlex(layout.verticalAlignment),
          minHeight: layout.minHeight ? `${layout.minHeight}px` : undefined,
          gap: `${layout.gap}px`,
        }}
      >
        {section.components.map((component, idx) => (
          <ComponentRenderer
            key={component.id}
            node={component}
            isEditor={false}
            isFirstSection={section.sortOrder === 0}
            componentIndex={idx}
          />
        ))}
      </div>
    </section>
  );
}

export function PublishedPageRenderer({
  pageStyles,
  sections,
}: PublishedPageRendererProps) {
  const ps = { ...DEFAULT_PAGE_STYLES, ...pageStyles };

  const visibleSections = sections
    .filter((s) => s.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: generatePageCSSVars(ps) }} />
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          gap: ps.spacing.sectionGap
            ? `${ps.spacing.sectionGap}px`
            : undefined,
        }}
      >
        {visibleSections.map((section) => (
          <PublishedSection
            key={section.id}
            section={section}
            pageStyles={ps}
          />
        ))}
      </main>
    </>
  );
}
