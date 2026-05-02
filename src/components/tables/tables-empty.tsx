"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Table2, Plus, Download } from "lucide-react";
import { CreateTableModal } from "./create-table-modal";
import { AirtableImportModal } from "./airtable-import-modal";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/locale-context";

interface TablesEmptyProps {
  airtableConnected?: boolean;
}

export function TablesEmpty({
  airtableConnected = false,
}: TablesEmptyProps) {
  const t = useT();
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title={t("tables.list.title")}
          description={t("tables.list.description")}
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
                  {t("tables.list.import_from_airtable")}
                </Button>
              )}
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1 h-3 w-3" />
                {t("tables.list.create_table")}
              </Button>
            </div>
          }
        />

        {/* Empty state — fills remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center text-center rounded-xl border border-dashed bg-card">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-500/10 mb-5">
            <Table2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {t("tables.empty.title")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            {t("tables.empty.description")}
          </p>
          <Button variant="outline" onClick={() => setShowCreate(true)}>
            <Table2 className="mr-2 h-4 w-4" />
            {t("tables.empty.cta_create")}
          </Button>
        </div>
      </div>

      <CreateTableModal
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
