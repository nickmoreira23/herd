"use client";

import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { displayName, initials, type ContactRow as ContactRowType } from "./types";

export function ContactRow({ contact }: { contact: ContactRowType }) {
  return (
    <TableRow>
      <TableCell className="w-12">
        {contact.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={contact.avatarUrl}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
            {initials(contact)}
          </div>
        )}
      </TableCell>
      <TableCell>
        <Link
          href={`/admin/blocks/contacts/${contact.id}`}
          className="font-medium hover:underline"
        >
          {displayName(contact)}
        </Link>
        {contact.jobTitle && (
          <div className="text-xs text-muted-foreground">
            {contact.jobTitle}
            {contact.department ? ` · ${contact.department}` : ""}
          </div>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {contact.email ?? "—"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {contact.phone ?? "—"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {contact.source ?? "—"}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {contact.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px]">
              {t}
            </Badge>
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}
