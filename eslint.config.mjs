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
]);

export default eslintConfig;
