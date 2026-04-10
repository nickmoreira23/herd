export interface ScrapedProductImage {
  url: string;
  alt: string | null;
}

export interface ScrapedVariant {
  name: string;
  options: string[];
}

export interface SupplementFactLine {
  name: string;
  amount: string;
  unit: string;
  dailyValue: string | null;
}

export interface ScrapedProductData {
  name: string | null;
  brand: string | null;
  description: string | null;
  price: number | null;
  currency: string | null;
  sku: string | null;
  images: ScrapedProductImage[];
  variants: ScrapedVariant[];
  servingSize: string | null;
  servingsPerContainer: number | null;
  ingredients: string | null;
  supplementFacts: SupplementFactLine[];
  warnings: string | null;
  category: string | null;
  tags: string[];
  sourceUrl: string;
}

/** Partial scraped data returned by individual extractors */
export type PartialScrapedData = Partial<Omit<ScrapedProductData, "sourceUrl">>;
