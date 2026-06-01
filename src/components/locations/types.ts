import type { MessageKey } from "@/lib/i18n/t";

export interface LocationRow {
  id: string;
  name: string;
  type: string;
  street: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  isHeadquarters: boolean;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const LOCATION_TYPE_OPTIONS = [
  { value: "headquarters", labelKey: "organization.locations.type.headquarters" },
  { value: "office", labelKey: "organization.locations.type.office" },
  { value: "store", labelKey: "organization.locations.type.store" },
  { value: "warehouse", labelKey: "organization.locations.type.warehouse" },
  { value: "other", labelKey: "organization.locations.type.other" },
] as const satisfies readonly { value: string; labelKey: MessageKey }[];

export const LOCATION_TYPE_KEY_BY_VALUE: Record<string, MessageKey> =
  Object.fromEntries(LOCATION_TYPE_OPTIONS.map((o) => [o.value, o.labelKey]));

export function formatAddress(loc: LocationRow): string {
  const parts = [loc.street, loc.street2, loc.city, loc.state, loc.zip].filter(
    Boolean
  );
  if (loc.country) parts.push(loc.country);
  return parts.join(", ");
}
