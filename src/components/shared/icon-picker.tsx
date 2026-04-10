"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import * as LucideIcons from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Upload, X } from "lucide-react";

// Curated icons organized by category for agent use
const ICON_CATEGORIES: Record<string, string[]> = {
  "AI & Tech": [
    "Bot", "Brain", "BrainCircuit", "BrainCog", "Cpu", "Sparkles", "Wand2",
    "Zap", "CircuitBoard", "Microchip", "Workflow", "GitBranch",
    "Binary", "Code", "Terminal", "Blocks", "Puzzle", "Lightbulb",
  ],
  "Health & Fitness": [
    "Heart", "HeartPulse", "Activity", "Dumbbell", "Timer",
    "Flame", "Trophy", "Target", "Footprints", "Bike",
    "PersonStanding", "Scaling", "Moon", "Sun", "Bed",
  ],
  "Food & Nutrition": [
    "UtensilsCrossed", "Apple", "Salad", "CookingPot", "Beef", "Egg",
    "Cherry", "Grape", "Carrot", "Wheat", "Coffee", "Wine",
    "GlassWater", "Milk", "Sandwich", "Pizza", "Soup", "IceCream",
  ],
  "Analytics & Data": [
    "BarChart3", "LineChart", "PieChart", "TrendingUp", "TrendingDown",
    "ChartArea", "ChartBar", "ChartPie",
    "Gauge", "Calculator", "Percent", "Hash",
  ],
  "Communication": [
    "MessageSquare", "MessageCircle", "Mail", "Phone", "Video",
    "Megaphone", "Bell", "Send", "AtSign", "Radio",
  ],
  "General": [
    "Star", "Shield", "Lock", "Key", "Eye", "Search", "Globe",
    "Map", "Compass", "Bookmark", "Flag", "Award", "Crown",
    "Gem", "Rocket", "Plane", "Car", "Building2",
    "Users", "UserCog", "Handshake", "BadgeCheck", "Fingerprint",
    "Palette", "Camera", "Image", "FileText", "BookOpen",
    "GraduationCap", "Microscope", "Stethoscope", "Pill",
    "ClipboardList", "ListChecks", "Calendar", "Clock",
  ],
};

// Flatten all curated icons for search
const ALL_CURATED_ICONS = Object.values(ICON_CATEGORIES).flat();

type LucideIconComponent = React.ComponentType<{ className?: string }>;

function getIconComponent(name: string): LucideIconComponent | null {
  const icon = (LucideIcons as Record<string, unknown>)[name];
  if (typeof icon === "function" || (typeof icon === "object" && icon !== null)) {
    return icon as LucideIconComponent;
  }
  return null;
}

export function DynamicIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const icons = LucideIcons as Record<string, unknown>;
  const IconComp = icons[name] as LucideIconComponent | undefined;
  if (!IconComp || typeof IconComp !== "function") return <LucideIcons.Bot className={className} />;
  const Resolved = IconComp;
  return <Resolved className={className} />;
}

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  iconUrl?: string | null;
  onUpload?: (file: File) => void;
  onRemoveUpload?: () => void;
}

export function IconPicker({
  value,
  onChange,
  iconUrl,
  onUpload,
  onRemoveUpload,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredIcons = useMemo(() => {
    if (search) {
      const q = search.toLowerCase();
      // Search through all lucide icon exports (base names only)
      const allNames = Object.keys(LucideIcons).filter(
        (k) =>
          k[0] === k[0].toUpperCase() &&
          !k.endsWith("Icon") &&
          k !== "default" &&
          !k.startsWith("create") &&
          typeof (LucideIcons as Record<string, unknown>)[k] !== "string"
      );
      return allNames
        .filter((name) => name.toLowerCase().includes(q))
        .slice(0, 60);
    }
    if (activeCategory) {
      return ICON_CATEGORIES[activeCategory] || [];
    }
    return ALL_CURATED_ICONS;
  }, [search, activeCategory]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onUpload) {
        onUpload(file);
        setOpen(false);
      }
    },
    [onUpload]
  );

  const categories = Object.keys(ICON_CATEGORIES);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="relative h-16 w-16 rounded-xl border-2 border-dashed border-border hover:border-foreground/30 bg-muted/30 flex items-center justify-center transition-colors group cursor-pointer"
          />
        }
      >
        {iconUrl ? (
          <Image
            src={iconUrl}
            alt="Agent icon"
            width={64}
            height={64}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          <DynamicIcon name={value} className="h-7 w-7 text-muted-foreground group-hover:text-foreground/70 transition-colors" />
        )}
        <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center">
          <LucideIcons.Pencil className="h-2.5 w-2.5 text-muted-foreground" />
        </span>
      </PopoverTrigger>

      <PopoverContent className="w-[380px] p-0" align="start">
        <div className="p-3 space-y-3">
          {/* Upload option */}
          {onUpload && (
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-foreground/30 cursor-pointer transition-colors text-sm text-muted-foreground hover:text-foreground">
                <Upload className="h-4 w-4" />
                <span>Upload custom image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              {iconUrl && onRemoveUpload && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRemoveUpload()}
                  title="Remove uploaded image"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search all icons..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value) setActiveCategory(null);
              }}
              className="pl-8 text-sm"
            />
          </div>

          {/* Category pills */}
          {!search && (
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                  !activeCategory
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Icon grid */}
        <ScrollArea className="h-[240px] px-3 pb-3">
          <div className="grid grid-cols-8 gap-1">
            {filteredIcons.map((name) => {
              const IconComp = getIconComponent(name);
              if (!IconComp) return null;
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                  className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${
                    value === name
                      ? "bg-foreground text-background"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <IconComp className="h-4 w-4" />
                </button>
              );
            })}
          </div>
          {filteredIcons.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">
              No icons found
            </p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
