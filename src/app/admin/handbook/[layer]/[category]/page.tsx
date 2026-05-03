import { notFound } from "next/navigation";
import {
  findByUid,
  getFeaturesOf,
  entryFilesystemPath,
  toChildItems,
} from "@/lib/handbook/search-index";
import { readEntryBilingual } from "@/lib/handbook/read-entry";
import { githubEditUrl, adminLocaleToHandbookLocale } from "@/lib/handbook/config";
import { resolveBilingualCrossRefs } from "@/lib/handbook/cross-refs";
import { HandbookBilingualView } from "@/components/handbook/handbook-bilingual-view";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function CategoryOverviewPage({
  params,
}: {
  params: Promise<{ layer: string; category: string }>;
}) {
  const { layer, category } = await params;
  const uid = `herd.category.${layer}.${category}`;
  const indexEntry = findByUid(uid);
  if (!indexEntry) notFound();

  const layerEntry = findByUid(`herd.layer.${layer}`);
  if (!layerEntry) notFound();

  const fsPath = entryFilesystemPath(uid);
  if (!fsPath) notFound();
  const bilingual = readEntryBilingual(fsPath);
  if (!bilingual) notFound();

  const adminLocale = await getLocale();
  const userDefaultLocale = adminLocaleToHandbookLocale(adminLocale);
  const features = getFeaturesOf(uid);

  return (
    <HandbookBilingualView
      crumbs={[
        { labelPtBR: "Handbook", labelEnUS: "Handbook", href: "/admin/handbook" },
        {
          labelPtBR: layerEntry.title_pt_BR,
          labelEnUS: layerEntry.title_en_US,
          href: `/admin/handbook/${layer}`,
        },
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
      selfUrl={`/admin/handbook/${layer}/${category}`}
      childItems={toChildItems(features, (f) => `/admin/handbook/${layer}/${category}/${f.id}`)}
      childrenHeadingPtBR={features.length > 0 ? "Features" : undefined}
      childrenHeadingEnUS={features.length > 0 ? "Features" : undefined}
    />
  );
}
