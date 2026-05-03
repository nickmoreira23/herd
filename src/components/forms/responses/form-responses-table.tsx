"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { getFormResponseColumns } from "./form-response-columns";
import { FormResponseDetail } from "./form-response-detail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import type {
  FormResponseRow,
  FormSectionRow,
} from "../types";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import { pluralize } from "@/lib/i18n/pluralize";

interface FormResponsesTableProps {
  formId: string;
  formName: string;
  initialResponses: FormResponseRow[];
  sections: FormSectionRow[];
}

export function FormResponsesTable({
  formId,
  formName,
  initialResponses,
  sections,
}: FormResponsesTableProps) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const [responses, setResponses] =
    useState<FormResponseRow[]>(initialResponses);
  const [search, setSearch] = useState("");
  const [viewTarget, setViewTarget] = useState<FormResponseRow | null>(
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
    const res = await fetch(`/api/forms/${formId}/responses`);
    const json = await res.json();
    if (json.data) setResponses(json.data.responses);
  }, [formId]);

  const handleDelete = useCallback(
    async (response: FormResponseRow) => {
      const res = await fetch(
        `/api/forms/${formId}/responses/${response.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await refreshResponses();
        notifySuccess("forms.feedback.response_deleted", t);
      } else {
        notifyError("error.forms.response_delete_failed", t);
      }
    },
    [formId, refreshResponses, t]
  );

  const columns = useMemo(
    () =>
      getFormResponseColumns({
        onView: (r) => setViewTarget(r),
        onDelete: handleDelete,
        t,
        locale,
      }),
    [handleDelete, t, locale]
  );

  const totalDescription = pluralize(responses.length, locale, {
    one: t("forms.responses.description_one", { count: responses.length }),
    other: t("forms.responses.description_other", { count: responses.length }),
  });

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(`/admin/knowledge/forms/${formId}`)
            }
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            {t("forms.responses.back_to_form")}
          </Button>
        </div>

        <PageHeader
          title={t("forms.responses.title", { name: formName })}
          description={totalDescription}
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
                    placeholder={t("forms.responses.search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-20 h-8 text-xs w-full"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                    {t("forms.list.items_count", { count: filteredResponses.length })}
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
        locale={locale}
      />
    </>
  );
}
