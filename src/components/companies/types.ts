export type CompanySize = "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE";

export interface CompanyRow {
  id: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  website: string | null;
  domain: string | null;
  logoUrl: string | null;
  industry: string | null;
  size: CompanySize | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  twitterHandle: string | null;
  street: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  description: string | null;
  contentJson: unknown;
  contentText: string;
  ownerId: string | null;
  tags: string[];
  contactCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedContact {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  jobTitle: string | null;
}

export interface CompanyDetail extends CompanyRow {
  contacts?: LinkedContact[];
}

export const SIZE_CONFIG: Record<CompanySize, string> = {
  SMALL: "Pequena",
  MEDIUM: "Média",
  LARGE: "Grande",
  ENTERPRISE: "Enterprise",
};

export function formatAddress(c: Pick<CompanyRow, "street" | "street2" | "city" | "state" | "zip" | "country">): string {
  const parts = [c.street, c.street2, c.city, c.state, c.zip].filter(Boolean);
  if (c.country) parts.push(c.country);
  return parts.join(", ");
}

export function companyInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";
}
