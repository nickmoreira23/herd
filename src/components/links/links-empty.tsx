"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Link2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/locale-context";
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
        <div className="flex-1 flex flex-col items-center justify-center text-center rounded-xl border border-dashed bg-card">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-orange-500/10 mb-5">
            <Link2 className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t("links.empty.title")}</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            {t("links.empty.description")}
          </p>
          <Button variant="outline" onClick={() => setShowAdd(true)}>
            <Link2 className="mr-2 h-4 w-4" />
            {t("links.empty.add_first")}
          </Button>
        </div>
      </div>

      <AddLinkModal
        open={showAdd}
        onOpenChange={setShowAdd}
        onComplete={() => router.refresh()}
      />
    </>
  );
}
