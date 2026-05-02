"use client";

import { useHandbookLocale } from "./use-handbook-locale";
import { HandbookEntryHeader } from "./handbook-entry-header";
import { HandbookReader } from "./handbook-reader";
import { HandbookChildrenList, type ChildItem } from "./handbook-children-list";
import { HandbookCrossReferences } from "./handbook-cross-references";
import { githubEditUrl, type HandbookLocale } from "@/lib/handbook/config";
import { transformMarkdown } from "@/lib/handbook/transform-markdown";
import type { BilingualCrossRefs } from "@/lib/handbook/cross-refs";

interface LocaleData {
  title: string;
  description: string;
  body: string;
  relativePath: string;
}

export interface BilingualEntry {
  ptBR: LocaleData;
  enUS: LocaleData;
}

interface BilingualCrumb {
  labelPtBR: string;
  labelEnUS: string;
  href?: string;
}

interface Props {
  crumbs: BilingualCrumb[];
  entry: BilingualEntry;
  /** UID of the entry — used to scope per-entry localStorage state. */
  uid: string;
  crossRefs: BilingualCrossRefs;
  owners: string[];
  updated: string;
  status: string;
  userDefaultLocale: HandbookLocale;
  selfUrl: string;
  children?: ChildItem[];
  childrenHeadingPtBR?: string;
  childrenHeadingEnUS?: string;
}

export function HandbookBilingualView({
  crumbs,
  entry,
  uid,
  crossRefs,
  owners,
  updated,
  status,
  userDefaultLocale,
  selfUrl,
  children,
  childrenHeadingPtBR,
  childrenHeadingEnUS,
}: Props) {
  const { locale, setOverride, clearOverride, hasOverride } =
    useHandbookLocale(userDefaultLocale);
  const data = locale === "pt-BR" ? entry.ptBR : entry.enUS;
  const githubUrl = githubEditUrl(data.relativePath);
  const transformedBody = transformMarkdown(data.body);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <HandbookEntryHeader
        crumbs={crumbs.map((c) => ({
          label: locale === "pt-BR" ? c.labelPtBR : c.labelEnUS,
          href: c.href,
        }))}
        title={data.title}
        description={data.description}
        owners={owners}
        updated={updated}
        status={status}
        locale={locale}
        setOverride={setOverride}
        clearOverride={clearOverride}
        hasOverride={hasOverride}
        markdownRaw={data.body}
        githubEditUrl={githubUrl}
        selfUrl={selfUrl}
      />

      <HandbookReader body={transformedBody} locale={locale} uid={uid} />

      <HandbookCrossReferences crossRefs={crossRefs} locale={locale} />

      {children && children.length > 0 && (
        <HandbookChildrenList
          items={children}
          locale={locale}
          heading={
            locale === "pt-BR" ? childrenHeadingPtBR : childrenHeadingEnUS
          }
        />
      )}
    </div>
  );
}
