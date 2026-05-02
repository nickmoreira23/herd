export const HANDBOOK_CONFIG = {
  github: {
    owner: "nickmoreira23",
    repo: "herd",
    branch: "main",
  },
  handbookRoot: "docs/handbook",
} as const;

export function githubEditUrl(relativePath: string): string {
  const { owner, repo, branch } = HANDBOOK_CONFIG.github;
  return `https://github.com/${owner}/${repo}/edit/${branch}/${relativePath}`;
}

export function githubBlobUrl(relativePath: string): string {
  const { owner, repo, branch } = HANDBOOK_CONFIG.github;
  return `https://github.com/${owner}/${repo}/blob/${branch}/${relativePath}`;
}

export type HandbookLocale = "pt-BR" | "en-US";

import type { Locale as AdminLocale } from "@/lib/i18n/locales";

export function adminLocaleToHandbookLocale(locale: AdminLocale): HandbookLocale {
  return locale === "pt-BR" ? "pt-BR" : "en-US";
}
