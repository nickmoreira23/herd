"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { ArtifactMeta } from "@/lib/chat/types";
import {
  X,
  FileText,
  Image,
  Video,
  Headphones,
  Link2,
  Table2,
  ClipboardList,
  Rss,
  Activity,
  Package,
  Bot,
  Gift,
  Users,
  Handshake,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

const typeIcons: Record<string, typeof FileText> = {
  document: FileText,
  image: Image,
  video: Video,
  audio: Headphones,
  link: Link2,
  table: Table2,
  form: ClipboardList,
  rss: Rss,
  app_data: Activity,
  product: Package,
  agent: Bot,
  perk: Gift,
  community_benefit: Users,
  partner_brand: Handshake,
};

const typeLabels: Record<string, string> = {
  product: "Product",
  agent: "AI Agent",
  partner_brand: "Partner Brand",
  perk: "Perk",
  community_benefit: "Community Benefit",
  document: "Document",
  image: "Image",
  video: "Video",
  audio: "Audio",
  link: "Web Page",
  table: "Table",
  form: "Form",
  rss: "RSS Article",
  app_data: "App Data",
};

interface ArtifactDetailPanelProps {
  artifact: ArtifactMeta;
  onClose: () => void;
}

function DetailSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </h4>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function MetaBadge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "info";
}) {
  const colors = {
    default: "bg-muted text-muted-foreground",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        colors[variant]
      )}
    >
      {children}
    </span>
  );
}

// ─── Image Gallery ──────────────────────────────────────────────────

