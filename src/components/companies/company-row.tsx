"use client";

import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SIZE_CONFIG, companyInitials, type CompanyRow as CompanyRowType } from "./types";

export function CompanyRow({ company }: { company: CompanyRowType }) {
  return (
    <TableRow>
      <TableCell className="w-12">
        {company.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.logoUrl}
            alt=""
            className="h-8 w-8 rounded object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
            {companyInitials(company.name)}
          </div>
        )}
      </TableCell>
      <TableCell>
        <Link
          href={`/admin/blocks/companies/${company.id}`}
          className="font-medium hover:underline"
        >
          {company.name}
        </Link>
        {company.legalName && (
          <div className="text-xs text-muted-foreground">{company.legalName}</div>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {company.industry ?? "—"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {company.size ? SIZE_CONFIG[company.size] : "—"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {company.domain ?? "—"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {company.contactCount ?? 0}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {company.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px]">
              {t}
            </Badge>
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}
