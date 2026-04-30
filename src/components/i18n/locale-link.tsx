"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import type { ComponentProps, ReactNode } from "react";

const PUBLIC_LOCALE_PREFIXES = ["/p", "/f", "/explore", "/shared"];

function isPublicPath(href: string): boolean {
  if (!href.startsWith("/")) return false;
  return PUBLIC_LOCALE_PREFIXES.some(
    (prefix) => href === prefix || href.startsWith(prefix + "/"),
  );
}

function prefixHrefWithLocale(href: string, locale: Locale): string {
  // If href already has a locale prefix, don't double-prefix.
  if (/^\/[a-z]{2}-[A-Z]{2}\//.test(href)) return href;
  return `/${locale}${href}`;
}

interface LocaleLinkProps extends Omit<ComponentProps<typeof Link>, "href"> {
  href: string;
  children: ReactNode;
  /** Force a specific locale, overriding the current one. */
  locale?: Locale;
}

/**
 * Link wrapper that automatically prefixes locale for public routes.
 *
 * - Public route (/p, /f, /explore, /shared) → prefixed with current locale.
 * - Admin/API/internal route → passed through unchanged.
 * - External URL (http://, mailto:, etc.) → passed through unchanged.
 *
 * Usage:
 *   <LocaleLink href="/p/abc-123">View page</LocaleLink>
 *   → renders <a href="/pt-BR/p/abc-123">
 */
export function LocaleLink({ href, locale: forcedLocale, children, ...rest }: LocaleLinkProps) {
  const currentLocale = useLocale();
  const targetLocale = forcedLocale ?? currentLocale;

  const finalHref = isPublicPath(href) ? prefixHrefWithLocale(href, targetLocale) : href;

  return (
    <Link href={finalHref} {...rest}>
      {children}
    </Link>
  );
}
