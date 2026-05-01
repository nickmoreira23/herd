"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, DollarSign, Clock, ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { toNumber } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import { formatNumberAsMoney } from "@/lib/money/format";
import { formatDate } from "@/lib/i18n/format-date";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

interface LedgerEntry {
  id: string;
  entryType: string;
  source: string;
  amount: number;
  description: string | null;
  createdAt: string;
  orgNode: { id: string; name: string; roleType: string; d2dPartnerId: string };
  agreement: { id: string; name: string; partner: { name: string } } | null;
}

interface LedgerSummary {
  totalEntries: number;
  earned: { count: number; total: number };
  held: { count: number; total: number };
  released: { count: number; total: number };
  clawedBack: { count: number; total: number };
}

interface PartnerOption { id: string; name: string }

interface LedgerTabProps {
  initialSummary: LedgerSummary;
  partners: PartnerOption[];
  /**
   * Display locale for formatting. Optional for legacy RSC callers
   * (admin/operation/finances/payments, admin/tools/finances/payments)
   * which haven't been migrated yet (Phase ε). Defaults to DEFAULT_LOCALE.
   */
  locale?: Locale;
}

const TYPE_BADGES: Record<string, { className: string; icon: React.ElementType }> = {
  EARNED: { className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400", icon: ArrowUpRight },
  HELD: { className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400", icon: Clock },
  RELEASED: { className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", icon: DollarSign },
  CLAWED_BACK: { className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", icon: ArrowDownRight },
  ADJUSTED: { className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: BookOpen },
};

const ENTRY_TYPE_KEYS: Record<string, MessageKey> = {
  EARNED: "network.promoters.ledger.entry_type.earned",
  HELD: "network.promoters.ledger.entry_type.held",
  RELEASED: "network.promoters.ledger.entry_type.released",
  CLAWED_BACK: "network.promoters.ledger.entry_type.clawed_back",
  ADJUSTED: "network.promoters.ledger.entry_type.adjusted",
};

const ROLE_LABEL_KEYS: Record<string, MessageKey> = {
  REGIONAL_LEADER: "network.promoters.ledger.role.rl",
  TEAM_LEAD: "network.promoters.ledger.role.tl",
  REP: "network.promoters.ledger.role.rep",
};

const SOURCE_KEYS: Record<string, MessageKey> = {
  UPFRONT_BONUS: "network.promoters.ledger.source.upfront_bonus",
  RESIDUAL: "network.promoters.ledger.source.residual",
  OVERRIDE: "network.promoters.ledger.source.override",
  ACCELERATOR_BONUS: "network.promoters.ledger.source.accelerator_bonus",
  CLAWBACK: "network.promoters.ledger.source.clawback",
  MANUAL_ADJUSTMENT: "network.promoters.ledger.source.manual_adjustment",
};

export function LedgerTab({ initialSummary, partners, locale = DEFAULT_LOCALE }: LedgerTabProps) {
  const t = useT();
  const [summary] = useState(initialSummary);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ partnerId: "", entryType: "", source: "" });
  const [loading, setLoading] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (filters.partnerId) params.set("partnerId", filters.partnerId);
      if (filters.entryType) params.set("entryType", filters.entryType);
      if (filters.source) params.set("source", filters.source);

      const res = await fetch(`/api/commission-ledger?${params}`);
      const json = await res.json();
      if (json.data) {
        setEntries(json.data.entries);
        setTotalPages(json.data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground max-w-lg">
        {t("network.promoters.ledger.description")}
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("network.promoters.ledger.summary.earned")}</p>
                <p className="font-bold text-sm">{formatNumberAsMoney(summary.earned.total, locale)}</p>
                <p className="text-[10px] text-muted-foreground">{t("network.promoters.ledger.entries_count", { count: summary.earned.count })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("network.promoters.ledger.summary.held")}</p>
                <p className="font-bold text-sm">{formatNumberAsMoney(summary.held.total, locale)}</p>
                <p className="text-[10px] text-muted-foreground">{t("network.promoters.ledger.entries_count", { count: summary.held.count })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("network.promoters.ledger.summary.released")}</p>
                <p className="font-bold text-sm">{formatNumberAsMoney(summary.released.total, locale)}</p>
                <p className="text-[10px] text-muted-foreground">{t("network.promoters.ledger.entries_count", { count: summary.released.count })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("network.promoters.ledger.summary.clawed_back")}</p>
                <p className="font-bold text-sm">{formatNumberAsMoney(Math.abs(summary.clawedBack.total), locale)}</p>
                <p className="text-[10px] text-muted-foreground">{t("network.promoters.ledger.entries_count", { count: summary.clawedBack.count })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-end">
        <div>
          <Label className="text-xs">{t("network.promoters.ledger.filter.partner")}</Label>
          <Select value={filters.partnerId} onValueChange={val => { setFilters({ ...filters, partnerId: !val || val === "all" ? "" : val }); setPage(1); }}>
            <SelectTrigger className="w-48 mt-1"><SelectValue placeholder={t("network.promoters.ledger.filter.all_partners")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("network.promoters.ledger.filter.all_partners")}</SelectItem>
              {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">{t("network.promoters.ledger.filter.type")}</Label>
          <Select value={filters.entryType} onValueChange={val => { setFilters({ ...filters, entryType: !val || val === "all" ? "" : val }); setPage(1); }}>
            <SelectTrigger className="w-40 mt-1"><SelectValue placeholder={t("network.promoters.ledger.filter.all_types")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("network.promoters.ledger.filter.all_types")}</SelectItem>
              <SelectItem value="EARNED">{t("network.promoters.ledger.entry_type.earned")}</SelectItem>
              <SelectItem value="HELD">{t("network.promoters.ledger.entry_type.held")}</SelectItem>
              <SelectItem value="RELEASED">{t("network.promoters.ledger.entry_type.released")}</SelectItem>
              <SelectItem value="CLAWED_BACK">{t("network.promoters.ledger.entry_type.clawed_back")}</SelectItem>
              <SelectItem value="ADJUSTED">{t("network.promoters.ledger.entry_type.adjusted")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">{t("network.promoters.ledger.filter.source")}</Label>
          <Select value={filters.source} onValueChange={val => { setFilters({ ...filters, source: !val || val === "all" ? "" : val }); setPage(1); }}>
            <SelectTrigger className="w-48 mt-1"><SelectValue placeholder={t("network.promoters.ledger.filter.all_sources")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("network.promoters.ledger.filter.all_sources")}</SelectItem>
              <SelectItem value="UPFRONT_BONUS">{t("network.promoters.ledger.source.upfront_bonus")}</SelectItem>
              <SelectItem value="RESIDUAL">{t("network.promoters.ledger.source.residual")}</SelectItem>
              <SelectItem value="OVERRIDE">{t("network.promoters.ledger.source.override")}</SelectItem>
              <SelectItem value="ACCELERATOR_BONUS">{t("network.promoters.ledger.source.accelerator_bonus")}</SelectItem>
              <SelectItem value="CLAWBACK">{t("network.promoters.ledger.source.clawback")}</SelectItem>
              <SelectItem value="MANUAL_ADJUSTMENT">{t("network.promoters.ledger.source.manual_adjustment")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left py-2 px-3 font-medium">{t("network.promoters.ledger.column.date")}</th>
              <th className="text-left py-2 px-3 font-medium">{t("network.promoters.ledger.column.person")}</th>
              <th className="text-left py-2 px-3 font-medium">{t("network.promoters.ledger.column.partner")}</th>
              <th className="text-left py-2 px-3 font-medium">{t("network.promoters.ledger.column.type")}</th>
              <th className="text-left py-2 px-3 font-medium">{t("network.promoters.ledger.column.source")}</th>
              <th className="text-right py-2 px-3 font-medium">{t("network.promoters.ledger.column.amount")}</th>
              <th className="text-left py-2 px-3 font-medium">{t("network.promoters.ledger.column.description")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">{t("common.states.loading")}</td></tr>
            )}
            {!loading && entries.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">{t("network.promoters.ledger.empty")}</td></tr>
            )}
            {!loading && entries.map(entry => {
              const typeBadge = TYPE_BADGES[entry.entryType] || TYPE_BADGES.ADJUSTED;
              const Icon = typeBadge.icon;
              return (
                <tr key={entry.id} className="hover:bg-muted/30">
                  <td className="py-2 px-3 text-xs text-muted-foreground">{formatDate(new Date(entry.createdAt), locale, "short")}</td>
                  <td className="py-2 px-3">
                    <span className="text-xs font-medium">{entry.orgNode.name}</span>
                    <Badge variant="outline" className="ml-1.5 text-[9px] px-1 py-0">
                      {ROLE_LABEL_KEYS[entry.orgNode.roleType] ? t(ROLE_LABEL_KEYS[entry.orgNode.roleType]) : entry.orgNode.roleType}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-xs">{entry.agreement?.partner.name || "—"}</td>
                  <td className="py-2 px-3">
                    <Badge className={`text-[10px] px-1.5 py-0 ${typeBadge.className}`}>
                      <Icon className="h-2.5 w-2.5 mr-0.5" />
                      {ENTRY_TYPE_KEYS[entry.entryType] ? t(ENTRY_TYPE_KEYS[entry.entryType]) : entry.entryType.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-xs text-muted-foreground">
                    {SOURCE_KEYS[entry.source] ? t(SOURCE_KEYS[entry.source]) : entry.source.replace(/_/g, " ")}
                  </td>
                  <td className={`py-2 px-3 text-right font-semibold text-xs ${Number(entry.amount) < 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatNumberAsMoney(toNumber(entry.amount), locale)}
                  </td>
                  <td className="py-2 px-3 text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{entry.description || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{t("network.promoters.ledger.page_of", { page, total: totalPages })}</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
