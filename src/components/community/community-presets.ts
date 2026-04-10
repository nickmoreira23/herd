import type { CommunityFormState } from "./community-detail-client";

export interface CommunityPreset {
  name: string;
  icon: string;
  description: string;
  category: string;
  defaults: Partial<CommunityFormState>;
}

export const COMMUNITY_PRESETS: CommunityPreset[] = [
  // Online Communities
  {
    name: "Discord Server",
    icon: "MessageSquare",
    description: "Private Discord server for members to connect and chat.",
    category: "Online Communities",
    defaults: {
      name: "Discord Server",
      icon: "MessageSquare",
      description: "Private Discord server for members to connect and chat.",
      platform: "discord",
      tags: "community, chat, discord",
    },
  },
  {
    name: "Slack Workspace",
    icon: "Hash",
    description: "Dedicated Slack workspace for member collaboration.",
    category: "Online Communities",
    defaults: {
      name: "Slack Workspace",
      icon: "Hash",
      description: "Dedicated Slack workspace for member collaboration.",
      platform: "slack",
      tags: "community, chat, slack",
    },
  },
  {
    name: "Members Forum",
    icon: "MessagesSquare",
    description: "Exclusive online forum for members to discuss and share.",
    category: "Online Communities",
    defaults: {
      name: "Members Forum",
      icon: "MessagesSquare",
      description: "Exclusive online forum for members to discuss and share.",
      platform: "forum",
      tags: "community, forum, discussion",
    },
  },

  // Live Events
  {
    name: "Weekly Q&A Call",
    icon: "Video",
    description: "Live weekly Q&A session with experts via Zoom.",
    category: "Live Events",
    defaults: {
      name: "Weekly Q&A Call",
      icon: "Video",
      description: "Live weekly Q&A session with experts via Zoom.",
      platform: "zoom",
      tags: "live, qa, weekly, zoom",
    },
  },
  {
    name: "Monthly Webinar",
    icon: "Presentation",
    description: "Monthly educational webinar exclusive to members.",
    category: "Live Events",
    defaults: {
      name: "Monthly Webinar",
      icon: "Presentation",
      description: "Monthly educational webinar exclusive to members.",
      platform: "zoom",
      tags: "webinar, monthly, education",
    },
  },
  {
    name: "Live Coaching",
    icon: "Users",
    description: "Group coaching sessions with industry professionals.",
    category: "Live Events",
    defaults: {
      name: "Live Coaching",
      icon: "Users",
      description: "Group coaching sessions with industry professionals.",
      platform: "zoom",
      tags: "coaching, live, group",
    },
  },

  // In-Person
  {
    name: "Local Meetups",
    icon: "MapPin",
    description: "In-person meetups and networking events in your area.",
    category: "In-Person",
    defaults: {
      name: "Local Meetups",
      icon: "MapPin",
      description: "In-person meetups and networking events in your area.",
      platform: "in-person",
      tags: "meetup, networking, local",
    },
  },
  {
    name: "Annual Conference",
    icon: "CalendarDays",
    description: "Yearly conference with keynotes, workshops, and networking.",
    category: "In-Person",
    defaults: {
      name: "Annual Conference",
      icon: "CalendarDays",
      description: "Yearly conference with keynotes, workshops, and networking.",
      platform: "in-person",
      tags: "conference, annual, networking",
    },
  },
  {
    name: "VIP Retreats",
    icon: "Mountain",
    description: "Exclusive retreat experiences for top-tier members.",
    category: "In-Person",
    defaults: {
      name: "VIP Retreats",
      icon: "Mountain",
      description: "Exclusive retreat experiences for top-tier members.",
      platform: "in-person",
      tags: "retreat, vip, exclusive",
    },
  },

  // Content & Education
  {
    name: "Members-Only Content",
    icon: "BookOpen",
    description: "Exclusive articles, guides, and resources for members.",
    category: "Content & Education",
    defaults: {
      name: "Members-Only Content",
      icon: "BookOpen",
      description: "Exclusive articles, guides, and resources for members.",
      platform: "other",
      tags: "content, education, exclusive",
    },
  },
  {
    name: "Video Library",
    icon: "PlayCircle",
    description: "On-demand video tutorials and training content.",
    category: "Content & Education",
    defaults: {
      name: "Video Library",
      icon: "PlayCircle",
      description: "On-demand video tutorials and training content.",
      platform: "other",
      tags: "video, library, education",
    },
  },
  {
    name: "Resource Hub",
    icon: "FolderOpen",
    description: "Downloadable templates, tools, and resources.",
    category: "Content & Education",
    defaults: {
      name: "Resource Hub",
      icon: "FolderOpen",
      description: "Downloadable templates, tools, and resources.",
      platform: "other",
      tags: "resources, templates, tools",
    },
  },

  // Accountability & Support
  {
    name: "Accountability Groups",
    icon: "Target",
    description: "Small accountability groups to help reach your goals.",
    category: "Accountability & Support",
    defaults: {
      name: "Accountability Groups",
      icon: "Target",
      description: "Small accountability groups to help reach your goals.",
      platform: "other",
      tags: "accountability, groups, goals",
    },
  },
  {
    name: "Mentorship Program",
    icon: "GraduationCap",
    description: "One-on-one mentorship pairing with experienced members.",
    category: "Accountability & Support",
    defaults: {
      name: "Mentorship Program",
      icon: "GraduationCap",
      description: "One-on-one mentorship pairing with experienced members.",
      platform: "other",
      tags: "mentorship, pairing, growth",
    },
  },
];

export const COMMUNITY_CATEGORIES = [...new Set(COMMUNITY_PRESETS.map((p) => p.category))];
