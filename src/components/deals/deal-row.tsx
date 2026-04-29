"use client";

import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  STAGE_CONFIG,
  contactDisplayName,
  formatAmount,
  type DealRow as DealRowType,
} from "./types";

export function DealRow({ deal }: { deal: DealRowType }) {
  const stage = STAGE_CONFIG[deal.stage];
  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/admin/blocks/deals/${deal.id}`}
          className="font-medium hover:underline"
        >
          {deal.title}
        </Link>
      </TableCell>
      <TableCell>
        <span
          className={`text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 ${stage.color}`}
        >
          {stage.label}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatAmount(deal.amount, deal.currency)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {deal.probability != null ? `${deal.probability}%` : "—"}
      </TableCell>
      <TableCell className="text-muted-foreground truncate max-w-[180px]">
        {deal.company?.name ?? "—"}
      </TableCell>
      <TableCell className="text-muted-foreground truncate max-w-[180px]">
        {contactDisplayName(deal.contact) ?? "—"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {deal.expectedCloseDate
          ? new Date(deal.expectedCloseDate).toLocaleDateString("pt-BR")
          : "—"}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {deal.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px]">
              {t}
            </Badge>
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}
