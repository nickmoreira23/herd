"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import {
  formatPrice,
  STATUS_CONFIG,
  type ServiceRow,
} from "./types";

export function ServiceCard({ service }: { service: ServiceRow }) {
  const statusCfg = STATUS_CONFIG[service.status];

  return (
    <Link href={`/admin/blocks/services/${service.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="py-4 space-y-2">
          <div className="flex items-start gap-3">
            {service.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={service.imageUrl}
                alt=""
                className="h-10 w-10 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold truncate">{service.name}</h3>
              {service.category && (
                <p className="text-xs text-muted-foreground truncate">
                  {service.category}
                </p>
              )}
            </div>
          </div>

          {service.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {service.description}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-sm font-medium">
              {formatPrice(service.price, service.pricingType)}
            </span>
            <Badge variant="secondary" className={statusCfg.className}>
              {statusCfg.label}
            </Badge>
          </div>

          {service.duration && (
            <p className="text-xs text-muted-foreground">⏱ {service.duration}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
