import { getLocale } from "@/lib/i18n/get-locale";
import { adminLocaleToHandbookLocale } from "@/lib/handbook/config";
import { HandbookSearchDialog } from "@/components/handbook/handbook-search-dialog";

export default async function HandbookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminLocale = await getLocale();
  const userDefaultLocale = adminLocaleToHandbookLocale(adminLocale);
  return (
    <>
      {children}
      <HandbookSearchDialog userDefaultLocale={userDefaultLocale} />
    </>
  );
}
