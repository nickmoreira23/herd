import { RuleTester } from "eslint";
import rule from "../no-direct-prisma-on-scoped-models.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2023,
    sourceType: "module",
  },
});

ruleTester.run("no-direct-prisma-on-scoped-models", rule, {
  valid: [
    // Inside withTenant — OK
    {
      code: `withTenant(orgId, () => prisma.memberConnection.findMany());`,
    },
    {
      code: `withTenant(orgId, async () => { return prisma.integrationSyncLog.create({ data: {} }); });`,
    },
    // Inside withSessionTenant — OK
    {
      code: `withSessionTenant(session, () => prisma.integrationWebhookEvent.findMany());`,
    },
    // Non-scoped model — OK (Integration is plataforma-wide)
    {
      code: `prisma.integration.findMany();`,
    },
    {
      code: `prisma.networkProfile.findUnique({ where: { id } });`,
    },
    // Nested withTenant chains — OK
    {
      code: `withTenant(a, () => withTenant(b, () => prisma.memberConnection.findMany()));`,
    },
  ],
  invalid: [
    {
      code: `prisma.memberConnection.findMany();`,
      errors: [{ messageId: "missingContext", data: { model: "memberConnection" } }],
    },
    {
      code: `prisma.integrationTierMapping.create({ data: {} });`,
      errors: [{ messageId: "missingContext", data: { model: "integrationTierMapping" } }],
    },
    {
      code: `prisma.integrationWebhookEvent.findMany();`,
      errors: [{ messageId: "missingContext", data: { model: "integrationWebhookEvent" } }],
    },
    {
      code: `prisma.integrationSyncLog.create({ data: {} });`,
      errors: [{ messageId: "missingContext", data: { model: "integrationSyncLog" } }],
    },
    // Sibling call (not enclosing) doesn't count as wrapper
    {
      code: `withTenant(orgId, () => doSomething()); prisma.memberConnection.findMany();`,
      errors: [{ messageId: "missingContext", data: { model: "memberConnection" } }],
    },
  ],
});

console.log("All RuleTester cases passed.");
