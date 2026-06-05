"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Music, Plus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/locale-context";
import { EmptyState } from "@/components/ui/empty-state";
import { AudioUploadModal } from "./audio-upload-modal";

export function AudiosEmpty() {
  const t = useT();
  const [showUpload, setShowUpload] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title={t("audios.list.title")}
          description={t("audios.list.description")}
          className="pl-0 pt-0"
          action={
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Plus className="mr-1 h-3 w-3" />
              {t("audios.list.upload_button")}
            </Button>
          }
        />

        {/* Empty state — fills remaining space */}
        <EmptyState
          icon={Music}
          iconColor="violet"
          title={t("audios.empty.title")}
          description={t("audios.empty.description")}
          action={{
            label: t("audios.empty.upload_first"),
            onClick: () => setShowUpload(true),
            icon: Upload,
          }}
        />
      </div>

      <AudioUploadModal
        open={showUpload}
        onOpenChange={setShowUpload}
        onComplete={() => router.refresh()}
      />
    </>
  );
}
