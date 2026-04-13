"use client";

import type { MessageChannelType } from "@prisma/client";
import {
  Mail,
  MessageSquare,
  Phone,
  Camera,
  ThumbsUp,
  Hash,
  Link2,
  Bot,
  Globe,
  Headphones,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CHANNEL_CONFIG: Record<
  string,
  { icon: LucideIcon; label: string; color: string }
> = {
  INTERNAL: { icon: Bot, label: "Internal", color: "#6366f1" },
  EMAIL: { icon: Mail, label: "Email", color: "#3b82f6" },
  SMS: { icon: Phone, label: "SMS", color: "#10b981" },
  WHATSAPP: { icon: MessageSquare, label: "WhatsApp", color: "#25D366" },
  INSTAGRAM: { icon: Camera, label: "Instagram", color: "#E4405F" },
  FACEBOOK: { icon: ThumbsUp, label: "Facebook", color: "#1877F2" },
  SLACK: { icon: Hash, label: "Slack", color: "#4A154B" },
  INTERCOM: { icon: Headphones, label: "Intercom", color: "#286EFA" },
  LINKEDIN: { icon: Link2, label: "LinkedIn", color: "#0A66C2" },
  X_TWITTER: { icon: Globe, label: "X", color: "#000000" },
  CUSTOM: { icon: Globe, label: "Custom", color: "#64748b" },
};

export function ChannelBadge({
  channelType,
  size = "sm",
}: {
  channelType: MessageChannelType;
  size?: "sm" | "md";
}) {
  const config = CHANNEL_CONFIG[channelType] || CHANNEL_CONFIG.CUSTOM;
  const Icon = config.icon;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${config.color}15`,
        color: config.color,
      }}
    >
      <Icon className={iconSize} />
      {config.label}
    </span>
  );
}

export function getChannelLabel(channelType: MessageChannelType): string {
  return CHANNEL_CONFIG[channelType]?.label || channelType;
}
