export interface ContactRow {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  department: string | null;
  companyId: string | null;
  ownerId: string | null;
  source: string | null;
  street: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  birthday: string | null; // ISO
  linkedinUrl: string | null;
  twitterHandle: string | null;
  contentJson: unknown;
  contentText: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export function displayName(c: Pick<ContactRow, "firstName" | "lastName">): string {
  return `${c.firstName}${c.lastName ? " " + c.lastName : ""}`;
}

export function initials(c: Pick<ContactRow, "firstName" | "lastName">): string {
  const f = c.firstName?.[0] ?? "";
  const l = c.lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

export function formatAddress(c: ContactRow): string {
  const parts = [c.street, c.street2, c.city, c.state, c.zip].filter(Boolean);
  if (c.country) parts.push(c.country);
  return parts.join(", ");
}

export const TAG_SUGGESTIONS = ["lead", "prospect", "customer", "vip", "churned"];
