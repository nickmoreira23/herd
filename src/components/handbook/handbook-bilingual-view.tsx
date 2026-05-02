"use client";

import { useHandbookLocale } from "./use-handbook-locale";
import { HandbookEntryHeader } from "./handbook-entry-header";
import { HandbookReader } from "./handbook-reader";
import { HandbookChildrenList, type ChildItem } from "./handbook-children-list";
import { githubEditUrl, type HandbookLocale } from "@/lib/handbook/config";

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

      <HandbookReader body={data.body} />

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
