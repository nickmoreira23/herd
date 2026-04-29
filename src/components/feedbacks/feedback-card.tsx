"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";
import {
  FEEDBACK_TYPE_CONFIG,
  FEEDBACK_PRIORITY_CONFIG,
  FEEDBACK_STATUS_CONFIG,
  type FeedbackRow,
} from "./types";

interface FeedbackCardProps {
  feedback: FeedbackRow;
  onUpvote: (id: string) => void;
}

export function FeedbackCard({ feedback, onUpvote }: FeedbackCardProps) {
  const typeCfg = FEEDBACK_TYPE_CONFIG[feedback.type];
  const priorityCfg = FEEDBACK_PRIORITY_CONFIG[feedback.priority];
  const statusCfg = FEEDBACK_STATUS_CONFIG[feedback.status];
  const preview = feedback.contentText.trim().slice(0, 100);

  return (
    <Card className={`border-l-4 ${statusCfg.borderColor}`}>
      <CardContent className="py-3 px-3 space-y-2">
        <div className="flex items-start gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-auto flex-col gap-0 px-2 py-1 shrink-0"
            onClick={(e) => {
              e.preventDefault();
              onUpvote(feedback.id);
            }}
          >
            <ChevronUp className="h-3 w-3" />
            <span className="text-xs font-semibold">{feedback.voteCount}</span>
          </Button>
          <Link
            href={`/admin/blocks/feedbacks/${feedback.id}`}
            className="min-w-0 flex-1 hover:underline"
          >
            <h3 className="text-sm font-semibold truncate">{feedback.title}</h3>
          </Link>
          <span
            className={`h-2 w-2 rounded-full shrink-0 mt-1.5 ${priorityCfg.dot}`}
            title={priorityCfg.label}
          />
        </div>
        {preview && (
          <p className="text-xs text-muted-foreground line-clamp-2">{preview}</p>
        )}
        <div className="flex items-center justify-between gap-2 text-xs">
          <Badge variant="outline" className="text-[10px]">
            {typeCfg.emoji} {typeCfg.label}
          </Badge>
          {feedback.submitterName && (
            <span className="text-muted-foreground truncate">
              {feedback.submitterName}
            </span>
          )}
        </div>
        {feedback.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {feedback.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
