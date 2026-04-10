import type { ComponentRendererProps } from "../component-renderer";
import { componentStylesToCSS } from "../component-renderer";
import {
  Star,
  Heart,
  Check,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Globe,
  Shield,
  Zap,
  Users,
  Target,
  Award,
  TrendingUp,
  Clock,
  Calendar,
  MessageCircle,
  ThumbsUp,
  Sparkles,
  Rocket,
  Crown,
  Gift,
  Lightbulb,
  BarChart3,
  Lock,
  Eye,
  Play,
  Download,
  ExternalLink,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

// Curated map of commonly used icons — avoids bundling all 1000+ Lucide icons
export const ICON_MAP: Record<string, LucideIcon> = {
  star: Star,
  heart: Heart,
  check: Check,
  "arrow-right": ArrowRight,
  mail: Mail,
  phone: Phone,
  "map-pin": MapPin,
  globe: Globe,
  shield: Shield,
  zap: Zap,
  users: Users,
  target: Target,
  award: Award,
  "trending-up": TrendingUp,
  clock: Clock,
  calendar: Calendar,
  "message-circle": MessageCircle,
  "thumbs-up": ThumbsUp,
  sparkles: Sparkles,
  rocket: Rocket,
  crown: Crown,
  gift: Gift,
  lightbulb: Lightbulb,
  "bar-chart": BarChart3,
  lock: Lock,
  eye: Eye,
  play: Play,
  download: Download,
  "external-link": ExternalLink,
  "chevron-right": ChevronRight,
};

export function LpIcon({ node }: ComponentRendererProps) {
  const iconName = (node.props.name as string) || "star";
  const size = (node.props.size as number) || 24;
  const color = (node.props.color as string) || "currentColor";
  const style = componentStylesToCSS(node.styles);

  const IconComponent = ICON_MAP[iconName];

  if (!IconComponent) {
    return (
      <span style={{ ...style, display: "inline-flex" }}>
        <Star size={size} color={color} />
      </span>
    );
  }

  return (
    <span style={{ ...style, display: "inline-flex" }}>
      <IconComponent size={size} color={color} />
    </span>
  );
}
