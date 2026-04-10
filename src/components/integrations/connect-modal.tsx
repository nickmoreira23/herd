"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

// ─── Per-Integration Auth Configuration ────────────────────────

interface AuthExtraField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "password" | "email" | "select";
  options?: { value: string; label: string }[];
}

interface IntegrationAuthInfo {
  authType?: "token" | "oauth2";
  tokenLabel: string;
  tokenPlaceholder: string;
  instructions: string[];
  portalUrl: string;
  portalLabel: string;
  dataScopes: string[];
  extraFields?: AuthExtraField[];
}

const INTEGRATION_AUTH_INFO: Record<string, IntegrationAuthInfo> = {
  recharge: {
    tokenLabel: "API Token",
    tokenPlaceholder: "Paste your Recharge API token",
    instructions: [
      "Log in to your Recharge merchant dashboard",
      "Navigate to Settings → API tokens",
      "Create a new API token with read access",
      "Copy the token and paste it below",
    ],
    portalUrl: "https://rechargepayments.com/login",
    portalLabel: "Recharge Dashboard",
    dataScopes: ["Subscriptions", "Plans", "Customers", "Charges"],
  },
  stripe: {
    tokenLabel: "Secret Key",
    tokenPlaceholder: "Paste your Stripe secret key (sk_live_...)",
    instructions: [
      "Log in to your Stripe Dashboard",
      "Go to Developers → API keys",
      "Copy your Secret key (starts with sk_live_ or sk_test_)",
      "Paste it below to connect Stripe",
    ],
    portalUrl: "https://dashboard.stripe.com/apikeys",
    portalLabel: "Stripe API Keys",
    dataScopes: ["Payments", "Subscriptions", "Customers", "Invoices", "Payouts"],
  },
  hubspot: {
    tokenLabel: "Private App Token",
    tokenPlaceholder: "Paste your HubSpot private app token",
    instructions: [
      "Log in to your HubSpot account",
      "Go to Settings → Integrations → Private Apps",
      "Create a new private app with required scopes",
      "Copy the access token and paste it below",
    ],
    portalUrl: "https://app.hubspot.com/private-apps",
    portalLabel: "HubSpot Private Apps",
    dataScopes: ["Contacts", "Deals", "Companies", "Tickets", "Workflows"],
  },
  "google-analytics": {
    tokenLabel: "Service Account Key",
    tokenPlaceholder: "Paste your Google service account JSON key",
    instructions: [
      "Open the Google Cloud Console",
      "Navigate to IAM & Admin → Service Accounts",
      "Create a service account and grant it Viewer access to your GA property",
      "Generate a JSON key and paste it below",
    ],
    portalUrl: "https://console.cloud.google.com/iam-admin/serviceaccounts",
    portalLabel: "Google Cloud Console",
    dataScopes: ["Page Views", "Sessions", "Users", "Conversions", "Events"],
  },
  klaviyo: {
    tokenLabel: "Private API Key",
    tokenPlaceholder: "Paste your Klaviyo private API key",
    instructions: [
      "Log in to your Klaviyo account",
      "Go to Settings → API keys",
      "Create a new private API key with full access",
      "Copy the key and paste it below",
    ],
    portalUrl: "https://www.klaviyo.com/settings/account/api-keys",
    portalLabel: "Klaviyo API Keys",
    dataScopes: ["Campaigns", "Flows", "Lists", "Segments", "Metrics"],
  },
  slack: {
    authType: "oauth2",
    tokenLabel: "",
    tokenPlaceholder: "",
    instructions: [
      "Click the button below to authorize with Slack",
      "Sign in to your Slack workspace and grant access",
      "You will be redirected back automatically once authorized",
    ],
    portalUrl: "https://api.slack.com/apps",
    portalLabel: "Slack App Dashboard",
    dataScopes: [
      "Channels", "Messages", "Users", "Team Info", "Notifications",
    ],
  },
  airtable: {
    tokenLabel: "Personal Access Token",
    tokenPlaceholder: "Paste your Airtable personal access token",
    instructions: [
      "Log in to your Airtable account",
      "Go to airtable.com/create/tokens to create a Personal Access Token",
      "Grant it read access to the bases you want to import",
      "Copy the token and paste it below",
    ],
    portalUrl: "https://airtable.com/create/tokens",
    portalLabel: "Airtable Token Portal",
    dataScopes: ["Bases", "Tables", "Records", "Attachments"],
  },
  gorgias: {
    tokenLabel: "API Key",
    tokenPlaceholder: "Paste your Gorgias API key",
    instructions: [
      "Log in to your Gorgias helpdesk",
      "Go to Settings → REST API",
      "Note your subdomain (e.g. 'mystore' from mystore.gorgias.com)",
      "Copy the API base URL email and API key",
      "Enter all three fields below",
    ],
    portalUrl: "https://app.gorgias.com/app/settings/api",
    portalLabel: "Gorgias API Settings",
    dataScopes: [
      "Tickets", "Customers", "Tags", "Views", "Channels",
      "Teams", "Macros", "Rules", "Satisfaction Surveys", "Statistics",
    ],
    extraFields: [
      { key: "domain", label: "Gorgias Subdomain", placeholder: "e.g. mystore", type: "text" },
      { key: "email", label: "Account Email", placeholder: "you@company.com", type: "email" },
    ],
  },
  intercom: {
    tokenLabel: "Access Token",
    tokenPlaceholder: "Paste your Intercom access token",
    instructions: [
      "Log in to your Intercom workspace",
      "Go to Settings → Integrations → Developer Hub",
      "Create or select an app, then go to Authentication",
      "Copy the Access Token and paste it below",
    ],
    portalUrl: "https://app.intercom.com/a/apps/_/developer-hub",
    portalLabel: "Intercom Developer Hub",
    dataScopes: [
      "Conversations", "Contacts", "Admins", "Teams", "Tags",
      "Segments", "Help Center", "Data Attributes",
    ],
  },
  "google-calendar": {
    authType: "oauth2",
    tokenLabel: "",
    tokenPlaceholder: "",
    instructions: [
      "Click the button below to authorize with Google",
      "Sign in to your Google account and grant calendar access",
      "You will be redirected back automatically once authorized",
    ],
    portalUrl: "https://console.cloud.google.com/apis/credentials",
    portalLabel: "Google Cloud Console",
    dataScopes: [
      "Calendars", "Events", "Attendees", "Free/Busy", "Settings",
    ],
  },
  gmail: {
    authType: "oauth2",
    tokenLabel: "",
    tokenPlaceholder: "",
    instructions: [
      "Click the button below to authorize with Google",
      "Sign in to your Google account and grant Gmail access",
      "You will be redirected back automatically once authorized",
    ],
    portalUrl: "https://console.cloud.google.com/apis/credentials",
    portalLabel: "Google Cloud Console",
    dataScopes: [
      "Messages", "Threads", "Labels", "Drafts", "Send Email", "Profile",
    ],
  },
  "microsoft-outlook": {
    authType: "oauth2",
    tokenLabel: "",
    tokenPlaceholder: "",
    instructions: [
      "Click the button below to authorize with Microsoft",
      "Sign in to your Microsoft account and grant calendar access",
      "You will be redirected back automatically once authorized",
    ],
    portalUrl: "https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps",
    portalLabel: "Azure App Registrations",
    dataScopes: [
      "Calendars", "Events", "Attendees", "Schedule", "Free/Busy",
    ],
  },
  zoom: {
    authType: "oauth2",
    tokenLabel: "",
    tokenPlaceholder: "",
    instructions: [
      "Click the button below to authorize with Zoom",
      "Sign in to your Zoom account and grant meeting access",
      "You will be redirected back automatically once authorized",
    ],
    portalUrl: "https://marketplace.zoom.us/develop/create",
    portalLabel: "Zoom App Marketplace",
    dataScopes: [
      "Meetings", "Upcoming Meetings", "Participants", "Recordings", "User Profile",
    ],
  },
  "recall-ai": {
    tokenLabel: "API Key",
    tokenPlaceholder: "Paste your Recall.ai API key",
    instructions: [
      "Log in to your Recall.ai dashboard at recall.ai",
      "Navigate to Settings → API Keys",
      "Create a new API key or copy an existing one",
      "Paste the key below to connect",
    ],
    portalUrl: "https://api.recall.ai",
    portalLabel: "Recall.ai Dashboard",
    dataScopes: [
      "Meeting Bots", "Recordings", "Transcripts", "Bot Status",
    ],
  },
  plaud: {
    tokenLabel: "Bearer Token",
    tokenPlaceholder: "Paste your Plaud Bearer token",
    instructions: [
      "Log in to the Plaud web app at plaud.ai",
      "Open your browser's Developer Tools (F12)",
      "Go to Application → Local Storage → plaud.ai",
      "Find the access token value and copy it",
      "Select your data region and paste the token below",
    ],
    portalUrl: "https://plaud.ai",
    portalLabel: "Plaud Web App",
    dataScopes: [
      "Recordings", "Transcripts", "Summaries", "Mind Maps", "Action Items", "Tags",
    ],
    extraFields: [
      {
        key: "region",
        label: "Data Region",
        placeholder: "Select your region",
        type: "select",
        options: [
          { value: "us", label: "United States" },
          { value: "eu", label: "Europe" },
        ],
      },
    ],
  },
  asana: {
    tokenLabel: "Personal Access Token",
    tokenPlaceholder: "Paste your Asana Personal Access Token",
    instructions: [
      "Go to the Asana Developer Console",
      "Click 'Create new token' under Personal Access Tokens",
      "Give it a name and click 'Create token'",
      "Copy the token and paste it below",
    ],
    portalUrl: "https://app.asana.com/0/developer-console",
    portalLabel: "Asana Developer Console",
    dataScopes: ["Tasks", "Projects", "Workspaces", "Sections", "Assignees"],
  },
  trello: {
    tokenLabel: "API Token",
    tokenPlaceholder: "Paste your Trello API Token",
    instructions: [
      "Go to the Trello Power-Ups admin page",
      "Create a new Power-Up or use an existing one",
      "Copy the API Key from the Power-Up settings",
      "Generate a Token using the API Key",
      "Paste both your API Key and Token below",
    ],
    portalUrl: "https://trello.com/power-ups/admin",
    portalLabel: "Trello Power-Ups",
    dataScopes: ["Boards", "Lists", "Cards", "Members", "Labels"],
    extraFields: [
      {
        key: "apiKey",
        label: "API Key",
        placeholder: "Your Trello API Key",
      },
    ],
  },
  jira: {
    tokenLabel: "API Token",
    tokenPlaceholder: "Paste your Jira API Token",
    instructions: [
      "Go to your Atlassian account security settings",
      "Click 'Create API token'",
      "Give it a label and click 'Create'",
      "Copy the token and paste it below",
      "Also enter your Jira domain and email",
    ],
    portalUrl: "https://id.atlassian.com/manage-profile/security/api-tokens",
    portalLabel: "Atlassian API Tokens",
    dataScopes: ["Issues", "Projects", "Sprints", "Assignees", "Priorities", "Statuses"],
    extraFields: [
      {
        key: "domain",
        label: "Jira Domain",
        placeholder: "mycompany (from mycompany.atlassian.net)",
      },
      {
        key: "email",
        label: "Email",
        placeholder: "your-email@company.com",
        type: "email" as const,
      },
    ],
  },
  notion: {
    tokenLabel: "Internal Integration Token",
    tokenPlaceholder: "Paste your Notion integration token",
    instructions: [
      "Go to Notion Integrations page",
      "Click 'New integration'",
      "Give it a name, select a workspace, and click Submit",
      "Copy the Internal Integration Token",
      "Share the databases you want to import with this integration",
    ],
    portalUrl: "https://www.notion.so/my-integrations",
    portalLabel: "Notion Integrations",
    dataScopes: ["Databases", "Pages", "Properties"],
  },
  linear: {
    tokenLabel: "API Key",
    tokenPlaceholder: "Paste your Linear API Key",
    instructions: [
      "Go to Linear Settings",
      "Navigate to API section",
      "Click 'Create key'",
      "Copy the API key and paste it below",
    ],
    portalUrl: "https://linear.app/settings/api",
    portalLabel: "Linear API Settings",
    dataScopes: ["Issues", "Projects", "Teams", "Labels", "Cycles"],
  },
  monday: {
    tokenLabel: "API Token",
    tokenPlaceholder: "Paste your Monday.com API Token",
    instructions: [
      "Go to Monday.com",
      "Click your avatar → Developers",
      "Go to 'My Access Tokens'",
      "Copy your API token and paste it below",
    ],
    portalUrl: "https://monday.com",
    portalLabel: "Monday.com",
    dataScopes: ["Boards", "Items", "Columns", "Groups"],
  },
  clickup: {
    tokenLabel: "Personal API Token",
    tokenPlaceholder: "Paste your ClickUp API Token",
    instructions: [
      "Go to ClickUp Settings",
      "Navigate to Apps",
      "Find your API Token or generate one",
      "Copy the token and paste it below",
    ],
    portalUrl: "https://app.clickup.com/settings/apps",
    portalLabel: "ClickUp Apps",
    dataScopes: ["Workspaces", "Spaces", "Lists", "Tasks", "Assignees"],
  },
  attio: {
    tokenLabel: "API Key",
    tokenPlaceholder: "Paste your Attio API key",
    instructions: [
      "Log in to your Attio workspace",
      "Go to Settings → Developers → API Keys",
      "Create a new API key with Read & Write access",
      "Copy the key and paste it below",
    ],
    portalUrl: "https://app.attio.com/settings/developers",
    portalLabel: "Attio Developer Settings",
    dataScopes: ["People", "Companies", "Lists", "Notes", "Records", "Attributes"],
  },
  salesforce: {
    tokenLabel: "Access Token",
    tokenPlaceholder: "Paste your Salesforce access token",
    instructions: [
      "Log in to your Salesforce org",
      "Go to Setup → Apps → App Manager → create a Connected App",
      "Generate or retrieve your access token (via OAuth or session ID)",
      "Enter your Salesforce instance domain and token below",
    ],
    portalUrl: "https://login.salesforce.com",
    portalLabel: "Salesforce Login",
    dataScopes: ["Accounts", "Contacts", "Opportunities", "Leads", "Custom Objects"],
    extraFields: [
      {
        key: "domain",
        label: "Instance URL",
        placeholder: "mycompany.my.salesforce.com",
      },
    ],
  },
  "google-pagespeed": {
    tokenLabel: "API Key",
    tokenPlaceholder: "Paste your Google PageSpeed Insights API key",
    instructions: [
      "Go to the Google Cloud Console",
      "Enable the PageSpeed Insights API for your project",
      "Navigate to APIs & Services → Credentials",
      "Create an API Key and copy it below",
    ],
    portalUrl: "https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com",
    portalLabel: "Google Cloud Console",
    dataScopes: ["Performance Scores", "Core Web Vitals", "SEO Analysis", "Best Practices", "Opportunities"],
  },
  mixpanel: {
    tokenLabel: "Service Account Secret",
    tokenPlaceholder: "Paste your Mixpanel service account secret",
    instructions: [
      "Log in to your Mixpanel project",
      "Go to Settings → Organization Settings → Service Accounts",
      "Create a new service account",
      "Copy the Username, Secret, and your Project ID",
    ],
    portalUrl: "https://mixpanel.com/settings/org/service-accounts",
    portalLabel: "Mixpanel Service Accounts",
    dataScopes: ["Events", "Funnels", "Retention", "Users", "Cohorts"],
    extraFields: [
      {
        key: "serviceAccountUser",
        label: "Service Account Username",
        placeholder: "e.g. my-service-account.abc123.mp-service-account",
      },
      {
        key: "projectId",
        label: "Project ID",
        placeholder: "e.g. 1234567",
      },
    ],
  },
  instagram: {
    tokenLabel: "Access Token",
    tokenPlaceholder: "Paste your Instagram Graph API access token",
    instructions: [
      "Set up a Meta Developer App at developers.facebook.com",
      "Add the Instagram Graph API product",
      "Generate a long-lived access token for your Instagram Business account",
      "Copy the token and paste it below",
    ],
    portalUrl: "https://developers.facebook.com/apps",
    portalLabel: "Meta Developer Portal",
    dataScopes: ["Profile", "Media", "Insights", "Comments", "Followers"],
  },
  "x-twitter": {
    tokenLabel: "Bearer Token",
    tokenPlaceholder: "Paste your X (Twitter) Bearer token",
    instructions: [
      "Go to the X Developer Portal",
      "Create or select a project and app",
      "Navigate to Keys and Tokens",
      "Generate and copy the Bearer Token",
    ],
    portalUrl: "https://developer.x.com/en/portal/dashboard",
    portalLabel: "X Developer Portal",
    dataScopes: ["Profile", "Tweets", "Followers", "Following", "Metrics"],
  },
  facebook: {
    tokenLabel: "Page Access Token",
    tokenPlaceholder: "Paste your Facebook Page access token",
    instructions: [
      "Go to the Meta Developer Portal",
      "Open Graph API Explorer",
      "Select your app and generate a Page Access Token",
      "For long-lived tokens, exchange via the token debugger",
    ],
    portalUrl: "https://developers.facebook.com/tools/explorer",
    portalLabel: "Graph API Explorer",
    dataScopes: ["Pages", "Posts", "Insights", "Comments", "Followers"],
  },
  linkedin: {
    tokenLabel: "Access Token",
    tokenPlaceholder: "Paste your LinkedIn access token",
    instructions: [
      "Create a LinkedIn App at linkedin.com/developers",
      "Request the required API products (Sign In, Marketing, etc.)",
      "Generate an OAuth 2.0 access token",
      "Copy the token and paste it below",
    ],
    portalUrl: "https://www.linkedin.com/developers/apps",
    portalLabel: "LinkedIn Developer Portal",
    dataScopes: ["Profile", "Organizations", "Posts", "Analytics", "Connections"],
  },
  tiktok: {
    tokenLabel: "Access Token",
    tokenPlaceholder: "Paste your TikTok access token",
    instructions: [
      "Register at the TikTok for Developers portal",
      "Create an app and configure permissions",
      "Complete OAuth and obtain an access token",
      "Copy the token and paste it below",
    ],
    portalUrl: "https://developers.tiktok.com",
    portalLabel: "TikTok for Developers",
    dataScopes: ["Profile", "Videos", "Comments", "Followers", "Insights"],
  },
  youtube: {
    tokenLabel: "Access Token",
    tokenPlaceholder: "Paste your YouTube OAuth access token",
    instructions: [
      "Go to the Google Cloud Console",
      "Enable the YouTube Data API v3",
      "Create OAuth 2.0 credentials and obtain an access token",
      "Copy the token and paste it below",
    ],
    portalUrl: "https://console.cloud.google.com/apis/library/youtube.googleapis.com",
    portalLabel: "Google Cloud Console",
    dataScopes: ["Channels", "Videos", "Playlists", "Analytics", "Subscribers"],
  },
  pinterest: {
    tokenLabel: "Access Token",
    tokenPlaceholder: "Paste your Pinterest access token",
    instructions: [
      "Go to the Pinterest Developer Portal",
      "Create an app under your business account",
      "Generate an access token with the required scopes",
      "Copy the token and paste it below",
    ],
    portalUrl: "https://developers.pinterest.com/apps",
    portalLabel: "Pinterest Developer Portal",
    dataScopes: ["Profile", "Boards", "Pins", "Analytics", "Audiences"],
  },
  // AI Model Providers
  openai: {
    tokenLabel: "API Key",
    tokenPlaceholder: "Paste your OpenAI API key (sk-...)",
    instructions: [
      "Log in to the OpenAI Platform",
      "Navigate to API Keys in your account settings",
      "Click 'Create new secret key'",
      "Copy the key and paste it below",
    ],
    portalUrl: "https://platform.openai.com/api-keys",
    portalLabel: "OpenAI Platform",
    dataScopes: ["GPT-4o", "GPT-4", "GPT-3.5", "DALL-E", "Embeddings", "Whisper"],
  },
  anthropic: {
    tokenLabel: "API Key",
    tokenPlaceholder: "Paste your Anthropic API key (sk-ant-...)",
    instructions: [
      "Log in to the Anthropic Console",
      "Navigate to API Keys in Settings",
      "Click 'Create Key'",
      "Copy the key and paste it below",
    ],
    portalUrl: "https://console.anthropic.com/settings/keys",
    portalLabel: "Anthropic Console",
    dataScopes: ["Claude Opus", "Claude Sonnet", "Claude Haiku", "Embeddings"],
  },
  "grok-xai": {
    tokenLabel: "API Key",
    tokenPlaceholder: "Paste your xAI API key",
    instructions: [
      "Log in to the xAI Console",
      "Navigate to API Keys",
      "Create a new API key",
      "Copy the key and paste it below",
    ],
    portalUrl: "https://console.x.ai",
    portalLabel: "xAI Console",
    dataScopes: ["Grok-2", "Grok-1.5", "Text Generation", "Analysis"],
  },
  "meta-llama": {
    tokenLabel: "API Key",
    tokenPlaceholder: "Paste your Meta Llama API key",
    instructions: [
      "Visit the Meta AI developer portal",
      "Request API access for Llama models",
      "Once approved, generate an API key",
      "Copy the key and paste it below",
    ],
    portalUrl: "https://ai.meta.com/llama",
    portalLabel: "Meta AI Portal",
    dataScopes: ["Llama 3.1", "Llama 3", "Text Generation", "Code Generation"],
  },
  elevenlabs: {
    tokenLabel: "API Key",
    tokenPlaceholder: "Paste your ElevenLabs API key",
    instructions: [
      "Log in to your ElevenLabs account",
      "Click your profile icon and go to Profile + API key",
      "Copy your API key",
      "Paste it below to connect",
    ],
    portalUrl: "https://elevenlabs.io/app/settings/api-keys",
    portalLabel: "ElevenLabs Settings",
    dataScopes: ["Voices", "Text-to-Speech", "Voice Cloning", "Sound Effects", "Audio Isolation"],
  },
  "stability-ai": {
    tokenLabel: "API Key",
    tokenPlaceholder: "Paste your Stability AI API key",
    instructions: [
      "Log in to the Stability AI platform",
      "Go to Account → API Keys",
      "Create a new API key",
      "Copy the key and paste it below",
    ],
    portalUrl: "https://platform.stability.ai/account/keys",
    portalLabel: "Stability AI Platform",
    dataScopes: ["Stable Diffusion", "Image Generation", "Upscaling", "Image Editing", "Inpainting"],
  },
  runway: {
    tokenLabel: "API Key",
    tokenPlaceholder: "Paste your Runway API key",
    instructions: [
      "Log in to your Runway account",
      "Go to Settings → API Keys",
      "Create a new API key",
      "Copy the key and paste it below",
    ],
    portalUrl: "https://app.runwayml.com/settings/api-keys",
    portalLabel: "Runway Settings",
    dataScopes: ["Gen-4", "Gen-3 Alpha", "Video Generation", "Image-to-Video", "Motion Brush"],
  },
  replicate: {
    tokenLabel: "API Token",
    tokenPlaceholder: "Paste your Replicate API token",
    instructions: [
      "Log in to your Replicate account",
      "Go to Account Settings → API Tokens",
      "Copy your API token",
      "Paste it below to connect",
    ],
    portalUrl: "https://replicate.com/account/api-tokens",
    portalLabel: "Replicate Settings",
    dataScopes: ["Models", "Predictions", "Flux", "Whisper", "LLaMA", "Stable Diffusion"],
  },
  gamma: {
    tokenLabel: "API Key",
    tokenPlaceholder: "Paste your Gamma API key",
    instructions: [
      "Log in to your Gamma account at gamma.app",
      "Navigate to Settings → API",
      "Generate a new API key",
      "Copy the key and paste it below",
    ],
    portalUrl: "https://gamma.app/settings",
    portalLabel: "Gamma Dashboard",
    dataScopes: ["Presentations", "Documents", "AI Generation", "Templates", "Media"],
  },
  heygen: {
    tokenLabel: "API Key",
    tokenPlaceholder: "Paste your HeyGen API key",
    instructions: [
      "Log in to your HeyGen account",
      "Go to Settings → API from the left sidebar",
      "Copy your API key",
      "Paste it below to connect",
    ],
    portalUrl: "https://app.heygen.com/settings/api",
    portalLabel: "HeyGen Settings",
    dataScopes: ["V5 Avatars", "Video Generation", "Voices", "Templates", "Lip Sync", "Streaming"],
  },
};

