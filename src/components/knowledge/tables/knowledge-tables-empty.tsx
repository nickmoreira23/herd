"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Table2, Plus, Download } from "lucide-react";
import { KnowledgeCreateTableModal } from "./knowledge-create-table-modal";
import { AirtableImportModal } from "./airtable-import-modal";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/locale-context";
import { EmptyState } from "@/components/ui/empty-state";

interface KnowledgeTablesEmptyProps {
  airtableConnected?: boolean;
}

export function KnowledgeTablesEmpty({
  airtableConnected = false,
}: KnowledgeTablesEmptyProps) {
  const t = useT();
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title={t("knowledge.tables.empty.title")}
          description={t("knowledge.tables.empty.description")}
          className="pl-0 pt-0"
          action={
            <div className="flex items-center gap-2">
              {airtableConnected && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowImport(true)}
                >
                  <Download className="mr-1 h-3 w-3" />
                  {t("knowledge.tables.empty.import_airtable")}
                </Button>
              )}
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1 h-3 w-3" />
                {t("knowledge.tables.empty.create")}
              </Button>
            </div>
          }
        />

        {/* Empty state — fills remaining space */}
        <EmptyState
          icon={Table2}
          iconColor="emerald"
          title={t("knowledge.tables.empty.heading")}
          description={t("knowledge.tables.empty.body")}
          action={{
            label: t("knowledge.tables.empty.cta"),
            onClick: () => setShowCreate(true),
            icon: Table2,
          }}
        />
      </div>

      <KnowledgeCreateTableModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onComplete={() => router.refresh()}
      />

      <AirtableImportModal
        open={showImport}
        onOpenChange={setShowImport}
        onComplete={() => router.refresh()}
      />
    </>
  );
}
