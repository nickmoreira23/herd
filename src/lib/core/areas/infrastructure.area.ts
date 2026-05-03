import type { AreaManifest } from "../manifest";

export const infrastructureArea: AreaManifest = {
  kind: "area",
  name: "infrastructure",
  displayName: "Infrastructure",
  description:
    "Under-the-hood platform infrastructure. Tools that document, configure, or operate the platform itself — invisible to end users in normal flow.",
  icon: "Server",
  color: "#6b7280",
  sortOrder: 6,
};