// ─── Component ─────────────────────────────────────────────────

interface ConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationId: string;
  integrationName: string;
  integrationSlug: string;
  integrationLogoUrl?: string | null;
  onConnected: () => void;
}

export function ConnectModal({
  open,
  onOpenChange,
  integrationId,
  integrationName,
  integrationSlug,
  integrationLogoUrl,
  onConnected,
}: ConnectModalProps) {
  const [apiToken, setApiToken] = useState("");
  const [extraFieldValues, setExtraFieldValues] = useState<Record<string, string>>({});
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  const authInfo = INTEGRATION_AUTH_INFO[integrationSlug];
  const isOAuth = authInfo?.authType === "oauth2";

  const handleOAuth = async () => {
    setTesting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/integrations/oauth/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId }),
      });

      if (!res.ok) {
        const json = await res.json();
        setErrorMsg(json.error || "Failed to initiate authorization");
        setTestResult("error");
        return;
      }

      const { data } = await res.json();
      window.location.href = data.authorizeUrl;
    } catch {
      setErrorMsg("Network error. Please try again.");
      setTestResult("error");
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async () => {
    if (!apiToken.trim()) {
      toast.error("Please enter an API token");
      return;
    }

    // Validate extra fields are filled
    if (authInfo?.extraFields) {
      for (const field of authInfo.extraFields) {
        if (!extraFieldValues[field.key]?.trim()) {
          toast.error(`Please enter ${field.label}`);
          return;
        }
      }
    }

    setTesting(true);
    setTestResult("idle");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/integrations/${integrationId}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiToken, ...extraFieldValues }),
      });

      if (!res.ok) {
        const json = await res.json();
        setTestResult("error");
        setErrorMsg(json.error || "Connection failed");
        return;
      }

      setTestResult("success");
      toast.success(`${integrationName} connected successfully`);
      setTimeout(() => {
        onConnected();
        onOpenChange(false);
        resetState();
      }, 1000);
    } catch {
      setTestResult("error");
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setTesting(false);
    }
  };

  const resetState = () => {
    setApiToken("");
    setExtraFieldValues({});
    setShowToken(false);
    setTestResult("idle");
    setErrorMsg("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {integrationLogoUrl && (
              <img
                src={integrationLogoUrl}
                alt={integrationName}
                className="h-8 w-8 rounded-lg object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            Connect {integrationName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Instructions */}
          {authInfo && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">
                How to connect:
              </p>
              <ol className="space-y-1.5">
                {authInfo.instructions.map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-sm text-muted-foreground"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Portal link */}
          {authInfo && (
            <a
              href={authInfo.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-violet-500 hover:text-violet-600 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open {authInfo.portalLabel}
            </a>
          )}

          {/* Data scopes */}
          {authInfo && authInfo.dataScopes.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">
                Data that will be synced:
              </p>
              <div className="flex flex-wrap gap-1">
                {authInfo.dataScopes.map((scope) => (
                  <Badge
                    key={scope}
                    variant="outline"
                    className="text-[10px] bg-violet-500/5 text-violet-500 border-violet-500/20"
                  >
                    {scope}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {!isOAuth && (
            <>
              {/* Extra fields (e.g. Gorgias subdomain + email, Plaud region) */}
              {authInfo?.extraFields?.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={`extra-${field.key}`} className="text-sm">
                    {field.label}
                  </Label>
                  {field.type === "select" && field.options ? (
                    <Select
                      value={extraFieldValues[field.key] || ""}
                      onValueChange={(value) => {
                        setExtraFieldValues((prev) => ({ ...prev, [field.key]: value }));
                        if (testResult !== "idle") setTestResult("idle");
                        if (errorMsg) setErrorMsg("");
                      }}
                    >
                      <SelectTrigger id={`extra-${field.key}`}>
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`extra-${field.key}`}
                      type={field.type || "text"}
                      value={extraFieldValues[field.key] || ""}
                      onChange={(e) => {
                        setExtraFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }));
                        if (testResult !== "idle") setTestResult("idle");
                        if (errorMsg) setErrorMsg("");
                      }}
                      placeholder={field.placeholder}
                      autoComplete="off"
                    />
                  )}
                </div>
              ))}

              {/* Token input */}
              <div className="space-y-1.5">
                <Label htmlFor="api-token" className="text-sm">
                  {authInfo?.tokenLabel ?? "API Token"}
                </Label>
                <div className="relative">
                  <Input
                    id="api-token"
                    type={showToken ? "text" : "password"}
                    value={apiToken}
                    onChange={(e) => {
                      setApiToken(e.target.value);
                      if (testResult !== "idle") setTestResult("idle");
                      if (errorMsg) setErrorMsg("");
                    }}
                    placeholder={
                      authInfo?.tokenPlaceholder ?? "Enter your API access token"
                    }
                    className="pr-10"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Error */}
          {testResult === "error" && errorMsg && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-500/10 rounded-md px-3 py-2">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success */}
          {testResult === "success" && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-md px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Connection verified successfully!</span>
            </div>
          )}

          {/* Security note */}
          <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {isOAuth
                ? `You will be redirected to authorize securely. Your credentials are encrypted and only used to communicate with ${integrationName}.`
                : `Your token is encrypted and stored securely. It is only used to communicate with ${integrationName}.`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={testing}
            >
              Cancel
            </Button>
            {isOAuth ? (
              <Button onClick={handleOAuth} disabled={testing}>
                {testing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  `Authorize with ${integrationName}`
                )}
              </Button>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={testing || !apiToken.trim() || (authInfo?.extraFields?.some((f) => !extraFieldValues[f.key]?.trim()) ?? false)}
              >
                {testing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test & Connect"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
