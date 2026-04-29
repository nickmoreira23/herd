"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/locale-context";
import {
  STATUS_COLOR,
  formatPrice,
  type ExperienceRow,
} from "./types";

export function ExperienceCard({ experience }: { experience: ExperienceRow }) {
  const t = useT();
  return (
    <Link href={`/admin/blocks/experiences/${experience.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md overflow-hidden">
        {experience.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={experience.coverImageUrl}
            alt=""
            className="h-24 w-full object-cover"
          />
        )}
        <CardContent className="py-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold truncate flex-1">
              {experience.name}
            </h3>
            <span
              className={`shrink-0 text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 ${STATUS_COLOR[experience.status]}`}
            >
              {t(`experiences.status.${experience.status}`)}
            </span>
          </div>

          {experience.headline && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {experience.headline}
            </p>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <div>{t(`experiences.format.${experience.format}`)}</div>
            {experience.startDate && (
              <div>
                📅 {new Date(experience.startDate).toLocaleDateString()}
                {experience.endDate
                  ? ` → ${new Date(experience.endDate).toLocaleDateString()}`
                  : ""}
              </div>
            )}
            {experience.locationName && (
              <div className="truncate">📍 {experience.locationName}</div>
            )}
            {experience.capacity && (
              <div>👥 {experience.capacity}</div>
            )}
            {experience.price && (
              <div className="font-medium text-foreground">
                {formatPrice(experience.price, experience.currency)}
              </div>
            )}
          </div>

          {experience.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {experience.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
