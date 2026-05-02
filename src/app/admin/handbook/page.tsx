import {
  getLayers,
  getCategoriesOf,
  getMetaEntries,
  toChildItems,
} from "@/lib/handbook/search-index";
import { HandbookChildrenList } from "@/components/handbook/handbook-children-list";
import { getLocale } from "@/lib/i18n/get-locale";
import { adminLocaleToHandbookLocale } from "@/lib/handbook/config";

export default async function HandbookHomePage() {
  const adminLocale = await getLocale();
  const locale = adminLocaleToHandbookLocale(adminLocale);

  const layers = getLayers();
  const metaEntries = getMetaEntries();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Handbook</h1>
        <p className="text-muted-foreground mt-2">
          {locale === "pt-BR"
            ? "Documentação do produto HERD organizada em camadas: Networks, Solutions, Tools, Blocks, Integrations."
            : "HERD product documentation organized into layers: Networks, Solutions, Tools, Blocks, Integrations."}
        </p>
      </header>

      {layers.map((layer) => {
        const categories = getCategoriesOf(layer.uid);
        const title = locale === "pt-BR" ? layer.title_pt_BR : layer.title_en_US;
        const description =
          locale === "pt-BR" ? layer.description_pt_BR : layer.description_en_US;
        const countLabel =
          locale === "pt-BR"
            ? `(${categories.length} ${categories.length === 1 ? "categoria" : "categorias"})`
            : `(${categories.length} ${categories.length === 1 ? "category" : "categories"})`;
        return (
          <section key={layer.uid} className="mb-10">
            <div className="flex items-baseline gap-2 mb-1">
              <h2 className="text-xl font-semibold text-foreground">
                <a
                  href={`/admin/handbook/${layer.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {title}
                </a>
              </h2>
              <span className="text-sm text-muted-foreground">{countLabel}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3 max-w-3xl">
              {description}
            </p>
            <HandbookChildrenList
              items={toChildItems(categories, (c) => `/admin/handbook/${layer.id}/${c.id}`)}
              locale={locale}
              emptyMessage={
                locale === "pt-BR"
                  ? "Nenhuma categoria documentada ainda."
                  : "No categories documented yet."
              }
            />
          </section>
        );
      })}

      {metaEntries.length > 0 && (
        <section className="mt-12 pt-8 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground mb-3">Meta</h2>
          <HandbookChildrenList
            items={toChildItems(metaEntries, (e) => `/admin/handbook/meta/${e.id}`)}
            locale={locale}
          />
        </section>
      )}
    </div>
  );
}
