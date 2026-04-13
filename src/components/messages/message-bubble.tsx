"use client";

import type { MessageRow } from "./types";
import { format } from "date-fns";

interface MessageBubbleProps {
  message: MessageRow;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === "OUTBOUND";

  return (
    <div
      className={`flex ${isOutbound ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2.5 ${
          isOutbound
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        {message.senderName && (
          <p
            className={`text-[11px] font-medium mb-1 ${
              isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"
            }`}
          >
            {message.senderName}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <p
          className={`text-[10px] mt-1 ${
            isOutbound ? "text-primary-foreground/50" : "text-muted-foreground/70"
          }`}
        >
          {format(new Date(message.sentAt), "MMM d, h:mm a")}
        </p>
      </div>
    </div>
  );
}
