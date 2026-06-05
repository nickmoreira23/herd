"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ImageIcon, Plus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/locale-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageUploadModal } from "./image-upload-modal";

export function ImagesEmpty() {
  const t = useT();
  const [showUpload, setShowUpload] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title={t("images.list.title")}
          description={t("images.list.description")}
          className="pl-0 pt-0"
          action={
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Plus className="mr-1 h-3 w-3" />
              {t("images.list.upload_button")}
            </Button>
          }
        />

        {/* Empty state — fills remaining space */}
        <EmptyState
          icon={ImageIcon}
          iconColor="purple"
          title={t("images.empty.title")}
          description={t("images.empty.description")}
          action={{
            label: t("images.empty.upload_first"),
            onClick: () => setShowUpload(true),
            icon: Upload,
          }}
        />
      </div>

      <ImageUploadModal
        open={showUpload}
        onOpenChange={setShowUpload}
        onComplete={() => router.refresh()}
      />
    </>
  );
}
