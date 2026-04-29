"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users } from "lucide-react";
import { SIZE_CONFIG, companyInitials, type CompanyRow } from "./types";

export function CompanyCard({ company }: { company: CompanyRow }) {
  return (
    <Link href={`/admin/blocks/companies/${company.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="py-4 space-y-2">
          <div className="flex items-start gap-3">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logoUrl}
                alt=""
                className="h-10 w-10 rounded object-cover shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0 text-xs font-semibold text-muted-foreground">
                {companyInitials(company.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold truncate">{company.name}</h3>
              {company.industry && (
                <p className="text-xs text-muted-foreground truncate">
                  {company.industry}
                  {company.size ? ` · ${SIZE_CONFIG[company.size]}` : ""}
                </p>
              )}
            </div>
          </div>

          {company.domain && (
            <p className="text-xs text-muted-foreground truncate">
              🌐 {company.domain}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            {company.contactCount !== undefined && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {company.contactCount}{" "}
                {company.contactCount === 1 ? "contato" : "contatos"}
              </span>
            )}
            {!company.contactCount && !company.domain && (
              <Building2 className="h-3 w-3 text-muted-foreground" />
            )}
            {company.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {company.tags.slice(0, 2).map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
