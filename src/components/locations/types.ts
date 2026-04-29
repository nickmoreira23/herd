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
  { value: "headquarters", label: "Sede" },
  { value: "office", label: "Escritório" },
  { value: "store", label: "Loja" },
  { value: "warehouse", label: "Armazém" },
  { value: "other", label: "Outro" },
] as const;

export function formatAddress(loc: LocationRow): string {
  const parts = [loc.street, loc.street2, loc.city, loc.state, loc.zip].filter(
    Boolean
  );
  if (loc.country) parts.push(loc.country);
  return parts.join(", ");
}
