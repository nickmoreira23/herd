import type { BlockManifest } from "../manifest";

export const partnersBlock: BlockManifest = {
  name: "partners",
  displayName: "Partner Brands",
  description:
    "Partner brand management — manages affiliate and partner brands that offer discounts or kickbacks to members. Tracks commission rates, affiliate links, discount descriptions, and tier-level access. Supports CRUD, bulk operations, status transitions, tier assignments, and import/export.",
  domain: "foundation",
  types: ["partner_brand"],
  capabilities: ["read", "create", "update", "delete", "bulk", "import", "export"],
  models: ["PartnerBrand", "PartnerBrandTierAssignment"],
  dependencies: ["tiers"],
  paths: {
    components: "src/components/brands/",
    pages: "src/app/admin/blocks/partners/",
    api: "src/app/api/partners/",
    validators: "src/lib/validators/partner.ts",
    provider: "src/lib/chat/providers/partner.provider.ts",
  },
  actions: [
    {
      name: "list_partners",
      description:
        "List partner brands with optional filters for search, category, status, network, benefit type, and tier access level",
      method: "GET",
      endpoint: "/api/partners",
      parametersSchema: {
        type: "object",
        properties: {
          search: { type: "string" },
          category: { type: "string" },
          status: { type: "string" },
          network: { type: "string" },
          benefitType: { type: "string" },
          tierAccess: { type: "string" },
        },
      },
      responseDescription: "Array of partner brand objects with tier assignments",
    },
    {
      name: "create_partner",
      description: "Create a new partner brand",
      method: "POST",
      endpoint: "/api/partners",
      parametersSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          key: { type: "string", description: "Unique snake_case identifier" },
          kickbackType: { type: "string", description: "Type of kickback" },
          category: { type: "string" },
          logoUrl: { type: "string" },
          discountDescription: { type: "string" },
          websiteUrl: { type: "string" },
          description: { type: "string" },
          commissionRate: { type: "number" },
          commissionType: { type: "string" },
          status: { type: "string" },
        },
        required: ["name", "key", "kickbackType", "category"],
      },
      requiredFields: ["name", "key", "kickbackType", "category"],
      responseDescription: "Created partner brand object",
    },
    {
      name: "update_partner",
      description: "Update an existing partner brand by ID",
      method: "PATCH",
      endpoint: "/api/partners/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Partner brand UUID" },
          name: { type: "string" },
          description: { type: "string" },
          discountDescription: { type: "string" },
          commissionRate: { type: "number" },
          status: { type: "string" },
          isActive: { type: "boolean" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated partner brand object",
    },
    {
      name: "delete_partner",
      description:
        "Delete a partner brand by ID. Confirm with user first.",
      method: "DELETE",
      endpoint: "/api/partners/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Partner brand UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
  ],
};
