"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, DollarSign, Clock, ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, toNumber } from "@/lib/utils";

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
}

const TYPE_BADGES: Record<string, { className: string; icon: React.ElementType }> = {
  EARNED: { className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400", icon: ArrowUpRight },
  HELD: { className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400", icon: Clock },
  RELEASED: { className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", icon: DollarSign },
  CLAWED_BACK: { className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", icon: ArrowDownRight },
  ADJUSTED: { className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: BookOpen },
};

const ROLE_LABELS: Record<string, string> = { REGIONAL_LEADER: "RL", TEAM_LEAD: "TL", REP: "Rep" };

export function LedgerTab({ initialSummary, partners }: LedgerTabProps) {
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
        Every commission event is recorded here: earned, held, released, clawed back, and adjusted.
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Earned</p>
                <p className="font-bold text-sm">{formatCurrency(summary.earned.total)}</p>
                <p className="text-[10px] text-muted-foreground">{summary.earned.count} entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Held</p>
                <p className="font-bold text-sm">{formatCurrency(summary.held.total)}</p>
                <p className="text-[10px] text-muted-foreground">{summary.held.count} entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Released</p>
                <p className="font-bold text-sm">{formatCurrency(summary.released.total)}</p>
                <p className="text-[10px] text-muted-foreground">{summary.released.count} entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Clawed Back</p>
                <p className="font-bold text-sm">{formatCurrency(Math.abs(summary.clawedBack.total))}</p>
                <p className="text-[10px] text-muted-foreground">{summary.clawedBack.count} entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-end">
        <div>
          <Label className="text-xs">Partner</Label>
          <Select value={filters.partnerId} onValueChange={val => { setFilters({ ...filters, partnerId: !val || val === "all" ? "" : val }); setPage(1); }}>
            <SelectTrigger className="w-48 mt-1"><SelectValue placeholder="All partners" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All partners</SelectItem>
              {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Type</Label>
          <Select value={filters.entryType} onValueChange={val => { setFilters({ ...filters, entryType: !val || val === "all" ? "" : val }); setPage(1); }}>
            <SelectTrigger className="w-40 mt-1"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="EARNED">Earned</SelectItem>
              <SelectItem value="HELD">Held</SelectItem>
              <SelectItem value="RELEASED">Released</SelectItem>
              <SelectItem value="CLAWED_BACK">Clawed Back</SelectItem>
              <SelectItem value="ADJUSTED">Adjusted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Source</Label>
          <Select value={filters.source} onValueChange={val => { setFilters({ ...filters, source: !val || val === "all" ? "" : val }); setPage(1); }}>
            <SelectTrigger className="w-48 mt-1"><SelectValue placeholder="All sources" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="UPFRONT_BONUS">Upfront Bonus</SelectItem>
              <SelectItem value="RESIDUAL">Residual</SelectItem>
              <SelectItem value="OVERRIDE">Override</SelectItem>
              <SelectItem value="ACCELERATOR_BONUS">Accelerator</SelectItem>
              <SelectItem value="CLAWBACK">Clawback</SelectItem>
              <SelectItem value="MANUAL_ADJUSTMENT">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left py-2 px-3 font-medium">Date</th>
              <th className="text-left py-2 px-3 font-medium">Person</th>
              <th className="text-left py-2 px-3 font-medium">Partner</th>
              <th className="text-left py-2 px-3 font-medium">Type</th>
              <th className="text-left py-2 px-3 font-medium">Source</th>
              <th className="text-right py-2 px-3 font-medium">Amount</th>
              <th className="text-left py-2 px-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">Loading...</td></tr>
            )}
            {!loading && entries.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">No ledger entries found.</td></tr>
            )}
            {!loading && entries.map(entry => {
              const typeBadge = TYPE_BADGES[entry.entryType] || TYPE_BADGES.ADJUSTED;
              const Icon = typeBadge.icon;
              return (
                <tr key={entry.id} className="hover:bg-muted/30">
                  <td className="py-2 px-3 text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 px-3">
                    <span className="text-xs font-medium">{entry.orgNode.name}</span>
                    <Badge variant="outline" className="ml-1.5 text-[9px] px-1 py-0">{ROLE_LABELS[entry.orgNode.roleType]}</Badge>
                  </td>
                  <td className="py-2 px-3 text-xs">{entry.agreement?.partner.name || "—"}</td>
                  <td className="py-2 px-3">
                    <Badge className={`text-[10px] px-1.5 py-0 ${typeBadge.className}`}>
                      <Icon className="h-2.5 w-2.5 mr-0.5" />{entry.entryType.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-xs text-muted-foreground">{entry.source.replace(/_/g, " ")}</td>
                  <td className={`py-2 px-3 text-right font-semibold text-xs ${Number(entry.amount) < 0 ? "text-red-600" : "text-green-600"}`}>
                    {formatCurrency(toNumber(entry.amount))}
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
          <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
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
