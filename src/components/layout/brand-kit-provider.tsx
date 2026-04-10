"use client";

import { useEffect, useRef } from "react";
import { generateShades } from "@/lib/brand-kit-settings";

function loadGoogleFont(family: string, weights: string[]) {
  if (typeof document === "undefined") return;
  const id = `gfont-${family.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const weightStr = weights.join(";");
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:ital,wght@0,${weightStr};1,${weightStr}&display=swap`;
  document.head.appendChild(link);
}

const SHADOW_MAP: Record<string, { card: string; modal: string }> = {
  none: { card: "none", modal: "none" },
  subtle: {
    card: "0 1px 2px rgba(0,0,0,0.05)",
    modal: "0 2px 4px rgba(0,0,0,0.05)",
  },
  medium: {
    card: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
    modal: "0 4px 12px rgba(0,0,0,0.1)",
  },
  strong: {
    card: "0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",
    modal: "0 10px 25px rgba(0,0,0,0.15)",
  },
};

const DENSITY_MAP: Record<string, string> = {
  compact: "0.75",
  comfortable: "1",
  spacious: "1.25",
};

const SPEED_MAP: Record<string, string> = {
  none: "0ms",
  fast: "100ms",
  normal: "200ms",
  slow: "400ms",
};

/**
 * Reads brand kit settings from the API and applies them as CSS custom properties
 * on the document root. This ensures brand colors, fonts, and tokens propagate
 * throughout the entire system.
 */
export function BrandKitProvider() {
  const cachedSettings = useRef<Record<string, string> | null>(null);

  useEffect(() => {
    function applyBrandKit(settings: Record<string, string>) {
      const root = document.documentElement;
      const isDark = root.classList.contains("dark");

      // ─── Colors ──────────────────────────────────────────────
      const accentColor = isDark
        ? settings.brandDarkPrimaryColor || settings.brandAccentColor
        : settings.brandAccentColor;

      if (accentColor) {
        root.style.setProperty("--color-brand", accentColor);
        const shades = generateShades(accentColor);
        for (const { shade, color } of shades) {
          root.style.setProperty(`--color-brand-${shade}`, color);
        }
      }

      const secondaryColor = isDark
        ? settings.brandDarkSecondaryColor || settings.brandSecondaryColor
        : settings.brandSecondaryColor;
      if (secondaryColor) {
        root.style.setProperty("--color-brand-secondary", secondaryColor);
      }

      if (settings.brandSuccessColor) {
        root.style.setProperty("--color-financial-positive", settings.brandSuccessColor);
      }
      if (settings.brandWarningColor) {
        root.style.setProperty("--color-financial-caution", settings.brandWarningColor);
      }
      if (settings.brandErrorColor) {
        root.style.setProperty("--color-financial-negative", settings.brandErrorColor);
      }

      // Dark mode background/surface overrides
      if (isDark) {
        if (settings.brandDarkBgColor) {
          root.style.setProperty("--background", settings.brandDarkBgColor);
        }
        if (settings.brandDarkSurfaceColor) {
          root.style.setProperty("--card", settings.brandDarkSurfaceColor);
        }
      }

      // ─── Fonts (per-role) ────────────────────────────────────
      if (settings.brandFontRoles) {
        try {
          const roles = JSON.parse(settings.brandFontRoles) as Record<
            string,
            { family: string; size: string; weight: string; italic: boolean }
          >;

          const families = new Set<string>();

          for (const [role, config] of Object.entries(roles)) {
            root.style.setProperty(`--font-${role}-family`, `"${config.family}", sans-serif`);
            root.style.setProperty(`--font-${role}-size`, `${config.size}px`);
            root.style.setProperty(`--font-${role}-weight`, config.weight);
            root.style.setProperty(`--font-${role}-style`, config.italic ? "italic" : "normal");
            families.add(config.family);
          }

          // Also set high-level font variables for backwards compatibility
          if (roles.title) {
            root.style.setProperty("--font-heading", `"${roles.title.family}", sans-serif`);
            root.style.setProperty("--font-heading-weight", roles.title.weight);
          }
          if (roles.body) {
            root.style.setProperty("--font-sans", `"${roles.body.family}", sans-serif`);
            root.style.setProperty("--font-body-weight", roles.body.weight);
          }

          // Load all unique Google Fonts
          for (const family of families) {
            loadGoogleFont(family, ["400", "500", "600", "700", "800"]);
          }
        } catch {
          // invalid JSON, skip
        }
      }

      // ─── Border Radius ───────────────────────────────────────
      if (settings.brandBorderRadius) {
        root.style.setProperty("--radius", `${settings.brandBorderRadius}px`);
      }

      // ─── Buttons ─────────────────────────────────────────────
      if (settings.brandButtonRadius) {
        root.style.setProperty("--btn-radius", `${settings.brandButtonRadius}px`);
      }
      if (settings.brandButtonFontWeight) {
        root.style.setProperty("--btn-font-weight", settings.brandButtonFontWeight);
      }
      if (settings.brandButtonTransform) {
        root.style.setProperty("--btn-text-transform", settings.brandButtonTransform);
      }

      // ─── Appearance ──────────────────────────────────────────
      if (settings.brandShadowIntensity) {
        const level = SHADOW_MAP[settings.brandShadowIntensity] || SHADOW_MAP.medium;
        root.style.setProperty("--shadow-card", level.card);
        root.style.setProperty("--shadow-modal", level.modal);
      }
      if (settings.brandContentDensity) {
        root.style.setProperty(
          "--density-factor",
          DENSITY_MAP[settings.brandContentDensity] || "1"
        );
      }
      if (settings.brandAnimationSpeed) {
        root.style.setProperty(
          "--transition-speed",
          SPEED_MAP[settings.brandAnimationSpeed] || "200ms"
        );
      }
    }

    function fetchAndApply() {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((json) => {
          if (json.data) {
            cachedSettings.current = json.data as Record<string, string>;
            applyBrandKit(cachedSettings.current);
          }
        })
        .catch(() => {});
    }

    // Initial fetch
    fetchAndApply();

    // Listen for live brand kit updates from section save buttons
    const handleBrandKitUpdate = () => fetchAndApply();
    window.addEventListener("brand-kit-updated", handleBrandKitUpdate);

    // Re-apply when dark mode toggles (uses cached settings to avoid extra fetch)
    const observer = new MutationObserver(() => {
      if (cachedSettings.current) {
        applyBrandKit(cachedSettings.current);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("brand-kit-updated", handleBrandKitUpdate);
      observer.disconnect();
    };
  }, []);

  return null;
}
