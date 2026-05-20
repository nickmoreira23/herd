import type { Tool } from "../manifest";

export const profileTool: Tool = {
  kind: "tool",
  name: "profile",
  displayName: "Profile",
  description:
    "Personal user profile — identity, avatar, preferences, locale, and account settings. The 'me as an individual' view.",
  icon: "User",
  color: "#06b6d4",
  status: "active",
  hasSubRoutes: false,
  area: "identity",
  blocks: [
    {
      blockName: "contacts",
      usage: "read-write",
      purpose: "Persist user's own NetworkProfile identity record",
    },
  ],
  actions: [],
  paths: {
    page: "src/app/admin/profile",
    components: "src/components/profile",
  },
};
