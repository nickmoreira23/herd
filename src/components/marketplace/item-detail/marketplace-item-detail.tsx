"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  ItemDetail,
  ItemDetailSection,
} from "@/lib/marketplace/item-detail-resolver";

interface Props {
  detail: ItemDetail;
  /** "Back to {parent}" link target. */
  backHref: string;
  backLabel: string;
}

export function MarketplaceItemDetail({ detail, backHref, backLabel }: Props) {
  return (
    <div>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 mt-6 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> {backLabel}
      </Link>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Gallery gallery={detail.gallery} altText={detail.name} />

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {detail.blockDisplayName}
          </p>
          <h1 className="text-3xl font-bold leading-tight mt-1">{detail.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            {detail.status && (
              <Badge variant="secondary" className="text-[10px]">
                {detail.status}
              </Badge>
            )}
            {detail.tags.slice(0, 4).map((t) => (
              <Badge key={t} variant="outline" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>

          {detail.description && (
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              {detail.description}
            </p>
          )}

          {detail.primaryFacts.length > 0 && (
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {detail.primaryFacts.map((f) => (
                <div key={f.label}>
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {f.label}
                  </dt>
                  <dd className="font-medium mt-0.5">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {detail.cta && (
            <a href={detail.cta.href ?? "#"} className="inline-block mt-6">
              <Button>{detail.cta.label}</Button>
            </a>
          )}
        </div>
      </div>

      {detail.sections.length > 0 && (
        <div className="mt-12 space-y-10">
          {detail.sections.map((s, i) => (
            <SectionRender key={i} section={s} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Gallery ───────────────────────────────────────────────

function Gallery({
  gallery,
  altText,
}: {
  gallery: ItemDetail["gallery"];
  altText: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  if (gallery.length === 0) {
    return (
      <div className="rounded-xl bg-muted aspect-square flex items-center justify-center text-xs text-muted-foreground">
        No image
      </div>
    );
  }
  const active = gallery[activeIdx] ?? gallery[0];
  return (
    <div className="space-y-3">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
        <Image
          src={active.url}
          alt={active.alt ?? altText}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {gallery.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {gallery.slice(0, 10).map((g, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={cn(
                "relative aspect-square rounded-md overflow-hidden bg-muted border transition-colors",
                i === activeIdx ? "border-primary" : "border-transparent hover:border-foreground/20"
              )}
            >
              <Image
                src={g.url}
                alt={g.alt ?? altText}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section types ─────────────────────────────────────────

function SectionRender({ section }: { section: ItemDetailSection }) {
  switch (section.kind) {
    case "text":
      return (
        <section>
          <h2 className="text-lg font-semibold mb-3">{section.heading}</h2>
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {section.content as string}
          </p>
        </section>
      );
    case "facts": {
      const facts = section.content as Array<{ label: string; value: string }>;
      return (
        <section>
          <h2 className="text-lg font-semibold mb-3">{section.heading}</h2>
          <Card className="p-5">
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {f.label}
                  </dt>
                  <dd className="font-medium mt-0.5">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </section>
      );
    }
    case "list": {
      const items = section.content as Array<{
        label: string;
        value: string;
        href?: string;
      }>;
      return (
        <section>
          <h2 className="text-lg font-semibold mb-3">{section.heading}</h2>
          <ul className="space-y-2">
            {items.map((it, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{it.label}</span>
                {it.value && it.href ? (
                  <>
                    {": "}
                    <a
                      href={it.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {it.value}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </>
                ) : it.value ? (
                  <>{`: ${it.value}`}</>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      );
    }
    case "supplementFacts": {
      const facts = section.content as Array<{
        name: string;
        amount?: string | number;
        unit?: string;
        dailyValue?: string | number;
      }>;
      return (
        <section>
          <h2 className="text-lg font-semibold mb-3">{section.heading}</h2>
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left py-2 px-4 font-medium text-[11px] uppercase tracking-wider">
                    Nutrient
                  </th>
                  <th className="text-right py-2 px-4 font-medium text-[11px] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-right py-2 px-4 font-medium text-[11px] uppercase tracking-wider">
                    % DV
                  </th>
                </tr>
              </thead>
              <tbody>
                {facts.map((f, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2 px-4">{f.name}</td>
                    <td className="py-2 px-4 text-right tabular-nums">
                      {f.amount ?? ""}
                      {f.unit ?? ""}
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums text-muted-foreground">
                      {f.dailyValue ? `${f.dailyValue}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      );
    }
    case "variants": {
      const variants = section.content as Array<{
        name: string;
        options?: string[] | string;
      }>;
      return (
        <section>
          <h2 className="text-lg font-semibold mb-3">{section.heading}</h2>
          <div className="space-y-3">
            {variants.map((v, i) => {
              const opts = Array.isArray(v.options)
                ? v.options
                : typeof v.options === "string"
                  ? [v.options]
                  : [];
              return (
                <div key={i}>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                    {v.name}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {opts.map((o, j) => (
                      <Badge key={j} variant="outline" className="text-xs">
                        {o}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      );
    }
    default:
      return null;
  }
}
