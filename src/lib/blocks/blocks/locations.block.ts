import type { BlockManifest } from "../manifest";

export const locationsBlock: BlockManifest = {
  name: "locations",
  displayName: "Localizações",
  description:
    "Physical locations of the organization — headquarters, offices, stores, warehouses. Each location holds a structured address (street, city, state, zip, country), contact (phone, email), type, and a notes field. The `isHeadquarters` flag is unique: setting it on one location automatically clears it from all others. Locations are referenceable from other blocks (Organization profile today; Contacts, Events, Companies in future) via a foreign key on the consumer side.",
  domain: "operations",
  types: ["location"],
  capabilities: ["read", "create", "update", "delete"],
  models: ["Location"],
  dependencies: [],
  paths: {
    components: "src/components/locations/",
    pages: "src/app/admin/blocks/locations/",
    api: "src/app/api/locations/",
    validators: "src/lib/validators/locations.ts",
    provider: "src/lib/chat/providers/location.provider.ts",
  },
  actions: [
    {
      name: "list_locations",
      description:
        "List locations with optional filters by type, isActive, and keyword search across name/city/state/country/street",
      method: "GET",
      endpoint: "/api/locations",
      parametersSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["headquarters", "office", "store", "warehouse", "other"],
          },
          isActive: { type: "string", enum: ["true", "false"] },
          search: { type: "string" },
          limit: { type: "number" },
          offset: { type: "number" },
        },
      },
      responseDescription: "{ locations: Location[], total: number }",
    },
    {
      name: "get_location",
      description: "Get a single location by ID",
      method: "GET",
      endpoint: "/api/locations/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string", description: "Location UUID" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Single location record",
    },
    {
      name: "create_location",
      description:
        "Create a new location. Setting isHeadquarters=true automatically clears it from any existing headquarters.",
      method: "POST",
      endpoint: "/api/locations",
      parametersSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: {
            type: "string",
            enum: ["headquarters", "office", "store", "warehouse", "other"],
            description: "Default: office",
          },
          street: { type: "string" },
          street2: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          zip: { type: "string" },
          country: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          isHeadquarters: { type: "boolean" },
          notes: { type: "string" },
        },
        required: ["name"],
      },
      requiredFields: ["name"],
      responseDescription: "Created location record",
    },
    {
      name: "update_location",
      description:
        "Update an existing location. Setting isHeadquarters=true clears the flag from all other locations.",
      method: "PATCH",
      endpoint: "/api/locations/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          type: {
            type: "string",
            enum: ["headquarters", "office", "store", "warehouse", "other"],
          },
          street: { type: "string" },
          street2: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          zip: { type: "string" },
          country: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          isHeadquarters: { type: "boolean" },
          isActive: { type: "boolean" },
          notes: { type: "string" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated location record",
    },
    {
      name: "delete_location",
      description: "Delete a location permanently",
      method: "DELETE",
      endpoint: "/api/locations/{id}",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "{ deleted: true }",
    },
  ],
};
