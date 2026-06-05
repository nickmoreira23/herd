"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plug, Plus } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { EmptyState } from "@/components/ui/empty-state";

export function AppsEmpty() {
  const t = useT();
  return (
    <div className="flex flex-col min-h-full pt-2 pl-2">
      <PageHeader
        title={t("apps.list.title")}
        description={t("apps.list.description")}
        className="pl-0 pt-0"
        action={
          <Button size="sm" disabled>
            <Plus className="mr-1 h-3 w-3" />
            {t("apps.list.connect_app")}
          </Button>
        }
      />

      {/* Empty state — fills remaining space */}
      <EmptyState
        icon={Plug}
        iconColor="violet"
        title={t("apps.empty.title")}
        description={t("apps.empty.description")}
        action={{ label: t("apps.empty.cta"), icon: Plug, disabled: true }}
      />
    </div>
  );
}