function ImageGallery({ images, fallbackUrl, name }: { images: Array<{ id: string; url: string; alt?: string | null }>; fallbackUrl?: string | null; name: string }) {
  const [current, setCurrent] = useState(0);
  const allImages = images.length > 0 ? images : (fallbackUrl ? [{ id: "fallback", url: fallbackUrl, alt: name }] : []);

  const prev = useCallback(() => setCurrent((c) => (c === 0 ? allImages.length - 1 : c - 1)), [allImages.length]);
  const next = useCallback(() => setCurrent((c) => (c === allImages.length - 1 ? 0 : c + 1)), [allImages.length]);

  if (allImages.length === 0) return null;

  return (
    <div className="relative w-full">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        <img
          src={allImages[current].url}
          alt={allImages[current].alt || name}
          className="h-full w-full object-contain p-4"
        />
      </div>
      {allImages.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 shadow-md hover:bg-background transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 shadow-md hover:bg-background transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {allImages.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setCurrent(i)}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  i === current ? "bg-foreground" : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Collapsible Detail Accordion ───────────────────────────────────

function DetailAccordion({ title, count, children, defaultOpen }: { title: string; count?: number; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-sm font-semibold hover:text-foreground transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>{title}</span>
          {count != null && count > 0 && (
            <span className="text-xs font-normal text-muted-foreground">{count} Items</span>
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="pb-3 text-sm text-muted-foreground space-y-2">{children}</div>}
    </div>
  );
}

// ─── Variant / Flavor Selector ──────────────────────────────────────

function VariantSelector({ variants, selected, onSelect }: { variants: string[]; selected: string | null; onSelect: (v: string) => void }) {
  if (variants.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center flex-wrap gap-2">
        {variants.map((v) => (
          <button
            key={v}
            onClick={() => onSelect(v)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              selected === v
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground/50"
            )}
          >
            {v}
          </button>
        ))}
      </div>
      {selected && (
        <p className="text-xs text-center text-muted-foreground">{selected}</p>
      )}
    </div>
  );
}

// ─── Product Detail ─────────────────────────────────────────────────

function ProductDetail({ artifact, fullData }: { artifact: ArtifactMeta; fullData: Record<string, unknown> | null }) {
  const { meta } = artifact;
  const data = fullData || ({} as Record<string, unknown>);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Extract images from full data
  const images = Array.isArray(data.images)
    ? (data.images as Array<{ id: string; url: string; alt?: string | null }>)
    : [];

  // Extract variants/flavors
  const variants = data.variants as Array<{ name: string; options: string[] }> | null | undefined;
  const flavorVariant = variants?.find((v) => v.name.toLowerCase() === "flavor" || v.name.toLowerCase() === "size");
  const variantOptions = flavorVariant?.options || [];
  const variantLabel = flavorVariant?.name || "Variant";

  // Set initial selected variant
  useEffect(() => {
    if (!selectedVariant && data.flavor) {
      setSelectedVariant(String(data.flavor));
    } else if (!selectedVariant && variantOptions.length > 0) {
      setSelectedVariant(variantOptions[0]);
    }
  }, [data.flavor, variantOptions, selectedVariant]);

  // Tags
  const tags = (data.tags || meta.tags) as string[] | undefined;

  // Supplement facts
  const supplementFacts = data.supplementFacts as Array<{ name: string; amount: string; unit?: string; dailyValue?: string }> | null | undefined;

  // Build detail sections
  const hasIngredients = !!data.ingredients;
  const hasSupplementFacts = supplementFacts && supplementFacts.length > 0;
  const hasWarnings = !!data.warnings;
  const hasServing = !!data.servingSize || !!data.servingsPerContainer;
  const sourceUrl = data.sourceUrl as string | undefined;

  const memberPrice = Number(meta.memberPrice || data.memberPrice || 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Image Gallery */}
      <ImageGallery images={images} fallbackUrl={artifact.imageUrl} name={artifact.name} />

      {/* Category */}
      <div className="text-center">
        <span className="text-sm font-semibold text-red-500 uppercase tracking-wide">
          {artifact.category || "Product"}
        </span>
      </div>

      {/* Product Name */}
      <h2 className="text-lg font-bold text-center leading-tight">{artifact.name}</h2>

      {/* Description */}
      {artifact.description && (
        <DescriptionText text={artifact.description} />
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <p className="text-xs text-center text-primary/80 leading-relaxed">
          {tags.join(", ")}
        </p>
      )}

      {/* Price */}
      <div className="text-center">
        <span className="text-2xl font-bold">$ {memberPrice.toFixed(2)}</span>
      </div>

      {/* Variant / Flavor Selector */}
      {variantOptions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-center text-muted-foreground font-medium uppercase tracking-wide">{variantLabel}</p>
          <VariantSelector variants={variantOptions} selected={selectedVariant} onSelect={setSelectedVariant} />
        </div>
      )}

      {/* Details Accordion */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3">
          <h4 className="text-sm font-semibold">Details</h4>
        </div>

        {hasIngredients && (
          <DetailAccordion title="Ingredients">
            <p className="text-xs leading-relaxed whitespace-pre-wrap">{String(data.ingredients)}</p>
          </DetailAccordion>
        )}

        {hasSupplementFacts && (
          <DetailAccordion title="Supplement Facts" count={supplementFacts!.length}>
            <div className="space-y-1">
              {supplementFacts!.map((fact, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span>{fact.name}</span>
                  <span className="font-medium text-foreground">
                    {fact.amount}{fact.unit ? ` ${fact.unit}` : ""}
                    {fact.dailyValue ? ` (${fact.dailyValue})` : ""}
                  </span>
                </div>
              ))}
            </div>
          </DetailAccordion>
        )}

        {hasServing && (
          <DetailAccordion title="Serving Info">
            {data.servingSize ? <p className="text-xs">Serving Size: {String(data.servingSize)}</p> : null}
            {data.servingsPerContainer ? <p className="text-xs">Servings Per Container: {String(data.servingsPerContainer)}</p> : null}
          </DetailAccordion>
        )}

        {hasWarnings && (
          <DetailAccordion title="Warnings">
            <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">{String(data.warnings)}</p>
          </DetailAccordion>
        )}

        <DetailAccordion title="Product Info" defaultOpen>
          <div className="space-y-1.5 text-xs">
            {meta.brand ? <div className="flex justify-between"><span>Brand</span><span className="font-medium text-foreground">{String(meta.brand)}</span></div> : null}
            {meta.sku ? <div className="flex justify-between"><span>SKU</span><span className="font-mono text-foreground">{String(meta.sku)}</span></div> : null}
            {artifact.category ? <div className="flex justify-between"><span>Category</span><span className="font-medium text-foreground">{artifact.category}</span></div> : null}
            {meta.subCategory ? <div className="flex justify-between"><span>Sub-Category</span><span className="font-medium text-foreground">{String(meta.subCategory)}</span></div> : null}
          </div>
        </DetailAccordion>
      </div>

      {/* Buy Product Button */}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-full bg-red-600 hover:bg-red-700 text-white py-3 text-sm font-semibold transition-colors"
        >
          Buy Product
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

// ─── Truncated Description ──────────────────────────────────────────

function DescriptionText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 150;

  return (
    <p className="text-xs text-center text-muted-foreground leading-relaxed">
      {isLong && !expanded ? text.slice(0, 150) + "... " : text + " "}
      {isLong && (
        <button onClick={() => setExpanded(!expanded)} className="text-primary font-medium hover:underline">
          {expanded ? "Show less" : "See more"}
        </button>
      )}
    </p>
  );
}

function renderAgentDetail(artifact: ArtifactMeta, fullData: Record<string, unknown> | null) {
  const { meta } = artifact;
  const data = fullData || {};

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {artifact.category && <MetaBadge variant="info">{artifact.category}</MetaBadge>}
        {artifact.status && (
          <MetaBadge variant={artifact.status === "ACTIVE" ? "success" : "warning"}>
            {artifact.status}
          </MetaBadge>
        )}
        {meta.version ? <MetaBadge>v{String(meta.version)}</MetaBadge> : null}
      </div>
      {artifact.description && (
        <DetailSection label="Description">{artifact.description}</DetailSection>
      )}
      {(data as Record<string, unknown>).longDescription && (
        <DetailSection label="Details">
          {String((data as Record<string, unknown>).longDescription)}
        </DetailSection>
      )}
      {meta.skillCount != null && Number(meta.skillCount) > 0 && (
        <DetailSection label="Capabilities">
          <p>{Number(meta.skillCount)} skills, {Number(meta.toolCount || 0)} tools</p>
        </DetailSection>
      )}
    </>
  );
}

function renderPartnerDetail(artifact: ArtifactMeta) {
  const { meta } = artifact;

  return (
    <>
      {artifact.imageUrl && (
        <div className="w-20 h-20 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
          <img src={artifact.imageUrl} alt={artifact.name} className="max-h-full max-w-full object-contain" />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {artifact.category && <MetaBadge>{artifact.category}</MetaBadge>}
        {artifact.status && (
          <MetaBadge variant={artifact.status === "ACTIVE" ? "success" : "default"}>
            {artifact.status}
          </MetaBadge>
        )}
      </div>
      {artifact.description && (
        <DetailSection label="Description">{artifact.description}</DetailSection>
      )}
      {meta.audienceBenefit && (
        <DetailSection label="Member Benefit">
          <p className="text-emerald-600 dark:text-emerald-400 font-medium">
            {String(meta.audienceBenefit)}
          </p>
        </DetailSection>
      )}
    </>
  );
}

function renderPerkDetail(artifact: ArtifactMeta) {
  const { meta } = artifact;
  const tags = meta.tags as string[] | undefined;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {artifact.status && (
          <MetaBadge variant={artifact.status === "ACTIVE" ? "success" : "default"}>
            {artifact.status}
          </MetaBadge>
        )}
        {meta.tierCount != null && Number(meta.tierCount) > 0 && (
          <MetaBadge variant="info">{Number(meta.tierCount)} tiers</MetaBadge>
        )}
      </div>
      {artifact.description && (
        <DetailSection label="Description">{artifact.description}</DetailSection>
      )}
      {tags && tags.length > 0 && (
        <DetailSection label="Tags">
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <MetaBadge key={t}>{t}</MetaBadge>
            ))}
          </div>
        </DetailSection>
      )}
    </>
  );
}

