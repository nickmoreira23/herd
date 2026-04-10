import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
// Prisma Decimal type - use number | { toNumber(): number } for flexibility
type DecimalLike = { toNumber(): number } | number;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | DecimalLike): string {
  const num = typeof amount === "number" ? amount : Number(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPercent(value: number | DecimalLike, decimals = 1): string {
  const num = typeof value === "number" ? value : Number(value);
  return `${num.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function toNumber(value: number | DecimalLike): number {
  return typeof value === "number" ? value : Number(value);
}

export function calculateMargin(
  costOfGoods: number | DecimalLike,
  memberPrice: number | DecimalLike
): number {
  const cost = toNumber(costOfGoods);
  const price = toNumber(memberPrice);
  if (price === 0) return 0;
  return ((price - cost) / price) * 100;
}

export function getMarginColor(margin: number): "green" | "yellow" | "red" {
  if (margin >= 70) return "green";
  if (margin >= 50) return "yellow";
  return "red";
}

export function getMarginColorClass(margin: number): string {
  const color = getMarginColor(margin);
  switch (color) {
    case "green":
      return "text-green-600 bg-green-50";
    case "yellow":
      return "text-yellow-600 bg-yellow-50";
    case "red":
      return "text-red-600 bg-red-50";
  }
}
