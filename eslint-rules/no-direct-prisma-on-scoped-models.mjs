// Custom ESLint rule: prevent direct prisma queries on tenant-scoped models
// outside withTenant / withSessionTenant context.
//
// Limitation (intentional): static AST walk only. If the prisma call lives in
// a helper function called from inside withTenant, this rule cannot prove the
// chain. Add an inline disable with a comment explaining the helper guarantee.

const SCOPED_MODELS = new Set([
  "memberConnection",
  "integrationTierMapping",
  "integrationWebhookEvent",
  "integrationSyncLog",
  // Sub-etapa 9 — Payment Provider Layer
  "paymentProvider",
  "billingCustomer",
  "paymentMethod",
  "subscription",
  "charge",
  "chargeLineItem",
  "invoice",
  "refund",
  "dunningAttempt",
  "portalSession",
  "billingEvent",
  // Sub-etapa 19 — Org Structure
  "department",
  "location",
]);

const TENANT_WRAPPERS = new Set(["withTenant", "withSessionTenant"]);

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent direct prisma queries on tenant-scoped models without withTenant context",
    },
    messages: {
      missingContext:
        "Direct call to prisma.{{model}} on tenant-scoped model. Wrap in withTenant(orgId, () => ...) or use withSessionTenant.",
    },
    schema: [],
  },
  create(context) {
    return {
      MemberExpression(node) {
        // Match: prisma.{scopedModel}.X
        if (
          node.object?.type !== "MemberExpression" ||
          node.object.object?.type !== "Identifier" ||
          node.object.object.name !== "prisma" ||
          node.object.property?.type !== "Identifier" ||
          !SCOPED_MODELS.has(node.object.property.name)
        ) {
          return;
        }

        // Walk up the AST looking for an enclosing withTenant/withSessionTenant call.
        let parent = node.parent;
        while (parent) {
          if (
            parent.type === "CallExpression" &&
            parent.callee?.type === "Identifier" &&
            TENANT_WRAPPERS.has(parent.callee.name)
          ) {
            return; // OK — inside tenant context
          }
          parent = parent.parent;
        }

        context.report({
          node,
          messageId: "missingContext",
          data: { model: node.object.property.name },
        });
      },
    };
  },
};
