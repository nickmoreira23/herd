"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Store, Warehouse, Pencil, Trash2 } from "lucide-react";
import { formatAddress, type LocationRow } from "./types";

function getTypeIcon(type: string) {
  switch (type) {
    case "headquarters":
      return Building2;
    case "store":
      return Store;
    case "warehouse":
      return Warehouse;
    default:
      return MapPin;
  }
}

interface LocationCardProps {
  location: LocationRow;
  onEdit: () => void;
  onDelete: () => void;
}

export function LocationCard({ location, onEdit, onDelete }: LocationCardProps) {
  const Icon = getTypeIcon(location.type);
  const address = formatAddress(location);

  return (
    <Card className={location.isActive ? "" : "opacity-60"}>
      <CardContent className="py-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/admin/blocks/locations/${location.id}`}
                className="text-sm font-semibold truncate hover:underline block"
              >
                {location.name}
              </Link>
              <p className="text-xs text-muted-foreground capitalize">
                {location.type}
              </p>
            </div>
          </div>
          {location.isHeadquarters && (
            <Badge variant="secondary" className="shrink-0">
              Sede
            </Badge>
          )}
        </div>

        {address && (
          <p className="text-xs text-muted-foreground line-clamp-2">{address}</p>
        )}
        {location.phone && (
          <p className="text-xs text-muted-foreground">📞 {location.phone}</p>
        )}
        {location.email && (
          <p className="text-xs text-muted-foreground truncate">
            ✉️ {location.email}
          </p>
        )}

        <div className="flex items-center gap-1 pt-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
