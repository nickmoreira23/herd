export type ProfileView = "member" | "reseller" | "organization" | "orchestrator";

export const PROFILE_VIEWS: ProfileView[] = [
  "member",
  "reseller",
  "organization",
  "orchestrator",
];

export const PROFILE_VIEW_LABELS: Record<ProfileView, string> = {
  member: "Member",
  reseller: "Reseller",
  organization: "Organization",
  orchestrator: "Orchestrator",
};

export const DEFAULT_PROFILE_VIEW: ProfileView = "orchestrator";
