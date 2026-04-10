"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Video, Plus, Upload } from "lucide-react";
import { KnowledgeVideoUploadModal } from "./knowledge-video-upload-modal";
import { useRouter } from "next/navigation";

export function KnowledgeVideosEmpty() {
  const [showUpload, setShowUpload] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title="Videos"
          description="Video content transcribed with AI-powered speaker diarization for your knowledge base."
          className="pl-0 pt-0"
          action={
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Upload Video
            </Button>
          }
        />

        {/* Empty state — fills remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center text-center rounded-xl border border-dashed bg-card">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-500/10 mb-5">
            <Video className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Upload video content to be automatically transcribed with speaker diarization. Transcripts become searchable knowledge for your AI agents.
          </p>
          <Button variant="outline" onClick={() => setShowUpload(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload your first video
          </Button>
        </div>
      </div>

      <KnowledgeVideoUploadModal
        open={showUpload}
        onOpenChange={setShowUpload}
        onComplete={() => router.refresh()}
      />
    </>
  );
}