function renderCommunityDetail(artifact: ArtifactMeta) {
  const { meta } = artifact;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {meta.platform ? <MetaBadge variant="info">{String(meta.platform)}</MetaBadge> : null}
        {artifact.status && (
          <MetaBadge variant={artifact.status === "ACTIVE" ? "success" : "default"}>
            {artifact.status}
          </MetaBadge>
        )}
      </div>
      {artifact.description && (
        <DetailSection label="Description">{artifact.description}</DetailSection>
      )}
      {meta.accessUrl && (
        <DetailSection label="Access">
          <a
            href={String(meta.accessUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            {String(meta.accessUrl)}
            <ExternalLink className="h-3 w-3" />
          </a>
        </DetailSection>
      )}
    </>
  );
}

function renderKnowledgeDetail(artifact: ArtifactMeta) {
  const { type, meta } = artifact;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {meta.fileType ? <MetaBadge>{String(meta.fileType).toUpperCase()}</MetaBadge> : null}
        {meta.duration != null ? <MetaBadge>{Math.round(Number(meta.duration))}s</MetaBadge> : null}
        {meta.domain ? <MetaBadge>{String(meta.domain)}</MetaBadge> : null}
        {meta.recordCount != null ? <MetaBadge>{Number(meta.recordCount)} records</MetaBadge> : null}
        {meta.fieldCount != null ? <MetaBadge>{Number(meta.fieldCount)} fields</MetaBadge> : null}
        {meta.responseCount != null ? <MetaBadge>{Number(meta.responseCount)} responses</MetaBadge> : null}
        {meta.pagesScraped != null ? <MetaBadge>{Number(meta.pagesScraped)} pages</MetaBadge> : null}
      </div>
      {artifact.imageUrl && ["image", "video"].includes(type) && (
        <div className="w-full overflow-hidden rounded-lg bg-muted">
          <img
            src={artifact.imageUrl}
            alt={artifact.name}
            className="w-full object-contain max-h-64"
          />
        </div>
      )}
      {artifact.description && (
        <DetailSection label="Description">{artifact.description}</DetailSection>
      )}
      {meta.sourceUrl && (
        <DetailSection label="Source">
          <a
            href={String(meta.sourceUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline text-xs break-all"
          >
            {String(meta.sourceUrl)}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </DetailSection>
      )}
      {meta.publishedAt && (
        <DetailSection label="Published">
          {new Date(String(meta.publishedAt)).toLocaleDateString()}
        </DetailSection>
      )}
      {meta.appName && (
        <DetailSection label="App">{String(meta.appName)}</DetailSection>
      )}
      {meta.date && (
        <DetailSection label="Date">
          {new Date(String(meta.date)).toLocaleDateString()}
        </DetailSection>
      )}
    </>
  );
}

export function ArtifactDetailPanel({ artifact, onClose }: ArtifactDetailPanelProps) {
  const [fullData, setFullData] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const Icon = typeIcons[artifact.type] || FileText;
  const label = typeLabels[artifact.type] || artifact.type;

  // Fetch full data for foundation types
  useEffect(() => {
    if (["product", "agent", "partner_brand", "perk", "community_benefit"].includes(artifact.type)) {
      const colonIdx = artifact.id.indexOf(":");
      const rawId = colonIdx !== -1 ? artifact.id.slice(colonIdx + 1) : artifact.id;
      setIsLoading(true);
      fetch(`/api/chat/artifacts/${artifact.type}/${rawId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.data) setFullData(json.data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [artifact.id, artifact.type]);

  const renderDetail = () => {
    switch (artifact.type) {
      case "product":
        return <ProductDetail artifact={artifact} fullData={fullData} />;
      case "agent":
        return renderAgentDetail(artifact, fullData);
      case "partner_brand":
        return renderPartnerDetail(artifact);
      case "perk":
        return renderPerkDetail(artifact);
      case "community_benefit":
        return renderCommunityDetail(artifact);
      default:
        return renderKnowledgeDetail(artifact);
    }
  };

  return (
    <div className="w-[420px] shrink-0 border-l bg-background flex flex-col animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <h3 className="text-sm font-semibold leading-tight truncate">
            {artifact.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
              <div className="h-20 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
            </div>
          ) : (
            renderDetail()
          )}
        </div>
      </div>
    </div>
  );
}
