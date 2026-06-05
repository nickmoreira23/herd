"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/locale-context";
import { EmptyState } from "@/components/ui/empty-state";
import { UploadModal } from "./upload-modal";

export function DocumentsEmpty() {
  const t = useT();
  const [showUpload, setShowUpload] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title={t("documents.list.title")}
          description={t("documents.list.description")}
          className="pl-0 pt-0"
          action={
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Plus className="mr-1 h-3 w-3" />
              {t("documents.list.upload_button")}
            </Button>
          }
        />

        {/* Empty state — fills remaining space */}
        <EmptyState
          icon={FileText}
          iconColor="blue"
          title={t("documents.empty.title")}
          description={t("documents.empty.description")}
          action={{
            label: t("documents.empty.upload_first"),
            onClick: () => setShowUpload(true),
            icon: Upload,
          }}
        />
      </div>

      <UploadModal
        open={showUpload}
        onOpenChange={setShowUpload}
        onComplete={() => router.refresh()}
      />
    </>
  );
}
