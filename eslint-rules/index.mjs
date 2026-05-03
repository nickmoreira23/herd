import noDirectPrismaOnScopedModels from "./no-direct-prisma-on-scoped-models.mjs";

export const tenancyPlugin = {
  meta: { name: "herd-tenancy" },
  rules: {
    "no-direct-prisma-on-scoped-models": noDirectPrismaOnScopedModels,
  },
};
