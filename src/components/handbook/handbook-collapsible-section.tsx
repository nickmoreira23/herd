"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";

interface Props {
  sectionId: string;
  title: string;
  /** Count of H3 children. Rendered as "(N)" only when N > 0. */
  h3Count: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function HandbookCollapsibleSection({
  sectionId,
  title,
  h3Count,
  open,
  onOpenChange,
  children,
}: Props) {
  void sectionId;
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="border-t border-border first:border-t-0"
    >
      <CollapsibleTrigger className="flex items-center w-full py-3 text-left group">
        <ChevronRight
          className={`h-4 w-4 mr-2 text-muted-foreground transition-transform ${
            open ? "rotate-90" : ""
          }`}
        />
        <h2 className="text-xl font-semibold text-foreground flex-1 m-0">
          {title}
        </h2>
        {h3Count > 0 && (
          <span className="text-sm text-muted-foreground font-mono ml-2">
            ({h3Count})
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pb-6">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
