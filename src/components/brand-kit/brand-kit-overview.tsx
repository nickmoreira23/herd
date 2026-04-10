"use client";

import Link from "next/link";
import Image from "next/image";
import { useBrandKitSection } from "@/hooks/use-brand-kit-section";
import { ALL_BRAND_KIT_KEYS, generateShades } from "@/lib/brand-kit-settings";
import { BrandKitSection } from "./brand-kit-section";
import {
  Image as ImageIcon,
  Palette,
  Type,
  RectangleHorizontal,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CategoryCard {
  href: string;
  label: string;
  icon: LucideIcon;
  bgClass: string;
  renderPreview: (settings: Record<string, string>) => React.ReactNode;
}

const CATEGORIES: CategoryCard[] = [
  {
    href: "/admin/organization/brand-kit/logos",
    label: "Logos",
    icon: ImageIcon,
    bgClass: "bg-violet-50 dark:bg-violet-950/30",
    renderPreview: (s) => <LogosPreview settings={s} />,
  },
  {
    href: "/admin/organization/brand-kit/colors",
    label: "Colors",
    icon: Palette,
    bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
    renderPreview: (s) => <ColorsPreview settings={s} />,
  },
  {
    href: "/admin/organization/brand-kit/fonts",
    label: "Fonts",
    icon: Type,
    bgClass: "bg-amber-50 dark:bg-amber-950/30",
    renderPreview: (s) => <FontsPreview settings={s} />,
  },
  {
    href: "/admin/organization/brand-kit/brand-voice",
    label: "Brand Voice",
    icon: MessageSquare,
    bgClass: "bg-rose-50 dark:bg-rose-950/30",
    renderPreview: (s) => <BrandVoicePreview settings={s} />,
  },
  {
    href: "/admin/organization/brand-kit/buttons",
    label: "Buttons",
    icon: RectangleHorizontal,
    bgClass: "bg-sky-50 dark:bg-sky-950/30",
    renderPreview: (s) => <ButtonsPreview settings={s} />,
  },
  {
    href: "/admin/organization/brand-kit/appearance",
    label: "Appearance",
    icon: Sparkles,
    bgClass: "bg-orange-50 dark:bg-orange-950/30",
    renderPreview: (s) => <AppearancePreview settings={s} />,
  },
];

export function BrandKitOverview() {
  const { settings, loading } = useBrandKitSection(ALL_BRAND_KIT_KEYS);

  return (
    <BrandKitSection
      title="Brand Kit"
      description="Your brand identity at a glance. Click any section to customize."
      loading={loading}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className="group rounded-lg border bg-card overflow-hidden hover:shadow-md transition-all hover:border-primary/30"
          >
            <div
              className={`h-36 flex items-center justify-center overflow-hidden ${cat.bgClass}`}
            >
              {cat.renderPreview(settings)}
            </div>
            <div className="px-3 py-2.5 flex items-center gap-2">
              <cat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{cat.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </BrandKitSection>
  );
}

// ─── Preview Components ──────────────────────────────────────────────────────

function LogosPreview({ settings }: { settings: Record<string, string> }) {
  const iconUrl = settings.companyIconUrl;
  const logoUrl = settings.companyLogoUrl;

  if (iconUrl || logoUrl) {
    return (
      <div className="flex items-center gap-4 px-6">
        {iconUrl && (
          <Image
            src={iconUrl}
            alt="Icon"
            width={48}
            height={48}
            className="rounded-lg object-contain"
          />
        )}
        {logoUrl && (
          <Image
            src={logoUrl}
            alt="Logo"
            width={100}
            height={48}
            className="object-contain max-h-12"
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 opacity-40">
      <div className="h-12 w-12 rounded-xl bg-violet-300 dark:bg-violet-700" />
      <div className="h-8 w-20 rounded-lg bg-violet-200 dark:bg-violet-800" />
    </div>
  );
}

function ColorsPreview({ settings }: { settings: Record<string, string> }) {
  const primary = settings.brandAccentColor || "#e22726";
  const secondary = settings.brandSecondaryColor || primary;
  const shades = generateShades(primary);
  const pick = [100, 300, 500, 700, 900];

  return (
    <div className="flex flex-col items-center gap-2 px-6">
      <div className="flex gap-1.5">
        {pick.map((s) => {
          const shade = shades.find((sh) => sh.shade === s);
          return (
            <div
              key={s}
              className="h-10 w-10 rounded-lg"
              style={{ backgroundColor: shade?.color || primary }}
            />
          );
        })}
      </div>
      <div className="flex gap-1.5">
        {[secondary, settings.brandSuccessColor || "#22c55e", settings.brandWarningColor || "#eab308", settings.brandErrorColor || "#ef4444"].map(
          (c, i) => (
            <div
              key={i}
              className="h-6 w-6 rounded-md"
              style={{ backgroundColor: c }}
            />
          )
        )}
      </div>
    </div>
  );
}

function FontsPreview({ settings }: { settings: Record<string, string> }) {
  let headingFont = "Inter";
  let bodyFont = "Nunito";

  if (settings.brandFontRoles) {
    try {
      const roles = JSON.parse(settings.brandFontRoles);
      if (roles.title?.family) headingFont = roles.title.family;
      if (roles.body?.family) bodyFont = roles.body.family;
    } catch {
      // use defaults
    }
  }

  return (
    <div className="flex flex-col items-center gap-1 px-6">
      <span
        className="text-2xl font-bold text-foreground/80"
        style={{ fontFamily: `"${headingFont}", sans-serif` }}
      >
        Aa
      </span>
      <span
        className="text-sm text-foreground/60"
        style={{ fontFamily: `"${bodyFont}", sans-serif` }}
      >
        {headingFont} / {bodyFont}
      </span>
      <div className="flex gap-2 mt-1">
        {["A", "B", "C", "a", "b", "c"].map((ch, i) => (
          <span
            key={i}
            className="text-lg text-foreground/30"
            style={{
              fontFamily: `"${i < 3 ? headingFont : bodyFont}", sans-serif`,
              fontWeight: i < 3 ? 700 : 400,
            }}
          >
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}

function BrandVoicePreview({ settings }: { settings: Record<string, string> }) {
  let tones: string[] = [];
  try {
    tones = JSON.parse(settings.brandVoiceTone || "[]");
  } catch {
    // empty
  }

  if (tones.length > 0) {
    return (
      <div className="flex flex-wrap gap-1.5 px-4 justify-center">
        {tones.slice(0, 4).map((t) => (
          <span
            key={t}
            className="px-2.5 py-1 rounded-full bg-rose-200/60 dark:bg-rose-800/40 text-xs font-medium text-rose-800 dark:text-rose-200"
          >
            {t}
          </span>
        ))}
        {tones.length > 4 && (
          <span className="px-2.5 py-1 rounded-full bg-rose-100/60 dark:bg-rose-900/40 text-xs text-rose-600 dark:text-rose-300">
            +{tones.length - 4}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 opacity-40">
      <span className="text-4xl text-rose-300 dark:text-rose-700 font-serif">
        &ldquo;&rdquo;
      </span>
    </div>
  );
}

function ButtonsPreview({ settings }: { settings: Record<string, string> }) {
  const radius = settings.brandButtonRadius || "8";
  const brandColor = settings.brandAccentColor || "#e22726";

  return (
    <div className="flex items-center gap-2 px-4">
      <div
        className="px-3 py-1.5 text-xs text-white"
        style={{
          backgroundColor: brandColor,
          borderRadius: `${radius}px`,
        }}
      >
        Primary
      </div>
      <div
        className="px-3 py-1.5 text-xs border border-current text-foreground/60"
        style={{ borderRadius: `${radius}px` }}
      >
        Outline
      </div>
      <div
        className="px-3 py-1.5 text-xs bg-muted text-foreground/60"
        style={{ borderRadius: `${radius}px` }}
      >
        Ghost
      </div>
    </div>
  );
}

function AppearancePreview({ settings }: { settings: Record<string, string> }) {
  const radius = settings.brandBorderRadius || "8";

  return (
    <div className="flex items-center gap-3 px-6">
      <div
        className="h-14 w-14 border-2 border-orange-300 dark:border-orange-700"
        style={{ borderRadius: `${radius}px` }}
      />
      <div
        className="h-14 w-24 border-2 border-orange-300 dark:border-orange-700"
        style={{ borderRadius: `${radius}px` }}
      />
      <div
        className="h-8 w-16 border-2 border-orange-200 dark:border-orange-800"
        style={{ borderRadius: `${radius}px` }}
      />
    </div>
  );
}
