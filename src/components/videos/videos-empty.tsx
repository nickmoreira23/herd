"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Video, Plus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/locale-context";
import { EmptyState } from "@/components/ui/empty-state";
import { VideoUploadModal } from "./video-upload-modal";

export function VideosEmpty() {
  const t = useT();
  const [showUpload, setShowUpload] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title={t("videos.list.title")}
          description={t("videos.list.description")}
          className="pl-0 pt-0"
          action={
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Plus className="mr-1 h-3 w-3" />
              {t("videos.list.upload_button")}
            </Button>
          }
        />

        {/* Empty state — fills remaining space */}
        <EmptyState
          icon={Video}
          iconColor="blue"
          title={t("videos.empty.title")}
          description={t("videos.empty.description")}
          action={{
            label: t("videos.empty.upload_first"),
            onClick: () => setShowUpload(true),
            icon: Upload,
          }}
        />
      </div>

      <VideoUploadModal
        open={showUpload}
        onOpenChange={setShowUpload}
        onComplete={() => router.refresh()}
      />
    </>
  );
}
