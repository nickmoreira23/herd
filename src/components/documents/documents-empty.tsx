"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Upload } from "lucide-react";
import { UploadModal } from "./upload-modal";
import { useRouter } from "next/navigation";

export function DocumentsEmpty() {
  const [showUpload, setShowUpload] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title="Documents"
          description="Guides, policies, SOPs, and reference materials for your team and partners."
          className="pl-0 pt-0"
          action={
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Upload Document
            </Button>
          }
        />

        {/* Empty state — fills remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center text-center rounded-xl border border-dashed bg-card">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-500/10 mb-5">
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Upload guides, policies, SOPs, and other reference materials. Documents
            will be available to your team and can be shared with partners.
          </p>
          <Button variant="outline" onClick={() => setShowUpload(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload your first document
          </Button>
        </div>
      </div>

      <UploadModal
        open={showUpload}
        onOpenChange={setShowUpload}
        onComplete={() => router.refresh()}
      />
    </>
  );
}
