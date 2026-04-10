import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export interface IntegrationOverviewProps {
  integrationId: string;
  integrationSlug: string;
  isConnected: boolean;
}

export const INTEGRATION_OVERVIEWS: Record<
  string,
  ComponentType<IntegrationOverviewProps>
> = {
  airtable: dynamic(() => import("./airtable-overview"), { ssr: false }),
  intercom: dynamic(() => import("./intercom-overview"), { ssr: false }),
  gorgias: dynamic(() => import("./gorgias-overview"), { ssr: false }),
  "google-calendar": dynamic(() => import("./google-calendar-overview"), { ssr: false }),
  gmail: dynamic(() => import("./gmail-overview"), { ssr: false }),
  plaud: dynamic(() => import("./plaud-overview"), { ssr: false }),
  "microsoft-outlook": dynamic(() => import("./microsoft-outlook-overview"), { ssr: false }),
  zoom: dynamic(() => import("./zoom-overview"), { ssr: false }),
  slack: dynamic(() => import("./slack-overview"), { ssr: false }),
  asana: dynamic(() => import("./asana-overview"), { ssr: false }),
  trello: dynamic(() => import("./trello-overview"), { ssr: false }),
  jira: dynamic(() => import("./jira-overview"), { ssr: false }),
  notion: dynamic(() => import("./notion-overview"), { ssr: false }),
  linear: dynamic(() => import("./linear-overview"), { ssr: false }),
  monday: dynamic(() => import("./monday-overview"), { ssr: false }),
  clickup: dynamic(() => import("./clickup-overview"), { ssr: false }),
  attio: dynamic(() => import("./attio-overview"), { ssr: false }),
  salesforce: dynamic(() => import("./salesforce-overview"), { ssr: false }),
  "google-pagespeed": dynamic(() => import("./google-pagespeed-overview"), { ssr: false }),
  mixpanel: dynamic(() => import("./mixpanel-overview"), { ssr: false }),
  instagram: dynamic(() => import("./instagram-overview"), { ssr: false }),
  "x-twitter": dynamic(() => import("./x-twitter-overview"), { ssr: false }),
  facebook: dynamic(() => import("./facebook-overview"), { ssr: false }),
  linkedin: dynamic(() => import("./linkedin-overview"), { ssr: false }),
  tiktok: dynamic(() => import("./tiktok-overview"), { ssr: false }),
  youtube: dynamic(() => import("./youtube-overview"), { ssr: false }),
  pinterest: dynamic(() => import("./pinterest-overview"), { ssr: false }),
  elevenlabs: dynamic(() => import("./elevenlabs-overview"), { ssr: false }),
  "stability-ai": dynamic(() => import("./stability-ai-overview"), { ssr: false }),
  runway: dynamic(() => import("./runway-overview"), { ssr: false }),
  replicate: dynamic(() => import("./replicate-overview"), { ssr: false }),
  gamma: dynamic(() => import("./gamma-overview"), { ssr: false }),
  heygen: dynamic(() => import("./heygen-overview"), { ssr: false }),
};
