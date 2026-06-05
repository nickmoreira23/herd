"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Link2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/locale-context";
import { EmptyState } from "@/components/ui/empty-state";
import { AddLinkModal } from "./add-link-modal";

export function LinksEmpty() {
  const t = useT();
  const [showAdd, setShowAdd] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title={t("links.list.title")}
          description={t("links.list.description")}
          className="pl-0 pt-0"
          action={
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="mr-1 h-3 w-3" />
              {t("links.list.add_link_button")}
            </Button>
          }
        />

        {/* Empty state — fills remaining space */}
        <EmptyState
          icon={Link2}
          iconColor="orange"
          title={t("links.empty.title")}
          description={t("links.empty.description")}
          action={{
            label: t("links.empty.add_first"),
            onClick: () => setShowAdd(true),
            icon: Link2,
          }}
        />
      </div>

      <AddLinkModal
        open={showAdd}
        onOpenChange={setShowAdd}
        onComplete={() => router.refresh()}
      />
    </>
  );
}
