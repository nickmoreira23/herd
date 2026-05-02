import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";
import type { BilingualCrossRefs, ResolvedRef } from "@/lib/handbook/cross-refs";
import type { HandbookLocale } from "@/lib/handbook/config";

interface Props {
  crossRefs: BilingualCrossRefs;
  locale: HandbookLocale;
}

const STRINGS = {
  "pt-BR": {
    consumes: "Consome",
    consumedBy: "Consumido por",
    pending: "pendente",
    pendingTooltip: "Esta feature ainda não tem entry no Handbook. Documentada no allowlist.",
    broken: "quebrado",
    brokenTooltip: "Esta referência não resolve e não está no allowlist.",
    sectionHeading: "Relações",
  },
  "en-US": {
    consumes: "Consumes",
    consumedBy: "Consumed by",
    pending: "pending",
    pendingTooltip: "This feature does not yet have a Handbook entry. Documented in the allowlist.",
    broken: "broken",
    brokenTooltip: "This reference does not resolve and is not in the allowlist.",
    sectionHeading: "Relations",
  },
} as const;

type Strings = (typeof STRINGS)[HandbookLocale];

export function HandbookCrossReferences({ crossRefs, locale }: Props) {
  const { consumes, consumedBy } = crossRefs;
  if (consumes.length === 0 && consumedBy.length === 0) return null;

  const t = STRINGS[locale];

  return (
    <section className="mt-12 pt-6 border-t border-border">
      <h2 className="text-lg font-semibold text-foreground mb-4">{t.sectionHeading}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {consumes.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />
              {t.consumes}
            </h3>
            <ul className="space-y-1">
              {consumes.map((ref) => (
                <li key={ref.uid}>
                  <RefDisplay refItem={ref} locale={locale} t={t} />
                </li>
              ))}
            </ul>
          </div>
        )}
        {consumedBy.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              {t.consumedBy}
            </h3>
            <ul className="space-y-1">
              {consumedBy.map((ref) => (
                <li key={ref.uid}>
                  <RefDisplay refItem={ref} locale={locale} t={t} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function RefDisplay({
  refItem,
  locale,
  t,
}: {
  refItem: ResolvedRef;
  locale: HandbookLocale;
  t: Strings;
}) {
  if (refItem.status === "resolved" && refItem.href) {
    const title =
      locale === "pt-BR" ? refItem.resolvedTitlePtBR : refItem.resolvedTitleEnUS;
    return (
      <Link href={refItem.href} className="text-primary hover:underline text-sm">
        {title}
      </Link>
    );
  }

  if (refItem.status === "allowlisted") {
    const lastSeg = refItem.uid.split(".").slice(-1)[0];
    return (
      <span className="text-sm text-muted-foreground inline-flex items-center gap-2">
        <span>{lastSeg}</span>
        <Badge variant="outline" className="text-xs" title={t.pendingTooltip}>
          {t.pending}
        </Badge>
      </span>
    );
  }

  return (
    <span className="text-sm text-destructive inline-flex items-center gap-2">
      <AlertCircle className="h-3 w-3" />
      <span>{refItem.uid}</span>
      <Badge variant="destructive" className="text-xs" title={t.brokenTooltip}>
        {t.broken}
      </Badge>
    </span>
  );
}
