"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { displayName, initials, type ContactRow } from "./types";

export function ContactCard({ contact }: { contact: ContactRow }) {
  return (
    <Link href={`/admin/blocks/contacts/${contact.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="py-4 space-y-2">
          <div className="flex items-start gap-3">
            {contact.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={contact.avatarUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-semibold text-muted-foreground">
                {initials(contact)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold truncate">
                {displayName(contact)}
              </h3>
              {contact.jobTitle && (
                <p className="text-xs text-muted-foreground truncate">
                  {contact.jobTitle}
                  {contact.department ? ` · ${contact.department}` : ""}
                </p>
              )}
            </div>
          </div>

          {contact.email && (
            <p className="text-xs text-muted-foreground truncate">
              ✉️ {contact.email}
            </p>
          )}
          {contact.phone && (
            <p className="text-xs text-muted-foreground">📞 {contact.phone}</p>
          )}

          {contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {contact.tags.slice(0, 4).map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px]">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
