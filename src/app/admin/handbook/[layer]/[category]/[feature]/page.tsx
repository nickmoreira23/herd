import { notFound } from "next/navigation";
import {
  findByUid,
  getIndex,
  entryFilesystemPath,
} from "@/lib/handbook/search-index";
import { readEntryBilingual } from "@/lib/handbook/read-entry";
import { githubEditUrl, adminLocaleToHandbookLocale } from "@/lib/handbook/config";
import { resolveBilingualCrossRefs } from "@/lib/handbook/cross-refs";
import { HandbookBilingualView } from "@/components/handbook/handbook-bilingual-view";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ layer: string; category: string; feature: string }>;
}) {
  const { layer, category, feature } = await params;
  const categoryUid = `herd.category.${layer}.${category}`;

  const indexEntry = getIndex().find(
    (e) => e.parent === categoryUid && e.id === feature,
  );
  if (!indexEntry) notFound();

  const layerEntry = findByUid(`herd.layer.${layer}`);
  const categoryEntry = findByUid(categoryUid);
  if (!layerEntry || !categoryEntry) notFound();

  const fsPath = entryFilesystemPath(indexEntry.uid);
  if (!fsPath) notFound();
  const bilingual = readEntryBilingual(fsPath);
  if (!bilingual) notFound();

  const adminLocale = await getLocale();
  const userDefaultLocale = adminLocaleToHandbookLocale(adminLocale);

  return (
    <HandbookBilingualView
      crumbs={[
        { labelPtBR: "Handbook", labelEnUS: "Handbook", href: "/admin/handbook" },
        {
          labelPtBR: layerEntry.title_pt_BR,
          labelEnUS: layerEntry.title_en_US,
          href: `/admin/handbook/${layer}`,
        },
        {
          labelPtBR: categoryEntry.title_pt_BR,
          labelEnUS: categoryEntry.title_en_US,
          href: `/admin/handbook/${layer}/${category}`,
        },
        { labelPtBR: indexEntry.title_pt_BR, labelEnUS: indexEntry.title_en_US },
      ]}
      entry={{
        ptBR: {
          title: bilingual.ptBR.frontmatter.title,
          description: bilingual.ptBR.frontmatter.description,
          body: bilingual.ptBR.body,
          relativePath: bilingual.ptBR.relativePath,
        },
        enUS: {
          title: bilingual.enUS.frontmatter.title,
          description: bilingual.enUS.frontmatter.description,
          body: bilingual.enUS.body,
          relativePath: bilingual.enUS.relativePath,
        },
      }}
      uid={indexEntry.uid}
      crossRefs={resolveBilingualCrossRefs(indexEntry)}
      owners={indexEntry.owners}
      updated={indexEntry.updated}
      status={indexEntry.status}
      userDefaultLocale={userDefaultLocale}
      selfUrl={`/admin/handbook/${layer}/${category}/${feature}`}
    />
  );
}
