import "./handbook-print.css";

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
  // No overflow / height styling on this wrapper — the admin shell's
  // <main> already owns the page scroll. Nesting a second
  // `overflow-y-auto h-full` inside it created a trapped scroll
  // container: once the inner reached its edge, `overscroll-contain`
  // blocked the wheel from reaching the outer scroller, so the page
  // appeared frozen at viewport extremes.
  return (
    <>
      {children}
      <HandbookSearchDialog userDefaultLocale={userDefaultLocale} />
    </>
  );
}
