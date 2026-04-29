"use client";

import { Plus } from "lucide-react";
import {
  Image as ImageIcon,
  Tag,
  LayoutList,
  Grid3x3,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  listMarketplaceComponents,
  makeMarketplaceComponent,
  type MarketplaceComponentType,
} from "@/lib/marketplace/component-registry";
import { useMarketplaceWizardStore } from "@/stores/marketplace-section-wizard-store";

const ICON_MAP: Record<string, LucideIcon> = {
  Image: ImageIcon,
  Tag,
  LayoutList,
  Grid3x3,
};

interface Props {
  /** Insertion position in components[]. */
  index?: number;
  /** Trigger style: full-width "+" line or compact button. */
  variant?: "line" | "button";
}

export function ComponentAddPopover({ index, variant = "line" }: Props) {
  const addComponent = useMarketplaceWizardStore((s) => s.addComponent);
  const components = listMarketplaceComponents();

  const trigger =
    variant === "line" ? (
      <button className="group w-full flex items-center justify-center py-2 hover:bg-[#C5F135]/10 rounded-md transition-colors">
        <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground">
          <div className="h-px flex-1 bg-border group-hover:bg-[#C5F135]" />
          <Plus className="h-3.5 w-3.5" />
          Add component
          <div className="h-px flex-1 bg-border group-hover:bg-[#C5F135]" />
        </div>
      </button>
    ) : (
      <Button variant="outline" size="sm">
        <Plus className="h-4 w-4 mr-1" /> Add component
      </Button>
    );

  return (
    <Popover>
      <PopoverTrigger>{trigger}</PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="center">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 py-1.5">
          Marketplace components
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {components.map((c) => {
            const Icon = ICON_MAP[c.icon] ?? Plus;
            return (
              <button
                key={c.type}
                onClick={() => addComponent(makeMarketplaceComponent(c.type as MarketplaceComponentType), index)}
                className="flex flex-col items-start gap-1 rounded-md border p-3 text-left hover:bg-accent transition-colors"
              >
                <div className="h-7 w-7 rounded bg-muted flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs font-medium">{c.label}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">
                    {c.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
