import type { Tool } from "../manifest";

export const ledgerTool: Tool = {
  kind: "tool",
  name: "ledger",
  displayName: "Ledger",
  description:
    "Double-entry accounting source of truth. Ledger Engine records journal entries from financial operations (payments, expenses, future subscriptions/payouts). UI provides audit access to entries, accounts, statements.",
  icon: "Receipt",
  color: "#0ea5e9",
  status: "active",
  hasSubRoutes: true,
  // No category — foundation tool, not a business discipline.
  area: "transaction",
  blocks: [],
  actions: [],
  paths: {
    page: "src/app/admin/ledger",
    components: "src/components/ledger",
  },
};
