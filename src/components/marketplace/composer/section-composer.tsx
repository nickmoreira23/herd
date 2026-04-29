"use client";

import { ChevronUp, ChevronDown, Trash2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMarketplaceWizardStore } from "@/stores/marketplace-section-wizard-store";
import { ComponentAddPopover } from "./component-add-popover";
import { ComponentPreview } from "./component-preview";
import { PropertiesDrawer } from "./properties-drawer";
import { getMarketplaceComponent } from "@/lib/marketplace/component-registry";

/**
 * The Section composer used in wizard step 4. Renders a vertical list of
 * marketplace components with inline previews, an add button between each
 * pair, and a side drawer for properties.
 */
export function SectionComposer() {
  const components = useMarketplaceWizardStore((s) => s.components);
  const selectedId = useMarketplaceWizardStore((s) => s.selectedComponentId);
  const select = useMarketplaceWizardStore((s) => s.selectComponent);
  const move = useMarketplaceWizardStore((s) => s.moveComponent);
  const remove = useMarketplaceWizardStore((s) => s.removeComponent);
  const duplicate = useMarketplaceWizardStore((s) => s.duplicateComponent);
  const blockNames = useMarketplaceWizardStore((s) => s.selectedBlockNames);

  return (
    <div className="flex h-[640px] border rounded-xl overflow-hidden bg-card">
      {/* Canvas */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-2">
          {components.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed py-12 px-6 text-center space-y-3">
              <p className="text-sm font-medium">Empty canvas</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Add a banner, a categories strip, a curated collection, or just an items grid.
                You can stack as many as you want.
              </p>
              <ComponentAddPopover variant="button" index={0} />
            </div>
          ) : (
            <>
              <ComponentAddPopover index={0} />
              {components.map((c, i) => {
                const def = getMarketplaceComponent(c.type);
                const selected = c.id === selectedId;
                return (
                  <div key={c.id}>
                    <button
                      onClick={() => select(c.id)}
                      className={cn(
                        "block w-full text-left rounded-lg border bg-background p-3 transition-all",
                        selected
                          ? "border-[#C5F135] ring-2 ring-[#C5F135]/30"
                          : "border-border hover:border-foreground/20"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          {def?.label ?? c.type}
                        </p>
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              move(i, i - 1);
                            }}
                            disabled={i === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              move(i, i + 1);
                            }}
                            disabled={i === components.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicate(c.id);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(c.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <ComponentPreview component={c} />
                    </button>
                    <ComponentAddPopover index={i + 1} />
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Properties drawer */}
      <PropertiesDrawer blockNames={blockNames} />
    </div>
  );
}
