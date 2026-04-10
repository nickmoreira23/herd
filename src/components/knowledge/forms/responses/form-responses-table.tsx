"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { getFormResponseColumns } from "./form-response-columns";
import { FormResponseDetail } from "./form-response-detail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import type {
  KnowledgeFormResponseRow,
  KnowledgeFormSectionRow,
} from "../types";

interface FormResponsesTableProps {
  formId: string;
  formName: string;
  initialResponses: KnowledgeFormResponseRow[];
  sections: KnowledgeFormSectionRow[];
}

export function FormResponsesTable({
  formId,
  formName,
  initialResponses,
  sections,
}: FormResponsesTableProps) {
  const router = useRouter();
  const [responses, setResponses] =
    useState<KnowledgeFormResponseRow[]>(initialResponses);
  const [search, setSearch] = useState("");
  const [viewTarget, setViewTarget] = useState<KnowledgeFormResponseRow | null>(
    null
  );

  const filteredResponses = useMemo(() => {
    if (!search) return responses;
    const q = search.toLowerCase();
    return responses.filter(
      (r) =>
        r.submitterName?.toLowerCase().includes(q) ||
        r.submitterEmail?.toLowerCase().includes(q)
    );
  }, [responses, search]);

  const refreshResponses = useCallback(async () => {
    const res = await fetch(`/api/knowledge/forms/${formId}/responses`);
    const json = await res.json();
    if (json.data) setResponses(json.data.responses);
  }, [formId]);

  const handleDelete = useCallback(
    async (response: KnowledgeFormResponseRow) => {
      const res = await fetch(
        `/api/knowledge/forms/${formId}/responses/${response.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await refreshResponses();
        toast.success("Response deleted");
      } else {
        toast.error("Failed to delete response");
      }
    },
    [formId, refreshResponses]
  );

  const columns = useMemo(
    () =>
      getFormResponseColumns({
        onView: (r) => setViewTarget(r),
        onDelete: handleDelete,
      }),
    [handleDelete]
  );

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(`/admin/organization/knowledge/forms/${formId}`)
            }
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to Form
          </Button>
        </div>

        <PageHeader
          title={`Responses — ${formName}`}
          description={`${responses.length} total response${responses.length !== 1 ? "s" : ""}`}
          className="pl-0 pt-0"
        />

        <div className="flex-1">
          <DataTable
            columns={columns}
            data={filteredResponses}
            toolbar={() => (
              <div className="flex items-center gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-20 h-8 text-xs w-full"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                    {filteredResponses.length} items
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <FormResponseDetail
        open={!!viewTarget}
        onOpenChange={(open) => {
          if (!open) setViewTarget(null);
        }}
        response={viewTarget}
        sections={sections}
      />
    </>
  );
}
