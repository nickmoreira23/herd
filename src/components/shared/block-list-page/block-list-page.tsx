"use client";

import { useState, useEffect, useMemo } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { BlockAgentPanel } from "@/components/shared/block-agent-panel";
import {
  GLOBAL_BLOCK_SETTINGS_KEY,
  blockSettingsKey,
  resolveBlockSettings,
  parseBlockSettings,
  type BlockPageSettings,
} from "@/lib/blocks/block-settings";
import { BlockListToolbar } from "./block-list-toolbar";
import { BlockListEmpty } from "./block-list-empty";
import { BlockPageSettingsDialog } from "@/components/blocks/block-page-settings-dialog";
import type { BlockListPageConfig } from "./types";

export function BlockListPage<TData>(config: BlockListPageConfig<TData>) {
  // ── Settings ──────────────────────────────────────────────────────
  const [globalSettings, setGlobalSettings] =
    useState<Partial<BlockPageSettings> | null>(null);
  const [blockOverrides, setBlockOverrides] =
    useState<Partial<BlockPageSettings> | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setGlobalSettings(
            parseBlockSettings(json.data[GLOBAL_BLOCK_SETTINGS_KEY]),
          );
          setBlockOverrides(
            parseBlockSettings(json.data[blockSettingsKey(config.blockName)]),
          );
        }
      })
      .catch(() => {});
  }, [config.blockName]);

  const settings = resolveBlockSettings(globalSettings, blockOverrides);

  // ── View modes ────────────────────────────────────────────────────
  const allSupportedTypes = [
    "list",
    ...(config.additionalViews?.map((v) => v.type) ?? []),
  ];
  const activeViewTypes = allSupportedTypes.filter((t) =>
    settings.enabledViews.includes(t),
  );
  // Ensure at least one view
  if (activeViewTypes.length === 0) activeViewTypes.push("list");

  const [viewMode, setViewMode] = useState(settings.defaultView ?? "list");

  // Update view mode when settings change and current is no longer available
  useEffect(() => {
    if (!activeViewTypes.includes(viewMode)) {
      setViewMode(activeViewTypes[0]);
    }
  }, [activeViewTypes.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Search + Filters ──────────────────────────────────────────────
  const [internalSearch, setInternalSearch] = useState("");
  const search = config.search ?? internalSearch;
  const handleSearchChange = config.onSearchChange ?? setInternalSearch;
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const filteredData = useMemo(() => {
    let result = config.data;

    // Apply search
    if (search && config.searchFn) {
      const q = search.toLowerCase();
      result = result.filter((item) => config.searchFn!(item, q));
    }

    // Apply filters
    for (const filter of config.filters ?? []) {
      const val = filterValues[filter.key];
      if (val && val !== "all") {
        if (filter.filterFn) {
          result = result.filter((item) => filter.filterFn!(item, val));
        } else {
          result = result.filter(
            (item) =>
              String((item as Record<string, unknown>)[filter.key]) === val,
          );
        }
      }
    }

    return result;
  }, [config.data, search, filterValues, config.searchFn, config.filters]);

  // ── Bulk actions toolbar ──────────────────────────────────────────
  const bulkToolbar =
    settings.enableBulkActions &&
    config.bulkActions &&
    config.bulkActions.length > 0
      ? (table: ReturnType<typeof import("@tanstack/react-table").useReactTable<TData>>) => {
          const selectedRows = table.getFilteredSelectedRowModel().rows;
          if (selectedRows.length === 0) return null;
          const selectedIds = selectedRows.map((r) =>
            config.getId(r.original),
          );
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedRows.length} selected
              </span>
              {config.bulkActions!.map((action) => (
                <Button
                  key={action.key}
                  variant={action.variant ?? "default"}
                  size="sm"
                  onClick={async () => {
                    await action.handler(selectedIds);
                    table.toggleAllRowsSelected(false);
                  }}
                >
                  {action.icon && (
                    <action.icon className="h-4 w-4 mr-1.5" />
                  )}
                  {action.label}
                </Button>
              ))}
            </div>
          );
        }
      : undefined;

  // ── Header actions ────────────────────────────────────────────────
  const headerAction = (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSettingsDialogOpen(true)}
        title={`${config.title} Settings`}
      >
        <Settings2 className="h-4 w-4" />
      </Button>
      {config.headerActions}
    </>
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-full flex-col pb-4">
      {/* Header */}
      <PageHeader
        title={config.title}
        description={config.description}
        action={headerAction}
      />

      {/* Toolbar */}
      <BlockListToolbar
        views={activeViewTypes}
        activeView={viewMode}
        onViewChange={setViewMode}
        filters={config.filters}
        filterValues={filterValues}
        onFilterChange={(key, val) =>
          setFilterValues((prev) => ({ ...prev, [key]: val }))
        }
        extras={config.toolbarExtras}
        search={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={config.searchPlaceholder}
        showSearch={settings.showSearch}
        resultCount={filteredData.length}
        totalCount={config.data.length}
      />

      {/* After toolbar slot */}
      {config.afterToolbar}

      {/* Content */}
      <div className="flex flex-1 flex-col px-4">
        {filteredData.length === 0 ? (
          <BlockListEmpty
            icon={config.emptyIcon}
            title={config.emptyTitle}
            description={config.emptyDescription}
            action={config.emptyAction}
          />
        ) : (
          <>
            {viewMode === "list" && (
              <DataTable
                columns={config.columns}
                data={filteredData}
                enableRowSelection={
                  settings.enableBulkActions &&
                  (config.enableRowSelection ?? false)
                }
                onRowClick={config.onRowClick}
                toolbar={bulkToolbar}
              />
            )}
            {viewMode !== "list" &&
              config.additionalViews
                ?.find((v) => v.type === viewMode)
                ?.render(filteredData)}
          </>
        )}
      </div>

      {/* Modals slot */}
      {config.modals}

      {/* Per-block settings dialog */}
      <BlockPageSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        blockName={config.blockName}
        blockTitle={config.title}
        supportedViews={allSupportedTypes}
        globalSettings={globalSettings}
        currentOverrides={blockOverrides}
        onSave={(overrides) => setBlockOverrides(overrides)}
      />

      {/* Agent panel */}
      {config.showAgent !== false && (
        <BlockAgentPanel
          blockName={config.blockName}
          blockDisplayName={config.title}
        />
      )}
    </div>
  );
}
