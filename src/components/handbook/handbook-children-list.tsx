import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { HandbookLocale } from "@/lib/handbook/config";

export interface ChildItem {
  uid: string;
  href: string;
  title_pt_BR: string;
  title_en_US: string;
  description_pt_BR: string;
  description_en_US: string;
}

interface Props {
  items: ChildItem[];
  locale: HandbookLocale;
  heading?: string;
  emptyMessage?: string;
}

export function HandbookChildrenList({ items, locale, heading, emptyMessage }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-4">
        {emptyMessage ?? "Nenhum item ainda."}
      </div>
    );
  }

  return (
    <section className="mt-8">
      {heading && (
        <h2 className="text-lg font-semibold text-foreground mb-3">{heading}</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <Link key={item.uid} href={item.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-base">
                  {locale === "pt-BR" ? item.title_pt_BR : item.title_en_US}
                </CardTitle>
                <CardDescription>
                  {locale === "pt-BR" ? item.description_pt_BR : item.description_en_US}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
