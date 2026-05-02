import { notFound } from "next/navigation";
import { findByUid, entryFilesystemPath } from "@/lib/handbook/search-index";
import { readEntryBilingual } from "@/lib/handbook/read-entry";
import { githubEditUrl, adminLocaleToHandbookLocale } from "@/lib/handbook/config";
import { resolveBilingualCrossRefs } from "@/lib/handbook/cross-refs";
import { HandbookBilingualView } from "@/components/handbook/handbook-bilingual-view";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function MetaEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const uid = `herd.meta.${id}`;
  const indexEntry = findByUid(uid);
  if (!indexEntry) notFound();

  const fsPath = entryFilesystemPath(uid);
  if (!fsPath) notFound();
  const bilingual = readEntryBilingual(fsPath);
  if (!bilingual) notFound();

  const adminLocale = await getLocale();
  const userDefaultLocale = adminLocaleToHandbookLocale(adminLocale);

  return (
    <HandbookBilingualView
      crumbs={[
        { labelPtBR: "Meta", labelEnUS: "Meta" },
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
      selfUrl={`/admin/handbook/meta/${id}`}
    />
  );
}
