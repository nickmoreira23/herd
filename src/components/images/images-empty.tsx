"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ImageIcon, Plus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/locale-context";
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
        <div className="flex-1 flex flex-col items-center justify-center text-center rounded-xl border border-dashed bg-card">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-purple-500/10 mb-5">
            <ImageIcon className="h-8 w-8 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t("images.empty.title")}</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            {t("images.empty.description")}
          </p>
          <Button variant="outline" onClick={() => setShowUpload(true)}>
            <Upload className="mr-2 h-4 w-4" />
            {t("images.empty.upload_first")}
          </Button>
        </div>
      </div>

      <ImageUploadModal
        open={showUpload}
        onOpenChange={setShowUpload}
        onComplete={() => router.refresh()}
      />
    </>
  );
}
