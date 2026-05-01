"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Rss, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/locale-context";
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

        <div className="flex-1 flex flex-col items-center justify-center text-center rounded-xl border border-dashed bg-card">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-orange-500/10 mb-5">
            <Rss className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t("feeds.empty.title")}</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            {t("feeds.empty.description")}
          </p>
          <Button variant="outline" onClick={() => setShowAdd(true)}>
            <Rss className="mr-2 h-4 w-4" />
            {t("feeds.empty.add_first")}
          </Button>
        </div>
      </div>

      <AddFeedModal
        open={showAdd}
        onOpenChange={setShowAdd}
        onComplete={() => router.refresh()}
      />
    </>
  );
}
