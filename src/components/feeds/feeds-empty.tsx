"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Rss, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/locale-context";
import { EmptyState } from "@/components/ui/empty-state";
import { AddFeedModal } from "./add-feed-modal";

export function FeedsEmpty() {
  const t = useT();
  const [showAdd, setShowAdd] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title={t("feeds.list.title")}
          description={t("feeds.list.description")}
          className="pl-0 pt-0"
          action={
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="mr-1 h-3 w-3" />
              {t("feeds.list.add_feed_button")}
            </Button>
          }
        />

        <EmptyState
          icon={Rss}
          iconColor="orange"
          title={t("feeds.empty.title")}
          description={t("feeds.empty.description")}
          action={{
            label: t("feeds.empty.add_first"),
            onClick: () => setShowAdd(true),
            icon: Rss,
          }}
        />
      </div>

      <AddFeedModal
        open={showAdd}
        onOpenChange={setShowAdd}
        onComplete={() => router.refresh()}
      />
    </>
  );
}
