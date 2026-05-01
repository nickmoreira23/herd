import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // ============================================================
  // LEGACY LINT DEBT — see docs/discovery/HERD_DISCOVERY_REPORT.md
  // section 10, and the planned "Etapa 1.1.5 — Lint cleanup" task.
  //
  // These overrides downgrade rules that fail in pre-existing code
  // to `warn`, so CI can pass while the debt is visible and counted.
  //
  // New code (src/lib/money/**, src/lib/ledger/**, and anything else
  // not listed below) is NOT covered by these overrides and remains
  // strict. If you find yourself adding a path here, push back —
  // new code should not introduce lint regression.
  //
  // Last reviewed: 2026-04-29
  // ============================================================
  {
    files: [
      "src/app/api/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
      "src/hooks/**/*.{ts,tsx}",
      "src/lib/events/**/*.{ts,tsx}",
      "src/lib/import-export/**/*.{ts,tsx}",
      "src/lib/products/**/*.{ts,tsx}",
      "src/lib/prisma.ts",
      "prisma/seed.ts",
      "scripts/**/*.{ts,tsx}",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/refs": "warn",
      "react/no-unescaped-entities": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "prefer-const": "warn",
    },
  },

  // ============================================================
  // I18N STRICT PATHS — code in these paths must use t() / useT()
  // for any user-facing string. Literal JSX text is flagged as error.
  //
  // Adding a path here means committing to fully-internationalized
  // code from the start. New features that touch user-facing strings
  // should be added to this list.
  //
  // Ledger UI was internationalized in Etapa 1.5.4 and is now strict.
  // ============================================================
  // ============================================================
  // LEGACY FORMATTERS — barrar uso novo de utils.ts formatters.
  // Cravado em 1.5.6a-bis. Cada feature já migrada (Ledger, Commissions,
  // Financials, chrome) é proibida de importar formatCurrency/formatPercent/
  // formatNumber de @/lib/utils. Features ainda hardcoded ficam na ignore
  // list e migram nas suas próprias etapas. utils.ts legacy será deletado
  // em 1.5.7 Capstone.
  // ============================================================
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      // Features ainda hardcoded podem usar legacy temporariamente.
      "src/components/{knowledge,network,agents,tiers,products,packages,brands,brand-kit,perks,marketplace,operations,operation,deals,companies,contacts,meetings,tasks,events,services,campaigns,locations,apps,feeds,community,documents,videos,images,audios,tables,forms,notes,links,routines,experiences,integrations,blocks,tools,chat,feedbacks,settings,dashboard,sales,landing-page}/**/*.{ts,tsx}",
      "src/app/admin/{knowledge,network,agents,tiers,products,packages,brands,brand-kit,perks,marketplace,operations,operation,deals,companies,contacts,meetings,tasks,events,services,campaigns,locations,apps,feeds,community,documents,videos,images,audios,tables,forms,notes,links,routines,experiences,integrations,blocks,tools,chat,feedbacks,settings,sales}/**/*.{ts,tsx}",
      // Organization Phase B (network/departments/users/etc.) and brand-kit
      // are still on legacy formatters — re-include their paths.
      "src/components/brand-kit/**/*.{ts,tsx}",
      "src/components/organization/brand-kit-form.tsx",
      "src/components/organization/{user-columns,user-table,department-tree,department-detail,department-form,org-chart-canvas,network-map-canvas}.tsx",
      "src/app/admin/organization/brand-kit/**/*.{ts,tsx}",
      "src/app/admin/organization/{departments,users,org-chart,network-map,knowledge}/**/*.{ts,tsx}",
      "src/app/admin/page.tsx",
      "src/app/admin/finances/**/*.{ts,tsx}",
      // src/lib helpers and store and other shared infra still use legacy.
      "src/lib/services/**/*.{ts,tsx}",
      "src/lib/financial-engine.ts",
      "src/stores/**/*.{ts,tsx}",
      "src/lib/utils.ts",
    ],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [
          {
            name: "@/lib/utils",
            importNames: ["formatCurrency", "formatPercent", "formatNumber"],
            message: "Legacy formatters from utils.ts are deprecated. Use formatMoney from @/lib/money/format for currency, or formatNumber from @/lib/i18n/format-number for non-currency numbers. Both require locale: Locale as parameter.",
          },
        ],
      }],
    },
  },

  {
    files: [
      "src/lib/i18n/**/*.{ts,tsx}",
      "src/lib/ledger/**/*.{ts,tsx}",
      "src/components/ledger/**/*.{ts,tsx}",
      "src/app/admin/ledger/**/*.{ts,tsx}",
      // Phase 1.5.5 — admin shell.
      // sub-panel.tsx is INTENTIONALLY excluded: it contains specialized
      // sub-panels for features (Blocks, Knowledge, Network, Tools,
      // Marketplace) whose internal strings will be migrated together with
      // the feature in 1.5.6a-e. The framework parts (labelKey support,
      // collapse/expand titles) were migrated in 1.5.5.
      "src/components/layout/sidebar.tsx",
      "src/components/layout/breadcrumbs.tsx",
      "src/components/layout/sub-panel-expand-button.tsx",
      "src/components/layout/top-bar.tsx",
      "src/components/i18n/**/*.{ts,tsx}",
      "src/app/admin/not-found.tsx",
      // Phase 1.5.6a — brand-critical features
      "src/components/commissions/**/*.{ts,tsx}",
      "src/app/admin/commissions/**/*.{ts,tsx}",
      "src/components/financials/**/*.{ts,tsx}",
      "src/app/admin/financials/**/*.{ts,tsx}",
      // Phase 1.5.6b — Organization profile family (Phase A)
      "src/components/organization/profile-form.tsx",
      "src/components/organization/general-information-form.tsx",
      "src/components/organization/contact-information-form.tsx",
      "src/components/organization/locations-form.tsx",
      "src/components/organization/business-hours-form.tsx",
      "src/components/organization/regional-settings-form.tsx",
      "src/app/admin/organization/profile/**/*.{ts,tsx}",
      // Phase 1.5.6b — Phase C (partners + profile IDENTITY)
      "src/components/partners/**/*.{ts,tsx}",
      "src/app/admin/partners/**/*.{ts,tsx}",
      "src/components/profile/**/*.{ts,tsx}",
      "src/app/admin/profile/**/*.{ts,tsx}",
      // Phase 1.5.6b-bis — Network Foundation (sub-panel + manage + profile-types
      // + roles + permission matrix + profiles wizard + profile table). Promoters
      // (src/components/network/promoters/**) and admin/network pages migrate
      // separately in 1.5.6b-tris.
      "src/components/network/network-sub-panel.tsx",
      "src/components/network/manage-network-dialog.tsx",
      "src/components/network/profile-types/**/*.{ts,tsx}",
      "src/components/network/roles/**/*.{ts,tsx}",
      "src/components/network/profiles/**/*.{ts,tsx}",
      // Phase 1.5.6b-tris (Fase δ) — Promoters
      "src/components/network/promoters/**/*.{ts,tsx}",
      // integrations/error.tsx (and [id]/error.tsx) are INTENTIONALLY
      // excluded: per Etapa 1.5.5 decision (Opção 2), shell-generic
      // strings were extracted to shell.error.* but feature-specific
      // titles ("Integrations", "Failed to load integrations") stay
      // hardcoded until the integrations feature is migrated in 1.5.6.
    ],
    rules: {
      "react/jsx-no-literals": ["error", {
        noStrings: true,
        ignoreProps: true,
        allowedStrings: [
          " ", "·", "—", "/", "-", "…", "D", "C", "%", "$",
          ":", "(", ")", "ℹ", "→", "+", "*", "×", "v", "d =",
        ],
      }],
    },
  },
]);

export default eslintConfig;
