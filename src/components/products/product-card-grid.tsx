"use client";

import type { Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Package, ImageOff } from "lucide-react";

interface ProductCardGridProps {
  products: Product[];
  onOpen: (product: Product) => void;
}

function formatPrice(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  if (isNaN(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

function categoryColor(category: string): string {
  switch (category) {
    case "SUPPLEMENT":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "APPAREL":
      return "bg-violet-500/10 text-violet-600 dark:text-violet-400";
    case "ACCESSORY":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function ProductCardGrid({ products, onOpen }: ProductCardGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Package className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => onOpen(product)}
          className="group relative flex flex-col rounded-xl border bg-card text-left transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring overflow-hidden"
        >
          {/* Image */}
          <div className="relative aspect-square w-full bg-muted/50 overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageOff className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}

            {/* Status indicator */}
            {!product.isActive && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full">
                  Inactive
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-1.5 p-3">
            {/* Category badge */}
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${categoryColor(product.category)}`}
              >
                {product.category}
              </span>
              {product.subCategory && (
                <span className="text-[10px] text-muted-foreground">
                  {product.subCategory}
                </span>
              )}
            </div>

            {/* Name */}
            <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>

            {/* Brand */}
            {product.brand && (
              <p className="text-[11px] text-muted-foreground truncate">
                {product.brand}
              </p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 mt-auto pt-1">
              <span className="text-sm font-semibold tabular-nums">
                {formatPrice(product.retailPrice)}
              </span>
              {Number(product.memberPrice) < Number(product.retailPrice) && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                  {formatPrice(product.memberPrice)} member
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
