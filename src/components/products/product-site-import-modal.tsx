"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Globe,
  Loader2,
  Package,
  Check,
  AlertCircle,
  Search,
  Download,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { ScrapedProductData } from "@/lib/products/types";

interface ProductSiteImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type CrawlStatus = "idle" | "discovering" | "scraping" | "importing" | "complete" | "error";

interface DiscoveredProduct extends ScrapedProductData {
  selected: boolean;
  importing: boolean;
  imported: boolean;
  importError: string | null;
}

export function ProductSiteImportModal({
  open,
  onOpenChange,
  onComplete,
}: ProductSiteImportModalProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<CrawlStatus>("idle");
  const [phase, setPhase] = useState("");
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [pagesDiscovered, setPagesDiscovered] = useState(0);
  const [pagesScraped, setPagesScraped] = useState(0);
  const [pagesErrored, setPagesErrored] = useState(0);
  const [products, setProducts] = useState<DiscoveredProduct[]>([]);
  const [costOfGoods, setCostOfGoods] = useState("");
  const [category, setCategory] = useState("SUPPLEMENT");
  const abortRef = useRef<AbortController | null>(null);

  function reset() {
    setUrl("");
    setStatus("idle");
    setPhase("");
    setCurrentUrl(null);
    setPagesDiscovered(0);
    setPagesScraped(0);
    setPagesErrored(0);
    setProducts([]);
    setCostOfGoods("");
    setCategory("SUPPLEMENT");
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }

  const handleCrawl = useCallback(async () => {
    if (!url.trim()) {
      toast.error("URL is required");
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setStatus("discovering");
    setPhase("Launching browser...");
    setProducts([]);
    setPagesDiscovered(0);
    setPagesScraped(0);
    setPagesErrored(0);
    setCurrentUrl(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/products/scrape-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), maxProducts: 500 }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || "Failed to start site crawl");
        setStatus("error");
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        toast.error("Stream not available");
        setStatus("error");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventBlock of events) {
          const lines = eventBlock.split("\n");
          let eventType = "";
          let eventData = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7);
            if (line.startsWith("data: ")) eventData = line.slice(6);
          }

          if (!eventType || !eventData) continue;

          try {
            const data = JSON.parse(eventData);

            switch (eventType) {
              case "progress":
                setStatus(data.status === "complete" ? "complete" : data.status === "scraping" ? "scraping" : "discovering");
                setPhase(data.phase || "");
                setCurrentUrl(data.currentUrl || null);
                setPagesDiscovered(data.pagesDiscovered);
                setPagesScraped(data.pagesScraped);
                setPagesErrored(data.pagesErrored);
                break;

              case "product":
                setProducts((prev) => [
                  ...prev,
                  {
                    ...data,
                    selected: true,
                    importing: false,
                    imported: false,
                    importError: null,
                  },
                ]);
                break;

              case "complete":
                setStatus("complete");
                setPhase(`Done! ${data.totalProducts} products found`);
                setCurrentUrl(null);
                break;

              case "error":
                console.warn("[SiteCrawl] Error:", data);
                break;
            }
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error(err instanceof Error ? err.message : "Crawl failed");
      setStatus("error");
    }
  }, [url]);

  function toggleAll(selected: boolean) {
    setProducts((prev) => prev.map((p) => ({ ...p, selected })));
  }

  function toggleProduct(idx: number) {
    setProducts((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, selected: !p.selected } : p))
    );
  }

  async function handleImportSelected() {
    const selected = products.filter((p) => p.selected && !p.imported);
    if (selected.length === 0) {
      toast.error("No products selected");
      return;
    }

    if (!costOfGoods) {
      toast.error("Please enter a default Cost of Goods");
      return;
    }

    const cogs = parseFloat(costOfGoods);
    if (isNaN(cogs) || cogs < 0) {
      toast.error("Cost of Goods must be a valid number");
      return;
    }

    setStatus("importing");
    setPhase("Importing products...");

    let imported = 0;
    let failed = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (!product.selected || product.imported) continue;

      setPhase(`Importing ${imported + failed + 1} / ${selected.length}: ${product.name || "Unknown"}`);

      setProducts((prev) =>
        prev.map((p, idx) => (idx === i ? { ...p, importing: true } : p))
      );

      try {
        const sku = toSlug(product.name || "UNKNOWN", product.brand);

        const res = await fetch("/api/products/import-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: product.name || "Unknown Product",
            sku: `${sku}-${i}`,
            category,
            retailPrice: product.price || 0,
            costOfGoods: cogs,
            brand: product.brand || undefined,
            description: product.description || undefined,
            sourceUrl: product.sourceUrl,
            imageUrl: product.images[0]?.url || undefined,
            variants: product.variants.length > 0 ? product.variants : undefined,
            servingSize: product.servingSize || undefined,
            servingsPerContainer: product.servingsPerContainer || undefined,
            ingredients: product.ingredients || undefined,
            supplementFacts: product.supplementFacts.length > 0 ? product.supplementFacts : undefined,
            warnings: product.warnings || undefined,
            images: product.images.map((img, idx) => ({
              url: img.url,
              alt: img.alt,
              isPrimary: idx === 0,
            })),
          }),
        });

        if (res.ok) {
          imported++;
          setProducts((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, importing: false, imported: true } : p
            )
          );
        } else {
          const err = await res.json().catch(() => null);
          failed++;
          setProducts((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? { ...p, importing: false, importError: err?.error || "Failed" }
                : p
            )
          );
        }
      } catch (err) {
        failed++;
        setProducts((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? {
                  ...p,
                  importing: false,
                  importError: err instanceof Error ? err.message : "Failed",
                }
              : p
          )
        );
      }
    }

    setStatus("complete");
    setPhase(`Imported ${imported} products${failed > 0 ? `, ${failed} failed` : ""}`);
    toast.success(
      `Imported ${imported} products${failed > 0 ? `, ${failed} failed` : ""}`
    );

    if (imported > 0) {
      onComplete();
    }
  }

  const selectedCount = products.filter((p) => p.selected && !p.imported).length;
  const importedCount = products.filter((p) => p.imported).length;
  const isCrawling = status === "discovering" || status === "scraping";
  const progressPercent = pagesDiscovered > 0 ? Math.round((pagesScraped + pagesErrored) / pagesDiscovered * 100) : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isCrawling && status !== "importing") {
          onOpenChange(v);
          if (!v) reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Import Products from Website
          </DialogTitle>
        </DialogHeader>

        {/* URL Input */}
        <div className="space-y-1.5">
          <Label className="text-xs">Website URL</Label>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.buckedup.com"
              type="url"
              disabled={isCrawling || status === "importing"}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCrawling) handleCrawl();
              }}
            />
            <Button
              onClick={handleCrawl}
              disabled={isCrawling || !url.trim() || status === "importing"}
              size="sm"
              className="shrink-0"
            >
              {isCrawling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Search className="h-3.5 w-3.5 mr-1.5" />
              )}
              {isCrawling ? "Crawling..." : "Crawl Site"}
            </Button>
          </div>
        </div>

        {/* Live Progress Section */}
        {status !== "idle" && (
          <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
            {/* Phase indicator */}
            <div className="flex items-center gap-2">
              {isCrawling || status === "importing" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
              ) : status === "complete" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
              ) : status === "error" ? (
                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
              ) : null}
              <span className="text-sm font-medium truncate">{phase}</span>
            </div>

            {/* Progress bar (during scraping) */}
            {status === "scraping" && pagesDiscovered > 0 && (
              <div className="space-y-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{progressPercent}% complete</span>
                  <span>{pagesScraped + pagesErrored} / {pagesDiscovered}</span>
                </div>
              </div>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span><strong>{pagesDiscovered}</strong> discovered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span><strong>{pagesScraped}</strong> scraped</span>
              </div>
              {pagesErrored > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span><strong>{pagesErrored}</strong> errors</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span><strong>{products.length}</strong> products</span>
              </div>
            </div>

            {/* Current URL being scraped */}
            {currentUrl && (
              <div className="text-[10px] text-muted-foreground truncate font-mono">
                {new URL(currentUrl).pathname}
              </div>
            )}
          </div>
        )}

        {/* Product List */}
        {products.length > 0 && (
          <div className="flex-1 overflow-y-auto min-h-0 space-y-1">
            {/* Select all / deselect all */}
            <div className="flex items-center justify-between pb-1 sticky top-0 bg-background z-10">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => toggleAll(true)}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => toggleAll(false)}
                >
                  Deselect All
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                {selectedCount} selected, {importedCount} imported
              </span>
            </div>

            {products.map((product, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                  product.imported
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    : product.importError
                    ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                    : product.selected
                    ? "border-primary/30 bg-primary/5"
                    : "border-border opacity-50"
                }`}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={product.selected}
                  onChange={() => toggleProduct(idx)}
                  disabled={product.imported || product.importing}
                  className="rounded"
                />

                {/* Thumbnail */}
                {product.images[0] ? (
                  <img
                    src={product.images[0].url}
                    alt=""
                    className="h-8 w-8 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {product.name || "Unknown"}
                  </div>
                  <div className="text-muted-foreground flex gap-2">
                    {product.brand && <span>{product.brand}</span>}
                    {product.price != null && <span>${product.price}</span>}
                    {product.variants.length > 0 && (
                      <span>
                        {product.variants[0].options.length} variants
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                {product.importing && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                )}
                {product.imported && (
                  <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                )}
                {product.importError && (
                  <div className="flex items-center gap-1 text-destructive shrink-0">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="text-[10px]">{product.importError}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Import Settings */}
        {products.length > 0 && !isCrawling && (
          <div className="border-t pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Default Cost of Goods *</Label>
                <Input
                  value={costOfGoods}
                  onChange={(e) => setCostOfGoods(e.target.value)}
                  type="number"
                  step="0.01"
                  placeholder="Enter default COGS"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                >
                  <option value="SUPPLEMENT">SUPPLEMENT</option>
                  <option value="APPAREL">APPAREL</option>
                  <option value="ACCESSORY">ACCESSORY</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {(products.length > 0 || isCrawling) && (
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (abortRef.current) abortRef.current.abort();
                reset();
              }}
              disabled={status === "importing"}
            >
              {status === "complete" && importedCount > 0 ? "Close" : "Cancel"}
            </Button>
            {products.length > 0 && !isCrawling && (
              <Button
                onClick={handleImportSelected}
                disabled={
                  status === "importing" ||
                  selectedCount === 0 ||
                  !costOfGoods
                }
                size="sm"
              >
                {status === "importing" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Import {selectedCount} Products
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function toSlug(name: string, brand?: string | null): string {
  const prefix = brand ? `${brand}-` : "";
  return (prefix + name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}
