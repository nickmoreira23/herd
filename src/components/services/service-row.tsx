"use client";

import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import {
  formatPrice,
  STATUS_CONFIG,
  type ServiceRow as ServiceRowType,
} from "./types";

export function ServiceRow({ service }: { service: ServiceRowType }) {
  const statusCfg = STATUS_CONFIG[service.status];
  return (
    <TableRow>
      <TableCell className="w-12">
        {service.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.imageUrl}
            alt=""
            className="h-8 w-8 rounded object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
      </TableCell>
      <TableCell>
        <Link
          href={`/admin/blocks/services/${service.id}`}
          className="font-medium hover:underline"
        >
          {service.name}
        </Link>
        <div className="text-xs text-muted-foreground truncate max-w-md">
          {service.description}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {service.category ?? "—"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {service.duration ?? "—"}
      </TableCell>
      <TableCell className="font-medium">
        {formatPrice(service.price, service.pricingType)}
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={statusCfg.className}>
          {statusCfg.label}
        </Badge>
      </TableCell>
    </TableRow>
  );
}
